import { Router } from "express";
import User from "../models/userModel.js";
import { Op } from "sequelize";
import { isAuthenticated } from "../middleware/authMiddleware.js";

const router = Router();

// This route will be accessible at /api/users
router.get("/users", isAuthenticated, async (req, res) => {
  try {
    console.log("Fetching users for user:", req.user.id); // Debug log
    const users = await User.findAll({
      where: {
        id: { [Op.ne]: req.user.id }, // Exclude current user
      },
      attributes: ["id", "username", "email"],
    });
    
    console.log("Found users:", users.length); // Debug log
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Error fetching users" });
  }
});

export default router;
