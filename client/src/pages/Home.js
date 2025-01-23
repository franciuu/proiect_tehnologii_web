import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "../styles/home.module.css";

function Home() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState("");
  const [createdAtFilter, setCreatedAtFilter] = useState("");
  const [sharedNotes, setSharedNotes] = useState([]);
  const [users, setUsers] = useState([]);
  const [shareNoteId, setShareNoteId] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/notes/tags", { withCredentials: true })
      .then((response) => setAvailableTags(response.data))
      .catch((error) => console.error("Error fetching tags:", error));

    loadNotes();
    loadSharedNotes();
    loadUsers();
  }, [navigate]);

  const loadNotes = (tagName = "") => {
    const url = tagName
      ? `http://localhost:5000/notes/bytag/${tagName}`
      : "http://localhost:5000/notes";

    axios
      .get(url, { withCredentials: true })
      .then((response) => setNotes(response.data))
      .catch((error) => {
        console.error("Error fetching notes:", error);
        if (error.response?.status === 401) {
          navigate("/");
        }
      });
  };

  const loadSharedNotes = async () => {
    try {
      const response = await axios.get("http://localhost:5000/notes/shared", {
        withCredentials: true,
      });
      console.log("Loaded shared notes:", response.data); // Debug log
      setSharedNotes(response.data);
    } catch (error) {
      console.error("Error fetching shared notes:", error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/users", {
        withCredentials: true,
      });
      console.log("Users loaded:", response.data); // Debug log
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };
  
  // Funcție pentru deschiderea modalului
  const openModal = (noteId) => {
    setShareNoteId(noteId); // Setează ID-ul notei pentru care se face partajarea
  };

  // Funcție pentru închiderea modalului
  const closeModal = () => {
    setShareNoteId(null); // Resetează ID-ul notei la null când închizi modalul
    setSelectedUsers([]); // Resetăm utilizatorii selectați
  };

  const handleTagSelect = (tagName) => {
    setSelectedTag(tagName);
    setSearchInput(tagName);
    setShowSuggestions(false);
    loadNotes(tagName);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    setShowSuggestions(true);
    if (!value) {
      setSelectedTag("");
      loadNotes();
    }
  };

  const handleFilter = () => {
    const params = {};
    
    // Verifică dacă există filtre pentru subiect
    if (subjectFilter.trim() !== "") {
      params.subject = subjectFilter;
    }
  
    // Verifică dacă există filtre pentru dată
    if (createdAtFilter.trim() !== "") {
      params.createdAt = createdAtFilter;
    }
  
    console.log("Filters sent to backend:", params); // Debugging
    
    // Trimite cererea GET cu filtrele
    axios
      .get("http://localhost:5000/notes", {
        withCredentials: true,
        params: params, // Parametrii de filtrare
      })
      .then((response) => {
        setNotes(response.data); // Actualizează starea cu notițele filtrate
      })
      .catch((error) => console.error("Error applying filters:", error)); // Gestionare erori
  };
  

  const handleShare = async () => {
    try {
      if (!selectedUsers.length) {
        alert("Please select at least one user to share with");
        return;
      }

      console.log("Attempting to share note:", {
        noteId: shareNoteId,
        selectedUsers
      });

      const response = await axios.post(
        `http://localhost:5000/notes/${shareNoteId}/share`,
        { userIds: selectedUsers },
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log("Share response:", response.data);

      if (response.data.message) {
        setSelectedUsers([]);
        setShareNoteId(null);
        alert(response.data.message);
        await loadSharedNotes();
      }
    } catch (error) {
      console.error("Full error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      alert(
        error.response?.data?.details || 
        error.response?.data?.error || 
        "Failed to share note. Please try again."
      );
    }
  };

  const filteredTags = availableTags.filter((tag) =>
    tag.name.toLowerCase().includes(searchInput.toLowerCase())
  );

  return (
    <div className={styles.home}>
      <div className={styles.searchContainer}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search by tag..."
          value={searchInput}
          onChange={handleSearchChange}
          onFocus={() => setShowSuggestions(true)}
        />
        {showSuggestions && searchInput && (
          <div className={styles.suggestions}>
            {filteredTags.map((tag) => (
              <div
                key={tag.id}
                className={styles.suggestionItem}
                onClick={() => handleTagSelect(tag.name)}
              >
                {tag.name}
              </div>
            ))}
          </div>
        )}
      </div>
  
      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Filter by subject..."
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className={styles.filterInput}
        />
        <input
          type="date"
          value={createdAtFilter}
          onChange={(e) => setCreatedAtFilter(e.target.value)}
          className={styles.filterInput}
        />
        <button onClick={handleFilter} className={styles.filterButton}>
          Apply Filters
        </button>
      </div>
  
      <h1 className={styles.pageTitle}>Your Notes</h1>
      <ul className={styles.notesList}>
        {notes.length > 0 ? (
          notes.map((note) => (
            <li key={note.id} className={styles.card}>
              <div className={styles.noteHeader}>
                <Link to={`/notes/${note.id}`} className={styles.noteTitle}>{note.title}</Link>
                <span className={styles.noteDate}>
                  {new Date(note.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className={styles.noteTags}>
                {note.Tags?.map((tag) => (
                  <span
                    key={tag.id}
                    className={styles.tag}
                    onClick={(e) => {
                      e.preventDefault();
                      handleTagSelect(tag.name);
                    }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
              <button 
                onClick={() => openModal(note.id)} 
                className={styles.shareButton}
              >
                Share Note
              </button>
            </li>
          ))
        ) : (
          <p className={styles.noNotesMessage}>No notes found.</p>
        )}
      </ul>
  
      {shareNoteId && (
        <div className={styles.shareModal}>
          <div className={styles.shareModalContent}>
            <h3 className={styles.shareModalTitle}>Select Users to Share Note</h3>
            <ul className={styles.shareModalList}>
              {users.length > 0 ? (
                users.map((user) => (
                  <li key={user.id} className={styles.shareModalItem}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers([...selectedUsers, user.id]);
                          } else {
                            setSelectedUsers(selectedUsers.filter((id) => id !== user.id));
                          }
                        }}
                      />
                      {user.username} ({user.email})
                    </label>
                  </li>
                ))
              ) : (
                <p className={styles.noUsersMessage}>No users available to share with.</p>
              )}
            </ul>
            <div className={styles.modalButtons}>
              <button 
                onClick={handleShare} 
                className={styles.shareModalButton}
                disabled={selectedUsers.length === 0}
              >
                Share
              </button>
              <button 
                onClick={() => {
                  setShareNoteId(null);
                  setSelectedUsers([]);
                }} 
                className={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </div>
          <div 
            className={styles.overlay} 
            onClick={() => {
              setShareNoteId(null);
              setSelectedUsers([]);
            }}
          ></div>
        </div>
      )}

      <h1 className={styles.pageTitle}>Shared Notes</h1>
      <ul className={styles.notesList}>
        {sharedNotes.length > 0 ? (
          sharedNotes.map((note) => (
            <li key={note.id} className={styles.card}>
              <div className={styles.noteHeader}>
                <Link to={`/notes/${note.id}`} className={styles.noteTitle}>
                  {note.title}
                </Link>
                <span className={styles.noteDate}>
                  {new Date(note.createdAt).toLocaleDateString()}
                </span>
              </div>
            </li>
          ))
        ) : (
          <p className={styles.noNotesMessage}>No shared notes found.</p>
        )}
      </ul>
    </div>
  );
}

export default Home;