'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Heart, LifeBuoy, LogOut, Mail, MapPin, Settings, UserRound } from 'lucide-react';

type ProfileData = {
    name: string;
    email: string;
    phone: string;
    city: string;
};

const DEFAULT_PROFILE: ProfileData = {
    name: 'Ahmad',
    email: 'ahmad@example.com',
    phone: '+998-xx-xxx-xx-xx',
    city: 'Tashkent, Uzbekistan',
};

export default function SiteProfilePage() {
    const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const name = localStorage.getItem('web_name') || localStorage.getItem('name') || DEFAULT_PROFILE.name;
        const email = localStorage.getItem('web_email') || localStorage.getItem('email') || DEFAULT_PROFILE.email;
        const phone = localStorage.getItem('web_phone') || localStorage.getItem('phone') || DEFAULT_PROFILE.phone;
        const city = localStorage.getItem('web_city') || localStorage.getItem('city') || DEFAULT_PROFILE.city;

        setProfile({
            name: name.trim() || DEFAULT_PROFILE.name,
            email: email.trim() || DEFAULT_PROFILE.email,
            phone: phone.trim() || DEFAULT_PROFILE.phone,
            city: city.trim() || DEFAULT_PROFILE.city,
        });
    }, []);

    const initials = useMemo(() => {
        const parts = profile.name.trim().split(/\s+/).slice(0, 2);
        return parts.map((p) => p[0]?.toUpperCase() || '').join('') || 'A';
    }, [profile.name]);

    const menu = [
        {
            href: '/favorites',
            label: 'Favorites',
            sub: 'Saved products and quick access',
            icon: Heart,
        },
        {
            href: '/settings',
            label: 'Settings',
            sub: 'Language, theme and account options',
            icon: Settings,
        },
    ];

    return (
        <section className="mx-auto w-full max-w-[1280px] px-4 py-8 md:px-8 md:py-12">
            <div className="relative overflow-hidden rounded-[34px] border border-black/10 bg-[linear-gradient(135deg,#f9fffb_0%,#eef8ff_45%,#f5f7ff_100%)] p-6 shadow-[0_26px_65px_-45px_rgba(0,0,0,0.55)] md:p-8">
                <div className="absolute -left-16 -top-20 h-48 w-48 rounded-full bg-[#00c853]/18 blur-3xl" />
                <div className="absolute -right-16 -bottom-24 h-56 w-56 rounded-full bg-[#6ea8ff]/20 blur-3xl" />

                <div className="relative grid gap-4 lg:grid-cols-[1.25fr_1fr]">
                    <div className="rounded-3xl border border-black/10 bg-white/88 p-6 backdrop-blur md:p-7">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#00a645]">Profile</p>
                        <div className="mt-4 flex items-center gap-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#111111] text-[22px] font-black text-white">
                                {initials}
                            </div>
                            <div>
                                <h1 className="font-[family-name:var(--font-playfair)] text-[38px] font-black leading-none text-[#111111] md:text-[50px]">
                                    {profile.name}
                                </h1>
                                <p className="mt-1 text-[13px] text-[#647184]">Customer account</p>
                            </div>
                        </div>
                        <div className="mt-6 h-[1px] w-full bg-gradient-to-r from-[#00c853]/35 to-transparent" />
                        <p className="mt-4 text-[14px] font-medium text-[#374151]">Your profile is ready for shopping and saved favorites.</p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                        <div className="rounded-2xl border border-black/10 bg-white p-4">
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">Email</p>
                            <p className="mt-2 flex items-center gap-2 text-[14px] font-semibold text-[#111111]">
                                <Mail size={14} />
                                {profile.email}
                            </p>
                        </div>
                        <div className="rounded-2xl border border-black/10 bg-white p-4">
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">Phone</p>
                            <p className="mt-2 flex items-center gap-2 text-[14px] font-semibold text-[#111111]">
                                <UserRound size={14} />
                                {profile.phone}
                            </p>
                        </div>
                        <div className="rounded-2xl border border-black/10 bg-white p-4">
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">Location</p>
                            <p className="mt-2 flex items-center gap-2 text-[14px] font-semibold text-[#111111]">
                                <MapPin size={14} />
                                {profile.city}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr_1fr]">
                {menu.map((item) => (
                    <Link
                        key={item.label}
                        href={item.href}
                        className="group rounded-3xl border border-black/10 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_44px_-24px_rgba(0,0,0,0.24)]"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#00c853]/12 text-[#008d3a]">
                                    <item.icon size={18} />
                                </div>
                                <div>
                                    <h2 className="text-[17px] font-extrabold text-[#111111]">{item.label}</h2>
                                    <p className="text-[12px] text-[#6b7280]">{item.sub}</p>
                                </div>
                            </div>
                            <ChevronRight size={17} className="text-[#9ca3af] transition-transform group-hover:translate-x-0.5" />
                        </div>
                    </Link>
                ))}

                <div className="group rounded-3xl border border-black/10 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_44px_-24px_rgba(0,0,0,0.24)]">
                    <h3 className="text-[20px] font-extrabold text-[#111111]">Need help?</h3>
                    <p className="mt-1 text-[13px] text-[#6b7280]">Contact support or review frequently asked questions.</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <a
                            href="mailto:support@clothes.uz"
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-5 text-[13px] font-bold text-[#111111] transition-all duration-300 hover:-translate-y-0.5 hover:border-black/20 hover:shadow-[0_14px_25px_-18px_rgba(0,0,0,0.6)]"
                        >
                            <LifeBuoy size={16} />
                            Support
                        </a>
                        <button
                            type="button"
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#111111] px-5 text-[13px] font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:opacity-90 hover:shadow-[0_16px_28px_-16px_rgba(0,0,0,0.65)]"
                        >
                            <LogOut size={16} />
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
