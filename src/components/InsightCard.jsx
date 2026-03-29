import React, { useState } from 'react'
import MicroChart from './MicroChart'

const FONT_SANS  = "'Jost', sans-serif"
const FONT_SERIF = "'Playfair Display', serif"

const CONFIDENCE_STYLES = {
  'High signal': {
    color: '#16a34a',
    bg: 'rgba(22, 163, 74, 0.08)',
    border: 'rgba(22, 163, 74, 0.2)',
  },
  Watch: {
    color: '#0284c7',
    bg: 'rgba(2, 132, 199, 0.08)',
    border: 'rgba(2, 132, 199, 0.2)',
  },
  Anomaly: {
    color: '#dc2626',
    bg: 'rgba(220, 38, 38, 0.08)',
    border: 'rgba(220, 38, 38, 0.2)',
  },
}

export default function InsightCard({ insight, index, onExpand }) {
  const [expanded, setExpanded] = useState(false)

  const handleClick = () => {
    const next = !expanded
    setExpanded(next)
    if (next && onExpand) onExpand(insight)
  }

  const conf = CONFIDENCE_STYLES[insight.confidence] || CONFIDENCE_STYLES['Watch']

  return (
    <div
      className="insight-card"
      style={{
        background: 'var(--bg-surface)',
        border: `1px solid ${expanded ? 'rgba(61,61,245,0.18)' : 'var(--border)'}`,
        borderRadius: '6px',
        padding: '22px 24px',
        cursor: 'pointer',
        animationDelay: `${index * 120}ms`,
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        boxShadow: expanded
          ? '0 4px 20px rgba(61,61,245,0.06)'
          : '0 1px 4px rgba(0,0,0,0.04)',
      }}
      onClick={handleClick}
    >
      {/* Top row: badge + expand toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span
          style={{
            fontSize: '11px',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: conf.color,
            background: conf.bg,
            border: `1px solid ${conf.border}`,
            padding: '3px 9px',
            borderRadius: '3px',
            fontFamily: FONT_SANS,
            fontWeight: 600,
          }}
        >
          {insight.confidence}
        </span>
        <span
          style={{
            color: 'var(--text-muted)',
            fontSize: '16px',
            fontFamily: FONT_SANS,
            lineHeight: 1,
            transition: 'color 0.15s ease',
            userSelect: 'none',
          }}
        >
          {expanded ? '−' : '+'}
        </span>
      </div>

      {/* Headline */}
      <h3
        style={{
          fontFamily: FONT_SERIF,
          fontSize: '20px',
          fontWeight: 400,
          color: 'var(--text-primary)',
          lineHeight: 1.35,
          fontStyle: 'normal',
        }}
      >
        {insight.headline}
      </h3>

      {/* Collapsed sparkline */}
      {!expanded && insight.chartData && (
        <div style={{ height: '72px' }}>
          <MicroChart
            data={insight.chartData}
            type={insight.chartType}
            expanded={false}
            unit={insight.sparkUnit || '$'}
          />
        </div>
      )}

      {/* Metrics row */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {insight.metrics.map((metric, i) => (
          <div key={i} style={{ minWidth: '72px' }}>
            <div
              style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                fontFamily: FONT_SANS,
                letterSpacing: '0.04em',
                marginBottom: '4px',
                textTransform: 'uppercase',
                fontWeight: 500,
              }}
            >
              {metric.label}
            </div>
            <div
              style={{
                fontSize: '18px',
                color: metric.highlight ? 'var(--accent-primary)' : 'var(--text-primary)',
                fontFamily: FONT_SANS,
                fontWeight: metric.highlight ? 600 : 500,
                letterSpacing: '-0.02em',
              }}
            >
              {metric.value}
            </div>
          </div>
        ))}
      </div>

      {/* Expanded chart */}
      {expanded && insight.chartData && (
        <div
          style={{
            borderTop: '1px solid var(--border)',
            paddingTop: '16px',
            marginTop: '4px',
          }}
        >
          <MicroChart
            data={insight.chartData}
            type={insight.chartType}
            expanded
            chartLabel={insight.chartLabel}
          />
        </div>
      )}
    </div>
  )
}
