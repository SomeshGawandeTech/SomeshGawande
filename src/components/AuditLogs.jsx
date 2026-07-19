import React, { useState } from 'react';
import { ShieldCheck, Download, Trash2, Search, Filter } from 'lucide-react';

export default function AuditLogs({ logs, onClearLogs }) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.details.toLowerCase().includes(search.toLowerCase()) || 
                          log.type.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterType === 'all' || log.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleExportLogs = () => {
    if (filteredLogs.length === 0) return;
    const content = filteredLogs.map(log => 
      `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.details}`
    ).join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `redunshield_audit_logs_${Date.now()}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getLogBadgeStyle = (type) => {
    switch (type) {
      case 'Ingestion Blocked':
        return { backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.25)' };
      case 'Profile Merged':
        return { backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#c084fc', border: '1px solid rgba(139,92,246,0.25)' };
      case 'Manual Override':
      case 'Bypass Approved':
        return { backgroundColor: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.25)' };
      case 'Record Appended':
        return { backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' };
      default:
        return { backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' };
    }
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 className="section-title" style={{ margin: 0 }}>
          <ShieldCheck size={20} style={{ color: 'var(--color-success)' }} />
          Security Audit Logs & Integrity History
        </h2>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={handleExportLogs} 
            className="btn-secondary" 
            style={{ fontSize: '0.8rem' }}
            disabled={filteredLogs.length === 0}
          >
            <Download size={12} />
            Export Logs
          </button>
          <button 
            onClick={onClearLogs} 
            className="btn-danger" 
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
            disabled={logs.length === 0}
          >
            <Trash2 size={12} />
            Clear Logs
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="db-controls">
        <div className="search-wrapper">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search audit trail..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input search-input"
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={14} style={{ color: 'var(--text-secondary)' }} />
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="form-input"
            style={{ width: '180px', padding: '0.5rem 1rem' }}
          >
            <option value="all">All Events</option>
            <option value="Record Appended">Record Appended</option>
            <option value="Ingestion Blocked">Ingestion Blocked</option>
            <option value="Profile Merged">Profile Merged</option>
            <option value="Bypass Approved">Bypass Approved</option>
            <option value="Record Deleted">Record Deleted</option>
            <option value="Bulk Batch Processed">Bulk Batch Processed</option>
          </select>
        </div>
      </div>

      {/* Logs Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '450px', overflowY: 'auto', paddingRight: '0.5rem' }}>
        {filteredLogs.length === 0 ? (
          <div className="empty-state" style={{ padding: '3rem 1rem' }}>
            <ShieldCheck size={36} className="empty-icon" style={{ opacity: 0.4 }} />
            <span>Audit log is currently empty.</span>
          </div>
        ) : (
          filteredLogs.map(log => (
            <div key={log.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', padding: '0.85rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge" style={getLogBadgeStyle(log.type)}>
                  {log.type}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                {log.details}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
