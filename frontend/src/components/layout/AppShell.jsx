'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import Sidebar from './Sidebar';
import Spinner from '@/components/ui/Spinner';

export default function AppShell({ children, adminOnly = false }) {
  const router = useRouter();
  const { user, isLoading, fetchUser } = useAuthStore();

  useEffect(() => { fetchUser(); }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.replace('/login'); return; }
    if (adminOnly && user.role === 'student') { router.replace('/dashboard'); return; }
  }, [user, isLoading, adminOnly]);

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
      <Sidebar />
      <main style={{ flex:1, minWidth:0, padding:'32px 36px', overflowY:'auto' }}>
        {children}
      </main>
    </div>
  );
}
