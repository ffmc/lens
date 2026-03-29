import { useState, useEffect } from 'react'
import Papa from 'papaparse'
import { computeAllInsights, detectAnomalies } from '../lib/insights'

export function useSuperstoreData() {
  const [data, setData] = useState([])
  const [insights, setInsights] = useState([])
  const [anomalies, setAnomalies] = useState([])
  const [metadata, setMetadata] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Papa.parse(`${import.meta.env.BASE_URL}superstore.csv`, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rows = results.data.filter((row) => row['Order ID'] && row['Sales'])

          // Parse metadata
          const dates = rows
            .map((r) => {
              const d = new Date(r['Order Date'])
              return isNaN(d) ? null : d
            })
            .filter(Boolean)

          const minDate = new Date(Math.min(...dates))
          const maxDate = new Date(Math.max(...dates))

          const fmt = (d) =>
            d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

          setMetadata({
            rowCount: rows.length,
            datasetName: 'Superstore',
            dateRange: `${fmt(minDate)} – ${fmt(maxDate)}`,
            minDate,
            maxDate,
          })

          setData(rows)
          setInsights(computeAllInsights(rows))
          setAnomalies(detectAnomalies(rows))
        } catch (e) {
          setError(e)
        } finally {
          setLoading(false)
        }
      },
      error: (err) => {
        setError(err)
        setLoading(false)
      },
    })
  }, [])

  return { data, insights, anomalies, metadata, loading, error }
}
