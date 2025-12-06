'use client';

import ReactMarkdown from 'react-markdown';

interface Props {
  answer: string;
  isStreaming: boolean;
}

export default function AnswerDisplay({ answer, isStreaming }: Props) {
  if (!answer && !isStreaming) return null;

  return (
    <div className="glass-card animate-fade-in" style={{ padding: '28px', marginBottom: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #00d4ff, #a855f7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        </div>
        <span style={{ fontWeight: 600, fontSize: '16px', fontFamily: "'Space Grotesk', sans-serif" }}>Answer</span>
        {isStreaming && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', color: '#00d4ff', fontSize: '13px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00d4ff', animation: 'pulse 1s infinite' }} />
            Generating...
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ color: '#ccc', lineHeight: 1.7, fontSize: '15px' }}>
        <ReactMarkdown
          components={{
            p: ({ children }) => <p style={{ marginBottom: '16px' }}>{children}</p>,
            a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: '#00d4ff', textDecoration: 'underline' }}>{children}</a>,
            ul: ({ children }) => <ul style={{ marginBottom: '16px', paddingLeft: '20px' }}>{children}</ul>,
            ol: ({ children }) => <ol style={{ marginBottom: '16px', paddingLeft: '20px' }}>{children}</ol>,
            li: ({ children }) => <li style={{ marginBottom: '8px' }}>{children}</li>,
            h1: ({ children }) => <h1 style={{ fontSize: '22px', fontWeight: 600, color: 'white', marginBottom: '12px', marginTop: '20px', fontFamily: "'Space Grotesk', sans-serif" }}>{children}</h1>,
            h2: ({ children }) => <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'white', marginBottom: '10px', marginTop: '16px', fontFamily: "'Space Grotesk', sans-serif" }}>{children}</h2>,
            h3: ({ children }) => <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'white', marginBottom: '8px', marginTop: '12px' }}>{children}</h3>,
            code: ({ className, children }) => {
              const isBlock = className?.includes('language-');
              return isBlock ? (
                <pre style={{ background: '#0a0a12', padding: '16px', borderRadius: '8px', overflow: 'auto', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <code style={{ color: '#00d4ff', fontSize: '14px', fontFamily: 'monospace' }}>{children}</code>
                </pre>
              ) : (
                <code style={{ background: 'rgba(0,212,255,0.1)', color: '#00d4ff', padding: '2px 6px', borderRadius: '4px', fontSize: '14px' }}>{children}</code>
              );
            },
            blockquote: ({ children }) => <blockquote style={{ borderLeft: '3px solid #a855f7', paddingLeft: '16px', color: '#999', fontStyle: 'italic', margin: '16px 0' }}>{children}</blockquote>,
            strong: ({ children }) => <strong style={{ color: 'white', fontWeight: 600 }}>{children}</strong>,
          }}
        >
          {answer}
        </ReactMarkdown>
        {isStreaming && <span style={{ display: 'inline-block', width: '2px', height: '18px', background: '#00d4ff', marginLeft: '2px', animation: 'blink 1s infinite' }} />}
      </div>

      <style jsx>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  );
}
