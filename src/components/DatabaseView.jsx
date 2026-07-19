import React, { useState } from 'react';
import { Search, Download, Trash2, Database, Sparkles, Filter } from 'lucide-react';

export default function DatabaseView({ database, onDeleteRecord }) {
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');

  const sources = ['all', ...new Set(database.map(r => r.source).filter(Boolean))];

  const filteredDB = database.filter(record => {
    const matchesSearch = 
      (record.name && record.name.toLowerCase().includes(search.toLowerCase())) ||
      (record.email && record.email.toLowerCase().includes(search.toLowerCase())) ||
      (record.phone && record.phone.includes(search)) ||
      (record.company && record.company.toLowerCase().includes(search.toLowerCase())) ||
      (record.address && record.address.toLowerCase().includes(search.toLowerCase()));

    const matchesFilter = sourceFilter === 'all' || record.source === sourceFilter;

    return matchesSearch && matchesFilter;
  });

  const handleExportCSV = () => {
    if (filteredDB.length === 0) return;
    
    // Headers
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Company', 'Address', 'Source', 'Date Added'];
    const rows = filteredDB.map(r => [
      r.id,
      r.name,
      r.email || '',
      r.phone || '',
      r.company || '',
      r.address || '',
      r.source || 'Unknown',
      r.dateAdded || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `data_redundancy_removal_export_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 className="section-title" style={{ margin: 0 }}>
          <Database size={20} style={{ color: 'var(--accent-secondary)' }} />
          Cloud Database Console ({filteredDB.length} records shown)
        </h2>
        <button 
          onClick={handleExportCSV} 
          className="btn-secondary" 
          style={{ fontSize: '0.85rem' }}
          disabled={filteredDB.length === 0}
        >
          <Download size={14} />
          Export to CSV
        </button>
      </div>

      {/* Controls */}
      <div className="db-controls">
        <div className="search-wrapper">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search records by name, email, phone..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input search-input"
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={14} style={{ color: 'var(--text-secondary)' }} />
          <select 
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="form-input"
            style={{ width: '180px', padding: '0.5rem 1rem' }}
          >
            {sources.map(src => (
              <option key={src} value={src}>
                {src === 'all' ? 'All Sources' : src}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        {filteredDB.length === 0 ? (
          <div className="empty-state">
            <Database size={40} className="empty-icon" style={{ marginBottom: '0.5rem' }} />
            <h3>No Records Found</h3>
            <p style={{ fontSize: '0.85rem' }}>The database is empty or matches no search criteria.</p>
          </div>
        ) : (
          <table className="db-table">
            <thead>
              <tr>
                <th>UID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Company / Org</th>
                <th>Verification Status</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDB.map((record) => (
                <tr key={record.id}>
                  <td className="row-id">{record.id.replace('rec_', '')}</td>
                  <td style={{ fontWeight: '600' }}>{record.name}</td>
                  <td>{record.email || '—'}</td>
                  <td>{record.phone || '—'}</td>
                  <td>{record.company || '—'}</td>
                  <td>
                    {record.bypassLabel ? (
                      <span className="badge bypassed">
                        <Sparkles size={10} style={{ marginRight: '0.25rem' }} />
                        {record.bypassLabel}
                      </span>
                    ) : (
                      <span className="badge verified">Verified Unique</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      onClick={() => onDeleteRecord(record.id)} 
                      className="action-icon"
                      title="Delete Record"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
