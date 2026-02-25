"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IconButton } from "@/src/components/ui/IconButton";
import { MarketplaceShell } from "@/src/components/ui/MarketplaceShell";
import { SkeletonCard } from "@/src/components/ui/Skeleton";
import { BackIcon } from "@/src/components/ui/icons";
import { profileService } from "@/src/services/profile.service";
import type { UserProfile } from "@/src/types/marketplace";
import { Check, ChevronRight, Package, CreditCard, MapPin, Settings } from 'lucide-react';

const defaultProfile: UserProfile = {
  fullName: "",
  phone: "",
  email: ""
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    profileService.getProfile().then((nextProfile) => {
      if (!mounted) {
        return;
      }

      setProfile(nextProfile);
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <MarketplaceShell
      title="Profil"
      topLeft={
        <Link href="/" aria-label="Back home">
          <IconButton icon={<BackIcon />} />
        </Link>
      }
    >
      {loading ? <SkeletonCard rows={3} /> : null}

      {!loading ? (
        <>
          <div className="flex flex-col items-center pt-8 pb-6">
            <div className="relative mb-3">
              <div className="w-[88px] h-[88px] rounded-full p-[3px] bg-gradient-to-tr from-[#00C853] flex-shrink-0 to-[#00C853]/30">
                <div className="w-full h-full rounded-full border-[3px] border-white overflow-hidden bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200" alt="Profile" className="w-[110%] h-[110%] object-cover object-center -ml-1 -mt-1" />
                </div>
              </div>
              <div className="absolute bottom-1 right-0 w-[22px] h-[22px] bg-[#00C853] rounded-full border-2 border-white flex items-center justify-center">
                <Check className="w-[14px] h-[14px] text-white" strokeWidth={3} />
              </div>
            </div>
            <h2 className="text-[20px] font-extrabold text-[#111827] tracking-tight">{profile.fullName || "Ahmadxon"}</h2>
            <p className="text-[14px] font-medium text-gray-500 mt-0.5">{profile.email || "ahmadxon@example.com"}</p>

            <div className="flex gap-2 mt-5 w-full max-w-[280px]">
              <button className="flex-1 bg-white border border-gray-100/60 shadow-sm py-2.5 rounded-[40px] text-[14px] font-bold text-[#111827] active:scale-95 transition-all flex items-center justify-center gap-2">
                Tahrirlash
              </button>
              <button className="flex-1 bg-[#111827] border border-[#111827] shadow-sm py-2.5 rounded-[40px] text-[14px] font-bold text-white active:scale-95 transition-all flex items-center justify-center gap-2">
                Ulashish
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[32px] p-2 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 mt-2">
            {[
              { icon: Package, label: "Buyurtmalarim", desc: "Faol va yakunlanganlar", href: "/orders" },
              { icon: CreditCard, label: "To'lov usullari", desc: "Karta va hamyonlar", href: "#" },
              { icon: MapPin, label: "Manzillarim", desc: "Yetkazib berish manzillari", href: "#" },
              { icon: Settings, label: "Sozlamalar", desc: "Ilova va hisob sozlamalari", href: "/settings" }
            ].map((item, index) => (
              <a key={index} href={item.href} className="flex items-center justify-between p-4 rounded-[24px] hover:bg-gray-50 active:scale-[0.98] transition-all group">
                <div className="flex items-center gap-4 border-b border-transparent group-hover:border-transparent">
                  <div className="w-[42px] h-[42px] rounded-full bg-[#F5F5F5] flex items-center justify-center text-gray-500 group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-gray-100">
                    <item.icon className="w-[20px] h-[20px]" strokeWidth={2} />
                  </div>
                  <div>
                    <h4 className="text-[15px] font-bold text-[#111827] tracking-tight">{item.label}</h4>
                    <p className="text-[12px] font-medium text-gray-400 mt-0.5">{item.desc}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300" strokeWidth={2.5} />
              </a>
            ))}
          </div>

          <div className="mt-8 mb-4 bg-white rounded-[32px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 flex flex-col gap-3">
            <Link href="/seller" className="w-full bg-[#00C853] text-[#111827] py-[18px] rounded-[40px] text-[15px] font-extrabold shadow-[0_2px_8px_rgba(0,200,83,0.3)] active:scale-[0.98] transition-all text-center flex items-center justify-center">
              Sotuvchi bo&apos;lish
            </Link>
            <button className="w-full bg-white text-red-500 py-[18px] rounded-[40px] text-[15px] font-extrabold border border-red-100 active:scale-[0.98] transition-all">
              Chiqish
            </button>
          </div>
        </>
      ) : null}
    </MarketplaceShell>
  );
}
