import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import styles from "../styles/groupDetails.module.css";

const GroupDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userNotes, setUserNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState("");
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);

  useEffect(() => {
    loadGroupDetails();
    loadAvailableUsers();
    loadUserNotes();
  }, [id]);

  const loadGroupDetails = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/groups/${id}`, {
        withCredentials: true,
      });
      console.log("Group details:", response.data);
      setGroup(response.data);
      
      // Load group members
      const membersResponse = await axios.get(`http://localhost:5000/groups/${id}/members`, {
        withCredentials: true,
      });
      setMembers(membersResponse.data);

      const notesResponse = await axios.get(
        `http://localhost:5000/groups/${id}/notes`,
        { withCredentials: true }
      );
      setNotes(notesResponse.data);

      setLoading(false);
    } catch (error) {
      console.error("Error loading group details:", error);
      navigate("/groups"); // Redirect back to groups list if there's an error
      setLoading(false);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/users", {
        withCredentials: true,
      });
      setAvailableUsers(response.data);
    } catch (error) {
      console.error("Error loading available users:", error);
    }
  };

  const loadUserNotes = async () => {
    try {
      const response = await axios.get("http://localhost:5000/notes", {
        withCredentials: true,
      });
      setUserNotes(response.data);
    } catch (error) {
      console.error("Error loading user notes:", error);
    }
  };

  const handleAddMembers = async () => {
    try {
      console.log("Selected users to add:", selectedUsers); // Debug log
      
      if (selectedUsers.length === 0) {
        console.log("No users selected");
        return;
      }

      const response = await axios.post(
        `http://localhost:5000/groups/${id}/members`,
        { userIds: selectedUsers },
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log("Server response:", response.data); // Debug log
      setShowAddMemberModal(false);
      setSelectedUsers([]);
      loadGroupDetails(); // Refresh the members list
    } catch (error) {
      console.error("Detailed error adding members:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
    }
  };

  const handleAddNote = async () => {
    try {
      await axios.post(
        `http://localhost:5000/groups/${id}/notes`,
        { noteId: selectedNote },
        { withCredentials: true }
      );
      setShowAddNoteModal(false);
      setSelectedNote("");
      loadGroupDetails(); // Refresh the notes list
    } catch (error) {
      console.error("Error adding note:", error);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (!group) {
    return <div className={styles.error}>Group not found</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{group.name}</h1>
      <p className={styles.description}>{group.description}</p>

      {/* Members Section */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Group Members</h2>
          <button 
            onClick={() => setShowAddMemberModal(true)}
            className={styles.addButton}
          >
            Add Members
          </button>
        </div>
        <ul className={styles.membersList}>
          {members.map((member) => (
            <li key={member.id} className={styles.memberItem}>
              {member.username} ({member.email})
            </li>
          ))}
        </ul>
      </div>

      {/* Notes Section */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Group Notes</h2>
          <button 
            onClick={() => setShowAddNoteModal(true)}
            className={styles.addButton}
          >
            Add Note
          </button>
        </div>
        <div className={styles.notesList}>
          {notes.map((note) => (
            <div key={note.id} className={styles.noteCard}>
              <h3>{note.title}</h3>
              <p>{note.content.substring(0, 100)}...</p>
            </div>
          ))}
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Add Members to Group</h3>
            <div className={styles.userList}>
              {availableUsers.map((user) => (
                <label key={user.id} className={styles.userItem}>
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers([...selectedUsers, user.id]);
                      } else {
                        setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                      }
                    }}
                  />
                  {user.username} ({user.email})
                </label>
              ))}
            </div>
            <div className={styles.modalButtons}>
              <button onClick={handleAddMembers} className={styles.submitButton}>
                Add Selected Members
              </button>
              <button 
                onClick={() => {
                  setShowAddMemberModal(false);
                  setSelectedUsers([]);
                }} 
                className={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {showAddNoteModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Add Note to Group</h3>
            <select
              value={selectedNote}
              onChange={(e) => setSelectedNote(e.target.value)}
              className={styles.noteSelect}
            >
              <option value="">Select a note...</option>
              {userNotes.map((note) => (
                <option key={note.id} value={note.id}>
                  {note.title}
                </option>
              ))}
            </select>
            <div className={styles.modalButtons}>
              <button 
                onClick={handleAddNote} 
                className={styles.submitButton}
                disabled={!selectedNote}
              >
                Add Note
              </button>
              <button 
                onClick={() => {
                  setShowAddNoteModal(false);
                  setSelectedNote("");
                }} 
                className={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <button 
        onClick={() => navigate("/groups")} 
        className={styles.backButton}
      >
        Back to Groups
      </button>
    </div>
  );
};

export default GroupDetails;
