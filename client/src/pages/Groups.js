import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import styles from "../styles/groups.module.css";

const Groups = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const response = await axios.get("http://localhost:5000/groups", {
        withCredentials: true,
      });
      console.log("Loaded groups:", response.data);
      setGroups(response.data);
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        "http://localhost:5000/groups",
        {
          name: newGroupName,
          description: newGroupDescription,
        },
        { withCredentials: true }
      );
      setNewGroupName("");
      setNewGroupDescription("");
      loadGroups();
    } catch (error) {
      console.error("Error creating group:", error);
    }
  };

  const handleViewDetails = (groupId) => {
    console.log("Attempting to navigate to group:", groupId);
    try {
      navigate(`/groups/${groupId}`);
      console.log("Navigation completed");
    } catch (error) {
      console.error("Navigation error:", error);
    }
  };

  return (
    <div className={styles.groupsContainer}>
      <h1 className={styles.pageTitle}>Study Groups</h1>
      
      {/* Create Group Form */}
      <form className={styles.createGroupForm} onSubmit={handleCreateGroup}>
        <input
          type="text"
          placeholder="Group Name"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          className={styles.inputField}
          required
        />
        <textarea
          placeholder="Group Description"
          value={newGroupDescription}
          onChange={(e) => setNewGroupDescription(e.target.value)}
          className={styles.inputField}
        />
        <button type="submit" className={styles.createButton}>
          Create Group
        </button>
      </form>

      {/* Groups List */}
      <div className={styles.groupsList}>
        {groups.length > 0 ? (
          groups.map((group) => (
            <div key={group.id} className={styles.groupCard}>
              <h2 className={styles.groupName}>{group.name}</h2>
              <p className={styles.groupDescription}>{group.description}</p>
              <button 
                onClick={() => {
                  console.log("View Details clicked for group:", group.id);
                  handleViewDetails(group.id);
                }}
                className={styles.viewDetailsButton}
              >
                View Details
              </button>
            </div>
          ))
        ) : (
          <p className={styles.noGroupsMessage}>No groups found. Create one!</p>
        )}
      </div>
    </div>
  );
};

export default Groups;
