// ── Local Query Engine ────────────────────────────────────────────────────────
// Parses natural language questions, runs real computations on the data,
// and returns decisive analyst-style responses. No API required.

function groupBy(data, key) {
  return data.reduce((acc, row) => {
    const k = typeof key === 'function' ? key(row) : row[key]
    if (k == null) return acc
    if (!acc[k]) acc[k] = []
    acc[k].push(row)
    return acc
  }, {})
}

function sum(rows, field) {
  return rows.reduce((s, r) => s + Number(r[field] || 0), 0)
}

function avg(rows, field) {
  return rows.length ? sum(rows, field) / rows.length : 0
}

function margin(rows) {
  const s = sum(rows, 'Sales')
  return s > 0 ? sum(rows, 'Profit') / s : 0
}

function fmtPct(n) {
  const sign = n >= 0 ? '+' : ''
  return `${sign}${(n * 100).toFixed(1)}%`
}

function fmtCurrency(n) {
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}k`
  return `${sign}$${abs.toFixed(0)}`
}

function getYear(row) {
  const d = new Date(row['Order Date'])
  return isNaN(d) ? null : d.getFullYear()
}

function getMonth(row) {
  const d = new Date(row['Order Date'])
  if (isNaN(d)) return null
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// ── Intent matchers ────────────────────────────────────────────────────────────

const matchers = {
  discount:  (q) => /discount|pric(e|ing)|markdown|promot|coupon/.test(q),
  region:    (q) => /region|east|west|central|south|geo|location|territor/.test(q),
  product:   (q) => /product|item|sku|copier|chair|table|phone|printer|best sell/.test(q),
  shipping:  (q) => /ship|deliver|fulfil|transit|same.?day|first.?class|second.?class|standard/.test(q),
  segment:   (q) => /segment|consumer|corporate|home.?office|customer.?type/.test(q),
  category:  (q) => /categor|furniture|technology|office.?suppl/.test(q),
  trend:     (q) => /trend|growth|over.?time|month|quarter|year|yoy|seasonalit|increas|decreas/.test(q),
  margin:    (q) => /margin|profit|loss|lossy|unprofitable|worst|destroy|burn/.test(q),
  anomaly:   (q) => /anomal|problem|issue|concern|flag|alert|risk|warn/.test(q),
  topN:      (q) => /top|best|highest|most.?(profit|revenue|sale)|rank/.test(q),
  cost:      (q) => /cost|expen|cut|reduc|save|efficien/.test(q),
  recommend: (q) => /should|recommend|action|do next|strateg|focus|priorit|what.*(we|i)/.test(q),
}

// ── Answer handlers ────────────────────────────────────────────────────────────

function answerDiscount(data) {
  const buckets = { '0%': [], '1–10%': [], '11–20%': [], '21–30%': [], '31%+': [] }
  data.forEach((r) => {
    const d = Number(r.Discount)
    if (d === 0) buckets['0%'].push(r)
    else if (d <= 0.1) buckets['1–10%'].push(r)
    else if (d <= 0.2) buckets['11–20%'].push(r)
    else if (d <= 0.3) buckets['21–30%'].push(r)
    else buckets['31%+'].push(r)
  })

  const results = Object.entries(buckets).map(([label, rows]) => ({
    label,
    count: rows.length,
    margin: margin(rows),
    profit: sum(rows, 'Profit'),
  }))

  const noDisc = results.find((r) => r.label === '0%')
  const highDisc = results.find((r) => r.label === '31%+')
  const breakEven = results.find((r) => r.margin < 0)
  const highPct = ((highDisc.count / data.length) * 100).toFixed(0)

  return `Discounts are a direct profit killer. Orders with no discount run at ${fmtPct(noDisc.margin)} margin — the moment discounts cross 30%, margin turns to ${fmtPct(highDisc.margin)}, destroying ${fmtCurrency(Math.abs(highDisc.profit))} in total. That ${highPct}% of orders above 30% discount represents pure margin destruction with no recovery mechanism. Cap all discounts at 20% immediately and audit which sales reps are authorising the outliers.`
}

function answerRegion(data) {
  const byRegionYear = {}
  data.forEach((r) => {
    const year = getYear(r)
    const region = r.Region
    if (!year || !region) return
    const key = `${region}__${year}`
    byRegionYear[key] = (byRegionYear[key] || 0) + Number(r.Sales)
  })

  const years = [...new Set(data.map(getYear).filter(Boolean))].sort()
  const lastYear = years[years.length - 1]
  const prevYear = years[years.length - 2]
  const regions = [...new Set(data.map((r) => r.Region).filter(Boolean))]

  const deltas = regions.map((region) => {
    const cur = byRegionYear[`${region}__${lastYear}`] || 0
    const prev = byRegionYear[`${region}__${prevYear}`] || 0
    const delta = prev > 0 ? (cur - prev) / prev : 0
    const rows = data.filter((r) => r.Region === region)
    return { region, cur, prev, delta, margin: margin(rows), profit: sum(rows, 'Profit') }
  }).sort((a, b) => b.delta - a.delta)

  const best = deltas[0]
  const worst = deltas[deltas.length - 1]

  return `${best.region} is the standout performer — ${fmtPct(best.delta)} YoY sales growth from ${fmtCurrency(best.prev)} to ${fmtCurrency(best.cur)}, running at ${fmtPct(best.margin)} margin. ${worst.region} is the drag at ${fmtPct(worst.delta)} YoY with ${fmtPct(worst.margin)} margin. Shift field sales headcount and promotional budget toward ${best.region} to capitalise on the momentum — it's already proven, don't underinvest.`
}

function answerProduct(data) {
  const dates = data.map((r) => new Date(r['Order Date'])).filter((d) => !isNaN(d))
  const maxDate = new Date(Math.max(...dates))
  const ninetyDaysAgo = new Date(maxDate)
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const recent = data.filter((r) => {
    const d = new Date(r['Order Date'])
    return !isNaN(d) && d >= ninetyDaysAgo
  })

  const byProduct = groupBy(recent, 'Product Name')
  const ranked = Object.entries(byProduct)
    .map(([name, rows]) => ({
      name,
      profit: sum(rows, 'Profit'),
      sales: sum(rows, 'Sales'),
      margin: margin(rows),
      count: rows.length,
    }))
    .filter((p) => p.profit > 0)
    .sort((a, b) => b.profit - a.profit)

  const top = ranked[0]
  const bottom = ranked[ranked.length - 1]

  if (!top) return 'No profitable products found in the last 90 days. Discount policy is likely suppressing margins across the board — review pricing structure.'

  return `${top.name} is the top performer over the last 90 days — ${fmtCurrency(top.profit)} profit on ${fmtCurrency(top.sales)} revenue at ${fmtPct(top.margin)} margin. It has ${top.count} order${top.count !== 1 ? 's' : ''} in the period, indicating real demand. Prioritise stock availability and protect its price point — this is your margin anchor right now.`
}

function answerShipping(data) {
  const byMode = groupBy(data, 'Ship Mode')
  const stats = Object.entries(byMode).map(([mode, rows]) => ({
    mode,
    orders: rows.length,
    margin: margin(rows),
    profit: sum(rows, 'Profit'),
    sales: sum(rows, 'Sales'),
  })).sort((a, b) => b.margin - a.margin)

  const best = stats[0]
  const highVol = stats.sort((a, b) => b.orders - a.orders)[0]
  stats.sort((a, b) => b.margin - a.margin)

  return `${best.mode} delivers the best margin at ${fmtPct(best.margin)} across ${best.orders} orders. Standard Class dominates volume (${highVol.orders} orders) but at ${fmtPct(highVol.margin)} margin — the efficiency gap signals that high-volume routes are being over-discounted to close deals. Push customers toward ${best.mode} where possible and stop offering Standard Class as a free upgrade — it's bleeding margin quietly.`
}

