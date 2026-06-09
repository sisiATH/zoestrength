import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { STRIPE_LINKS } from '../lib/stripe'

export default function LoginPage() {
  const { signInWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError(null)
    const { error } = await signInWithEmail(email)
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--dark)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <BoltIcon size={40} color="var(--lime)" />
          <div style={{
            fontFamily: 'Bebas Neue', fontSize: 28, letterSpacing: '0.08em',
            color: 'var(--white)', marginTop: 12,
          }}>
            ZOE<span style={{ color: 'var(--pink)' }}>STRENGTH</span>
          </div>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 24 }}>📬</div>
            <h2 style={{ fontFamily: 'Bebas Neue', fontSize: 36, color: 'var(--white)', marginBottom: 12 }}>
              CHECK YOUR EMAIL
            </h2>
            <p style={{ color: '#888882', fontSize: 15, lineHeight: 1.6 }}>
              We sent a magic link to <strong style={{ color: 'var(--white)' }}>{email}</strong>. Click it to sign in — no password needed.
            </p>
            <button
              onClick={() => setSent(false)}
              style={{
                marginTop: 32, background: 'transparent', border: '1px solid #333',
                color: '#888882', padding: '10px 24px', borderRadius: 100,
                cursor: 'pointer', fontSize: 13,
              }}
            >
              Use a different email
            </button>
          </div>
        ) : (
          <>
            <h2 style={{
              fontFamily: 'Bebas Neue', fontSize: 40, color: 'var(--white)',
              textAlign: 'center', marginBottom: 8, letterSpacing: '0.02em',
            }}>
              WELCOME BACK
            </h2>
            <p style={{ color: '#777770', textAlign: 'center', fontSize: 14, marginBottom: 36 }}>
              Enter your email and we'll send you a sign-in link
            </p>

            <form onSubmit={handleSubmit}>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{
                  width: '100%', padding: '16px 20px',
                  background: '#1A1A1A', border: '1px solid #2A2A2A',
                  borderRadius: 12, color: 'var(--white)',
                  fontSize: 16, fontFamily: 'DM Sans',
                  outline: 'none', marginBottom: 12,
                  boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--lime)'}
                onBlur={e => e.target.style.borderColor = '#2A2A2A'}
              />

              {error && (
                <p style={{ color: 'var(--pink)', fontSize: 13, marginBottom: 12 }}>{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                style={{
                  width: '100%', padding: '16px',
                  background: loading ? '#2A2A2A' : 'var(--lime)',
                  color: 'var(--dark)', border: 'none', borderRadius: 100,
                  fontFamily: 'Bebas Neue', fontSize: 18, letterSpacing: '0.08em',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                {loading ? 'SENDING...' : 'SEND MAGIC LINK'}
              </button>
            </form>

            <div style={{
              marginTop: 48, padding: 24,
              border: '1px solid #222', borderRadius: 16,
              textAlign: 'center',
            }}>
              <p style={{ color: '#555550', fontSize: 13, marginBottom: 16 }}>
                Don't have an account yet?
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <a href={STRIPE_LINKS.annual} style={{
                  background: 'var(--lime)', color: 'var(--dark)',
                  padding: '10px 20px', borderRadius: 100,
                  fontFamily: 'Bebas Neue', fontSize: 14, letterSpacing: '0.06em',
                  textDecoration: 'none',
                }}>
                  JOIN — $99.99/YEAR
                </a>
                <a href={STRIPE_LINKS.monthly} style={{
                  background: 'transparent', color: '#777770',
                  padding: '10px 20px', borderRadius: 100,
                  fontFamily: 'Bebas Neue', fontSize: 14, letterSpacing: '0.06em',
                  textDecoration: 'none', border: '1px solid #333',
                }}>
                  $14.99/MONTH
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function BoltIcon({ size = 24, color = 'currentColor' }) {
  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 100 130" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', margin: '0 auto' }}>
      <polygon points="60,0 20,70 50,70 40,130 80,55 52,55" fill={color} />
    </svg>
  )
}
