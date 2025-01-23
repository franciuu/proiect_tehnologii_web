import { Sequelize } from "sequelize";
import sequelize from "../config/database.js";

const GroupUsers = sequelize.define("GroupUsers", {
  role: {
    type: Sequelize.STRING,
    defaultValue: "member", // Roluri posibile: "admin", "member"
  },
}, {
  indexes: [
    {
      unique: true,
      fields: ['groupId', 'userId']
    }
  ]
});

export default GroupUsers;
