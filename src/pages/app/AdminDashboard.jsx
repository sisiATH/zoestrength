import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const ADMIN_EMAIL = 'sisikyriacou@gmail.com'

const tabs = ['Programs', 'Workouts', 'Exercises', 'Extras']

export default function AdminDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('Programs')

  if (user?.email !== ADMIN_EMAIL) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ color: 'red' }}>Access denied.</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F2' }}>
      {/* Admin nav */}
      <div style={{
        background: '#1B6B7B', padding: '16px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/app')} style={{
            background: 'rgba(255,255,255,0.15)', border: 'none',
            color: 'white', padding: '6px 14px', borderRadius: 100,
            cursor: 'pointer', fontSize: 12,
          }}>← App</button>
          <span style={{ fontFamily: 'Bebas Neue', fontSize: 20, color: 'white', letterSpacing: '0.08em' }}>
            ADMIN
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '8px 16px', borderRadius: 100, border: 'none', cursor: 'pointer',
              background: activeTab === tab ? '#C8F500' : 'rgba(255,255,255,0.15)',
              color: activeTab === tab ? '#0D0D0D' : 'white',
              fontFamily: 'DM Sans', fontWeight: 600, fontSize: 13,
            }}>{tab}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
        {activeTab === 'Programs' && <ProgramsTab />}
        {activeTab === 'Workouts' && <WorkoutsTab />}
        {activeTab === 'Exercises' && <ExercisesTab />}
        {activeTab === 'Extras' && <ExtrasTab />}
      </div>
    </div>
  )
}

