
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import {
  LayoutDashboard, BookOpen, History, Award, User,
  Users, FileQuestion, Key, LogOut, Target, ChevronRight,
} from 'lucide-react';

const studentNav = [
  { href:'/dashboard',    label:'Dashboard',   icon:LayoutDashboard },
  { href:'/exam/start',   label:'Start Exam',  icon:Target },
  { href:'/exam/history', label:'History',     icon:History },
  { href:'/profile',      label:'Profile',     icon:User },
];

const adminNav = [
  { href:'/admin',           label:'Dashboard', icon:LayoutDashboard },
  { href:'/admin/students',  label:'Students',  icon:Users },
  { href:'/admin/questions', label:'Questions', icon:FileQuestion },
  { href:'/admin/codes',     label:'Codes',     icon:Key },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, isAdmin } = useAuthStore();
  const nav = isAdmin() ? adminNav : studentNav;

  return (
    <aside style={{
      width:240, background:'var(--surface)', borderRight:'1px solid var(--border)',
      display:'flex', flexDirection:'column', height:'100vh', position:'sticky', top:0,
      flexShrink:0,
    }}>
      {/* Logo */}
      <div style={{ padding:'24px 20px 20px', borderBottom:'1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{
            width:36, height:36, background:'var(--brand)', borderRadius:10,
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <Target size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'1rem', color:'var(--brand)', lineHeight:1.1 }}>Rightpath</div>
            <div style={{ fontSize:'.7rem', color:'var(--text-3)', fontWeight:500 }}>JAMB Practice</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:'16px 12px', display:'flex', flexDirection:'column', gap:2 }}>
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && href !== '/admin' && pathname.startsWith(href));
          return (
            <Link key={href} href={href} style={{
              display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
              borderRadius:'var(--radius-sm)', fontWeight:500, fontSize:'.9rem',
              transition:'all .18s',
              background: active ? 'var(--brand-light)' : 'transparent',
              color: active ? 'var(--brand)' : 'var(--text-2)',
            }}>
              <Icon size={18} />
              {label}
              {active && <ChevronRight size={14} style={{ marginLeft:'auto' }} />}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div style={{ padding:'16px 12px', borderTop:'1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
          <div style={{
            width:36, height:36, borderRadius:'50%', background:'var(--brand-light)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:'var(--font-display)', fontWeight:700, color:'var(--brand)', fontSize:'.9rem',
          }}>
            {user?.full_name?.[0]?.toUpperCase() || '?'}
          </div>
          <div style={{ overflow:'hidden' }}>
            <div style={{ fontWeight:600, fontSize:'.85rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
              {user?.full_name}
            </div>
            <div style={{ fontSize:'.75rem', color:'var(--text-3)', textTransform:'capitalize' }}>{user?.role}</div>
          </div>
        </div>
        <button onClick={logout} style={{
          width:'100%', display:'flex', alignItems:'center', gap:8, padding:'8px 12px',
          borderRadius:'var(--radius-sm)', border:'none', background:'transparent',
          color:'var(--danger)', fontSize:'.85rem', fontWeight:500, cursor:'pointer',
          transition:'background .18s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </aside>
  );
}


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
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
        <Spinner size={40} />
      </div>
    );
  }
  if (!user) return null;

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <Sidebar />
      <main style={{ flex:1, minWidth:0, padding:'32px 36px', overflowY:'auto' }}>
        {children}
      </main>
    </div>
  );
}