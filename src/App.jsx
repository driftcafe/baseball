import { useState } from 'react'
import { useABSData } from './hooks/useABSData'
import { GameView }     from './components/GameView'
import { LoadingSpinner } from './components/LoadingSpinner'
import { ErrorState }   from './components/ErrorState'

export default function App() {
  const data = useABSData('2026')

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-inner">
          <div className="header-brand">
            <div>
              <h1 className="brand-title" style={{ display: 'flex', alignItems: 'center' }}>
                ABS Challenge Visualizer
                <span 
                  className="info-bubble tooltip-bottom" 
                  data-tooltip="This tool allows you to filter through every challenged call of the season, letting you explore the exact 3D location of borderline pitches to see precisely why a call was upheld or overturned. By evaluating each pitch on a dynamic 'Leverage' scale—which physically sizes the baseballs based on the inning, score, and runners on base—you can instantly pinpoint the game-altering, high-pressure calls that decided the outcome of the matchup."
                  style={{ marginLeft: '8px', cursor: 'help' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                </span>
              </h1>
              <p className="brand-sub">Every ABS challenge this season — sized by game impact, plotted by pitch location</p>
            </div>
          </div>

          {!data.loading && !data.error && (
            <div className="header-meta">
              <span className="meta-pill">
                {data.challenges.length.toLocaleString()} challenges
              </span>
              <span className="meta-pill">
                {data.games.length} game{data.games.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="app-main">
        {data.loading && <LoadingSpinner />}
        {data.error   && <ErrorState error={data.error} />}

        {!data.loading && !data.error && (
          <GameView games={data.games} />
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <span>Data: Baseball Savant / Statcast</span>
        <span className="footer-sep">·</span>
        <span>ABS Challenge System · 2026 MLB Season</span>
        <span className="footer-sep">·</span>
        <span className="footer-note">Overturn status derived from pitch location vs. ABS call</span>
      </footer>
    </div>
  )
}
