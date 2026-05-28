'use client';

const colors = {
  blue:   { bg:'#e8f0fd', color:'#1a56db' },
  green:  { bg:'#dcfce7', color:'#16a34a' },
  yellow: { bg:'#fef9c3', color:'#ca8a04' },
  red:    { bg:'#fee2e2', color:'#dc2626' },
  orange: { bg:'#ffedd5', color:'#ea580c' },
  purple: { bg:'#f3e8ff', color:'#9333ea' },
  gray:   { bg:'#f1f5f9', color:'#64748b' },
  success:{ bg:'#dcfce7', color:'#16a34a' },
  danger: { bg:'#fee2e2', color:'#dc2626' },
  warning:{ bg:'#fef9c3', color:'#ca8a04' },
  info:   { bg:'#e8f0fd', color:'#1a56db' },
  default:{ bg:'#f1f5f9', color:'#64748b' },
};

export default function Badge({ children, color = 'blue', variant, icon, size, style }) {
  const key = variant || color;
  const c = colors[key] || colors.blue;
  const sm = size === 'sm';
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap: sm ? 4 : 6,
      padding: sm ? '2px 8px' : '3px 10px',
      borderRadius:99, fontSize: sm ? '.72rem' : '.78rem', fontWeight:600,
      background:c.bg, color:c.color, whiteSpace:'nowrap', ...style,
    }}>
      {icon && <span style={{ lineHeight:1 }}>{icon}</span>}
      {children}
    </span>
  );
}
