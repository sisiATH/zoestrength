import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { STRIPE_LINKS, PRICING } from '../lib/stripe'

export default function PaywallPage() {
  const { user, signOut } = useAuth()
  const [billing, setBilling] = useState('annual')

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--dark)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 480, textAlign: 'center' }}>

        <BoltIcon size={44} color="#D4A853" />

        <h1 style={{
          fontFamily: 'Bebas Neue', fontSize: 52, letterSpacing: '0.03em',
          color: 'var(--white)', marginTop: 16, marginBottom: 8, lineHeight: 0.95,
        }}>
          fit with <span style={{ color: '#C4857A' }}>sisi</span>
        </h1>

        <p style={{ color: '#777770', fontSize: 14, marginBottom: 48 }}>
          Signed in as {user?.email}
        </p>

        <div style={{
          background: '#111', border: '1px solid #222',
          borderRadius: 20, padding: 36, marginBottom: 24,
        }}>
          <h2 style={{ fontFamily: 'Bebas Neue', fontSize: 32, color: 'var(--white)', marginBottom: 8 }}>
            START YOUR FREE TRIAL
          </h2>
          <p style={{ color: '#666660', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
            14 days free, then choose your plan. Cancel anytime.
          </p>

          {/* Toggle */}
          <div style={{
            display: 'flex', background: '#1A1A1A',
            borderRadius: 100, padding: 4, marginBottom: 24,
          }}>
            {['monthly', 'annual'].map(cycle => (
              <button key={cycle} onClick={() => setBilling(cycle)} style={{
                flex: 1, padding: '10px 16px', borderRadius: 100,
                border: 'none', cursor: 'pointer',
                fontFamily: 'DM Sans', fontWeight: 600, fontSize: 13,
                background: billing === cycle ? '#D4A853' : 'transparent',
                color: billing === cycle ? 'var(--dark)' : '#666660',
                transition: 'all 0.2s', textTransform: 'capitalize',
              }}>
                {cycle}
                {cycle === 'annual' && billing !== 'annual' && (
                  <span style={{ marginLeft: 6, fontSize: 10, color: '#D4A853' }}>SAVE 45%</span>
                )}
              </button>
            ))}
          </div>

          {/* Price */}
          <div style={{ marginBottom: 24 }}>
            <span style={{ fontFamily: 'Bebas Neue', fontSize: 56, color: 'var(--white)', lineHeight: 1 }}>
              {PRICING[billing].price}
            </span>
            <span style={{ color: '#555550', fontSize: 14, marginLeft: 8 }}>
              {billing === 'annual' ? `/ year (${PRICING.annual.perMonth})` : '/ month'}
            </span>
          </div>

          <a href={STRIPE_LINKS[billing]} style={{
            display: 'block',
            background: '#D4A853', color: 'var(--dark)',
            padding: '16px', borderRadius: 100,
            fontFamily: 'Bebas Neue', fontSize: 18, letterSpacing: '0.08em',
            textDecoration: 'none',
            boxShadow: '0 4px 24px rgba(200,245,0,0.2)',
          }}>
            START FREE TRIAL
          </a>

          <p style={{ fontSize: 11, color: '#444440', marginTop: 14 }}>
            You'll be charged after 14 days · Cancel anytime before
          </p>
        </div>

        {/* What's included */}
        <div style={{ textAlign: 'left', marginBottom: 32 }}>
          {[
            'All programs — STRNG, Cycle Synched Reset, 10K Plan + more',
            'Live workout tracker with rest timer + weight history',
            'Full exercise video library with coaching cues',
            'Downloadable PDFs, peri guide, and extras',
            'New programs added regularly, included at no extra cost',
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '10px 0', borderBottom: '1px solid #1A1A1A',
            }}>
              <span style={{ color: '#D4A853', fontSize: 14, marginTop: 1 }}>✓</span>
              <span style={{ color: '#888882', fontSize: 14, lineHeight: 1.5 }}>{item}</span>
            </div>
          ))}
        </div>

        <button onClick={signOut} style={{
          background: 'transparent', border: 'none',
          color: '#444440', fontSize: 12, cursor: 'pointer',
          textDecoration: 'underline', textUnderlineOffset: 3,
        }}>
          Sign out
        </button>
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
