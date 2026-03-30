'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useWebAuth } from '../../context/WebAuthContext';
import { cn } from '../lib/utils';
import { useTranslation } from '../lib/i18n';

type Props = {
    open: boolean;
    onClose: () => void;
    defaultTab?: 'login' | 'register' | 'key';
};

export function AuthModal({ open, onClose, defaultTab = 'login' }: Props) {
    const { login, register, loginByKey } = useWebAuth();
    const { t } = useTranslation();
    const [tab, setTab] = useState<'login' | 'register' | 'key'>(defaultTab);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [accessKey, setAccessKey] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (open) {
            setTab(defaultTab);
            setError('');
            setName('');
            setEmail('');
            setPassword('');
            setAccessKey('');
        }
    }, [open, defaultTab]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    if (!open) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (tab === 'login') {
                await login(email.trim(), password);
            } else if (tab === 'register') {
                if (name.trim().length < 2) { setError(t.auth_register_name_error); setLoading(false); return; }
                await register(name.trim(), email.trim(), password);
            } else {
                if (accessKey.trim().length !== 8) { setError(t.auth_key_length_error); setLoading(false); return; }
                await loginByKey(accessKey.trim());
            }
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            ref={overlayRef}
            onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
        >
            <div className="relative w-full max-w-[420px] rounded-[28px] border border-black/10 bg-white shadow-[0_30px_70px_-30px_rgba(0,0,0,0.45)] dark:border-white/10 dark:bg-[#1a1a1a]">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-[#6b7280] transition-all hover:text-[#111111] dark:border-white/10 dark:bg-white/10 dark:hover:text-white"
                >
                    <X size={16} />
                </button>

                <div className="p-7">
                    <h2 className="font-[family-name:var(--font-playfair)] text-[26px] font-black text-[#111111] dark:text-white">
                        {tab === 'login' ? t.auth_login : tab === 'register' ? t.auth_register : t.auth_key}
                    </h2>
                    <p className="mt-1 text-[13px] text-[#6b7280]">
                        {tab === 'login' ? t.auth_login_desc : tab === 'register' ? t.auth_register_desc : t.auth_key_desc}
                    </p>

                    <div className="mt-5 flex gap-1 rounded-xl bg-[#f3f4f6] p-1 dark:bg-white/10">
                        {(['login', 'register', 'key'] as const).map((tabOption) => (
                            <button
                                key={tabOption}
                                onClick={() => { setTab(tabOption); setError(''); }}
                                className={cn(
                                    'flex-1 rounded-lg py-2 text-[12px] font-bold uppercase tracking-[0.1em] transition-all',
                                    tab === tabOption
                                        ? 'bg-white text-[#111111] shadow-sm dark:bg-[#111111] dark:text-white'
                                        : 'text-[#6b7280] hover:text-[#111111] dark:hover:text-white',
                                )}
                            >
                                {tabOption === 'login' ? t.auth_login : tabOption === 'register' ? t.auth_register : `${'\u{1F511}'} ${t.auth_key}`}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit} className="mt-5 grid gap-3">
                        {tab === 'register' && (
                            <label className="grid gap-1.5">
                                <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#6b7280]">{t.auth_name}</span>
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder={t.auth_full_name_placeholder}
                                    disabled={loading}
                                    className="h-11 rounded-xl border border-black/12 bg-white px-3 text-[14px] outline-none transition-all focus:border-[#00c853] disabled:opacity-60 dark:border-white/15 dark:bg-white/5 dark:text-white"
                                />
                            </label>
                        )}
                        {tab !== 'key' && (
                            <label className="grid gap-1.5">
                                <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#6b7280]">{t.auth_email}</span>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="email@example.com"
                                    disabled={loading}
                                    className="h-11 rounded-xl border border-black/12 bg-white px-3 text-[14px] outline-none transition-all focus:border-[#00c853] disabled:opacity-60 dark:border-white/15 dark:bg-white/5 dark:text-white"
                                />
                            </label>
                        )}
                        {tab !== 'key' && (
                            <label className="grid gap-1.5">
                                <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#6b7280]">{t.auth_password}</span>
                                <div className="relative">
                                    <input
                                        type={showPass ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        disabled={loading}
                                        className="h-11 w-full rounded-xl border border-black/12 bg-white px-3 pr-10 text-[14px] outline-none transition-all focus:border-[#00c853] disabled:opacity-60 dark:border-white/15 dark:bg-white/5 dark:text-white"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass((p) => !p)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#111111] dark:hover:text-white"
                                    >
                                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </label>
                        )}
                        {tab === 'key' && (
                            <label className="grid gap-1.5">
                                <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#6b7280]">{t.auth_key}</span>
                                <input
                                    value={accessKey}
                                    onChange={(e) => setAccessKey(e.target.value.toUpperCase())}
                                    placeholder="XXXXXXXX"
                                    maxLength={8}
                                    disabled={loading}
                                    className="h-11 rounded-xl border border-black/12 bg-white px-3 text-[14px] tracking-[0.2em] font-mono outline-none transition-all focus:border-[#00c853] disabled:opacity-60 dark:border-white/15 dark:bg-white/5 dark:text-white"
                                />
                                <span className="text-[11px] text-[#6b7280]">{t.auth_key_hint}</span>
                            </label>
                        )}

                        {error && (
                            <p className="rounded-xl bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-400">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#13ec37] text-[12px] font-black uppercase tracking-[0.12em] text-[#06200f] transition-all hover:shadow-[0_16px_34px_-14px_rgba(0,200,83,0.9)] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading && <Loader2 size={14} className="animate-spin" />}
                            {tab === 'login' ? t.auth_login : tab === 'register' ? t.auth_register : t.auth_login}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
