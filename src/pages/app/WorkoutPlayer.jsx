import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

function parseSeconds(reps) {
  if (!reps) return null
  const s = String(reps).trim()
  let m = s.match(/^(\d+)\s*s(ec)?\b/i)
  if (m) return parseInt(m[1], 10)
  m = s.match(/^(\d+):(\d{2})$/)
  if (m) return parseInt(m[1], 10) * 60 + parseInt(m[2], 10)
  return null
}

function toWatchUrl(url) {
  if (!url) return null
  try {
    const u = url.trim()
    let m = u.match(/youtube\.com\/embed\/([\w-]+)/)
    if (m) return `https://www.youtube.com/watch?v=${m[1]}`
    m = u.match(/youtu\.be\/([\w-]+)/)
    if (m) return `https://www.youtube.com/watch?v=${m[1]}`
    return u
  } catch { return url }
}

function cleanNotes(notes) {
  if (!notes) return ''
  const parts = String(notes).split('|').map(s => s.trim()).filter(Boolean)
  return parts.length > 1 ? parts[parts.length - 1] : String(notes).trim()
}

function repsTokenFor(ex, setNum) {
  if (!ex?.reps) return ''
  if (parseSeconds(ex.reps) != null) return ''
  const arr = String(ex.reps).split('-').map(s => s.trim())
  return arr[setNum - 1] || arr[arr.length - 1] || ''
}

function targetRepsFor(ex, setNum) {
  const t = repsTokenFor(ex, setNum)
  const m = String(t).match(/\d+/)
  return m ? m[0] : ''
}

