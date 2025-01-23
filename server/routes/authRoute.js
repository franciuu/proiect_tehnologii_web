import { Router } from "express";
import passport from "../config/authConfig.js";

const router = Router();

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
    "/google/callback",
    passport.authenticate("google", { failureRedirect: "http://localhost:3000/?error=unauthorized" }),
    (req, res) => {
      if (!req.user) {
        return res.redirect("http://localhost:3000/?error=unauthorized");
      }
      res.redirect("http://localhost:3000/home");
    }
  );
  

router.post("/logout", (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Could not log out" });
      }
      res.clearCookie("connect.sid");
      res.status(200).json({ message: "Logged out successfully" });
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/user", (req, res) => {
  console.log("Checking user session:", req.isAuthenticated(), req.user);
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
});

export default router;
