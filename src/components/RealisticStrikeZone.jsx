import { useState } from 'react'

// Strike zone dimensions in feet
// Plate is 17 inches wide = 1.416 feet (-0.71 to 0.71)
const STRIKE_ZONE = { left: -0.71, right: 0.71, bottom: 1.5, top: 3.5 }

// Using variables that align with the visual zoom of the stadium image
// By reducing RANGE_X, points spread out more horizontally (visually wider)
const LOGICAL_WIDTH_FT = 3.81 // Decreased by 5% from 4.0 to scale graphics up by 5%
// The strike zone's physical mid-point is at Z = 2.5ft
// Setting GROUND_Y_PERCENT to 108.4 puts the center of the strike zone (2.5ft) exactly at 50% (vertical center) of the square image
const LOGICAL_HEIGHT_FT = 4.28 // Decreased by 5% from 4.5
const GROUND_Y_PERCENT = 108.4

export function RealisticStrikeZone({ data, title = '' }) {
  const [hovered, setHovered] = useState(null)
  const [hoveredLeverage, setHoveredLeverage] = useState(null)
  const [hoveredOutcome, setHoveredOutcome] = useState(null)
  
  // Enforce rounding so any cached floats become integers 1-5
  const presentLeverages = new Set(data.map(d => Math.max(1, Math.min(5, Math.round(d.leverage)))))
  // Mapping functions: feet to %
  const getX = (plateX) => 50 + (plateX / LOGICAL_WIDTH_FT) * 100
  const getY = (plateZ) => GROUND_Y_PERCENT - (plateZ / LOGICAL_HEIGHT_FT) * 100

  const zoneLeft = getX(STRIKE_ZONE.left)
  const zoneRight = getX(STRIKE_ZONE.right)
  const zoneTop = getY(STRIKE_ZONE.top)
  const zoneBottom = getY(STRIKE_ZONE.bottom)
  const zoneWidth = zoneRight - zoneLeft
  const zoneHeight = zoneBottom - zoneTop

  return (
    <div className="realistic-sz-container">
      <div className="stadium-bg">
        <img src="/stadium_bg_v2.jpg" alt="stadium" className="sz-img-bg" />
        <div className="sz-overlay-area">
          
          {/* Main strike zone box */}
          <div 
            className="sz-box"
            style={{
              left: `${zoneLeft}%`,
              top: `${zoneTop}%`,
              width: `${zoneWidth}%`,
              height: `${zoneHeight}%`,
            }}
          >
            {/* Box divisions - inner thirds */}
            <div className="sz-grid" />
          </div>

          {/* Pitches */}
          {data.map((d, i) => {
            const isOver = d.outcome === 'overturned'
            const isHover = hovered === i
            const levInt = Math.max(1, Math.min(5, Math.round(d.leverage)))
            // Baseball size based on leverage, scaled up by 5% as requested
            const baseSize = 16
            // we use levInt which is now 1-5 integer
            const size = (baseSize + levInt * 4) * 1.05
            
            const isTargetLeverage = hoveredLeverage === levInt
            const isTargetOutcome = hoveredOutcome === d.outcome
            
            const fadeLeverage = hoveredLeverage !== null && !isTargetLeverage
            const fadeOutcome = hoveredOutcome !== null && !isTargetOutcome
            
            const fade = fadeLeverage || fadeOutcome

            return (
              <div 
                key={i}
                className={`pitch-dot ${isOver ? 'overturned' : 'upheld'} ${isHover ? 'hovered' : ''}`}
                style={{
                  left: `${getX(d.plateX)}%`,
                  top: `${getY(d.plateZ)}%`,
                  width: `${size}px`,
                  height: `${size}px`,
                  transform: 'translate(-50%, -50%)',
                  zIndex: isHover ? 10 : (isTargetLeverage ? 5 : 2),
                  opacity: fade ? 0.15 : 1,
                  transition: 'opacity 0.2s ease',
                }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                <div className="baseball-texture" />
              </div>
            )
          })}

          {/* Tooltip implementation */}
          {hovered !== null && data[hovered] && (
            <RealisticTooltip d={data[hovered]} x={getX(data[hovered].plateX)} y={getY(data[hovered].plateZ)} />
          )}

        </div>
      </div>
      
      {/* Legend below the stadium view */}
      <div className="realistic-sz-controls">
         <div className="chart-legend" style={{background: '#0d1520', border: '1px solid var(--border-hi)', padding: '0.5rem 1rem', borderRadius: '100px', display: 'inline-flex'}}>
          <div 
            className="legend-item"
            onMouseEnter={() => setHoveredOutcome('overturned')}
            onMouseLeave={() => setHoveredOutcome(null)}
            style={{ 
              cursor: 'pointer',
              opacity: hoveredOutcome && hoveredOutcome !== 'overturned' ? 0.4 : 1,
              transition: 'opacity 0.2s ease',
            }}
          >
            <span className="lg-dot" style={{ background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
            Overturned
          </div>
          <div 
            className="legend-item"
            onMouseEnter={() => setHoveredOutcome('upheld')}
            onMouseLeave={() => setHoveredOutcome(null)}
            style={{ 
              cursor: 'pointer',
              opacity: hoveredOutcome && hoveredOutcome !== 'upheld' ? 0.4 : 1,
              transition: 'opacity 0.2s ease',
            }}
          >
            <span className="lg-dot" style={{ background: '#f43f5e', boxShadow: '0 0 6px #f43f5e' }} />
            Upheld
          </div>
          <div className="legend-item" style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
              <span 
                className="info-bubble" 
                data-tooltip="Pitches change size dynamically based on their importance. Late innings, close scores, and runners on base increase the leverage multiplier."
                style={{ color: '#8b9bb4', cursor: 'help', borderBottom: '1px dotted #8b9bb4', padding: '0' }}
              >
                Leverage
              </span>
            </div>
            <div className="leverage-circles" style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', marginLeft: '0.4rem' }}>
              {[1, 2, 3, 4, 5].map(lev => {
                const isPresent = presentLeverages.has(lev)
                const levSize = 16 + lev * 4
                // Match the visual styling of the reference image
                const isActive = isPresent && (hoveredLeverage === null || hoveredLeverage === lev)
                const isHoveredSelf = hoveredLeverage === lev
                
                return (
                  <div 
                    key={lev}
                    onMouseEnter={() => isPresent && setHoveredLeverage(lev)}
                    onMouseLeave={() => isPresent && setHoveredLeverage(null)}
                    style={{
                      width: `${levSize}px`,
                      height: `${levSize}px`,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      border: isPresent ? '1px solid #4a5b78' : '1px solid #2d3b54',
                      background: isPresent ? (isHoveredSelf ? '#ffffff' : '#e2e8f0') : 'transparent',
                      color: isPresent ? '#0f172a' : '#475569',
                      cursor: isPresent ? 'pointer' : 'default',
                      opacity: isActive ? 1 : 0.4,
                      transition: 'all 0.2s ease',
                      fontWeight: isPresent ? '500' : '400',
                      boxShadow: isHoveredSelf ? '0 0 8px rgba(255,255,255,0.4)' : 'none'
                    }}
                  >
                    {lev}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function RealisticTooltip({ d, x, y }) {
  const isOver = d.outcome === 'overturned'
  const color = isOver ? '#22c55e' : '#f43f5e'
  const icon = isOver ? '✅' : '❌'
  const runners = [d.on1b && '1B', d.on2b && '2B', d.on3b && '3B'].filter(Boolean).join(', ')
  const shortDes = d.des && d.des.length > 130 ? d.des.substring(0, 127) + '…' : d.des

  // Calculate miss distance in inches (home plate is 17 inches = 0.708 ft from center to edge)
  const dx = Math.max(0, Math.abs(d.plateX) - 0.71)
  const dzTop = Math.max(0, d.plateZ - d.szTop)
  const dzBot = Math.max(0, d.szBot - d.plateZ)
  const dz = dzTop > 0 ? dzTop : dzBot
  const distFt = Math.sqrt(dx * dx + dz * dz)
  
  // Since ABS logic is essentially a 3D volume, 2D calculation might be slightly off due to the baseball's radius.
  // We'll consider it in the zone if distFt is 0 or less than half a baseball width (~0.12 ft) to be safe with margins.
  const isInZone = distFt < 0.12
  const missedInches = (distFt * 12).toFixed(1)

  // Position tooltip based on location to prevent clipping
  const isRight = x > 50
  let yTransform = '-50%'
  if (y > 75) yTransform = '-100%'
  else if (y < 25) yTransform = '0%'
  
  const style = {
    top: `${y}%`,
    [isRight ? 'right' : 'left']: `${isRight ? 100 - x + 2 : x + 2}%`,
    transform: `translateY(${yTransform})`,
    position: 'absolute',
    zIndex: 20
  }

  return (
    <div className="chart-tooltip realistic-tt" style={style}>
      <div className="tt-name">{d.playerName}</div>
      <div className="tt-separator" />
      <div className="tt-row"><span>Count</span>    <span>{d.balls}–{d.strikes}, {d.outs} out{d.outs !== 1 ? 's' : ''}</span></div>
      <div className="tt-row"><span>Leverage</span> <span>{Math.max(1, Math.min(5, Math.round(d.leverage)))} / 5</span></div>
      {d.pitchName && <div className="tt-row"><span>Pitch</span><span>{d.pitchName}{d.releaseSpeed ? ` ${d.releaseSpeed} mph` : ''}</span></div>}
      {!isInZone && (
        <div className="tt-row"><span>Missed zone</span> <span>by {missedInches}"</span></div>
      )}
      {shortDes && (
        <>
          <div className="tt-separator" />
          <div className="tt-des">{shortDes}</div>
        </>
      )}
      <div className="tt-separator" />
      {d.outcome === null
        ? <div className="tt-outcome" style={{ color: '#64748b' }}>⚾ ABS CHALLENGE</div>
        : <div className="tt-outcome" style={{ color }}>{icon} {d.outcome?.toUpperCase()}</div>
      }
    </div>
  )
}
