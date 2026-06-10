'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import Sidebar from './Sidebar';
import Spinner from '@/components/ui/Spinner';
import { Menu, X } from 'lucide-react';

export default function AppShell({ children, adminOnly = false }) {
  const router = useRouter();
  const { user, isLoading, fetchUser } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { fetchUser(); }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.replace('/login'); return; }
    if (adminOnly && user.role === 'student') { router.replace('/dashboard'); return; }
  }, [user, isLoading, adminOnly]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, []);

  if (isLoading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg)' }}>
        <Spinner size={40} />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--bg)' }}>

      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position:'fixed', inset:0, background:'rgba(0,0,0,0.45)',
            zIndex:40, display:'block',
          }}
          className="sidebar-overlay"
        />
      )}

      {/* ── Sidebar ── */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* ── Main content ── */}
      <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column' }}>

        {/* Mobile top bar */}
        <header className="mobile-topbar">
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              background:'none', border:'none', color:'var(--text)',
              display:'flex', alignItems:'center', justifyContent:'center',
              padding:8, borderRadius:'var(--radius-sm)', cursor:'pointer',
            }}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'.95rem', color:'var(--brand)' }}>
            Rightpath
          </div>
          <div style={{ width:38 }} /> {/* spacer */}
        </header>

        <main className="app-main">
          {children}
        </main>
      </div>

      <style>{`
        .sidebar-overlay { display: none; }

        .mobile-topbar {
          display: none;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          position: sticky;
          top: 0;
          z-index: 30;
        }

        .app-main {
          padding: 32px 36px;
          overflow-y: auto;
          flex: 1;
        }

        @media (max-width: 768px) {
          .sidebar-overlay { display: block; }
          .mobile-topbar { display: flex; }
          .app-main { padding: 20px 16px; }
        }
      `}</style>
    </div>
  );
}
