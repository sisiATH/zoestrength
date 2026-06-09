import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export default function ProgramsView() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [programs, setPrograms] = useState([])
  const [completions, setCompletions] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchPrograms() }, [])

  async function fetchPrograms() {
    const { data: progs } = await supabase
      .from('programs')
      .select('*')
      .eq('is_published', true)
      .order('sort_order')

    if (progs) setPrograms(progs)

    const { data: comp } = await supabase
      .from('workout_completions')
      .select('workout_id, workouts(program_id)')
      .eq('user_id', user.id)

    if (comp) {
      const counts = {}
      comp.forEach(c => {
        const pid = c.workouts?.program_id
        if (pid) counts[pid] = (counts[pid] || 0) + 1
      })
      setCompletions(counts)
    }

    setLoading(false)
  }

  if (loading) return <LoadingSkeleton />

  return (
    <div style={{ padding: '24px 0 100px' }}>
      <div style={{ padding: '0 20px', marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'Bebas Neue', fontSize: 32, color: 'var(--dark)', letterSpacing: '0.03em' }}>
          YOUR PROGRAMS
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
          All programs included with your subscription
        </p>
      </div>

      {/* Horizontal scroll row */}
      <div style={{
        display: 'flex',
        overflowX: 'auto',
        gap: 16,
        padding: '8px 20px 16px',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}>
        {programs.map(program => (
          <ProgramCard
            key={program.id}
            program={program}
            completedCount={completions[program.id] || 0}
            onClick={() => navigate(`/app/program/${program.id}`)}
          />
        ))}
      </div>

      <style>{`.programs-scroll::-webkit-scrollbar { display: none; }`}</style>
    </div>
  )
}

function ProgramCard({ program, completedCount, onClick }) {
  const size = 160

  return (
    <div
      onClick={onClick}
      style={{
        flexShrink: 0,
        width: size,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
      }}
    >
      {/* Square card with image or color */}
      <div style={{
        width: size,
        height: size,
        borderRadius: 20,
        background: program.color,
        backgroundImage: program.cover_image_url ? 'url(' + program.cover_image_url + ')' : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.15s',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
      }}
        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.04)'}
        onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        {/* Bolt watermark if no image */}
        {!program.cover_image_url && (
          <div style={{ position: 'absolute', right: -10, bottom: -10, opacity: 0.15 }}>
            <svg width={100} height={130} viewBox="0 0 100 130" fill="none">
              <polygon points="60,0 20,70 50,70 40,130 80,55 52,55" fill={program.text_color} />
            </svg>
          </div>
        )}

        {/* Completion badge */}
        {completedCount > 0 && (
          <div style={{
            position: 'absolute', top: 8, right: 8,
            background: 'var(--teal)', color: 'white',
            borderRadius: 100, padding: '2px 8px',
            fontSize: 10, fontWeight: 700,
          }}>✓ {completedCount}</div>
        )}

        {/* Program name overlay at bottom */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)',
          padding: '20px 10px 10px',
        }}>
          <div style={{
            fontFamily: 'Bebas Neue', fontSize: 18, letterSpacing: '0.04em',
            color: '#FFFFFF', lineHeight: 1,
          }}>{program.name}</div>
        </div>
      </div>

      {/* Info below card */}
      <div style={{ textAlign: 'center', width: '100%' }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
          {program.duration_weeks ? `${program.duration_weeks}w` : ''}
          {program.days_per_week ? ` · ${program.days_per_week}d/wk` : ''}
        </div>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div style={{ padding: '24px 20px' }}>
      <div style={{ display: 'flex', gap: 16, overflowX: 'auto' }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            flexShrink: 0, width: 160, height: 160,
            background: '#E8E8E4', borderRadius: 20,
            animation: 'shimmer 1.5s infinite',
          }} />
        ))}
      </div>
      <style>{`@keyframes shimmer { 0%,100%{opacity:0.5} 50%{opacity:1} }`}</style>
    </div>
  )
}
