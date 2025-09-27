import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

export default function VerifyPage() {
  const { token } = useParams<{ token: string }>()
  const nav = useNavigate()
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')
  const [msg, setMsg] = useState<string>('Verifiziere.')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        if (!token) throw new Error('Kein Token �bergeben.')
        const res = await fetch(`/api/auth/verify/${token}`, {
          method: 'GET',
          credentials: 'include',
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data?.message || `Verify fehlgeschlagen (${res.status})`)
        if (!cancelled) {
          setStatus('ok')
          setMsg('E-Mail verifiziert. Du wirst gleich zum Login weitergeleitet.')
          setTimeout(() => nav('/login?verified=1'), 1200)
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setStatus('error')
          setMsg(err?.message || 'Verifizierung fehlgeschlagen')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token, nav])

  return (
    <div style={{ maxWidth: 520, margin: '48px auto', padding: 24 }}>
      <h1 style={{ marginBottom: 16 }}>E-Mail-Verifizierung</h1>
      <div
        style={{
          padding: 16,
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 8,
          opacity: 0.95,
        }}
      >
        <p>{msg}</p>
        {status === 'error' && (
          <button style={{ marginTop: 12 }} onClick={() => nav('/login')}>
            Zur Login-Seite
          </button>
        )}
      </div>
    </div>
  )
}
