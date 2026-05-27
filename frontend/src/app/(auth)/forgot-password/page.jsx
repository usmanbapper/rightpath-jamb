'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { Mail } from 'lucide-react';
import { authApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      // Always show "sent" to prevent email enumeration — but still log
      console.error(err);
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  if (sent) return (
    <div style={{ textAlign:'center' }}>
      <div style={{ fontSize:56, marginBottom:16 }}>📬</div>
      <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.7rem', fontWeight:800, marginBottom:12 }}>
        Reset link sent
      </h2>
      <p style={{ color:'var(--text-2)', lineHeight:1.7, marginBottom:28 }}>
        If <strong style={{ color:'var(--text)' }}>{email}</strong> is registered,
        a password reset link has been sent. Check your inbox (and spam folder).
      </p>
      <Link href="/login" style={{ color:'var(--brand)', fontWeight:600, fontSize:'.95rem' }}>
        ← Back to login
      </Link>
    </div>
  );

  return (
    <div>
      <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.8rem', fontWeight:800, marginBottom:8 }}>
        Reset password
      </h2>
      <p style={{ color:'var(--text-2)', marginBottom:32, lineHeight:1.6, fontSize:'.95rem' }}>
        Enter your email and we'll send you a reset link.
      </p>
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:18 }}>
        <Input
          label="Email address" type="email" placeholder="you@email.com"
          icon={<Mail size={16} />}
          value={email} onChange={e => setEmail(e.target.value)}
          required
        />
        <Button type="submit" loading={loading} size="lg">Send Reset Link</Button>
        <Link href="/login" style={{ textAlign:'center', color:'var(--text-2)', fontSize:'.9rem' }}>
          ← Back to login
        </Link>
      </form>
    </div>
  );
}
