import { useState, useEffect, useRef } from 'react'
import './App.css'

type AuditStatus = 'pass' | 'neutral' | 'warn' | 'fail'

interface Verdict {
  node: string
  timestamp: string
  audit: {
    canon_integrity: AuditStatus
    dependencies_healthy: AuditStatus
  }
  mirror: {
    result: string
    verified: boolean
  }
}

const STATUS_COLOR: Record<AuditStatus, string> = {
  pass: '#00ff88',
  neutral: '#888',
  warn: '#ffaa00',
  fail: '#ff4444',
}

function Badge({ status }: { status: AuditStatus }) {
  return (
    <span style={{
      color: STATUS_COLOR[status],
      fontWeight: 'bold',
      textTransform: 'uppercase',
      fontSize: '0.85rem',
    }}>
      {status}
    </span>
  )
}

function App() {
  const [verdicts, setVerdicts] = useState<Verdict[]>([])
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState('')
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const connect = () => {
      const ws = new WebSocket('ws://localhost:7701/ws/ptah/verdicts')
      wsRef.current = ws

      ws.onopen = () => {
        setConnected(true)
        setError('')
      }

      ws.onmessage = (e) => {
        const verdict: Verdict = JSON.parse(e.data)
        setVerdicts(prev => [verdict, ...prev].slice(0, 20))
      }

      ws.onerror = () => {
        setError('WebSocket error — is backend running?')
        setConnected(false)
      }

      ws.onclose = () => {
        setConnected(false)
        setTimeout(connect, 3000)
      }
    }

    connect()
    return () => wsRef.current?.close()
  }, [])

  return (
    <div className="App">
      <h1>Osiris Audit HUD</h1>
      <div className="status">
        <span style={{ color: connected ? '#00ff88' : '#ff4444' }}>
          {connected ? '● LIVE' : '○ CONNECTING...'}
        </span>
        {error && <p className="error">{error}</p>}
      </div>

      <div className="verdicts">
        {verdicts.length === 0 && connected && (
          <p style={{ color: '#888' }}>Waiting for verdicts...</p>
        )}
        {verdicts.map((v, i) => (
          <div key={i} className="verdict-card">
            <div className="verdict-header">
              <strong>{v.node}</strong>
              <span style={{ color: '#555', fontSize: '0.75rem' }}>
                {new Date(v.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="verdict-body">
              <span>canon_integrity: <Badge status={v.audit.canon_integrity} /></span>
              <span>dependencies: <Badge status={v.audit.dependencies_healthy} /></span>
              <span>mirror: <Badge status={v.mirror.result as AuditStatus} /></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
