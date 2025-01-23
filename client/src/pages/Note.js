import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import axios from "axios";
import styles from "../styles/note.module.css";

function Note() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedNote, setEditedNote] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [files, setFiles] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [filesToDelete, setFilesToDelete] = useState(new Set());

  const sourceTypes = [
    { value: "none", label: "No Source" },
    { value: "youtube", label: "YouTube Video" },
    { value: "kindle", label: "Kindle Book" },
    { value: "conference", label: "Online Conference" },
    { value: "website", label: "Website" },
    { value: "other", label: "Other" }
  ];

  useEffect(() => {
    axios
      .get(`http://localhost:5000/notes/${id}`, { withCredentials: true })
      .then((response) => {
        console.log("Note data received:", response.data); // Debug log
        setNote(response.data);
        setEditedNote(response.data);
        if (response.data.Files) {
          console.log("Files found:", response.data.Files); // Debug log
          setFiles(response.data.Files);
        }
      })
      .catch((error) => {
        console.error("Error fetching note:", error);
        if (error.response && error.response.status === 401) {
          navigate("/");
        }
      });
  }, [id, navigate]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedNote(note);
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setNewFiles(prev => [...prev, ...selectedFiles]);
  };

  const handleDeleteFile = (fileId) => {
    if (fileId) {
      setFilesToDelete(prev => new Set(prev).add(fileId));
    }
  };

  const handleDeleteNewFile = (index) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      const formData = new FormData();
      formData.append("title", editedNote.title);
      formData.append("content", editedNote.content);
      formData.append("subject", editedNote.subject);
      formData.append("sourceType", editedNote.sourceType);
      formData.append("sourceUrl", editedNote.sourceUrl || "");
      formData.append("source", editedNote.source || "");
  
      // Adaugă fișiere noi
      newFiles.forEach((file) => {
        formData.append("files", file);
      });
  
      // Adaugă fișiere de șters
      if (filesToDelete.size > 0) {
        formData.append("filesToDelete", JSON.stringify(Array.from(filesToDelete)));
      }
  
      console.log("FormData being sent for update:", [...formData.entries()]);
  
      const response = await axios.put(
        `http://localhost:5000/notes/${id}`,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
  
      setNote(response.data);
      setFiles(response.data.Files || []);
      setIsEditing(false);
      setNewFiles([]);
      setFilesToDelete(new Set());
    } catch (error) {
      console.error("Error updating note:", error);
      alert("Failed to update note");
    }
  };
  
  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:5000/notes/${id}`, {
        withCredentials: true
      });
      navigate('/home');
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note');
    }
  };

  const renderFilePreview = (file, isNew = false, index) => {
    if (isNew) {
      // Preview for new files
      const isImage = file.type.startsWith('image/');
      if (isImage) {
        return (
          <img
            src={URL.createObjectURL(file)}
            alt={file.name}
            className={styles.filePreview}
          />
        );
      }
      return (
        <div className={styles.fileIcon}>
          <i className="fas fa-file"></i>
        </div>
      );
    }

    // Preview for existing files
    const isImage = file.mimetype.startsWith('image/');
    if (isImage) {
      return (
        <img
          src={`http://localhost:5000/notes/${note.id}/files/${file.id}`}
          alt={file.originalName}
          className={styles.filePreview}
        />
      );
    }
    return (
      <div className={styles.fileIcon}>
        <i className="fas fa-file"></i>
      </div>
    );
  };

  if (!note) return <div>Loading...</div>;
  const formattedDate = new Date(note.createdAt).toLocaleString();

  return (
    <div className={styles.noteContainer}>
      <div className={styles.noteHeader}>
        {isEditing ? (
          <input
            type="text"
            value={editedNote.title}
            onChange={(e) => setEditedNote({ ...editedNote, title: e.target.value })}
            className={styles.editTitle}
          />
        ) : (
          <h1>{note.title}</h1>
        )}
        <small>Created at: {formattedDate}</small>
      </div>

      <div className={styles.buttonContainer}>
        {isEditing ? (
          <>
            <button onClick={handleSave} className={styles.saveButton}>Save</button>
            <button onClick={handleCancel} className={styles.cancelButton}>Cancel</button>
          </>
        ) : (
          <>
            <button onClick={handleEdit} className={styles.editButton}>Edit</button>
            <button onClick={() => setShowConfirmDialog(true)} className={styles.deleteButton}>
              Delete Note
            </button>
          </>
        )}
      </div>

      {showConfirmDialog && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Delete Note</h2>
            </div>
            <div className={styles.modalBody}>
              <p>Are you sure you want to delete this note?</p>
              <p className={styles.noteTitle}>"{note.title}"</p>
            </div>
            <div className={styles.modalFooter}>
              <button
                onClick={() => setShowConfirmDialog(false)}
                className={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className={styles.confirmDeleteButton}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditing ? (
        <>
          <input
            type="text"
            value={editedNote.subject}
            onChange={(e) => setEditedNote({ ...editedNote, subject: e.target.value })}
            className={styles.editSubject}
          />
          <div className={styles.sourceSection}>
            <h3>Source Information</h3>
            <select
              value={editedNote.sourceType}
              onChange={(e) => setEditedNote({ ...editedNote, sourceType: e.target.value })}
              className={styles.sourceTypeSelect}
            >
              {sourceTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {editedNote.sourceType !== "none" && (
              <>
                <input
                  type="text"
                  value={editedNote.sourceUrl || ""}
                  onChange={(e) => setEditedNote({ ...editedNote, sourceUrl: e.target.value })}
                  placeholder="Source URL"
                  className={styles.sourceUrlInput}
                />
                <input
                  type="text"
                  value={editedNote.source || ""}
                  onChange={(e) => setEditedNote({ ...editedNote, source: e.target.value })}
                  placeholder="Source Description"
                  className={styles.sourceInput}
                />
              </>
            )}
          </div>
          <textarea
            value={editedNote.content}
            onChange={(e) => setEditedNote({ ...editedNote, content: e.target.value })}
            className={styles.editContent}
          />
        </>
      ) : (
        <>
          {note.subject && <p className={styles.subject}>Subject: {note.subject}</p>}
          {note.sourceType && note.sourceType !== "none" && (
            <div className={styles.sourceInfo}>
              <h3>Source Information</h3>
              <div className={styles.sourceDetails}>
                <p>Type: {note.sourceType}</p>
                {note.sourceUrl && (
                  <p>URL: <a href={note.sourceUrl} target="_blank" rel="noopener noreferrer">
                    {note.sourceUrl}
                  </a></p>
                )}
                {note.source && <p>Description: {note.source}</p>}
              </div>
            </div>
          )}
          <div className={styles.content}>
            <ReactMarkdown>{note.content}</ReactMarkdown>
          </div>
        </>
      )}

      {/* File section */}
      {isEditing ? (
        <div className={styles.fileSection}>
          <h3>Files</h3>
          
          {/* Existing files */}
          <div className={styles.fileGrid}>
            {files.map((file) => (
              !filesToDelete.has(file.id) && (
                <div key={file.id} className={styles.fileItem}>
                  {renderFilePreview(file)}
                  <span className={styles.fileName}>{file.originalName}</span>
                  <button
                    onClick={() => handleDeleteFile(file.id)}
                    className={styles.deleteFileButton}
                  >
                    Delete
                  </button>
                </div>
              )
            ))}
          </div>

          {/* New files */}
          <div className={styles.fileGrid}>
            {newFiles.map((file, index) => (
              <div key={index} className={styles.fileItem}>
                {renderFilePreview(file, true, index)}
                <span className={styles.fileName}>{file.name}</span>
                <button
                  onClick={() => handleDeleteNewFile(index)}
                  className={styles.deleteFileButton}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          {/* File input */}
          <div className={styles.fileInput}>
            <input
              type="file"
              onChange={handleFileChange}
              multiple
              accept="image/*,.pdf,.doc,.docx"
            />
          </div>
        </div>
      ) : (
        // Display mode
        files.length > 0 && (
          <div className={styles.attachments}>
            <h3>Attachments</h3>
            <div className={styles.fileGrid}>
              {files.map((file) => (
                <div key={file.id} className={styles.fileItem}>
                  {file.mimetype.startsWith('image/') ? (
                    <img
                      src={`http://localhost:5000/notes/${note.id}/files/${file.id}`}
                      alt={file.originalName}
                      className={styles.filePreview}
                    />
                  ) : (
                    <div className={styles.fileIcon}>
                      <i className="fas fa-file"></i>
                    </div>
                  )}
                  <a
                    href={`http://localhost:5000/notes/${note.id}/files/${file.id}`}
                    download={file.originalName}
                    className={styles.downloadButton}
                  >
                    {file.originalName}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}

export default Note;