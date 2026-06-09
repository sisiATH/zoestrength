import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import ProgramsView from './app/ProgramsView'
import ProgramDetail from './app/ProgramDetail'
import WorkoutPlayer from './app/WorkoutPlayer'
import ExtrasView from './app/ExtrasView'
import AdminDashboard from './app/AdminDashboard'

export default function AppShell() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const tabs = [
    { path: '/app', label: 'Programs', icon: '⚡' },
    { path: '/app/extras', label: 'Extras', icon: '📋' },
  ]

  const isActive = (path) => {
    if (path === '/app') return location.pathname === '/app' || location.pathname.startsWith('/app/program')
    return location.pathname.startsWith(path)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--light)', display: 'flex', flexDirection: 'column' }}>

      {/* Top nav */}
      <nav style={{
        background: 'var(--dark)', padding: '0 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 56, flexShrink: 0, position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BoltIcon size={20} color="#D4A853" />
          <span style={{ fontFamily: 'Bebas Neue', fontSize: 18, letterSpacing: '0.08em', color: 'var(--white)' }}>
            ZOE<span style={{ color: '#C4857A' }}>STRENGTH</span>
          </span>
        </div>

        <button onClick={() => setMenuOpen(!menuOpen)} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: '#888882', fontSize: 13, fontFamily: 'DM Sans',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'var(--teal)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontFamily: 'Bebas Neue', fontSize: 13,
            color: '#D4A853', letterSpacing: '0.05em',
          }}>
            {user?.email?.[0]?.toUpperCase()}
          </div>
        </button>

        {/* Dropdown */}
        {menuOpen && (
          <div style={{
            position: 'absolute', top: 60, right: 16,
            background: '#1A1A1A', border: '1px solid #2A2A2A',
            borderRadius: 12, padding: 8, minWidth: 180, zIndex: 100,
          }}>
            <div style={{ padding: '8px 12px', borderBottom: '1px solid #2A2A2A', marginBottom: 4 }}>
              <p style={{ fontSize: 11, color: '#555550' }}>Signed in as</p>
              <p style={{ fontSize: 13, color: 'var(--white)', marginTop: 2 }}>{user?.email}</p>
            </div>
            <button onClick={signOut} style={{
              width: '100%', padding: '10px 12px', background: 'transparent',
              border: 'none', color: '#888882', fontSize: 13, cursor: 'pointer',
              textAlign: 'left', borderRadius: 8, fontFamily: 'DM Sans',
            }}
              onMouseOver={e => e.target.style.background = '#222'}
              onMouseOut={e => e.target.style.background = 'transparent'}
            >
              Sign out
            </button>
          </div>
        )}
      </nav>

      {/* Main content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Routes>
          <Route index element={<ProgramsView />} />
          <Route path="program/:programId" element={<ProgramDetail />} />
          <Route path="workout/:workoutId" element={<WorkoutPlayer />} />
          <Route path="extras" element={<ExtrasView />} />
          <Route path="admin" element={<AdminDashboard />} />
        </Routes>
      </div>

      {/* Bottom tab bar */}
      <div style={{
        background: 'var(--dark)',
        display: 'flex', borderTop: '1px solid #1A1A1A',
        position: 'sticky', bottom: 0, flexShrink: 0,
      }}>
        {tabs.map(tab => (
          <button key={tab.path} onClick={() => navigate(tab.path)} style={{
            flex: 1, padding: '12px 8px',
            background: 'transparent', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          }}>
            <span style={{ fontSize: 18 }}>{tab.icon}</span>
            <span style={{
              fontSize: 10, fontFamily: 'DM Sans', fontWeight: 600,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: isActive(tab.path) ? '#D4A853' : '#444440',
            }}>{tab.label}</span>
            {isActive(tab.path) && (
              <div style={{ width: 16, height: 2, background: '#D4A853', borderRadius: 2 }} />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

function BoltIcon({ size = 24, color = 'currentColor' }) {
  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 100 130" fill="none" style={{ display: 'block' }}>
      <polygon points="60,0 20,70 50,70 40,130 80,55 52,55" fill={color} />
    </svg>
  )
}
