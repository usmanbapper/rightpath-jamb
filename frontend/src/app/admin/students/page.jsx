'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Search, UserCheck, UserX, RefreshCw } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import { adminApi } from '@/lib/api';
import { formatDate, getErrorMessage } from '@/lib/utils';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);

  async function load() {
    setLoading(true);
    try {
      const res = await adminApi.getStudents({ page, search, limit: 20 });
      setStudents(res.data.students);
      setTotal(res.data.total);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page, search]);

  async function toggleStudent(id) {
    try {
      await adminApi.toggleStudent(id);
      toast.success('Student status updated');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <AppShell adminOnly>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, marginBottom: 4 }}>Students</h1>
        <p style={{ color: 'var(--text-2)' }}>Manage registered students</p>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <Input
          placeholder="Search by name or email…"
          icon={<Search size={16} />}
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
      </Card>

      <Card>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={36} /></div>
        ) : students.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-3)', padding: 40 }}>No students found.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Name', 'Email', 'Joined', 'Activation', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-3)', fontWeight: 600, fontSize: '.8rem' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px' }}>{s.full_name}</td>
                  <td style={{ padding: '12px', color: 'var(--text-2)' }}>{s.email}</td>
                  <td style={{ padding: '12px', color: 'var(--text-2)' }}>{formatDate(s.created_at)}</td>
                  <td style={{ padding: '12px' }}>
                    <Badge color={s.activation_status === 'active' ? 'green' : 'gray'}>
                      {s.activation_status}
                    </Badge>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <Badge color={s.is_active ? 'green' : 'red'}>
                      {s.is_active ? 'Active' : 'Suspended'}
                    </Badge>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <Button
                      size="sm"
                      variant={s.is_active ? 'danger' : 'success'}
                      onClick={() => toggleStudent(s.id)}
                    >
                      {s.is_active ? <><UserX size={13} /> Suspend</> : <><UserCheck size={13} /> Activate</>}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {total > 20 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
            <Button size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
            <span style={{ padding: '6px 12px', fontSize: '.85rem', color: 'var(--text-2)' }}>Page {page}</span>
            <Button size="sm" variant="secondary" disabled={students.length < 20} onClick={() => setPage(p => p + 1)}>Next →</Button>
          </div>
        )}
      </Card>
    </AppShell>
  );
}
