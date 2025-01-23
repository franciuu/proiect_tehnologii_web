import sequelize from "./config/database.js";
import User from "./models/userModel.js";
import { Op } from "sequelize";

const seedUsers = async () => {
  try {
    // Sincronizează baza de date fără a șterge datele existente
    await sequelize.sync({ force: false });

    // Verifică dacă utilizatorii există deja
    const existingUsers = await User.findAll({
      where: {
        email: {
          [Op.in]: ['balinfranceska22@stud.ase.ro', 'budiaiuliana22@stud.ase.ro']
        }
      }
    });

    if (existingUsers.length <= 1) {
      // Adaugă utilizatori de test doar dacă nu există
      const users = [
        {
          googleId: "123456789012345",
          username: "Balint Franceska",
          email: "balinfranceska22@stud.ase.ro",
        },
        {
          googleId: "098765432109876",
          username: "Bululete Bianca",
          email: "bululetebianca22@stud.ase.ro",
        },
      ];

      for (const userData of users) {
        await User.create(userData);
      }

      console.log("Users seeded successfully.");
    } else {
      console.log("Users already exist in the database.");
    }

    process.exit(0); // Oprește scriptul după finalizare
  } catch (error) {
    console.error("Error seeding users:", error);
    process.exit(1);
  }
};

// Execută funcția
seedUsers();
