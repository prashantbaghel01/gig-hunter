// ============================================================
// models/Proposal.js
// One proposal per job (enforced by unique job_id constraint).
// Linked to Job via:  Job hasOne Proposal / Proposal belongsTo Job
// ============================================================

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Proposal = sequelize.define('Proposal', {

    id: {
      type          : DataTypes.INTEGER,
      autoIncrement : true,
      primaryKey    : true,
    },

    // Foreign key — set up in config/database.js associations
    job_id: {
      type      : DataTypes.INTEGER,
      allowNull : false,
      references : {
        model : 'jobs',
        key   : 'id',
      },
    },

    // The AI-generated cover letter text
    content: {
      type      : DataTypes.TEXT,
      allowNull : false,
      comment   : 'GPT-4o generated proposal / cover letter',
    },

    // Timestamp from OpenAI response (or Date.now() fallback)
    generated_at: {
      type         : DataTypes.DATE,
      allowNull    : false,
      defaultValue : DataTypes.NOW,
    },

    // Track if the user has copied it to clipboard
    isCopied: {
      type         : DataTypes.BOOLEAN,
      defaultValue : false,
    },

    // Free-form notes the user can attach
    notes: {
      type      : DataTypes.TEXT,
      allowNull : true,
    },

  }, {
    timestamps : true,
    tableName  : 'proposals',
  });

  return Proposal;
};
