// ── helpers ──────────────────────────────────────────────────────────────────

function parseDate(str) {
  if (!str) return null
  const d = new Date(str)
  return isNaN(d) ? null : d
}

function fmt(n, decimals = 1) {
  return Number(n).toFixed(decimals)
}

function fmtCurrency(n) {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}k`
  return `$${Math.abs(n).toFixed(0)}`
}

function fmtPct(n) {
  return `${(n * 100).toFixed(1)}%`
}

function groupBy(data, key) {
  return data.reduce((acc, row) => {
    const k = row[key]
    if (!acc[k]) acc[k] = []
    acc[k].push(row)
    return acc
  }, {})
}

function getYear(row) {
  const d = parseDate(row['Order Date'])
  return d ? d.getFullYear() : null
}

function getMonth(row) {
  const d = parseDate(row['Order Date'])
  return d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` : null
}

function getQuarter(row) {
  const d = parseDate(row['Order Date'])
  if (!d) return null
  return `${d.getFullYear()}-Q${Math.ceil((d.getMonth() + 1) / 3)}`
}

// ── Insight 1: Most loss-making sub-category ─────────────────────────────────

export function insightLossySubcategory(data) {
  const bySubcat = groupBy(data, 'Sub-Category')
  const margins = {}
  const totals = {}

  for (const [subcat, rows] of Object.entries(bySubcat)) {
    const profit = rows.reduce((s, r) => s + Number(r.Profit), 0)
    const sales = rows.reduce((s, r) => s + Number(r.Sales), 0)
    margins[subcat] = sales > 0 ? profit / sales : 0
    totals[subcat] = { profit, sales, count: rows.length }
  }

  const sorted = Object.entries(margins).sort((a, b) => a[1] - b[1])
  const [worst, worstMargin] = sorted[0]
  const { profit: totalProfit, sales: totalSales } = totals[worst]

  // Trend: compare H1 vs H2 profit for this sub-category
  const subcatRows = bySubcat[worst]
  const years = [...new Set(subcatRows.map(getYear).filter(Boolean))].sort()
  const lastYear = years[years.length - 1]
  const prevYear = years[years.length - 2]

  const profitLastYear = subcatRows.filter((r) => getYear(r) === lastYear).reduce((s, r) => s + Number(r.Profit), 0)
  const profitPrevYear = prevYear
    ? subcatRows.filter((r) => getYear(r) === prevYear).reduce((s, r) => s + Number(r.Profit), 0)
    : null

  const trendUp = profitPrevYear !== null ? profitLastYear > profitPrevYear : false

  // Chart data: profit by quarter for this sub-category
  const quarterGroups = {}
  subcatRows.forEach((r) => {
    const q = getQuarter(r)
    if (!q) return
    quarterGroups[q] = (quarterGroups[q] || 0) + Number(r.Profit)
  })
  const chartData = Object.entries(quarterGroups)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([q, profit]) => ({ name: q.replace('-', '\n'), value: profit, isNegative: profit < 0 }))

  return {
    id: 'lossy-subcat',
    confidence: 'Anomaly',
    headline: `${worst} is destroying margin — ${fmtPct(Math.abs(worstMargin))} loss rate on every dollar sold.`,
    metrics: [
      { label: 'Profit Margin', value: fmtPct(worstMargin), highlight: true },
      { label: 'Total Profit', value: fmtCurrency(totalProfit), highlight: false },
      { label: 'Revenue', value: fmtCurrency(totalSales), highlight: false },
    ],
    chartData,
    chartType: 'bar',
    chartLabel: `${worst} — Quarterly Profit`,
    sparkUnit: '$',
    raw: { subcat: worst, margin: worstMargin, totalProfit, trendUp },
  }
}

// ── Insight 2: Region with biggest YoY sales delta ───────────────────────────

