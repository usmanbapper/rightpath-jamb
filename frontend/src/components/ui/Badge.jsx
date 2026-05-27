'use client';

const presets = {
  success: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  danger:  { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  warning: { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
  info:    { bg: 'var(--brand-light)', color: 'var(--brand)', border: '#c7d7fd' },
  default: { bg: 'var(--surface-2)', color: 'var(--text-2)', border: 'var(--border)' },
};

/**
 * Badge / pill component.
 *
 * Props:
 *  variant  — 'success' | 'danger' | 'warning' | 'info' | 'default'
 *  icon     — React element (e.g. emoji string or lucide icon)
 *  size     — 'sm' | 'md' (default 'md')
 *  style    — inline style overrides
 */
export default function Badge({ children, variant = 'default', icon, size = 'md', style, ...props }) {
  const { bg, color, border } = presets[variant] || presets.default;
  const sm = size === 'sm';

  return (
    <span
      style={{
        display:      'inline-flex',
        alignItems:   'center',
        gap:          sm ? 4 : 6,
        padding:      sm ? '2px 8px' : '4px 12px',
        borderRadius: 999,
        fontSize:     sm ? '.72rem' : '.8rem',
        fontWeight:   600,
        lineHeight:   1.4,
        background:   bg,
        color,
        border:       `1px solid ${border}`,
        whiteSpace:   'nowrap',
        ...style,
      }}
      {...props}
    >
      {icon && <span style={{ fontSize: sm ? '1em' : '1.1em', lineHeight: 1 }}>{icon}</span>}
      {children}
    </span>
  );
}
