import React, { useRef, useEffect } from 'react'

const FONT_SANS = "'Jost', sans-serif"

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

const ENTRY_TYPE_STYLES = {
  explore: { icon: '◎', color: 'var(--accent-secondary)' },
  question: { icon: '?', color: 'var(--accent-primary)' },
  anomaly: { icon: '!', color: 'var(--danger)' },
  default: { icon: '·', color: 'var(--text-muted)' },
}

function getEntryType(text) {
  if (text.startsWith('Explored:')) return 'explore'
  if (text.startsWith('Asked:')) return 'question'
  if (text.startsWith('Viewed anomaly:')) return 'anomaly'
  return 'default'
}

export default function DecisionTrail({ entries }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [entries])

  return (
    <aside
      style={{
        width: '220px',
        flexShrink: 0,
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 16px 10px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: '11px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            fontFamily: FONT_SANS,
            fontWeight: 600,
          }}
        >
          Today's Reasoning
        </div>
      </div>

      {/* Entries */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 0',
        }}
      >
        {entries.length === 0 ? (
          <div
            style={{
              padding: '16px',
              fontSize: '12px',
              color: 'var(--text-muted)',
              fontFamily: FONT_SANS,
              lineHeight: 1.6,
            }}
          >
            Your decision trail will appear here as you explore.
          </div>
        ) : (
          entries.map((entry, i) => {
            const type = getEntryType(entry.text)
            const style = ENTRY_TYPE_STYLES[type]
            return (
              <div
                key={entry.id}
                className="trail-entry"
                style={{
                  padding: '7px 16px',
                  animationDelay: `${i * 40}ms`,
                  borderLeft: `2px solid transparent`,
                }}
              >
                <div
                  style={{
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                    fontFamily: FONT_SANS,
                    letterSpacing: '0.04em',
                    marginBottom: '2px',
                  }}
                >
                  {formatTime(entry.timestamp)}
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                  <span
                    style={{
                      color: style.color,
                      fontFamily: FONT_SANS,
                      fontSize: '12px',
                      flexShrink: 0,
                      marginTop: '1px',
                    }}
                  >
                    {style.icon}
                  </span>
                  <span
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      fontFamily: FONT_SANS,
                      lineHeight: 1.45,
                      wordBreak: 'break-word',
                    }}
                  >
                    {entry.text}
                  </span>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Footer stats */}
      <div
        style={{
          padding: '10px 16px',
          borderTop: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            fontFamily: FONT_SANS,
          }}
        >
          {entries.length} decision{entries.length !== 1 ? 's' : ''} logged
        </div>
      </div>
    </aside>
  )
}
