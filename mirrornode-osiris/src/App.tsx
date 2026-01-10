import { useState, useEffect } from 'react'
import { oraclePing, oracleThothRoute } from './lib/oracle'
import './App.css'

function App() {
  const [status, setStatus] = useState('Connecting...')
  const [lastError, setLastError] = useState('')
  const [results, setResults] = useState(null)

  const testConnection = async () => {
    try {
      setStatus('Testing...')
      const ping = await oraclePing()
      setStatus(`Connected: ${ping.status}`)
      setLastError('')
    } catch (error: any) {
      setStatus('Failed')
      setLastError(error.message || 'Connection failed')
    }
  }

  const runAudit = async () => {
    try {
      setStatus('Running audit...')
      const audit = await oracleThothRoute('/thoth', 1)
      setResults(audit)
      setStatus('Audit complete')
    } catch (error: any) {
      setStatus('Audit failed')
      setLastError(error.message || 'Audit failed')
    }
  }

  useEffect(() => {
    testConnection()
  }, [])

  return (
    <div className="App">
      <h1>Osiris Audit HUD</h1>
      <div className="status">
        <h2>Status: {status}</h2>
        {lastError && <p className="error">Error: {lastError}</p>}
        <button onClick={testConnection}>Test Connection</button>
        <button onClick={runAudit}>Run Audit</button>
      </div>
      {results && (
        <div className="results">
          <h3>Audit Results:</h3>
          <pre>{JSON.stringify(results, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

export default App
