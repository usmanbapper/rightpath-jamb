
import { cn } from '@/lib/utils';

const variants = {
  primary:  'bg-brand text-white hover:bg-brand-dark shadow-brand',
  secondary:'bg-surface text-brand border border-brand hover:bg-brand-light',
  danger:   'bg-danger text-white hover:opacity-90',
  ghost:    'bg-transparent text-text-2 hover:bg-border',
  success:  'bg-success text-white hover:opacity-90',
};

export default function Button({ children, variant = 'primary', size = 'md', loading, className, ...props }) {
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-5 py-2.5 text-sm', lg: 'px-7 py-3.5 text-base' };
  return (
    <button
      disabled={loading || props.disabled}
      className={cn('btn', className)}
      style={{
        display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8,
        fontFamily:'var(--font-body)', fontWeight:600, borderRadius:'var(--radius-sm)',
        border:'none', transition:'all .18s',
        padding: size === 'lg' ? '14px 28px' : size === 'sm' ? '6px 14px' : '10px 20px',
        fontSize: size === 'lg' ? '1rem' : size === 'sm' ? '.825rem' : '.9rem',
        opacity: (loading || props.disabled) ? .65 : 1,
        cursor: (loading || props.disabled) ? 'not-allowed' : 'pointer',
        background: variant === 'primary' ? 'var(--brand)'
          : variant === 'danger' ? 'var(--danger)'
          : variant === 'success' ? 'var(--success)'
          : variant === 'secondary' ? 'var(--surface)'
          : 'transparent',
        color: variant === 'ghost' ? 'var(--text-2)'
          : variant === 'secondary' ? 'var(--brand)'
          : '#fff',
        border: variant === 'secondary' ? '1.5px solid var(--brand)' : 'none',
        boxShadow: variant === 'primary' ? '0 2px 12px rgba(26,86,219,.25)' : 'none',
      }}
      {...props}
    >
      {loading && (
        <span style={{ width:16, height:16, border:'2px solid rgba(255,255,255,.4)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin .7s linear infinite', flexShrink:0 }} />
      )}
      {children}
    </button>
  );
}

'use client';

export default function Input({ label, error, icon, className, ...props }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      {label && (
        <label style={{ fontSize:'.85rem', fontWeight:600, color:'var(--text-2)' }}>
          {label}
        </label>
      )}
      <div style={{ position:'relative' }}>
        {icon && (
          <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-3)', display:'flex' }}>
            {icon}
          </span>
        )}
        <input
          style={{
            width:'100%', padding: icon ? '11px 14px 11px 40px' : '11px 14px',
            border:`1.5px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
            borderRadius:'var(--radius-sm)', background:'var(--surface)',
            color:'var(--text)', fontSize:'.95rem', transition:'border-color .18s',
          }}
          onFocus={e => { e.target.style.borderColor = error ? 'var(--danger)' : 'var(--brand)'; }}
          onBlur={e  => { e.target.style.borderColor = error ? 'var(--danger)' : 'var(--border)'; }}
          {...props}
        />
      </div>
      {error && <span style={{ fontSize:'.8rem', color:'var(--danger)' }}>{error}</span>}
    </div>
  );
}

export default function Card({ children, style, ...props }) {
  return (
    <div style={{
      background:'var(--surface)', borderRadius:'var(--radius)',
      boxShadow:'var(--shadow)', padding:24, ...style,
    }} {...props}>
      {children}
    </div>
  );
}


const colors = {
  blue:   { bg:'#e8f0fd', color:'#1a56db' },
  green:  { bg:'#dcfce7', color:'#16a34a' },
  yellow: { bg:'#fef9c3', color:'#ca8a04' },
  red:    { bg:'#fee2e2', color:'#dc2626' },
  orange: { bg:'#ffedd5', color:'#ea580c' },
  purple: { bg:'#f3e8ff', color:'#9333ea' },
  gray:   { bg:'#f1f5f9', color:'#64748b' },
};

export default function Badge({ children, color = 'blue', style }) {
  const c = colors[color] || colors.blue;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:4,
      padding:'3px 10px', borderRadius:99, fontSize:'.78rem', fontWeight:600,
      background:c.bg, color:c.color, ...style,
    }}>
      {children}
    </span>
  );
}
EOF


export default function Spinner({ size = 24, color = 'var(--brand)' }) {
  return (
    <div style={{
      width:size, height:size, border:`3px solid ${color}22`,
      borderTopColor:color, borderRadius:'50%',
      animation:'spin .7s linear infinite', flexShrink:0,
    }} />
  );
}


import { useEffect } from 'react';

export default function Modal({ open, onClose, title, children, width = 520 }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0, background:'rgba(15,23,42,.5)',
      display:'flex', alignItems:'center', justifyContent:'center',
      zIndex:1000, padding:16, backdropFilter:'blur(4px)',
    }}>
      <div onClick={e => e.stopPropagation()} className="animate-pop" style={{
        background:'var(--surface)', borderRadius:'var(--radius-lg)',
        width:'100%', maxWidth:width, maxHeight:'90vh', overflowY:'auto',
        boxShadow:'var(--shadow-lg)',
      }}>
        {title && (
          <div style={{ padding:'20px 24px 0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.1rem' }}>{title}</h3>
            <button onClick={onClose} style={{ background:'none', border:'none', fontSize:22, color:'var(--text-3)', lineHeight:1 }}>×</button>
          </div>
        )}
        <div style={{ padding:24 }}>{children}</div>
      </div>
    </div>
  );
}



export default function Select({ label, error, options = [], ...props }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      {label && <label style={{ fontSize:'.85rem', fontWeight:600, color:'var(--text-2)' }}>{label}</label>}
      <select style={{
        width:'100%', padding:'11px 14px',
        border:`1.5px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
        borderRadius:'var(--radius-sm)', background:'var(--surface)',
        color:'var(--text)', fontSize:'.95rem', appearance:'auto',
      }} {...props}>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <span style={{ fontSize:'.8rem', color:'var(--danger)' }}>{error}</span>}
    </div>
  );
}