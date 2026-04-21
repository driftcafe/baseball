export function LoadingSpinner() {
  return (
    <div className="loading-wrapper">
      <div className="loading-zone">
        <div className="zone-box">
          <span className="zone-dot d1" />
          <span className="zone-dot d2" />
          <span className="zone-dot d3" />
          <span className="zone-dot d4" />
        </div>
      </div>
      <h2 className="loading-title">Loading ABS Challenge Data</h2>
      <p className="loading-sub">Fetching from Baseball Savant — usually takes 30–60 seconds</p>
      <div className="loading-bar-track">
        <div className="loading-bar-fill" />
      </div>
    </div>
  )
}
