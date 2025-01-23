import React, { useState } from "react"; 
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import axios from "axios";
import styles from "../styles/create.module.css";

function CreateNote() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    subject: "",
    tags: [],
    source: "",
    sourceType: "none",
    sourceUrl: "",
  });
  const [tagInput, setTagInput] = useState("");
  const [preview, setPreview] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [files, setFiles] = useState([]);

  const sourceTypes = [
    { value: "none", label: "No Source" },
    { value: "youtube", label: "YouTube Video" },
    { value: "kindle", label: "Kindle Book" },
    { value: "conference", label: "Online Conference" },
    { value: "website", label: "Website" },
    { value: "other", label: "Other" }
  ];

  const handleAddTag = () => {
    const value = tagInput.trim().toLowerCase();
    if (value && !formData.tags.includes(value)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, value]
      });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  const handleSourceTypeChange = (e) => {
    console.log("Source type changed to:", e.target.value);
    setFormData({
      ...formData,
      sourceType: e.target.value,
      sourceUrl: e.target.value === "none" ? "" : formData.sourceUrl,
      source: e.target.value === "none" ? "" : formData.source,
    });
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const handleRemoveFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Validare pentru câmpurile obligatorii
    if (!formData.title.trim()) {
      setToastMessage("Title is required");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }
  
    if (!formData.content.trim()) {
      setToastMessage("Content is required");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }
  
    if (!formData.subject.trim()) {
      setToastMessage("Subject is required");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }
  
    try {
      const formDataToSend = new FormData();
  
      // Adaugă datele text
      formDataToSend.append("title", formData.title);
      formDataToSend.append("content", formData.content);
      formDataToSend.append("subject", formData.subject);
      formDataToSend.append("sourceType", formData.sourceType);
      formDataToSend.append("sourceUrl", formData.sourceUrl || "");
      formDataToSend.append("source", formData.source || "");
      formDataToSend.append("tags", JSON.stringify(formData.tags));
  
      // Adaugă fișierele
      files.forEach((file) => {
        formDataToSend.append("files", file);
      });
  
      console.log("FormData being sent:", [...formDataToSend.entries()]);
  
      const response = await axios.post(
        "http://localhost:5000/notes",
        formDataToSend,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
  
      console.log("Response from server:", response.data);
      
      // Navigate to the note detail page with the new note ID
      if (response.data && response.data.id) {
        navigate(`/notes/${response.data.id}`);
      } else {
        throw new Error("No note ID received from server");
      }
    } catch (error) {
      console.error("Error creating note:", error);
      setToastMessage("Failed to create note");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };
  

  return (
    <form onSubmit={handleSubmit} className={styles.createNoteForm}>
      <input
        type="text"
        className={styles.createNoteTitle}
        placeholder="Note Title"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
      />

      <div className={styles.rightSection}>
        <input
          type="text"
          className={styles.inputField}
          placeholder="Subject"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
        />

        <div className={styles.tagInput}>
          <input
            type="text"
            placeholder="Add tags..."
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
            className={styles.inputField}
          />
          <button type="button" onClick={handleAddTag} className={styles.addTagButton}>
            Add Tag
          </button>
        </div>

        {formData.tags.length > 0 && (
          <div className={styles.tagList}>
            {formData.tags.map((tag) => (
              <span key={tag} className={styles.tag}>
                {tag}
                <button
                  type="button"
                  className={styles.removeTag}
                  onClick={() => handleRemoveTag(tag)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        <button
          type="button"
          className={styles.toggleButton}
          onClick={() => setPreview(!preview)}
        >
          {preview ? "Edit Mode" : "Preview Mode"}
        </button>
      </div>

      {preview ? (
        <div className={styles.previewArea}>
          <ReactMarkdown>{formData.content}</ReactMarkdown>
        </div>
      ) : (
        <textarea
          className={styles.createNoteContent}
          placeholder="Write something using Markdown..."
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
        />
      )}

      <div className={styles.fileSection}>
        <h3 className={styles.sectionTitle}>Attachments</h3>
        <input
          type="file"
          onChange={handleFileChange}
          multiple
          accept="image/*,.pdf,.doc,.docx"
          className={styles.fileInput}
        />
        
        {files.length > 0 && (
          <div className={styles.fileList}>
            {files.map((file, index) => (
              <div key={index} className={styles.fileItem}>
                <span className={styles.fileName}>{file.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(index)}
                  className={styles.removeFileButton}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.sourceSection}>
        <h3 className={styles.sourceTitle}>Source Integration</h3>
        <select
          className={styles.sourceTypeSelect}
          value={formData.sourceType}
          onChange={handleSourceTypeChange}
        >
          {sourceTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>

        {formData.sourceType !== "none" && (
          <>
            <input
              type="text"
              className={styles.sourceUrlInput}
              placeholder="Source URL (e.g., YouTube link, book reference)"
              value={formData.sourceUrl}
              onChange={(e) => {
                console.log("URL changed to:", e.target.value);
                setFormData({ ...formData, sourceUrl: e.target.value })
              }}
            />
            <input
              type="text"
              className={styles.sourceInput}
              placeholder="Source Description (optional)"
              value={formData.source}
              onChange={(e) => {
                console.log("Description changed to:", e.target.value);
                setFormData({ ...formData, source: e.target.value })
              }}
            />
          </>
        )}
      </div>

      <button type="submit" className={styles.submitButton}>
        Create Note
      </button>

      {showToast && (
        <div className={styles.toast}>
          {toastMessage}
        </div>
      )}
    </form>
  );
}

export default CreateNote;
