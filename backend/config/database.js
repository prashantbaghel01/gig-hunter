// ============================================================
// config/database.js
// Centralised Sequelize instance + model associations
// Every file that needs the DB imports from here — never
// create a second Sequelize instance elsewhere.
// ============================================================

const path      = require('path');
const { Sequelize } = require('sequelize');

// ── Load model factories ──────────────────────────────────
const defineUser     = require('../models/User');
const defineJob      = require('../models/Job');
const defineProposal = require('../models/Proposal');

// ── Create Sequelize instance (SQLite) ────────────────────
const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'database.sqlite');

const sequelize = new Sequelize({
  dialect : 'sqlite',
  storage : dbPath,
  logging : false,          // flip to console.log to debug SQL
});

// ── Instantiate models ────────────────────────────────────
const User     = defineUser(sequelize);
const Job      = defineJob(sequelize);
const Proposal = defineProposal(sequelize);

// ── Associations (Blueprint §4) ───────────────────────────
//   Job    hasOne  Proposal  (a job can have one generated proposal)
//   Proposal belongsTo Job  (every proposal references its job)
Job.hasOne(Proposal, {
  foreignKey : 'job_id',
  as         : 'proposal',
  onDelete   : 'CASCADE',   // deleting a job also removes its proposal
});

Proposal.belongsTo(Job, {
  foreignKey : 'job_id',
  as         : 'job',
});

// ── Sync helper (called from server.js) ───────────────────
async function syncDatabase(force = false) {
  await sequelize.authenticate();
  // alter:true  → safe for dev (updates columns without dropping data)
  // force:true  → drops & recreates all tables (use only for db:reset)
  await sequelize.sync({ force, alter: !force });
  console.log(`✅ Database synced  [${dbPath}]`);
}

module.exports = { sequelize, User, Job, Proposal, syncDatabase };
