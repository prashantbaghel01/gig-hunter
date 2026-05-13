// ============================================================
// routes/jobs.js
// GET  /api/jobs          → fetch + persist + return all jobs
// GET  /api/jobs/:id      → single job (with its proposal)
// PATCH /api/jobs/:id/status → move Kanban column
// ============================================================

const express   = require('express');
const Router    = express.Router();
const Parser    = require('rss-parser');
const { Job, Proposal } = require('../config/database');

const rssParser = new Parser({ timeout: 5000 });

// ── MY SKILLS PROFILE (hardcoded for MVP) ────────────────
const MY_PROFILE = {
  name      : 'Prashant Baghel',
  location  : 'Lucknow, India',
  skills    : ['React', 'Node.js', 'Express', 'TailwindCSS', 'Full-Stack'],
  portfolio : 'github.com/myusername',
};

// ── 20 FAKE JOBS ─────────────────────────────────────────
const FAKE_JOBS = [
  { externalId:'fj-01', title:'React Developer for SaaS Dashboard',            pay:'$800',   platform:'Upwork',      skills:['React','Recharts','TailwindCSS'],         description:'Build a multi-tenant analytics dashboard with charts, filters, and real-time data. Must know hooks, context API, and Recharts or Chart.js.', postedAt: new Date(Date.now()-1*3600000) },
  { externalId:'fj-02', title:'Node.js REST API for Mobile App Backend',        pay:'$1,200', platform:'Freelancer',  skills:['Node.js','Express','PostgreSQL'],          description:'Build REST APIs for our iOS/Android app. Requires Express.js, JWT auth, PostgreSQL, and proper documentation.', postedAt: new Date(Date.now()-2*3600000) },
  { externalId:'fj-03', title:'Full-Stack Developer for E-Commerce Site',       pay:'$2,500', platform:'Upwork',      skills:['React','Node.js','MongoDB','Stripe'],       description:'E-commerce platform with product listings, cart, checkout flow, and admin panel. React frontend + Node backend.', postedAt: new Date(Date.now()-3*3600000) },
  { externalId:'fj-04', title:'TailwindCSS Landing Page from Figma Design',     pay:'$350',   platform:'Fiverr',      skills:['TailwindCSS','HTML','CSS'],                description:'Pixel-perfect conversion of Figma design into responsive landing page. Mobile-first, cross-browser compatible.', postedAt: new Date(Date.now()-4*3600000) },
  { externalId:'fj-05', title:'Express.js Microservice for Payment Processing', pay:'$900',   platform:'Toptal',      skills:['Express','Node.js','Stripe'],              description:'Standalone Express microservice to handle Stripe/Razorpay payment flows. Needs webhooks, refund handling, and invoice generation.', postedAt: new Date(Date.now()-5*3600000) },
  { externalId:'fj-06', title:'React Native Developer for Fitness Tracker App', pay:'$1,800', platform:'Upwork',      skills:['React Native','Firebase','JavaScript'],    description:'Cross-platform fitness tracker app with workout logging, progress charts, and push notifications.', postedAt: new Date(Date.now()-6*3600000) },
  { externalId:'fj-07', title:'Admin Dashboard UI — React + Material Design',   pay:'$600',   platform:'Freelancer',  skills:['React','MUI','TailwindCSS'],               description:'Responsive admin panel with sidebar navigation, data tables, user management, and role-based access.', postedAt: new Date(Date.now()-7*3600000) },
  { externalId:'fj-08', title:'Next.js Blog Platform with CMS Integration',     pay:'$1,100', platform:'Remote.co',   skills:['Next.js','Sanity','React'],                description:'Performant blog platform using Next.js with SSG/ISR, integrated with Sanity CMS. SEO-optimized with dynamic routing.', postedAt: new Date(Date.now()-8*3600000) },
  { externalId:'fj-09', title:'WebSocket Chat App (Node.js + React)',           pay:'$750',   platform:'Upwork',      skills:['Socket.io','Node.js','React'],             description:'Real-time chat application with rooms, private messaging, online presence indicators.', postedAt: new Date(Date.now()-9*3600000) },
  { externalId:'fj-10', title:'Bug Fixes & Feature Additions — React App',      pay:'$25/hr', platform:'Fiverr',      skills:['React','JavaScript','Debugging'],          description:'Ongoing maintenance for existing React app. Fix reported bugs, add minor features, improve performance.', postedAt: new Date(Date.now()-10*3600000) },
  { externalId:'fj-11', title:'Portfolio Website for Design Agency',            pay:'$500',   platform:'Upwork',      skills:['React','TailwindCSS','Framer Motion'],     description:'Stunning portfolio website for a creative agency. Smooth animations, contact form, and CMS for easy updates.', postedAt: new Date(Date.now()-11*3600000) },
  { externalId:'fj-12', title:'REST API Integration & Data Pipeline',           pay:'$40/hr', platform:'Toptal',      skills:['Node.js','REST APIs','Express'],           description:'Connect Stripe, SendGrid, Twilio into a unified Node.js service layer with proper error handling and logging.', postedAt: new Date(Date.now()-12*3600000) },
  { externalId:'fj-13', title:'Job Board Web App (Full-Stack)',                  pay:'$1,500', platform:'Freelancer',  skills:['React','Node.js','PostgreSQL'],            description:'Fully functional job board with employer/candidate roles, search/filter, job posting, and email notifications.', postedAt: new Date(Date.now()-13*3600000) },
  { externalId:'fj-14', title:'Inventory Management System',                    pay:'$2,000', platform:'Upwork',      skills:['React','Node.js','SQLite'],                description:'Web-based inventory tracker with barcode scanning, low-stock alerts, supplier management, and PDF reports.', postedAt: new Date(Date.now()-14*3600000) },
  { externalId:'fj-15', title:'Chrome Extension — Productivity Tool',           pay:'$700',   platform:'Remote.co',   skills:['JavaScript','React','Chrome APIs'],        description:'Chrome extension that tracks active tab time, blocks distracting sites, and shows daily productivity summary.', postedAt: new Date(Date.now()-15*3600000) },
  { externalId:'fj-16', title:'Multi-Vendor Marketplace — MVP',                 pay:'$3,000', platform:'Upwork',      skills:['React','Node.js','MongoDB','Stripe'],       description:'Etsy-like marketplace where vendors list products, buyers purchase, and admin manages commissions.', postedAt: new Date(Date.now()-16*3600000) },
  { externalId:'fj-17', title:'API Documentation & OpenAPI Spec Writer',        pay:'$30/hr', platform:'Freelancer',  skills:['Node.js','Express','Swagger'],             description:'Write clear API documentation and OpenAPI 3.0 specs for our existing Express REST API.', postedAt: new Date(Date.now()-17*3600000) },
  { externalId:'fj-18', title:'Responsive Email Template Builder (React)',       pay:'$450',   platform:'Fiverr',      skills:['React','DnD','HTML Email'],                description:'Drag-and-drop email template builder. Users edit text, swap images, preview, and export HTML for Mailchimp.', postedAt: new Date(Date.now()-18*3600000) },
  { externalId:'fj-19', title:'Data Visualization Dashboard (D3 + React)',      pay:'$1,300', platform:'Upwork',      skills:['React','D3.js','Node.js'],                 description:'BI-style dashboard with D3.js charts fed by a Node.js REST API with live data updates every 30 seconds.', postedAt: new Date(Date.now()-19*3600000) },
  { externalId:'fj-20', title:'Social Media Scheduler — MERN Stack',            pay:'$1,700', platform:'Remote.co',   skills:['React','Node.js','MongoDB','Cron'],        description:'Buffer-like social scheduler. Users connect Twitter/Instagram, compose posts, schedule them, and view analytics.', postedAt: new Date(Date.now()-20*3600000) },
];