export function insightRegionYoY(data) {
  const byRegionYear = {}

  data.forEach((row) => {
    const region = row.Region
    const year = getYear(row)
    if (!region || !year) return
    const key = `${region}__${year}`
    byRegionYear[key] = (byRegionYear[key] || 0) + Number(row.Sales)
  })

  const years = [...new Set(data.map(getYear).filter(Boolean))].sort()
  const lastYear = years[years.length - 1]
  const prevYear = years[years.length - 2]

  const deltas = {}
  const regionSales = {}
  const regions = [...new Set(data.map((r) => r.Region).filter(Boolean))]

  regions.forEach((region) => {
    const cur = byRegionYear[`${region}__${lastYear}`] || 0
    const prev = byRegionYear[`${region}__${prevYear}`] || 0
    deltas[region] = prev > 0 ? (cur - prev) / prev : 0
    regionSales[region] = { cur, prev }
  })

  const sorted = Object.entries(deltas).sort((a, b) => b[1] - a[1])
  const [topRegion, topDelta] = sorted[0]
  const { cur, prev } = regionSales[topRegion]

  // Chart data: all 4 regions YoY
  const chartData = sorted.map(([region, delta]) => ({
    name: region,
    value: delta * 100,
    isPositive: delta >= 0,
  }))

  return {
    id: 'region-yoy',
    confidence: 'High signal',
    headline: `${topRegion} region surged ${fmtPct(topDelta)} year-over-year — outpacing every other region.`,
    metrics: [
      { label: 'YoY Growth', value: `+${fmtPct(topDelta)}`, highlight: true },
      { label: `${lastYear} Sales`, value: fmtCurrency(cur), highlight: false },
      { label: `${prevYear} Sales`, value: fmtCurrency(prev), highlight: false },
    ],
    chartData,
    chartType: 'bar-region',
    chartLabel: 'YoY Sales Growth by Region',
    sparkUnit: '%',
    raw: { region: topRegion, delta: topDelta, cur, prev, lastYear, prevYear },
  }
}

// ── Insight 3: Discount vs profit anomaly ────────────────────────────────────

export function insightDiscountAnomaly(data) {
  const buckets = {
    '0–10%': { rows: [], label: '0–10%' },
    '11–20%': { rows: [], label: '11–20%' },
    '21–30%': { rows: [], label: '21–30%' },
    '31%+': { rows: [], label: '31%+' },
  }

  data.forEach((row) => {
    const d = Number(row.Discount)
    if (d <= 0.1) buckets['0–10%'].rows.push(row)
    else if (d <= 0.2) buckets['11–20%'].rows.push(row)
    else if (d <= 0.3) buckets['21–30%'].rows.push(row)
    else buckets['31%+'].rows.push(row)
  })

  const chartData = Object.entries(buckets).map(([key, { rows, label }]) => {
    const totalProfit = rows.reduce((s, r) => s + Number(r.Profit), 0)
    const totalSales = rows.reduce((s, r) => s + Number(r.Sales), 0)
    const margin = totalSales > 0 ? totalProfit / totalSales : 0
    return { name: label, value: Math.round(margin * 1000) / 10, isNegative: margin < 0 }
  })

  const highDiscount = buckets['31%+'].rows
  const highDiscountMargin =
    highDiscount.reduce((s, r) => s + Number(r.Profit), 0) /
    Math.max(1, highDiscount.reduce((s, r) => s + Number(r.Sales), 0))

  const noDiscount = buckets['0–10%'].rows
  const noDiscountMargin =
    noDiscount.reduce((s, r) => s + Number(r.Profit), 0) /
    Math.max(1, noDiscount.reduce((s, r) => s + Number(r.Sales), 0))

  const highDiscountPct = ((highDiscount.length / data.length) * 100).toFixed(0)

  return {
    id: 'discount-anomaly',
    confidence: 'Anomaly',
    headline: `Discounts above 30% flip profit negative — ${highDiscountPct}% of orders are burning margin.`,
    metrics: [
      { label: 'Margin at 31%+ discount', value: fmtPct(highDiscountMargin), highlight: true },
      { label: 'Margin at 0–10% discount', value: fmtPct(noDiscountMargin), highlight: false },
      { label: 'High-discount orders', value: `${highDiscountPct}%`, highlight: false },
    ],
    chartData,
    chartType: 'bar-discount',
    chartLabel: 'Profit Margin (%) by Discount Bucket',
    sparkUnit: '%',
    raw: { highDiscountMargin, noDiscountMargin, highDiscountPct: Number(highDiscountPct) },
  }
}

// ── Insight 4: Top-performing product last quarter ───────────────────────────

