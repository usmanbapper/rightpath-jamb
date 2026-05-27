
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { User, Lock, Key, Award, Bell } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { userApi, activationApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { formatDate, getErrorMessage } from '@/lib/utils';

const STATES = ['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara'];

function Section({ title, icon: Icon, children }) {
  return (
    <Card style={{ marginBottom:20 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20, paddingBottom:16, borderBottom:'1px solid var(--border)' }}>
        <div style={{ width:36,height:36,background:'var(--brand-light)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center' }}>
          <Icon size={18} color="var(--brand)" />
        </div>
        <h3 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:'1rem' }}>{title}</h3>
      </div>
      {children}
    </Card>
  );
}

export default function ProfilePage() {
  const { user, fetchUser } = useAuthStore();
  const [profile, setProfile] = useState({ full_name:'', phone:'', state:'', school:'', jamb_reg_number:'' });
  const [passwords, setPasswords] = useState({ current_password:'', new_password:'', confirm:'' });
  const [activation, setActivation] = useState(null);
  const [code, setCode] = useState('');
  const [badges, setBadges] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [saving, setSaving] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);
  const [redeemingCode, setRedeemingCode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [actRes, badgeRes, notifRes] = await Promise.all([
          activationApi.getStatus(),
          userApi.getBadges(),
          userApi.getNotifications(),
        ]);
        setActivation(actRes.data);
        setBadges(badgeRes.data.badges);
        setNotifications(notifRes.data.notifications);
      } catch {}
      if (user) {
        setProfile({
          full_name: user.full_name || '',
          phone: user.phone || '',
          state: user.state || '',
          school: user.school || '',
          jamb_reg_number: user.jamb_reg_number || '',
        });
      }
      setLoading(false);
    }
    load();
  }, [user]);

  async function saveProfile(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await userApi.updateProfile(profile);
      await fetchUser();
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    if (passwords.new_password !== passwords.confirm) { toast.error('Passwords do not match.'); return; }
    setChangingPwd(true);
    try {
      await userApi.changePassword({ current_password: passwords.current_password, new_password: passwords.new_password });
      toast.success('Password changed!');
      setPasswords({ current_password:'', new_password:'', confirm:'' });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setChangingPwd(false);
    }
  }

  async function redeemCode(e) {
    e.preventDefault();
    setRedeemingCode(true);
    try {
      const res = await activationApi.redeem(code.trim().toUpperCase());
      toast.success(res.data.message);
      setActivation(res.data.activation);
      setCode('');
      await fetchUser();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setRedeemingCode(false);
    }
  }

  async function markAllRead() {
    try {
      await userApi.markAllRead();
      setNotifications(n => n.map(x => ({ ...x, is_read:true })));
    } catch {}
  }

  if (loading) return <AppShell><div style={{ display:'flex',justifyContent:'center',padding:80 }}><Spinner size={40} /></div></AppShell>;

  return (
    <AppShell>
      <div className="animate-fade" style={{ maxWidth:680 }}>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:'1.8rem', fontWeight:800, marginBottom:28 }}>My Profile</h1>

        {/* Subscription */}
        <Section title="Subscription" icon={Key}>
          {activation?.is_active ? (
            <div style={{ display:'flex', alignItems:'center', gap:16, padding:'14px 18px', background:'#f0fdf4', borderRadius:'var(--radius-sm)', border:'1px solid #86efac', marginBottom:16 }}>
              <div style={{ fontSize:'1.5rem' }}>✅</div>
              <div>
                <div style={{ fontWeight:700, color:'var(--success)' }}>Active Subscription</div>
                <div style={{ fontSize:'.85rem', color:'var(--text-2)', marginTop:2 }}>
                  {activation.days_remaining} day{activation.days_remaining !== 1 ? 's' : ''} remaining · Expires {formatDate(activation.expires_at)}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding:'14px 18px', background:'var(--accent-light)', borderRadius:'var(--radius-sm)', border:'1px solid #fcd34d', marginBottom:16 }}>
              <div style={{ fontWeight:700, color:'#92400e', marginBottom:4 }}>No active subscription</div>
              <div style={{ fontSize:'.85rem', color:'var(--text-2)' }}>Redeem a code below to unlock exam access.</div>
            </div>
          )}
          <form onSubmit={redeemCode} style={{ display:'flex', gap:10 }}>
            <Input
              placeholder="XXXX-XXXX-XXXX-XXXX"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              style={{ flex:1 }}
            />
            <Button type="submit" loading={redeemingCode} disabled={!code}>Redeem</Button>
          </form>
        </Section>

        {/* Profile info */}
        <Section title="Personal Information" icon={User}>
          <form onSubmit={saveProfile} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <Input label="Full name" value={profile.full_name} onChange={e => setProfile(p => ({ ...p, full_name:e.target.value }))} />
            <Input label="Phone number" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone:e.target.value }))} />
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <label style={{ fontSize:'.85rem', fontWeight:600, color:'var(--text-2)' }}>State</label>
              <select value={profile.state} onChange={e => setProfile(p => ({ ...p, state:e.target.value }))} style={{ padding:'11px 14px', border:'1.5px solid var(--border)', borderRadius:'var(--radius-sm)', background:'var(--surface)', fontSize:'.95rem' }}>
                <option value="">Select state…</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <Input label="School" value={profile.school} onChange={e => setProfile(p => ({ ...p, school:e.target.value }))} />
            <Input label="JAMB Reg. Number" value={profile.jamb_reg_number} onChange={e => setProfile(p => ({ ...p, jamb_reg_number:e.target.value }))} />
            <Button type="submit" loading={saving} style={{ alignSelf:'flex-start' }}>Save Changes</Button>
          </form>
        </Section>

        {/* Change password */}
        <Section title="Change Password" icon={Lock}>
          <form onSubmit={changePassword} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <Input label="Current password" type="password" value={passwords.current_password} onChange={e => setPasswords(p => ({ ...p, current_password:e.target.value }))} required />
            <Input label="New password" type="password" placeholder="Min 8 chars, 1 uppercase, 1 number" value={passwords.new_password} onChange={e => setPasswords(p => ({ ...p, new_password:e.target.value }))} required />
            <Input label="Confirm new password" type="password" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm:e.target.value }))} required />
            <Button type="submit" loading={changingPwd} style={{ alignSelf:'flex-start' }}>Update Password</Button>
          </form>
        </Section>

        {/* Badges */}
        <Section title="My Badges" icon={Award}>
          {badges.length === 0 ? (
            <p style={{ color:'var(--text-3)', textAlign:'center', padding:'20px 0' }}>Complete exams to earn badges!</p>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12 }}>
              {badges.map(b => (
                <div key={b.id} style={{ padding:'14px', background:'var(--surface-2)', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)', textAlign:'center' }}>
                  <div style={{ fontSize:'2rem', marginBottom:8 }}>{b.icon || '🏅'}</div>
                  <div style={{ fontWeight:700, fontSize:'.9rem', marginBottom:4 }}>{b.name}</div>
                  <div style={{ fontSize:'.75rem', color:'var(--text-3)', marginBottom:8 }}>{b.description}</div>
                  <Badge color={b.rarity==='legendary'?'orange':b.rarity==='epic'?'purple':b.rarity==='rare'?'blue':'gray'} style={{ fontSize:'.7rem' }}>
                    {b.rarity}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Notifications */}
        <Section title="Notifications" icon={Bell}>
          {notifications.length === 0 ? (
            <p style={{ color:'var(--text-3)', textAlign:'center', padding:'20px 0' }}>No notifications yet.</p>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={markAllRead} style={{ marginBottom:12 }}>Mark all read</Button>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {notifications.map(n => (
                  <div key={n.id} style={{
                    padding:'12px 14px', borderRadius:'var(--radius-sm)',
                    background: n.is_read ? 'var(--surface-2)' : 'var(--brand-light)',
                    border:`1px solid ${n.is_read ? 'var(--border)' : '#c7d7fd'}`,
                    opacity: n.is_read ? .7 : 1,
                  }}>
                    <div style={{ fontWeight:600, fontSize:'.88rem', marginBottom:2 }}>{n.title}</div>
                    <div style={{ fontSize:'.82rem', color:'var(--text-2)' }}>{n.message}</div>
                    <div style={{ fontSize:'.72rem', color:'var(--text-3)', marginTop:4 }}>{formatDate(n.created_at)}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Section>
      </div>
    </AppShell>
  );
}