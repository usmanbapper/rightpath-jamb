'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export default function Root() {
  const router = useRouter();
  const { user, isLoading, fetchUser } = useAuthStore();

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!user) return router.replace('/login');
    if (user.role === 'admin' || user.role === 'superadmin') return router.replace('/admin');
    router.replace('/dashboard');
  }, [user, isLoading]);

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg)' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:48, height:48, border:'3px solid var(--brand)', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 16px' }} />
        <p style={{ color:'var(--text-2)', fontFamily:'var(--font-body)' }}>Loading…</p>
      </div>
    </div>
  );
}