export function insightTopProduct(data) {
  const dates = data.map((r) => parseDate(r['Order Date'])).filter(Boolean)
  const maxDate = new Date(Math.max(...dates))
  const threeMonthsAgo = new Date(maxDate)
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  const recent = data.filter((r) => {
    const d = parseDate(r['Order Date'])
    return d && d >= threeMonthsAgo
  })

  const byProduct = {}
  recent.forEach((r) => {
    const p = r['Product Name']
    if (!p) return
    if (!byProduct[p]) byProduct[p] = { sales: 0, profit: 0, count: 0, subcat: r['Sub-Category'] }
    byProduct[p].sales += Number(r.Sales)
    byProduct[p].profit += Number(r.Profit)
    byProduct[p].count += 1
  })

  // Score by profit + sales combo
  const scored = Object.entries(byProduct)
    .filter(([, v]) => v.profit > 0)
    .map(([name, v]) => ({ name, score: v.profit * 0.6 + v.sales * 0.4, ...v }))
    .sort((a, b) => b.score - a.score)

  const top = scored[0] || { name: 'N/A', sales: 0, profit: 0, count: 0, subcat: 'N/A' }

  // Chart: top 5 products by profit
  const chartData = scored.slice(0, 6).map((p) => ({
    name: p.name.length > 22 ? p.name.substring(0, 22) + '…' : p.name,
    value: Math.round(p.profit),
    isTop: p.name === top.name,
  }))

  const qLabel = `Q${Math.ceil((maxDate.getMonth() + 1) / 3)} ${maxDate.getFullYear()}`

  return {
    id: 'top-product',
    confidence: 'High signal',
    headline: `${top.name.length > 40 ? top.name.substring(0, 40) + '…' : top.name} dominated ${qLabel} with best-in-quarter profit.`,
    metrics: [
      { label: 'Profit', value: fmtCurrency(top.profit), highlight: true },
      { label: 'Revenue', value: fmtCurrency(top.sales), highlight: false },
      { label: 'Orders', value: top.count, highlight: false },
    ],
    chartData,
    chartType: 'bar-horizontal',
    chartLabel: `Top Products — ${qLabel}`,
    sparkUnit: '$',
    raw: { product: top.name, profit: top.profit, sales: top.sales, quarter: qLabel },
  }
}

// ── Insight 5: Shipping mode efficiency ──────────────────────────────────────

export function insightShippingEfficiency(data) {
  const byMode = groupBy(data, 'Ship Mode')
  const stats = {}

  for (const [mode, rows] of Object.entries(byMode)) {
    const profit = rows.reduce((s, r) => s + Number(r.Profit), 0)
    const sales = rows.reduce((s, r) => s + Number(r.Sales), 0)
    stats[mode] = {
      orders: rows.length,
      profit,
      sales,
      margin: sales > 0 ? profit / sales : 0,
      avgProfit: profit / rows.length,
    }
  }

  // Find best and worst margin modes by volume-weighted analysis
  const ranked = Object.entries(stats).sort((a, b) => b[1].margin - a[1].margin)
  const [bestMode, bestStats] = ranked[0]
  // Use highest-volume mode as the baseline for comparison
  const byVolume = Object.entries(stats).sort((a, b) => b[1].orders - a[1].orders)
  const [highVolMode, highVolStats] = byVolume[0]
  const [lowestMode, lowestStats] = ranked[ranked.length - 1]

  // If best mode is the same as high-volume mode, compare best vs worst
  const compareMode = bestMode === highVolMode ? lowestMode : highVolMode
  const compareStats = bestMode === highVolMode ? lowestStats : highVolStats
  const delta = Math.abs(bestStats.margin - compareStats.margin)

  const chartData = ranked.map(([mode, s]) => ({
    name: mode.replace(' Class', '').replace('Second', '2nd').replace('First', '1st').replace('Standard', 'Std'),
    value: Math.round(s.margin * 1000) / 10,
    margin: Math.round(s.margin * 1000) / 10,
    orders: s.orders,
    isTop: mode === bestMode,
  }))

  const headline = bestMode === compareMode
    ? `${bestMode} has the best margin at ${fmtPct(bestStats.margin)} — ${bestStats.orders} orders, highest volume.`
    : `${bestMode} earns ${fmtPct(bestStats.margin)} margins — ${fmtPct(delta)} better than ${compareMode}.`

  return {
    id: 'shipping-efficiency',
    confidence: 'Watch',
    headline,
    metrics: [
      { label: `${bestMode} margin`, value: fmtPct(bestStats.margin), highlight: true },
      { label: `${compareMode} margin`, value: fmtPct(compareStats.margin), highlight: false },
      { label: `${bestMode} volume`, value: `${bestStats.orders} orders`, highlight: false },
    ],
    chartData,
    chartType: 'bar-shipping',
    chartLabel: 'Profit Margin % by Ship Mode',
    sparkUnit: '%',
    raw: { bestMode, bestMargin: bestStats.margin, compareMode, compareMargin: compareStats.margin },
  }
}

