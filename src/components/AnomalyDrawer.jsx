import React from 'react'

const FONT_SANS = "'Jost', sans-serif"

const SEVERITY_STYLES = {
  danger: {
    color: 'var(--danger)',
    bg: 'rgba(220, 38, 38, 0.06)',
    border: 'rgba(220, 38, 38, 0.15)',
    dot: 'var(--danger)',
  },
  warning: {
    color: '#d97706',
    bg: 'rgba(217, 119, 6, 0.06)',
    border: 'rgba(217, 119, 6, 0.15)',
    dot: '#d97706',
  },
}

export default function AnomalyDrawer({ anomalies, onClose, onLog }) {
  if (!anomalies?.length) return null

  return (
    <div
      className="anomaly-drawer"
      style={{
        position: 'absolute',
        top: '50px',
        right: '20px',
        width: '380px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '6px',
        zIndex: 100,
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      }}
    >
      {/* Drawer header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
            fontFamily: FONT_SANS,
            fontWeight: 600,
          }}
        >
          Anomaly Report
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontFamily: FONT_SANS,
            fontSize: '16px',
            lineHeight: 1,
            padding: '2px 4px',
          }}
        >
          ×
        </button>
      </div>

      {/* Anomaly items */}
      <div style={{ padding: '8px' }}>
        {anomalies.map((anomaly, i) => {
          const styles = SEVERITY_STYLES[anomaly.severity] || SEVERITY_STYLES.warning
          return (
            <div
              key={anomaly.id}
              onClick={() => onLog?.(`Viewed anomaly: ${anomaly.title}`)}
              style={{
                background: styles.bg,
                border: `1px solid ${styles.border}`,
                borderRadius: '4px',
                padding: '12px 14px',
                marginBottom: i < anomalies.length - 1 ? '6px' : 0,
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  marginBottom: '6px',
                }}
              >
                <span
                  style={{
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    background: styles.dot,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: FONT_SANS,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: styles.color,
                    fontWeight: 600,
                  }}
                >
                  {anomaly.title}
                </span>
              </div>
              <p
                style={{
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  fontFamily: FONT_SANS,
                  lineHeight: 1.55,
                  margin: 0,
                }}
              >
                {anomaly.detail}
              </p>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '10px 16px',
          borderTop: '1px solid var(--border)',
          fontSize: '11px',
          color: 'var(--text-muted)',
          fontFamily: FONT_SANS,
        }}
      >
        Ask the intelligence layer to dig deeper →
      </div>
    </div>
  )
}
