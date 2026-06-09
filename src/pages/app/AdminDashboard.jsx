import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const ADMIN_EMAIL = 'sisikyriacou@gmail.com'

export default function AdminDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('Programs')
  const tabs = ['Programs', 'Build Workout', 'Extras']

  if (user?.email !== ADMIN_EMAIL) {
    return <div style={{ padding: 40, textAlign: 'center' }}><p style={{ color: 'red' }}>Access denied.</p></div>
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F2' }}>
      <div style={{ background: '#1B6B7B', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/app')} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', padding: '6px 14px', borderRadius: 100, cursor: 'pointer', fontSize: 12 }}>← App</button>
          <span style={{ fontFamily: 'Bebas Neue', fontSize: 20, color: 'white', letterSpacing: '0.08em' }}>ADMIN</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '8px 16px', borderRadius: 100, border: 'none', cursor: 'pointer',
              background: activeTab === tab ? '#D4A853' : 'rgba(255,255,255,0.15)',
              color: activeTab === tab ? '#0D0D0D' : 'white',
              fontFamily: 'DM Sans', fontWeight: 600, fontSize: 13,
            }}>{tab}</button>
          ))}
        </div>
      </div>
      <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
        {activeTab === 'Programs' && <ProgramsTab />}
        {activeTab === 'Build Workout' && <BuildWorkoutTab />}
        {activeTab === 'Extras' && <ExtrasTab />}
      </div>
    </div>
  )
}

