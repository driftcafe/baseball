import { useState, useEffect } from 'react'
import { parseCSV } from '../utils/csvParser'
import { transformData, groupByGame, groupByTeam, buildLeagueData } from '../utils/dataTransform'

// We now use an edge-cached static dataset bundled in the public folder
const buildUrl = (year = '2026') => `/abs_data_${year}.csv`

export function useABSData(year = '2026') {
  const [state, setState] = useState({
    loading: true,
    error:   null,
    year,
    challenges:  [],
    games:       [],
    teamGroups:  {},
    leagueData:  [],
    rawCount:    0,
  })

  useEffect(() => {
    let cancelled = false
    setState(s => ({ ...s, loading: true, error: null }))

    async function fetchData() {
      const url = buildUrl(year)
      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`)

        const text = await res.text()
        if (text.trim().startsWith('<')) {
          throw new Error(
            'Received HTML instead of CSV.\n' +
            'The Vite dev server proxy may not be active — run: npm run dev'
          )
        }

        const rawRows   = parseCSV(text)
        const challenges = transformData(rawRows)
        const games      = groupByGame(challenges)
        const teamGroups = groupByTeam(challenges)
        const leagueData = buildLeagueData(teamGroups)

        if (!cancelled) {
          setState({
            loading: false, error: null, year,
            challenges, games, teamGroups, leagueData,
            rawCount: rawRows.length,
          })
        }
      } catch (err) {
        if (!cancelled) setState(s => ({ ...s, loading: false, error: err.message }))
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [year])

  return state
}
