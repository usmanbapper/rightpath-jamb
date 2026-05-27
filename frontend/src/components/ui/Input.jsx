'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Input component with optional label, left icon, and error message.
 * Supports password-reveal toggle automatically on type="password".
 */
export default function Input({ label, error, icon, className, style, type = 'text', ...props }) {
  const [showPwd, setShowPwd] = useState(false);
  const isPassword = type === 'password';
  const inputType  = isPassword ? (showPwd ? 'text' : 'password') : type;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      {label && (
        <label style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--text-2)' }}>
          {label}
        </label>
      )}

      <div style={{ position: 'relative' }}>
        {/* Left icon */}
        {icon && (
          <span style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-3)', pointerEvents: 'none', display: 'flex',
          }}>
            {icon}
          </span>
        )}

        <input
          type={inputType}
          className={className}
          style={{
            width:        '100%',
            padding:      `11px ${isPassword ? 40 : 14}px 11px ${icon ? 38 : 14}px`,
            border:       `1.5px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-sm)',
            background:   'var(--surface)',
            color:        'var(--text)',
            fontSize:     '.95rem',
            outline:      'none',
            transition:   'border-color .18s, box-shadow .18s',
          }}
          onFocus={e => {
            e.target.style.borderColor = error ? 'var(--danger)' : 'var(--brand)';
            e.target.style.boxShadow   = `0 0 0 3px ${error ? 'rgba(239,68,68,.1)' : 'rgba(26,86,219,.1)'}`;
          }}
          onBlur={e => {
            e.target.style.borderColor = error ? 'var(--danger)' : 'var(--border)';
            e.target.style.boxShadow   = 'none';
          }}
          {...props}
        />

        {/* Password reveal toggle */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPwd(v => !v)}
            style={{
              position:   'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', padding: 0,
              color:      'var(--text-3)', cursor: 'pointer', display: 'flex',
            }}
            tabIndex={-1}
            aria-label={showPwd ? 'Hide password' : 'Show password'}
          >
            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>

      {error && (
        <span style={{ fontSize: '.8rem', color: 'var(--danger)', fontWeight: 500 }}>
          {error}
        </span>
      )}
    </div>
  );
}
