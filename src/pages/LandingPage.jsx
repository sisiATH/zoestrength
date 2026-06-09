import { useState, useEffect } from 'react'

const MONTHLY_PRICE = '$14.99'
const ANNUAL_PRICE = '$99.99'
const ANNUAL_MONTHLY = '$8.33'

const STRIPE_MONTHLY = 'https://buy.stripe.com/MONTHLY_LINK'
const STRIPE_ANNUAL = 'https://buy.stripe.com/ANNUAL_LINK'

const programs = [
  {
    id: 'strng',
    name: 'STRNG',
    tag: '8 weeks',
    description: 'Heavy compound lifting built for women who want to get seriously strong. 4 days/week, progressive overload, SIT finishers.',
    color: '#C8F500',
    textColor: '#0D0D0D',
    weeks: 8,
    days: 4,
  },
  {
    id: 'cycle-synched',
    name: 'Cycle Synched Reset',
    tag: '4 weeks',
    description: 'Training and recovery mapped to your cycle phases. Work with your hormones, not against them.',
    color: '#FF3CAC',
    textColor: '#FFFFFF',
    weeks: 4,
    days: 3,
  },
  {
    id: '10k',
    name: '10K Plan',
    tag: '10 weeks',
    description: 'Run your strongest 10K with integrated strength work. No junk miles — every session has a purpose.',
    color: '#1B6B7B',
    textColor: '#FFFFFF',
    weeks: 10,
    days: 5,
  },
  {
    id: 'coming-soon',
    name: 'More coming',
    tag: 'ongoing',
    description: 'Half marathon plan, STRNG Part 2, and more added regularly. One subscription, everything included.',
    color: '#E8E8E4',
    textColor: '#666660',
    soon: true,
  },
]

const features = [
  { icon: '⚡', title: 'Live workout tracker', desc: 'Check off sets, auto rest timer, see weights from your last session' },
  { icon: '🎥', title: 'Exercise video library', desc: 'Every movement demonstrated with coaching cues, not just a name on a list' },
  { icon: '📋', title: 'Program PDFs', desc: 'Download your full program, peri guide, and extras to keep forever' },
  { icon: '🔄', title: 'Smart progress tracking', desc: 'Completed sessions collapse — you always see exactly where you are' },
  { icon: '💪', title: 'Built for peri + menopause', desc: 'Stacy Sims framework, heavy lifting, hormonal context baked in' },
  { icon: '🏃', title: 'Run + strength hybrid', desc: 'Programs that actually integrate both without destroying your body' },
]

