'use client';

import { useState } from 'react';
import SearchInput from '@/components/SearchInput';
import LoadingIndicator from '@/components/LoadingIndicator';
import AnswerDisplay from '@/components/AnswerDisplay';
import SourcesList from '@/components/SourcesList';
import ErrorMessage from '@/components/ErrorMessage';
import { Source } from '@/types';

export default function Home() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState<Source[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const resetState = () => {
    setAnswer('');
    setSources([]);
    setError(null);
    setIsStreaming(false);
  };

  const handleStreamResponse = async (response: Response) => {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    if (!reader) throw new Error('No reader');
    setIsStreaming(true);

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value, { stream: true }).split('\n')) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);
            if (data.type === 'answer') setAnswer(p => p + data.content);
            else if (data.type === 'sources') setSources(data.content);
            else if (data.type === 'error') { setError(data.content); break; }
            else if (data.type === 'done') break;
          } catch {}
        }
      }
    } finally { setIsStreaming(false); }
  };

  const handleSubmit = async () => {
    if (!query.trim()) return;
    resetState();
    setIsLoading(true);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Failed');
      await handleStreamResponse(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally { setIsLoading(false); }
  };

  const hasResults = answer || sources.length > 0;

  return (
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ padding: '24px 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #00d4ff, #a855f7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <span className="glow" style={{ fontSize: '24px', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: '#00d4ff' }}>
              minipplx
            </span>
          </div>
          <span style={{ fontSize: '12px', color: '#666', letterSpacing: '2px', textTransform: 'uppercase' }}>
            AI Search
          </span>
        </div>
      </header>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: hasResults ? 'flex-start' : 'center', paddingBottom: hasResults ? '0' : '100px' }}>
        
        {/* Hero - only show when no results */}
        {!hasResults && (
          <div className="animate-fade-in" style={{ textAlign: 'center', marginBottom: '48px' }}>
            {/* Animated icon */}
            <div className="animate-float" style={{ marginBottom: '32px' }}>
              <div className="animate-pulse-glow" style={{
                width: '80px',
                height: '80px',
                margin: '0 auto',
                borderRadius: '24px',
                background: 'linear-gradient(135deg, #00d4ff, #a855f7, #ec4899)',
                padding: '3px'
              }}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '21px',
                  background: '#0a0a12',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="url(#iconGrad)" strokeWidth="1.5">
                    <defs>
                      <linearGradient id="iconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#00d4ff" />
                        <stop offset="100%" stopColor="#a855f7" />
                      </linearGradient>
                    </defs>
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                    <path d="M11 8v6M8 11h6" />
                  </svg>
                </div>
              </div>
            </div>

            <h1 style={{ fontSize: '48px', fontWeight: 700, marginBottom: '16px', fontFamily: "'Space Grotesk', sans-serif" }}>
              <span className="gradient-text">Ask Anything</span>
            </h1>
            <p style={{ fontSize: '18px', color: '#888', maxWidth: '500px', margin: '0 auto' }}>
              AI-powered search that finds answers across the web
            </p>
          </div>
        )}

        {/* Search */}
        <div className="container" style={{ marginBottom: '32px' }}>
          <SearchInput value={query} onChange={setQuery} onSubmit={handleSubmit} disabled={isLoading} />
        </div>

        {/* Results */}
        <div className="container">
          {isLoading && !answer && <LoadingIndicator isVisible />}
          {error && <ErrorMessage message={error} onRetry={resetState} />}
          {answer && <AnswerDisplay answer={answer} isStreaming={isStreaming} />}
          {sources.length > 0 && <SourcesList sources={sources} />}
        </div>
      </div>

      {/* Footer */}
      <footer style={{ padding: '20px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <p style={{ textAlign: 'center', fontSize: '13px', color: '#555' }}>
          Powered by <span style={{ color: '#00d4ff' }}>Exa</span> & <span style={{ color: '#a855f7' }}>Mistral</span>
        </p>
      </footer>
    </main>
  );
}
