'use client';
import { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { useSettingsStore } from '../../features/settings/model';
import { Language } from '../lib/i18n';
import { cn } from '../lib/utils';

const LANGUAGES = [
    { code: 'uz', label: "O'zbek" },
    { code: 'ru', label: "Русский" },
    { code: 'en', label: "English" },
];

export function LanguageSelector() {
    const { settings, updateSettings } = useSettingsStore();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentLang = LANGUAGES.find(l => l.code === settings.language) || LANGUAGES[0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleDropdown = () => setIsOpen(!isOpen);

    const selectLanguage = (code: string) => {
        updateSettings({ language: code as Language });
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={toggleDropdown}
                className="w-9 h-9 flex items-center justify-center bg-[var(--color-surface)] rounded-full shadow-sm text-[var(--color-text)] active:scale-95 transition-all"
            >
                <Globe size={17} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-[var(--color-surface)] rounded-[20px] shadow-2xl border border-[var(--color-border)] overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex flex-col">
                        {LANGUAGES.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => selectLanguage(lang.code)}
                                className={cn(
                                    "flex items-center px-5 py-3 text-[14px] font-bold transition-colors text-left",
                                    settings.language === lang.code
                                        ? "bg-[var(--color-primary)] text-[var(--color-primary-contrast)]"
                                        : "text-[var(--color-text)] hover:bg-[var(--color-surface2)]"
                                )}
                            >
                                {lang.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
