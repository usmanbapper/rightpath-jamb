'use client';

export default function Spinner({ size = 24, color = 'var(--brand)', style }) {
  return (
    <div role="status" aria-label="Loading" style={{
      width:size, height:size,
      border:`${Math.max(2, Math.floor(size/10))}px solid ${color}22`,
      borderTopColor:color, borderRadius:'50%',
      animation:'spin .7s linear infinite', flexShrink:0,
      ...style,
    }} />
  );
}
