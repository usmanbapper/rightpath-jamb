'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { MailCheck } from 'lucide-react';
import { authApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import Button from '@/components/ui/Button';

function VerifyContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const email        = searchParams.get('email') || '';
  const token        = searchParams.get('token') || '';
  const [resending, setResending] = useState(false);
  const [verified,  setVerified]  = useState(false);
  const [verifying, setVerifying] = useState(!!token);

  // Auto-verify if token is in URL (clicked email link)
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        await authApi.verifyEmail(token);
        setVerified(true);
        toast.success('Email verified! Redirecting to login…');
        setTimeout(() => router.push('/login'), 2500);
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setVerifying(false);
      }
    })();
  }, [token]);

  async function resend() {
    if (!email) return;
    setResending(true);
    try {
      await authApi.resendVerification(email);
      toast.success('Verification email resent! Check your inbox.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setResending(false);
    }
  }

  if (verifying) {
    return (
      <div style={{ textAlign:'center', padding:'24px 0' }}>
        <div style={{ width:44,height:44,border:'3px solid var(--brand)',borderTopColor:'transparent',borderRadius:'50%',animation:'spin .7s linear infinite',margin:'0 auto 16px' }} />
        <p style={{ color:'var(--text-2)' }}>Verifying your email…</p>
      </div>
    );
  }

  return (
    <div style={{ textAlign:'center' }}>
      <div style={{
        width:72, height:72, background:'var(--brand-light)', borderRadius:'50%',
        display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px',
      }}>
        <MailCheck size={34} color="var(--brand)" />
      </div>

      {verified ? (
        <>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.7rem', fontWeight:800, marginBottom:8 }}>
            ✅ Email Verified!
          </h2>
          <p style={{ color:'var(--text-2)' }}>Redirecting you to login…</p>
        </>
      ) : (
        <>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.7rem', fontWeight:800, marginBottom:12 }}>
            Check your inbox
          </h2>
          <p style={{ color:'var(--text-2)', lineHeight:1.7, marginBottom:32 }}>
            We sent a verification link to<br />
            <strong style={{ color:'var(--text)' }}>{email || 'your email address'}</strong>.<br />
            Click it to activate your account.
          </p>
          {email && (
            <Button onClick={resend} loading={resending} variant="secondary" style={{ width:'100%', marginBottom:12 }}>
              Resend verification email
            </Button>
          )}
          <Button onClick={() => router.push('/login')} variant="ghost" style={{ width:'100%' }}>
            Back to login
          </Button>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyContent />
    </Suspense>
  );
}
