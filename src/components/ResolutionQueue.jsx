import React from 'react';
import { AlertTriangle, HelpCircle, Check, ArrowRight, X } from 'lucide-react';
import { getJaroWinklerSimilarity } from '../utils/dedupEngine';

export default function ResolutionQueue({ queue, onResolve }) {
  
  if (queue.length === 0) {
    return (
      <div className="card">
        <div className="empty-state">
          <AlertTriangle size={40} className="empty-icon" style={{ color: 'var(--color-success)', opacity: 0.8 }} />
          <h3>Resolution Queue Clear</h3>
          <p style={{ fontSize: '0.85rem' }}>No pending near-duplicates require review.</p>
        </div>
      </div>
    );
  }

  // Helper to check similarity for inline highlighting
  const getFieldHighlightClass = (val1, val2) => {
    if (!val1 && !val2) return 'compare-value';
    if (!val1 || !val2) return 'compare-value highlight';
    const sim = getJaroWinklerSimilarity(val1, val2);
    return sim < 0.95 ? 'compare-value highlight' : 'compare-value';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="card" style={{ paddingBottom: '0.5rem' }}>
        <h2 className="section-title">
          <AlertTriangle size={20} style={{ color: 'var(--color-warning)' }} />
          Fuzzy Resolution Queue ({queue.length} items pending)
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '-0.5rem', marginBottom: '1rem' }}>
          Review potential duplicates where the matching engine identified high similarity.
        </p>
      </div>

      <div className="resolution-grid">
        {queue.map((task) => {
          const inc = task.incoming;
          const ext = task.existing;
          const nameClass = getFieldHighlightClass(inc.name, ext.name);
          const emailClass = getFieldHighlightClass(inc.email, ext.email);
          const phoneClass = getFieldHighlightClass(inc.phone, ext.phone);
          const compClass = getFieldHighlightClass(inc.company, ext.company);
          const addrClass = getFieldHighlightClass(inc.address, ext.address);

          return (
            <div key={task.id} className="card" style={{ borderLeft: '4px solid var(--color-warning)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="badge" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
                    Match Confidence: {(task.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {task.id}</div>
              </div>

              {/* Bullet points detailing matches */}
              <div style={{ marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {task.reasons.map((reason, rIdx) => (
                  <div key={rIdx}>⚠️ {reason}</div>
                ))}
              </div>

              {/* Comparison pane */}
              <div className="compare-cards">
                {/* Existing record */}
                <div className="compare-card">
                  <div className="compare-header">Database Record (Existing)</div>
                  
                  <div className="compare-row">
                    <span className="compare-label">Name</span>
                    <span className="compare-value">{ext.name}</span>
                  </div>
                  <div className="compare-row">
                    <span className="compare-label">Email</span>
                    <span className="compare-value">{ext.email || '—'}</span>
                  </div>
                  <div className="compare-row">
                    <span className="compare-label">Phone</span>
                    <span className="compare-value">{ext.phone || '—'}</span>
                  </div>
                  <div className="compare-row">
                    <span className="compare-label">Company</span>
                    <span className="compare-value">{ext.company || '—'}</span>
                  </div>
                  <div className="compare-row">
                    <span className="compare-label">Address</span>
                    <span className="compare-value" style={{ fontSize: '0.75rem' }}>{ext.address || '—'}</span>
                  </div>
                </div>

                {/* Incoming record */}
                <div className="compare-card incoming">
                  <div className="compare-header" style={{ color: 'var(--color-warning)' }}>Staged Record (Incoming)</div>
                  
                  <div className="compare-row">
                    <span className="compare-label">Name</span>
                    <span className={nameClass}>{inc.name}</span>
                  </div>
                  <div className="compare-row">
                    <span className="compare-label">Email</span>
                    <span className={emailClass}>{inc.email || '—'}</span>
                  </div>
                  <div className="compare-row">
                    <span className="compare-label">Phone</span>
                    <span className={phoneClass}>{inc.phone || '—'}</span>
                  </div>
                  <div className="compare-row">
                    <span className="compare-label">Company</span>
                    <span className={compClass}>{inc.company || '—'}</span>
                  </div>
                  <div className="compare-row">
                    <span className="compare-label">Address</span>
                    <span className={addrClass} style={{ fontSize: '0.75rem' }}>{inc.address || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Merge Actions */}
              <div className="resolution-actions">
                <button 
                  onClick={() => onResolve(task.id, 'discard')} 
                  className="btn-secondary" 
                  style={{ fontSize: '0.85rem' }}
                >
                  <X size={14} /> Discard Staged
                </button>
                
                <button 
                  onClick={() => onResolve(task.id, 'bypass')} 
                  className="btn-secondary" 
                  style={{ fontSize: '0.85rem', borderColor: 'var(--accent-secondary)', color: 'var(--accent-secondary)' }}
                >
                  <HelpCircle size={14} /> Keep Both (False Positive)
                </button>
                
                <button 
                  onClick={() => onResolve(task.id, 'merge')} 
                  className="btn-primary" 
                  style={{ fontSize: '0.85rem', width: 'auto', padding: '0.5rem 1rem' }}
                >
                  <Check size={14} /> Merge & Update
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
