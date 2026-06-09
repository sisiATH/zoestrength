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

  useEffect(() => {
    fetchPrograms()
  }, [])

  async function fetchPrograms() {
    const { data: progs } = await supabase
      .from('programs')
      .select('*')
      .eq('is_published', true)
      .order('sort_order')

    if (progs) setPrograms(progs)

    // Get completion counts per program
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
    <div style={{ padding: '24px 20px', maxWidth: 600, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'Bebas Neue', fontSize: 36, color: 'var(--dark)', letterSpacing: '0.03em' }}>
          YOUR PROGRAMS
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
          All programs included with your subscription
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {programs.map(program => (
          <ProgramCard
            key={program.id}
            program={program}
            completedCount={completions[program.id] || 0}
            onClick={() => navigate(`/app/program/${program.id}`)}
          />
        ))}
      </div>
    </div>
  )
}

function ProgramCard({ program, completedCount, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: program.color,
        borderRadius: 18, padding: '24px',
        cursor: 'pointer', position: 'relative', overflow: 'hidden',
        transition: 'transform 0.15s',
      }}
      onMouseOver={e => e.currentTarget.style.transform = 'scale(1.01)'}
      onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      {/* Background bolt */}
      <div style={{ position: 'absolute', right: -8, top: -8, opacity: 0.08 }}>
        <svg width={100} height={130} viewBox="0 0 100 130" fill="none">
          <polygon points="60,0 20,70 50,70 40,130 80,55 52,55" fill={program.text_color} />
        </svg>
      </div>

      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: program.text_color, opacity: 0.6,
              display: 'block', marginBottom: 6,
            }}>
              {program.duration_weeks ? `${program.duration_weeks} weeks` : 'Ongoing'}
              {program.days_per_week ? ` · ${program.days_per_week} days/wk` : ''}
            </span>
            <h2 style={{
              fontFamily: 'Bebas Neue', fontSize: 30, letterSpacing: '0.03em',
              color: program.text_color, lineHeight: 1,
            }}>{program.name}</h2>
          </div>
          {completedCount > 0 && (
            <div style={{
              background: 'rgba(0,0,0,0.15)', borderRadius: 100,
              padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <span style={{ fontSize: 10, color: program.text_color, opacity: 0.8 }}>✓</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: program.text_color, opacity: 0.8 }}>
                {completedCount} done
              </span>
            </div>
          )}
        </div>

        {program.tagline && (
          <p style={{
            fontSize: 13, color: program.text_color, opacity: 0.75,
            marginTop: 10, lineHeight: 1.5,
          }}>{program.tagline}</p>
        )}

        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontSize: 12, fontWeight: 600, color: program.text_color,
            opacity: 0.9, letterSpacing: '0.04em',
          }}>
            VIEW PROGRAM →
          </span>
        </div>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div style={{ padding: '24px 20px' }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          height: 120, background: '#E8E8E4', borderRadius: 18,
          marginBottom: 14, animation: 'shimmer 1.5s infinite',
        }} />
      ))}
      <style>{`@keyframes shimmer { 0%,100%{opacity:0.5} 50%{opacity:1} }`}</style>
    </div>
  )
}
