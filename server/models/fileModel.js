import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const File = sequelize.define("File", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  originalName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  mimetype: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  noteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "Notes",
      key: "id",
    },
    onDelete: "CASCADE",
  },
});

export default File; // Asigură-te că exportul este `default`
