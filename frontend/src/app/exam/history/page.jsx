
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { BookOpen, ChevronRight } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import { examApi } from '@/lib/api';
import { formatDate, getScoreColor, getErrorMessage } from '@/lib/utils';

export default function HistoryPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);
  const limit = 10;

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await examApi.getHistory(page);
        setSessions(res.data.sessions);
        setTotal(res.data.pagination.total);
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page]);

  return (
    <AppShell>
      <div className="animate-fade">
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:'1.8rem', fontWeight:800, marginBottom:28 }}>
          Exam History
        </h1>

        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:80 }}><Spinner size={40} /></div>
        ) : sessions.length === 0 ? (
          <Card style={{ textAlign:'center', padding:60 }}>
            <BookOpen size={48} style={{ margin:'0 auto 16px', color:'var(--text-3)' }} />
            <h3 style={{ fontFamily:'var(--font-display)', marginBottom:8 }}>No exams yet</h3>
            <p style={{ color:'var(--text-2)', marginBottom:24 }}>Take your first mock exam to see your results here.</p>
            <Link href="/exam/start"><Button>Start First Exam</Button></Link>
          </Card>
        ) : (
          <>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {sessions.map(s => {
                const pct = parseFloat(s.percentage_score || 0);
                return (
                  <Link key={s.id} href={`/exam/${s.id}/review`} style={{ textDecoration:'none' }}>
                    <Card style={{
                      display:'flex', alignItems:'center', gap:20, cursor:'pointer',
                      transition:'box-shadow .18s, transform .18s', padding:'16px 20px',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <div style={{
                        width:56, height:56, borderRadius:12, flexShrink:0,
                        background:`${getScoreColor(pct)}18`,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontFamily:'var(--font-display)', fontWeight:800, fontSize:'1rem',
                        color:getScoreColor(pct),
                      }}>
                        {Math.round(pct)}%
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:600, marginBottom:4 }}>
                          {s.total_score}/{s.total_questions} correct
                        </div>
                        <div style={{ fontSize:'.82rem', color:'var(--text-3)' }}>
                          {formatDate(s.submitted_at || s.started_at)}
                        </div>
                      </div>

                      {/* Subject breakdown */}
                      {s.subject_scores && (
                        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                          {Object.values(s.subject_scores).map(sub => (
                            <div key={sub.code} style={{ textAlign:'center' }}>
                              <div style={{ fontSize:'.75rem', fontWeight:700, color:getScoreColor(sub.pct) }}>{sub.pct}%</div>
                              <div style={{ fontSize:'.65rem', color:'var(--text-3)' }}>{sub.code}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      <Badge color={s.status === 'submitted' ? 'green' : s.status === 'timed_out' ? 'orange' : 'gray'}>
                        {s.status === 'timed_out' ? 'Timed out' : s.status}
                      </Badge>
                      <ChevronRight size={16} color="var(--text-3)" />
                    </Card>
                  </Link>
                );
              })}
            </div>

            {total > limit && (
              <div style={{ display:'flex', justifyContent:'center', gap:10, marginTop:24 }}>
                <Button variant="secondary" onClick={() => setPage(p => p - 1)} disabled={page === 1} size="sm">← Prev</Button>
                <span style={{ display:'flex', alignItems:'center', color:'var(--text-2)', fontSize:'.9rem' }}>
                  Page {page} of {Math.ceil(total / limit)}
                </span>
                <Button variant="secondary" onClick={() => setPage(p => p + 1)} disabled={page * limit >= total} size="sm">Next →</Button>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
