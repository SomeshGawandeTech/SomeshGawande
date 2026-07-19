import React from 'react';
import { Settings, RefreshCw, Info, HelpCircle } from 'lucide-react';

export default function SettingsPanel({ config, onChangeConfig }) {
  
  const handleSliderChange = (e) => {
    const { name, value } = e.target;
    onChangeConfig({
      ...config,
      [name]: parseFloat(value)
    });
  };

  const handleToggleChange = (e) => {
    const { name, checked } = e.target;
    onChangeConfig({
      ...config,
      [name]: checked
    });
  };

  const handleReset = () => {
    onChangeConfig({
      nameThreshold: 0.85,
      contactThreshold: 0.80,
      enablePhonetic: true,
      strictGmail: true
    });
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="section-title" style={{ margin: 0 }}>
          <Settings size={20} style={{ color: 'var(--accent-primary)' }} />
          Deduplication Engine Control Panel
        </h2>
        <button onClick={handleReset} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
          <RefreshCw size={12} />
          Reset Defaults
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Sliders Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Slider 1: Name Jaro-Winkler Threshold */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span className="form-label" style={{ margin: 0, fontWeight: '600' }}>Name Jaro-Winkler Threshold</span>
              <span style={{ fontSize: '0.9rem', color: 'var(--accent-primary)', fontWeight: '700' }}>
                {(config.nameThreshold * 100).toFixed(0)}%
              </span>
            </div>
            <input 
              type="range" 
              name="nameThreshold" 
              min="0.70" 
              max="0.99" 
              step="0.01" 
              value={config.nameThreshold}
              onChange={handleSliderChange}
              style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
              Min similarity score required to mark two names as similar (e.g. typos, nick names). Lower values trigger more duplicate warnings.
            </span>
          </div>

          {/* Slider 2: Contact Threshold */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span className="form-label" style={{ margin: 0, fontWeight: '600' }}>Contact Similarity (Email/Phone)</span>
              <span style={{ fontSize: '0.9rem', color: 'var(--accent-secondary)', fontWeight: '700' }}>
                {(config.contactThreshold * 100).toFixed(0)}%
              </span>
            </div>
            <input 
              type="range" 
              name="contactThreshold" 
              min="0.60" 
              max="0.99" 
              step="0.01" 
              value={config.contactThreshold}
              onChange={handleSliderChange}
              style={{ width: '100%', accentColor: 'var(--accent-secondary)' }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
              Controls the string match tolerance for phone typos, emails, and address points.
            </span>
          </div>
        </div>

        {/* Toggles Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Toggle 1: Enable Phonetic (Soundex) */}
          <div style={{ display: 'flex', gap: '1rem', background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <input 
              type="checkbox" 
              id="enablePhonetic" 
              name="enablePhonetic" 
              checked={config.enablePhonetic}
              onChange={handleToggleChange}
              style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
            />
            <div>
              <label htmlFor="enablePhonetic" style={{ fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', display: 'block', marginBottom: '0.25rem' }}>
                Phonetic Soundex Matcher
              </label>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Identifies phonetically identical spelling variations (e.g. John/Jon, Smith/Smyth) and flags them even if strict character similarity is low.
              </span>
            </div>
          </div>

          {/* Toggle 2: strictGmail Normalization */}
          <div style={{ display: 'flex', gap: '1rem', background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <input 
              type="checkbox" 
              id="strictGmail" 
              name="strictGmail" 
              checked={config.strictGmail}
              onChange={handleToggleChange}
              style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--accent-secondary)' }}
            />
            <div>
              <label htmlFor="strictGmail" style={{ fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', display: 'block', marginBottom: '0.25rem' }}>
                Strict Gmail Sub-Addressing Cleanse
              </label>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Removes dots and plus-tags from Gmail local parts (e.g. `j.doe+test@gmail.com` maps to `jdoe@gmail.com`) to block tag-based duplicate bypasses.
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '10px', border: '1px solid rgba(59, 130, 246, 0.2)', fontSize: '0.85rem', display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
        <Info size={18} style={{ color: '#60a5fa', flexShrink: 0, marginTop: '0.1rem' }} />
        <div style={{ lineHeight: '1.4', color: '#93c5fd' }}>
          <strong>Real-Time Configuration Feedback:</strong> Modifying these settings will immediately alter the active rule triggers of the Ingestion Gateway and the Bulk CSV analyzer. Values are synchronized to local storage.
        </div>
      </div>
    </div>
  );
}
