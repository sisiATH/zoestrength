import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const ADMIN_EMAIL = 'sisikyriacou@gmail.com'

function StatCard({ label, value, sub }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12, border: '1px solid #E8E8E4',
      padding: '18px 20px', flex: 1, minWidth: 140,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#888882', marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: 'Bebas Neue', fontSize: 36, color: '#0D0D0D', lineHeight: 1 }}>{value ?? '—'}</div>
      {sub && <div style={{ fontSize: 12, color: '#888882', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontFamily: 'Bebas Neue', fontSize: 20, letterSpacing: '0.06em', color: '#0D0D0D', marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  )
}

function Table({ cols, rows }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E8E4', overflow: 'hidden' }}>
      <div style={{
        display: 'grid', gridTemplateColumns: cols.map(c => c.width || '1fr').join(' '),
        padding: '10px 16px', borderBottom: '1px solid #E8E8E4', gap: 8,
      }}>
        {cols.map(c => (
          <div key={c.key} style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#888882' }}>{c.label}</div>
        ))}
      </div>
      {rows.length === 0 && (
        <div style={{ padding: '20px 16px', fontSize: 13, color: '#888882' }}>No data</div>
      )}
      {rows.map((row, i) => (
        <div key={i} style={{
          display: 'grid', gridTemplateColumns: cols.map(c => c.width || '1fr').join(' '),
          padding: '12px 16px', borderBottom: i < rows.length - 1 ? '1px solid #F0F0EC' : 'none',
          gap: 8, alignItems: 'center',
        }}>
          {cols.map(c => (
            <div key={c.key} style={{ fontSize: 13, color: '#0D0D0D' }}>{row[c.key] ?? '—'}</div>
          ))}
        </div>
      ))}
    </div>
  )
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})
  const [topWorkouts, setTopWorkouts] = useState([])
  const [recentUsers, setRecentUsers] = useState([])
  const [subBreakdown, setSubBreakdown] = useState([])
  const [topExercises, setTopExercises] = useState([])

  useEffect(() => {
    if (!user) return
    if (user.email !== ADMIN_EMAIL) { navigate('/app'); return }
    fetchAll()
  }, [user])

  async function fetchAll() {
    setLoading(true)
    await Promise.all([
      fetchStats(),
      fetchTopWorkouts(),
      fetchRecentUsers(),
      fetchSubBreakdown(),
      fetchTopExercises(),
    ])
    setLoading(false)
  }

  async function fetchStats() {
    const [
      { count: totalUsers },
      { count: totalCompletions },
      { count: totalSets },
      { count: activeSubs },
      { count: trialUsers },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('workout_completions').select('*', { count: 'exact', head: true }),
      supabase.from('set_logs').select('*', { count: 'exact', head: true }).eq('completed', true),
      supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'trialing'),
    ])

    // Active users = completed a workout in last 30 days
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data: activeData } = await supabase
      .from('workout_completions')
      .select('user_id')
      .gte('completed_at', since)
    const activeUsers = new Set(activeData?.map(r => r.user_id) || []).size

    setStats({ totalUsers, totalCompletions, totalSets, activeSubs, trialUsers, activeUsers })
  }

  async function fetchTopWorkouts() {
    const { data } = await supabase
      .from('workout_completions')
      .select('workout_id, workouts(title)')
    if (!data) return
    const counts = {}
    for (const r of data) {
      const title = r.workouts?.title || r.workout_id
      counts[title] = (counts[title] || 0) + 1
    }
    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([title, completions]) => ({ title, completions }))
    setTopWorkouts(sorted)
  }

  async function fetchRecentUsers() {
    const { data } = await supabase
      .from('profiles')
      .select('id, email, created_at')
      .order('created_at', { ascending: false })
      .limit(10)
    if (!data) return

    // Get subscription status for each
    const ids = data.map(u => u.id)
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('user_id, status, plan')
      .in('user_id', ids)

    const subMap = {}
    for (const s of subs || []) subMap[s.user_id] = s

    setRecentUsers(data.map(u => ({
      email: u.email,
      joined: new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }),
      status: subMap[u.id]?.status || 'no sub',
      plan: subMap[u.id]?.plan || '—',
    })))
  }

  async function fetchSubBreakdown() {
    const { data } = await supabase
      .from('subscriptions')
      .select('status, plan')
    if (!data) return
    const counts = {}
    for (const s of data) {
      const key = `${s.status} · ${s.plan || 'unknown'}`
      counts[key] = (counts[key] || 0) + 1
    }
    setSubBreakdown(Object.entries(counts).map(([label, count]) => ({ label, count })))
  }

  async function fetchTopExercises() {
    const { data } = await supabase
      .from('set_logs')
      .select('workout_exercise_id, workout_exercises(exercise_id, exercises(name))')
      .eq('completed', true)
    if (!data) return
    const counts = {}
    for (const r of data) {
      const name = r.workout_exercises?.exercises?.name || r.workout_exercise_id
      counts[name] = (counts[name] || 0) + 1
    }
    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, sets]) => ({ name, sets }))
    setTopExercises(sorted)
  }

  if (!user || user.email !== ADMIN_EMAIL) return null

  if (loading) return (
    <div style={{ padding: 32, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ fontFamily: 'Bebas Neue', fontSize: 28, color: '#0D0D0D', marginBottom: 24 }}>ADMIN</div>
      {[1,2,3].map(i => (
        <div key={i} style={{ height: 80, background: '#E8E8E4', borderRadius: 12, marginBottom: 12, animation: 'shimmer 1.5s infinite' }} />
      ))}
      <style>{`@keyframes shimmer { 0%,100%{opacity:0.5} 50%{opacity:1} }`}</style>
    </div>
  )

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 20px 80px', background: '#F5F5F2', minHeight: '100vh' }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div style={{ fontFamily: 'Bebas Neue', fontSize: 32, letterSpacing: '0.06em', color: '#0D0D0D' }}>ADMIN DASHBOARD</div>
        <button onClick={fetchAll} style={{
          background: '#0D0D0D', color: '#D4A853', border: 'none', borderRadius: 100,
          padding: '8px 18px', fontFamily: 'Bebas Neue', fontSize: 14, letterSpacing: '0.08em', cursor: 'pointer',
        }}>↻ REFRESH</button>
      </div>

      <Section title="Overview">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <StatCard label="Total Users" value={stats.totalUsers} />
          <StatCard label="Active Subs" value={stats.activeSubs} sub="paid" />
          <StatCard label="On Trial" value={stats.trialUsers} />
          <StatCard label="Active (30d)" value={stats.activeUsers} sub="completed a workout" />
          <StatCard label="Completions" value={stats.totalCompletions} sub="all time" />
          <StatCard label="Sets Logged" value={stats.totalSets} sub="completed" />
        </div>
      </Section>

      <Section title="Subscription Breakdown">
        <Table
          cols={[
            { key: 'label', label: 'Status · Plan', width: '1fr' },
            { key: 'count', label: 'Users', width: '80px' },
          ]}
          rows={subBreakdown}
        />
      </Section>

      <Section title="Top Workouts by Completions">
        <Table
          cols={[
            { key: 'title', label: 'Workout', width: '1fr' },
            { key: 'completions', label: 'Completions', width: '110px' },
          ]}
          rows={topWorkouts}
        />
      </Section>

      <Section title="Most Logged Exercises">
        <Table
          cols={[
            { key: 'name', label: 'Exercise', width: '1fr' },
            { key: 'sets', label: 'Sets Logged', width: '110px' },
          ]}
          rows={topExercises}
        />
      </Section>

      <Section title="Recent Users">
        <Table
          cols={[
            { key: 'email', label: 'Email', width: '1fr' },
            { key: 'joined', label: 'Joined', width: '100px' },
            { key: 'status', label: 'Status', width: '100px' },
            { key: 'plan', label: 'Plan', width: '80px' },
          ]}
          rows={recentUsers}
        />
      </Section>

    </div>
  )
}
