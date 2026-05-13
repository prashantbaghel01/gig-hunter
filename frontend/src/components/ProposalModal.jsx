import React, { useState } from 'react';

function ProposalModal({ job, proposalText, isMock, viewOnly, onSave, onMarkApplied, onClose }) {
  const [text,     setText]     = useState(proposalText);
  const [copied,   setCopied]   = useState(false);
  const [saving,   setSaving]   = useState(false);

  // ── Copy to clipboard ────────────────────────────────────
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // ── Save proposal to DB ──────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(job, text);
    } finally {
      setSaving(false);
    }
  };

  // ── Mark as applied ──────────────────────────────────────
  const handleApplied = async () => {
    await onMarkApplied(job.id);
    onClose();
  };

  // Word count helper
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal Box */}
      <div
        className="w-full max-w-2xl rounded-2xl border flex flex-col gap-0 overflow-hidden shadow-2xl"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor:     'var(--border)',
          maxHeight:       '90vh',
        }}
      >

        {/* ── HEADER ── */}
        <div
          className="flex items-start justify-between px-6 py-4 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">✨</span>
              <h2
                className="font-bold text-base"
                style={{ color: 'var(--text-primary)' }}
              >
                {viewOnly ? 'Your Proposal' : 'Generated Proposal'}
              </h2>
              {isMock && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: '#1c1f2e', color: 'var(--warning)' }}
                >
                  🎭 Mock
                </span>
              )}
            </div>
            <p
              className="text-xs line-clamp-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              {job.title} · {job.platform} · {job.pay || 'Open Budget'}
            </p>
          </div>
          {/* Close button */}
          <button
            onClick={onClose}
            className="text-lg leading-none px-2 py-1 rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => e.target.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
          >
            ✕
          </button>
        </div>

        {/* ── PROPOSAL TEXTAREA ── */}
        <div className="px-6 py-4 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <label
              className="text-xs font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              {viewOnly ? 'Proposal Text' : 'Edit before sending:'}
            </label>
            <span
              className="text-xs"
              style={{
                color: wordCount >= 140 && wordCount <= 160
                  ? 'var(--success)'
                  : 'var(--warning)',
              }}
            >
              {wordCount} words
            </span>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            readOnly={viewOnly}
            rows={10}
            className="w-full rounded-xl border p-4 text-sm leading-relaxed resize-none outline-none transition-colors"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor:     'var(--border)',
              color:           'var(--text-primary)',
              fontFamily:      'inherit',
            }}
            onFocus={e  => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e   => e.target.style.borderColor = 'var(--border)'}
          />

          {/* Mock mode notice */}
          {isMock && (
            <p
              className="mt-2 text-xs"
              style={{ color: 'var(--accent)' }}
            >
              💡 This is a mock proposal (MOCK_AI=true). Set MOCK_AI=false and add your OpenAI key for real GPT-4o proposals.
            </p>
          )}
        </div>

        {/* ── FOOTER ACTIONS ── */}
        <div
          className="px-6 py-4 border-t flex flex-col sm:flex-row items-center gap-3"
          style={{ borderColor: 'var(--border)' }}
        >

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all"
            style={{
              borderColor:     copied ? 'var(--success)' : 'var(--border)',
              color:           copied ? 'var(--success)' : 'var(--text-secondary)',
              backgroundColor: 'transparent',
            }}
          >
            {copied ? '✅ Copied!' : '📋 Copy to Clipboard'}
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Mark Applied (only in viewOnly / ready state) */}
          {viewOnly && job.status === 'ready' && (
            <button
              onClick={handleApplied}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                backgroundColor: '#052e16',
                color:           'var(--success)',
                border:          '1px solid var(--success)',
              }}
            >
              ✅ Mark as Applied
            </button>
          )}

          {/* Save button (only when freshly generated) */}
          {!viewOnly && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
              style={{
                backgroundColor: saving ? 'var(--accent)' : 'var(--accent)',
                color:           'var(--text-primary)',
              }}
              onMouseEnter={e => !saving && (e.target.style.backgroundColor = 'var(--accent-hover)')}
              onMouseLeave={e => !saving && (e.target.style.backgroundColor = 'var(--accent)')}
            >
              {saving ? '⏳ Saving...' : '💾 Save Proposal'}
            </button>
          )}

        </div>
      </div>
    </div>
  );
}

export default ProposalModal;