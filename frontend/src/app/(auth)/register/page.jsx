'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Mail, Lock, User, Phone } from 'lucide-react';
import { authApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo',
  'Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa',
  'Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara',
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', phone: '',
    state: '', school: '', jamb_reg_number: '',
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep]       = useState(1);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (step === 1) { setStep(2); return; }
    setLoading(true);
    try {
      await authApi.register(form);
      toast.success('Account created! Check your email to verify.');
      router.push(`/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.8rem', fontWeight:800, marginBottom:8 }}>
        Create account
      </h2>
      <p style={{ color:'var(--text-2)', marginBottom:28, fontSize:'.95rem' }}>
        Already registered?{' '}
        <Link href="/login" style={{ color:'var(--brand)', fontWeight:600 }}>Sign in</Link>
      </p>

      {/* Step progress bars */}
      <div style={{ display:'flex', gap:8, marginBottom:28 }}>
        {[1,2].map(n => (
          <div key={n} style={{
            height:4, flex:1, borderRadius:2,
            background: step >= n ? 'var(--brand)' : 'var(--border)',
            transition:'background .3s',
          }} />
        ))}
      </div>

      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
        {step === 1 ? (
          <>
            <Input label="Full name" placeholder="Chukwuemeka Okafor"
              icon={<User size={16} />} value={form.full_name} onChange={set('full_name')} required />
            <Input label="Email address" type="email" placeholder="you@email.com"
              icon={<Mail size={16} />} value={form.email} onChange={set('email')} required />
            <Input label="Password" type="password" placeholder="Min 8 chars, 1 uppercase, 1 number"
              icon={<Lock size={16} />} value={form.password} onChange={set('password')} required />
            <Input label="Phone number" type="tel" placeholder="08012345678"
              icon={<Phone size={16} />} value={form.phone} onChange={set('phone')} />
          </>
        ) : (
          <>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <label style={{ fontSize:'.85rem', fontWeight:600, color:'var(--text-2)' }}>State of origin</label>
              <select value={form.state} onChange={set('state')} style={{
                padding:'11px 14px', border:'1.5px solid var(--border)', borderRadius:'var(--radius-sm)',
                background:'var(--surface)', color:'var(--text)', fontSize:'.95rem', outline:'none',
              }}>
                <option value="">Select state…</option>
                {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <Input label="School / Institution" placeholder="University of Lagos"
              value={form.school} onChange={set('school')} />
            <Input label="JAMB Reg. Number (optional)" placeholder="12345678AB"
              value={form.jamb_reg_number} onChange={set('jamb_reg_number')} />
            <p style={{ fontSize:'.8rem', color:'var(--text-3)', lineHeight:1.6 }}>
              Step 2 details are optional but help personalise your experience.
            </p>
          </>
        )}

        <div style={{ display:'flex', gap:10, marginTop:4 }}>
          {step === 2 && (
            <Button type="button" variant="secondary" onClick={() => setStep(1)} style={{ flex:1 }}>
              ← Back
            </Button>
          )}
          <Button type="submit" loading={loading} size="lg" style={{ flex:1 }}>
            {step === 1 ? 'Continue →' : 'Create Account'}
          </Button>
        </div>
      </form>
    </div>
  );
}
