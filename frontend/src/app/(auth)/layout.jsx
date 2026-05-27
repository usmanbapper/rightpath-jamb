
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
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:32 }}>
            <div style={{
              width:44, height:44, background:'rgba(255,255,255,.2)',
              borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center',
              backdropFilter:'blur(8px)',
            }}>
              🎯
            </div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:'1.4rem', fontWeight:800 }}>
              Rightpath JAMB
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
      <div style={{
        width:480, background:'var(--bg)', display:'flex', alignItems:'center',
        justifyContent:'center', padding:40,
      }}>
        <div style={{ width:'100%', maxWidth:400, animation:'fadeIn .35s ease both' }}>
          {children}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .auth-left { display: none !important; }
          div[style*="width:480px"] { width: 100% !important; }
        }
      `}</style>
    </div>
  );
}