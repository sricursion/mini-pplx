'use client';

interface Props {
  message: string;
  onRetry: () => void;
}

export default function ErrorMessage({ message, onRetry }: Props) {
  return (
    <div className="animate-fade-in" style={{
      padding: '20px 24px',
      borderRadius: '16px',
      background: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.2)',
      marginBottom: '24px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: 'rgba(239, 68, 68, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, color: '#ef4444', marginBottom: '4px' }}>Error</div>
          <div style={{ fontSize: '14px', color: '#fca5a5' }}>{message}</div>
        </div>

        <button
          onClick={onRetry}
          style={{
            padding: '10px 20px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 4v6h6M23 20v-6h-6" />
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
          </svg>
          Retry
        </button>
      </div>
    </div>
  );
}
