
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Flag, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { examApi } from '@/lib/api';
import { formatTime, getErrorMessage } from '@/lib/utils';

const SYNC_INTERVAL = 30; // seconds

export default function ExamPage() {
  const { sessionId } = useParams();
  const router = useRouter();

  const [session, setSession]     = useState(null);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent]     = useState(0);
  const [answers, setAnswers]     = useState({});   // examQuestionId -> letter
  const [flagged, setFlagged]     = useState({});   // examQuestionId -> bool
  const [timeLeft, setTimeLeft]   = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]     = useState(true);

  const syncRef    = useRef(0);
  const timerRef   = useRef(null);
  const answerTime = useRef(Date.now());

  // ── Load exam data ──────────────────────────────────────────
  useEffect(() => {
    const stored = sessionStorage.getItem('exam_session');
    if (stored) {
      const { session: s, questions: q } = JSON.parse(stored);
      setSession(s);
      setQuestions(q);
      setTimeLeft(s.duration_seconds);
      setLoading(false);
    } else {
      toast.error('Session data not found. Please start a new exam.');
      router.replace('/exam/start');
    }
  }, []);

  // ── Timer ───────────────────────────────────────────────────
  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) { handleSubmit(true); return; }

    timerRef.current = setTimeout(() => {
      setTimeLeft(t => t - 1);
      syncRef.current += 1;
      if (syncRef.current >= SYNC_INTERVAL) {
        syncRef.current = 0;
        examApi.syncTime(sessionId, timeLeft - 1).catch(() => {});
      }
    }, 1000);

    return () => clearTimeout(timerRef.current);
  }, [timeLeft]);

  const q = questions[current];

  // ── Answer ──────────────────────────────────────────────────
  async function selectAnswer(letter) {
    if (!q) return;
    const id = q.exam_question_id;
    const timeSpent = Math.floor((Date.now() - answerTime.current) / 1000);
    answerTime.current = Date.now();

    setAnswers(prev => ({ ...prev, [id]: letter }));
    try {
      await examApi.saveAnswer(sessionId, {
        exam_question_id: id,
        selected_answer:  letter,
        time_spent_seconds: timeSpent,
      });
    } catch (err) {
      toast.error('Failed to save answer — check connection.');
    }
  }

  // ── Flag ────────────────────────────────────────────────────
  async function toggleFlag() {
    if (!q) return;
    const id = q.exam_question_id;
    setFlagged(prev => ({ ...prev, [id]: !prev[id] }));
    try {
      await examApi.flagQuestion(sessionId, { exam_question_id: id });
    } catch {}
  }

  // ── Submit ──────────────────────────────────────────────────
  async function handleSubmit(timedOut = false) {
    clearTimeout(timerRef.current);
    setSubmitting(true);
    try {
      const res = await examApi.submit(sessionId, timedOut);
      sessionStorage.setItem('exam_result', JSON.stringify(res.data));
      sessionStorage.removeItem('exam_session');
      router.replace(`/exam/${sessionId}/review?fresh=1`);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setSubmitting(false);
    }
  }

  if (loading || !q) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', flexDirection:'column', gap:16 }}>
        <Spinner size={44} />
        <p style={{ color:'var(--text-2)' }}>Loading exam…</p>
      </div>
    );
  }

  const answered   = Object.keys(answers).length;
  const totalQ     = questions.length;
  const timerPct   = session ? (timeLeft / session.duration_seconds) * 100 : 100;
  const timerColor = timerPct > 50 ? 'var(--success)' : timerPct > 20 ? 'var(--accent)' : 'var(--danger)';
  const isFlagged  = flagged[q.exam_question_id] || q.is_flagged;
  const selected   = answers[q.exam_question_id] || q.selected_answer;

  // Group questions by subject for the navigator
  const subjectGroups = {};
  questions.forEach((qn, idx) => {
    const name = qn.subject_name || 'Other';
    if (!subjectGroups[name]) subjectGroups[name] = [];
    subjectGroups[name].push({ idx, qn });
  });

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--bg)' }}>

      {/* ── Left: Question ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>

        {/* Top bar */}
        <div style={{
          background:'var(--surface)', borderBottom:'1px solid var(--border)',
          padding:'12px 24px', display:'flex', alignItems:'center', gap:16,
        }}>
          <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'1rem', color:'var(--brand)' }}>
            🎯 Rightpath JAMB
          </div>
          <div style={{ flex:1 }} />

          {/* Timer */}
          <div style={{ textAlign:'center' }}>
            <div style={{
              fontFamily:'var(--font-display)', fontWeight:800, fontSize:'1.5rem',
              color:timerColor, letterSpacing:'-1px',
            }}>
              {formatTime(timeLeft || 0)}
            </div>
            <div style={{ fontSize:'.7rem', color:'var(--text-3)' }}>remaining</div>
          </div>

          {/* Timer bar */}
          <div style={{ width:120, height:6, background:'var(--border)', borderRadius:3, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${timerPct}%`, background:timerColor, borderRadius:3, transition:'width .5s, background .5s' }} />
          </div>

          <div style={{ fontSize:'.85rem', color:'var(--text-2)', fontWeight:600 }}>
            {answered}/{totalQ} answered
          </div>

          <Button size="sm" variant="danger" onClick={() => setShowConfirm(true)} loading={submitting}>
            Submit
          </Button>
        </div>

        {/* Question */}
        <div style={{ flex:1, overflowY:'auto', padding:'32px 40px' }}>
          <div className="animate-fade" key={current}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <div>
                <span style={{ fontSize:'.78rem', fontWeight:600, color:'var(--brand)', textTransform:'uppercase', letterSpacing:'.5px' }}>
                  {q.subject_name}
                </span>
                <span style={{ marginLeft:12, fontSize:'.85rem', color:'var(--text-3)' }}>
                  Question {current + 1} of {totalQ}
                </span>
              </div>
              <button onClick={toggleFlag} style={{
                display:'flex', alignItems:'center', gap:6, padding:'6px 12px',
                borderRadius:8, border:`1.5px solid ${isFlagged ? 'var(--accent)' : 'var(--border)'}`,
                background: isFlagged ? 'var(--accent-light)' : 'transparent',
                color: isFlagged ? 'var(--accent)' : 'var(--text-3)',
                cursor:'pointer', fontSize:'.8rem', fontWeight:600,
              }}>
                <Flag size={14} /> {isFlagged ? 'Flagged' : 'Flag'}
              </button>
            </div>

            <p style={{ fontSize:'1.05rem', lineHeight:1.75, marginBottom:28, fontWeight:500 }}>
              {q.question_text}
            </p>

            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {Object.entries(q.options || {}).map(([letter, text]) => {
                const isSelected = selected === letter;
                return (
                  <button
                    key={letter}
                    onClick={() => selectAnswer(letter)}
                    style={{
                      display:'flex', alignItems:'flex-start', gap:14, padding:'14px 18px',
                      borderRadius:'var(--radius-sm)', textAlign:'left', width:'100%',
                      border:`2px solid ${isSelected ? 'var(--brand)' : 'var(--border)'}`,
                      background: isSelected ? 'var(--brand-light)' : 'var(--surface)',
                      cursor:'pointer', transition:'all .15s',
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = '#93c5fd'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--border)'; }}
                  >
                    <span style={{
                      width:28, height:28, borderRadius:'50%', flexShrink:0,
                      background: isSelected ? 'var(--brand)' : 'var(--border)',
                      color: isSelected ? '#fff' : 'var(--text-2)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontFamily:'var(--font-display)', fontWeight:800, fontSize:'.8rem',
                    }}>
                      {letter}
                    </span>
                    <span style={{ lineHeight:1.6, color: isSelected ? 'var(--brand)' : 'var(--text)', fontWeight: isSelected ? 600 : 400 }}>
                      {text}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div style={{
          borderTop:'1px solid var(--border)', padding:'14px 40px',
          background:'var(--surface)', display:'flex', justifyContent:'space-between',
        }}>
          <Button variant="secondary" onClick={() => setCurrent(c => Math.max(0, c - 1))}
            disabled={current === 0}>
            <ChevronLeft size={16} /> Previous
          </Button>
          <Button onClick={() => setCurrent(c => Math.min(totalQ - 1, c + 1))}
            disabled={current === totalQ - 1}>
            Next <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      {/* ── Right: Navigator ── */}
      <div style={{
        width:220, background:'var(--surface)', borderLeft:'1px solid var(--border)',
        overflowY:'auto', padding:16, flexShrink:0,
      }}>
        <div style={{ fontSize:'.78rem', fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:14 }}>
          Questions
        </div>
        {Object.entries(subjectGroups).map(([subName, items]) => (
          <div key={subName} style={{ marginBottom:16 }}>
            <div style={{ fontSize:'.72rem', fontWeight:700, color:'var(--brand)', marginBottom:8 }}>
              {subName}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:4 }}>
              {items.map(({ idx, qn }) => {
                const ans     = answers[qn.exam_question_id] || qn.selected_answer;
                const isFlagQ = flagged[qn.exam_question_id] || qn.is_flagged;
                return (
                  <button key={idx} onClick={() => setCurrent(idx)} style={{
                    width:32, height:32, borderRadius:6, border:'none', cursor:'pointer',
                    fontFamily:'var(--font-display)', fontWeight:700, fontSize:'.75rem',
                    background: idx === current ? 'var(--brand)'
                      : isFlagQ ? 'var(--accent-light)'
                      : ans     ? '#dcfce7'
                      : 'var(--surface-2)',
                    color: idx === current ? '#fff'
                      : isFlagQ ? 'var(--accent)'
                      : ans     ? 'var(--success)'
                      : 'var(--text-3)',
                    outline: idx === current ? '2px solid var(--brand)' : 'none',
                    outlineOffset:1,
                  }}>
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Legend */}
        <div style={{ marginTop:16, display:'flex', flexDirection:'column', gap:6, fontSize:'.72rem', color:'var(--text-3)' }}>
          {[
            { color:'var(--brand)', label:'Current' },
            { color:'#dcfce7',     label:'Answered' },
            { color:'var(--accent-light)', label:'Flagged' },
            { color:'var(--surface-2)',    label:'Unanswered' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:12, height:12, borderRadius:3, background:color, border:'1px solid var(--border)' }} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* ── Submit Confirm Modal ── */}
      {showConfirm && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(15,23,42,.5)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:999,
          backdropFilter:'blur(4px)',
        }}>
          <div className="animate-pop" style={{
            background:'var(--surface)', borderRadius:'var(--radius-lg)',
            padding:32, maxWidth:420, width:'90%', boxShadow:'var(--shadow-lg)',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
              <AlertCircle size={24} color="var(--accent)" />
              <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.1rem', fontWeight:700 }}>Submit exam?</h3>
            </div>
            <p style={{ color:'var(--text-2)', lineHeight:1.6, marginBottom:24 }}>
              You've answered <strong>{answered}</strong> of <strong>{totalQ}</strong> questions.
              {totalQ - answered > 0 && ` ${totalQ - answered} question(s) will be left unanswered.`}
              {' '}This cannot be undone.
            </p>
            <div style={{ display:'flex', gap:12 }}>
              <Button variant="secondary" onClick={() => setShowConfirm(false)} style={{ flex:1 }}>
                Continue Exam
              </Button>
              <Button variant="danger" onClick={() => handleSubmit(false)} loading={submitting} style={{ flex:1 }}>
                Submit Now
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
