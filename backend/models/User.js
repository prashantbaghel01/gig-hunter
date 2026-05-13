// ============================================================
// models/User.js
// Stores the freelancer's profile (Prashant's details).
// MVP has a single hardcoded user; schema is ready for multi-user later.
// ============================================================

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {

    id: {
      type          : DataTypes.INTEGER,
      autoIncrement : true,
      primaryKey    : true,
    },

    name: {
      type      : DataTypes.STRING,
      allowNull : false,
      comment   : 'Full name e.g. Prashant Baghel',
    },

    email: {
      type      : DataTypes.STRING,
      allowNull : true,
      unique    : true,
      validate  : { isEmail: true },
      comment   : 'Optional — not used in MVP auth flow',
    },

    // skills stored as JSON array e.g. ["React","Node.js","Express"]
    // Sequelize JSON type serialises/deserialises automatically
    skills_json: {
      type      : DataTypes.JSON,
      allowNull : false,
      defaultValue : [],
      comment   : 'Array of skill strings used when building AI prompts',
    },

    location: {
      type         : DataTypes.STRING,
      allowNull    : true,
      defaultValue : 'Lucknow, India',
    },

    portfolio: {
      type      : DataTypes.STRING,
      allowNull : true,
      comment   : 'GitHub / portfolio URL shown in proposals',
    },

  }, {
    timestamps : true,
    tableName  : 'users',
  });

  return User;
};
