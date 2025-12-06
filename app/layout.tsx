import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "minipplx - AI Search",
  description: "AI-powered search engine",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div style={{
          position: 'fixed',
          top: '-50%',
          left: '-20%',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(0,212,255,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0
        }} />
        <div style={{
          position: 'fixed',
          bottom: '-30%',
          right: '-10%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0
        }} />
        <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </body>
    </html>
  );
}
