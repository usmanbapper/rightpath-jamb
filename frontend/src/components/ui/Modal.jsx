'use client';

import { useEffect } from 'react';

export default function Modal({ open, onClose, title, children, width = 520 }) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16, backdropFilter:'blur(4px)' }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'var(--surface)', borderRadius:'var(--radius-lg)', width:'100%', maxWidth:width, maxHeight:'90vh', overflowY:'auto', boxShadow:'var(--shadow-lg)' }}>
        {title && (
          <div style={{ padding:'20px 24px 0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.1rem', fontWeight:700 }}>{title}</h3>
            <button onClick={onClose} style={{ background:'none', border:'none', fontSize:22, color:'var(--text-3)', lineHeight:1, cursor:'pointer' }}>×</button>
          </div>
        )}
        <div style={{ padding:24 }}>{children}</div>
      </div>
    </div>
  );
}