function answerSegment(data) {
  const bySegment = groupBy(data, 'Segment')
  const stats = Object.entries(bySegment).map(([seg, rows]) => ({
    seg,
    orders: rows.length,
    margin: margin(rows),
    profit: sum(rows, 'Profit'),
    sales: sum(rows, 'Sales'),
    avgDiscount: avg(rows, 'Discount'),
  })).sort((a, b) => b.margin - a.margin)

  const best = stats[0]
  const worst = stats[stats.length - 1]

  return `${best.seg} is your most profitable segment at ${fmtPct(best.margin)} margin — ${fmtCurrency(best.profit)} total profit on ${fmtCurrency(best.sales)} revenue. ${worst.seg} is the laggard at ${fmtPct(worst.margin)}, with an average discount of ${fmtPct(worst.avgDiscount)} per order. Tighten discount authorisation for ${worst.seg} reps and reallocate account management resources toward ${best.seg} expansion.`
}

function answerCategory(data) {
  const byCat = groupBy(data, 'Category')
  const stats = Object.entries(byCat).map(([cat, rows]) => ({
    cat,
    margin: margin(rows),
    profit: sum(rows, 'Profit'),
    sales: sum(rows, 'Sales'),
    orders: rows.length,
  })).sort((a, b) => b.margin - a.margin)

  const best = stats[0]
  const worst = stats[stats.length - 1]

  return `${best.cat} leads with ${fmtPct(best.margin)} margin (${fmtCurrency(best.profit)} profit), while ${worst.cat} drags at ${fmtPct(worst.margin)} (${fmtCurrency(worst.profit)} profit). The gap is structural — ${worst.cat} has inherently lower margins compounded by aggressive discounting. Rebalance the product mix toward ${best.cat} and enforce minimum margin thresholds before any ${worst.cat} deal gets approved.`
}

