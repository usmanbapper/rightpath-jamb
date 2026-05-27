'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Lock } from 'lucide-react';
import { authApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

function ResetContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const token        = searchParams.get('token') || '';
  const [form,    setForm]    = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match.');
      return;
    }
    if (!token) {
      toast.error('Invalid or expired reset link. Please request a new one.');
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword({ token, password: form.password });
      toast.success('Password reset successfully!');
      router.push('/login');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (!token) return (
    <div style={{ textAlign:'center' }}>
      <div style={{ fontSize:48, marginBottom:16 }}>🔗</div>
      <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.7rem', fontWeight:800, marginBottom:12 }}>
        Invalid link
      </h2>
      <p style={{ color:'var(--text-2)', marginBottom:24, lineHeight:1.6 }}>
        This password reset link is missing or expired. Please request a new one.
      </p>
      <Button onClick={() => router.push('/forgot-password')} size="lg" style={{ width:'100%' }}>
        Request new link
      </Button>
    </div>
  );

  return (
    <div>
      <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.8rem', fontWeight:800, marginBottom:8 }}>
        New password
      </h2>
      <p style={{ color:'var(--text-2)', marginBottom:32, fontSize:'.95rem' }}>
        Choose a strong password for your account.
      </p>
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:18 }}>
        <Input
          label="New password" type="password"
          placeholder="Min 8 chars, 1 uppercase, 1 number"
          icon={<Lock size={16} />}
          value={form.password}
          onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
          required
        />
        <Input
          label="Confirm password" type="password"
          placeholder="Repeat your password"
          icon={<Lock size={16} />}
          value={form.confirm}
          onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
          required
        />
        <Button type="submit" loading={loading} size="lg" style={{ marginTop:4 }}>
          Reset Password
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetContent />
    </Suspense>
  );
}
