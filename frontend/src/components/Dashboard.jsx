import React, { useState, useEffect, useCallback } from 'react';
import JobCard from './JobCard.jsx';
import ProposalModal from './ProposalModal.jsx';

// Kanban column config
const COLUMNS = [
  {
    id:    'new',
    label: '🔍 New Jobs',
    color: 'var(--accent)',
    description: 'Fresh listings waiting for proposals',
  },
  {
    id:    'ready',
    label: '📄 Proposal Ready',
    color: 'var(--warning)',
    description: 'AI proposals generated, review & send',
  },
  {
    id:    'applied',
    label: '✅ Applied',
    color: 'var(--success)',
    description: 'Submitted — tracking responses',
  },
];

function Dashboard({ onStatsUpdate }) {
  const [jobs,           setJobs]           = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [generatingId,   setGeneratingId]   = useState(null); // which job is generating
  const [modalData,      setModalData]      = useState(null); // { job, proposalText }

  // ── Fetch all jobs from backend ──────────────────────────
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res  = await fetch('http://localhost:5000/api/jobs');
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setJobs(data.jobs);

      // Bubble stats up to App.jsx header
      if (onStatsUpdate && data.stats) {
        const proposalRes  = await fetch('http://localhost:5000/api/proposals/stats');
        const proposalData = await proposalRes.json();
        if (proposalData.success) onStatsUpdate(proposalData.stats);
      }
    } catch (err) {
      setError('Could not connect to backend. Is it running on port 5000?');
      console.error('[Dashboard] fetchJobs error:', err);
    } finally {
      setLoading(false);
    }
  }, [onStatsUpdate]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  // ── Generate proposal for a job ──────────────────────────
  const handleGenerateProposal = async (job) => {
    setGeneratingId(job.id);
    try {
      const res  = await fetch('http://localhost:5000/api/proposals/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ job }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      // Open modal with the generated proposal
      setModalData({ job, proposalText: data.proposal, isMock: data.isMock });
    } catch (err) {
      alert(`Failed to generate proposal: ${err.message}`);
      console.error('[Dashboard] generate error:', err);
    } finally {
      setGeneratingId(null);
    }
  };

  // ── Save proposal + move job to 'ready' ─────────────────
  const handleSaveProposal = async (job, proposalText) => {
    try {
      const res  = await fetch('http://localhost:5000/api/proposals/save', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          jobId:          job.id,
          content:        proposalText,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      // Refresh board so card moves to 'Proposal Ready' column
      await fetchJobs();
      setModalData(null);
    } catch (err) {
      alert(`Failed to save proposal: ${err.message}`);
    }
  };

  // ── Mark job as 'applied' ────────────────────────────────
  const handleMarkApplied = async (jobId) => {
    try {
      await fetch(`http://localhost:5000/api/jobs/${jobId}/status`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: 'applied' }),
      });
      await fetchJobs();
    } catch (err) {
      console.error('[Dashboard] markApplied error:', err);
    }
  };

  // ── Filter jobs by column ─────────────────────────────────
  const jobsByStatus = (status) => jobs.filter(j => j.status === status);

  // ── LOADING STATE ────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">🎯</div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading jobs...</p>
        </div>
      </div>
    );
  }

  // ── ERROR STATE ───────────────────────────────────────────
  if (error) {
    return (
      <div
        className="rounded-xl border p-6 text-center"
        style={{ borderColor: '#ef4444', backgroundColor: '#1f0a0a' }}
      >
        <div className="text-3xl mb-2">⚠️</div>
        <p className="font-semibold text-red-400">{error}</p>
        <button
          onClick={fetchJobs}
          className="mt-4 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ backgroundColor: 'var(--accent)', color: 'var(--text-primary)' }}
        >
          Retry
        </button>
      </div>
    );
  }

  // ── KANBAN BOARD ─────────────────────────────────────────
  return (
    <>
      {/* Refresh button */}
      <div className="flex justify-between items-center mb-5">
        <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
          {jobs.length} jobs loaded · drag cards to move between columns
        </p>
        <button
          onClick={fetchJobs}
          className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
          style={{
            borderColor: 'var(--border)',
            color: 'var(--text-secondary)',
            backgroundColor: 'var(--bg-card)',
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* 3-Column Kanban */}
      <div className="flex flex-col lg:flex-row gap-5">
        {COLUMNS.map(col => (
          <div key={col.id} className="flex-1 flex flex-col gap-3 min-w-0">

            {/* Column Header */}
            <div
              className="flex items-center justify-between px-3 py-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border)',
              }}
            >
              <div>
                <h2 className="text-sm font-semibold" style={{ color: col.color }}>
                  {col.label}
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  {col.description}
                </p>
              </div>
              {/* Count badge */}
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'var(--bg-card)', color: col.color }}
              >
                {jobsByStatus(col.id).length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-3">
              {jobsByStatus(col.id).length === 0 ? (
                <div
                  className="rounded-xl border-2 border-dashed p-6 text-center"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <p className="text-xs" style={{ color: 'var(--accent)' }}>
                    No jobs here yet
                  </p>
                </div>
              ) : (
                jobsByStatus(col.id).map(job => (
                  <div key={job.id}>
                    <JobCard
                      job={job}
                      onGenerateProposal={handleGenerateProposal}
                      isGenerating={generatingId === job.id}
                    />
                    {/* "Mark Applied" button for ready column */}
                    {job.status === 'ready' && (
                      <button
                        onClick={() => {
                          setModalData({
                            job,
                            proposalText: job.proposal?.content || '',
                            isMock: false,
                            viewOnly: true,
                          });
                        }}
                        className="w-full mt-1 text-xs py-1.5 rounded-lg border transition-colors"
                        style={{
                          borderColor: 'var(--warning)',
                          color: 'var(--warning)',
                          backgroundColor: 'transparent',
                        }}
                      >
                        👁 View Proposal
                      </button>
                    )}
                    {job.status === 'applied' && (
                      <p className="text-center text-xs mt-1" style={{ color: 'var(--success)' }}>
                        ✅ Submitted
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Proposal Modal */}
      {modalData && (
        <ProposalModal
          job={modalData.job}
          proposalText={modalData.proposalText}
          isMock={modalData.isMock}
          viewOnly={modalData.viewOnly}
          onSave={handleSaveProposal}
          onMarkApplied={handleMarkApplied}
          onClose={() => setModalData(null)}
        />
      )}
    </>
  );
}

export default Dashboard;