import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard.jsx';

function App() {
  const [stats, setStats] = useState({
    jobsFound: 0,
    proposalsMade: 0,
    applied: 0,
    wins: 0,
  });

  // Fetch stats from backend on load
  useEffect(() => {
    fetch('http://localhost:5000/api/proposals/stats')
      .then(res => res.json())
      .then(data => {
        if (data.success) setStats(data.stats);
      })
      .catch(() => {
        // Backend not running yet — use defaults
      });
  }, []);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* ── HEADER ── */}
      <header
        className="border-b"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

          {/* Logo + Title */}
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎯</span>
            <div>
              <h1
                className="text-xl font-bold tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                Gig Hunter
              </h1>
              <p
                className="text-xs"
                style={{ color: 'var(--text-secondary)' }}
              >
                Freelance Job Dashboard
              </p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center gap-4 flex-wrap">
            <StatPill label="Jobs Found"  value={stats.jobsFound}     color="var(--accent)"   />
            <StatPill label="Proposals"   value={stats.proposalsMade} color="var(--warning)"  />
            <StatPill label="Applied"     value={stats.applied}       color="var(--accent)"   />
            <StatPill label="Wins"        value={stats.wins}          color="var(--success)"  />
          </div>

        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        <Dashboard onStatsUpdate={setStats} />
      </main>
    </div>
  );
}

// Small reusable stat pill component
function StatPill({ label, value, color }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border)',
      }}
    >
      <span
        className="text-lg font-bold"
        style={{ color }}
      >
        {value}
      </span>
      <span
        className="text-xs"
        style={{ color: 'var(--text-secondary)' }}
      >
        {label}
      </span>
    </div>
  );
}

export default App;