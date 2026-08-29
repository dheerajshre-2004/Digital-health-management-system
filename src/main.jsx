import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { fetchSupabaseData, initSupabaseSync } from './supabaseSync'

function AppLoader() {
  const [loading, setLoading] = useState(true);

  const isPatientPortal = 
    import.meta.env.VITE_APP_MODE === 'patient' ||
    new URLSearchParams(window.location.search).get('portal') === 'patient' ||
    window.location.pathname.startsWith('/patient') ||
    window.location.hostname.toLowerCase().includes('patient');

  useEffect(() => {
    if (isPatientPortal) {
      document.title = "DHMS - Patient Health Portal";
    } else {
      document.title = "DHMS - Hospital Management System";
    }

    async function loadData() {
      // Pull latest state from Supabase
      await fetchSupabaseData();
      // Initialize the live storage proxy layer
      initSupabaseSync();
      setLoading(false);
    }
    loadData();
  }, [isPatientPortal]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
        color: '#f8fafc',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid #38bdf8',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '20px'
        }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, letterSpacing: '0.05em' }}>
          {isPatientPortal ? "DHMS Patient Portal" : "DHMS Portal"}
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '8px' }}>Syncing secure database with Supabase...</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return <App />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppLoader />
  </StrictMode>,
)

