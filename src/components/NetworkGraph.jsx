import React, { useState, useMemo } from 'react';
import { Share2, Info, Eye, Link2 } from 'lucide-react';
import { getJaroWinklerSimilarity, normalizeEmail, normalizePhone } from '../utils/dedupEngine';

export default function NetworkGraph({ database }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [minSimToShow, setMinSimToShow] = useState(0.70);

  const width = 800;
  const height = 500;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = 170;

  // 1. Position nodes in a circle
  const nodes = useMemo(() => {
    if (database.length === 0) return [];
    return database.map((record, index) => {
      const angle = (2 * Math.PI * index) / database.length;
      return {
        ...record,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      };
    });
  }, [database, centerX, centerY, radius]);

  // 2. Compute links between nodes based on matching fields or name similarity
  const links = useMemo(() => {
    const computedLinks = [];
    if (nodes.length < 2) return [];

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const n1 = nodes[i];
        const n2 = nodes[j];

        // Check relationship triggers
        const emailMatch = n1.email && n2.email && normalizeEmail(n1.email) === normalizeEmail(n2.email);
        const phoneMatch = n1.phone && n2.phone && normalizePhone(n1.phone) === normalizePhone(n2.phone);
        const nameSim = getJaroWinklerSimilarity(n1.name, n2.name);

        let linkType = null;
        let score = 0;
        let details = '';

        if (emailMatch || phoneMatch) {
          linkType = 'exact';
          score = 1.0;
          details = emailMatch ? 'Exact Email Conflict' : 'Exact Phone Conflict';
        } else if (nameSim >= minSimToShow) {
          score = nameSim;
          // Determine if it was fuzzy or false positive based on other fields
          const emailSim = n1.email && n2.email ? getJaroWinklerSimilarity(n1.email, n2.email) : 0;
          const phoneSim = n1.phone && n2.phone ? getJaroWinklerSimilarity(n1.phone, n2.phone) : 0;
          
          if (emailSim >= 0.80 || phoneSim >= 0.80) {
            linkType = 'fuzzy';
            details = `Near-Duplicate (Name Sim: ${(nameSim * 100).toFixed(0)}%)`;
          } else {
            linkType = 'false_positive';
            details = `Same Name / Different Entity (Name Sim: ${(nameSim * 100).toFixed(0)}%)`;
          }
        }

        if (linkType) {
          computedLinks.push({
            id: `link_${i}_${j}`,
            source: n1,
            target: n2,
            type: linkType,
            score,
            details
          });
        }
      }
    }
    return computedLinks;
  }, [nodes, minSimToShow]);

  // Get link stroke parameters
  const getLinkColor = (type) => {
    switch (type) {
      case 'exact': return 'var(--color-danger)';
      case 'fuzzy': return 'var(--color-warning)';
      case 'false_positive': return 'var(--accent-secondary)';
      default: return 'var(--border-color)';
    }
  };

  const activeNodeConnections = useMemo(() => {
    if (!selectedNode) return new Set();
    const connections = new Set();
    links.forEach(link => {
      if (link.source.id === selectedNode.id) connections.add(link.target.id);
      if (link.target.id === selectedNode.id) connections.add(link.source.id);
    });
    return connections;
  }, [selectedNode, links]);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', overflow: 'visible' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 className="section-title" style={{ margin: 0 }}>
          <Share2 size={20} style={{ color: 'var(--accent-primary)' }} />
          Database Entity Network Visualizer
        </h2>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Name Similarity Floor:</span>
          <input 
            type="range" 
            min="0.50" 
            max="0.95" 
            step="0.05" 
            value={minSimToShow}
            onChange={(e) => setMinSimToShow(parseFloat(e.target.value))}
            style={{ accentColor: 'var(--accent-primary)', width: '120px' }}
          />
          <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--accent-primary)', minWidth: '35px' }}>
            {(minSimToShow * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1.2fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* SVG Render Area */}
        <div style={{ background: '#060913', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', display: 'flex', justifyContent: 'center', position: 'relative' }}>
          {database.length === 0 ? (
            <div className="empty-state" style={{ height: '400px', display: 'flex', justifyContent: 'center' }}>
              <h3>No entities in database</h3>
              <p>Add records to populate the network map.</p>
            </div>
          ) : (
            <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="450px" style={{ cursor: 'grab' }}>
              {/* Draw Link Lines */}
              {links.map((link) => {
                const isHighlighted = selectedNode && 
                  (link.source.id === selectedNode.id || link.target.id === selectedNode.id);
                const opacity = selectedNode ? (isHighlighted ? 0.9 : 0.05) : 0.6;
                const strokeWidth = link.type === 'exact' ? 3 : link.score * 2.5;

                return (
                  <g key={link.id}>
                    <line
                      x1={link.source.x}
                      y1={link.source.y}
                      x2={link.target.x}
                      y2={link.target.y}
                      stroke={getLinkColor(link.type)}
                      strokeWidth={strokeWidth}
                      strokeOpacity={opacity}
                      style={{ transition: 'all 0.3s' }}
                    />
                    {isHighlighted && (
                      <text
                        x={(link.source.x + link.target.x) / 2}
                        y={(link.source.y + link.target.y) / 2 - 5}
                        fill="#fff"
                        fontSize="9"
                        textAnchor="middle"
                        style={{ backgroundColor: '#000', padding: '2px', pointerEvents: 'none' }}
                      >
                        {link.details}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Draw Nodes */}
              {nodes.map((node) => {
                const isSelected = selectedNode && selectedNode.id === node.id;
                const isConnected = activeNodeConnections.has(node.id);
                
                // Dim nodes that aren't connected to the active selection
                let opacity = 1.0;
                if (selectedNode && !isSelected && !isConnected) {
                  opacity = 0.25;
                }

                // Determine border glow based on link associations
                const nodeStroke = isSelected 
                  ? 'var(--accent-primary)' 
                  : (isConnected ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.2)');
                const nodeRadius = isSelected ? 12 : 9;

                return (
                  <g 
                    key={node.id} 
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={() => setSelectedNode(node)}
                    style={{ cursor: 'pointer', transition: 'all 0.3s', opacity }}
                  >
                    {/* Node Aura */}
                    {isSelected && (
                      <circle r={nodeRadius + 6} fill="var(--accent-primary-glow)" opacity="0.3" />
                    )}
                    <circle 
                      r={nodeRadius} 
                      fill="#111827" 
                      stroke={nodeStroke} 
                      strokeWidth={isSelected ? 3 : 2} 
                    />
                    <text
                      y={nodeRadius + 14}
                      fill="#fff"
                      fontSize="9.5"
                      fontWeight="500"
                      textAnchor="middle"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {node.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}

          {/* Graph Legend */}
          <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', background: 'rgba(10, 15, 25, 0.85)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '2px', backgroundColor: 'var(--color-danger)' }}></div>
              <span>Exact Duplicate Link</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '2px', backgroundColor: 'var(--color-warning)' }}></div>
              <span>Fuzzy / Near-Duplicate Link</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '2px', backgroundColor: 'var(--accent-secondary)' }}></div>
              <span>False Positive Link</span>
            </div>
          </div>
        </div>

        {/* Selected Node Details Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '450px' }}>
          {selectedNode ? (
            <div className="card" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', height: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <span className="compare-header" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem' }}>
                  <Eye size={10} /> Entity Details
                </span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginTop: '0.25rem' }}>{selectedNode.name}</h3>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ID: {selectedNode.id}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
                <div>
                  <span className="compare-label" style={{ display: 'block', fontSize: '0.7rem' }}>Email</span>
                  <span style={{ fontWeight: '500' }}>{selectedNode.email || '—'}</span>
                </div>
                <div>
                  <span className="compare-label" style={{ display: 'block', fontSize: '0.7rem' }}>Phone</span>
                  <span style={{ fontWeight: '500' }}>{selectedNode.phone || '—'}</span>
                </div>
                <div>
                  <span className="compare-label" style={{ display: 'block', fontSize: '0.7rem' }}>Company</span>
                  <span style={{ fontWeight: '500' }}>{selectedNode.company || '—'}</span>
                </div>
                <div>
                  <span className="compare-label" style={{ display: 'block', fontSize: '0.7rem' }}>Address</span>
                  <span style={{ fontWeight: '500', fontSize: '0.75rem' }}>{selectedNode.address || '—'}</span>
                </div>
                <div>
                  <span className="compare-label" style={{ display: 'block', fontSize: '0.7rem' }}>Source Connection</span>
                  <span className="badge verified" style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', marginTop: '0.25rem' }}>{selectedNode.source}</span>
                </div>
              </div>

              <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Related Links:</span>
                <span style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Link2 size={12} /> {activeNodeConnections.size} connected nodes
                </span>
                <button onClick={() => setSelectedNode(null)} className="btn-secondary" style={{ width: '100%', fontSize: '0.75rem', padding: '0.35rem', marginTop: '0.75rem' }}>
                  Clear Focus
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', border: '1px dashed var(--border-color)', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <Info size={24} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
              <span>Select an entity circle on the left network map to view its attributes and linked similarities.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
