import { useState, useMemo } from 'react'
import { RealisticStrikeZone } from './RealisticStrikeZone'
import { calcStats } from '../utils/dataTransform'

function StatBadge({ value, label, highlight, tooltip }) {
  return (
    <div className="stat-badge">
      <span className={`stat-val${highlight ? ' hi' : ''}`}>{value}</span>
      <span className="stat-lbl">
        {tooltip ? (
          <span 
            className="info-bubble" 
            data-tooltip={tooltip}
            style={{ cursor: 'help', borderBottom: '1px dotted #8b9bb4', padding: 0 }}
          >
            {label}
          </span>
        ) : (
          label
        )}
      </span>
    </div>
  )
}

export function GameView({ games }) {
  const [filterTeam, setFilterTeam] = useState('All')
  const [idx, setIdx] = useState(0)

  const teams = useMemo(() => {
    const t = new Set()
    games.forEach(g => {
      if (g.homeTeam) t.add(g.homeTeam)
      if (g.awayTeam) t.add(g.awayTeam)
    })
    return ['All', ...Array.from(t).sort()]
  }, [games])

  const filteredGames = useMemo(() => {
    if (filterTeam === 'All') return games
    return games.filter(g => g.homeTeam === filterTeam || g.awayTeam === filterTeam)
  }, [games, filterTeam])

  const game = filteredGames[idx]
  const stats = useMemo(() => game ? calcStats(game.pitches) : null, [game])

  if (!games.length) {
    return (
      <div className="empty-state">
        <div className="empty-icon">⚾</div>
        <p>No ABS challenge events found for 2026 yet.</p>
        <p className="empty-sub">Check back after games with ABS challenges have been played.</p>
      </div>
    )
  }

  return (
    <div className="view-body">
      {/* Game selector */}
      <div className="view-controls">
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="selector-wrap">
            <label className="selector-label">TEAM</label>
            <select
              className="game-select"
              style={{ width: '100px' }}
              value={filterTeam}
              onChange={e => {
                setFilterTeam(e.target.value)
                setIdx(0)
              }}
            >
              {teams.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          
          <div className="selector-wrap">
            <label className="selector-label">GAME</label>
            <select
              className="game-select"
              value={idx}
              onChange={e => setIdx(Number(e.target.value))}
              disabled={filteredGames.length === 0}
            >
              {filteredGames.length === 0 ? (
                <option>No games found</option>
              ) : (
                filteredGames.map((g, i) => (
                  <option key={g.gamePk} value={i}>
                    {g.gameDate} — {g.awayTeam} @ {g.homeTeam}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {stats && (
          <div className="stats-row">
            <StatBadge value={stats.total}                              label="Challenges" />
            <StatBadge value={stats.overturned}                         label="Overturned"  highlight />
            <StatBadge value={`${(stats.overturnRate * 100).toFixed(0)}%`} label="Overturn Rate" highlight />
            <StatBadge 
              value={stats.avgLeverage.toFixed(1)}             
              label="Avg Leverage" 
              tooltip="Leverage (0-5) estimates how crucial a pitch was based on inning, score closeness, and runners on base." 
            />
          </div>
        )}
      </div>

      {game && <RealisticStrikeZone data={game.pitches} />}
    </div>
  )
}
