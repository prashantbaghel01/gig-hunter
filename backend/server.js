// ============================================================
// server.js — Gig Hunter Backend (Phase A)
// Express app entry point.
// Boots the DB, registers all routes, starts listening.
// ============================================================

require('dotenv').config();   // load .env FIRST

const express      = require('express');
const cors         = require('cors');

const { syncDatabase }  = require('./config/database');
const jobsRouter        = require('./routes/jobs');
const proposalsRouter   = require('./routes/proposals');
const errorHandler      = require('./middleware/errorHandler');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── MIDDLEWARE ────────────────────────────────────────────

// CORS — allow React dev server and production Vercel URL
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.CLIENT_URL,
  ],
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, _res, next) => {
  const t = new Date().toLocaleTimeString('en-IN', { hour12: false });
  console.log(`[${t}]  ${req.method.padEnd(6)} ${req.path}`);
  next();
});

// ── ROUTES ────────────────────────────────────────────────
app.use('/api/jobs',      jobsRouter);
app.use('/api/proposals', proposalsRouter);

// Health check — Render/Railway pings this
app.get('/health', (_req, res) => {
  res.json({
    status  : 'ok',
    service : 'Gig Hunter API v2',
    uptime  : `${Math.round(process.uptime())}s`,
    openai  : process.env.OPENAI_API_KEY ? '✅ configured' : '⚠️  NOT SET',
  });
});

// Root index
app.get('/', (_req, res) => {
  res.json({
    message   : '🎯 Gig Hunter API is running',
    endpoints : {
      jobs            : 'GET    /api/jobs',
      singleJob       : 'GET    /api/jobs/:id',
      jobStatus       : 'PATCH  /api/jobs/:id/status',
      generateProposal: 'POST   /api/proposals/generate',
      saveProposal    : 'POST   /api/proposals/save',
      listProposals   : 'GET    /api/proposals',
      stats           : 'GET    /api/proposals/stats',
      deleteProposal  : 'DELETE /api/proposals/:id',
      health          : 'GET    /health',
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success : false,
    message : `Route not found: ${req.method} ${req.path}`,
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// ── BOOT ──────────────────────────────────────────────────
async function boot() {
  try {
    await syncDatabase();    // connect + sync all Sequelize models

    app.listen(PORT, () => {
      console.log('');
      console.log('  🎯 ─────────────────────────────────────────');
      console.log(`     GIG HUNTER BACKEND  ·  port ${PORT}`);
      console.log('  ──────────────────────────────────────────');
      console.log(`     http://localhost:${PORT}`);
      console.log(`     http://localhost:${PORT}/api/jobs`);
      console.log(`     http://localhost:${PORT}/health`);
      console.log('');
      if (!process.env.OPENAI_API_KEY) {
        console.warn('  ⚠️  OPENAI_API_KEY not set in .env');
        console.warn('     Proposal generation will return 500 until set.');
      }
      console.log('  ─────────────────────────────────────────');
      console.log('');
    });
  } catch (err) {
    console.error('❌ Boot failed:', err.message);
    process.exit(1);
  }
}

boot();
module.exports = app; // for future test runner