// ── Anomaly detection ─────────────────────────────────────────────────────────

export function detectAnomalies(data) {
  const anomalies = []

  // 1. Sub-categories below -10% margin
  const bySubcat = groupBy(data, 'Sub-Category')
  const criticalSubcats = []
  for (const [subcat, rows] of Object.entries(bySubcat)) {
    const profit = rows.reduce((s, r) => s + Number(r.Profit), 0)
    const sales = rows.reduce((s, r) => s + Number(r.Sales), 0)
    const margin = sales > 0 ? profit / sales : 0
    if (margin < -0.1) {
      criticalSubcats.push({ subcat, margin })
    }
  }
  if (criticalSubcats.length > 0) {
    const worst = criticalSubcats.sort((a, b) => a.margin - b.margin)[0]
    anomalies.push({
      id: 'margin-critical',
      severity: 'danger',
      title: 'Critical margin destruction',
      detail: `${worst.subcat} is running at ${fmtPct(worst.margin)} profit margin — every sale actively destroys shareholder value. Immediate pricing review required.`,
    })
  }

  // 2. Discount outliers by segment
  const bySegment = groupBy(data, 'Segment')
  for (const [segment, rows] of Object.entries(bySegment)) {
    const avgDiscount = rows.reduce((s, r) => s + Number(r.Discount), 0) / rows.length
    if (avgDiscount > 0.3) {
      anomalies.push({
        id: `discount-${segment}`,
        severity: 'warning',
        title: 'Discount policy breach',
        detail: `${segment} segment averages ${fmtPct(avgDiscount)} discount — 30% above the threshold where orders turn unprofitable. Sales incentive structure needs restructuring.`,
      })
    }
  }

  // 3. Sales trend reversal (3+ month decline)
  const byMonth = {}
  data.forEach((r) => {
    const m = getMonth(r)
    if (!m) return
    byMonth[m] = (byMonth[m] || 0) + Number(r.Sales)
  })
  const monthsSorted = Object.entries(byMonth)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([m, sales]) => ({ month: m, sales }))

  let consecutiveDeclines = 0
  let declineStart = null
  for (let i = 1; i < monthsSorted.length; i++) {
    if (monthsSorted[i].sales < monthsSorted[i - 1].sales) {
      if (consecutiveDeclines === 0) declineStart = monthsSorted[i - 1].month
      consecutiveDeclines++
    } else {
      consecutiveDeclines = 0
      declineStart = null
    }
    if (consecutiveDeclines >= 3) {
      anomalies.push({
        id: 'trend-reversal',
        severity: 'warning',
        title: 'Sustained sales decline',
        detail: `Sales declined for ${consecutiveDeclines} consecutive months starting ${declineStart}. This pattern historically precedes a larger demand contraction — investigate leading indicators now.`,
      })
      break
    }
  }

  return anomalies
}

// ── Compute all insights ──────────────────────────────────────────────────────

export function computeAllInsights(data) {
  return [
    insightLossySubcategory(data),
    insightRegionYoY(data),
    insightDiscountAnomaly(data),
    insightTopProduct(data),
    insightShippingEfficiency(data),
  ]
}

// ── Build data context for Claude ─────────────────────────────────────────────

