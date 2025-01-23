import express from "express";
import cors from "cors";
import session from "express-session";
import passport from "./config/authConfig.js";
import notesRoute from "./routes/notesRoute.js";
import authRoute from "./routes/authRoute.js";
import userRoutes from "./routes/userRoutes.js";
import sequelize from './config/database.js';  // Folosește `sequelize` pentru baza de date
import './models/associations.js';  // Importă relațiile dintre modele
import groupRoutes from "./routes/groupRoutes.js";
import "./models/groupModel.js"; // Importă modelul Group
import "./models/groupUsersModel.js"; // Importă tabela intermediară
import "./models/associations.js"; // Importă relațiile dintre modele
import SharedNotes from "./models/sharedNotesModel.js"; // Importă modelul SharedNotes


const app = express();

// Middleware
app.use(express.json());
app.use(cors({ 
  origin: "http://localhost:3000", 
  credentials: true,
}));

// Configurare sesiuni
app.use(session({
  secret: process.env.SESSION_SECRET || "defaultsecret",  // Poți seta această variabilă în `.env`
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true },
}));

// Configurare Passport.js
app.use(passport.initialize());
app.use(passport.session());

// Rutele
app.use("/auth", authRoute);
app.use("/notes", notesRoute);
app.use("/api", userRoutes);
app.use("/groups", groupRoutes);

// Pornire server
const PORT = process.env.PORT || 5000;

// Update the database sync code
async function startServer() {
  try {
    // First sync SharedNotes table
    await SharedNotes.sync({ force: true });
    console.log("SharedNotes table created");

    // Then sync all other tables
    await sequelize.sync({ alter: true });
    console.log("All database tables synced");

    // Start the server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Database sync error:", error);
    process.exit(1);
  }
}

startServer();
