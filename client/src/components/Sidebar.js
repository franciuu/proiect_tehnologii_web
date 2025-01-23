import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AiOutlineHome, AiOutlineFileAdd, AiOutlineTeam } from "react-icons/ai"; // Icon pentru grupuri
import LogoutButton from "./LogoutButton"; // Butonul de logout
import styles from "../styles/sidebar.module.css";
import defaultAvatar from "../assets/default-avatar.png"; // Imagine default dacă utilizatorul nu are poză

function Sidebar() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/auth/user", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setUser(data))
      .catch(() => setUser(null));
  }, []);

  return (
    <div className={styles.sidebar}>
      <h2 className={styles.logo}>Student Notes</h2>
      <nav className={styles.nav}>
        <Link className={styles.link} to="/home">
          <AiOutlineHome className={styles.icon} />
          Home
        </Link>
        <Link className={styles.link} to="/create-note">
          <AiOutlineFileAdd className={styles.icon} />
          Create Note
        </Link>
        <Link className={styles.link} to="/groups">
          <AiOutlineTeam className={styles.icon} />
          Study Groups
        </Link>
        <LogoutButton />
      </nav>

      {/* Secțiunea de profil a utilizatorului */}
      {user && (
        <div className={styles.userSection}>
          <img
            src={user.photo || defaultAvatar} // Folosește poza utilizatorului sau una default
            alt="User"
            className={styles.userAvatar}
          />
          <p className={styles.userEmail}>{user.email}</p>
        </div>
      )}
    </div>
  );
}

export default Sidebar;