export function buildDataContext(data, query) {
  const q = query.toLowerCase()

  // Decide what context is most relevant
  const context = {}

  // Always include summary stats
  const totalSales = data.reduce((s, r) => s + Number(r.Sales), 0)
  const totalProfit = data.reduce((s, r) => s + Number(r.Profit), 0)
  const overallMargin = totalSales > 0 ? totalProfit / totalSales : 0
  context.summary = {
    totalRows: data.length,
    totalSales: Math.round(totalSales),
    totalProfit: Math.round(totalProfit),
    overallMargin: (overallMargin * 100).toFixed(2) + '%',
  }

  // Sub-category breakdown
  if (q.includes('sub') || q.includes('category') || q.includes('product') || q.includes('margin') || q.includes('profit') || q.includes('loss')) {
    const bySubcat = groupBy(data, 'Sub-Category')
    context.subCategoryBreakdown = Object.entries(bySubcat)
      .map(([subcat, rows]) => {
        const profit = rows.reduce((s, r) => s + Number(r.Profit), 0)
        const sales = rows.reduce((s, r) => s + Number(r.Sales), 0)
        return { subcat, profit: Math.round(profit), sales: Math.round(sales), margin: (sales > 0 ? (profit / sales * 100).toFixed(1) : '0') + '%' }
      })
      .sort((a, b) => a.profit - b.profit)
  }

  // Region breakdown
  if (q.includes('region') || q.includes('east') || q.includes('west') || q.includes('central') || q.includes('south') || q.includes('geo') || q.includes('location')) {
    const byRegion = groupBy(data, 'Region')
    context.regionBreakdown = Object.entries(byRegion).map(([region, rows]) => {
      const profit = rows.reduce((s, r) => s + Number(r.Profit), 0)
      const sales = rows.reduce((s, r) => s + Number(r.Sales), 0)
      return { region, profit: Math.round(profit), sales: Math.round(sales), orders: rows.length }
    })
  }

  // Discount analysis
  if (q.includes('discount') || q.includes('pricing') || q.includes('price') || q.includes('markdown')) {
    const discountBuckets = { 'no-discount': [], 'low': [], 'medium': [], 'high': [] }
    data.forEach((r) => {
      const d = Number(r.Discount)
      if (d === 0) discountBuckets['no-discount'].push(r)
      else if (d <= 0.2) discountBuckets['low'].push(r)
      else if (d <= 0.35) discountBuckets['medium'].push(r)
      else discountBuckets['high'].push(r)
    })
    context.discountAnalysis = Object.entries(discountBuckets).map(([bucket, rows]) => {
      const profit = rows.reduce((s, r) => s + Number(r.Profit), 0)
      const sales = rows.reduce((s, r) => s + Number(r.Sales), 0)
      return { bucket, orders: rows.length, profit: Math.round(profit), margin: (sales > 0 ? (profit / sales * 100).toFixed(1) : '0') + '%' }
    })
  }

  // Shipping
  if (q.includes('ship') || q.includes('delivery') || q.includes('fulfillment')) {
    const byMode = groupBy(data, 'Ship Mode')
    context.shippingBreakdown = Object.entries(byMode).map(([mode, rows]) => {
      const profit = rows.reduce((s, r) => s + Number(r.Profit), 0)
      const sales = rows.reduce((s, r) => s + Number(r.Sales), 0)
      return { mode, orders: rows.length, profit: Math.round(profit), margin: (sales > 0 ? (profit / sales * 100).toFixed(1) : '0') + '%' }
    })
  }

  // Segment
  if (q.includes('segment') || q.includes('consumer') || q.includes('corporate') || q.includes('customer')) {
    const bySeg = groupBy(data, 'Segment')
    context.segmentBreakdown = Object.entries(bySeg).map(([seg, rows]) => {
      const profit = rows.reduce((s, r) => s + Number(r.Profit), 0)
      const sales = rows.reduce((s, r) => s + Number(r.Sales), 0)
      return { segment: seg, orders: rows.length, profit: Math.round(profit), sales: Math.round(sales) }
    })
  }

  // YoY
  if (q.includes('year') || q.includes('yoy') || q.includes('trend') || q.includes('growth') || q.includes('2020') || q.includes('2021') || q.includes('2022') || q.includes('2023')) {
    const byYear = groupBy(data, (r) => String(getYear(r)))
    context.yearlyTrends = Object.entries(byYear).map(([year, rows]) => {
      const profit = rows.reduce((s, r) => s + Number(r.Profit), 0)
      const sales = rows.reduce((s, r) => s + Number(r.Sales), 0)
      return { year, orders: rows.length, sales: Math.round(sales), profit: Math.round(profit) }
    }).sort((a, b) => Number(a.year) - Number(b.year))
  }

  return JSON.stringify(context, null, 2)
}
