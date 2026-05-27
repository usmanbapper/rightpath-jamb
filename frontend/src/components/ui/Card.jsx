'use client';

export default function Card({ children, className, style, onClick, hoverable, ...props }) {
  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        background:   'var(--surface)',
        borderRadius: 'var(--radius)',
        border:       '1px solid var(--border)',
        padding:      '20px 24px',
        boxShadow:    'var(--shadow)',
        transition:   hoverable ? 'box-shadow .2s, transform .2s' : undefined,
        cursor:       onClick ? 'pointer' : undefined,
        ...(hoverable && {
          ':hover': {
            boxShadow: 'var(--shadow-lg)',
            transform: 'translateY(-2px)',
          },
        }),
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
