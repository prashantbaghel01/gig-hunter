// ============================================================
// src/api.js
// Centralised API service — all backend calls go here.
// Import this in any component instead of writing fetch() inline.
// ============================================================

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ── helper ───────────────────────────────────────────────────
async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'API error');
  return data;
}

// ── JOBS ─────────────────────────────────────────────────────

// Fetch all jobs (triggers RSS/fake upsert on backend)
export const fetchJobs = () => request('/api/jobs');

// Get a single job by id
export const fetchJob = (id) => request(`/api/jobs/${id}`);

// Move a job to a different Kanban column
export const updateJobStatus = (id, status) =>
  request(`/api/jobs/${id}/status`, {
    method : 'PATCH',
    body   : JSON.stringify({ status }),
  });

// ── PROPOSALS ────────────────────────────────────────────────

// Generate a proposal via OpenAI (or mock)
export const generateProposal = (job) =>
  request('/api/proposals/generate', {
    method : 'POST',
    body   : JSON.stringify({ job }),
  });

// Save a generated proposal to the database
export const saveProposal = (jobId, content) =>
  request('/api/proposals/save', {
    method : 'POST',
    body   : JSON.stringify({ jobId, content }),
  });

// Get all saved proposals
export const fetchProposals = () => request('/api/proposals');

// Get dashboard stats
export const fetchStats = () => request('/api/proposals/stats');

// Delete a proposal (resets job → new)
export const deleteProposal = (id) =>
  request(`/api/proposals/${id}`, { method: 'DELETE' });