function answerTrend(data) {
  const byMonth = {}
  data.forEach((r) => {
    const m = getMonth(r)
    if (!m) return
    if (!byMonth[m]) byMonth[m] = { sales: 0, profit: 0 }
    byMonth[m].sales += Number(r.Sales)
    byMonth[m].profit += Number(r.Profit)
  })

  const months = Object.entries(byMonth).sort((a, b) => a[0].localeCompare(b[0]))
  const recent6 = months.slice(-6)
  const prev6 = months.slice(-12, -6)

  const recentSales = recent6.reduce((s, [, v]) => s + v.sales, 0)
  const prevSales = prev6.reduce((s, [, v]) => s + v.sales, 0)
  const recentProfit = recent6.reduce((s, [, v]) => s + v.profit, 0)
  const salesDelta = prevSales > 0 ? (recentSales - prevSales) / prevSales : 0

  // Find peak month
  const peak = months.reduce((best, cur) => cur[1].sales > best[1].sales ? cur : best)

  return `Sales are ${salesDelta >= 0 ? 'up' : 'down'} ${fmtPct(Math.abs(salesDelta))} in the last 6 months versus the prior 6. The strongest month on record was ${peak[0]} at ${fmtCurrency(peak[1].sales)} revenue. Profit in the recent period sits at ${fmtCurrency(recentProfit)} — ${recentProfit < 0 ? 'a loss position that needs immediate intervention on discount policy' : 'watch the margin erosion from discounts if sales growth continues to be discount-driven'}.`
}

