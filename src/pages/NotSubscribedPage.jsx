export default function NotSubscribedPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      textAlign: 'center',
    }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Having trouble accessing your account?</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>Don't worry — reach out and we'll get you sorted.</p>
      <a href="mailto:fitwithsisi@gmail.com" style={{
        background: '#C8F500',
        color: '#000',
        padding: '0.75rem 2rem',
        borderRadius: '999px',
        textDecoration: 'none',
        fontWeight: '600',
      }}>Email Us</a>
    </div>
  )
}
