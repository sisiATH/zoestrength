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
  const [restTimer, setRestTimer] = useState(null)
  const [holdTimer, setHoldTimer] = useState(null)
  const holdTimerRef = useRef(null)
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

