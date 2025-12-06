import { Source } from '@/types';

interface Props {
  sources: Source[];
}

export default function SourcesList({ sources }: Props) {
  if (!sources?.length) return null;

  return (
    <div className="glass-card animate-fade-in" style={{ padding: '28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #a855f7, #ec4899)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </div>
        <span style={{ fontWeight: 600, fontSize: '16px', fontFamily: "'Space Grotesk', sans-serif" }}>Sources</span>
        <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#666' }}>{sources.length} references</span>
      </div>

      {/* Sources */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {sources.map((source, i) => (
          <a
            key={source.id}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px',
              padding: '16px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(168,85,247,0.1)';
              e.currentTarget.style.borderColor = 'rgba(168,85,247,0.3)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
            }}
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(236,72,153,0.2))',
              border: '1px solid rgba(168,85,247,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: '14px',
              color: '#a855f7',
              flexShrink: 0
            }}>
              {i + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontWeight: 500, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {source.title}
                </span>
                <svg style={{ width: '14px', height: '14px', color: '#666', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
                </svg>
              </div>
              <div style={{ fontSize: '13px', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {source.url}
              </div>
              {source.snippet && (
                <div style={{ fontSize: '14px', color: '#888', marginTop: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {source.snippet}
                </div>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
