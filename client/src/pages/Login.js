import React from "react";
import { useLocation } from "react-router-dom";
import styles from "../styles/login.module.css";
import googleIcon from "../assets/image.png"; // Importă iconița Google

function Login() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const error = queryParams.get("error");

  return (
    <div className={styles.loginContainer}>
      <form className={styles.loginForm}>
        <h1 className={styles.loginTitle}>Login</h1>
        {error === "unauthorized" && (
          <p className={styles.errorMessage}>Access denied. Only @stud.ase.ro emails are allowed.</p>
        )}
        <div className={styles.googleButtonContainer}>
          <a href="http://localhost:5000/auth/google" className={styles.googleButton}>
            <img src={googleIcon} alt="Google" className={styles.googleIcon} /> {/* Adaugă iconița */}
            Login with Google
          </a>
        </div>
      </form>
    </div>
  );
}

export default Login;
