import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import PaywallPage from './pages/PaywallPage'
import AppShell from './pages/AppShell'
import NotSubscribedPage from './pages/NotSubscribedPage'
import './index.css'

function ProtectedRoute({ children }) {
  const { user, isSubscribed, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (!isSubscribed) return <Navigate to="/not-subscribed" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, isSubscribed, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (user && isSubscribed) return <Navigate to="/app" replace />
  return children
}

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--dark)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg width={40} height={52} viewBox="0 0 100 130" fill="none" style={{ animation: 'pulse 1.2s ease-in-out infinite' }}>
        <polygon points="60,0 20,70 50,70 40,130 80,55 52,55" fill="#C8F500" />
      </svg>
      <style>{`@keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:1} }`}</style>
    </div>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/app/*" element={<ProtectedRoute><AppShell /></ProtectedRoute>} />
      <Route path="/not-subscribed" element={<NotSubscribedPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
