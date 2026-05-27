
import { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { CheckCircle2, XCircle, Flag, ChevronDown, ChevronUp, Trophy, ArrowLeft } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { examApi } from '@/lib/api';
import { getScoreColor, getScoreLabel, formatDate, getErrorMessage } from '@/lib/utils';

function ScoreRing({ pct }) {
  const r     = 54;
  const circ  = 2 * Math.PI * r;
  const dash  = (pct / 100) * circ;
  const color = getScoreColor(pct);
  return (
    <div style={{ position:'relative', width:140, height:140 }}>
      <svg width={140} height={140} style={{ transform:'rotate(-90deg)' }}>
        <circle cx={70} cy={70} r={r} fill="none" stroke="var(--border)" strokeWidth={10} />
        <circle cx={70} cy={70} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round" style={{ transition:'stroke-dasharray 1s ease' }} />
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <span style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'1.7rem', color }}>{Math.round(pct)}%</span>
        <span style={{ fontSize:'.7rem', color:'var(--text-3)', fontWeight:600 }}>{getScoreLabel(pct)}</span>
      </div>
    </div>
  );
}

function QuestionCard({ q, idx }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      border:`1.5px solid ${q.is_correct ? '#bbf7d0' : '#fecaca'}`,
      borderRadius:'var(--radius-sm)', overflow:'hidden',
      background: q.is_correct ? '#f0fdf4' : '#fff5f5',
    }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width:'100%', padding:'14px 16px', display:'flex', alignItems:'center',
        gap:12, background:'none', border:'none', cursor:'pointer', textAlign:'left',
      }}>
        {q.is_correct
          ? <CheckCircle2 size={18} color="var(--success)" style={{ flexShrink:0 }} />
          : <XCircle     size={18} color="var(--danger)"  style={{ flexShrink:0 }} />
        }
        <span style={{ flex:1, fontSize:'.88rem', fontWeight:500, lineHeight:1.5 }}>
          <strong style={{ color:'var(--text-3)', marginRight:6 }}>Q{idx + 1}.</strong>
          {q.question_text.slice(0, 120)}{q.question_text.length > 120 ? '…' : ''}
        </span>
        <span style={{ fontSize:'.75rem', color:'var(--text-3)', fontWeight:600, flexShrink:0 }}>
          {q.subject_code}
        </span>
        {open ? <ChevronUp size={16} color="var(--text-3)" /> : <ChevronDown size={16} color="var(--text-3)" />}
      </button>

      {open && (
        <div style={{ padding:'0 16px 16px', borderTop:'1px solid var(--border)', background:'var(--surface)' }}>
          <p style={{ margin:'14px 0 16px', lineHeight:1.7, fontSize:'.9rem' }}>{q.question_text}</p>
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
            {Object.entries(q.options || {}).map(([letter, text]) => {
              const isCorrect  = letter === q.correct_answer;
              const isSelected = letter === q.selected_answer;
              const bg = isCorrect ? '#dcfce7' : isSelected && !isCorrect ? '#fee2e2' : 'var(--surface-2)';
              const border = isCorrect ? '#86efac' : isSelected ? '#fca5a5' : 'var(--border)';
              return (
                <div key={letter} style={{
                  display:'flex', alignItems:'flex-start', gap:10, padding:'10px 14px',
                  borderRadius:8, border:`1.5px solid ${border}`, background:bg,
                }}>
                  <span style={{
                    width:24, height:24, borderRadius:'50%', flexShrink:0,
                    background: isCorrect ? 'var(--success)' : isSelected ? 'var(--danger)' : 'var(--border)',
                    color:'#fff', display:'flex', alignItems:'center', justifyContent:'center',
                    fontFamily:'var(--font-display)', fontWeight:800, fontSize:'.75rem',
                  }}>{letter}</span>
                  <span style={{ fontSize:'.88rem', lineHeight:1.5 }}>{text}</span>
                  {isCorrect  && <CheckCircle2 size={15} color="var(--success)" style={{ marginLeft:'auto', flexShrink:0 }} />}
                  {isSelected && !isCorrect && <XCircle size={15} color="var(--danger)" style={{ marginLeft:'auto', flexShrink:0 }} />}
                </div>
              );
            })}
          </div>
          {q.explanation && (
            <div style={{ padding:'12px 14px', background:'var(--brand-light)', borderRadius:8, fontSize:'.85rem', lineHeight:1.6, color:'var(--text-2)', borderLeft:'3px solid var(--brand)' }}>
              <strong style={{ color:'var(--brand)' }}>Explanation: </strong>{q.explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ReviewContent() {
  const { sessionId } = useParams();
  const searchParams  = useSearchParams();
  const router        = useRouter();
  const isFresh       = searchParams.get('fresh') === '1';

  const [data, setData]     = useState(null);
  const [filter, setFilter] = useState('all'); // all | correct | wrong | flagged
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // If coming directly from submit, use cached result
      if (isFresh) {
        const cached = sessionStorage.getItem('exam_result');
        if (cached) {
          setData(JSON.parse(cached));
          setLoading(false);
          return;
        }
      }
      try {
        const res = await examApi.getReview(sessionId);
        // Merge session + questions into the same shape as submit response
        setData({
          ...res.data.session,
          results: res.data.questions.map(q => ({
            ...q,
            options: q.options,
          })),
          subject_scores: res.data.session.subject_scores,
        });
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sessionId]);

  if (loading) return (
    <AppShell>
      <div style={{ display:'flex', justifyContent:'center', padding:80 }}><Spinner size={44} /></div>
    </AppShell>
  );

  if (!data) return <AppShell><p style={{ color:'var(--danger)' }}>Failed to load review.</p></AppShell>;

  const results = data.results || [];
  const pct     = parseFloat(data.percentage_score);
  const subjectScores = data.subject_scores || {};
  const newBadges = data.new_badges || [];

  const filtered = results.filter(q => {
    if (filter === 'correct') return q.is_correct;
    if (filter === 'wrong')   return !q.is_correct;
    if (filter === 'flagged') return q.is_flagged;
    return true;
  });

  return (
    <AppShell>
      <div className="animate-fade" style={{ maxWidth:800, margin:'0 auto' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:32 }}>
          <Button variant="ghost" onClick={() => router.push('/dashboard')} size="sm">
            <ArrowLeft size={16} /> Dashboard
          </Button>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:'1.6rem', fontWeight:800 }}>
            Exam Review
          </h1>
        </div>

        {/* Score card */}
        <Card style={{ marginBottom:24, background:'linear-gradient(135deg,var(--brand-light),#fff)', border:'1px solid #c7d7fd' }}>
          <div style={{ display:'flex', alignItems:'center', gap:32, flexWrap:'wrap' }}>
            <ScoreRing pct={pct} />
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:'1.6rem', fontWeight:800, marginBottom:4 }}>
                {data.total_score}/{data.total_questions} correct
              </div>
              <div style={{ color:'var(--text-2)', marginBottom:16 }}>
                {data.status === 'timed_out' ? '⏰ Time ran out' : '✅ Submitted'} · {formatDate(data.submitted_at)}
              </div>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                {Object.values(subjectScores).map(s => (
                  <div key={s.code} style={{ textAlign:'center', padding:'8px 16px', background:'#fff', borderRadius:8, border:'1px solid var(--border)' }}>
                    <div style={{ fontFamily:'var(--font-display)', fontWeight:800, color:getScoreColor(s.pct), fontSize:'1.1rem' }}>
                      {s.pct}%
                    </div>
                    <div style={{ fontSize:'.72rem', color:'var(--text-3)', fontWeight:600 }}>{s.code}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* New badges */}
        {newBadges.length > 0 && (
          <div style={{
            background:'linear-gradient(135deg,#fef9c3,#fef3c7)', border:'1px solid #fcd34d',
            borderRadius:'var(--radius)', padding:'16px 20px', marginBottom:24,
            display:'flex', alignItems:'center', gap:14,
          }}>
            <Trophy size={24} color="#ca8a04" />
            <div>
              <strong>🎉 New badge{newBadges.length > 1 ? 's' : ''} earned!</strong>
              <div style={{ fontSize:'.85rem', color:'var(--text-2)', marginTop:4 }}>
                {newBadges.map(b => `${b.icon || '🏅'} ${b.name}`).join('  ·  ')}
              </div>
            </div>
          </div>
        )}

        {/* Filter */}
        <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
          {[
            { key:'all',     label:`All (${results.length})` },
            { key:'correct', label:`✅ Correct (${results.filter(q => q.is_correct).length})` },
            { key:'wrong',   label:`❌ Wrong (${results.filter(q => !q.is_correct).length})` },
            { key:'flagged', label:`🚩 Flagged (${results.filter(q => q.is_flagged).length})` },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)} style={{
              padding:'6px 14px', borderRadius:99, border:`1.5px solid ${filter === key ? 'var(--brand)' : 'var(--border)'}`,
              background: filter === key ? 'var(--brand-light)' : 'transparent',
              color: filter === key ? 'var(--brand)' : 'var(--text-2)',
              fontWeight:600, fontSize:'.82rem', cursor:'pointer',
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* Questions */}
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {filtered.map((q, i) => <QuestionCard key={q.exam_question_id || i} q={q} idx={results.indexOf(q)} />)}
        </div>

        <div style={{ marginTop:32, display:'flex', gap:12 }}>
          <Button onClick={() => router.push('/exam/start')} style={{ flex:1 }}>Start New Exam</Button>
          <Button onClick={() => router.push('/dashboard')} variant="secondary" style={{ flex:1 }}>Dashboard</Button>
        </div>
      </div>
    </AppShell>
  );
}

export default function ReviewPage() {
  return <Suspense><ReviewContent /></Suspense>;
}