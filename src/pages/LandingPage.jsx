import { useState, useEffect } from 'react'
import { STRIPE_LINKS } from '../lib/stripe'

const MONTHLY_PRICE = '$14.99'
const ANNUAL_PRICE = '$99.99'

const GOLD = '#D4A853'
const ROSE = '#C4857A'
const TEAL = '#1B6B7B'
const DARK = '#0D0D0D'
const LIGHT = '#F5F5F2'
const WHITE = '#FFFFFF'
const MUTED = '#888882'

const programs = [
  { id: 'strng', name: 'STRNG', tag: '8 weeks', description: 'Heavy compound lifting built for women who want to get seriously strong. Progressive overload, SIT finishers, built to last.', color: GOLD, textColor: DARK, weeks: 8, days: 6 },
  { id: 'cycle-synched', name: 'Cycle Synched Reset', tag: '4 weeks', description: 'Training and recovery mapped to your cycle phases. Work with your hormones, not against them.', color: ROSE, textColor: WHITE, weeks: 4, days: 3 },
  { id: '10k', name: 'Athens 10K Plan', tag: '10 weeks', description: 'Run your strongest 10K with integrated strength work. No junk miles — every session has a purpose.', color: TEAL, textColor: WHITE, weeks: 10, days: 5 },
  { id: 'coming-soon', name: 'More coming', tag: 'ongoing', description: 'Half marathon plan, STRNG Part 2, and more added regularly. One subscription, everything included.', color: '#EBEBЕ7', textColor: MUTED, soon: true },
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
  const [discountCode, setDiscountCode] = useState('')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function getStripeLink() {
    const base = billingCycle === 'annual' ? STRIPE_LINKS.annual : STRIPE_LINKS.monthly
    return discountCode ? base + '?prefilled_promo_code=' + discountCode : base
  }

  return (
    <div style={{ background: LIGHT, minHeight: '100vh', overflowX: 'hidden' }}>

      {/* NAV */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(245,245,242,0.96)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        transition: 'all 0.3s',
        borderBottom: scrolled ? '1px solid #E0E0DC' : 'none',
      }}>
        <Wordmark />
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <a href="/login" style={{ fontSize: 14, color: MUTED, textDecoration: 'none', fontFamily: 'DM Sans' }}>Sign in</a>
          <a href={getStripeLink()} style={{ background: DARK, color: GOLD, padding: '10px 22px', borderRadius: 100, fontFamily: 'Bebas Neue', fontSize: 15, letterSpacing: '0.08em', textDecoration: 'none' }}>JOIN NOW</a>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', padding: '120px 48px 80px', maxWidth: 1200, margin: '0 auto', gap: 60 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: DARK, color: GOLD, padding: '6px 14px', borderRadius: 100, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 32 }}>
            <span style={{ width: 6, height: 6, background: GOLD, borderRadius: '50%' }} />
            Run fast · Lift heavy · Be fully alive
          </div>
          <h1 style={{ fontFamily: 'Bebas Neue', fontSize: 'clamp(64px, 9vw, 120px)', lineHeight: 0.88, color: DARK, marginBottom: 28 }}>
            RUN FAST.<br />LIFT<br /><span style={{ color: ROSE }}>HEAVY.</span><br />FEEL<br />
            <span style={{ WebkitTextStroke: '3px ' + DARK, color: 'transparent' }}>ALIVE.</span>
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.7, color: MUTED, maxWidth: 460, marginBottom: 44 }}>
            Periodized strength and run programs built for women in perimenopause and beyond. No guessing, no burnout — just getting stronger.
          </p>
          <PricingBlock billingCycle={billingCycle} setBillingCycle={setBillingCycle} discountCode={discountCode} setDiscountCode={setDiscountCode} stripeLink={getStripeLink()} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <HeroVisual />
        </div>
      </section>

      {/* MARQUEE */}
      <div style={{ background: TEAL, padding: '16px 0', overflow: 'hidden', whiteSpace: 'nowrap' }}>
        <div style={{ display: 'inline-block', animation: 'marquee 24s linear infinite' }}>
          {Array(6).fill('RUN FAST · LIFT HEAVY · FULLY ALIVE IN YOUR BODY · ').map((t, i) => (
            <span key={i} style={{ fontFamily: 'Bebas Neue', fontSize: 16, letterSpacing: '0.12em', color: GOLD, marginRight: 0 }}>{t}</span>
          ))}
        </div>
        <style>{`@keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-16.66%)} }`}</style>
      </div>

      {/* ZOE MEANING */}
      <section style={{ background: DARK, padding: '100px 48px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: 80, color: GOLD, letterSpacing: '0.1em', marginBottom: 8 }}>ΖΩΗ</div>
          <div style={{ fontSize: 13, color: MUTED, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 48 }}>pronounced ZO-ee · Greek for life</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, textAlign: 'left' }}>
            <div style={{ borderLeft: '2px solid ' + TEAL, paddingLeft: 24 }}>
              <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: TEAL, marginBottom: 10 }}>Early Christian tradition</p>
              <p style={{ fontSize: 15, lineHeight: 1.8, color: '#B0B0AA' }}>ZΩΗ was a personification of eternal life. Life that doesn't diminish. Life that continues and deepens.</p>
            </div>
            <div style={{ borderLeft: '2px solid ' + ROSE, paddingLeft: 24 }}>
              <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: ROSE, marginBottom: 10 }}>Gnostic tradition</p>
              <p style={{ fontSize: 15, lineHeight: 1.8, color: '#B0B0AA' }}>ZΩΗ is a powerful female figure, daughter of Sophia (wisdom), who corrects what was done wrong. She sees the error, the dismissal, the assumption — and she fixes it. Sound familiar, ladies?</p>
            </div>
          </div>
          <div style={{ marginTop: 48, padding: '32px 40px', border: '1px solid #2A2A2A', borderRadius: 16 }}>
            <p style={{ fontSize: 17, lineHeight: 1.9, color: '#C0C0BA', fontStyle: 'italic' }}>
              "This is about being fully alive in your body. Earned. Unselfconscious. Can't be faked. Fully inhabiting the body you have, at the stage you're at, with everything you now know. The training, the science, the nutrition — all of it is in service of that feeling. That's what we're building here."
            </p>
          </div>
        </div>
      </section>

      {/* TRAINER */}
      <section style={{ background: WHITE, padding: '100px 48px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 80, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flex: '0 0 auto' }}>
            <div style={{
              width: 200, height: 200, borderRadius: '50%',
              border: '3px solid ' + GOLD,
              overflow: 'hidden',
              backgroundImage: 'url(https://zoestrength.vercel.app/sabrina.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center top',
            }} />
          </div>
          <div style={{ flex: 1, minWidth: 280 }}>
            <p style={{ color: ROSE, fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>Your coach</p>
            <h2 style={{ fontFamily: 'Bebas Neue', fontSize: 48, color: DARK, marginBottom: 6, letterSpacing: '0.02em' }}>SABRINA KYRIACOU</h2>
            <p style={{ fontSize: 12, color: MUTED, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 20 }}>B.Sc Exercise Science · 9× HM · 1× Marathon · 12× 10K · 7× 5K</p>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: '#555550', maxWidth: 580, marginBottom: 16 }}>
              I started running in my early 30s and quickly fell in love with it. Over the years I've run everything from 5Ks to a full marathon — sometimes chasing faster times, other times just trying to make it to the finish. Structure helped me stay consistent, but I also learned how easy it is to push too hard.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: '#555550', maxWidth: 580, marginBottom: 16 }}>
              After struggling with RED-S, I had to change the way I train. Now I focus on balance between running, strength, and recovery in a way that actually supports my health — especially moving through my 40s.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: '#555550', maxWidth: 580, marginBottom: 16 }}>
              I'm based in Athens, Greece — the birthplace of the marathon, and a runner's dream. If you like hills. And heat. And the occasional stray dog joining you for a kilometre. There are so many run clubs, community races, and organised events here that I could theoretically be racing every weekend. I choose not to, because I value my legs and also my sanity. These are the programs I actually use to train for races while body-recomping.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: '#555550', maxWidth: 580 }}>
              I'm not a professional runner or influencer — just a real woman with a real body that needs real work. If you're trying to find that same balance between performance, strength, and everyday life — this is for you.
            </p>
          </div>
        </div>
      </section>

      {/* PROGRAMS */}
      <section style={{ padding: '100px 48px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 60 }}>
          <p style={{ color: ROSE, fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>What's included</p>
          <h2 style={{ fontFamily: 'Bebas Neue', fontSize: 'clamp(48px, 7vw, 80px)', lineHeight: 0.92, color: DARK }}>ALL PROGRAMS.<br />ONE SUBSCRIPTION.</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {programs.map(p => (
            <div key={p.id} style={{ background: p.color, borderRadius: 20, padding: 32, position: 'relative', overflow: 'hidden', opacity: p.soon ? 0.5 : 1, minHeight: 220 }}>
              <div style={{ position: 'absolute', right: -10, top: -10, opacity: 0.08 }}>
                <svg width={110} height={143} viewBox="0 0 100 130" fill="none"><polygon points="60,0 20,70 50,70 40,130 80,55 52,55" fill={p.textColor} /></svg>
              </div>
              <div style={{ position: 'relative' }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: p.textColor, opacity: 0.6, display: 'block', marginBottom: 8 }}>{p.tag}</span>
                <h3 style={{ fontFamily: 'Bebas Neue', fontSize: 32, color: p.textColor, marginBottom: 10 }}>{p.name}</h3>
                <p style={{ fontSize: 13, lineHeight: 1.6, color: p.textColor, opacity: 0.78, marginBottom: 20 }}>{p.description}</p>
                {!p.soon && (
                  <div style={{ display: 'flex', gap: 20 }}>
                    <Stat value={p.weeks} label="weeks" color={p.textColor} />
                    <Stat value={p.days} label="days/wk" color={p.textColor} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ background: TEAL, padding: '100px 48px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ marginBottom: 60 }}>
            <p style={{ color: GOLD, fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>How it works</p>
            <h2 style={{ fontFamily: 'Bebas Neue', fontSize: 'clamp(48px, 7vw, 80px)', lineHeight: 0.92, color: WHITE }}>BUILT FOR<br />REAL TRAINING</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {features.map((f, i) => (
              <div key={i} style={{ padding: '36px 32px', paddingTop: '36px' }}>
                <div style={{ fontSize: 32, marginBottom: 16 }}>{f.icon}</div>
                <h3 style={{ fontFamily: 'Bebas Neue', fontSize: 24, color: WHITE, marginBottom: 10 }}>{f.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: 'rgba(255,255,255,0.65)' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding: '120px 48px', textAlign: 'center', background: LIGHT }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <BoltIcon size={56} color={GOLD} style={{ margin: '0 auto 24px' }} />
          <h2 style={{ fontFamily: 'Bebas Neue', fontSize: 'clamp(60px, 10vw, 100px)', lineHeight: 0.88, color: DARK, marginBottom: 16 }}>
            READY TO FEEL<br /><span style={{ color: ROSE }}>FULLY ALIVE?</span>
          </h2>
          <p style={{ fontSize: 16, color: MUTED, marginBottom: 48, lineHeight: 1.6 }}>
            Join ZOESTRENGTH and get access to every program, every video, every PDF.
          </p>
          <PricingBlock billingCycle={billingCycle} setBillingCycle={setBillingCycle} discountCode={discountCode} setDiscountCode={setDiscountCode} stripeLink={getStripeLink()} centered />
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid #E8E8E4', padding: '32px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, maxWidth: 1200, margin: '0 auto' }}>
        <Wordmark />
        <p style={{ fontSize: 12, color: MUTED }}>© 2026 Sabrina Kyriacou · ZOESTRENGTH</p>
        <div style={{ display: 'flex', gap: 24 }}>
          <a href="#" style={{ fontSize: 12, color: MUTED, textDecoration: 'none' }}>Privacy</a>
          <a href="#" style={{ fontSize: 12, color: MUTED, textDecoration: 'none' }}>Terms</a>
        </div>
      </footer>

    </div>
  )
}

function PricingBlock({ billingCycle, setBillingCycle, discountCode, setDiscountCode, stripeLink, centered }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 400, margin: centered ? '0 auto' : undefined }}>
      <div style={{ display: 'flex', background: '#E8E8E4', borderRadius: 100, padding: 4, width: 'fit-content' }}>
        {['monthly', 'annual'].map(cycle => (
          <button key={cycle} onClick={() => setBillingCycle(cycle)} style={{
            padding: '10px 24px', borderRadius: 100, border: 'none', cursor: 'pointer',
            fontFamily: 'DM Sans', fontWeight: 600, fontSize: 13,
            background: billingCycle === cycle ? DARK : 'transparent',
            color: billingCycle === cycle ? GOLD : MUTED,
            transition: 'all 0.2s', textTransform: 'capitalize',
          }}>
            {cycle}
            {cycle === 'annual' && <span style={{ marginLeft: 6, fontSize: 10, background: GOLD, color: DARK, padding: '2px 6px', borderRadius: 4, fontWeight: 800 }}>SAVE 45%</span>}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontFamily: 'Bebas Neue', fontSize: 56, color: DARK, lineHeight: 1 }}>{billingCycle === 'annual' ? '$99.99' : '$14.99'}</span>
        <span style={{ color: MUTED, fontSize: 14 }}>{billingCycle === 'annual' ? '/ year ($8.33/mo)' : '/ month'}</span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input type="text" placeholder="Discount code" value={discountCode} onChange={e => setDiscountCode(e.target.value.toUpperCase())} style={{ flex: 1, padding: '12px 16px', borderRadius: 100, border: '1px solid #E0E0DC', fontSize: 13, fontFamily: 'DM Sans', background: '#FFFFFF', outline: 'none', letterSpacing: '0.05em' }} />
      </div>
      <a href={stripeLink} style={{ display: 'block', textAlign: 'center', background: GOLD, color: DARK, padding: '18px 40px', borderRadius: 100, fontFamily: 'Bebas Neue', fontSize: 20, letterSpacing: '0.08em', textDecoration: 'none', boxShadow: '0 4px 24px rgba(212,168,83,0.3)' }}>
        START TRAINING — {billingCycle === 'annual' ? '$99.99' : '$14.99'}
      </a>
      <p style={{ fontSize: 12, color: MUTED, textAlign: 'center' }}>14-day free trial · Cancel anytime · All programs included</p>
    </div>
  )
}

function HeroVisual() {
  return (
    <div style={{ position: 'relative', width: 380, height: 480 }}>
      <div style={{ position: 'absolute', inset: 0, background: GOLD, borderRadius: '60% 40% 55% 45% / 50% 60% 40% 50%', opacity: 0.1 }} />
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -52%)' }}>
        <BoltIcon size={260} color={GOLD} />
      </div>
      <div style={{ position: 'absolute', bottom: 60, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ fontFamily: 'Bebas Neue', fontSize: 42, letterSpacing: '0.06em', color: DARK, lineHeight: 1 }}>
          ZOE<span style={{ color: ROSE }}>STRENGTH</span>
        </div>
        <div style={{ fontSize: 12, color: MUTED, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 6 }}>Fully alive in your body</div>
      </div>
      <FloatingTag text="Run Fast" top="8%" left="0%" bg={TEAL} color={WHITE} />
      <FloatingTag text="Lift Heavy" top="20%" right="0%" bg={ROSE} color={WHITE} />
      <FloatingTag text="Peri Strong" top="36%" left="-5%" bg={DARK} color={GOLD} />
    </div>
  )
}

function Wordmark() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <BoltIcon size={22} color={GOLD} />
      <span style={{ fontFamily: 'Bebas Neue', fontSize: 20, letterSpacing: '0.08em', color: DARK }}>ZOE<span style={{ color: ROSE }}>STRENGTH</span></span>
    </div>
  )
}

function FloatingTag({ text, top, left, right, bg, color }) {
  return (
    <div style={{ position: 'absolute', top, left, right, background: bg, color, padding: '8px 14px', borderRadius: 100, fontFamily: 'Bebas Neue', fontSize: 14, letterSpacing: '0.08em', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>{text}</div>
  )
}

function Stat({ value, label, color }) {
  return (
    <div>
      <div style={{ fontFamily: 'Bebas Neue', fontSize: 30, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color, opacity: 0.55 }}>{label}</div>
    </div>
  )
}

function BoltIcon({ size = 24, color = 'currentColor', style = {} }) {
  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 100 130" fill="none" style={{ display: 'block', ...style }}>
      <polygon points="60,0 20,70 50,70 40,130 80,55 52,55" fill={color} />
    </svg>
  )
}
