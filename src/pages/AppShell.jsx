import { useState } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import ProgramsView from './app/ProgramsView'
import ProgramDetail from './app/ProgramDetail'
import WorkoutPlayer from './app/WorkoutPlayer'
import ExtrasView from './app/ExtrasView'
import AdminDashboard from './app/AdminDashboard'

const ROSE = '#C4857A'
const GOLD = '#D4A853'
const WHITE = '#FFFFFF'

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
    <div style={{ minHeight: '100vh', background: '#F5F5F2', display: 'flex', flexDirection: 'column' }}>

      {/* Top nav */}
      <nav style={{
        background: ROSE, padding: '0 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 60, flexShrink: 0, position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BoltIcon size={20} color={WHITE} />
          <span style={{ fontFamily: 'Bebas Neue', fontSize: 20, letterSpacing: '0.08em', color: WHITE }}>
            fit with sisi
          </span>
        </div>

        <button onClick={() => setMenuOpen(!menuOpen)} style={{
          background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer',
          width: 32, height: 32, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Bebas Neue', fontSize: 15, color: WHITE, letterSpacing: '0.05em',
        }}>
          {user?.email?.[0]?.toUpperCase()}
        </button>

        {menuOpen && (
          <div style={{
            position: 'absolute', top: 68, right: 16,
            background: WHITE, border: '1px solid #E0E0DC',
            borderRadius: 12, padding: 8, minWidth: 200, zIndex: 100,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }}>
            <div style={{ padding: '8px 12px', borderBottom: '1px solid #F0F0EC', marginBottom: 4 }}>
              <p style={{ fontSize: 11, color: '#888882' }}>Signed in as</p>
              <p style={{ fontSize: 13, color: '#0D0D0D', marginTop: 2 }}>{user?.email}</p>
            </div>
            <button onClick={signOut} style={{
              width: '100%', padding: '10px 12px', background: 'transparent',
              border: 'none', color: '#555550', fontSize: 14, cursor: 'pointer',
              textAlign: 'left', borderRadius: 8, fontFamily: 'DM Sans',
            }}>
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
        background: ROSE,
        display: 'flex',
        borderTop: '1px solid rgba(255,255,255,0.2)',
        position: 'sticky', bottom: 0, flexShrink: 0,
      }}>
        {tabs.map(tab => (
          <button key={tab.path} onClick={() => navigate(tab.path)} style={{
            flex: 1, padding: '14px 8px',
            background: 'transparent', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          }}>
            <span style={{ fontSize: 22 }}>{tab.icon}</span>
            <span style={{
              fontSize: 13, fontFamily: 'DM Sans', fontWeight: 700,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              color: isActive(tab.path) ? WHITE : 'rgba(255,255,255,0.6)',
            }}>{tab.label}</span>
            {isActive(tab.path) && (
              <div style={{ width: 20, height: 2, background: WHITE, borderRadius: 2 }} />
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
