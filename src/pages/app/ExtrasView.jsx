import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function ExtrasView() {
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchResources() }, [])

  async function fetchResources() {
    const { data } = await supabase
      .from('program_resources')
      .select(`*, programs(name, color, text_color)`)
      .order('sort_order')

    if (data) setResources(data)
    setLoading(false)
  }

  const typeIcon = { pdf: '📄', guide: '📘', video: '🎥', other: '📎' }

  if (loading) return (
    <div style={{ padding: 24 }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          height: 80, background: '#E8E8E4', borderRadius: 14,
          marginBottom: 10, animation: 'shimmer 1.5s infinite',
        }} />
      ))}
      <style>{`@keyframes shimmer { 0%,100%{opacity:0.5} 50%{opacity:1} }`}</style>
    </div>
  )

  return (
    <div style={{ padding: '24px 20px', maxWidth: 600, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'Bebas Neue', fontSize: 36, color: 'var(--dark)', letterSpacing: '0.03em' }}>
          EXTRAS
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
          PDFs, guides, and resources — yours to keep
        </p>
      </div>

      {resources.length === 0 ? (
        <div style={{
          background: 'var(--white)', borderRadius: 14, padding: 32,
          textAlign: 'center', border: '1px solid var(--mid)',
        }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>📬</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Resources coming soon — check back after your first program week.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {resources.map(r => (
            <a
              key={r.id}
              href={r.file_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'var(--white)', borderRadius: 14, padding: '18px 20px',
                border: '1px solid var(--mid)', textDecoration: 'none',
                display: 'flex', alignItems: 'center', gap: 16,
                transition: 'transform 0.1s',
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'scale(1.01)'}
              onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                background: r.programs?.color || 'var(--mid)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20,
              }}>
                {typeIcon[r.resource_type] || '📎'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--dark)' }}>{r.name}</div>
                {r.description && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{r.description}</div>
                )}
                {r.programs?.name && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, opacity: 0.7 }}>
                    {r.programs.name}
                  </div>
                )}
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>↓</span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
