'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Users, BookOpen, Key, Activity } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';
import { adminApi } from '@/lib/api';
import { formatDate, getErrorMessage } from '@/lib/utils';

export default function AdminDashboard() {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getDashboard()
      .then(res => setStats(res.data))
      .catch(err => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const cards = stats ? [
    { label: 'Total Students', value: stats.total_students ?? 0, icon: Users,    color: 'var(--brand)' },
    { label: 'Total Questions', value: stats.total_questions ?? 0, icon: BookOpen, color: 'var(--success)' },
    { label: 'Active Codes',   value: stats.active_codes ?? 0,   icon: Key,      color: '#f59e0b' },
    { label: 'Exams Today',    value: stats.exams_today ?? 0,    icon: Activity, color: '#8b5cf6' },
  ] : [];

  return (
    <AppShell adminOnly>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, marginBottom: 4 }}>
          Admin Dashboard
        </h1>
        <p style={{ color: 'var(--text-2)' }}>Platform overview</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <Spinner size={40} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
          {cards.map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={22} color={color} />
                </div>
                <div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1.1 }}>{value}</div>
                  <div style={{ fontSize: '.8rem', color: 'var(--text-2)', marginTop: 2 }}>{label}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}