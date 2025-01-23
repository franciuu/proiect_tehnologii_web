import { Router } from "express";
import Note from "../models/noteModel.js";
import Tag from "../models/tagModel.js";
import { Op } from "sequelize";
import { isAuthenticated } from "../middleware/authMiddleware.js";
import SharedNotes from "../models/sharedNotesModel.js";
import User from "../models/userModel.js";
import sequelize from "../config/database.js";
import File from "../models/fileModel.js";
import upload from '../middleware/upload.js';
import path from 'path';
import fs from 'fs';

const router = Router();

// rute statice
// Obține toate tag-urile disponibile pentru utilizator
router.get("/tags", isAuthenticated, async (req, res) => {
  try {
    const tags = await Tag.findAll({
      include: [
        {
          model: Note,
          where: { userId: req.user.id },
          attributes: [],
        },
      ],
      distinct: true,
    });
    res.json(tags);
  } catch (error) {
    console.error("Error fetching tags:", error);
    res.status(500).json({ error: "Error fetching tags" });
  }
});

// Obține notițele partajate cu utilizatorul curent
router.get("/shared", isAuthenticated, async (req, res) => {
  try {
    console.log("Fetching shared notes for user:", req.user.id);
    
    const sharedNotes = await Note.findAll({
      include: [
        {
          model: User,
          as: "SharedWith",
          where: { id: req.user.id },
          through: { attributes: [] },
          attributes: []
        },
        {
          model: Tag,
          through: { attributes: [] },
          attributes: ["id", "name"]
        }
      ],
      attributes: [
        "id", 
        "title", 
        "content", 
        "subject", 
        "createdAt", 
        "updatedAt"
      ]
    });

    console.log("Found shared notes:", sharedNotes.length);
    res.json(sharedNotes);
  } catch (error) {
    console.error("Error fetching shared notes:", error);
    res.status(500).json({ error: "Error fetching shared notes" });
  }
});


router.get("/users", isAuthenticated, async (req, res) => {
  try {
    const users = await User.findAll({
      where: {
        id: { [Op.ne]: req.user.id },
      },
      attributes: ["id", "username", "email"],
    });

    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Error fetching users" });
  }
});

router.post("/notes", isAuthenticated, async (req, res) => {
  try {
    const { title, content, subject, tags, sourceType, sourceUrl, source } = req.body;
    
    // Log received data
    console.log("Received note data:", {
      title,
      content,
      subject,
      tags,
      sourceType,
      sourceUrl,
      source
    });

    // Create note with explicit source handling
    const note = await Note.create({
      title,
      content,
      subject,
      tags,
      sourceType: sourceType || "none",
      sourceUrl: sourceType !== "none" ? sourceUrl : null,
      source: sourceType !== "none" ? source : null,
      userId: req.user.id,
    });

    console.log("Created note:", note.toJSON());
    res.status(201).json(note);
  } catch (error) {
    console.error("Error creating note:", error);
    res.status(500).json({ 
      error: "Failed to create note",
      details: error.message 
    });
  }
});

// rute dinamice

// Obține notițele filtrate după tag
router.get("/bytag/:tagName", isAuthenticated, async (req, res) => {
  try {
    const notes = await Note.findAll({
      where: { userId: req.user.id },
      include: [{
        model: Tag,
        where: { name: req.params.tagName }
      }]
    });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: "Error fetching notes by tag" });
  }
});

// Obține o notiță specifică cu tag-urile ei
router.get("/:id", isAuthenticated, async (req, res) => {
  try {
    const note = await Note.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [
        Tag,
        {
          model: File,
          attributes: ['id', 'originalName', 'mimetype']
        }
      ]
    });

    if (!note) {
      return res.status(404).json({ error: "Note not found or access denied" });
    }

    console.log("Sending note with files:", note); // Debug log
    res.json(note);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Error fetching note" });
  }
});

