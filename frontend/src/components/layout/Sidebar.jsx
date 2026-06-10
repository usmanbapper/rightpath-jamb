'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import {
  LayoutDashboard, History, User,
  Users, FileQuestion, Key, LogOut, Target, ChevronRight, X,
} from 'lucide-react';

const studentNav = [
  { href:'/dashboard',    label:'Dashboard', icon:LayoutDashboard },
  { href:'/exam/start',   label:'Start Exam', icon:Target },
  { href:'/exam/history', label:'History',    icon:History },
  { href:'/profile',      label:'Profile',    icon:User },
];

const adminNav = [
  { href:'/admin',             label:'Dashboard', icon:LayoutDashboard },
  { href:'/admin/students',    label:'Students',  icon:Users },
  { href:'/admin/questions',   label:'Questions', icon:FileQuestion },
  { href:'/admin/codes',       label:'Codes',     icon:Key },
];

export default function Sidebar({ open, onClose }) {
  const pathname = usePathname();
  const { user, logout, isAdmin } = useAuthStore();
  const nav = isAdmin() ? adminNav : studentNav;

  return (
    <>
      <aside className={`sidebar ${open ? 'sidebar--open' : ''}`}>
        {/* Close button (mobile only) */}
        <button
          onClick={onClose}
          className="sidebar-close"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>

        {/* Logo */}
        <div style={{ padding:'20px 20px 16px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Image
              src="/logo.png"
              alt="Rightpath Academy"
              width={48}
              height={48}
              style={{ objectFit:'contain', borderRadius:8 }}
            />
            <div>
              <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'.95rem', color:'var(--brand)', lineHeight:1.2 }}>Rightpath</div>
              <div style={{ fontSize:'.7rem', color:'var(--text-3)', fontWeight:500 }}>JAMB Practice</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'16px 12px', display:'flex', flexDirection:'column', gap:2 }}>
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && href !== '/admin' && pathname.startsWith(href));
            return (
              <Link key={href} href={href} onClick={onClose} style={{
                display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
                borderRadius:'var(--radius-sm)', fontWeight:500, fontSize:'.9rem',
                transition:'all .18s',
                background: active ? 'var(--brand-light)' : 'transparent',
                color: active ? 'var(--brand)' : 'var(--text-2)',
                textDecoration:'none',
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
              flexShrink:0,
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

      <style>{`
        .sidebar {
          width: 240px;
          background: var(--surface);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          height: 100vh;
          position: sticky;
          top: 0;
          flex-shrink: 0;
          transition: transform .25s ease;
        }

        .sidebar-close {
          display: none;
        }

        @media (max-width: 768px) {
          .sidebar {
            position: fixed;
            top: 0;
            left: 0;
            height: 100vh;
            z-index: 50;
            transform: translateX(-100%);
            box-shadow: var(--shadow-lg);
          }

          .sidebar--open {
            transform: translateX(0);
          }

          .sidebar-close {
            display: flex;
            align-items: center;
            justify-content: center;
            position: absolute;
            top: 12px;
            right: 12px;
            background: none;
            border: none;
            color: var(--text-2);
            cursor: pointer;
            padding: 4px;
            border-radius: var(--radius-sm);
          }
        }
      `}</style>
    </>
  );
}