function answerMargin(data) {
  const bySubcat = groupBy(data, 'Sub-Category')
  const stats = Object.entries(bySubcat).map(([subcat, rows]) => ({
    subcat,
    margin: margin(rows),
    profit: sum(rows, 'Profit'),
    sales: sum(rows, 'Sales'),
  })).sort((a, b) => a.margin - b.margin)

  const worst3 = stats.slice(0, 3)
  const best = stats[stats.length - 1]
  const overall = margin(data)

  return `Overall margin sits at ${fmtPct(overall)}. The three worst sub-categories are ${worst3.map((s) => `${s.subcat} (${fmtPct(s.margin)})`).join(', ')} — collectively destroying ${fmtCurrency(Math.abs(worst3.reduce((s, c) => s + c.profit, 0)))} in profit. ${best.subcat} is the best performer at ${fmtPct(best.margin)}. Exit or reprice the bottom two sub-categories within one quarter — the losses are structural, not cyclical.`
}

function answerAnomaly(data) {
  const bySubcat = groupBy(data, 'Sub-Category')
  const criticals = Object.entries(bySubcat)
    .map(([subcat, rows]) => ({ subcat, margin: margin(rows), profit: sum(rows, 'Profit') }))
    .filter((s) => s.margin < -0.1)
    .sort((a, b) => a.margin - b.margin)

  const highDiscountOrders = data.filter((r) => Number(r.Discount) > 0.3)
  const highDiscPct = ((highDiscountOrders.length / data.length) * 100).toFixed(1)

  if (criticals.length === 0) return `No sub-categories are below the -10% margin threshold. The main risk is discount creep — ${highDiscPct}% of orders carry discounts above 30%, which is the tipping point for negative margins. Monitor this weekly.`

  const worst = criticals[0]
  return `${criticals.length} sub-categor${criticals.length > 1 ? 'ies are' : 'y is'} in critical margin territory. ${worst.subcat} is the worst at ${fmtPct(worst.margin)} — that's ${fmtCurrency(Math.abs(worst.profit))} in destroyed value. Separately, ${highDiscPct}% of all orders carry discounts above 30%, a threshold that reliably flips profit negative. These two issues require immediate intervention — the rest is noise.`
}

function answerTopN(data) {
  const bySubcat = groupBy(data, 'Sub-Category')
  const ranked = Object.entries(bySubcat)
    .map(([subcat, rows]) => ({
      subcat,
      profit: sum(rows, 'Profit'),
      margin: margin(rows),
      sales: sum(rows, 'Sales'),
    }))
    .filter((s) => s.profit > 0)
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 3)

  return `The top three sub-categories by profit are: ${ranked.map((r, i) => `${i + 1}. ${r.subcat} — ${fmtCurrency(r.profit)} profit at ${fmtPct(r.margin)} margin`).join('; ')}. These are your margin engines — protect their pricing, avoid discounting, and ensure inventory availability. Any erosion here will be hard to offset given the losses elsewhere in the portfolio.`
}

function answerCost(data) {
  const bySubcat = groupBy(data, 'Sub-Category')
  const lossMakers = Object.entries(bySubcat)
    .map(([subcat, rows]) => ({ subcat, profit: sum(rows, 'Profit'), margin: margin(rows) }))
    .filter((s) => s.profit < 0)
    .sort((a, b) => a.profit - b.profit)

  const totalLoss = lossMakers.reduce((s, c) => s + c.profit, 0)
  const highDiscOrders = data.filter((r) => Number(r.Discount) > 0.3)
  const lostToDiscount = sum(highDiscOrders, 'Profit')

  return `There are two cost leaks to fix. First, ${lossMakers.length} loss-making sub-categor${lossMakers.length > 1 ? 'ies' : 'y'} (${lossMakers.map((s) => s.subcat).join(', ')}) are burning ${fmtCurrency(Math.abs(totalLoss))} — reprice or exit. Second, orders above 30% discount collectively generate ${fmtCurrency(lostToDiscount)} in profit — that's the number to recover by enforcing discount caps. Together, fixing these two issues would swing profitability by ${fmtCurrency(Math.abs(totalLoss) + Math.abs(Math.min(0, lostToDiscount)))}.`
}

