'use client';

/**
 * Spinner component.
 * Props:
 *  size   — number in px (default 24)
 *  color  — CSS color string (default 'var(--brand)')
 *  style  — additional inline styles
 */
export default function Spinner({ size = 24, color = 'var(--brand)', style }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      style={{
        display:         'inline-block',
        width:           size,
        height:          size,
        border:          `${Math.max(2, size / 10)}px solid ${color}22`,
        borderTopColor:  color,
        borderRadius:    '50%',
        animation:       'spin .7s linear infinite',
        flexShrink:      0,
        ...style,
      }}
    />
  );
}