// ─── PROGRAMS TAB ───────────────────────────────────────────
function ProgramsTab() {
  const [programs, setPrograms] = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({
    name: '', slug: '', tagline: '', description: '',
    duration_weeks: '', days_per_week: '', color: '#C8F500',
    text_color: '#0D0D0D', category: 'strength', is_published: false,
  })
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
    setForm({ name: '', slug: '', tagline: '', description: '', duration_weeks: '', days_per_week: '', color: '#C8F500', text_color: '#0D0D0D', category: 'strength', is_published: false })
    setImageFile(null)
  }

  function startEdit(p) {
    setEditing(p.id)
    setForm({ ...p, duration_weeks: p.duration_weeks || '', days_per_week: p.days_per_week || '' })
    setImageFile(null)
  }

  async function save() {
    setSaving(true)
    setMsg('')
    let cover_image_url = form.cover_image_url || null

    // Upload image if selected
    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const path = `programs/${form.slug || Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('zoestrength').upload(path, imageFile, { upsert: true })
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('zoestrength').getPublicUrl(path)
        cover_image_url = urlData.publicUrl
      }
    }

    const payload = {
      ...form,
      cover_image_url,
      duration_weeks: form.duration_weeks ? parseInt(form.duration_weeks) : null,
      days_per_week: form.days_per_week ? parseInt(form.days_per_week) : null,
      slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-'),
    }

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
        <button onClick={startNew} style={btnStyle('#1B6B7B')}>+ New Program</button>
      </div>

      {editing && (
        <div style={cardStyle}>
          <h3 style={{ fontFamily: 'Bebas Neue', fontSize: 20, marginBottom: 20 }}>
            {editing === 'new' ? 'NEW PROGRAM' : 'EDIT PROGRAM'}
          </h3>
          <div style={gridStyle}>
            <Field label="Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
            <Field label="Slug (URL key)" value={form.slug} onChange={v => setForm(f => ({ ...f, slug: v }))} placeholder="e.g. strng" />
            <Field label="Tagline" value={form.tagline} onChange={v => setForm(f => ({ ...f, tagline: v }))} span={2} />
            <Field label="Description" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} span={2} multiline />
            <Field label="Duration (weeks)" value={form.duration_weeks} onChange={v => setForm(f => ({ ...f, duration_weeks: v }))} type="number" />
            <Field label="Days per week" value={form.days_per_week} onChange={v => setForm(f => ({ ...f, days_per_week: v }))} type="number" />
            <div>
              <label style={labelStyle}>Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inputStyle}>
                <option value="strength">Strength</option>
                <option value="run">Run</option>
                <option value="hybrid">Hybrid</option>
                <option value="cycle">Cycle Synched</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
              <div>
                <label style={labelStyle}>Card color</label>
                <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} style={{ width: 60, height: 40, borderRadius: 8, border: '1px solid #E0E0DC', cursor: 'pointer' }} />
              </div>
              <div>
                <label style={labelStyle}>Text color</label>
                <input type="color" value={form.text_color} onChange={e => setForm(f => ({ ...f, text_color: e.target.value }))} style={{ width: 60, height: 40, borderRadius: 8, border: '1px solid #E0E0DC', cursor: 'pointer' }} />
              </div>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Cover image</label>
              <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])}
                style={{ fontSize: 13, fontFamily: 'DM Sans' }} />
              {form.cover_image_url && <img src={form.cover_image_url} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, marginTop: 8 }} />}
            </div>
            <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" checked={form.is_published} onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))} id="published" />
              <label htmlFor="published" style={{ fontSize: 14, fontWeight: 600 }}>Published (visible to subscribers)</label>
            </div>
          </div>
          {msg && <p style={{ color: msg.includes('Error') ? 'red' : 'green', fontSize: 13, marginTop: 12 }}>{msg}</p>}
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button onClick={save} disabled={saving} style={btnStyle('#1B6B7B')}>{saving ? 'Saving...' : 'Save Program'}</button>
            <button onClick={() => setEditing(null)} style={btnStyle('#888882')}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {programs.map(p => (
          <div key={p.id} style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: p.color, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: '#888882' }}>{p.duration_weeks}w · {p.days_per_week}d/wk · {p.is_published ? '✓ Published' : 'Draft'}</div>
            </div>
            <button onClick={() => startEdit(p)} style={btnStyle('#1B6B7B', true)}>Edit</button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── WORKOUTS TAB ───────────────────────────────────────────
function WorkoutsTab() {
  const [programs, setPrograms] = useState([])
  const [selectedProgram, setSelectedProgram] = useState('')
  const [weeks, setWeeks] = useState([])
  const [selectedWeek, setSelectedWeek] = useState('')
  const [workouts, setWorkouts] = useState([])
  const [form, setForm] = useState({ title: '', description: '', estimated_duration_mins: '', workout_type: 'strength', day_number: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    supabase.from('programs').select('id, name').order('sort_order').then(({ data }) => data && setPrograms(data))
  }, [])

  useEffect(() => {
    if (!selectedProgram) return
    supabase.from('weeks').select('*').eq('program_id', selectedProgram).order('week_number')
      .then(({ data }) => data && setWeeks(data))
  }, [selectedProgram])

  useEffect(() => {
    if (!selectedWeek) return
    supabase.from('workouts').select('*').eq('week_id', selectedWeek).order('sort_order')
      .then(({ data }) => data && setWorkouts(data))
  }, [selectedWeek])

  async function addWorkout() {
    if (!selectedWeek || !form.title) return
    setSaving(true)
    const { error } = await supabase.from('workouts').insert({
      ...form,
      week_id: selectedWeek,
      program_id: selectedProgram,
      estimated_duration_mins: form.estimated_duration_mins ? parseInt(form.estimated_duration_mins) : null,
      day_number: form.day_number ? parseInt(form.day_number) : 1,
      sort_order: workouts.length,
    })
    if (error) setMsg('Error: ' + error.message)
    else {
      setMsg('Workout added!')
      setForm({ title: '', description: '', estimated_duration_mins: '', workout_type: 'strength', day_number: '' })
      const { data } = await supabase.from('workouts').select('*').eq('week_id', selectedWeek).order('sort_order')
      if (data) setWorkouts(data)
    }
    setSaving(false)
  }

  async function deleteWorkout(id) {
    if (!confirm('Delete this workout?')) return
    await supabase.from('workouts').delete().eq('id', id)
    setWorkouts(w => w.filter(x => x.id !== id))
  }

  return (
    <div>
      <h2 style={{ fontFamily: 'Bebas Neue', fontSize: 28, color: '#0D0D0D', marginBottom: 24 }}>WORKOUTS</h2>

      <div style={cardStyle}>
        <div style={gridStyle}>
          <div>
            <label style={labelStyle}>Program</label>
            <select value={selectedProgram} onChange={e => { setSelectedProgram(e.target.value); setSelectedWeek(''); setWorkouts([]) }} style={inputStyle}>
              <option value="">Select program...</option>
              {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Week</label>
            <select value={selectedWeek} onChange={e => setSelectedWeek(e.target.value)} style={inputStyle} disabled={!selectedProgram}>
              <option value="">Select week...</option>
              {weeks.map(w => <option key={w.id} value={w.id}>{w.title || `Week ${w.week_number}`}</option>)}
            </select>
          </div>
        </div>
      </div>

      {selectedWeek && (
        <div style={{ ...cardStyle, marginTop: 16 }}>
          <h3 style={{ fontFamily: 'Bebas Neue', fontSize: 18, marginBottom: 16 }}>ADD WORKOUT</h3>
          <div style={gridStyle}>
            <Field label="Workout title" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="e.g. Lower Glute + Power" span={2} />
            <Field label="Day number" value={form.day_number} onChange={v => setForm(f => ({ ...f, day_number: v }))} type="number" placeholder="1" />
            <Field label="Duration (mins)" value={form.estimated_duration_mins} onChange={v => setForm(f => ({ ...f, estimated_duration_mins: v }))} type="number" placeholder="45" />
            <div>
              <label style={labelStyle}>Type</label>
              <select value={form.workout_type} onChange={e => setForm(f => ({ ...f, workout_type: e.target.value }))} style={inputStyle}>
                <option value="strength">Strength</option>
                <option value="run">Run</option>
                <option value="hybrid">Hybrid</option>
                <option value="mobility">Mobility</option>
                <option value="sit">SIT</option>
              </select>
            </div>
            <Field label="Description (optional)" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} />
          </div>
          {msg && <p style={{ color: msg.includes('Error') ? 'red' : 'green', fontSize: 13, marginTop: 12 }}>{msg}</p>}
          <button onClick={addWorkout} disabled={saving || !form.title} style={{ ...btnStyle('#1B6B7B'), marginTop: 16 }}>
            {saving ? 'Adding...' : '+ Add Workout'}
          </button>
        </div>
      )}

      {workouts.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h3 style={{ fontFamily: 'Bebas Neue', fontSize: 18, marginBottom: 12 }}>WORKOUTS IN THIS WEEK</h3>
          {workouts.map(w => (
            <div key={w.id} style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Day {w.day_number} — {w.title}</div>
                <div style={{ fontSize: 12, color: '#888882' }}>{w.estimated_duration_mins}min · {w.workout_type}</div>
              </div>
              <button onClick={() => deleteWorkout(w.id)} style={btnStyle('#FF3CAC', true)}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── EXERCISES TAB ───────────────────────────────────────────
function ExercisesTab() {
  const [programs, setPrograms] = useState([])
  const [selectedProgram, setSelectedProgram] = useState('')
  const [weeks, setWeeks] = useState([])
  const [selectedWeek, setSelectedWeek] = useState('')
  const [workouts, setWorkouts] = useState([])
  const [selectedWorkout, setSelectedWorkout] = useState('')
  const [pasteText, setPasteText] = useState('')
  const [parsed, setParsed] = useState([])
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    supabase.from('programs').select('id, name').order('sort_order').then(({ data }) => data && setPrograms(data))
  }, [])

  useEffect(() => {
    if (!selectedProgram) return
    supabase.from('weeks').select('*').eq('program_id', selectedProgram).order('week_number')
      .then(({ data }) => data && setWeeks(data))
  }, [selectedProgram])

  useEffect(() => {
    if (!selectedWeek) return
    supabase.from('workouts').select('*').eq('week_id', selectedWeek).order('sort_order')
      .then(({ data }) => data && setWorkouts(data))
  }, [selectedWeek])

  function parseWorkout() {
    // Parse format:
    // Exercise: Hip Flexor Stretch
    // Sets: 2 | Reps: 1 min | Rest: 60s
    // Cues: Keep spine neutral
    // Video: https://...
    const blocks = pasteText.trim().split(/\n\s*\n/)
    const exercises = blocks.map(block => {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean)
      const get = (key) => {
        const line = lines.find(l => l.toLowerCase().startsWith(key.toLowerCase()))
        return line ? line.split(':').slice(1).join(':').trim() : ''
      }
      const setsLine = get('Sets')
      const parts = setsLine.split('|').map(p => p.trim())
      const sets = parts[0]?.replace(/sets?/i, '').trim() || '3'
      const reps = parts[1]?.replace(/reps?/i, '').trim() || '10'
      const restRaw = parts[2]?.replace(/rest/i, '').trim() || '90s'
      const rest = parseInt(restRaw) || 90

      return {
        name: get('Exercise') || get('Name'),
        sets: parseInt(sets) || 3,
        reps,
        rest_seconds: rest,
        description: get('Cues') || get('Description'),
        video_url: get('Video'),
      }
    }).filter(e => e.name)
    setParsed(exercises)
  }

  async function saveExercises() {
    if (!selectedWorkout || parsed.length === 0) return
    setSaving(true)
    setMsg('')

    for (let i = 0; i < parsed.length; i++) {
      const ex = parsed[i]
      const slug = ex.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

      // Upsert exercise into library
      const { data: exData, error: exErr } = await supabase
        .from('exercises')
        .upsert({ name: ex.name, slug, description: ex.description, video_url: ex.video_url || null }, { onConflict: 'slug' })
        .select('id').single()

      if (exErr) { setMsg('Error saving exercise: ' + exErr.message); setSaving(false); return }

      // Add to workout
      await supabase.from('workout_exercises').insert({
        workout_id: selectedWorkout,
        exercise_id: exData.id,
        sets: ex.sets,
        reps: ex.reps,
        rest_seconds: ex.rest_seconds,
        sort_order: i,
      })
    }

    setMsg(`✓ ${parsed.length} exercises added to workout!`)
    setParsed([])
    setPasteText('')
    setSaving(false)
  }

  const TEMPLATE = `Exercise: Hip Flexor Stretch + Activation
Sets: 2 | Reps: 1 min | Rest: 60s
Cues: Keep spine neutral, drive knee forward
Video: https://youtube.com/embed/...

Exercise: Lateral Band Walk
Sets: 2 | Reps: 15 | Rest: 60s
Cues: Keep tension in band throughout
Video: https://youtube.com/embed/...`

  return (
    <div>
      <h2 style={{ fontFamily: 'Bebas Neue', fontSize: 28, color: '#0D0D0D', marginBottom: 24 }}>EXERCISES</h2>

      <div style={cardStyle}>
        <div style={gridStyle}>
          <div>
            <label style={labelStyle}>Program</label>
            <select value={selectedProgram} onChange={e => { setSelectedProgram(e.target.value); setSelectedWeek(''); setSelectedWorkout('') }} style={inputStyle}>
              <option value="">Select program...</option>
              {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Week</label>
            <select value={selectedWeek} onChange={e => { setSelectedWeek(e.target.value); setSelectedWorkout('') }} style={inputStyle} disabled={!selectedProgram}>
              <option value="">Select week...</option>
              {weeks.map(w => <option key={w.id} value={w.id}>{w.title || `Week ${w.week_number}`}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Workout</label>
            <select value={selectedWorkout} onChange={e => setSelectedWorkout(e.target.value)} style={inputStyle} disabled={!selectedWeek}>
              <option value="">Select workout...</option>
              {workouts.map(w => <option key={w.id} value={w.id}>Day {w.day_number} — {w.title}</option>)}
            </select>
          </div>
        </div>
      </div>

      {selectedWorkout && (
        <div style={{ ...cardStyle, marginTop: 16 }}>
          <h3 style={{ fontFamily: 'Bebas Neue', fontSize: 18, marginBottom: 8 }}>PASTE WORKOUT</h3>
          <p style={{ fontSize: 13, color: '#888882', marginBottom: 12 }}>
            Use this format — one blank line between exercises:
          </p>
          <pre style={{
            background: '#F0F0EC', padding: 16, borderRadius: 10,
            fontSize: 12, fontFamily: 'monospace', marginBottom: 16,
            whiteSpace: 'pre-wrap', color: '#555550',
          }}>{TEMPLATE}</pre>

          <textarea
            value={pasteText}
            onChange={e => setPasteText(e.target.value)}
            placeholder="Paste your workout here..."
            style={{
              width: '100%', height: 240, padding: 16,
              border: '1px solid #E0E0DC', borderRadius: 12,
              fontSize: 13, fontFamily: 'monospace', resize: 'vertical',
              boxSizing: 'border-box', outline: 'none',
            }}
          />

          <button onClick={parseWorkout} disabled={!pasteText} style={{ ...btnStyle('#FF3CAC'), marginTop: 12 }}>
            Parse Workout
          </button>

          {parsed.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h4 style={{ fontFamily: 'Bebas Neue', fontSize: 16, marginBottom: 12 }}>
                PREVIEW — {parsed.length} exercises
              </h4>
              {parsed.map((ex, i) => (
                <div key={i} style={{
                  background: '#F8F8F6', borderRadius: 10, padding: 14,
                  marginBottom: 8, border: '1px solid #E8E8E4',
                }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{ex.name}</div>
                  <div style={{ fontSize: 12, color: '#888882', marginTop: 4 }}>
                    {ex.sets} sets × {ex.reps} · {ex.rest_seconds}s rest
                    {ex.video_url && <span style={{ color: '#1B6B7B', marginLeft: 8 }}>● Video</span>}
                  </div>
                  {ex.description && <div style={{ fontSize: 12, color: '#555550', marginTop: 4 }}>{ex.description}</div>}
                </div>
              ))}

              {msg && <p style={{ color: msg.includes('Error') ? 'red' : 'green', fontSize: 13, marginTop: 8 }}>{msg}</p>}

              <button onClick={saveExercises} disabled={saving} style={{ ...btnStyle('#1B6B7B'), marginTop: 12 }}>
                {saving ? 'Saving...' : `✓ Add ${parsed.length} exercises to workout`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── EXTRAS TAB ───────────────────────────────────────────
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

    const ext = file.name.split('.').pop()
    const path = `extras/${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage.from('zoestrength').upload(path, file)

    if (uploadError) { setMsg('Upload error: ' + uploadError.message); setSaving(false); return }

    const { data: urlData } = supabase.storage.from('zoestrength').getPublicUrl(path)

    const { error } = await supabase.from('program_resources').insert({
      ...form,
      file_url: urlData.publicUrl,
      program_id: form.program_id || null,
      sort_order: resources.length,
    })

    if (error) setMsg('Error: ' + error.message)
    else { setMsg('Uploaded!'); setForm({ name: '', description: '', program_id: '', resource_type: 'pdf' }); setFile(null); fetchResources() }
    setSaving(false)
  }

  async function deleteResource(id) {
    if (!confirm('Delete this resource?')) return
    await supabase.from('program_resources').delete().eq('id', id)
    fetchResources()
  }

  return (
    <div>
      <h2 style={{ fontFamily: 'Bebas Neue', fontSize: 28, color: '#0D0D0D', marginBottom: 24 }}>EXTRAS & PDFS</h2>

      <div style={cardStyle}>
        <h3 style={{ fontFamily: 'Bebas Neue', fontSize: 18, marginBottom: 16 }}>UPLOAD FILE</h3>
        <div style={gridStyle}>
          <Field label="Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="e.g. Active Woman's Guide to Peri" span={2} />
          <Field label="Description" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} span={2} />
          <div>
            <label style={labelStyle}>Type</label>
            <select value={form.resource_type} onChange={e => setForm(f => ({ ...f, resource_type: e.target.value }))} style={inputStyle}>
              <option value="pdf">PDF</option>
              <option value="guide">Guide</option>
              <option value="video">Video</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Program (optional)</label>
            <select value={form.program_id} onChange={e => setForm(f => ({ ...f, program_id: e.target.value }))} style={inputStyle}>
              <option value="">All programs</option>
              {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>File</label>
            <input type="file" onChange={e => setFile(e.target.files[0])} style={{ fontSize: 13 }} />
          </div>
        </div>
        {msg && <p style={{ color: msg.includes('Error') ? 'red' : 'green', fontSize: 13, marginTop: 12 }}>{msg}</p>}
        <button onClick={upload} disabled={saving || !file || !form.name} style={{ ...btnStyle('#1B6B7B'), marginTop: 16 }}>
          {saving ? 'Uploading...' : 'Upload'}
        </button>
      </div>

      <div style={{ marginTop: 24 }}>
        {resources.map(r => (
          <div key={r.id} style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10 }}>
            <div style={{ fontSize: 24 }}>{r.resource_type === 'pdf' ? '📄' : '📎'}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</div>
              <div style={{ fontSize: 12, color: '#888882' }}>{r.programs?.name || 'All programs'}</div>
            </div>
            <a href={r.file_url} target="_blank" style={{ fontSize: 12, color: '#1B6B7B' }}>View</a>
            <button onClick={() => deleteResource(r.id)} style={btnStyle('#FF3CAC', true)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── SHARED COMPONENTS ───────────────────────────────────────
function Field({ label, value, onChange, type = 'text', span, multiline, placeholder }) {
  return (
    <div style={{ gridColumn: span ? `span ${span}` : undefined }}>
      <label style={labelStyle}>{label}</label>
      {multiline ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          style={{ ...inputStyle, height: 80, resize: 'vertical' }} />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          style={inputStyle} />
      )}
    </div>
  )
}

const labelStyle = { display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#888882', marginBottom: 6 }
const inputStyle = { width: '100%', padding: '10px 14px', border: '1px solid #E0E0DC', borderRadius: 10, fontSize: 14, fontFamily: 'DM Sans', outline: 'none', boxSizing: 'border-box', background: '#FFFFFF' }
const cardStyle = { background: '#FFFFFF', borderRadius: 16, padding: 24, border: '1px solid #E8E8E4', marginBottom: 16 }
const gridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }

function btnStyle(color, small) {
  return {
    background: color, color: 'white', border: 'none', cursor: 'pointer',
    padding: small ? '8px 16px' : '12px 24px',
    borderRadius: 100, fontFamily: 'Bebas Neue',
    fontSize: small ? 13 : 15, letterSpacing: '0.06em',
  }
}
