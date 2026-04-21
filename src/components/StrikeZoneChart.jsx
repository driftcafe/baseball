import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceArea, ReferenceLine, ResponsiveContainer,
} from 'recharts'

const DOMAIN_X = [-2.5, 2.5]
const DOMAIN_Y = [0.5, 5.0]
const ZONE     = { l: -0.83, r: 0.83, b: 1.5, t: 3.5 }

// ── Custom dot — color by outcome, size by leverage ─────────────────────
function CustomDot(props) {
  const { cx, cy, payload } = props
  if (!payload || isNaN(cx) || isNaN(cy)) return null

  const isOver = payload.outcome === 'overturned'
  const color  = isOver ? '#22c55e' : '#f43f5e'
  const glow   = isOver ? 'rgba(34,197,94,0.3)' : 'rgba(244,63,94,0.2)'
  const r      = Math.max(4, Math.min(14, 3 + payload.leverage * 2))

  return (
    <g>
      <circle cx={cx} cy={cy} r={r + 4} fill={glow} />
      <circle
        cx={cx} cy={cy} r={r}
        fill={color} fillOpacity={0.85}
        stroke={color} strokeWidth={1} strokeOpacity={0.5}
      />
    </g>
  )
}

// ── Tooltip ──────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const isOver  = d.outcome === 'overturned'
  const color   = isOver ? '#22c55e' : '#f43f5e'
  const icon    = isOver ? '✅' : '❌'
  const unknownOutcome = d.outcome === null
  const runners = [d.on1b && '1B', d.on2b && '2B', d.on3b && '3B'].filter(Boolean).join(', ')

  // Shorten des to 100 chars for tooltip
  const shortDes = d.des && d.des.length > 130 ? d.des.substring(0, 127) + '…' : d.des

  return (
    <div className="chart-tooltip">
      <div className="tt-name">{d.playerName}</div>
      <div className="tt-separator" />
      <div className="tt-row"><span>Count</span>    <span>{d.balls}–{d.strikes}, {d.outs} out{d.outs !== 1 ? 's' : ''}</span></div>
      <div className="tt-row"><span>Inning</span>   <span>{d.inning}</span></div>
      <div className="tt-row"><span>Score</span>    <span>{d.awayTeam} {d.awayScore} – {d.homeTeam} {d.homeScore}</span></div>
      {runners && <div className="tt-row"><span>On base</span><span>{runners}</span></div>}
      {d.pitchName && <div className="tt-row"><span>Pitch</span><span>{d.pitchName}{d.releaseSpeed ? ` ${d.releaseSpeed} mph` : ''}</span></div>}
      <div className="tt-row"><span>Location</span> <span>({d.plateX.toFixed(2)}, {d.plateZ.toFixed(2)})</span></div>
      {shortDes && (
        <>
          <div className="tt-separator" />
          <div className="tt-des">{shortDes}</div>
        </>
      )}
      <div className="tt-separator" />
      {unknownOutcome
        ? <div className="tt-outcome" style={{ color: '#64748b' }}>⚾ ABS CHALLENGE</div>
        : <div className="tt-outcome" style={{ color }}>{icon} {d.outcome?.toUpperCase()}</div>
      }
      <div className="tt-row leverage-row"><span>Leverage</span><span>{d.leverage.toFixed(1)} / 5.0</span></div>
    </div>
  )
}

// ── Main chart ───────────────────────────────────────────────────────────
export function StrikeZoneChart({ data, jitter = false }) {
  const plotData = jitter
    ? data.map(d => ({ ...d, x: d.plateX + (Math.random() - 0.5) * 0.05, y: d.plateZ + (Math.random() - 0.5) * 0.05 }))
    : data

  return (
    <div className="sz-chart-wrap">
      <ResponsiveContainer width="100%" height={520}>
        <ScatterChart margin={{ top: 24, right: 32, bottom: 40, left: 20 }}>
          <CartesianGrid stroke="rgba(30,45,70,0.55)" strokeDasharray="3 3" />

          <XAxis
            dataKey="x" type="number" domain={DOMAIN_X} tickCount={7}
            tick={{ fill: '#4b5e7a', fontSize: 11 }} axisLine={{ stroke: '#1e2d45' }} tickLine={false}
            label={{ value: 'Horizontal Position (ft)', position: 'insideBottom', offset: -22, fill: '#4b5e7a', fontSize: 11 }}
          />
          <YAxis
            dataKey="y" type="number" domain={DOMAIN_Y} tickCount={6}
            tick={{ fill: '#4b5e7a', fontSize: 11 }} axisLine={{ stroke: '#1e2d45' }} tickLine={false}
            label={{ value: 'Height (ft)', angle: -90, position: 'insideLeft', offset: 10, fill: '#4b5e7a', fontSize: 11 }}
          />

          {/* Strike zone fill */}
          <ReferenceArea
            x1={ZONE.l} x2={ZONE.r} y1={ZONE.b} y2={ZONE.t}
            fill="rgba(59,130,246,0.04)" stroke="rgba(59,130,246,0.45)" strokeWidth={1.5}
          />

          {/* Heart of the plate (inner 1/3) */}
          <ReferenceArea
            x1={ZONE.l * 0.33} x2={ZONE.r * 0.33} y1={ZONE.b + 0.5} y2={ZONE.t - 0.5}
            fill="rgba(59,130,246,0.03)" stroke="rgba(59,130,246,0.15)" strokeWidth={0.5}
            strokeDasharray="3 3"
          />

          {/* Center reference */}
          <ReferenceLine x={0} stroke="rgba(255,255,255,0.04)" strokeDasharray="2 6" />

          <Scatter data={plotData} shape={(props) => <CustomDot {...props} />} opacity={jitter ? 0.8 : 0.9} />
          <Tooltip content={<ChartTooltip />} cursor={false} />
        </ScatterChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="chart-legend">
        <div className="legend-item">
          <span className="lg-dot" style={{ background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.5)' }} />
          Overturned
        </div>
        <div className="legend-item">
          <span className="lg-dot" style={{ background: '#f43f5e', boxShadow: '0 0 6px rgba(244,63,94,0.4)' }} />
          Upheld
        </div>
        <div className="legend-item muted">
          <span className="lg-dot" style={{ background: '#94a3b8', width: '8px', height: '8px' }} />
          Dot size = leverage
        </div>
      </div>
    </div>
  )
}
