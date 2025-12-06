'use client';

interface Props {
  isVisible: boolean;
}

export default function LoadingIndicator({ isVisible }: Props) {
  if (!isVisible) return null;

  return (
    <div className="glass-card animate-fade-in" style={{ padding: '28px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #00d4ff, #a855f7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'pulse 2s infinite'
        }}>
          <svg style={{ width: '20px', height: '20px', animation: 'spin 2s linear infinite' }} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
          </svg>
        </div>
        <div>
          <div style={{ fontWeight: 600, marginBottom: '4px', fontFamily: "'Space Grotesk', sans-serif" }}>Searching the web...</div>
          <div style={{ fontSize: '14px', color: '#666' }}>Finding and analyzing sources</div>
        </div>
      </div>

      {/* Skeleton */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ height: '16px', background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 100%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: '8px', width: '100%' }} />
        <div style={{ height: '16px', background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 100%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite 0.1s', borderRadius: '8px', width: '90%' }} />
        <div style={{ height: '16px', background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 100%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite 0.2s', borderRadius: '8px', width: '75%' }} />
      </div>

      <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>
    </div>
  );
}
