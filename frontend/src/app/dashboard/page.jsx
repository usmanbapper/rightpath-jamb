'use client';


import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { Target, TrendingUp, BookOpen, Award, ChevronRight, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { examApi, activationApi, userApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { formatDate, formatTime, getScoreColor, getScoreLabel, getErrorMessage } from '@/lib/utils';

function StatCard({ icon, label, value, sub, color = 'var(--brand)' }) {
  return (
    <Card style={{ display:'flex', alignItems:'center', gap:16 }}>
      <div style={{ width:48, height:48, borderRadius:12, background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontFamily:'var(--font-display)', fontSize:'1.6rem', fontWeight:800, lineHeight:1 }}>{value}</div>
        <div style={{ fontSize:'.82rem', color:'var(--text-2)', marginTop:2 }}>{label}</div>
        {sub && <div style={{ fontSize:'.78rem', color:'var(--text-3)', marginTop:2 }}>{sub}</div>}
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [history, setHistory] = useState([]);
  const [activation, setActivation] = useState(null);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [histRes, actRes, badgeRes] = await Promise.all([
          examApi.getHistory(1),
          activationApi.getStatus(),
          userApi.getBadges(),
        ]);
        setHistory(histRes.data.sessions);
        setActivation(actRes.data);
        setBadges(badgeRes.data.badges.slice(0, 4));
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const avgScore = history.length
    ? Math.round(history.reduce((a, s) => a + parseFloat(s.percentage_score || 0), 0) / history.length)
    : 0;
  const bestScore = history.length
    ? Math.round(Math.max(...history.map(s => parseFloat(s.percentage_score || 0))))
    : 0;

  return (
    <AppShell>
      <div className="animate-fade">
        {/* Header */}
        <div style={{ marginBottom:32 }}>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:'1.9rem', fontWeight:800, marginBottom:4 }}>
            Welcome back, {user?.full_name?.split(' ')[0]} 👋
          </h1>
          <p style={{ color:'var(--text-2)' }}>Here's your JAMB preparation overview.</p>
        </div>

        {/* Activation banner */}
        {activation && !activation.is_active && (
          <div style={{
            background:'linear-gradient(135deg, #fef9c3, #fef3c7)', border:'1px solid #fcd34d',
            borderRadius:'var(--radius)', padding:'16px 20px', marginBottom:28,
            display:'flex', alignItems:'center', gap:14,
          }}>
            <AlertCircle size={20} color="#ca8a04" />
            <div style={{ flex:1 }}>
              <strong style={{ fontSize:'.9rem' }}>No active subscription</strong>
              <p style={{ fontSize:'.85rem', color:'var(--text-2)', marginTop:2 }}>
                Redeem an activation code to start taking mock exams.
              </p>
            </div>
            <Link href="/profile">
              <Button size="sm" variant="secondary">Redeem Code</Button>
            </Link>
          </div>
        )}

        {activation?.is_active && activation.days_remaining <= 7 && (
          <div style={{
            background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:'var(--radius)',
            padding:'14px 20px', marginBottom:28, display:'flex', alignItems:'center', gap:12,
          }}>
            <Clock size={18} color="#ea580c" />
            <span style={{ fontSize:'.9rem', color:'#c2410c' }}>
              Your subscription expires in <strong>{activation.days_remaining} day{activation.days_remaining !== 1 ? 's' : ''}</strong>.
            </span>
          </div>
        )}

        {/* Stats */}
        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:60 }}><Spinner size={40} /></div>
        ) : (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px,1fr))', gap:16, marginBottom:32 }}>
              <StatCard icon={<BookOpen size={22} color="var(--brand)" />} label="Total Exams" value={user?.total_exams_taken || 0} />
              <StatCard icon={<TrendingUp size={22} color="var(--success)" />} label="Average Score" value={`${avgScore}%`} sub={getScoreLabel(avgScore)} color="var(--success)" />
              <StatCard icon={<Target size={22} color="var(--accent)" />} label="Best Score" value={`${bestScore}%`} color="var(--accent)" />
              <StatCard icon={<Award size={22} color="#9333ea" />} label="Badges Earned" value={user?.badge_count || 0} color="#9333ea" />
            </div>

            {/* CTA */}
            <div style={{
              background:'linear-gradient(135deg, var(--brand), var(--brand-dark))',
              borderRadius:'var(--radius-lg)', padding:'28px 32px', marginBottom:32,
              display:'flex', alignItems:'center', justifyContent:'space-between',
              color:'#fff', gap:20,
            }}>
              <div>
                <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.4rem', fontWeight:800, marginBottom:6 }}>
                  Ready to practice?
                </h2>
                <p style={{ opacity:.85, fontSize:'.95rem' }}>
                  Take a full 3-hour mock JAMB exam with 180 questions.
                </p>
              </div>
              <Link href="/exam/start">
                <Button style={{ background:'#fff', color:'var(--brand)', fontWeight:700, flexShrink:0 }}>
                  Start Exam <ChevronRight size={16} />
                </Button>
              </Link>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:24 }}>
              {/* Recent exams */}
              <Card>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                  <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1rem', fontWeight:700 }}>Recent Exams</h3>
                  <Link href="/exam/history" style={{ fontSize:'.85rem', color:'var(--brand)', fontWeight:600 }}>
                    View all →
                  </Link>
                </div>
                {history.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'32px 0', color:'var(--text-3)' }}>
                    <BookOpen size={36} style={{ margin:'0 auto 12px', opacity:.4 }} />
                    <p>No exams yet. Start your first one!</p>
                  </div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                    {history.slice(0, 5).map(s => (
                      <Link key={s.id} href={`/exam/${s.id}/review`} style={{
                        display:'flex', alignItems:'center', gap:14, padding:'12px 14px',
                        borderRadius:'var(--radius-sm)', background:'var(--surface-2)',
                        border:'1px solid var(--border)', transition:'border-color .18s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--brand)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                      >
                        <div style={{
                          width:40, height:40, borderRadius:'50%', flexShrink:0,
                          background:`${getScoreColor(parseFloat(s.percentage_score))}22`,
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontFamily:'var(--font-display)', fontWeight:800, fontSize:'.85rem',
                          color:getScoreColor(parseFloat(s.percentage_score)),
                        }}>
                          {Math.round(parseFloat(s.percentage_score))}%
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontWeight:600, fontSize:'.9rem' }}>
                            {s.total_score}/{s.total_questions} correct
                          </div>
                          <div style={{ fontSize:'.78rem', color:'var(--text-3)' }}>
                            {formatDate(s.submitted_at || s.started_at)}
                          </div>
                        </div>
                        <Badge color={s.status === 'submitted' ? 'green' : s.status === 'timed_out' ? 'orange' : 'gray'}>
                          {s.status === 'timed_out' ? 'Timed out' : s.status}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </Card>

              {/* Badges */}
              <Card>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                  <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1rem', fontWeight:700 }}>Recent Badges</h3>
                </div>
                {badges.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'24px 0', color:'var(--text-3)' }}>
                    <Award size={32} style={{ margin:'0 auto 10px', opacity:.4 }} />
                    <p style={{ fontSize:'.85rem' }}>Complete exams to earn badges!</p>
                  </div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {badges.map(b => (
                      <div key={b.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'var(--surface-2)', borderRadius:'var(--radius-sm)' }}>
                        <span style={{ fontSize:'1.4rem' }}>{b.icon || '🏅'}</span>
                        <div>
                          <div style={{ fontWeight:600, fontSize:'.85rem' }}>{b.name}</div>
                          <div style={{ fontSize:'.75rem', color:'var(--text-3)' }}>{formatDate(b.earned_at)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}