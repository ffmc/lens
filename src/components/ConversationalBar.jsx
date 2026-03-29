import React, { useState, useRef } from 'react'
import { answerQuery } from '../lib/queryEngine'

const FONT_SANS  = "'Jost', sans-serif"
const FONT_SERIF = "'Playfair Display', serif"

const SUGGESTIONS = [
  'Which product category should we stop discounting?',
  'What is driving the West region growth?',
  'Where should we cut costs to improve margin?',
  'Which sub-categories have the worst ROI?',
]

export default function ConversationalBar({ data, onQuery }) {
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showResponse, setShowResponse] = useState(false)
  const inputRef = useRef(null)

  function handleSubmit(q) {
    const question = q || query
    if (!question.trim()) return

    setLoading(true)
    setShowResponse(false)
    if (onQuery) onQuery(`Asked: ${question}`)

    setTimeout(() => {
      const text = answerQuery(data, question)
      setResponse({ text, question })
      setShowResponse(true)
      setLoading(false)
    }, 420)
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === 'Escape') {
      setShowResponse(false)
      setQuery('')
      inputRef.current?.blur()
    }
  }

  return (
    <>
      {/* Response panel — slides up above the bar */}
      {showResponse && response && (
        <div
          className="response-panel"
          style={{
            position: 'absolute',
            bottom: '68px',
            left: '220px',
            right: 0,
            padding: '0 24px 0 24px',
            zIndex: 20,
          }}
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '20px 24px',
              maxWidth: '840px',
              boxShadow: '0 -4px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(61,61,245,0.06)',
            }}
          >
            {/* Question echo */}
            {response?.question && (
              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  fontFamily: FONT_SANS,
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>?</span>
                {response.question}
              </div>
            )}

            {/* Response content */}
            <p
              style={{
                fontFamily: FONT_SERIF,
                fontSize: '17px',
                color: 'var(--text-primary)',
                lineHeight: 1.65,
                margin: 0,
              }}
            >
              {response?.text}
            </p>

            {/* Dismiss */}
            <button
              onClick={() => setShowResponse(false)}
              style={{
                marginTop: '14px',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '11px',
                fontFamily: FONT_SANS,
                letterSpacing: '0.06em',
                cursor: 'pointer',
                padding: 0,
                fontWeight: 500,
              }}
            >
              ESC to dismiss
            </button>
          </div>
        </div>
      )}

      {/* Fixed bottom bar */}
      <div
        style={{
          height: '68px',
          background: 'var(--bg-surface)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          gap: '12px',
          flexShrink: 0,
          position: 'relative',
          zIndex: 20,
          boxShadow: '0 -1px 0 var(--border)',
        }}
      >
        {/* Prompt indicator */}
        <span
          style={{
            color: 'var(--accent-primary)',
            fontFamily: FONT_SANS,
            fontSize: '16px',
            flexShrink: 0,
            opacity: 0.6,
            fontWeight: 300,
          }}
        >
          ›
        </span>

        {/* Input */}
        <input
          ref={inputRef}
          className="cmd-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask anything about your data..."
          disabled={loading}
          style={{
            flex: 1,
            background: 'var(--bg-primary)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            padding: '9px 14px',
            color: 'var(--text-primary)',
            fontFamily: FONT_SANS,
            fontSize: '14px',
            outline: 'none',
            transition: 'border-color 0.15s ease',
            opacity: loading ? 0.6 : 1,
          }}
        />

        {/* Submit or loading */}
        <button
          onClick={() => handleSubmit()}
          disabled={loading || !query.trim()}
          style={{
            background: loading || !query.trim() ? 'transparent' : 'var(--accent-primary)',
            border: `1px solid ${loading || !query.trim() ? 'var(--border)' : 'var(--accent-primary)'}`,
            borderRadius: '4px',
            padding: '8px 16px',
            color: loading || !query.trim() ? 'var(--text-muted)' : '#ffffff',
            fontFamily: FONT_SANS,
            fontSize: '12px',
            fontWeight: 600,
            cursor: loading || !query.trim() ? 'not-allowed' : 'pointer',
            letterSpacing: '0.06em',
            transition: 'all 0.15s ease',
            flexShrink: 0,
          }}
        >
          {loading ? '···' : 'ANALYZE'}
        </button>

        {/* Suggestion chips — only when idle */}
        {!loading && !showResponse && !query && data.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: '6px',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {SUGGESTIONS.slice(0, 2).map((s, i) => (
              <button
                key={i}
                onClick={() => handleSubmit(s)}
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: '3px',
                  padding: '5px 10px',
                  color: 'var(--text-muted)',
                  fontFamily: FONT_SANS,
                  fontSize: '11px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'border-color 0.15s ease, color 0.15s ease',
                  maxWidth: '200px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = 'var(--accent-primary)'
                  e.target.style.color = 'var(--accent-primary)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = 'var(--border)'
                  e.target.style.color = 'var(--text-muted)'
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
