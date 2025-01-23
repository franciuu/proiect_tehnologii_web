import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const SharedNotes = sequelize.define("SharedNotes", {
  noteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    references: {
      model: "Notes",
      key: "id",
    },
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    references: {
      model: "Users",
      key: "id",
    },
  }
}, {
  tableName: 'shared_notes',
  timestamps: true
});

export default SharedNotes;
