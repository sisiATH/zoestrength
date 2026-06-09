import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export default function WorkoutPlayer() {
  const { workoutId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [workout, setWorkout] = useState(null)
  const [exercises, setExercises] = useState([])
  const [setLogs, setSetLogs] = useState({}) // { workoutExerciseId: { setNum: { weight, reps, completed } } }
  const [prevWeights, setPrevWeights] = useState({}) // { exerciseId: { setNum: weight } }
  const [activeExercise, setActiveExercise] = useState(null)
  const [restTimer, setRestTimer] = useState(null) // { seconds, max }
  const [completed, setCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const timerRef = useRef(null)

  useEffect(() => { fetchWorkout() }, [workoutId])

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  async function fetchWorkout() {
    const { data: wo } = await supabase
      .from('workouts')
      .select(`*, weeks(programs(*))`)
      .eq('id', workoutId)
      .single()

    if (!wo) { navigate('/app'); return }
    setWorkout(wo)

    const { data: exList } = await supabase
      .from('workout_exercises')
      .select(`*, exercises(*)`)
      .eq('workout_id', workoutId)
      .order('sort_order')

    if (exList) {
      setExercises(exList)

      // Fetch previous session weights for each exercise
      for (const ex of exList) {
        const { data: prev } = await supabase
          .from('set_logs')
          .select('set_number, weight_kg, reps_completed')
          .eq('user_id', user.id)
          .eq('workout_exercise_id', ex.id)
          .neq('workout_id', workoutId) // not current session
          .order('logged_at', { ascending: false })
          .limit(ex.sets)

        if (prev?.length) {
          setPrevWeights(p => ({
            ...p,
            [ex.id]: prev.reduce((acc, s) => ({ ...acc, [s.set_number]: s.weight_kg }), {})
          }))
        }
      }
    }

    // Check if already completed
    const { data: comp } = await supabase
      .from('workout_completions')
      .select('id')
      .eq('user_id', user.id)
      .eq('workout_id', workoutId)
      .single()

    if (comp) setCompleted(true)

    setLoading(false)
  }

  function startRestTimer(seconds) {
    if (timerRef.current) clearInterval(timerRef.current)
    setRestTimer({ seconds, max: seconds })
    timerRef.current = setInterval(() => {
      setRestTimer(prev => {
        if (!prev || prev.seconds <= 1) {
          clearInterval(timerRef.current)
          return null
        }
        return { ...prev, seconds: prev.seconds - 1 }
      })
    }, 1000)
  }

  async function toggleSet(weId, setNum, restSeconds) {
    const key = `${weId}-${setNum}`
    const current = setLogs[key] || {}
    const nowCompleted = !current.completed

    setSetLogs(prev => ({
      ...prev,
      [key]: { ...current, completed: nowCompleted }
    }))

    if (nowCompleted && restSeconds) {
      startRestTimer(restSeconds)
    }

    // Save to Supabase
    await supabase.from('set_logs').upsert({
      user_id: user.id,
      workout_exercise_id: weId,
      workout_id: workoutId,
      set_number: setNum,
      weight_kg: current.weight || null,
      reps_completed: current.reps || null,
      completed: nowCompleted,
      logged_at: new Date().toISOString(),
    }, { onConflict: 'user_id,workout_exercise_id,set_number,workout_id' })
  }

  function updateSetWeight(weId, setNum, weight) {
    const key = `${weId}-${setNum}`
    setSetLogs(prev => ({
      ...prev,
      [key]: { ...prev[key], weight }
    }))
  }

  async function completeWorkout() {
    await supabase.from('workout_completions').upsert({
      user_id: user.id,
      workout_id: workoutId,
      completed_at: new Date().toISOString(),
    }, { onConflict: 'user_id,workout_id' })
    setCompleted(true)
  }

  const allSetsComplete = exercises.length > 0 && exercises.every(ex => {
    for (let s = 1; s <= ex.sets; s++) {
      if (!setLogs[`${ex.id}-${s}`]?.completed) return false
    }
    return true
  })

  if (loading) return <LoadingScreen />

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 120 }}>

      {/* Header */}
      <div style={{
        background: 'var(--dark)', padding: '16px 20px',
        position: 'sticky', top: 56, zIndex: 40,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: '#888882', fontSize: 20, lineHeight: 1,
          }}>←</button>
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontFamily: 'Bebas Neue', fontSize: 20, letterSpacing: '0.04em',
              color: 'var(--white)', lineHeight: 1,
            }}>{workout?.title}</h1>
            <p style={{ fontSize: 11, color: '#555550', marginTop: 2 }}>
              {exercises.length} exercises
            </p>
          </div>
          {completed && (
            <div style={{
              background: 'var(--teal)', color: 'white',
              padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600,
            }}>✓ Done</div>
          )}
        </div>
      </div>

      {/* Rest Timer Banner */}
      {restTimer && (
        <div style={{
          background: 'var(--teal)', padding: '14px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 112, zIndex: 39,
        }}>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Rest</div>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 32, color: 'white', lineHeight: 1 }}>
              {Math.floor(restTimer.seconds / 60)}:{String(restTimer.seconds % 60).padStart(2, '0')}
            </div>
          </div>
          <div style={{ flex: 1, margin: '0 16px' }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 4, height: 4 }}>
              <div style={{
                background: 'var(--lime)', height: '100%', borderRadius: 4,
                width: `${(restTimer.seconds / restTimer.max) * 100}%`,
                transition: 'width 1s linear',
              }} />
            </div>
          </div>
          <button onClick={() => { clearInterval(timerRef.current); setRestTimer(null) }} style={{
            background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8,
            color: 'white', padding: '6px 12px', cursor: 'pointer', fontSize: 12,
          }}>
            Skip
          </button>
        </div>
      )}

      {/* Exercise list */}
      <div style={{ padding: '16px' }}>
        {exercises.map((ex, idx) => {
          const isActive = activeExercise === ex.id
          const repsArr = ex.reps.split('-')

          return (
            <div key={ex.id} style={{
              background: 'var(--white)', borderRadius: 14,
              marginBottom: 12, overflow: 'hidden',
              border: '1px solid var(--mid)',
            }}>
              {/* Exercise header */}
              <button
                onClick={() => setActiveExercise(isActive ? null : ex.id)}
                style={{
                  width: '100%', padding: '16px 18px',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 14,
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'var(--dark)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Bebas Neue', fontSize: 16, color: 'var(--lime)',
                  flexShrink: 0,
                }}>{idx + 1}</div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--dark)' }}>
                    {ex.exercises?.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {ex.sets} sets · {ex.reps} reps
                    {ex.rest_seconds && ` · ${ex.rest_seconds}s rest`}
                  </div>
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                  {isActive ? '▲' : '▼'}
                </span>
              </button>

              {/* Expanded exercise detail */}
              {isActive && (
                <div style={{ borderTop: '1px solid var(--mid)' }}>
                  {/* Video embed placeholder */}
                  {ex.exercises?.video_url && (
                    <div style={{ padding: '0 18px 16px' }}>
                      <iframe
                        src={ex.exercises.video_url}
                        style={{ width: '100%', aspectRatio: '16/9', borderRadius: 10, border: 'none' }}
                        allowFullScreen
                      />
                    </div>
                  )}

                  {/* Coaching cues */}
                  {ex.exercises?.description && (
                    <div style={{ padding: '0 18px 16px' }}>
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                        {ex.exercises.description}
                      </p>
                    </div>
                  )}

                  {/* Sets table */}
                  <div style={{ padding: '0 18px 18px' }}>
                    <div style={{
                      display: 'grid', gridTemplateColumns: '32px 1fr 1fr 36px',
                      gap: 8, marginBottom: 8,
                    }}>
                      {['Set', 'Previous', 'kg', ''].map((h, i) => (
                        <div key={i} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</div>
                      ))}
                    </div>

                    {Array.from({ length: ex.sets }, (_, i) => {
                      const setNum = i + 1
                      const logKey = `${ex.id}-${setNum}`
                      const log = setLogs[logKey] || {}
                      const prevWeight = prevWeights[ex.id]?.[setNum]
                      const targetReps = repsArr[i] || repsArr[repsArr.length - 1]
                      const isDone = log.completed

                      return (
                        <div key={setNum} style={{
                          display: 'grid', gridTemplateColumns: '32px 1fr 1fr 36px',
                          gap: 8, marginBottom: 6, alignItems: 'center',
                          opacity: isDone ? 0.5 : 1,
                        }}>
                          <div style={{
                            fontFamily: 'Bebas Neue', fontSize: 16, color: 'var(--dark)',
                          }}>{setNum}</div>
                          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                            {prevWeight ? `${prevWeight}kg` : '—'}
                            <span style={{ color: '#B0B0AA', marginLeft: 4 }}>× {targetReps}</span>
                          </div>
                          <input
                            type="number"
                            placeholder={prevWeight || '0'}
                            value={log.weight || ''}
                            onChange={e => updateSetWeight(ex.id, setNum, e.target.value)}
                            disabled={isDone}
                            style={{
                              padding: '8px 10px', borderRadius: 8,
                              border: '1px solid var(--mid)', fontSize: 14,
                              background: isDone ? '#F8F8F6' : 'white',
                              width: '100%', fontFamily: 'DM Sans',
                              outline: 'none',
                            }}
                          />
                          <button
                            onClick={() => toggleSet(ex.id, setNum, ex.rest_seconds)}
                            style={{
                              width: 36, height: 36, borderRadius: '50%',
                              background: isDone ? 'var(--teal)' : 'var(--mid)',
                              border: 'none', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 14, color: isDone ? 'white' : 'var(--text-muted)',
                              transition: 'all 0.15s',
                            }}
                          >
                            ✓
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Complete workout button */}
      {!completed && (
        <div style={{
          position: 'fixed', bottom: 72, left: 0, right: 0,
          padding: '16px 20px', background: 'var(--light)',
          borderTop: '1px solid var(--mid)', maxWidth: 600, margin: '0 auto',
        }}>
          <button
            onClick={completeWorkout}
            disabled={!allSetsComplete}
            style={{
              width: '100%', padding: '16px',
              background: allSetsComplete ? 'var(--dark)' : 'var(--mid)',
              color: allSetsComplete ? 'var(--lime)' : 'var(--text-muted)',
              border: 'none', borderRadius: 100, cursor: allSetsComplete ? 'pointer' : 'not-allowed',
              fontFamily: 'Bebas Neue', fontSize: 18, letterSpacing: '0.08em',
              transition: 'all 0.2s',
            }}
          >
            {allSetsComplete ? 'COMPLETE WORKOUT →' : 'COMPLETE ALL SETS TO FINISH'}
          </button>
        </div>
      )}

      {completed && (
        <div style={{
          position: 'fixed', bottom: 72, left: 0, right: 0,
          padding: '16px 20px', maxWidth: 600, margin: '0 auto',
        }}>
          <button onClick={() => navigate(-1)} style={{
            width: '100%', padding: '16px',
            background: 'var(--teal)', color: 'white',
            border: 'none', borderRadius: 100, cursor: 'pointer',
            fontFamily: 'Bebas Neue', fontSize: 18, letterSpacing: '0.08em',
          }}>
            ✓ WORKOUT COMPLETE — BACK TO PROGRAM
          </button>
        </div>
      )}
    </div>
  )
}

function LoadingScreen() {
  return (
    <div style={{ padding: 24 }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{
          height: 72, background: '#E8E8E4', borderRadius: 14,
          marginBottom: 10, animation: 'shimmer 1.5s infinite',
        }} />
      ))}
      <style>{`@keyframes shimmer { 0%,100%{opacity:0.5} 50%{opacity:1} }`}</style>
    </div>
  )
}
