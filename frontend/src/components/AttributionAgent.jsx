import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

export default function AttributionAgent({ ward }) {
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ward) return;
    
    setLoading(true);
    // FORCE direct connection to backend port 3001
    fetch('http://localhost:3001/api/agent/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ward)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAnalysis(data.analysis);
        } else {
          setAnalysis('Failed to load attribution intelligence.');
        }
      })
      .catch(err => {
        console.error(err);
        setAnalysis('Intelligence feed offline.');
      })
      .finally(() => setLoading(false));
  }, [ward.id, ward.aqi]);

  return (
    <div style={{ marginTop: '12px', background: '#0B1120', border: '1px solid #FF6B3555', borderRadius: '6px', padding: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: loading ? '#64748B' : '#FF6B35' }} />
        <div style={{ fontSize: '11px', color: '#FF6B35', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'bold' }}>
          Vayu Intelligence Agent
        </div>
      </div>
      
      {loading ? (
        <div style={{ fontSize: '12px', color: '#64748B' }}>Synthesizing local intelligence...</div>
      ) : (
         <div style={{ fontSize: '12px', color: '#E2E8F0', lineHeight: '1.5' }}>
          {/* Replace {analysis} with this: */}
          <ReactMarkdown>{analysis}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}