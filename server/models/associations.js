import User from './userModel.js';
import Note from './noteModel.js';
import Tag from './tagModel.js';
import SharedNotes from "./sharedNotesModel.js";
import Group from "./groupModel.js";
import GroupUsers from "./groupUsersModel.js";
import File from "./fileModel.js";

// Relațiile dintre User și Note
User.hasMany(Note, { foreignKey: "userId", onDelete: "CASCADE" });
Note.belongsTo(User, { foreignKey: "userId", onDelete: "CASCADE" });

// Relațiile între Note și Tag
Note.belongsToMany(Tag, { through: "NoteTags" });
Tag.belongsToMany(Note, { through: "NoteTags" });

// Relațiile many-to-many între User și Note prin SharedNotes
Note.belongsToMany(User, {
  through: SharedNotes,
  as: "SharedWith",
  foreignKey: "noteId",
});

User.belongsToMany(Note, {
  through: SharedNotes,
  as: "NotesSharedWithUser",
  foreignKey: "userId",
});

// Relațiile dintre User și Group
User.belongsToMany(Group, {
  through: GroupUsers,
  as: "UserGroups",
  foreignKey: "userId",
});

Group.belongsToMany(User, {
  through: GroupUsers,
  as: "GroupMembers",
  foreignKey: "groupId",
});

// Relațiile dintre Group și Note
Group.hasMany(Note, { foreignKey: "groupId", onDelete: "CASCADE" });
Note.belongsTo(Group, { foreignKey: "groupId" });

// Relațiile dintre Note și File
Note.hasMany(File, { 
  foreignKey: 'noteId',
  onDelete: 'CASCADE' 
});
File.belongsTo(Note, { 
  foreignKey: 'noteId'
});

export { User, Note, Tag, File };