export default function LandingPage() {
  const [billingCycle, setBillingCycle] = useState('annual')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const stripeLink = billingCycle === 'annual' ? STRIPE_ANNUAL : STRIPE_MONTHLY

  return (
    <div style={{ background: 'var(--light)', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* NAV */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '16px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(245,245,242,0.96)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        transition: 'all 0.3s',
        borderBottom: scrolled ? '1px solid #e0e0dc' : 'none',
      }}>
        <Wordmark />
        <a href={stripeLink} style={{
          background: 'var(--dark)', color: 'var(--lime)',
          padding: '10px 22px', borderRadius: 100,
          fontFamily: 'Bebas Neue', fontSize: 15, letterSpacing: '0.08em',
          textDecoration: 'none',
        }}>
          JOIN NOW
        </a>
      </nav>

      {/* HERO */}
      <section style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        alignItems: 'center',
        padding: '120px 32px 80px',
        maxWidth: 1200, margin: '0 auto',
        gap: 60,
      }}>
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'var(--dark)', color: 'var(--lime)',
            padding: '6px 14px', borderRadius: 100,
            fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
            textTransform: 'uppercase', marginBottom: 32,
          }}>
            <span style={{ width: 6, height: 6, background: 'var(--lime)', borderRadius: '50%' }} />
            Fully alive in your body
          </div>

          <h1 style={{
            fontFamily: 'Bebas Neue',
            fontSize: 'clamp(64px, 9vw, 120px)',
            lineHeight: 0.88,
            color: 'var(--dark)',
            marginBottom: 28,
          }}>
            RUN FAST.<br />
            LIFT<br />
            <span style={{ color: 'var(--pink)' }}>HEAVY.</span><br />
            FEEL<br />
            <span style={{
              WebkitTextStroke: '3px var(--dark)',
              color: 'transparent',
            }}>ALIVE.</span>
          </h1>

          <p style={{
            fontSize: 17, lineHeight: 1.7, color: 'var(--text-muted)',
            maxWidth: 460, marginBottom: 44,
          }}>
            Periodized strength and run programs built for women in perimenopause and beyond. No guessing, no burnout — just getting stronger.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 380 }}>
            <BillingToggle billingCycle={billingCycle} setBillingCycle={setBillingCycle} />
            <PriceDisplay billingCycle={billingCycle} />
            <JoinButton stripeLink={stripeLink} billingCycle={billingCycle} />
            <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
              14-day free trial · Cancel anytime · All programs included
            </p>
          </div>
        </div>

        {/* Hero visual */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <HeroVisual />
        </div>
      </section>

      {/* MARQUEE */}
      <div style={{
        background: 'var(--dark)', padding: '18px 0',
        overflow: 'hidden', whiteSpace: 'nowrap',
      }}>
        <div style={{
          display: 'inline-block',
          animation: 'marquee 20s linear infinite',
        }}>
          {Array(3).fill('ZOESTRENGTH · RUN FAST · LIFT HEAVY · FULLY ALIVE · PERIMENOPAUSE STRONG · ').map((t, i) => (
            <span key={i} style={{
              fontFamily: 'Bebas Neue', fontSize: 18, letterSpacing: '0.12em',
              color: 'var(--lime)', marginRight: 0,
            }}>{t}</span>
          ))}
        </div>
        <style>{`@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-33.33%) } }`}</style>
      </div>

      {/* TRAINER */}
      <section style={{ background: 'var(--dark)', padding: '100px 32px' }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto',
          display: 'flex', gap: 80, alignItems: 'center', flexWrap: 'wrap',
        }}>
          <div style={{ flex: '0 0 auto' }}>
            <div style={{
              width: 180, height: 180, borderRadius: '50%',
              border: '3px solid var(--lime)',
              background: 'var(--teal)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Bebas Neue', fontSize: 56, color: 'var(--lime)',
              letterSpacing: '0.05em',
            }}>SH</div>
          </div>
          <div style={{ flex: 1, minWidth: 280 }}>
            <p style={{ color: 'var(--lime)', fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>Your coach</p>
            <h2 style={{ fontFamily: 'Bebas Neue', fontSize: 52, color: 'var(--white)', marginBottom: 16, letterSpacing: '0.02em' }}>SABRINA HANNA</h2>
            <p style={{ fontSize: 16, lineHeight: 1.75, color: '#9A9A94', maxWidth: 560 }}>
              Based in Athens, Greece. Running the Sunday bRUNch Club, training through perimenopause, and building programs that actually work for women over 40. Stacy Sims framework, heavy compound lifting, real food. No restriction, no burnout — just getting stronger and feeling fully alive.
            </p>
          </div>
        </div>
      </section>

      {/* PROGRAMS */}
      <section style={{ padding: '100px 32px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 60 }}>
          <p style={{ color: 'var(--pink)', fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>What's included</p>
          <h2 style={{ fontFamily: 'Bebas Neue', fontSize: 'clamp(48px, 7vw, 80px)', lineHeight: 0.92, color: 'var(--dark)' }}>
            ALL PROGRAMS.<br />ONE SUBSCRIPTION.
          </h2>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 16,
        }}>
          {programs.map(p => (
            <ProgramCard key={p.id} program={p} />
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ background: '#0D0D0D', padding: '100px 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ marginBottom: 60 }}>
            <p style={{ color: 'var(--lime)', fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>How it works</p>
            <h2 style={{ fontFamily: 'Bebas Neue', fontSize: 'clamp(48px, 7vw, 80px)', lineHeight: 0.92, color: 'var(--white)' }}>
              BUILT FOR<br />REAL TRAINING
            </h2>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          }}>
            {features.map((f, i) => (
              <div key={i} style={{
                padding: '36px 32px',
                borderTop: '1px solid #222',
                borderLeft: i % 3 !== 0 ? '1px solid #222' : 'none',
              }}>
                <div style={{ fontSize: 32, marginBottom: 16 }}>{f.icon}</div>
                <h3 style={{ fontFamily: 'Bebas Neue', fontSize: 24, color: 'var(--white)', marginBottom: 10, letterSpacing: '0.03em' }}>{f.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: '#777770' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding: '120px 32px', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'center' }}>
            <BoltIcon size={64} color="var(--lime)" />
          </div>
          <h2 style={{
            fontFamily: 'Bebas Neue',
            fontSize: 'clamp(60px, 10vw, 110px)',
            lineHeight: 0.88, color: 'var(--dark)', marginBottom: 16,
          }}>
            READY TO FEEL<br />
            <span style={{ color: 'var(--pink)' }}>FULLY ALIVE?</span>
          </h2>
          <p style={{ fontSize: 16, color: 'var(--text-muted)', marginBottom: 48, lineHeight: 1.6 }}>
            Join ZOESTRENGTH and get access to every program, every video, every PDF. Built for women who are done with training that doesn't respect their biology.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <a href={STRIPE_ANNUAL} style={{
              background: 'var(--dark)', color: 'var(--lime)',
              padding: '20px 56px', borderRadius: 100,
              fontFamily: 'Bebas Neue', fontSize: 22, letterSpacing: '0.08em',
              textDecoration: 'none',
              boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
            }}>
              JOIN FOR {ANNUAL_PRICE}/YEAR
            </a>
            <a href={STRIPE_MONTHLY} style={{ color: 'var(--text-muted)', fontSize: 14, textDecoration: 'underline', textUnderlineOffset: 3 }}>
              Or {MONTHLY_PRICE}/month
            </a>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>14-day free trial · No commitment · Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        borderTop: '1px solid var(--mid)',
        padding: '32px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 16,
        maxWidth: 1200, margin: '0 auto',
      }}>
        <Wordmark />
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>© 2026 Sabrina Hanna · Athens, Greece</p>
        <div style={{ display: 'flex', gap: 24 }}>
          <a href="#" style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>Privacy</a>
          <a href="#" style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>Terms</a>
        </div>
      </footer>

    </div>
  )
}

function Wordmark() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <BoltIcon size={24} color="var(--lime)" />
      <span style={{ fontFamily: 'Bebas Neue', fontSize: 20, letterSpacing: '0.08em', color: 'var(--dark)' }}>
        ZOE<span style={{ color: 'var(--pink)' }}>STRENGTH</span>
      </span>
    </div>
  )
}

function BillingToggle({ billingCycle, setBillingCycle }) {
  return (
    <div style={{
      display: 'flex', background: 'var(--mid)',
      borderRadius: 100, padding: 4, width: 'fit-content',
    }}>
      {['monthly', 'annual'].map(cycle => (
        <button key={cycle} onClick={() => setBillingCycle(cycle)} style={{
          padding: '10px 24px', borderRadius: 100, border: 'none', cursor: 'pointer',
          fontFamily: 'DM Sans', fontWeight: 600, fontSize: 13, letterSpacing: '0.02em',
          background: billingCycle === cycle ? 'var(--dark)' : 'transparent',
          color: billingCycle === cycle ? 'var(--lime)' : 'var(--text-muted)',
          transition: 'all 0.2s', textTransform: 'capitalize',
        }}>
          {cycle}
          {cycle === 'annual' && (
            <span style={{
              marginLeft: 6, fontSize: 10,
              background: 'var(--lime)', color: 'var(--dark)',
              padding: '2px 6px', borderRadius: 4, fontWeight: 800,
            }}>SAVE 45%</span>
          )}
        </button>
      ))}
    </div>
  )
}

function PriceDisplay({ billingCycle }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
      <span style={{ fontFamily: 'Bebas Neue', fontSize: 56, color: 'var(--dark)', lineHeight: 1 }}>
        {billingCycle === 'annual' ? '$99.99' : '$14.99'}
      </span>
      <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>
        {billingCycle === 'annual' ? '/ year ($8.33/mo)' : '/ month'}
      </span>
    </div>
  )
}

