// ============================================================
// models/Job.js
// Persists every fetched job to SQLite.
// Status drives the Kanban column the card appears in.
// ============================================================

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Job = sequelize.define('Job', {

    id: {
      type          : DataTypes.INTEGER,
      autoIncrement : true,
      primaryKey    : true,
    },

    // Stable external identifier — prevents duplicate inserts
    // when the same RSS feed is re-fetched.
    externalId: {
      type      : DataTypes.STRING,
      allowNull : true,
      unique    : true,        // upsert guard
      comment   : 'ID from RSS/API source (e.g. "fake-job-1")',
    },

    title: {
      type      : DataTypes.STRING,
      allowNull : false,
    },

    platform: {
      type         : DataTypes.STRING,
      allowNull    : true,
      defaultValue : 'Upwork',
      comment      : 'Upwork | Fiverr | Freelancer | LinkedIn | Remote.co',
    },

    pay: {
      type      : DataTypes.STRING,
      allowNull : true,
      comment   : 'Budget string e.g. "$500" or "$25/hr"',
    },

    description: {
      type      : DataTypes.TEXT,
      allowNull : true,
    },

    // Kanban column driver (Blueprint §4 ENUM)
    status: {
      type         : DataTypes.ENUM('new', 'ready', 'applied'),
      defaultValue : 'new',
      allowNull    : false,
    },

    // Skills tags parsed from the listing
    skills: {
      type         : DataTypes.JSON,
      defaultValue : [],
      comment      : 'Array of skill strings parsed from the job post',
    },

    // Original URL so user can open the real listing
    link: {
      type      : DataTypes.STRING,
      allowNull : true,
    },

    // When the job was originally posted (from RSS pubDate)
    postedAt: {
      type         : DataTypes.DATE,
      allowNull    : true,
      defaultValue : DataTypes.NOW,
    },

  }, {
    timestamps : true,      // adds createdAt + updatedAt
    tableName  : 'jobs',
  });

  return Job;
};
