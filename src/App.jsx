import React, { useState, useCallback } from 'react'
import { useSuperstoreData } from './hooks/useSuperstoreData'
import Header from './components/Header'
import InsightCard from './components/InsightCard'
import AnomalyDrawer from './components/AnomalyDrawer'
import ConversationalBar from './components/ConversationalBar'
import DecisionTrail from './components/DecisionTrail'

export default function App() {
  const { data, insights, anomalies, metadata, loading, error } = useSuperstoreData()
  const [anomalyOpen, setAnomalyOpen] = useState(false)
  const [trailEntries, setTrailEntries] = useState([])

  const addTrailEntry = useCallback((text) => {
    setTrailEntries((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), text, timestamp: Date.now() },
    ])
  }, [])

  const handleInsightExpand = useCallback((insight) => {
    addTrailEntry(`Explored: ${insight.headline.split('—')[0].trim()}`)
  }, [addTrailEntry])

  const handleAnomalyToggle = () => {
    setAnomalyOpen((v) => !v)
    if (!anomalyOpen && anomalies.length > 0) {
      addTrailEntry(`Opened anomaly scanner — ${anomalies.length} issue${anomalies.length > 1 ? 's' : ''} flagged`)
    }
  }

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-primary)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Header */}
      <Header
        metadata={metadata}
        anomalyCount={anomalies.length}
        onAnomalyClick={handleAnomalyToggle}
        anomalyOpen={anomalyOpen}
      />

      {/* Anomaly drawer — absolutely positioned */}
      {anomalyOpen && (
        <AnomalyDrawer
          anomalies={anomalies}
          onClose={() => setAnomalyOpen(false)}
          onLog={addTrailEntry}
        />
      )}

      {/* Main body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Left rail — Decision Trail */}
        <DecisionTrail entries={trailEntries} />

        {/* Content area */}
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {/* Loading state */}
          {loading && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                gap: '16px',
              }}
            >
              <div
                className="loading-shimmer"
                style={{
                  width: '40px',
                  height: '2px',
                  background: 'var(--accent-primary)',
                  borderRadius: '1px',
                }}
              />
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  fontFamily: "'IBM Plex Mono', monospace",
                  letterSpacing: '0.1em',
                }}
              >
                SCANNING DATASET
              </span>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div
              style={{
                padding: '20px',
                border: '1px solid rgba(255,77,109,0.2)',
                borderRadius: '4px',
                background: 'rgba(255,77,109,0.05)',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--danger)',
                  fontFamily: "'IBM Plex Mono', monospace",
                  letterSpacing: '0.06em',
                  marginBottom: '6px',
                }}
              >
                DATASET ERROR
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: "'IBM Plex Mono', monospace" }}>
                Could not load superstore.csv. Run <code style={{ color: 'var(--accent-primary)' }}>npm run generate-data</code> to create the dataset.
              </p>
            </div>
          )}

          {/* Insights grid */}
          {!loading && !error && insights.length > 0 && (
            <>
              {/* Section label */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <span
                  style={{
                    fontSize: '10px',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    fontFamily: "'IBM Plex Mono', monospace",
                  }}
                >
                  Intelligence Surface
                </span>
                <span
                  style={{
                    flex: 1,
                    height: '1px',
                    background: 'var(--border)',
                  }}
                />
                <span
                  style={{
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                    fontFamily: "'IBM Plex Mono', monospace",
                  }}
                >
                  {insights.length} signals
                </span>
              </div>

              {/* 2-column grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '16px',
                  alignContent: 'start',
                }}
              >
                {insights.map((insight, i) => (
                  <InsightCard
                    key={insight.id}
                    insight={insight}
                    index={i}
                    onExpand={handleInsightExpand}
                  />
                ))}
              </div>

              {/* Bottom spacer for conversational bar */}
              <div style={{ height: '8px' }} />
            </>
          )}
        </main>
      </div>

      {/* Fixed bottom — Conversational bar */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <ConversationalBar data={data} onQuery={addTrailEntry} />
      </div>
    </div>
  )
}