function JoinButton({ stripeLink, billingCycle }) {
  return (
    <a href={stripeLink} style={{
      display: 'block', textAlign: 'center',
      background: 'var(--lime)', color: 'var(--dark)',
      padding: '18px 40px', borderRadius: 100,
      fontFamily: 'Bebas Neue', fontSize: 20, letterSpacing: '0.08em',
      textDecoration: 'none',
      boxShadow: '0 4px 24px rgba(200,245,0,0.35)',
      transition: 'transform 0.15s',
    }}>
      START TRAINING — {billingCycle === 'annual' ? '$99.99' : '$14.99'}
    </a>
  )
}

function ProgramCard({ program: p }) {
  return (
    <div style={{
      background: p.color, borderRadius: 20, padding: 32,
      position: 'relative', overflow: 'hidden',
      opacity: p.soon ? 0.55 : 1,
      minHeight: 220,
    }}>
      <div style={{ position: 'absolute', top: -10, right: -10, opacity: 0.08 }}>
        <BoltIcon size={110} color={p.textColor} />
      </div>
      <div style={{ position: 'relative' }}>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: p.textColor, opacity: 0.65,
          display: 'block', marginBottom: 10,
        }}>{p.tag}</span>
        <h3 style={{
          fontFamily: 'Bebas Neue', fontSize: 34,
          color: p.textColor, marginBottom: 10, letterSpacing: '0.03em',
        }}>{p.name}</h3>
        <p style={{ fontSize: 13, lineHeight: 1.6, color: p.textColor, opacity: 0.78, marginBottom: 20 }}>
          {p.description}
        </p>
        {!p.soon && (
          <div style={{ display: 'flex', gap: 20 }}>
            <Stat value={p.weeks} label="weeks" textColor={p.textColor} />
            <Stat value={p.days} label="days/wk" textColor={p.textColor} />
          </div>
        )}
      </div>
    </div>
  )
}

