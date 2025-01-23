import { Sequelize } from "sequelize";
import sequelize from "../config/database.js";

const Group = sequelize.define("StudyGroup", {
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  description: {
    type: Sequelize.STRING,
    allowNull: true,
  },
}, {
  tableName: "study_groups", // Specifică manual numele tabelei
});

export default Group;
