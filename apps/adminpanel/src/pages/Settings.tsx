import { FormEvent, useEffect, useState } from 'react';
import { Save, Server } from 'lucide-react';
import { api } from '../lib/api';
import { AppCard } from '../components/ui/AppCard';
import { AppButton } from '../components/ui/AppButton';

type SettingsState = {
  marketplaceName: string;
  supportEmail: string;
  telegramBot: string;
};

const STORAGE_KEY = 'adminpanel_settings_v1';

export default function Settings() {
  const [settings, setSettings] = useState<SettingsState>({
    marketplaceName: 'Clothes MP',
    supportEmail: 'support@clothes.uz',
    telegramBot: '@clothes_support_bot',
  });
  const [health, setHealth] = useState<string>('Tekshirilmagan');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try { setSettings(JSON.parse(raw) as SettingsState); } catch { /* noop */ }
  }, []);

  async function checkHealth() {
    try {
      const res = await api.get<{ status: string; time: string; env: string }>('/api/health');
      setHealth(`${res.status.toUpperCase()} · ${new Date(res.time).toLocaleTimeString('uz-UZ')}`);
    } catch {
      setHealth('Backend ulanmadi');
    }
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setTimeout(() => setSaving(false), 400);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-main tracking-tight">Settings</h2>
        <p className="text-sm text-muted font-medium mt-1">Panel konfiguratsiyasini boshqarish.</p>
      </div>

      <AppCard className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-muted font-medium inline-flex items-center gap-2">
            <Server size={16} /> Backend health: <span className="text-main">{health}</span>
          </div>
          <AppButton variant="secondary" onClick={checkHealth}>Tekshirish</AppButton>
        </div>
      </AppCard>

      <AppCard className="p-6">
        <form className="space-y-4" onSubmit={onSave}>
          <input
            value={settings.marketplaceName}
            onChange={(e) => setSettings((s) => ({ ...s, marketplaceName: e.target.value }))}
            placeholder="Marketplace nomi"
            className="w-full px-4 py-3 rounded-xl bg-pill border border-border outline-none focus:ring-2 focus:ring-accent/40"
          />
          <input
            value={settings.supportEmail}
            onChange={(e) => setSettings((s) => ({ ...s, supportEmail: e.target.value }))}
            placeholder="Support email"
            className="w-full px-4 py-3 rounded-xl bg-pill border border-border outline-none focus:ring-2 focus:ring-accent/40"
          />
          <input
            value={settings.telegramBot}
            onChange={(e) => setSettings((s) => ({ ...s, telegramBot: e.target.value }))}
            placeholder="Telegram bot"
            className="w-full px-4 py-3 rounded-xl bg-pill border border-border outline-none focus:ring-2 focus:ring-accent/40"
          />
          <div className="pt-2">
            <AppButton type="submit" isLoading={saving} leftIcon={<Save size={16} />}>Saqlash</AppButton>
          </div>
        </form>
      </AppCard>
    </div>
  );
}
