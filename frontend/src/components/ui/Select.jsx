'use client';

export default function Select({ label, error, options = [], style, ...props }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6, ...style }}>
      {label && <label style={{ fontSize:'.85rem', fontWeight:600, color:'var(--text-2)' }}>{label}</label>}
      <select style={{
        width:'100%', padding:'11px 14px',
        border:`1.5px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
        borderRadius:'var(--radius-sm)', background:'var(--surface)',
        color:'var(--text)', fontSize:'.95rem',
      }} {...props}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <span style={{ fontSize:'.8rem', color:'var(--danger)' }}>{error}</span>}
    </div>
  );
}
