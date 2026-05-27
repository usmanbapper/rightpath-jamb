'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';
import Spinner from '@/components/ui/Spinner';
import { useAuthStore } from '@/store/auth.store';

/**
 * AppShell — authenticated layout with sticky sidebar and content area.
 * Handles auth guard: redirects to /login if no user.
 * Handles admin guard: pass adminOnly={true} to restrict to admin/superadmin.
 */
export default function AppShell({ children, adminOnly = false }) {
  const router             = useRouter();
  const { user, isLoading, fetchUser } = useAuthStore();
  const [sidebarOpen, setSidebarOpen]  = useState(false);
  const [ready, setReady]              = useState(false);

  useEffect(() => {
    if (!user && !isLoading) {
      fetchUser().then(() => setReady(true));
    } else {
      setReady(true);
    }
  }, []);

  // Auth guard
  useEffect(() => {
    if (!ready || isLoading) return;
    if (!user) { router.replace('/login'); return; }
    if (adminOnly && user.role === 'student') { router.replace('/dashboard'); return; }
  }, [user, isLoading, ready]);

  if (!ready || isLoading || !user) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg)' }}>
        <Spinner size={44} />
      </div>
    );
  }

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--bg)' }}>
      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position:'fixed', inset:0, background:'rgba(0,0,0,.4)',
            zIndex:40, display:'none',
          }}
          className="mobile-overlay"
        />
      )}

      {/* ── Sidebar ── */}
      <div style={{
        flexShrink: 0,
        position:   'sticky',
        top:        0,
        height:     '100vh',
      }}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* ── Main ── */}
      <main style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, overflowX:'hidden' }}>
        {/* Mobile top bar */}
        <header style={{
          display:        'none',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '12px 16px',
          background:     'var(--surface)',
          borderBottom:   '1px solid var(--border)',
          position:       'sticky',
          top:            0,
          zIndex:         30,
        }} className="mobile-header">
          <button
            onClick={() => setSidebarOpen(v => !v)}
            style={{ background:'none', border:'none', padding:6, color:'var(--text)', display:'flex' }}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'1rem', color:'var(--brand)' }}>
            Rightpath
          </div>
          <div style={{ width:34 }} />
        </header>

        {/* Page content */}
        <div style={{ flex:1, padding:'32px 32px 48px', maxWidth:1200 }}>
          {children}
        </div>
      </main>

      {/* Responsive overrides injected once */}
      <style>{`
        @media (max-width: 768px) {
          .mobile-header  { display: flex !important; }
          .mobile-overlay { display: block !important; }
        }
      `}</style>
    </div>
  );
}
