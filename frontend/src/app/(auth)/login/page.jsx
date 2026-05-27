'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Mail, Lock } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { getErrorMessage } from '@/lib/utils';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(form);
      toast.success(`Welcome back, ${data.user.full_name.split(' ')[0]}!`);
      const role = data.user.role;
      router.push(role === 'admin' || role === 'superadmin' ? '/admin' : '/dashboard');
    } catch (err) {
      const msg = getErrorMessage(err);
      toast.error(msg);
      if (err?.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
        router.push(`/verify-email?email=${encodeURIComponent(form.email)}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, marginBottom: 8 }}>
        Sign in
      </h2>
      <p style={{ color: 'var(--text-2)', marginBottom: 32, fontSize: '.95rem' }}>
        Don't have an account?{' '}
        <Link href="/register" style={{ color: 'var(--brand)', fontWeight: 600 }}>Register free</Link>
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Input
          label="Email address" type="email" placeholder="you@email.com"
          icon={<Mail size={16} />}
          value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
          required
        />
        <Input
          label="Password" type="password" placeholder="••••••••"
          icon={<Lock size={16} />}
          value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
          required
        />
        <div style={{ textAlign: 'right', marginTop: -8 }}>
          <Link href="/forgot-password" style={{ fontSize: '.85rem', color: 'var(--brand)', fontWeight: 500 }}>
            Forgot password?
          </Link>
        </div>
        <Button type="submit" loading={loading} size="lg" style={{ marginTop: 4 }}>
          Sign In
        </Button>
      </form>
    </div>
  );
}