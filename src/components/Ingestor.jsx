import React, { useState, useEffect, useRef } from 'react';
import { validateEntry } from '../utils/dedupEngine';
import { PlusCircle, Search, ShieldAlert, CheckCircle2, AlertTriangle, Play, HelpCircle } from 'lucide-react';

export default function Ingestor({ database, onAppend, onQueueForResolution, incrementStats, config }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: ''
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [traceLogs, setTraceLogs] = useState([]);
  const [result, setResult] = useState(null);
  const intervalRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAutofill = (type) => {
    if (type === 'duplicate_email') {
      setForm({
        name: 'Jane Doe',
        email: database[0]?.email || 'alex.mercer@gmail.com', // use first in db or fallback
        phone: '+1 (555) 987-6543',
        company: 'Vertex Corp',
        address: '456 Oak Avenue, San Francisco, CA'
      });
    } else if (type === 'fuzzy_name') {
      const baseName = database[0]?.name || 'Alex Mercer';
      // Introduce subtle typo: e.g. "Allex Mercer"
      const typoName = baseName.replace(/x/g, 'xx').replace(/c/g, 's');
      setForm({
        name: typoName,
        email: 'alex.mercer.dev@outlook.com', // different email but close name
        phone: database[0]?.phone || '+1 (555) 123-4567', // same phone to trigger fuzzy match
        company: 'Mercer Labs',
        address: '123 Pine St, Seattle'
      });
    } else if (type === 'false_positive') {
      const baseName = database[0]?.name || 'Alex Mercer';
      setForm({
        name: baseName, // exact same name
        email: 'completely.different.person@yahoo.com', // different email
        phone: '+1 (415) 777-8888', // different phone
        company: 'Alt Company',
        address: '999 Redwood Blvd, Denver, CO'
      });
    } else if (type === 'unique') {
      const rand = Math.floor(Math.random() * 1000);
      setForm({
        name: `Elena Rostova ${rand}`,
        email: `elena.rostova.${rand}@gmail.com`,
        phone: `+1 (650) 444-${String(rand).padStart(4, '0')}`,
        company: 'Stark Industries',
        address: '10880 Wilshire Blvd, Los Angeles'
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setIsProcessing(true);
    setResult(null);
    setTraceLogs([]);
    setCurrentStepIndex(-1);

    // Call engine to get validation report
    const report = validateEntry(form, database, config);
    
    // Simulate real-time trace stepping with timeouts to create a beautiful live feedback trace
    let index = 0;
    intervalRef.current = setInterval(() => {
      if (index < report.traceSteps.length) {
        setTraceLogs(prev => [...prev, report.traceSteps[index]]);
        setCurrentStepIndex(index);
        index++;
      } else {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setResult(report);
        setIsProcessing(false);
        
        // Auto-action if safe
        if (report.status === 'unique') {
          onAppend({ ...form, id: `rec_${Date.now()}`, source: 'Real-time Ingest', dateAdded: new Date().toISOString() });
          incrementStats('totalAttempts');
        } else if (report.status === 'duplicate') {
          incrementStats('totalAttempts');
          incrementStats('duplicatesBlocked');
        }
      }
    }, 600);
  };

  // Add the false positive manually if user overrides
  const handleForceAppend = () => {
    if (!result) return;
    onAppend({ 
      ...form, 
      id: `rec_${Date.now()}`, 
      source: 'FP Bypass Override', 
      dateAdded: new Date().toISOString(),
      bypassLabel: 'Verified FP'
    });
    incrementStats('totalAttempts');
    setResult(null);
    // Reset Form
    setForm({ name: '', email: '', phone: '', company: '', address: '' });
  };

  const handleQueueForReview = () => {
    if (!result) return;
    onQueueForResolution({
      id: `res_${Date.now()}`,
      incoming: form,
      existing: result.matchedRecord,
      confidence: result.confidence,
      reasons: result.reasons
    });
    incrementStats('totalAttempts');
    setResult(null);
    setForm({ name: '', email: '', phone: '', company: '', address: '' });
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="ingest-layout">
      {/* Ingestion Form */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h2 className="section-title">
          <PlusCircle size={20} style={{ color: 'var(--accent-primary)' }} />
          Real-Time Data Ingestion Gateway
        </h2>

        {/* Demo Quick Fills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', width: '100%' }}>Autofill Simulation Presets:</span>
          <button type="button" className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem' }} onClick={() => handleAutofill('unique')}>
            ✨ Unique Entry
          </button>
          <button type="button" className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem' }} onClick={() => handleAutofill('duplicate_email')}>
            🚨 Exact Duplicate
          </button>
          <button type="button" className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem' }} onClick={() => handleAutofill('fuzzy_name')}>
            ⚠️ Fuzzy Duplicate
          </button>
          <button type="button" className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem' }} onClick={() => handleAutofill('false_positive')}>
            🛡️ False Positive
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input 
              type="text" 
              name="name" 
              value={form.name} 
              onChange={handleInputChange} 
              className="form-input" 
              placeholder="e.g. John Doe"
              required 
              disabled={isProcessing}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input 
                type="email" 
                name="email" 
                value={form.email} 
                onChange={handleInputChange} 
                className="form-input" 
                placeholder="john@company.com"
                disabled={isProcessing}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input 
                type="text" 
                name="phone" 
                value={form.phone} 
                onChange={handleInputChange} 
                className="form-input" 
                placeholder="+1 (555) 000-0000"
                disabled={isProcessing}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Company / Organization</label>
            <input 
              type="text" 
              name="company" 
              value={form.company} 
              onChange={handleInputChange} 
              className="form-input" 
              placeholder="e.g. TechCorp"
              disabled={isProcessing}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Physical Address</label>
            <input 
              type="text" 
              name="address" 
              value={form.address} 
              onChange={handleInputChange} 
              className="form-input" 
              placeholder="e.g. 123 Main St, New York, NY"
              disabled={isProcessing}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={isProcessing || !form.name.trim()}>
            {isProcessing ? 'Verifying Integrity...' : 'Ingest and Validate'}
          </button>
        </form>
      </div>

      {/* Trace Log & Results Viewer */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="trace-panel">
          <h2 className="trace-title">
            <Search size={16} />
            Data Integrity Trace Log
          </h2>

          <div className="trace-container">
            {traceLogs.length === 0 && (
              <div className="empty-state" style={{ padding: '4rem 1rem' }}>
                <Play size={32} className="empty-icon" style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
                <span>Fill out the form and submit to execute the redundancy analyzer validation path.</span>
              </div>
            )}

            {traceLogs.map((step, idx) => {
              if (!step) return null;
              return (
                <div key={idx} className={`trace-step ${step.status || 'info'}`}>
                  <div className="trace-icon">
                    {step.status === 'info' && <Search size={14} />}
                    {step.status === 'success' && <CheckCircle2 size={14} />}
                    {step.status === 'warning' && <AlertTriangle size={14} />}
                    {step.status === 'danger' && <ShieldAlert size={14} />}
                  </div>
                  <div className="trace-details">
                    <span className="trace-step-name">{step.step}</span>
                    <span>{step.details}</span>
                  </div>
                </div>
              );
            })}
            
            {isProcessing && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
                <div className="logo-badge" style={{ animation: 'pulse-glow 1.5s infinite ease-in-out' }}>
                  Scanning database indices...
                </div>
              </div>
            )}
          </div>

          {/* Results Box */}
          {result && (
            <div className={`result-box ${result.status}`}>
              <div className="result-header">
                {result.status === 'unique' && (
                  <>
                    <CheckCircle2 size={20} style={{ color: 'var(--color-success)' }} />
                    <span style={{ color: 'var(--color-success)' }}>Ingested Successfully</span>
                  </>
                )}
                {result.status === 'duplicate' && (
                  <>
                    <ShieldAlert size={20} style={{ color: 'var(--color-danger)' }} />
                    <span style={{ color: 'var(--color-danger)' }}>Ingestion Blocked</span>
                  </>
                )}
                {result.status === 'suspected_duplicate' && (
                  <>
                    <AlertTriangle size={20} style={{ color: 'var(--color-warning)' }} />
                    <span style={{ color: 'var(--color-warning)' }}>Near-Duplicate Warning</span>
                  </>
                )}
                {result.status === 'false_positive_bypass' && (
                  <>
                    <HelpCircle size={20} style={{ color: 'var(--accent-secondary)' }} />
                    <span style={{ color: 'var(--accent-secondary)' }}>False Positive Identified</span>
                  </>
                )}
              </div>

              <div className="result-desc">
                {result.status === 'unique' && 'This profile is unique and has been safely appended to the cloud database.'}
                {result.status === 'duplicate' && (
                  <div>
                    Exact matching duplicate detected. Database integrity rules prevented insertion.
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '4px', marginTop: '0.5rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      Reason: {result.reasons[0]}
                    </div>
                  </div>
                )}
                {result.status === 'suspected_duplicate' && (
                  <div>
                    This entry shares significant similarities with an existing record.
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '4px', marginTop: '0.5rem', fontSize: '0.8rem' }}>
                      {result.reasons.map((r, i) => <div key={i}>• {r}</div>)}
                    </div>
                  </div>
                )}
                {result.status === 'false_positive_bypass' && (
                  <div>
                    A similar name was found, but contact points do not overlap. This is classified as a False Positive duplicate flag (i.e. separate unique person).
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '4px', marginTop: '0.5rem', fontSize: '0.8rem' }}>
                      Reason: {result.reasons[0]}
                    </div>
                  </div>
                )}
              </div>

              <div className="result-actions">
                {result.status === 'suspected_duplicate' && (
                  <>
                    <button type="button" className="btn-success" onClick={handleQueueForReview}>
                      Queue for Manual Review
                    </button>
                    <button type="button" className="btn-danger" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'white' }} onClick={() => setResult(null)}>
                      Discard
                    </button>
                  </>
                )}
                {result.status === 'false_positive_bypass' && (
                  <>
                    <button type="button" className="btn-success" onClick={handleForceAppend}>
                      Bypass & Ingest
                    </button>
                    <button type="button" className="btn-danger" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'white' }} onClick={() => setResult(null)}>
                      Discard
                    </button>
                  </>
                )}
                {result.status === 'unique' && (
                  <button type="button" className="btn-secondary" style={{ width: '100%' }} onClick={() => {
                    setResult(null);
                    setForm({ name: '', email: '', phone: '', company: '', address: '' });
                  }}>
                    Clear & Add Another
                  </button>
                )}
                {result.status === 'duplicate' && (
                  <button type="button" className="btn-secondary" style={{ width: '100%' }} onClick={() => setResult(null)}>
                    Acknowledge
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
