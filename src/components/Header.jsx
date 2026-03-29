import React from 'react'

const FONT_SANS = "'Jost', sans-serif"

export default function Header({ metadata, anomalyCount, onAnomalyClick, anomalyOpen }) {
  return (
    <header
      style={{
        height: '50px',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: '0',
        flexShrink: 0,
        position: 'relative',
        zIndex: 10,
        boxShadow: '0 1px 0 var(--border)',
      }}
    >
      {/* App name */}
      <span
        style={{
          fontFamily: FONT_SANS,
          fontSize: '15px',
          fontWeight: 700,
          letterSpacing: '0.22em',
          color: 'var(--accent-primary)',
          marginRight: '28px',
        }}
      >
        LENS
      </span>

      {/* Divider */}
      <span style={{ width: '1px', height: '20px', background: 'var(--border)', marginRight: '28px' }} />

      {/* Dataset info */}
      {metadata ? (
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flex: 1 }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontFamily: FONT_SANS, fontWeight: 500 }}>
            {metadata.datasetName}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontFamily: FONT_SANS }}>
            {metadata.rowCount.toLocaleString()} rows
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontFamily: FONT_SANS }}>
            {metadata.dateRange}
          </span>
        </div>
      ) : (
        <div style={{ flex: 1 }} />
      )}

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Anomaly badge */}
        {anomalyCount > 0 && (
          <button
            onClick={onAnomalyClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: anomalyOpen ? 'rgba(220,38,38,0.1)' : 'rgba(220,38,38,0.06)',
              border: `1px solid ${anomalyOpen ? 'rgba(220,38,38,0.35)' : 'rgba(220,38,38,0.18)'}`,
              borderRadius: '4px',
              padding: '4px 10px',
              cursor: 'pointer',
              fontFamily: FONT_SANS,
              fontSize: '12px',
              fontWeight: 500,
              color: 'var(--danger)',
              transition: 'all 0.15s ease',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--danger)',
                display: 'inline-block',
              }}
              className="live-dot"
            />
            {anomalyCount} anomal{anomalyCount === 1 ? 'y' : 'ies'} detected
          </button>
        )}

        {/* Live indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'var(--accent-primary)',
              display: 'inline-block',
            }}
            className="live-dot"
          />
          <span
            style={{
              fontSize: '11px',
              letterSpacing: '0.12em',
              color: 'var(--accent-primary)',
              fontFamily: FONT_SANS,
              fontWeight: 600,
              opacity: 0.7,
            }}
          >
            LIVE
          </span>
        </div>
      </div>
    </header>
  )
}
