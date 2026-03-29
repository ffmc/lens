import React from 'react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts'

const ACCENT   = '#3d3df5'
const SECONDARY = '#0284c7'
const DANGER   = '#dc2626'
const MUTED    = '#d0cdc6'
const TEXT_SECONDARY = '#636380'
const FONT = "'Jost', sans-serif"

const CustomTooltip = ({ active, payload, label, prefix = '', suffix = '' }) => {
  if (!active || !payload?.length) return null
  const val = payload[0]?.value
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e0ddd6',
        padding: '8px 12px',
        borderRadius: '4px',
        fontFamily: FONT,
        fontSize: '12px',
        color: '#17171f',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      }}
    >
      <div style={{ color: TEXT_SECONDARY, marginBottom: '2px', fontSize: '11px' }}>{label}</div>
      <div style={{ color: ACCENT, fontWeight: 600 }}>
        {prefix}{typeof val === 'number' ? val.toFixed(1) : val}{suffix}
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function abbrevName(name) {
  if (!name) return ''
  const s = String(name)
  // "2020\nQ1" or "2020 Q1" → "Q1'20"
  const qMatch = s.match(/(\d{4})[\s\n](Q\d)/)
  if (qMatch) return `${qMatch[2]}'${qMatch[1].slice(2)}`
  return s.length > 7 ? s.slice(0, 7) : s
}

function fmtSparkVal(v, unit) {
  if (unit === '%') return `${v > 0 ? '+' : ''}${Number(v).toFixed(1)}%`
  const abs = Math.abs(v)
  const sign = v < 0 ? '-' : ''
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(0)}k`
  return `${sign}$${abs.toFixed(0)}`
}

// ── Shaded sparkline (collapsed mode) ─────────────────────────────────────────

function Sparkline({ data, positive, unit = '$' }) {
  if (!data?.length) return null

  const vals = data.map((d) => d.value ?? 0)
  const minVal = Math.min(...vals)
  const maxVal = Math.max(...vals)
  const color = positive ? SECONDARY : DANGER
  const gradId = `spark_${positive ? 'pos' : 'neg'}_${unit}`

  const firstName = abbrevName(data[0]?.name)
  const lastName  = abbrevName(data[data.length - 1]?.name)
  // Show only first and last ticks on X axis
  const xTicks = [data[0]?.name, data[data.length - 1]?.name].filter(Boolean)

  return (
    <ResponsiveContainer width="100%" height={72}>
      <AreaChart data={data} margin={{ top: 6, right: 32, left: 32, bottom: 2 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity={0.2} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="name"
          ticks={xTicks}
          tickFormatter={abbrevName}
          tick={{ fill: TEXT_SECONDARY, fontSize: 9, fontFamily: FONT }}
          axisLine={false}
          tickLine={false}
          height={16}
        />
        <YAxis
          ticks={[minVal, maxVal]}
          tickFormatter={(v) => fmtSparkVal(v, unit)}
          tick={{ fill: TEXT_SECONDARY, fontSize: 9, fontFamily: FONT }}
          axisLine={false}
          tickLine={false}
          width={30}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradId})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ── Bar chart — profit over time ──────────────────────────────────────────────

function ProfitBarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 20 }} barSize={10}>
        <XAxis
          dataKey="name"
          tick={{ fill: TEXT_SECONDARY, fontSize: 10, fontFamily: FONT }}
          interval={3}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: TEXT_SECONDARY, fontSize: 10, fontFamily: FONT }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          width={36}
        />
        <Tooltip content={<CustomTooltip prefix="$" />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
        <Bar dataKey="value" radius={[2, 2, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.isNegative ? DANGER : SECONDARY} opacity={0.75} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Bar chart — region YoY ────────────────────────────────────────────────────

function RegionBarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 20, left: 0, bottom: 4 }} barSize={10}>
        <XAxis
          type="number"
          tick={{ fill: TEXT_SECONDARY, fontSize: 10, fontFamily: FONT }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v > 0 ? '+' : ''}${v.toFixed(0)}%`}
        />
        <YAxis
          dataKey="name"
          type="category"
          tick={{ fill: TEXT_SECONDARY, fontSize: 11, fontFamily: FONT }}
          axisLine={false}
          tickLine={false}
          width={52}
        />
        <Tooltip content={<CustomTooltip suffix="%" />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
        <Bar dataKey="value" radius={[0, 2, 2, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.isPositive ? ACCENT : DANGER} opacity={entry.isPositive ? 0.85 : 0.75} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Bar chart — discount buckets ──────────────────────────────────────────────

function DiscountBarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 20 }} barSize={28}>
        <XAxis
          dataKey="name"
          tick={{ fill: TEXT_SECONDARY, fontSize: 11, fontFamily: FONT }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: TEXT_SECONDARY, fontSize: 10, fontFamily: FONT }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}%`}
          width={36}
        />
        <Tooltip content={<CustomTooltip suffix="%" />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
        <Bar dataKey="value" radius={[2, 2, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.isNegative ? DANGER : SECONDARY} opacity={0.75} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Horizontal bar — top products ─────────────────────────────────────────────

function HorizontalBarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 20, left: 0, bottom: 4 }} barSize={10}>
        <XAxis
          type="number"
          tick={{ fill: TEXT_SECONDARY, fontSize: 10, fontFamily: FONT }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
        />
        <YAxis
          dataKey="name"
          type="category"
          tick={{ fill: TEXT_SECONDARY, fontSize: 9, fontFamily: FONT }}
          axisLine={false}
          tickLine={false}
          width={140}
        />
        <Tooltip content={<CustomTooltip prefix="$" />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
        <Bar dataKey="value" radius={[0, 2, 2, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.isTop ? ACCENT : SECONDARY} opacity={entry.isTop ? 0.9 : 0.55} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Shipping mode bar chart ───────────────────────────────────────────────────

function ShippingBarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 20 }} barSize={28}>
        <XAxis
          dataKey="name"
          tick={{ fill: TEXT_SECONDARY, fontSize: 11, fontFamily: FONT }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: TEXT_SECONDARY, fontSize: 10, fontFamily: FONT }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}%`}
          width={36}
        />
        <Tooltip
          content={<CustomTooltip suffix="% margin" />}
          cursor={{ fill: 'rgba(0,0,0,0.04)' }}
        />
        <Bar dataKey="margin" radius={[2, 2, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.isTop ? ACCENT : SECONDARY} opacity={entry.isTop ? 0.9 : 0.55} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function MicroChart({ data, type, expanded, chartLabel, unit = '$' }) {
  if (!data?.length) return null

  if (!expanded) {
    const isPositive = data.some((d) => (d.value ?? 0) > 0)
    return <Sparkline data={data} positive={isPositive} unit={unit} />
  }

  return (
    <div>
      {chartLabel && (
        <div
          style={{
            fontSize: '11px',
            color: TEXT_SECONDARY,
            fontFamily: FONT,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            fontWeight: 500,
            marginBottom: '12px',
          }}
        >
          {chartLabel}
        </div>
      )}
      {type === 'bar'              && <ProfitBarChart      data={data} />}
      {type === 'bar-region'       && <RegionBarChart      data={data} />}
      {type === 'bar-discount'     && <DiscountBarChart    data={data} />}
      {type === 'bar-horizontal'   && <HorizontalBarChart  data={data} />}
      {type === 'bar-shipping'     && <ShippingBarChart    data={data} />}
    </div>
  )
}
