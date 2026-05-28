'use client';

export default function Button({ children, variant = 'primary', size = 'md', loading, style, ...props }) {
  return (
    <button
      disabled={loading || props.disabled}
      style={{
        display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8,
        fontFamily:'var(--font-body)', fontWeight:600, borderRadius:'var(--radius-sm)',
        transition:'all .18s',
        padding: size === 'lg' ? '14px 28px' : size === 'sm' ? '6px 14px' : '10px 20px',
        fontSize: size === 'lg' ? '1rem' : size === 'sm' ? '.825rem' : '.9rem',
        opacity: (loading || props.disabled) ? .65 : 1,
        cursor: (loading || props.disabled) ? 'not-allowed' : 'pointer',
        background: variant === 'primary' ? 'var(--brand)'
          : variant === 'danger'    ? 'var(--danger)'
          : variant === 'success'   ? 'var(--success)'
          : variant === 'secondary' ? 'var(--surface)'
          : 'transparent',
        color: variant === 'ghost' ? 'var(--text-2)'
          : variant === 'secondary' ? 'var(--brand)'
          : '#fff',
        border: variant === 'secondary' ? '1.5px solid var(--brand)' : 'none',
        boxShadow: variant === 'primary' ? '0 2px 12px rgba(26,86,219,.25)' : 'none',
        ...style,
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
