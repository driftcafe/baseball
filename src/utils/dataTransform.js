import { ABS_DESCRIPTIONS, STRIKE_ZONE } from './constants'

// In 2026, ABS challenge pitches appear in two forms:
// 1. description = 'automatic_ball' | 'automatic_strike'  (ABS system made a fresh call)
// 2. description = 'called_strike' | 'ball' etc. with des field containing "challenged (pitch result)"

const CHALLENGE_DES_MARKER = 'challenged (pitch result)'

function isABSPitch(raw) {
  if (ABS_DESCRIPTIONS.has(raw.description)) return true
  if ((raw.des || '').includes(CHALLENGE_DES_MARKER)) return true
  return false
}

/**
 * Parse the `des` field for actual overturn outcome.
 * Examples:
 *   "Jake Burger challenged (pitch result), call on the field was confirmed: ..."  → upheld
 *   "Rafael Marchán challenged (pitch result), call on the field was overturned: ..." → overturned
 */
function parseDesOutcome(des) {
  if (!des) return null
  const lower = des.toLowerCase()
  if (lower.includes('was overturned')) return 'overturned'
  if (lower.includes('was confirmed'))  return 'upheld'
  return null
}

function isInZone(px, pz, szTop = STRIKE_ZONE.top, szBot = STRIKE_ZONE.bottom) {
  return Math.abs(px) <= STRIKE_ZONE.right && pz >= szBot && pz <= szTop
}

/**
 * Derive overturn outcome from available signals:
 * Priority 1: des field text (most accurate — real MLB data)
 * Priority 2: automatic_ball/strike + pitch location (PoC approximation)
 */
function deriveOutcome(raw, plateX, plateZ, szTop, szBot) {
  // Best signal: parse des text for "overturned" / "confirmed"
  const desOutcome = parseDesOutcome(raw.des)
  if (desOutcome) return desOutcome

  // Fallback: automatic_ball/strike + location heuristic
  const inZone = isInZone(plateX, plateZ, szTop, szBot)
  if (raw.description === 'automatic_ball')   return inZone  ? 'overturned' : 'upheld'
  if (raw.description === 'automatic_strike') return !inZone ? 'overturned' : 'upheld'

  return null
}

/** Leverage proxy: late inning × close game × runners on base */
function calcLeverage(inning, homeScore, awayScore, on1b, on2b, on3b) {
  const diff       = Math.abs(homeScore - awayScore)
  const lateFactor = Math.max(0, inning - 5) / 4
  const closeFactor = diff <= 1 ? 1.0 : diff <= 3 ? 0.6 : 0.3
  const runners    = (on1b ? 1 : 0) + (on2b ? 1 : 0) + (on3b ? 1 : 0)
  const rawLeverage = (1 + lateFactor * 2) * closeFactor * (1 + runners * 0.3)
  return Math.max(1, Math.min(5, Math.round(rawLeverage)))
}

export function transformRow(raw) {
  const plateX = parseFloat(raw.plate_x)
  const plateZ = parseFloat(raw.plate_z)
  if (isNaN(plateX) || isNaN(plateZ)) return null
  if (!isABSPitch(raw)) return null     // <-- filter here, before full transform

  const szTop     = parseFloat(raw.sz_top)  || STRIKE_ZONE.top
  const szBot     = parseFloat(raw.sz_bot)  || STRIKE_ZONE.bottom
  const homeScore = parseInt(raw.home_score) || 0
  const awayScore = parseInt(raw.away_score) || 0
  const inning    = parseInt(raw.inning)     || 1
  const on1b = !!raw.on_1b
  const on2b = !!raw.on_2b
  const on3b = !!raw.on_3b

  const outcome  = deriveOutcome(raw, plateX, plateZ, szTop, szBot)
  const leverage = calcLeverage(inning, homeScore, awayScore, on1b, on2b, on3b)

  // In 2026, player_name = batter, pitcher = numeric ID (reversed from PoC)
  // We show batter name since that's what we have
  const displayName = raw.player_name || `Batter #${raw.batter}`

  return {
    gameDate:   raw.game_date,
    gamePk:     raw.game_pk,
    playerName: displayName,
    homeTeam:   raw.home_team,
    awayTeam:   raw.away_team,
    plateX, plateZ, szTop, szBot,
    description: raw.description,
    type:        raw.type,
    pitchName:   raw.pitch_name  || '',
    releaseSpeed: parseFloat(raw.release_speed) || null,
    balls:   parseInt(raw.balls)          || 0,
    strikes: parseInt(raw.strikes)        || 0,
    outs:    parseInt(raw.outs_when_up)   || 0,
    inning,
    homeScore, awayScore, on1b, on2b, on3b,
    des: raw.des || '',   // raw play description — useful for tooltips
    outcome,
    leverage,
    // recharts keys
    x: plateX,
    y: plateZ,
  }
}

export function transformData(rawRows) {
  return rawRows
    .map(transformRow)
    .filter(r => r !== null)
}

export function groupByGame(data) {
  const map = {}
  data.forEach(p => {
    if (!map[p.gamePk]) {
      map[p.gamePk] = {
        gamePk: p.gamePk, gameDate: p.gameDate,
        homeTeam: p.homeTeam, awayTeam: p.awayTeam, pitches: []
      }
    }
    map[p.gamePk].pitches.push(p)
  })
  return Object.values(map).sort((a, b) => new Date(b.gameDate) - new Date(a.gameDate))
}

export function groupByTeam(data) {
  const map = {}
  data.forEach(p => {
    [p.homeTeam, p.awayTeam].forEach(t => {
      if (t) { if (!map[t]) map[t] = []; map[t].push(p) }
    })
  })
  return map
}

export function calcStats(pitches) {
  const total      = pitches.length
  const overturned = pitches.filter(p => p.outcome === 'overturned').length
  const withOutcome = pitches.filter(p => p.outcome !== null).length
  const avgLev     = total > 0 ? pitches.reduce((s, p) => s + p.leverage, 0) / total : 0
  return {
    total, overturned,
    overturnRate: withOutcome > 0 ? overturned / withOutcome : 0,
    avgLeverage: avgLev
  }
}

export function buildLeagueData(teamGroups) {
  return Object.entries(teamGroups)
    .map(([team, pitches]) => {
      const s = calcStats(pitches)
      return { team, ...s, x: s.total, y: +(s.overturnRate * 100).toFixed(1) }
    })
    .filter(t => t.total >= 2)
    .sort((a, b) => a.team.localeCompare(b.team))
}
