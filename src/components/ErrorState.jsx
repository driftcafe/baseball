export function ErrorState({ error }) {
  return (
    <div className="error-wrapper">
      <div className="error-icon">⚡</div>
      <h2 className="error-title">Data Unavailable</h2>
      <p className="error-msg">{error}</p>
      <div className="error-hint">
        <p>Make sure the dev server is running:</p>
        <code>npm run dev</code>
        <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          The Vite proxy is required to bypass CORS on the Baseball Savant endpoint.
        </p>
      </div>
      <button className="retry-btn" onClick={() => window.location.reload()}>
        Try Again
      </button>
    </div>
  )
}
