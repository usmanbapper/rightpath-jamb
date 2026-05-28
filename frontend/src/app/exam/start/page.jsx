'use client';


import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { BookOpen, CheckCircle2, AlertCircle } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { examApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';

export default function StartExamPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState([]);
  const [selected, setSelected] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [subRes, cfgRes] = await Promise.all([examApi.getSubjects(), examApi.getConfigs()]);
        const subList = subRes.data.subjects;
        setSubjects(subList);
        setConfigs(cfgRes.data.configs);
        // Pre-select English (compulsory)
        const eng = subList.find(s => s.code === 'ENG');
        if (eng) setSelected([eng.id]);
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function toggleSubject(id) {
    const eng = subjects.find(s => s.code === 'ENG');
    if (eng && id === eng.id) return; // English is locked
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  }

  async function startExam() {
    if (selected.length !== 4) { toast.error('Please select exactly 4 subjects.'); return; }
    setStarting(true);
    try {
      const res = await examApi.start({ subject_ids: selected });
      const { session, questions } = res.data;
      // Store exam data in sessionStorage for the exam page
      sessionStorage.setItem('exam_session', JSON.stringify({ session, questions }));
      router.push(`/exam/${session.id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setStarting(false);
    }
  }

  const config = configs[0];

  return (
    <AppShell>
      <div className="animate-fade" style={{ maxWidth:720, margin:'0 auto' }}>
        <div style={{ marginBottom:32 }}>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:'1.9rem', fontWeight:800, marginBottom:8 }}>
            Start Mock Exam
          </h1>
          <p style={{ color:'var(--text-2)' }}>Select your 4 subjects. Use of English is compulsory.</p>
        </div>

        {/* Exam info */}
        {config && (
          <Card style={{ marginBottom:28, background:'var(--brand-light)', border:'1px solid #c7d7fd' }}>
            <div style={{ display:'flex', gap:32, flexWrap:'wrap' }}>
              {[
                { label:'Questions', value:'180 (45 per subject)' },
                { label:'Duration', value:`${config.duration_minutes} minutes` },
                { label:'Score per question', value:config.score_per_question },
                { label:'Negative marking', value:config.negative_marking ? `−${config.negative_mark}` : 'None' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize:'.78rem', color:'var(--text-3)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.5px' }}>{label}</div>
                  <div style={{ fontFamily:'var(--font-display)', fontWeight:700, color:'var(--brand)', fontSize:'1rem', marginTop:2 }}>{value}</div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:60 }}><Spinner size={40} /></div>
        ) : (
          <>
            <Card style={{ marginBottom:24 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                <h3 style={{ fontFamily:'var(--font-display)', fontWeight:700 }}>Choose subjects</h3>
                <span style={{
                  fontFamily:'var(--font-display)', fontWeight:800, fontSize:'1.1rem',
                  color: selected.length === 4 ? 'var(--success)' : 'var(--brand)',
                }}>
                  {selected.length}/4
                </span>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px,1fr))', gap:10 }}>
                {subjects.map(sub => {
                  const isSelected = selected.includes(sub.id);
                  const isLocked   = sub.code === 'ENG';
                  return (
                    <button
                      key={sub.id}
                      onClick={() => toggleSubject(sub.id)}
                      disabled={!isSelected && selected.length >= 4}
                      style={{
                        padding:'14px 16px', borderRadius:'var(--radius-sm)', textAlign:'left',
                        border:`2px solid ${isSelected ? 'var(--brand)' : 'var(--border)'}`,
                        background: isSelected ? 'var(--brand-light)' : 'var(--surface-2)',
                        cursor: isLocked ? 'default' : (!isSelected && selected.length >= 4) ? 'not-allowed' : 'pointer',
                        opacity: (!isSelected && selected.length >= 4) ? .5 : 1,
                        transition:'all .18s', position:'relative',
                      }}
                    >
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                        <div>
                          <div style={{ fontWeight:600, fontSize:'.9rem', color: isSelected ? 'var(--brand)' : 'var(--text)' }}>
                            {sub.name}
                          </div>
                          {isLocked && (
                            <div style={{ fontSize:'.72rem', color:'var(--brand)', marginTop:2, fontWeight:600 }}>
                              COMPULSORY
                            </div>
                          )}
                        </div>
                        {isSelected && <CheckCircle2 size={18} color="var(--brand)" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>

            {selected.length === 4 && (
              <Card style={{ marginBottom:24, background:'#f0fdf4', border:'1px solid #bbf7d0' }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                  <CheckCircle2 size={18} color="var(--success)" style={{ flexShrink:0, marginTop:2 }} />
                  <div>
                    <div style={{ fontWeight:600, color:'var(--success)', marginBottom:4 }}>Ready to start!</div>
                    <div style={{ fontSize:'.85rem', color:'var(--text-2)', lineHeight:1.5 }}>
                      Selected: {selected.map(id => subjects.find(s => s.id === id)?.name).join(', ')}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            <div style={{ display:'flex', alignItems:'center', gap:14, padding:'16px 20px', background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:'var(--radius-sm)', marginBottom:28 }}>
              <AlertCircle size={18} color="#ea580c" style={{ flexShrink:0 }} />
              <p style={{ fontSize:'.85rem', color:'#9a3412', lineHeight:1.5 }}>
                Once you start, the timer begins. You cannot pause the exam. Ensure you have a stable internet connection.
              </p>
            </div>

            <Button
              onClick={startExam}
              loading={starting}
              disabled={selected.length !== 4}
              size="lg"
              style={{ width:'100%' }}
            >
              🚀 Start Exam Now
            </Button>
          </>
        )}
      </div>
    </AppShell>
  );
}
