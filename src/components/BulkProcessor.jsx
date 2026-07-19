import React, { useState } from 'react';
import { UploadCloud, CheckCircle, AlertTriangle, ShieldX, Play, FileSpreadsheet } from 'lucide-react';
import { validateEntry } from '../utils/dedupEngine';

export default function BulkProcessor({ database, onAppendMultiple, onQueueMultipleForResolution, incrementStatsBy, config }) {
  const [fileData, setFileData] = useState(null);
  const [report, setReport] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const demoCSV = `Name,Email,Phone,Company,Address
Alex Mercer,alex.mercer@gmail.com,+1 (555) 123-4567,Mercer Labs,123 Pine St, Seattle
Alex Mencer,alex.mercer@gamil.com,+1 (555) 123-4567,Mercer Labs,123 Pine St, Seattle
Sarah Connor,sarah.c@sky.net,+1 (310) 999-8888,Cyberdyne,Tech Way, LA
Alex Mercer,alex.mercer.architect@yahoo.com,+1 (415) 777-8888,Global Arch,Denver, CO
Tony Stark,tony@stark.com,+1 (800) 478-2757,Stark Industries,Malibu, CA
Tony Starek,tony@stark.com,+1 (800) 478-2757,Stark Industries,Malibu, CA
Bruce Wayne,bruce@waynecorp.com,+1 (555) 999-1111,Wayne Enterprises,Gotham City`;

  const handleLoadDemo = () => {
    parseCSVText(demoCSV, 'demo_dataset.csv');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      parseCSVText(evt.target.result, file.name);
    };
    reader.readAsText(file);
  };

  const parseCSVText = (text, fileName) => {
    setReport(null);
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return;

    // Very basic CSV parser
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const records = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map(p => p.trim());
      const record = {};
      headers.forEach((header, index) => {
        record[header] = parts[index] || '';
      });
      records.push(record);
    }

    setFileData({
      fileName,
      totalRows: records.length,
      records
    });
  };

  const handleProcess = () => {
    if (!fileData || isProcessing) return;

    setIsProcessing(true);

    setTimeout(() => {
      const records = fileData.records;
      
      const exactDuplicates = [];
      const fuzzyDuplicates = [];
      const falsePositives = [];
      const uniqueRecords = [];

      let currentDB = [...database];
      const itemsToAppend = [];
      const itemsToQueue = [];

      records.forEach((record, index) => {
        // Map keys if needed (name, email, phone, company, address)
        const item = {
          name: record.name || record.fullname || '',
          email: record.email || '',
          phone: record.phone || record.telephone || '',
          company: record.company || record.org || '',
          address: record.address || record.location || ''
        };

        // Validate against cumulative DB
        const res = validateEntry(item, [...currentDB, ...itemsToAppend], config);

        if (res.status === 'duplicate') {
          exactDuplicates.push({ item, matched: res.matchedRecord, reason: res.reasons[0] });
        } else if (res.status === 'suspected_duplicate') {
          fuzzyDuplicates.push({ item, matched: res.matchedRecord, confidence: res.confidence, reasons: res.reasons });
          // Queue for manual resolution
          itemsToQueue.push({
            id: `res_bulk_${Date.now()}_${index}`,
            incoming: item,
            existing: res.matchedRecord,
            confidence: res.confidence,
            reasons: res.reasons
          });
        } else if (res.status === 'false_positive_bypass') {
          falsePositives.push({ item, matched: res.matchedRecord, reason: res.reasons[0] });
          // Auto ingest false positives
          const newItem = {
            ...item,
            id: `rec_bulk_${Date.now()}_${index}_fp`,
            source: 'Bulk CSV Ingest',
            dateAdded: new Date().toISOString(),
            bypassLabel: 'Verified FP'
          };
          itemsToAppend.push(newItem);
        } else {
          uniqueRecords.push({ item });
          // Auto ingest unique entries
          const newItem = {
            ...item,
            id: `rec_bulk_${Date.now()}_${index}`,
            source: 'Bulk CSV Ingest',
            dateAdded: new Date().toISOString()
          };
          itemsToAppend.push(newItem);
        }
      });

      // Commit changes to main state
      if (itemsToAppend.length > 0) {
        onAppendMultiple(itemsToAppend);
      }
      if (itemsToQueue.length > 0) {
        onQueueMultipleForResolution(itemsToQueue);
      }

      // Update statistics
      incrementStatsBy('totalAttempts', records.length);
      incrementStatsBy('duplicatesBlocked', exactDuplicates.length);

      setReport({
        total: records.length,
        exact: exactDuplicates,
        fuzzy: fuzzyDuplicates,
        falsePositives: falsePositives,
        unique: uniqueRecords
      });

      setIsProcessing(false);
      setFileData(null); // Clear stage
    }, 1500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h2 className="section-title">
          <UploadCloud size={20} style={{ color: 'var(--accent-primary)' }} />
          Batch Ingestion & Deduplication
        </h2>

        {/* Drag and Drop Zone Simulator */}
        <div className="dropzone">
          <FileSpreadsheet size={48} className="dropzone-icon" />
          <div>
            <h3 style={{ marginBottom: '0.25rem' }}>Upload CSV / JSON Database</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Select a file or drag it here to analyze potential database conflicts.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <input 
              type="file" 
              id="csvFile" 
              accept=".csv,.json" 
              onChange={handleFileChange} 
              style={{ display: 'none' }} 
            />
            <label htmlFor="csvFile" className="btn-secondary" style={{ cursor: 'pointer' }}>
              Select File
            </label>
            
            <button type="button" className="btn-primary" onClick={handleLoadDemo}>
              Load Simulation Dataset
            </button>
          </div>
        </div>

        {/* File Staged Screen */}
        {fileData && (
          <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: '600' }}>📄 {fileData.fileName}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Ready to process {fileData.totalRows} record entries.</div>
            </div>
            <button onClick={handleProcess} className="btn-primary" style={{ width: 'auto' }} disabled={isProcessing}>
              {isProcessing ? 'Processing batch...' : 'Execute Deduplication Run'}
            </button>
          </div>
        )}
      </div>

      {/* Batch Processing Report */}
      {report && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h2 className="section-title" style={{ margin: 0 }}>
            Batch Execution Report
          </h2>

          <div className="bulk-stats-grid">
            <div className="bulk-stat">
              <span className="bulk-stat-label">Total Rows</span>
              <div className="bulk-stat-value">{report.total}</div>
            </div>
            <div className="bulk-stat">
              <span className="bulk-stat-label">Exact Duplicates (Skipped)</span>
              <div className="bulk-stat-value danger">{report.exact.length}</div>
            </div>
            <div className="bulk-stat">
              <span className="bulk-stat-label">Fuzzy Flagged (Pending Review)</span>
              <div className="bulk-stat-value warning">{report.fuzzy.length}</div>
            </div>
            <div className="bulk-stat">
              <span className="bulk-stat-label">Verified Unique (Ingested)</span>
              <div className="bulk-stat-value success">{report.unique.length + report.falsePositives.length}</div>
            </div>
          </div>

          {/* Details list */}
          <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.5rem' }}>
            <table className="db-table">
              <thead>
                <tr>
                  <th>Row Record</th>
                  <th>Identified Conflict</th>
                  <th>Classification Decision</th>
                </tr>
              </thead>
              <tbody>
                {report.unique.map((item, idx) => (
                  <tr key={`u-${idx}`}>
                    <td>{item.item.name} ({item.item.email || 'No email'})</td>
                    <td style={{ color: 'var(--text-muted)' }}>None</td>
                    <td>
                      <span className="badge verified" style={{ display: 'inline-flex', gap: '0.25rem', alignItems: 'center' }}>
                        <CheckCircle size={10} /> Auto-Ingested (Unique)
                      </span>
                    </td>
                  </tr>
                ))}
                {report.falsePositives.map((item, idx) => (
                  <tr key={`fp-${idx}`}>
                    <td>{item.item.name} ({item.item.email || 'No email'})</td>
                    <td style={{ color: 'var(--text-secondary)' }}>Fuzzy match: "{item.matched.name}"</td>
                    <td>
                      <span className="badge bypassed" style={{ display: 'inline-flex', gap: '0.25rem', alignItems: 'center' }}>
                        <CheckCircle size={10} /> Auto-Bypassed (False Positive)
                      </span>
                    </td>
                  </tr>
                ))}
                {report.fuzzy.map((item, idx) => (
                  <tr key={`f-${idx}`}>
                    <td style={{ color: 'var(--color-warning)' }}>{item.item.name} ({item.item.email || 'No email'})</td>
                    <td style={{ color: 'var(--color-warning)' }}>Matched record: "{item.matched.name}" (confidence {(item.confidence * 100).toFixed(0)}%)</td>
                    <td>
                      <span className="badge" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' }}>
                        ⚠️ Queued for Review
                      </span>
                    </td>
                  </tr>
                ))}
                {report.exact.map((item, idx) => (
                  <tr key={`e-${idx}`}>
                    <td style={{ color: 'var(--color-danger)' }}>{item.item.name} ({item.item.email || 'No email'})</td>
                    <td style={{ color: 'var(--color-danger)' }}>{item.reason}</td>
                    <td>
                      <span className="badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' }}>
                        <ShieldX size={10} style={{ marginRight: '0.25rem' }} /> Rejected (Duplicate)
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
