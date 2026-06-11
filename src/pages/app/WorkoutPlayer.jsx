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
  const [setLogs, setSetLogs] = useState({})
  const [prevWeights, setPrevWeights] = useState({})
  const [activeExercise, setActiveExercise] = useState(null)
  const [restTimer, setRestTimer] = useState(null)
  const [holdTimer, setHoldTimer] = useState(null)
  const [notes, setNotes] = useState({})
  const [completed, setCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const timerRef = useRef(null)
  const holdTimerRef = useRef(null)
  const audioCtxRef = useRef(null)

  useEffect(() => { fetchWorkout() }, [workoutId])
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (holdTimerRef.current) clearInterval(holdTimerRef.current)
    }
  }, [])

  async function fetchWorkout() {
    const { data: wo } = await supabase
      .from('workouts')
      .select('*, weeks(programs(*))')
      .eq('id', workoutId)
      .single()

    if (!wo) { navigate('/app'); return }
    setWorkout(wo)

    const { data: exList } = await supabase
      .from('workout_exercises')
      .select('*, exercises(*)')
      .eq('workout_id', workoutId)
      .order('sort_order')

    if (exList) {
      setExercises(exList)
      for (const ex of exList) {
        const { data: prev } = await supabase
          .from('set_logs')
          .select('set_number, weight_kg, reps_completed')
          .eq('user_id', user.id)
          .eq('workout_exercise_id', ex.id)
          .neq('workout_id', workoutId)
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

    const { data: comp } = await supabase
      .from('workout_completions')
      .select('id')
      .eq('user_id', user.id)
      .eq('workout_id', workoutId)
      .single()
    if (comp) setCompleted(true)
    setLoading(false)
  }

  function beep() {
    try {
      if (!audioCtxRef.current) return
      const ctx = audioCtxRef.current
      if (ctx.state === 'suspended') ctx.resume()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 880
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.15)
    } catch(e) {}
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
        const next = prev.seconds - 1
        if (next <= 3) beep()
        return { ...prev, seconds: next }
      })
    }, 1000)
  }

  function adjustRestTimer(delta) {
    setRestTimer(prev => {
      if (!prev) return null
      const next = Math.max(1, prev.seconds + delta)
      return { ...prev, seconds: next, max: Math.max(prev.max, next) }
    })
  }

  function startHoldTimer(seconds, onComplete) {
    if (holdTimerRef.current) clearInterval(holdTimerRef.current)
    setHoldTimer({ seconds, max: seconds })
    holdTimerRef.current = setInterval(() => {
      setHoldTimer(prev => {
        if (!prev || prev.seconds <= 1) {
          clearInterval(holdTimerRef.current)
          setHoldTimer(null)
          if (onComplete) onComplete()
          return null
        }
        const next = prev.seconds - 1
        if (next <= 3) beep()
        return { ...prev, seconds: next }
      })
    }, 1000)
  }

  async function toggleSet(weId, setNum, restSeconds) {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    const key = `${weId}-${setNum}`
    const current = setLogs[key] || {}
    const nowCompleted = !current.completed
    setSetLogs(prev => ({ ...prev, [key]: { ...current, completed: nowCompleted } }))
    if (nowCompleted && restSeconds) startRestTimer(restSeconds)
    await supabase.from('set_logs').upsert({
      user_id: user.id, workout_exercise_id: weId, workout_id: workoutId,
      set_number: setNum, weight_kg: current.weight || null,
      reps_completed: current.reps || null, completed: nowCompleted,
      logged_at: new Date().toISOString(),
    }, { onConflict: 'user_id,workout_exercise_id,set_number,workout_id' })
  }

  function updateSetWeight(weId, setNum, weight) {
    const key = `${weId}-${setNum}`
    setSetLogs(prev => ({ ...prev, [key]: { ...prev[key], weight } }))
  }

  function updateSetReps(weId, setNum, reps) {
    const key = `${weId}-${setNum}`
    setSetLogs(prev => ({ ...prev, [key]: { ...prev[key], reps } }))
  }

  async function completeWorkout() {
    await supabase.from('workout_completions').upsert({
      user_id: user.id, workout_id: workoutId,
      completed_at: new Date().toISOString(),
      notes: Object.values(notes).filter(Boolean).join(' | '),
    }, { onConflict: 'user_id,workout_id' })
    setCompleted(true)
    setShowFinishModal(false)
  }

  const allSetsComplete = exercises.length > 0 && exercises.every(ex => {
    for (let s = 1; s <= ex.sets; s++) {
      if (!setLogs[`${ex.id}-${s}`]?.completed) return false
    }
    return true
  })

  // removed partial check
    for (let s = 1; s <= ex.sets; s++) {
      if (setLogs[`${ex.id}-${s}`]?.completed) return true
    }
    return false
  })

  if (loading) return <LoadingScreen />

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 120 }}>

      {/* Header */}
      <div style={{
        background: '#FFFFFF', padding: '16px 20px', borderBottom: '1px solid #E8E8E4',
        position: 'sticky', top: 56, zIndex: 40,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: '#0D0D0D', fontSize: 24, lineHeight: 1,
          }}>←</button>
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontFamily: 'Bebas Neue', fontSize: 26, letterSpacing: '0.04em',
              color: '#0D0D0D', lineHeight: 1,
            }}>{workout?.title}</h1>
            <p style={{ fontSize: 14, color: '#888882', marginTop: 2 }}>
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

      {/* Exercise list */}
      <div style={{ padding: '16px' }}>
        {exercises.map((ex, idx) => {
          const isActive = activeExercise === ex.id
          const repsArr = ex.reps ? ex.reps.split('-') : ['—']

          return (
            <div key={ex.id} style={{
              background: 'var(--white)', borderRadius: 14,
              marginBottom: 12, overflow: 'hidden',
              border: isActive ? '1px solid #1B6B7B' : '1px solid var(--mid)',
              transition: 'border 0.2s',
            }}>
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
                  background: '#F5F5F2', border: '2px solid #0D0D0D', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Bebas Neue', fontSize: 16, color: '#D4A853',
                  flexShrink: 0,
                }}>{idx + 1}</div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 17, fontWeight: 600, color: '#0D0D0D' }}>
                      {ex.exercises?.name}
                    </span>
                    {ex.section && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                        textTransform: 'uppercase', color: '#1B6B7B',
                        background: '#E8F4F6', padding: '2px 8px', borderRadius: 4,
                      }}>{ex.section}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 14, color: '#888882', marginTop: 4 }}>
                    {ex.sets} {ex.sets === 1 ? 'set' : 'sets'} · {ex.reps} reps
                    {ex.hold_seconds ? ` · ${ex.hold_seconds}s hold` : ''}
                    {ex.rest_seconds ? ` · ${ex.rest_seconds}s rest` : ''}
                  </div>
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                  {isActive ? '▲' : '▼'}
                </span>
              </button>

              {isActive && (
                <div style={{ borderTop: '1px solid var(--mid)' }}>

                  {/* Hold timer */}
                  {holdTimer && activeExercise === ex.id && (
                    <div style={{
                      margin: '12px 16px 0',
                      background: '#C4857A',
                      borderRadius: 10, padding: '12px 16px',
                      display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                      <div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Hold</div>
                        <div style={{ fontFamily: 'Bebas Neue', fontSize: 36, color: 'white', lineHeight: 1 }}>
                          {holdTimer.seconds}s
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 4, height: 4 }}>
                          <div style={{
                            background: 'white', height: '100%', borderRadius: 4,
                            width: `${(holdTimer.seconds / holdTimer.max) * 100}%`,
                            transition: 'width 1s linear',
                          }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rest timer */}
                  {restTimer && activeExercise === ex.id && (
                    <div style={{
                      margin: '12px 16px 0',
                      background: restTimer.seconds <= 3 ? '#C4857A' : 'var(--teal)',
                      borderRadius: 10, padding: '12px 16px',
                      display: 'flex', alignItems: 'center', gap: 12,
                      transition: 'background 0.3s',
                    }}>
                      <div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Rest</div>
                        <div style={{ fontFamily: 'Bebas Neue', fontSize: 36, color: 'white', lineHeight: 1 }}>
                          {Math.floor(restTimer.seconds / 60)}:{String(restTimer.seconds % 60).padStart(2, '0')}
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 4, height: 4 }}>
                          <div style={{
                            background: '#D4A853', height: '100%', borderRadius: 4,
                            width: `${(restTimer.seconds / restTimer.max) * 100}%`,
                            transition: 'width 1s linear',
                          }} />
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                          {[-15, -10, +10, +15].map(d => (
                            <button key={d} onClick={() => adjustRestTimer(d)} style={{
                              flex: 1, padding: '4px 0', borderRadius: 6,
                              background: 'rgba(255,255,255,0.15)', border: 'none',
                              color: 'white', fontSize: 11, cursor: 'pointer', fontFamily: 'DM Sans',
                            }}>{d > 0 ? '+' : ''}{d}s</button>
                          ))}
                        </div>
                      </div>
                      <button onClick={() => { clearInterval(timerRef.current); setRestTimer(null) }} style={{
                        background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8,
                        color: 'white', padding: '6px 12px', cursor: 'pointer', fontSize: 12,
                      }}>Skip</button>
                    </div>
                  )}

                  {/* Video */}
                  {ex.exercises?.video_url && (
                    <div style={{ padding: '12px 18px 0' }}>
                      <iframe
                        src={ex.exercises.video_url}
                        style={{ width: '100%', aspectRatio: '16/9', borderRadius: 10, border: 'none' }}
                        allowFullScreen
                      />
                    </div>
                  )}

                  {/* Description bullets */}
                  {ex.exercises?.description && (
                    <div style={{ padding: '12px 18px 0' }}>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 6 }}>About this exercise</p>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {ex.exercises.description.split(/\n|·|•|—/).map((line, i) => {
                          const clean = line.trim()
                          return clean ? (
                            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                              <span style={{ marginTop: 6, width: 6, height: 6, borderRadius: '50%', background: '#1B6B7B', flexShrink: 0 }} />
                              <span>{clean}</span>
                            </li>
                          ) : null
                        })}
                      </ul>
                    </div>
                  )}

                  {/* Sets table */}
                  <div style={{ padding: '12px 18px 8px' }}>
                    <div style={{
                      display: 'grid', gridTemplateColumns: '28px 1fr 80px 60px 36px',
                      gap: 8, marginBottom: 8,
                    }}>
                      {['Set', 'Previous', 'kg', 'reps', ''].map((h, i) => (
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
                          display: 'grid', gridTemplateColumns: '28px 1fr 80px 60px 36px',
                          gap: 8, marginBottom: 6, alignItems: 'center',
                          opacity: isDone ? 0.5 : 1,
                        }}>
                          <div style={{ fontFamily: 'Bebas Neue', fontSize: 16, color: 'var(--dark)' }}>{setNum}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {prevWeight ? `${prevWeight}kg` : '—'}
                            <span style={{ color: '#B0B0AA', marginLeft: 4 }}>×{targetReps}</span>
                          </div>
                          <input
                            type="number"
                            placeholder={prevWeight || '0'}
                            value={log.weight || ''}
                            onChange={e => updateSetWeight(ex.id, setNum, e.target.value)}
                            disabled={isDone}
                            style={{
                              padding: '8px 8px', borderRadius: 8,
                              border: '1px solid var(--mid)', fontSize: 14,
                              background: isDone ? '#F8F8F6' : 'white',
                              width: '100%', fontFamily: 'DM Sans', outline: 'none',
                            }}
                          />
                          <input
                            type="number"
                            placeholder={targetReps}
                            value={log.reps || ''}
                            onChange={e => updateSetReps(ex.id, setNum, e.target.value)}
                            disabled={isDone}
                            style={{
                              padding: '8px 8px', borderRadius: 8,
                              border: '1px solid var(--mid)', fontSize: 14,
                              background: isDone ? '#F8F8F6' : 'white',
                              width: '100%', fontFamily: 'DM Sans', outline: 'none',
                            }}
                          />
                          <button
                            onClick={() => {
                              if (ex.hold_seconds && !isDone) {
                                startHoldTimer(ex.hold_seconds, () => toggleSet(ex.id, setNum, ex.rest_seconds))
                              } else {
                                toggleSet(ex.id, setNum, ex.rest_seconds)
                              }
                            }}
                            style={{
                              width: 36, height: 36, borderRadius: '50%',
                              background: isDone ? 'var(--teal)' : 'var(--mid)',
                              border: 'none', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 14, color: isDone ? 'white' : 'var(--text-muted)',
                              transition: 'all 0.15s',
                            }}
                          >✓</button>
                        </div>
                      )
                    })}
                  </div>

                  {/* Per-exercise notes */}
                  <div style={{ padding: '0 18px 16px' }}>
                    <textarea
                      placeholder="Notes for this exercise..."
                      value={notes[ex.id] || ''}
                      onChange={e => setNotes(prev => ({ ...prev, [ex.id]: e.target.value }))}
                      rows={2}
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: 10,
                        border: '1px solid var(--mid)', fontSize: 13,
                        fontFamily: 'DM Sans', resize: 'vertical', outline: 'none',
                        background: '#FAFAF8', color: '#555550', boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Finish button */}
      {!completed && (
        <div style={{
          position: 'fixed', bottom: 72, left: 0, right: 0,
          padding: '16px 20px', background: 'var(--light)',
          borderTop: '1px solid var(--mid)', maxWidth: 600, margin: '0 auto',
        }}>
          <button onClick={completeWorkout} style={{
            width: '100%', padding: '16px',
            background: 'var(--dark)', color: '#D4A853',
            border: 'none', borderRadius: 100, cursor: 'pointer',
            fontFamily: 'Bebas Neue', fontSize: 18, letterSpacing: '0.08em',
          }}>FINISH WORKOUT</button>
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
          }}>✓ WORKOUT COMPLETE — BACK TO PROGRAM</button>
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
