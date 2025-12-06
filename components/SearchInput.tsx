'use client';

import { KeyboardEvent } from 'react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}

export default function SearchInput({ value, onChange, onSubmit, disabled }: Props) {
  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !disabled && value.trim()) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="search-box animate-gradient" style={{ background: 'linear-gradient(135deg, #00d4ff, #a855f7, #ec4899, #00d4ff)', backgroundSize: '300% 300%' }}>
      <div className="search-box-inner">
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKey}
          disabled={disabled}
          placeholder="What do you want to know?"
          rows={1}
          autoFocus
          className="search-input"
          style={{ minHeight: '28px', maxHeight: '120px' }}
          onInput={e => {
            const t = e.target as HTMLTextAreaElement;
            t.style.height = 'auto';
            t.style.height = Math.min(t.scrollHeight, 120) + 'px';
          }}
        />
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#555' }}>
            <kbd style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>Enter</kbd>
            <span>to search</span>
          </div>
          
          <button
            onClick={() => value.trim() && onSubmit()}
            disabled={disabled || !value.trim()}
            className="btn-gradient"
          >
            {disabled ? (
              <>
                <svg style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
                </svg>
                Searching...
              </>
            ) : (
              <>
                Search
                <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
