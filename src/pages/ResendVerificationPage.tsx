import React, { useState } from 'react'

export default function ResendVerificationPage() {
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    setErr(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.message || `Fehler (${res.status})`)
      setMsg('Falls die E-Mail existiert, wurde eine neue Verifizierungs-Mail gesendet.')
    } catch (e: unknown) {
      setErr(e?.message || 'Fehler beim Senden')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: '48px auto', padding: 24 }}>
      <h1>Verifizierung erneut senden</h1>
      <form onSubmit={submit} style={{ marginTop: 12 }}>
        <label style={{ display: 'block', marginBottom: 8 }}>
          E-Mail
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ display: 'block', width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>
        <button type="submit" disabled={loading} style={{ marginTop: 8, padding: '8px 14px' }}>
          {loading ? 'Bitte warten.' : 'Senden'}
        </button>
        {msg && <div style={{ color: '#4caf50', marginTop: 10 }}>{msg}</div>}
        {err && <div style={{ color: '#f66', marginTop: 10 }}>{err}</div>}
      </form>
    </div>
  )
}
