'use client';
import { useState, FormEvent } from 'react';
import { User, Lock, Moon, Sun, Shield, CheckCircle } from 'lucide-react';
import { AdminShell } from '../../../src/features/admin/AdminShell';
import { adminApi } from '../../../src/lib/adminApi';
import { useAdminAuth } from '../../../src/context/AdminAuthContext';
import { useTheme } from '../../../src/context/ThemeContext';
import { s } from '../../../src/features/admin/styles';

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div style={{ ...s.card, padding: '24px', marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--adm-border)' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color="#fff" />
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--adm-t1)', margin: 0 }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--adm-t3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAdminAuth();
  const { isDark, toggle } = useTheme();

  const [currentPw, setCurrentPw]   = useState('');
  const [newPw, setNewPw]           = useState('');
  const [confirmPw, setConfirmPw]   = useState('');
  const [pwLoading, setPwLoading]   = useState(false);
  const [pwError, setPwError]       = useState('');
  const [pwSuccess, setPwSuccess]   = useState(false);

  async function handlePasswordChange(e: FormEvent) {
    e.preventDefault();
    setPwError(''); setPwSuccess(false);
    if (newPw !== confirmPw) { setPwError('Yangi parollar mos kelmadi'); return; }
    if (newPw.length < 6)   { setPwError("Parol kamida 6 ta belgi bo'lishi kerak"); return; }
    setPwLoading(true);
    try {
      await adminApi.patch('/api/auth/change-password', { currentPassword: currentPw, newPassword: newPw });
      setPwSuccess(true);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    } finally {
      setPwLoading(false);
    }
  }

  const inputStyle = { ...s.inp };
  const roleCfg = { admin: { label: 'Administrator', bg: '#fef2f2', color: '#dc2626' } }[user?.role ?? '']
    ?? { label: user?.role ?? 'User', bg: 'var(--adm-hover)', color: 'var(--adm-t3)' };

  return (
    <AdminShell>
      <div style={{ marginBottom: 28 }}>
        <h2 style={s.pageTitle}>Sozlamalar</h2>
        <p style={{ fontSize: 13, color: 'var(--adm-t3)', marginTop: 4 }}>Profil va tizim sozlamalarini boshqaring</p>
      </div>

      {/* Profile info */}
      <Section title="Profil ma'lumotlari" icon={User}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          <Field label="Ism">
            <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', color: 'var(--adm-t1)', pointerEvents: 'none' }}>
              {user?.name || '—'}
            </div>
          </Field>
          <Field label="Email">
            <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', color: 'var(--adm-t1)', pointerEvents: 'none' }}>
              {user?.email}
            </div>
          </Field>
          <Field label="Rol">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, background: roleCfg.bg, color: roleCfg.color }}>
                <Shield size={13} />
                {roleCfg.label}
              </span>
            </div>
          </Field>
        </div>
      </Section>

      {/* Appearance */}
      <Section title="Ko'rinish" icon={isDark ? Moon : Sun}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderRadius: 12, border: '1px solid var(--adm-border)', background: 'var(--adm-hover)' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--adm-t1)', marginBottom: 2 }}>
              {isDark ? '🌙 Dark rejim' : '☀️ Light rejim'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--adm-t3)' }}>
              {isDark ? "Qorong'u tema faol" : 'Yorug\' tema faol'}
            </div>
          </div>
          <button
            onClick={toggle}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 18px', borderRadius: 10, border: 'none',
              background: isDark ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #1e293b, #0f172a)',
              color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              boxShadow: isDark ? '0 2px 8px rgba(245,158,11,0.3)' : '0 2px 8px rgba(0,0,0,0.3)',
              transition: 'all 0.2s',
            }}
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
            {isDark ? "Light rejimga o'tish" : "Dark rejimga o'tish"}
          </button>
        </div>
      </Section>

      {/* Change password */}
      <Section title="Parolni o'zgartirish" icon={Lock}>
        <form onSubmit={handlePasswordChange}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            <Field label="Joriy parol">
              <input
                type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)}
                placeholder="••••••••" required style={inputStyle}
              />
            </Field>
            <Field label="Yangi parol">
              <input
                type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
                placeholder="••••••••" required style={inputStyle}
              />
            </Field>
            <Field label="Yangi parolni tasdiqlang">
              <input
                type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                placeholder="••••••••" required style={inputStyle}
              />
            </Field>
          </div>

          {pwError && (
            <div style={s.errBox}>⚠️ {pwError}</div>
          )}
          {pwSuccess && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 16px', color: '#16a34a', marginBottom: 16, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle size={15} /> Parol muvaffaqiyatli o'zgartirildi
            </div>
          )}

          <button type="submit" disabled={pwLoading} style={{
            padding: '10px 24px', borderRadius: 10, border: 'none',
            background: pwLoading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff', fontSize: 14, fontWeight: 600, cursor: pwLoading ? 'not-allowed' : 'pointer',
            boxShadow: pwLoading ? 'none' : '0 4px 12px rgba(99,102,241,0.35)',
            display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s',
          }}>
            {pwLoading
              ? <><span className="spin" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block' }} /> Saqlanmoqda...</>
              : 'Parolni saqlash'}
          </button>
        </form>
      </Section>
    </AdminShell>
  );
}
