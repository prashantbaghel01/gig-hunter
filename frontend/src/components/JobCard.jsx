import React from 'react';

// Platform badge colors
const PLATFORM_COLORS = {
  Upwork:     { bg: '#14532d', text: '#4ade80' },
  Fiverr:     { bg: '#1a1a2e', text: '#a78bfa' },
  Freelancer: { bg: '#1e3a5f', text: '#60a5fa' },
  Toptal:     { bg: '#3b1f1f', text: '#f87171' },
  'Remote.co':{ bg: '#1c2c1c', text: '#34d399' },
};

function JobCard({ job, onGenerateProposal, isGenerating }) {
  const platformStyle = PLATFORM_COLORS[job.platform] || {
    bg: '#1e2433',
    text: '#cbd5e1',
  };

  return (
    <div
      className="rounded-xl border p-4 flex flex-col gap-3 transition-all duration-200 hover:scale-[1.01] hover:shadow-lg"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border)',
      }}
    >
      {/* ── TOP ROW: Platform badge + Pay ── */}
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: platformStyle.bg,
            color: platformStyle.text,
          }}
        >
          {job.platform}
        </span>
        <span
          className="text-sm font-bold"
          style={{ color: 'var(--success)' }}
        >
          {job.pay || 'Open Budget'}
        </span>
      </div>

      {/* ── JOB TITLE ── */}
      <h3
        className="font-semibold text-sm leading-snug line-clamp-2"
        style={{ color: 'var(--text-primary)' }}
      >
        {job.title}
      </h3>

      {/* ── DESCRIPTION SNIPPET ── */}
      <p
        className="text-xs leading-relaxed line-clamp-3"
        style={{ color: 'var(--text-secondary)' }}
      >
        {job.description || 'No description provided.'}
      </p>

      {/* ── SKILLS TAGS ── */}
      {job.skills && job.skills.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {job.skills.slice(0, 3).map((skill, i) => (
            <span
              key={i}
              className="text-xs px-2 py-0.5 rounded border"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border)',
                color: 'var(--text-secondary)',
              }}
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* ── FOOTER: Time posted + Button ── */}
      <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
        <span
          className="text-xs"
          style={{ color: 'var(--accent)' }}
        >
          {job.postedAt
            ? timeAgo(job.postedAt)
            : 'Recently posted'}
        </span>

        {/* Show different button states based on job status */}
        {job.status === 'new' && (
          <button
            onClick={() => onGenerateProposal(job)}
            disabled={isGenerating}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: isGenerating ? 'var(--accent)' : 'var(--accent)',
              color: 'var(--text-primary)',
            }}
            onMouseEnter={e => e.target.style.backgroundColor = 'var(--accent-hover)'}
            onMouseLeave={e => e.target.style.backgroundColor = 'var(--accent)'}
          >
            {isGenerating ? '⏳ Generating...' : '✨ Generate Proposal'}
          </button>
        )}

        {job.status === 'ready' && (
          <span
            className="text-xs font-semibold px-3 py-1.5 rounded-lg"
            style={{
              backgroundColor: '#451a03',
              color: 'var(--warning)',
            }}
          >
            📄 Proposal Ready
          </span>
        )}

        {job.status === 'applied' && (
          <span
            className="text-xs font-semibold px-3 py-1.5 rounded-lg"
            style={{
              backgroundColor: '#052e16',
              color: 'var(--success)',
            }}
          >
            ✅ Applied
          </span>
        )}
      </div>
    </div>
  );
}

// Helper: turns ISO date into "2 hours ago" style
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 60)  return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  return `${days}d ago`;
}

export default JobCard;