// Partajează o notiță cu un coleg
router.post("/:id/share", isAuthenticated, async (req, res) => {
  try {
    const noteId = req.params.id;
    const { userIds } = req.body;

    console.log("Share request received:", {
      noteId,
      userIds,
      currentUser: req.user.id,
      body: req.body
    });

    if (!Array.isArray(userIds) || userIds.length === 0) {
      console.log("Invalid userIds:", userIds);
      return res.status(400).json({ error: "User IDs are required" });
    }

    // First, verify the note exists
    const note = await Note.findByPk(noteId);
    if (!note) {
      console.log("Note not found:", noteId);
      return res.status(404).json({ error: "Note not found" });
    }

    // Log the existing shares
    const existingShares = await SharedNotes.findAll({
      where: { noteId }
    });
    console.log("Existing shares:", existingShares);

    // Delete existing shares one by one to catch any errors
    for (const userId of userIds) {
      try {
        await SharedNotes.destroy({
          where: {
            noteId,
            userId
          }
        });
      } catch (deleteError) {
        console.error("Error deleting existing share:", deleteError);
      }
    }

    // Create new shares one by one to catch any errors
    const createdShares = [];
    for (const userId of userIds) {
      try {
        const share = await SharedNotes.create({
          noteId: parseInt(noteId),
          userId: parseInt(userId)
        });
        createdShares.push(share);
      } catch (createError) {
        console.error("Error creating share for userId:", userId, createError);
      }
    }

    console.log("Created shares:", createdShares);

    if (createdShares.length === 0) {
      throw new Error("Failed to create any shares");
    }

    res.status(200).json({ 
      message: "Note shared successfully",
      shares: createdShares
    });

  } catch (error) {
    console.error("Full error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });

    res.status(500).json({ 
      error: "Error sharing note",
      details: error.message,
      name: error.name,
      code: error.code
    });
  }
});

// Șterge o notiță
router.delete("/:id", isAuthenticated, async (req, res) => {
  try {
    const noteId = req.params.id;
    console.log("Trying to delete note with id:", noteId); // Pentru debugging

    const note = await Note.findOne({
      where: { 
        id: noteId,
        userId: req.user.id 
      }
    });

    if (!note) {
      return res.status(404).json({ error: "Note not found or access denied" });
    }

    await note.destroy();
    res.status(200).json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Error deleting note" });
  }
});

// CRUD general

router.get("/", isAuthenticated, async (req, res) => {
  try {
    const { subject, createdAt, tagName } = req.query;

    // Debugging: Afișează parametrii primiți de la frontend
    console.log("Received query parameters:", { subject, createdAt, tagName });

    // Construim condițiile de filtrare pentru notițe
    const whereConditions = { userId: req.user.id };

    // Filtrare după subiect
    if (subject) {
      whereConditions.subject = { [Op.like]: `%${subject}%` };
      console.log("Subject filter applied:", whereConditions.subject);
    }

    // Filtrare după dată
    if (createdAt) {
      const startOfDay = new Date(createdAt);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(createdAt);
      endOfDay.setHours(23, 59, 59, 999);

      whereConditions.createdAt = { [Op.between]: [startOfDay, endOfDay] };
      console.log("Date filter applied:", whereConditions.createdAt);
    }

    // Configurăm filtrul pentru tag-uri
    const include = [];
    if (tagName) {
      include.push({
        model: Tag,
        where: { name: { [Op.like]: `%${tagName}%` } },
      });
      console.log("Tag filter applied:", { name: { [Op.like]: `%${tagName}%` } });
    } else {
      include.push({
        model: Tag,
        required: false, // Tag-urile nu sunt obligatorii dacă nu există `tagName`
      });
    }

    // Debugging: Afișează condițiile construite
    console.log("Where conditions:", whereConditions);
    console.log("Include conditions:", include);

    // Obține notițele cu filtrele aplicate
    const notes = await Note.findAll({
      where: whereConditions,
      include: include,
      attributes: ["id", "title", "content", "createdAt", "subject"],
      order: [["createdAt", "DESC"]],
    });

    // Debugging: Afișează notițele returnate
    console.log("Notes fetched:", notes);

    res.json(notes);
  } catch (error) {
    console.error("Error fetching notes:", error);
    res.status(500).json({ error: "Database error" });
  }
});


// Create note with files
router.post("/", isAuthenticated, upload.array("files"), async (req, res) => {
  const t = await sequelize.transaction();

  try {
    console.log("Body:", req.body);
    console.log("Files:", req.files);

    const noteData = {
      title: req.body.title,
      content: req.body.content,
      subject: req.body.subject,
      tags: JSON.parse(req.body.tags || "[]"),
      sourceType: req.body.sourceType,
      sourceUrl: req.body.sourceUrl,
      source: req.body.source,
      userId: req.user.id,
    };

    const note = await Note.create(noteData, { transaction: t });

    // Save files
    if (req.files && req.files.length > 0) {
      const filePromises = req.files.map((file) =>
        File.create(
          {
            originalName: file.originalname,
            filePath: file.path,
            mimetype: file.mimetype,
            noteId: note.id,
          },
          { transaction: t }
        )
      );

      await Promise.all(filePromises);
    }

    await t.commit();
    
    // Fetch the complete note with files
    const completeNote = await Note.findByPk(note.id, {
      include: [File]
    });

    res.status(201).json(completeNote);
  } catch (error) {
    await t.rollback();
    console.error("Error creating note:", error);
    res.status(500).json({ error: "Failed to create note" });
  }
});


router.patch("/", isAuthenticated, async (req, res) => {
  const { id } = req.body;  // Notă: folosește req.body pentru a trimite id-ul
  const updateData = req.body;  // Datele de actualizare care vin în body

  try {
    // Verificăm dacă utilizatorul este cel care a creat notița
    const note = await NoteModel.findOne({ _id: id, userId: req.user.id });

    if (!note) {
      return res.status(404).send({
        message: "Note not found or access denied",
        status: 0,
      });
    }

    // Actualizarea notiței
    await NoteModel.findByIdAndUpdate({ _id: id }, updateData, { new: true });

    res.send({
      message: "Note updated",
      status: 1,
    });
  } catch (error) {
    res.status(500).send({
      message: error.message,
      status: 0,
    });
  }
});

// Add this route to verify the SharedNotes table structure
router.get("/shared-notes-info", isAuthenticated, async (req, res) => {
  try {
    const tableInfo = await sequelize.query(
      "DESCRIBE SharedNotes",
      { type: sequelize.QueryTypes.DESCRIBE }
    );
    res.json(tableInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update the PUT route to handle file updates
router.put("/:id", upload.array("files"), async (req, res) => {
  try {
    const { title, content, subject, sourceType, sourceUrl, source, filesToDelete } = req.body;

    // Găsește notița existentă
    const note = await Note.findByPk(req.params.id);
    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    // Actualizează câmpurile text
    note.title = title || note.title;
    note.content = content || note.content;
    note.subject = subject || note.subject;
    note.sourceType = sourceType || note.sourceType;
    note.sourceUrl = sourceUrl || note.sourceUrl;
    note.source = source || note.source;

    await note.save();

    // Șterge fișierele specificate în `filesToDelete`
    if (filesToDelete) {
      const filesToDeleteArray = JSON.parse(filesToDelete);
      for (const fileId of filesToDeleteArray) {
        const file = await File.findByPk(fileId);
        if (file) {
          // Șterge fișierul de pe disc
          fs.unlinkSync(path.resolve(file.filePath));
          await file.destroy(); // Șterge înregistrarea din baza de date
        }
      }
    }

    // Adaugă noile fișiere încărcate
    if (req.files && req.files.length > 0) {
      const uploadedFiles = req.files.map((file) => ({
        originalName: file.originalname,
        filePath: path.resolve(file.path),
        mimetype: file.mimetype,
        noteId: note.id,
      }));

      await File.bulkCreate(uploadedFiles);
    }

    // Răspuns cu notița actualizată
    const updatedNote = await Note.findByPk(note.id, { include: [File] });
    res.status(200).json(updatedNote);
  } catch (error) {
    console.error("Error updating note:", error);
    res.status(500).json({ error: "Failed to update note" });
  }
});

// Add route to serve files
router.get("/:noteId/files/:fileId", isAuthenticated, async (req, res) => {
  try {
    const file = await File.findOne({
      where: {
        id: req.params.fileId,
        noteId: req.params.noteId
      }
    });

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    res.sendFile(path.resolve(file.filePath));
  } catch (error) {
    console.error("Error serving file:", error);
    res.status(500).json({ error: "Error serving file" });
  }
});

export default router;
