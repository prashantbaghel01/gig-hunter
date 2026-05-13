// ============================================================
// routes/proposals.js
//
// POST /api/proposals/generate   → GPT-4o writes a proposal
// POST /api/proposals/save       → persist to DB, update job status
// GET  /api/proposals            → list all + stats
// GET  /api/proposals/stats      → dashboard metrics only
// PATCH /api/proposals/:id/notes → save user notes
// DELETE /api/proposals/:id      → remove a proposal
// ============================================================

const express = require('express');
const Router  = express.Router();
const OpenAI  = require('openai');

const { Job, Proposal } = require('../config/database');
const { MY_PROFILE }    = require('./jobs');

// ── OpenAI client (lazy init so a missing key gives a  ────
// ── nice message instead of a crash at startup)        ────
let _openai = null;
function getOpenAI() {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) {
      const err = new Error('OPENAI_API_KEY not set — copy .env.example → .env and add your key.');
      err.statusCode = 500;
      throw err;
    }
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

// ── PROMPT BUILDER ────────────────────────────────────────
function buildPrompt(job, profile) {
  return `You are an expert freelance proposal writer.

Write a compelling 150-word cover letter for the following job on behalf of the candidate below.

JOB DETAILS
-----------
Title       : ${job.title}
Platform    : ${job.platform || 'Upwork'}
Budget      : ${job.pay     || 'Not stated'}
Description : ${job.description || 'No description provided'}

CANDIDATE PROFILE
-----------------
Name       : ${profile.name}
Location   : ${profile.location}
Skills     : ${profile.skills.join(', ')}
Portfolio  : ${profile.portfolio}

STRICT RULES
------------
1. Exactly 150 words — count carefully.
2. Open with a hook that references the specific job title.
3. Mention at least 2 skills from the candidate profile.
4. One concrete benefit the client will receive.
5. Close with a single clear call-to-action (e.g., "Let's hop on a quick call").
6. NO "Dear Hiring Manager", NO "I am writing to apply", NO generic filler.
7. Write only the proposal body — no subject line, no greeting, no signature block.
8. Confident, conversational, never desperate.

Output the proposal text only.`;
}

// ── POST /api/proposals/generate ─────────────────────────
// ── POST /api/proposals/generate ─────────────────────────
Router.post('/generate', async (req, res, next) => {
  const { job } = req.body;

  if (!job || !job.title) {
    return res.status(400).json({
      success : false,
      message : 'Request body must include a { job } object with at least a title.',
    });
  }

  console.log(`[Proposals] Generating for: "${job.title}"`);

  try {
    const openai = getOpenAI();

    const completion = await openai.chat.completions.create({
      model       : 'gpt-4o',           // GPT-4o as per blueprint
      max_tokens  : 400,
      temperature : 0.75,
      messages    : [
        {
          role    : 'system',
          content : 'You are an expert freelance proposal writer. Follow all instructions exactly, especially word count.',
        },
        {
          role    : 'user',
          content : buildPrompt(job, MY_PROFILE),
        },
      ],
    });

    const proposalText  = completion.choices[0].message.content.trim();
    const wordCount     = proposalText.split(/\s+/).length;

    console.log(`[Proposals] Generated — ${wordCount} words, ${completion.usage?.total_tokens} tokens`);

    res.json({
      success      : true,
      proposal     : proposalText,
      wordCount,
      tokensUsed   : completion.usage?.total_tokens || 0,
      model        : completion.model,
    });
  } catch (err) {
    next(err);  // forwarded to global error handler
  }
});

// ── POST /api/proposals/save ──────────────────────────────
// Saves proposal to DB + bumps job.status → 'ready'
Router.post('/save', async (req, res, next) => {
  const { jobId, content } = req.body;

  if (!jobId || !content) {
    return res.status(400).json({
      success : false,
      message : 'jobId and content are required.',
    });
  }

  try {
    // Find the parent job
    const job = await Job.findByPk(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: `Job #${jobId} not found.` });
    }

    // Upsert proposal (one per job)
    const [proposal, created] = await Proposal.findOrCreate({
      where    : { job_id: jobId },
      defaults : { content, generated_at: new Date() },
    });

    if (!created) {
      // Overwrite with the latest generation
      await proposal.update({ content, generated_at: new Date() });
    }

    // Move job to 'ready' column on the Kanban board
    if (job.status === 'new') {
      await job.update({ status: 'ready' });
    }

    console.log(`[Proposals] ${created ? 'Created' : 'Updated'} proposal for job #${jobId}`);

    res.status(201).json({
      success  : true,
      message  : `Proposal ${created ? 'saved' : 'updated'}.`,
      proposal,
      job,
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/proposals ────────────────────────────────────
// Returns all proposals, each with its parent job embedded
Router.get('/', async (req, res, next) => {
  try {
    const proposals = await Proposal.findAll({
      include : [{ model: Job, as: 'job' }],
      order   : [['createdAt', 'DESC']],
    });

    res.json({ success: true, count: proposals.length, proposals });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/proposals/stats ──────────────────────────────
Router.get('/stats', async (req, res, next) => {
  try {
    const [totalJobs, totalProposals, appliedJobs] = await Promise.all([
      Job.count(),
      Proposal.count(),
      Job.count({ where: { status: 'applied' } }),
    ]);

    res.json({
      success : true,
      stats   : {
        jobsFound      : totalJobs,
        proposalsMade  : totalProposals,
        applied        : appliedJobs,
        // Win rate is fake for MVP (no "won" outcome yet)
        wins           : Math.floor(appliedJobs * 0.3),
        winRatePct     : appliedJobs > 0 ? 30 : 0,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/proposals/:id/notes ───────────────────────
Router.patch('/:id/notes', async (req, res, next) => {
  try {
    const proposal = await Proposal.findByPk(req.params.id);
    if (!proposal) return res.status(404).json({ success: false, message: 'Not found' });

    await proposal.update({ notes: req.body.notes || '' });
    res.json({ success: true, proposal });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/proposals/:id ─────────────────────────────
Router.delete('/:id', async (req, res, next) => {
  try {
    const proposal = await Proposal.findByPk(req.params.id);
    if (!proposal) return res.status(404).json({ success: false, message: 'Not found' });

    // Also reset the parent job back to 'new'
    await Job.update({ status: 'new' }, { where: { id: proposal.job_id } });
    await proposal.destroy();

    console.log(`[Proposals] Deleted #${req.params.id}, job reset → new`);
    res.json({ success: true, message: 'Proposal deleted, job reset to new.' });
  } catch (err) {
    next(err);
  }
});

module.exports = Router;
