import React from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from '../styles/logoutButton.module.css';

function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:5000/auth/logout', {}, { 
        withCredentials: true 
      });
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <button onClick={handleLogout} className={styles.logoutButton}>
      Logout
    </button>
  );
}

export default LogoutButton;