// ── HELPER: upsert jobs into DB ───────────────────────────
// Uses findOrCreate so re-fetching the same RSS/fake data
// doesn't create duplicate rows.
async function upsertJobs(jobsArray) {
  const results = [];
  for (const j of jobsArray) {
    const [job, created] = await Job.findOrCreate({
      where  : { externalId: j.externalId },
      defaults: {
        title       : j.title,
        platform    : j.platform,
        pay         : j.pay,
        description : j.description,
        skills      : j.skills || [],
        link        : j.link   || null,
        postedAt    : j.postedAt || new Date(),
        status      : 'new',
      },
    });
    results.push(job);
  }
  return results;
}

// ── HELPER: parse RSS feed ────────────────────────────────
async function fetchRSSJobs(feedUrl) {
  try {
    const feed = await rssParser.parseURL(feedUrl);
    return feed.items.map((item, i) => ({
      externalId  : `rss-${i}-${Buffer.from(item.link || String(i)).toString('base64').slice(0, 12)}`,
      title       : item.title || 'Untitled',
      pay         : item.budget || 'Not specified',
      description : item.contentSnippet || item.summary || '',
      platform    : feed.title || 'RSS',
      skills      : [],
      link        : item.link || null,
      postedAt    : item.pubDate ? new Date(item.pubDate) : new Date(),
    }));
  } catch (err) {
    console.warn('[RSS] Feed failed:', err.message);
    return null;
  }
}

// ── GET /api/jobs ─────────────────────────────────────────
// 1. Try RSS → fallback to fake jobs
// 2. Upsert into DB
// 3. Return all jobs grouped by status (for Kanban)
Router.get('/', async (req, res, next) => {
  try {
    // Try RSS feed first
    let incoming = null;
    if (process.env.RSS_FEED_URL) {
      incoming = await fetchRSSJobs(process.env.RSS_FEED_URL);
    }

    // Fallback to fake data
    if (!incoming || incoming.length === 0) {
      console.log('[Jobs] Using fake demo jobs');
      incoming = FAKE_JOBS;
    }

    // Persist to DB (upsert — safe to call repeatedly)
    await upsertJobs(incoming);

    // Fetch all from DB, include associated proposal
    const allJobs = await Job.findAll({
      include  : [{ model: Proposal, as: 'proposal' }],
      order    : [['postedAt', 'DESC']],
    });

    // Stats for the dashboard bar
    const stats = {
      total   : allJobs.length,
      newJobs : allJobs.filter(j => j.status === 'new').length,
      ready   : allJobs.filter(j => j.status === 'ready').length,
      applied : allJobs.filter(j => j.status === 'applied').length,
    };

    res.json({ success: true, stats, jobs: allJobs });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/jobs/:id ─────────────────────────────────────
Router.get('/:id', async (req, res, next) => {
  try {
    const job = await Job.findByPk(req.params.id, {
      include: [{ model: Proposal, as: 'proposal' }],
    });
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.json({ success: true, job });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/jobs/:id/status ────────────────────────────
// Moves a job card to a different Kanban column
Router.patch('/:id/status', async (req, res, next) => {
  const VALID = ['new', 'ready', 'applied'];
  const { status } = req.body;

  if (!status || !VALID.includes(status)) {
    return res.status(400).json({
      success : false,
      message : `status must be one of: ${VALID.join(', ')}`,
    });
  }

  try {
    const job = await Job.findByPk(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    await job.update({ status });
    console.log(`[Jobs] #${job.id} "${job.title}" → ${status}`);
    res.json({ success: true, job });
  } catch (err) {
    next(err);
  }
});

// Export profile so proposals route can import it
module.exports        = Router;
module.exports.MY_PROFILE = MY_PROFILE;
