
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Users, BookOpen, Key, Activity, TrendingUp, CheckCircle2 } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';
import { adminApi } from '@/lib/api';
import { formatDate, getScoreColor, getErrorMessage } from '@/lib/utils';

function StatCard({ icon, label, value, sub, color='var(--brand)' }) {
  return (
    <Card style={{ display:'flex', alignItems:'center', gap:16 }}>
      <div style={{ width:48,height:48,borderRadius:12,background:`${color}18`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontFamily:'var(--font-display)', fontSize:'1.7rem', fontWeight:800, lineHeight:1 }}>{value}</div>
        <div style={{ fontSize:'.82rem', color:'var(--text-2)', marginTop:2 }}>{label}</div>
        {sub && <div style={{ fontSize:'.75rem', color:'var(--text-3)', marginTop:1 }}>{sub}</div>}
      </div>
    </Card>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getDashboard()
      .then(res => setData(res.data))
      .catch(err => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AppShell adminOnly><div style={{ display:'flex',justifyContent:'center',padding:80 }}><Spinner size={40} /></div></AppShell>;

  const { users, questions, sessions, activation_codes, recent_sessions } = data || {};

  return (
    <AppShell adminOnly>
      <div className="animate-fade">
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:'1.9rem', fontWeight:800, marginBottom:8 }}>Admin Dashboard</h1>
        <p style={{ color:'var(--text-2)', marginBottom:32 }}>Platform overview and recent activity.</p>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16, marginBottom:32 }}>
          <StatCard icon={<Users size={22} color="var(--brand)" />} label="Total Students" value={users?.total_students || 0} sub={`${users?.new_this_week || 0} new this week`} />
          <StatCard icon={<Activity size={22} color="var(--success)" />} label="Active Students" value={users?.active_students || 0} color="var(--success)" />
          <StatCard icon={<BookOpen size={22} color="var(--accent)" />} label="Questions" value={questions?.total || 0} sub={`${questions?.subjects_covered || 0} subjects`} color="var(--accent)" />
          <StatCard icon={<TrendingUp size={22} color="#9333ea" />} label="Exams Taken" value={sessions?.total || 0} sub={`Avg ${sessions?.avg_score || 0}%`} color="#9333ea" />
          <StatCard icon={<Key size={22} color="#0891b2" />} label="Codes Available" value={activation_codes?.available || 0} sub={`${activation_codes?.used || 0} used`} color="#0891b2" />
        </div>

        <Card>
          <h3 style={{ fontFamily:'var(--font-display)', fontWeight:700, marginBottom:20 }}>Recent Exam Submissions</h3>
          {!recent_sessions?.length ? (
            <p style={{ color:'var(--text-3)', textAlign:'center', padding:'24px 0' }}>No exam submissions yet.</p>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {recent_sessions.map(s => (
                <div key={s.id} style={{ display:'flex', alignItems:'center', gap:16, padding:'12px 16px', background:'var(--surface-2)', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)' }}>
                  <div style={{ width:44,height:44,borderRadius:10,background:`${getScoreColor(parseFloat(s.percentage_score))}18`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--font-display)',fontWeight:800,fontSize:'.9rem',color:getScoreColor(parseFloat(s.percentage_score)),flexShrink:0 }}>
                    {Math.round(parseFloat(s.percentage_score))}%
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:600, fontSize:'.9rem' }}>{s.full_name}</div>
                    <div style={{ fontSize:'.78rem', color:'var(--text-3)' }}>{s.email}</div>
                  </div>
                  <div style={{ fontSize:'.82rem', color:'var(--text-2)' }}>{formatDate(s.submitted_at)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
EOF


import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Search, UserCheck, UserX, RefreshCw } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Input from '@/components/ui/Input';
import { adminApi } from '@/lib/api';
import { formatDate, getErrorMessage } from '@/lib/utils';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]   = useState(1);
  const [total, setTotal] = useState(0);
  const [toggling, setToggling] = useState(null);
  const limit = 20;

  async function load() {
    setLoading(true);
    try {
      const res = await adminApi.listStudents({ page, limit, search: search || undefined, activation_status: statusFilter || undefined });
      setStudents(res.data.students);
      setTotal(res.data.pagination.total);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page, statusFilter]);

  async function toggleStudent(id) {
    setToggling(id);
    try {
      const res = await adminApi.toggleStudent(id);
      toast.success(res.data.message);
      setStudents(s => s.map(u => u.id === id ? { ...u, is_active: !u.is_active } : u));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setToggling(null);
    }
  }

  return (
    <AppShell adminOnly>
      <div className="animate-fade">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:28 }}>
          <div>
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:'1.8rem', fontWeight:800, marginBottom:4 }}>Students</h1>
            <p style={{ color:'var(--text-2)' }}>{total} student{total !== 1 ? 's' : ''} registered</p>
          </div>
        </div>

        {/* Filters */}
        <Card style={{ marginBottom:20, padding:'16px 20px' }}>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'flex-end' }}>
            <div style={{ flex:1, minWidth:200 }}>
              <Input placeholder="Search name or email…" icon={<Search size={16} />}
                value={search} onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && load()} />
            </div>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={{ padding:'11px 14px', border:'1.5px solid var(--border)', borderRadius:'var(--radius-sm)', background:'var(--surface)', color:'var(--text)', fontSize:'.9rem' }}>
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
            </select>
            <Button size="sm" variant="secondary" onClick={load}><RefreshCw size={14} /> Search</Button>
          </div>
        </Card>

        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:60 }}><Spinner size={40} /></div>
        ) : (
          <Card style={{ padding:0, overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.88rem' }}>
              <thead>
                <tr style={{ background:'var(--surface-2)', borderBottom:'1px solid var(--border)' }}>
                  {['Name','Email','State','Subscription','Exams','Avg%','Status','Actions'].map(h => (
                    <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontWeight:700, color:'var(--text-2)', fontSize:'.78rem', textTransform:'uppercase', letterSpacing:'.5px', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => (
                  <tr key={s.id} style={{ borderBottom:'1px solid var(--border)', background: i%2===0 ? 'var(--surface)' : 'var(--surface-2)' }}>
                    <td style={{ padding:'12px 16px', fontWeight:600 }}>{s.full_name}</td>
                    <td style={{ padding:'12px 16px', color:'var(--text-2)' }}>{s.email}</td>
                    <td style={{ padding:'12px 16px', color:'var(--text-2)' }}>{s.state || '—'}</td>
                    <td style={{ padding:'12px 16px' }}>
                      <Badge color={s.activation_status==='active'?'green':s.activation_status==='expired'?'orange':'gray'}>
                        {s.activation_status}
                      </Badge>
                    </td>
                    <td style={{ padding:'12px 16px', fontWeight:700 }}>{s.total_exams_taken}</td>
                    <td style={{ padding:'12px 16px', fontWeight:700 }}>{s.average_score ? `${parseFloat(s.average_score).toFixed(1)}%` : '—'}</td>
                    <td style={{ padding:'12px 16px' }}>
                      <Badge color={s.is_active ? 'green' : 'red'}>{s.is_active ? 'Active' : 'Disabled'}</Badge>
                    </td>
                    <td style={{ padding:'12px 16px' }}>
                      <Button size="sm" variant={s.is_active ? 'danger' : 'success'}
                        loading={toggling === s.id} onClick={() => toggleStudent(s.id)}>
                        {s.is_active ? <><UserX size={13} /> Disable</> : <><UserCheck size={13} /> Enable</>}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {students.length === 0 && (
              <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-3)' }}>No students found.</div>
            )}
          </Card>
        )}

        {total > limit && (
          <div style={{ display:'flex', justifyContent:'center', gap:10, marginTop:20 }}>
            <Button variant="secondary" size="sm" onClick={() => setPage(p=>p-1)} disabled={page===1}>← Prev</Button>
            <span style={{ display:'flex',alignItems:'center',color:'var(--text-2)',fontSize:'.9rem' }}>Page {page} of {Math.ceil(total/limit)}</span>
            <Button variant="secondary" size="sm" onClick={() => setPage(p=>p+1)} disabled={page*limit>=total}>Next →</Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}