// ─── PROGRAMS TAB ────────────────────────────────────────────
function ProgramsTab() {
  const [programs, setPrograms] = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', slug: '', tagline: '', description: '', duration_weeks: '', days_per_week: '', color: '#D4A853', text_color: '#0D0D0D', category: 'strength', is_published: false })
  const [saving, setSaving] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [msg, setMsg] = useState('')

  useEffect(() => { fetchPrograms() }, [])

  async function fetchPrograms() {
    const { data } = await supabase.from('programs').select('*').order('sort_order')
    if (data) setPrograms(data)
  }

  function startNew() {
    setEditing('new')
    setForm({ name: '', slug: '', tagline: '', description: '', duration_weeks: '', days_per_week: '', color: '#D4A853', text_color: '#0D0D0D', category: 'strength', is_published: false })
    setImageFile(null)
    setMsg('')
  }

  function startEdit(p) {
    setEditing(p.id)
    setForm({ ...p, duration_weeks: p.duration_weeks || '', days_per_week: p.days_per_week || '' })
    setImageFile(null)
    setMsg('')
  }

  async function save() {
    setSaving(true)
    setMsg('')
    let cover_image_url = form.cover_image_url || null
    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const path = 'programs/' + (form.slug || Date.now()) + '.' + ext
      const { error: uploadError } = await supabase.storage.from('zoestrength').upload(path, imageFile, { upsert: true })
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('zoestrength').getPublicUrl(path)
        cover_image_url = urlData.publicUrl
      }
    }
    const payload = { ...form, cover_image_url, duration_weeks: form.duration_weeks ? parseInt(form.duration_weeks) : null, days_per_week: form.days_per_week ? parseInt(form.days_per_week) : null, slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-') }
    if (editing === 'new') {
      const { error } = await supabase.from('programs').insert(payload)
      if (error) setMsg('Error: ' + error.message)
      else { setMsg('Program created!'); setEditing(null); fetchPrograms() }
    } else {
      const { error } = await supabase.from('programs').update(payload).eq('id', editing)
      if (error) setMsg('Error: ' + error.message)
      else { setMsg('Saved!'); setEditing(null); fetchPrograms() }
    }
    setSaving(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'Bebas Neue', fontSize: 28, color: '#0D0D0D' }}>PROGRAMS</h2>
        <button onClick={startNew} style={btn('#1B6B7B')}>+ New Program</button>
      </div>
      {editing && (
        <div style={card}>
          <h3 style={{ fontFamily: 'Bebas Neue', fontSize: 20, marginBottom: 20 }}>{editing === 'new' ? 'NEW PROGRAM' : 'EDIT PROGRAM'}</h3>
          <div style={grid}>
            <Field label="Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
            <Field label="Slug" value={form.slug} onChange={v => setForm(f => ({ ...f, slug: v }))} placeholder="e.g. strng" />
            <Field label="Tagline" value={form.tagline} onChange={v => setForm(f => ({ ...f, tagline: v }))} span={2} />
            <Field label="Description" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} span={2} multiline />
            <Field label="Duration (weeks)" value={form.duration_weeks} onChange={v => setForm(f => ({ ...f, duration_weeks: v }))} type="number" />
            <Field label="Days per week" value={form.days_per_week} onChange={v => setForm(f => ({ ...f, days_per_week: v }))} type="number" />
            <div>
              <label style={lbl}>Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inp}>
                <option value="strength">Strength</option>
                <option value="run">Run</option>
                <option value="hybrid">Hybrid</option>
                <option value="cycle">Cycle Synched</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
              <div><label style={lbl}>Card color</label><input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} style={{ width: 60, height: 40, borderRadius: 8, border: '1px solid #E0E0DC', cursor: 'pointer' }} /></div>
              <div><label style={lbl}>Text color</label><input type="color" value={form.text_color} onChange={e => setForm(f => ({ ...f, text_color: e.target.value }))} style={{ width: 60, height: 40, borderRadius: 8, border: '1px solid #E0E0DC', cursor: 'pointer' }} /></div>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={lbl}>Cover image</label>
              <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} style={{ fontSize: 13 }} />
              {form.cover_image_url && <img src={form.cover_image_url} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, marginTop: 8 }} />}
            </div>
            <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" checked={form.is_published} onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))} id="pub" />
              <label htmlFor="pub" style={{ fontSize: 14, fontWeight: 600 }}>Published</label>
            </div>
          </div>
          {msg && <p style={{ color: msg.includes('Error') ? 'red' : 'green', fontSize: 13, marginTop: 12 }}>{msg}</p>}
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button onClick={save} disabled={saving} style={btn('#1B6B7B')}>{saving ? 'Saving...' : 'Save Program'}</button>
            <button onClick={() => setEditing(null)} style={btn('#888882')}>Cancel</button>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {programs.map(p => (
          <div key={p.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: p.color, flexShrink: 0, backgroundImage: p.cover_image_url ? 'url(' + p.cover_image_url + ')' : 'none', backgroundSize: 'cover' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: '#888882' }}>{p.duration_weeks}w · {p.days_per_week}d/wk · {p.is_published ? '✓ Published' : 'Draft'}</div>
            </div>
            <button onClick={() => startEdit(p)} style={btn('#1B6B7B', true)}>Edit</button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── BUILD WORKOUT TAB ───────────────────────────────────────
function BuildWorkoutTab() {
  const [programs, setPrograms] = useState([])
  const [weeks, setWeeks] = useState([])
  const [workouts, setWorkouts] = useState([])
  const [exerciseLibrary, setExerciseLibrary] = useState([])
  const [selectedProgram, setSelectedProgram] = useState('')
  const [selectedWeek, setSelectedWeek] = useState('')
  const [selectedWorkout, setSelectedWorkout] = useState('')
  const [existingExercises, setExistingExercises] = useState([])
  
  // New workout form
  const [workoutForm, setWorkoutForm] = useState({ title: '', day_number: '', estimated_duration_mins: '', workout_type: 'strength' })
  const [workoutSaved, setWorkoutSaved] = useState(false)
  
  // Paste mode
  const [pasteText, setPasteText] = useState('')
  const [parsed, setParsed] = useState([])
  
  // Library picker
  const [showLibrary, setShowLibrary] = useState(false)
  const [librarySearch, setLibrarySearch] = useState('')
  const [selectedFromLibrary, setSelectedFromLibrary] = useState([])
  const [libraryForms, setLibraryForms] = useState({})

  // Edit exercise
  const [editingEx, setEditingEx] = useState(null)
  const [editForm, setEditForm] = useState({})

  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    supabase.from('programs').select('id, name').order('sort_order').then(({ data }) => data && setPrograms(data))
    supabase.from('exercises').select('*').order('name').then(({ data }) => data && setExerciseLibrary(data))
  }, [])

  useEffect(() => {
    if (!selectedProgram) { setWeeks([]); setSelectedWeek(''); setWorkouts([]); setSelectedWorkout(''); return }
    supabase.from('weeks').select('*').eq('program_id', selectedProgram).order('week_number').then(({ data }) => data && setWeeks(data))
  }, [selectedProgram])

  useEffect(() => {
    if (!selectedWeek) { setWorkouts([]); setSelectedWorkout(''); return }
    fetchWorkouts()
  }, [selectedWeek])

  useEffect(() => {
    if (!selectedWorkout) { setExistingExercises([]); return }
    fetchExistingExercises()
  }, [selectedWorkout])

  async function fetchWorkouts() {
    const { data } = await supabase.from('workouts').select('*').eq('week_id', selectedWeek).order('sort_order')
    if (data) setWorkouts(data)
  }

  async function fetchExistingExercises() {
    const { data } = await supabase.from('workout_exercises').select('*, exercises(name, description)').eq('workout_id', selectedWorkout).order('sort_order')
    if (data) setExistingExercises(data)
  }

  async function createWorkout() {
    if (!selectedWeek || !workoutForm.title) return
    setSaving(true)
    const { data, error } = await supabase.from('workouts').insert({
      ...workoutForm,
      week_id: selectedWeek,
      program_id: selectedProgram,
      estimated_duration_mins: workoutForm.estimated_duration_mins ? parseInt(workoutForm.estimated_duration_mins) : null,
      day_number: workoutForm.day_number ? parseInt(workoutForm.day_number) : 1,
      sort_order: workouts.length,
    }).select().single()
    if (error) setMsg('Error: ' + error.message)
    else { setSelectedWorkout(data.id); setWorkoutSaved(true); fetchWorkouts(); setMsg('') }
    setSaving(false)
  }

  function parseWorkout() {
    const blocks = pasteText.trim().split(/\n\s*\n/)
    let currentSection = ''
    const exercises = []
    blocks.forEach(block => {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean)
      const get = (key) => { const line = lines.find(l => l.toLowerCase().startsWith(key.toLowerCase())); return line ? line.split(':').slice(1).join(':').trim() : '' }
      if (lines.length === 1 && lines[0].toLowerCase().startsWith('section:')) { currentSection = lines[0].split(':').slice(1).join(':').trim(); return }
      if (get('Section')) currentSection = get('Section')
      const setsLine = get('Sets')
      const parts = setsLine.split('|').map(p => p.trim())
      const sets = parts[0]?.replace(/sets?/i, '').trim() || '3'
      const reps = parts[1]?.replace(/reps?/i, '').trim() || '10'
      const restRaw = parts[2]?.replace(/rest/i, '').trim() || '90s'
      const rest = parseInt(restRaw) || 90
      const name = get('Exercise') || get('Name')
      if (!name) return
      exercises.push({ name, sets: parseInt(sets) || 3, reps, rest_seconds: rest, description: get('Cues') || get('Description'), video_url: get('Video'), section: currentSection })
    })
    setParsed(exercises)
  }

  async function saveExercises(exercisesToSave) {
    if (!selectedWorkout || exercisesToSave.length === 0) return
    setSaving(true)
    setMsg('')
    const startOrder = existingExercises.length
    for (let i = 0; i < exercisesToSave.length; i++) {
      const ex = exercisesToSave[i]
      const slug = ex.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      const { data: exData, error: exErr } = await supabase.from('exercises').upsert({ name: ex.name, slug, description: ex.description || null, video_url: ex.video_url || null }, { onConflict: 'slug' }).select('id').single()
      if (exErr) { setMsg('Error: ' + exErr.message); setSaving(false); return }
      await supabase.from('workout_exercises').insert({ workout_id: selectedWorkout, exercise_id: exData.id, sets: ex.sets, reps: ex.reps, rest_seconds: ex.rest_seconds, section: ex.section || null, sort_order: startOrder + i })
    }
    setMsg('✓ ' + exercisesToSave.length + ' exercises added!')
    setParsed([])
    setPasteText('')
    setSelectedFromLibrary([])
    setLibraryForms({})
    setShowLibrary(false)
    fetchExistingExercises()
    supabase.from('exercises').select('*').order('name').then(({ data }) => data && setExerciseLibrary(data))
    setSaving(false)
  }

  async function deleteExercise(id) {
    if (!confirm('Remove this exercise?')) return
    await supabase.from('workout_exercises').delete().eq('id', id)
    fetchExistingExercises()
  }

  async function saveExerciseEdit() {
    await supabase.from('workout_exercises').update({ sets: parseInt(editForm.sets), reps: editForm.reps, rest_seconds: parseInt(editForm.rest_seconds), section: editForm.section }).eq('id', editingEx)
    setEditingEx(null)
    fetchExistingExercises()
  }

  const filteredLibrary = exerciseLibrary.filter(e => e.name.toLowerCase().includes(librarySearch.toLowerCase()))

  const TEMPLATE = `Section: Activation

Exercise: Hip Flexor Stretch + Activation
Sets: 2 | Reps: 1 min | Rest: 60s
Cues: Keep spine neutral, drive knee forward

Section: Strength

Exercise: DB Step Up with Knee Drive
Sets: 4 | Reps: 5-5-5-5 | Rest: 120s
Cues: Drive through front heel, keep torso upright`

  return (
    <div>
      <h2 style={{ fontFamily: 'Bebas Neue', fontSize: 28, color: '#0D0D0D', marginBottom: 24 }}>BUILD WORKOUT</h2>

      {/* Step 1: Select program + week */}
      <div style={card}>
        <h3 style={{ fontFamily: 'Bebas Neue', fontSize: 16, marginBottom: 16, color: '#888882', letterSpacing: '0.06em' }}>STEP 1 — SELECT PROGRAM & WEEK</h3>
        <div style={grid}>
          <div>
            <label style={lbl}>Program</label>
            <select value={selectedProgram} onChange={e => { setSelectedProgram(e.target.value); setSelectedWeek(''); setSelectedWorkout(''); setWorkoutSaved(false) }} style={inp}>
              <option value="">Select program...</option>
              {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Week</label>
            <select value={selectedWeek} onChange={e => { setSelectedWeek(e.target.value); setSelectedWorkout(''); setWorkoutSaved(false) }} style={inp} disabled={!selectedProgram}>
              <option value="">Select week...</option>
              {weeks.map(w => <option key={w.id} value={w.id}>{w.title || 'Week ' + w.week_number}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Step 2: Create or select workout */}
      {selectedWeek && (
        <div style={{ ...card, marginTop: 16 }}>
          <h3 style={{ fontFamily: 'Bebas Neue', fontSize: 16, marginBottom: 16, color: '#888882', letterSpacing: '0.06em' }}>STEP 2 — WORKOUT SESSION</h3>
          
          {/* Existing workouts */}
          {workouts.length > 0 && !workoutSaved && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: '#888882', marginBottom: 8 }}>Select existing:</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {workouts.map(w => (
                  <button key={w.id} onClick={() => { setSelectedWorkout(w.id); setWorkoutSaved(true) }} style={{
                    padding: '8px 16px', borderRadius: 100, border: '1px solid #E0E0DC',
                    background: selectedWorkout === w.id ? '#1B6B7B' : 'white',
                    color: selectedWorkout === w.id ? 'white' : '#0D0D0D',
                    fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans',
                  }}>Day {w.day_number} — {w.title}</button>
                ))}
              </div>
              <p style={{ fontSize: 12, color: '#888882', margin: '12px 0 8px' }}>Or create new:</p>
            </div>
          )}

          {!workoutSaved && (
            <div style={grid}>
              <Field label="Workout title" value={workoutForm.title} onChange={v => setWorkoutForm(f => ({ ...f, title: v }))} placeholder="e.g. Lower Glute + Power" span={2} />
              <Field label="Day number" value={workoutForm.day_number} onChange={v => setWorkoutForm(f => ({ ...f, day_number: v }))} type="number" placeholder="1" />
              <Field label="Duration (mins)" value={workoutForm.estimated_duration_mins} onChange={v => setWorkoutForm(f => ({ ...f, estimated_duration_mins: v }))} type="number" placeholder="45" />
              <div>
                <label style={lbl}>Type</label>
                <select value={workoutForm.workout_type} onChange={e => setWorkoutForm(f => ({ ...f, workout_type: e.target.value }))} style={inp}>
                  <option value="strength">Strength</option>
                  <option value="run">Run</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="mobility">Mobility</option>
                  <option value="sit">SIT</option>
                  <option value="liss">LISS</option>
                </select>
              </div>
            </div>
          )}

          {!workoutSaved ? (
            <button onClick={createWorkout} disabled={saving || !workoutForm.title} style={{ ...btn('#1B6B7B'), marginTop: 16 }}>
              {saving ? 'Creating...' : 'Create Workout & Add Exercises →'}
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: 14, fontWeight: 700 }}>
                  {workouts.find(w => w.id === selectedWorkout)?.title || 'Workout selected'}
                </span>
                <span style={{ fontSize: 12, color: '#888882', marginLeft: 8 }}>
                  {existingExercises.length} exercises
                </span>
              </div>
              <button onClick={() => { setSelectedWorkout(''); setWorkoutSaved(false) }} style={{ fontSize: 12, color: '#888882', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Change</button>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Add exercises */}
      {selectedWorkout && workoutSaved && (
        <div style={{ ...card, marginTop: 16 }}>
          <h3 style={{ fontFamily: 'Bebas Neue', fontSize: 16, marginBottom: 16, color: '#888882', letterSpacing: '0.06em' }}>STEP 3 — ADD EXERCISES</h3>

          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <button onClick={() => setShowLibrary(false)} style={{
              padding: '10px 20px', borderRadius: 100, border: 'none', cursor: 'pointer',
              background: !showLibrary ? '#0D0D0D' : '#E8E8E4',
              color: !showLibrary ? '#D4A853' : '#555550',
              fontFamily: 'DM Sans', fontWeight: 600, fontSize: 13,
            }}>Paste new exercises</button>
            <button onClick={() => setShowLibrary(true)} style={{
              padding: '10px 20px', borderRadius: 100, border: 'none', cursor: 'pointer',
              background: showLibrary ? '#0D0D0D' : '#E8E8E4',
              color: showLibrary ? '#D4A853' : '#555550',
              fontFamily: 'DM Sans', fontWeight: 600, fontSize: 13,
            }}>Pick from library ({exerciseLibrary.length})</button>
          </div>

          {!showLibrary ? (
            <>
              <p style={{ fontSize: 13, color: '#888882', marginBottom: 8 }}>Format — blank line between exercises:</p>
              <pre style={{ background: '#F0F0EC', padding: 14, borderRadius: 10, fontSize: 11, fontFamily: 'monospace', marginBottom: 14, whiteSpace: 'pre-wrap', color: '#555550' }}>{TEMPLATE}</pre>
              <textarea value={pasteText} onChange={e => setPasteText(e.target.value)} placeholder="Paste your workout here..." style={{ width: '100%', height: 200, padding: 14, border: '1px solid #E0E0DC', borderRadius: 12, fontSize: 13, fontFamily: 'monospace', resize: 'vertical', boxSizing: 'border-box', outline: 'none' }} />
              <button onClick={parseWorkout} disabled={!pasteText} style={{ ...btn('#C4857A'), marginTop: 10 }}>Parse Workout</button>

              {parsed.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <h4 style={{ fontFamily: 'Bebas Neue', fontSize: 16, marginBottom: 10 }}>PREVIEW — {parsed.length} exercises</h4>
                  {parsed.map((ex, i) => (
                    <div key={i} style={{ background: '#F8F8F6', borderRadius: 10, padding: 12, marginBottom: 8, border: '1px solid #E8E8E4' }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{ex.name}
                        {ex.section && <span style={{ fontSize: 10, background: '#E8F4F6', color: '#1B6B7B', padding: '2px 8px', borderRadius: 4, marginLeft: 8, fontWeight: 700, textTransform: 'uppercase' }}>{ex.section}</span>}
                      </div>
                      <div style={{ fontSize: 12, color: '#888882', marginTop: 3 }}>{ex.sets} sets · {ex.reps} reps · {ex.rest_seconds}s rest</div>
                      {ex.description && <div style={{ fontSize: 12, color: '#555550', marginTop: 4 }}>{ex.description}</div>}
                    </div>
                  ))}
                  {msg && <p style={{ color: msg.includes('Error') ? 'red' : 'green', fontSize: 13, marginTop: 8 }}>{msg}</p>}
                  <button onClick={() => saveExercises(parsed)} disabled={saving} style={{ ...btn('#1B6B7B'), marginTop: 10 }}>
                    {saving ? 'Saving...' : '✓ Add ' + parsed.length + ' exercises'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <input value={librarySearch} onChange={e => setLibrarySearch(e.target.value)} placeholder="Search exercises..." style={{ ...inp, marginBottom: 14 }} />
              <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 14 }}>
                {filteredLibrary.map(ex => {
                  const selected = selectedFromLibrary.includes(ex.id)
                  return (
                    <div key={ex.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderBottom: '1px solid #F0F0EC', background: selected ? '#F0F8F8' : 'white' }}>
                      <input type="checkbox" checked={selected} onChange={e => {
                        if (e.target.checked) {
                          setSelectedFromLibrary(s => [...s, ex.id])
                          setLibraryForms(f => ({ ...f, [ex.id]: { sets: 3, reps: '10', rest_seconds: 90, section: '' } }))
                        } else {
                          setSelectedFromLibrary(s => s.filter(id => id !== ex.id))
                        }
                      }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{ex.name}</div>
                        {ex.description && <div style={{ fontSize: 11, color: '#888882', marginTop: 2 }}>{ex.description.substring(0, 60)}...</div>}
                      </div>
                      {selected && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <input type="number" placeholder="Sets" value={libraryForms[ex.id]?.sets || ''} onChange={e => setLibraryForms(f => ({ ...f, [ex.id]: { ...f[ex.id], sets: e.target.value } }))} style={{ ...inp, width: 56, padding: '4px 8px', fontSize: 12 }} />
                          <input placeholder="Reps" value={libraryForms[ex.id]?.reps || ''} onChange={e => setLibraryForms(f => ({ ...f, [ex.id]: { ...f[ex.id], reps: e.target.value } }))} style={{ ...inp, width: 70, padding: '4px 8px', fontSize: 12 }} />
                          <input type="number" placeholder="Rest" value={libraryForms[ex.id]?.rest_seconds || ''} onChange={e => setLibraryForms(f => ({ ...f, [ex.id]: { ...f[ex.id], rest_seconds: e.target.value } }))} style={{ ...inp, width: 56, padding: '4px 8px', fontSize: 12 }} />
                          <select value={libraryForms[ex.id]?.section || ''} onChange={e => setLibraryForms(f => ({ ...f, [ex.id]: { ...f[ex.id], section: e.target.value } }))} style={{ ...inp, padding: '4px 8px', fontSize: 12 }}>
                            <option value="">Section</option>
                            <option value="Activation">Activation</option>
                            <option value="Plyometrics">Plyometrics</option>
                            <option value="Strength">Strength</option>
                            <option value="Core">Core</option>
                            <option value="Cardio">Cardio</option>
                            <option value="Mobility">Mobility</option>
                          </select>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              {selectedFromLibrary.length > 0 && (
                <>
                  {msg && <p style={{ color: msg.includes('Error') ? 'red' : 'green', fontSize: 13, marginBottom: 8 }}>{msg}</p>}
                  <button onClick={() => {
                    const toSave = selectedFromLibrary.map(id => {
                      const ex = exerciseLibrary.find(e => e.id === id)
                      const f = libraryForms[id] || {}
                      return { name: ex.name, sets: parseInt(f.sets) || 3, reps: f.reps || '10', rest_seconds: parseInt(f.rest_seconds) || 90, section: f.section || '', description: ex.description, video_url: ex.video_url }
                    })
                    saveExercises(toSave)
                  }} disabled={saving} style={btn('#1B6B7B')}>
                    {saving ? 'Saving...' : '✓ Add ' + selectedFromLibrary.length + ' from library'}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* Current exercises */}
      {existingExercises.length > 0 && (
        <div style={{ ...card, marginTop: 16 }}>
          <h3 style={{ fontFamily: 'Bebas Neue', fontSize: 16, marginBottom: 14, letterSpacing: '0.06em' }}>CURRENT EXERCISES ({existingExercises.length})</h3>
          {existingExercises.map((ex, i) => (
            <div key={ex.id} style={{ background: '#F8F8F6', borderRadius: 10, padding: '12px 14px', marginBottom: 8, border: '1px solid #E8E8E4' }}>
              {editingEx === ex.id ? (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                    <div><label style={lbl}>Sets</label><input value={editForm.sets} onChange={e => setEditForm(f => ({ ...f, sets: e.target.value }))} style={{ ...inp, padding: '6px 10px' }} type="number" /></div>
                    <div><label style={lbl}>Reps</label><input value={editForm.reps} onChange={e => setEditForm(f => ({ ...f, reps: e.target.value }))} style={{ ...inp, padding: '6px 10px' }} /></div>
                    <div><label style={lbl}>Rest (s)</label><input value={editForm.rest_seconds} onChange={e => setEditForm(f => ({ ...f, rest_seconds: e.target.value }))} style={{ ...inp, padding: '6px 10px' }} type="number" /></div>
                    <div>
                      <label style={lbl}>Section</label>
                      <select value={editForm.section || ''} onChange={e => setEditForm(f => ({ ...f, section: e.target.value }))} style={{ ...inp, padding: '6px 10px' }}>
                        <option value="">None</option>
                        <option value="Activation">Activation</option>
                        <option value="Plyometrics">Plyometrics</option>
                        <option value="Strength">Strength</option>
                        <option value="Core">Core</option>
                        <option value="Cardio">Cardio</option>
                        <option value="Mobility">Mobility</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={saveExerciseEdit} style={btn('#1B6B7B', true)}>Save</button>
                    <button onClick={() => setEditingEx(null)} style={btn('#888882', true)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{i + 1}. {ex.exercises?.name}</span>
                    {ex.section && <span style={{ fontSize: 10, background: '#E8F4F6', color: '#1B6B7B', padding: '2px 8px', borderRadius: 4, marginLeft: 8, fontWeight: 700, textTransform: 'uppercase' }}>{ex.section}</span>}
                    <div style={{ fontSize: 12, color: '#888882', marginTop: 3 }}>{ex.sets} sets · {ex.reps} reps · {ex.rest_seconds}s rest</div>
                    {ex.exercises?.description && <div style={{ fontSize: 11, color: '#555550', marginTop: 3 }}>{ex.exercises.description}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button onClick={() => { setEditingEx(ex.id); setEditForm({ sets: ex.sets, reps: ex.reps, rest_seconds: ex.rest_seconds, section: ex.section }) }} style={btn('#1B6B7B', true)}>Edit</button>
                    <button onClick={() => deleteExercise(ex.id)} style={btn('#C4857A', true)}>✕</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── EXTRAS TAB ──────────────────────────────────────────────
function ExtrasTab() {
  const [programs, setPrograms] = useState([])
  const [resources, setResources] = useState([])
  const [form, setForm] = useState({ name: '', description: '', program_id: '', resource_type: 'pdf' })
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    supabase.from('programs').select('id, name').then(({ data }) => data && setPrograms(data))
    fetchResources()
  }, [])

  async function fetchResources() {
    const { data } = await supabase.from('program_resources').select('*, programs(name)').order('sort_order')
    if (data) setResources(data)
  }

  async function upload() {
    if (!file || !form.name) return
    setSaving(true)
    setMsg('')
    const path = 'extras/' + Date.now() + '-' + file.name
    const { error: uploadError } = await supabase.storage.from('zoestrength').upload(path, file)
    if (uploadError) { setMsg('Upload error: ' + uploadError.message); setSaving(false); return }
    const { data: urlData } = supabase.storage.from('zoestrength').getPublicUrl(path)
    const { error } = await supabase.from('program_resources').insert({ ...form, file_url: urlData.publicUrl, program_id: form.program_id || null, sort_order: resources.length })
    if (error) setMsg('Error: ' + error.message)
    else { setMsg('Uploaded!'); setForm({ name: '', description: '', program_id: '', resource_type: 'pdf' }); setFile(null); fetchResources() }
    setSaving(false)
  }

  async function deleteResource(id) {
    if (!confirm('Delete?')) return
    await supabase.from('program_resources').delete().eq('id', id)
    fetchResources()
  }

  return (
    <div>
      <h2 style={{ fontFamily: 'Bebas Neue', fontSize: 28, color: '#0D0D0D', marginBottom: 24 }}>EXTRAS & PDFS</h2>
      <div style={card}>
        <h3 style={{ fontFamily: 'Bebas Neue', fontSize: 18, marginBottom: 16 }}>UPLOAD FILE</h3>
        <div style={grid}>
          <Field label="Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="e.g. Active Woman's Peri Guide" span={2} />
          <Field label="Description" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} span={2} />
          <div>
            <label style={lbl}>Type</label>
            <select value={form.resource_type} onChange={e => setForm(f => ({ ...f, resource_type: e.target.value }))} style={inp}>
              <option value="pdf">PDF</option>
              <option value="guide">Guide</option>
              <option value="video">Video</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label style={lbl}>Program (optional)</label>
            <select value={form.program_id} onChange={e => setForm(f => ({ ...f, program_id: e.target.value }))} style={inp}>
              <option value="">All programs</option>
              {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={lbl}>File</label>
            <input type="file" onChange={e => setFile(e.target.files[0])} style={{ fontSize: 13 }} />
          </div>
        </div>
        {msg && <p style={{ color: msg.includes('Error') ? 'red' : 'green', fontSize: 13, marginTop: 12 }}>{msg}</p>}
        <button onClick={upload} disabled={saving || !file || !form.name} style={{ ...btn('#1B6B7B'), marginTop: 16 }}>{saving ? 'Uploading...' : 'Upload'}</button>
      </div>
      <div style={{ marginTop: 24 }}>
        {resources.map(r => (
          <div key={r.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10 }}>
            <div style={{ fontSize: 24 }}>{r.resource_type === 'pdf' ? '📄' : '📎'}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</div>
              <div style={{ fontSize: 12, color: '#888882' }}>{r.programs?.name || 'All programs'}</div>
            </div>
            <a href={r.file_url} target="_blank" style={{ fontSize: 12, color: '#1B6B7B' }}>View</a>
            <button onClick={() => deleteResource(r.id)} style={btn('#C4857A', true)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── SHARED ──────────────────────────────────────────────────
function Field({ label, value, onChange, type = 'text', span, multiline, placeholder }) {
  return (
    <div style={{ gridColumn: span ? 'span ' + span : undefined }}>
      <label style={lbl}>{label}</label>
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ ...inp, height: 80, resize: 'vertical' }} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inp} />}
    </div>
  )
}

const lbl = { display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#888882', marginBottom: 6 }
const inp = { width: '100%', padding: '10px 14px', border: '1px solid #E0E0DC', borderRadius: 10, fontSize: 14, fontFamily: 'DM Sans', outline: 'none', boxSizing: 'border-box', background: '#FFFFFF' }
const card = { background: '#FFFFFF', borderRadius: 16, padding: 24, border: '1px solid #E8E8E4', marginBottom: 16 }
const grid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }
const btn = (color, small) => ({ background: color, color: 'white', border: 'none', cursor: 'pointer', padding: small ? '8px 16px' : '12px 24px', borderRadius: 100, fontFamily: 'Bebas Neue', fontSize: small ? 13 : 15, letterSpacing: '0.06em' })
