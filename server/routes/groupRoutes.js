import { Router } from "express";
import Group from "../models/groupModel.js";
import User from "../models/userModel.js";
import GroupUsers from "../models/groupUsersModel.js";
import Note from "../models/noteModel.js";
import { isAuthenticated } from "../middleware/authMiddleware.js";

const router = Router();

// Get all groups
router.get("/", isAuthenticated, async (req, res) => {
  try {
    console.log("Fetching groups for user:", req.user.id); // Debug log

    const groups = await Group.findAll({
      include: [{
        model: User,
        as: "GroupMembers",
        attributes: ["id", "username", "email"],
        through: { attributes: [] }
      }]
    });

    console.log("Found groups:", groups.length); // Debug log
    res.json(groups);
  } catch (error) {
    console.error("Error fetching groups:", error);
    res.status(500).json({ error: "Error fetching groups" });
  }
});

// Create a new group
router.post("/", isAuthenticated, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    // Create the group
    const group = await Group.create({
      name,
      description
    });

    // Add the creator as a member with admin role
    await GroupUsers.create({
      userId: req.user.id,
      groupId: group.id,
      role: 'admin'
    });

    res.status(201).json(group);
  } catch (error) {
    console.error("Error creating group:", error);
    res.status(500).json({ error: "Error creating group" });
  }
});

// Add members to a group
router.post("/:id/members", isAuthenticated, async (req, res) => {
  try {
    const groupId = req.params.id;
    const { userIds } = req.body;
    console.log("Attempting to add users:", { groupId, userIds, body: req.body }); // Debug log

    // Verify we have the required data
    if (!userIds || !Array.isArray(userIds)) {
      console.log("Invalid userIds:", userIds);
      return res.status(400).json({ error: "Invalid userIds provided" });
    }

    // Verify the group exists
    const group = await Group.findByPk(groupId);
    if (!group) {
      console.log("Group not found:", groupId);
      return res.status(404).json({ error: "Group not found" });
    }

    console.log("Found group:", group.toJSON()); // Debug log

    // Add each user to the group
    for (const userId of userIds) {
      try {
        console.log(`Attempting to add user ${userId} to group ${groupId}`); // Debug log
        await GroupUsers.create({
          groupId: parseInt(groupId),
          userId: parseInt(userId),
          role: 'member'
        });
        console.log(`Successfully added user ${userId}`); // Debug log
      } catch (error) {
        console.error(`Error adding user ${userId}:`, error); // Debug log
        // If the user is already a member, continue to the next user
        if (error.name === 'SequelizeUniqueConstraintError') {
          console.log(`User ${userId} is already a member of group ${groupId}`);
          continue;
        }
        throw error;
      }
    }

    // Get updated members list
    const updatedMembers = await User.findAll({
      include: [{
        model: Group,
        as: "UserGroups",
        where: { id: groupId },
        through: { attributes: ["role"] }
      }]
    });

    console.log("Successfully added all members"); // Debug log
    res.json(updatedMembers);
  } catch (error) {
    console.error("Detailed error in adding members:", {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      error: "Error adding members to group",
      details: error.message,
      name: error.name
    });
  }
});

// Add a note to a group
router.post("/:id/notes", isAuthenticated, async (req, res) => {
  try {
    const groupId = req.params.id;
    const { noteId } = req.body;
    console.log("Adding note to group:", { groupId, noteId }); // Debug log

    // Verify the group exists
    const group = await Group.findByPk(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Verify the note exists and belongs to the current user
    const note = await Note.findOne({
      where: {
        id: noteId,
        userId: req.user.id
      }
    });

    if (!note) {
      return res.status(404).json({ error: "Note not found or access denied" });
    }

    // Update the note to belong to this group
    await note.update({ groupId: groupId });

    // Get updated notes list
    const updatedNotes = await Note.findAll({
      where: { groupId: groupId }
    });

    res.json(updatedNotes);
  } catch (error) {
    console.error("Error adding note to group:", error);
    res.status(500).json({ 
      error: "Error adding note to group",
      details: error.message 
    });
  }
});

// Get specific group details
router.get("/:id", isAuthenticated, async (req, res) => {
  try {
    const groupId = req.params.id;
    console.log("Fetching details for group:", groupId); // Debug log

    const group = await Group.findOne({
      where: { id: groupId },
      include: [
        {
          model: User,
          as: "GroupMembers",
          attributes: ["id", "username", "email"],
          through: { attributes: [] }
        },
        {
          model: Note,
          attributes: ["id", "title", "content", "createdAt"]
        }
      ]
    });

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    console.log("Found group:", group); // Debug log
    res.json(group);
  } catch (error) {
    console.error("Error fetching group details:", error);
    res.status(500).json({ error: "Error fetching group details" });
  }
});

// Get group members
router.get("/:id/members", isAuthenticated, async (req, res) => {
  try {
    const groupId = req.params.id;
    const members = await User.findAll({
      include: [{
        model: Group,
        as: "UserGroups",
        where: { id: groupId },
        through: { attributes: ["role"] }
      }]
    });
    res.json(members);
  } catch (error) {
    console.error("Error fetching group members:", error);
    res.status(500).json({ error: "Error fetching group members" });
  }
});

// Get group notes
router.get("/:id/notes", isAuthenticated, async (req, res) => {
  try {
    const groupId = req.params.id;
    const notes = await Note.findAll({
      where: { groupId: groupId }
    });
    res.json(notes);
  } catch (error) {
    console.error("Error fetching group notes:", error);
    res.status(500).json({ error: "Error fetching group notes" });
  }
});

export default router;