function HeroVisual() {
  return (
    <div style={{ position: 'relative', width: 380, height: 480 }}>
      {/* Background blob */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'var(--lime)',
        borderRadius: '60% 40% 55% 45% / 50% 60% 40% 50%',
        opacity: 0.15,
      }} />
      {/* Main bolt */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -52%)',
      }}>
        <BoltIcon size={280} color="var(--lime)" />
      </div>
      {/* Wordmark overlay */}
      <div style={{
        position: 'absolute', bottom: 60, left: 0, right: 0,
        textAlign: 'center',
      }}>
        <div style={{
          fontFamily: 'Bebas Neue', fontSize: 42, letterSpacing: '0.06em',
          color: 'var(--dark)', lineHeight: 1,
        }}>
          ZOE<span style={{ color: 'var(--pink)', WebkitTextStroke: '0px' }}>STRENGTH</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 6 }}>
          Fully alive in your body
        </div>
      </div>
      {/* Floating tags */}
      <FloatingTag text="Run Fast" top="8%" left="0%" color="var(--teal)" textColor="#fff" />
      <FloatingTag text="Lift Heavy" top="18%" right="0%" color="var(--pink)" textColor="#fff" />
      <FloatingTag text="Peri Strong" top="35%" left="-5%" color="var(--dark)" textColor="var(--lime)" />
    </div>
  )
}

function FloatingTag({ text, top, left, right, color, textColor }) {
  return (
    <div style={{
      position: 'absolute', top, left, right,
      background: color, color: textColor,
      padding: '8px 14px', borderRadius: 100,
      fontFamily: 'Bebas Neue', fontSize: 14, letterSpacing: '0.08em',
      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
    }}>{text}</div>
  )
}

function Stat({ value, label, textColor }) {
  return (
    <div>
      <div style={{ fontFamily: 'Bebas Neue', fontSize: 30, color: textColor, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: textColor, opacity: 0.55 }}>{label}</div>
    </div>
  )
}

function BoltIcon({ size = 24, color = 'currentColor' }) {
  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 100 130" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
      <polygon points="60,0 20,70 50,70 40,130 80,55 52,55" fill={color} />
    </svg>
  )
}