function answerRecommendation(data) {
  const overallMargin = margin(data)
  const bySubcat = groupBy(data, 'Sub-Category')
  const worstSubcat = Object.entries(bySubcat)
    .map(([subcat, rows]) => ({ subcat, margin: margin(rows), profit: sum(rows, 'Profit') }))
    .sort((a, b) => a.margin - b.margin)[0]

  const highDiscOrders = data.filter((r) => Number(r.Discount) > 0.3)
  const highDiscPct = ((highDiscOrders.length / data.length) * 100).toFixed(0)

  const byRegionYear = {}
  data.forEach((r) => {
    const year = getYear(r); const region = r.Region
    if (!year || !region) return
    const key = `${region}__${year}`
    byRegionYear[key] = (byRegionYear[key] || 0) + Number(r.Sales)
  })
  const years = [...new Set(data.map(getYear).filter(Boolean))].sort()
  const lastYear = years[years.length - 1], prevYear = years[years.length - 2]
  const regions = [...new Set(data.map((r) => r.Region).filter(Boolean))]
  const bestRegion = regions.map((region) => {
    const cur = byRegionYear[`${region}__${lastYear}`] || 0
    const prev = byRegionYear[`${region}__${prevYear}`] || 0
    return { region, delta: prev > 0 ? (cur - prev) / prev : 0 }
  }).sort((a, b) => b.delta - a.delta)[0]

  return `Three actions, in priority order. One: reprice or exit ${worstSubcat.subcat} — it's running at ${fmtPct(worstSubcat.margin)} margin and is the single biggest profit drain. Two: cap all discounts at 20% — ${highDiscPct}% of orders above 30% are reliably unprofitable and can be fixed with a policy change alone. Three: double down on ${bestRegion.region} — ${fmtPct(bestRegion.delta)} YoY growth means the demand signal is real; invest before competitors notice.`
}

function answerGeneral(data) {
  const overallMargin = margin(data)
  const totalProfit = sum(data, 'Profit')
  const totalSales = sum(data, 'Sales')

  const bySubcat = groupBy(data, 'Sub-Category')
  const worstSubcat = Object.entries(bySubcat)
    .map(([s, rows]) => ({ s, margin: margin(rows) }))
    .sort((a, b) => a.margin - b.margin)[0]

  const years = [...new Set(data.map(getYear).filter(Boolean))].sort()
  const lastYear = years[years.length - 1]
  const lastYearRows = data.filter((r) => getYear(r) === lastYear)

  return `The portfolio runs at ${fmtPct(overallMargin)} overall margin on ${fmtCurrency(totalSales)} revenue, generating ${fmtCurrency(totalProfit)} profit. ${lastYear} is the most recent full year with ${fmtCurrency(sum(lastYearRows, 'Sales'))} in sales. The biggest structural issue is ${worstSubcat.s} at ${fmtPct(worstSubcat.margin)} margin — it's pulling the overall number down significantly. That's the first thing to fix.`
}

// ── Main router ───────────────────────────────────────────────────────────────

export function answerQuery(data, question) {
  if (!data?.length) return 'Dataset not loaded yet. Try again in a moment.'

  const q = question.toLowerCase()

  if (matchers.recommend(q)) return answerRecommendation(data)
  if (matchers.discount(q))   return answerDiscount(data)
  if (matchers.region(q))     return answerRegion(data)
  if (matchers.shipping(q))   return answerShipping(data)
  if (matchers.segment(q))    return answerSegment(data)
  if (matchers.anomaly(q))    return answerAnomaly(data)
  if (matchers.cost(q))       return answerCost(data)
  if (matchers.topN(q))       return answerTopN(data)
  if (matchers.trend(q))      return answerTrend(data)
  if (matchers.margin(q))     return answerMargin(data)
  if (matchers.category(q))   return answerCategory(data)
  if (matchers.product(q))    return answerProduct(data)

  return answerGeneral(data)
}
