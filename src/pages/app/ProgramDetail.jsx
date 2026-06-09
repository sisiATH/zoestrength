import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export default function ProgramDetail() {
  const { programId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [program, setProgram] = useState(null)
  const [weeks, setWeeks] = useState([])
  const [completedWorkoutIds, setCompletedWorkoutIds] = useState(new Set())
  const [expandedWeeks, setExpandedWeeks] = useState(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchProgram() }, [programId])

  async function fetchProgram() {
    const { data: prog } = await supabase
      .from('programs')
      .select('*')
      .eq('id', programId)
      .single()

    if (!prog) { navigate('/app'); return }
    setProgram(prog)

    const { data: weeksData } = await supabase
      .from('weeks')
      .select(`*, workouts(*)`)
      .eq('program_id', programId)
      .order('week_number')

    const { data: comps } = await supabase
      .from('workout_completions')
      .select('workout_id')
      .eq('user_id', user.id)

    const completedIds = new Set(comps?.map(c => c.workout_id) || [])
    setCompletedWorkoutIds(completedIds)

    if (weeksData) {
      setWeeks(weeksData)
      // Auto-expand: find the first week with an incomplete workout
      const firstIncompleteWeek = weeksData.find(w =>
        w.workouts?.some(wo => !completedIds.has(wo.id))
      )
      if (firstIncompleteWeek) {
        setExpandedWeeks(new Set([firstIncompleteWeek.id]))
      } else {
        // All done — expand last week
        const lastWeek = weeksData[weeksData.length - 1]
        if (lastWeek) setExpandedWeeks(new Set([lastWeek.id]))
      }
    }

    setLoading(false)
  }

  function toggleWeek(weekId) {
    setExpandedWeeks(prev => {
      const next = new Set(prev)
      next.has(weekId) ? next.delete(weekId) : next.add(weekId)
      return next
    })
  }

  function getWeekProgress(week) {
    const workouts = week.workouts || []
    const done = workouts.filter(w => completedWorkoutIds.has(w.id)).length
    return { done, total: workouts.length }
  }

  if (loading) return <div style={{ padding: 24 }}><LoadingSkeleton /></div>
  if (!program) return null

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        background: '#FFFFFF', padding: '32px 20px 28px', borderBottom: '1px solid #E8E8E4',
        position: 'relative', overflow: 'hidden',
      }}>
        {program.cover_image_url && (
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'url(' + program.cover_image_url + ')',
            backgroundSize: 'cover', backgroundPosition: 'center top',
            opacity: 1,
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to bottom, ' + program.color + 'DD 0%, ' + program.color + 'BB 100%)',
            }} />
          </div>
        )}
        <div style={{ position: 'relative', zIndex: 1, borderLeft: '4px solid ' + program.color, paddingLeft: 16 }}>
        <button onClick={() => navigate('/app')} style={{
          background: '#F5F5F2', border: 'none', borderRadius: 100,
          padding: '6px 14px', cursor: 'pointer',
          color: '#0D0D0D', fontSize: 14, fontWeight: 600,
          marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6,
        }}>
          ← Back
        </button>
        <div style={{ position: 'absolute', right: -10, top: -10, opacity: 0.08 }}>
          <svg width={140} height={182} viewBox="0 0 100 130" fill="none">
            <polygon points="60,0 20,70 50,70 40,130 80,55 52,55" fill={program.text_color} />
          </svg>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: '#888882', opacity: 1,
          display: 'block', marginBottom: 6,
        }}>
          {program.duration_weeks} weeks · {program.days_per_week} days/week
        </span>
        <h1 style={{
          fontFamily: 'Bebas Neue', fontSize: 48, letterSpacing: '0.03em',
          color: '#0D0D0D', lineHeight: 1, marginBottom: 8,
        }}>{program.name}</h1>
        {program.tagline && (
          <p style={{ fontSize: 15, color: '#555550', opacity: 1 }}>{program.tagline}</p>
        )}
        </div>
      </div>

      {/* Weeks */}
      <div style={{ padding: '16px 16px 100px' }}>
        {weeks.map(week => {
          const { done, total } = getWeekProgress(week)
          const isComplete = done === total && total > 0
          const isExpanded = expandedWeeks.has(week.id)

          return (
            <div key={week.id} style={{
              background: 'var(--white)', borderRadius: 14,
              marginBottom: 10, overflow: 'hidden',
              border: '1px solid var(--mid)',
              opacity: isComplete ? 0.6 : 1,
            }}>
              {/* Week header */}
              <button
                onClick={() => toggleWeek(week.id)}
                style={{
                  width: '100%', padding: '16px 18px',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {isComplete ? (
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: 'var(--teal)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, color: 'white',
                    }}>✓</div>
                  ) : (
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      border: '2px solid var(--mid)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Bebas Neue', fontSize: 13, color: 'var(--text-muted)',
                    }}>{week.week_number}</div>
                  )}
                  <div style={{ textAlign: 'left' }}>
                    <div style={{
                      fontFamily: 'Bebas Neue', fontSize: 16, letterSpacing: '0.03em',
                      color: 'var(--dark)',
                    }}>
                      {week.title || `Week ${week.week_number}`}
                      {week.is_deload && (
                        <span style={{
                          marginLeft: 8, fontSize: 10, background: '#E8E8E4',
                          color: 'var(--text-muted)', padding: '2px 8px',
                          borderRadius: 4, verticalAlign: 'middle',
                        }}>DELOAD</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                      {done}/{total} sessions complete
                    </div>
                  </div>
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                  {isExpanded ? '▲' : '▼'}
                </span>
              </button>

              {/* Workouts list */}
              {isExpanded && (
                <div style={{ borderTop: '1px solid var(--mid)' }}>
                  {(week.workouts || [])
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map(workout => {
                      const isDone = completedWorkoutIds.has(workout.id)
                      return (
                        <button
                          key={workout.id}
                          onClick={() => navigate(`/app/workout/${workout.id}`)}
                          style={{
                            width: '100%', padding: '14px 18px',
                            background: isDone ? '#F8F8F6' : 'var(--white)',
                            border: 'none', borderBottom: '1px solid var(--mid)',
                            cursor: 'pointer', display: 'flex',
                            alignItems: 'center', justifyContent: 'space-between',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: '50%',
                              background: isDone ? 'var(--teal)' : program.color,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: isDone ? 14 : 12,
                              color: isDone ? 'white' : program.text_color,
                              flexShrink: 0,
                            }}>
                              {isDone ? '✓' : workout.day_number}
                            </div>
                            <div style={{ textAlign: 'left' }}>
                              <div style={{
                                fontSize: 14, fontWeight: 600, color: isDone ? 'var(--text-muted)' : 'var(--dark)',
                                textDecoration: isDone ? 'line-through' : 'none',
                              }}>
                                {workout.title}
                              </div>
                              {workout.estimated_duration_mins && (
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                                  ~{workout.estimated_duration_mins} min
                                </div>
                              )}
                            </div>
                          </div>
                          <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>›</span>
                        </button>
                      )
                    })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          height: 70, background: '#E8E8E4', borderRadius: 14,
          marginBottom: 10, animation: 'shimmer 1.5s infinite',
        }} />
      ))}
      <style>{`@keyframes shimmer { 0%,100%{opacity:0.5} 50%{opacity:1} }`}</style>
    </div>
  )
}
