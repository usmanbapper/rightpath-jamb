'use client';

import Image from 'next/image';

export default function AuthLayout({ children }) {
  return (
    <div style={{
      minHeight:'100vh', display:'flex',
      background:'linear-gradient(135deg, #0e3fa8 0%, #1a56db 50%, #2563eb 100%)',
    }}>
      {/* Left panel */}
      <div style={{
        flex:1, display:'flex', flexDirection:'column', justifyContent:'center',
        padding:'60px 80px', color:'#fff',
      }} className="auth-left">
        <div style={{ marginBottom:48 }}>
          {/* Logo */}
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:32 }}>
            <div style={{
              width:64, height:64, background:'rgba(255,255,255,.95)',
              borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center',
              padding:6, boxShadow:'0 4px 20px rgba(0,0,0,.2)',
            }}>
              <Image src="/logo.png" alt="Rightpath Academy" width={52} height={52} style={{ objectFit:'contain' }} />
            </div>
            <div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:'1.4rem', fontWeight:800, lineHeight:1.1 }}>
                Rightpath Academy
              </div>
              <div style={{ fontSize:'.85rem', opacity:.75, marginTop:2 }}>JAMB Practice Platform</div>
            </div>
          </div>

          <h1 style={{
            fontFamily:'var(--font-display)', fontSize:'2.6rem', fontWeight:800,
            lineHeight:1.15, marginBottom:16,
          }}>
            Your Path to<br />JAMB Success
          </h1>
          <p style={{ fontSize:'1.05rem', opacity:.85, lineHeight:1.7, maxWidth:400 }}>
            Practice with real past questions, take timed mock exams, and track your improvement across all JAMB subjects.
          </p>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {[
            { emoji:'📝', text:'180 questions across 4 subjects — just like the real JAMB' },
            { emoji:'📊', text:'Detailed performance analytics and subject breakdowns' },
            { emoji:'🏆', text:'Earn badges and track your progress to success' },
          ].map(({ emoji, text }) => (
            <div key={text} style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
              <span style={{ fontSize:'1.2rem', flexShrink:0 }}>{emoji}</span>
              <span style={{ opacity:.85, lineHeight:1.5 }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — the form */}
      <div className="auth-right">
        <div style={{ width:'100%', maxWidth:400, animation:'fadeIn .35s ease both' }}>
          {/* Mobile logo */}
          <div className="auth-mobile-logo">
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24 }}>
              <div style={{
                width:44, height:44, background:'var(--brand)',
                borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center',
                padding:4,
              }}>
                <Image src="/logo.png" alt="Rightpath" width={36} height={36} style={{ objectFit:'contain' }} />
              </div>
              <div>
                <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'.95rem', color:'var(--brand)' }}>Rightpath Academy</div>
                <div style={{ fontSize:'.7rem', color:'var(--text-3)' }}>JAMB Practice Platform</div>
              </div>
            </div>
          </div>
          {children}
        </div>
      </div>

      <style suppressHydrationWarning>{`
        .auth-left {
          flex: 1;
        }

        .auth-right {
          width: 480px;
          background: var(--bg);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
        }

        .auth-mobile-logo {
          display: none;
        }

        @media (max-width: 900px) {
          .auth-left { display: none !important; }
        }

        @media (max-width: 600px) {
          .auth-right {
            width: 100%;
            min-height: 100vh;
            padding: 32px 20px;
            align-items: flex-start;
            padding-top: 48px;
          }

          .auth-mobile-logo {
            display: block;
          }
        }
      `}</style>
    </div>
  );
}
