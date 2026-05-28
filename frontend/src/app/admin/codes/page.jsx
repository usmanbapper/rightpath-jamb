'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Copy, Trash2 } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { adminApi } from '@/lib/api';
import { formatDate, getErrorMessage } from '@/lib/utils';

export default function CodesPage() {
  const [codes, setCodes]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [genCount, setGenCount] = useState(1);
  const [genDays, setGenDays]   = useState(365);
  const [generating, setGenerating] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await adminApi.getCodes();
      setCodes(res.data.codes || []);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function generate() {
    setGenerating(true);
    try {
      await adminApi.generateCodes({ count: genCount, validity_days: genDays });
      toast.success(`${genCount} code(s) generated`);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  }

  async function deleteCode(id) {
    if (!confirm('Delete this code?')) return;
    try {
      await adminApi.deleteCode(id);
      toast.success('Code deleted');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  function copy(code) {
    navigator.clipboard.writeText(code);
    toast.success('Copied!');
  }

  return (
    <AppShell adminOnly>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, marginBottom: 4 }}>Activation Codes</h1>
        <p style={{ color: 'var(--text-2)' }}>Generate and manage access codes</p>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--text-2)' }}>Quantity</label>
            <input type="number" min={1} max={100} value={genCount}
              onChange={e => setGenCount(Number(e.target.value))}
              style={{ width: 80, padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', color: 'var(--text)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--text-2)' }}>Validity (days)</label>
            <input type="number" min={1} value={genDays}
              onChange={e => setGenDays(Number(e.target.value))}
              style={{ width: 100, padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', color: 'var(--text)' }} />
          </div>
          <Button onClick={generate} loading={generating}>
            <Plus size={16} /> Generate
          </Button>
        </div>
      </Card>

      <Card>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={36} /></div>
        ) : codes.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-3)', padding: 40 }}>No codes yet. Generate some above.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Code', 'Status', 'Expires', 'Used by', ''].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-3)', fontWeight: 600, fontSize: '.8rem' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {codes.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: 600, letterSpacing: 1 }}>{c.code}</td>
                  <td style={{ padding: '12px' }}>
                    <Badge color={c.is_used ? 'gray' : 'green'}>{c.is_used ? 'Used' : 'Available'}</Badge>
                  </td>
                  <td style={{ padding: '12px', color: 'var(--text-2)' }}>{formatDate(c.expires_at)}</td>
                  <td style={{ padding: '12px', color: 'var(--text-2)' }}>{c.used_by_name || '—'}</td>
                  <td style={{ padding: '12px', display: 'flex', gap: 6 }}>
                    <Button size="sm" variant="secondary" onClick={() => copy(c.code)}><Copy size={13} /></Button>
                    <Button size="sm" variant="danger" onClick={() => deleteCode(c.id)}><Trash2 size={13} /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </AppShell>
  );
}