export default function WorkoutPlayer() {
  const { workoutId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [workout, setWorkout] = useState(null)
  const [exercises, setExercises] = useState([])
  const [setLogs, setSetLogs] = useState({})
  const [prevWeights, setPrevWeights] = useState({})
  const [activeExercise, setActiveExercise] = useState(null)
  const [howToOpen, setHowToOpen] = useState({})
  const [extraSets, setExtraSets] = useState({})
  const [restTimer, setRestTimer] = useState(null)
  const [holdTimer, setHoldTimer] = useState(null)
  const [flash, setFlash] = useState(false)
  const [notes, setNotes] = useState({})
  const [completed, setCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const timerRef = useRef(null)
  const holdTimerRef = useRef(null)
  const audioCtxRef = useRef(null)

  useEffect(() => { fetchWorkout() }, [workoutId])

  useEffect(() => {
    function prime() {
      try {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
        }
        if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume()
      } catch (e) {}
    }
    prime()
    window.addEventListener('pointerdown', prime, { once: false })
    return () => {
      window.removeEventListener('pointerdown', prime)
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
      const seed = {}
      for (const ex of exList) {
        if (parseSeconds(ex.reps) != null) continue
        for (let s = 1; s <= ex.sets; s++) {
          const t = targetRepsFor(ex, s)
          if (t) seed[`${ex.id}-${s}`] = { reps: t }
        }
      }
      if (Object.keys(seed).length) setSetLogs(seed)

      // Build map of exercise_id -> workout_exercise_id for this workout
      const exerciseIdToWeId = {}
      for (const ex of exList) {
        if (ex.exercises?.id) exerciseIdToWeId[ex.exercises.id] = ex.id
      }

      const exerciseIds = exList.map(ex => ex.exercises?.id).filter(Boolean)

      if (exerciseIds.length) {
        // Get all workout_exercise_ids across all workouts for these exercises
        const { data: matchingWEs } = await supabase
          .from('workout_exercises')
          .select('id, exercise_id')
          .in('exercise_id', exerciseIds)

        if (matchingWEs?.length) {
          const weIds = matchingWEs.map(we => we.id)
          const weIdToExerciseId = {}
          for (const we of matchingWEs) weIdToExerciseId[we.id] = we.exercise_id

          const { data: allPrev } = await supabase
            .from('set_logs')
            .select('workout_exercise_id, set_number, weight_kg, reps_completed, logged_at')
            .eq('user_id', user.id)
            .in('workout_exercise_id', weIds)
            .neq('workout_id', workoutId)
            .not('weight_kg', 'is', null)
            .order('logged_at', { ascending: false })

          if (allPrev?.length) {
            const seen = new Set()
            const byExercise = {}
            for (const log of allPrev) {
              const exerciseId = weIdToExerciseId[log.workout_exercise_id]
              if (!exerciseId) continue
              const key = `${exerciseId}-${log.set_number}`
              if (seen.has(key)) continue
              seen.add(key)
              if (!byExercise[exerciseId]) byExercise[exerciseId] = {}
              byExercise[exerciseId][log.set_number] = log.weight_kg
            }
            // Map back to workout_exercise_id (what the UI uses)
            const newPrevWeights = {}
            for (const [exerciseId, sets] of Object.entries(byExercise)) {
              const weId = exerciseIdToWeId[exerciseId]
              if (weId) newPrevWeights[weId] = sets
            }
            setPrevWeights(newPrevWeights)
          }
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
      const ctx = audioCtxRef.current
      if (!ctx) return
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
    } catch (e) {}
  }

  function buzz(pattern) {
    try { if (navigator.vibrate) navigator.vibrate(pattern) } catch (e) {}
  }

  function tick(secondsLeft) {
    if (secondsLeft <= 3 && secondsLeft > 0) { beep(); buzz(80) }
  }

  function done() {
    beep(); buzz([120, 60, 120])
    setFlash(true)
    setTimeout(() => setFlash(false), 350)
  }

  function startRestTimer(seconds, label = 'Rest') {
    if (!seconds) return
    if (timerRef.current) clearInterval(timerRef.current)
    setRestTimer({ seconds, max: seconds, label })
    timerRef.current = setInterval(() => {
      setRestTimer(prev => {
        if (!prev || prev.seconds <= 1) {
          clearInterval(timerRef.current)
          done()
          return null
        }
        const next = prev.seconds - 1
        tick(next)
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

  function adjustHoldTimer(delta) {
    setHoldTimer(prev => {
      if (!prev) return null
      const next = Math.max(1, prev.seconds + delta)
      return { ...prev, seconds: next, max: Math.max(prev.max, next) }
    })
  }

  function startHoldTimer(seconds, onComplete, label = 'Work') {
    if (!seconds) { if (onComplete) onComplete(); return }
    if (holdTimerRef.current) clearInterval(holdTimerRef.current)
    setHoldTimer({ seconds, max: seconds, label })
    holdTimerRef.current = setInterval(() => {
      setHoldTimer(prev => {
        if (!prev || prev.seconds <= 1) {
          clearInterval(holdTimerRef.current)
          setHoldTimer(null)
          done()
          if (onComplete) onComplete()
          return null
        }
        const next = prev.seconds - 1
        tick(next)
        return { ...prev, seconds: next }
      })
    }, 1000)
  }

  function patchLog(weId, setNum, patch) {
    const key = `${weId}-${setNum}`
    setSetLogs(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }))
  }

  async function persistSet(weId, setNum, ex) {
    const key = `${weId}-${setNum}`
    const cur = setLogs[key] || {}
    const prevW = prevWeights[weId]?.[setNum]
    const target = targetRepsFor(ex, setNum)
    const weight = (cur.weight === '' || cur.weight == null) ? (prevW ?? null) : cur.weight
    const reps = (cur.reps === '' || cur.reps == null) ? target : cur.reps
    if (!cur.completed && weight == null && (reps == null || reps === '')) return
    await supabase.from('set_logs').upsert({
      user_id: user.id, workout_exercise_id: weId, workout_id: workoutId,
      set_number: setNum, weight_kg: weight || null,
      reps_completed: reps || null, completed: !!cur.completed,
      logged_at: new Date().toISOString(),
    }, { onConflict: 'user_id,workout_exercise_id,set_number,workout_id' })
  }

  async function toggleSet(ex, setNum) {
    const key = `${ex.id}-${setNum}`
    const current = setLogs[key] || {}
    const nowCompleted = !current.completed
    setSetLogs(prev => ({ ...prev, [key]: { ...current, completed: nowCompleted } }))
    if (nowCompleted && ex.rest_seconds) startRestTimer(ex.rest_seconds, `Rest · ${ex.exercises?.name || ''}`)

    const prevW = prevWeights[ex.id]?.[setNum]
    const target = targetRepsFor(ex, setNum)
    const weight = (current.weight === '' || current.weight == null) ? (prevW ?? null) : current.weight
    const reps = (current.reps === '' || current.reps == null) ? target : current.reps
    await supabase.from('set_logs').upsert({
      user_id: user.id, workout_exercise_id: ex.id, workout_id: workoutId,
      set_number: setNum, weight_kg: weight || null,
      reps_completed: reps || null, completed: nowCompleted,
      logged_at: new Date().toISOString(),
    }, { onConflict: 'user_id,workout_exercise_id,set_number,workout_id' })
  }

  async function completeWorkout() {
    await supabase.from('workout_completions').upsert({
      user_id: user.id, workout_id: workoutId,
      completed_at: new Date().toISOString(),
      notes: Object.values(notes).filter(Boolean).join(' | '),
    }, { onConflict: 'user_id,workout_id' })
    setCompleted(true)
  }

  const isRun = ['run', 'sit'].includes(workout?.workout_type)

  if (loading) return <LoadingScreen />

  if (exercises.length === 0) {
    const isRestDay = workout?.title === 'Rest Day'
    const msg = isRestDay
      ? (workout?.description || 'Full rest today. Recovery is where the adaptation happens.')
      : 'Head out and run this one — details are in the title. Log it when you\'re back.'
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', minHeight: '100vh', background: 'var(--light)' }}>
        <div style={{ background: '#FFFFFF', padding: '16px 20px', borderBottom: '1px solid #E8E8E4', position: 'sticky', top: 56, zIndex: 40, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#0D0D0D', fontSize: 24, lineHeight: 1 }}>←</button>
          <h1 style={{ fontFamily: 'Bebas Neue', fontSize: 26, letterSpacing: '0.04em', color: '#0D0D0D', lineHeight: 1 }}>{workout?.title}</h1>
        </div>
        <div style={{ padding: '88px 24px 48px', textAlign: 'center' }}>
          <p style={{ fontSize: 16, color: '#555550', lineHeight: 1.6, maxWidth: 420, margin: '0 auto 28px' }}>
            {msg}
          </p>
          {!completed ? (
            <button onClick={completeWorkout} style={{ padding: '14px 28px', background: 'var(--dark)', color: '#D4A853', border: 'none', borderRadius: 100, cursor: 'pointer', fontFamily: 'Bebas Neue', fontSize: 16, letterSpacing: '0.08em' }}>MARK AS DONE</button>
          ) : (
            <div style={{ color: 'var(--teal)', fontWeight: 600 }}>✓ Rest logged</div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 200 }}>

      {flash && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 90, pointerEvents: 'none',
          background: 'rgba(212,168,83,0.35)',
        }} />
      )}

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

      {isRun && (
        <div style={{ padding: '16px', paddingTop: 80 }}>
          <div style={{ background: 'var(--white)', borderRadius: 14, border: '1px solid var(--mid)', padding: '18px' }}>
            {exercises.flatMap((ex) => {
              const rounds = ex.sets > 1 ? ex.sets : 1
              return Array.from({ length: rounds }, (_, r) => (
                <div key={`${ex.id}-${r}`} style={{
                  display: 'flex', gap: 10, alignItems: 'baseline', marginBottom: 10,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#1B6B7B', flexShrink: 0 }} />
                  <div>
                    <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--dark)' }}>
                      {ex.exercises?.name}{rounds > 1 ? ` — round ${r + 1}/${rounds}` : ''}
                    </span>
                    {ex.reps && <span style={{ fontSize: 14, color: 'var(--text-muted)', marginLeft: 8 }}>{ex.reps}</span>}
                    {r === 0 && cleanNotes(ex.notes) && (
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>
                        {cleanNotes(ex.notes)}
                      </div>
                    )}
                  </div>
                </div>
              ))
            })}
          </div>
          <textarea
            placeholder="Notes for this run..."
            value={notes['run'] || ''}
            onChange={e => setNotes(prev => ({ ...prev, run: e.target.value }))}
            rows={2}
            style={{
              width: '100%', marginTop: 12, padding: '10px 12px', borderRadius: 10,
              border: '1px solid var(--mid)', fontSize: 13,
              fontFamily: 'DM Sans', resize: 'vertical', outline: 'none',
              background: '#FAFAF8', color: '#555550', boxSizing: 'border-box',
            }}
          />
        </div>
      )}

      {!isRun && (
      <div style={{ padding: '16px', paddingTop: 80 }}>
        {exercises.map((ex, idx) => {
          const isActive = activeExercise === ex.id
          const timedSeconds = ex.hold_seconds || parseSeconds(ex.reps)
          const isTimed = !!timedSeconds
          const noteText = cleanNotes(ex.notes)
          const hasHowTo = !!(noteText || ex.exercises?.description || ex.exercises?.video_url)
          const showHowTo = !!howToOpen[ex.id]
          const watchUrl = toWatchUrl(ex.exercises?.video_url)
          const totalSets = ex.sets + (extraSets[ex.id] || 0)

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
                    {ex.sets} {ex.sets === 1 ? 'set' : 'sets'}
                    {isTimed ? ` · ${timedSeconds}s` : ` · ${ex.reps} reps`}
                    {ex.rest_seconds ? ` · ${ex.rest_seconds}s rest` : ''}
                  </div>
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                  {isActive ? '▲' : '▼'}
                </span>
              </button>

              {isActive && (
                <div style={{ borderTop: '1px solid var(--mid)' }}>

                  {hasHowTo && (
                    <div style={{ padding: '12px 18px 0' }}>
                      <button
                        onClick={() => setHowToOpen(p => ({ ...p, [ex.id]: !p[ex.id] }))}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          background: 'transparent', border: 'none', cursor: 'pointer',
                          padding: 0, fontFamily: 'DM Sans',
                          fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                          textTransform: 'uppercase', color: '#1B6B7B',
                        }}
                      >
                        How to {showHowTo ? '⌃' : '⌄'}
                      </button>

                      {showHowTo && (
                        <div style={{ marginTop: 8 }}>
                          {noteText && (
                            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.55, margin: 0 }}>
                              {noteText}
                            </p>
                          )}
                          {ex.exercises?.description && (
                            <ul style={{ listStyle: 'none', padding: 0, margin: noteText ? '8px 0 0' : 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {ex.exercises.description.split(/\n|·|•/).map((line, i) => {
                                const clean = line.trim()
                                return clean ? (
                                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                                    <span style={{ marginTop: 6, width: 6, height: 6, borderRadius: '50%', background: '#1B6B7B', flexShrink: 0 }} />
                                    <span>{clean}</span>
                                  </li>
                                ) : null
                              })}
                            </ul>
                          )}
                          {watchUrl && (
                            <a href={watchUrl} target="_blank" rel="noopener noreferrer" style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10,
                              fontSize: 13, fontWeight: 600, color: '#1B6B7B', textDecoration: 'none',
                            }}>▶ Watch demo ↗</a>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ padding: '12px 18px 8px' }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '28px 1fr 80px 60px 36px',
                      gap: 8, marginBottom: 8,
                    }}>
                      {['Set', 'Previous', 'kg', isTimed ? 'time' : 'reps', ''].map((h, i) => (
                        <div key={i} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</div>
                      ))}
                    </div>

                    {Array.from({ length: totalSets }, (_, i) => {
                      const setNum = i + 1
                      const logKey = `${ex.id}-${setNum}`
                      const log = setLogs[logKey] || {}
                      const prevWeight = prevWeights[ex.id]?.[setNum]
                      const token = repsTokenFor(ex, setNum)
                      const target = targetRepsFor(ex, setNum)
                      const isDone = log.completed
                      const weightVal = log.weight ?? (prevWeight ?? '')
                      const repsVal = log.reps ?? (target ?? '')

                      return (
                        <div key={setNum} style={{
                          display: 'grid', gridTemplateColumns: '28px 1fr 80px 60px 36px',
                          gap: 8, marginBottom: 6, alignItems: 'center',
                          opacity: isDone ? 0.6 : 1,
                        }}>
                          <div style={{ fontFamily: 'Bebas Neue', fontSize: 16, color: 'var(--dark)' }}>{setNum}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {prevWeight ? `${prevWeight}kg` : '—'}
                            <span style={{ color: '#B0B0AA', marginLeft: 4 }}>
                              {isTimed ? `×${timedSeconds}s` : `×${token || '—'}`}
                            </span>
                          </div>
                          <input
                            type="number"
                            inputMode="decimal"
                            placeholder={prevWeight || '0'}
                            value={weightVal}
                            onChange={e => patchLog(ex.id, setNum, { weight: e.target.value })}
                            onBlur={() => persistSet(ex.id, setNum, ex)}
                            style={{
                              padding: '8px 8px', borderRadius: 8,
                              border: '1px solid var(--mid)', fontSize: 14,
                              background: isDone ? '#F8F8F6' : 'white',
                              width: '100%', fontFamily: 'DM Sans', outline: 'none',
                            }}
                          />
                          {isTimed ? (
                            <button
                              onClick={() => startHoldTimer(
                                timedSeconds,
                                () => toggleSet(ex, setNum),
                                `${ex.exercises?.name || 'Work'}`
                              )}
                              style={{
                                padding: '8px 4px', borderRadius: 8, cursor: 'pointer',
                                border: '1px solid var(--mid)', fontSize: 13,
                                background: 'white', width: '100%', fontFamily: 'DM Sans',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                              }}
                            >⏱ {timedSeconds}s</button>
                          ) : (
                            <input
                              type="number"
                              inputMode="numeric"
                              placeholder={target ?? ''}
                              value={repsVal}
                              onChange={e => patchLog(ex.id, setNum, { reps: e.target.value })}
                              onBlur={() => persistSet(ex.id, setNum, ex)}
                              style={{
                                padding: '8px 8px', borderRadius: 8,
                                border: '1px solid var(--mid)', fontSize: 14,
                                background: isDone ? '#F8F8F6' : 'white',
                                width: '100%', fontFamily: 'DM Sans', outline: 'none',
                              }}
                            />
                          )}
                          <button
                            onClick={() => toggleSet(ex, setNum)}
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

                    <button
                      onClick={() => setExtraSets(p => ({ ...p, [ex.id]: (p[ex.id] || 0) + 1 }))}
                      style={{
                        width: '100%', marginTop: 4, padding: '8px', borderRadius: 8,
                        background: 'transparent', border: '1px dashed var(--mid)',
                        color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer',
                        fontFamily: 'DM Sans',
                      }}
                    >+ Add set</button>
                  </div>

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
      )}

      {(restTimer || holdTimer) && (() => {
        const t = holdTimer || restTimer
        const isHold = !!holdTimer
        const danger = t.seconds <= 3
        return (
          <div style={{
            position: 'fixed', bottom: 140, left: 0, right: 0,
            maxWidth: 600, margin: '0 auto', padding: '0 16px', zIndex: 60,
          }}>
            <div style={{
              background: danger ? '#C4857A' : (isHold ? '#C4857A' : 'var(--teal)'),
              borderRadius: 12, padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: 12,
              boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
              transition: 'background 0.3s',
            }}>
              <div style={{ minWidth: 64 }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {isHold ? 'Work' : 'Rest'}
                </div>
                <div style={{ fontFamily: 'Bebas Neue', fontSize: 36, color: 'white', lineHeight: 1 }}>
                  {Math.floor(t.seconds / 60)}:{String(t.seconds % 60).padStart(2, '0')}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                {t.label && (
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.label}
                  </div>
                )}
                <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 4, height: 4 }}>
                  <div style={{
                    background: isHold ? 'white' : '#D4A853', height: '100%', borderRadius: 4,
                    width: `${(t.seconds / t.max) * 100}%`, transition: 'width 1s linear',
                  }} />
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  {[-10, +10].map(d => (
                    <button key={d} onClick={() => isHold ? adjustHoldTimer(d) : adjustRestTimer(d)} style={{
                      flex: 1, padding: '4px 0', borderRadius: 6,
                      background: 'rgba(255,255,255,0.15)', border: 'none',
                      color: 'white', fontSize: 11, cursor: 'pointer', fontFamily: 'DM Sans',
                    }}>{d > 0 ? '+' : ''}{d}s</button>
                  ))}
                </div>
              </div>
              <button onClick={() => {
                if (isHold) { clearInterval(holdTimerRef.current); setHoldTimer(null) }
                else { clearInterval(timerRef.current); setRestTimer(null) }
              }} style={{
                background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8,
                color: 'white', padding: '8px 12px', cursor: 'pointer', fontSize: 12,
                alignSelf: 'stretch',
              }}>Skip</button>
            </div>
          </div>
        )
      })()}

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