'use client';

export default function Card({ children, style, onClick, ...props }) {
  return (
    <div
      onClick={onClick}
      style={{
        background:'var(--surface)', borderRadius:'var(--radius)',
        border:'1px solid var(--border)', padding:'20px 24px',
        boxShadow:'var(--shadow)', cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
