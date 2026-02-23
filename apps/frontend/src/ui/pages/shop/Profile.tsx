import { TopBar } from '../../components/TopBar';
import { BottomNav } from '../../components/BottomNav';
import { Settings, Bookmark, ChevronRight, HelpCircle, ArrowLeft, Check, Store, LayoutDashboard } from 'lucide-react';

export function Profile() {
    const menuItems = [
        { icon: Bookmark, label: 'Sevimlilar', sublabel: 'Saqlangan mahsulotlar', badge: '', active: false },
        { icon: HelpCircle, label: 'Yordam / FAQ', sublabel: 'Savollarga javob', badge: '', active: false },
        { icon: Settings, label: 'Sozlamalar', sublabel: 'Til, tema, xavfsizlik', badge: '', active: false },
    ];

    return (
        <div className="min-h-screen bg-[#F5F5F5] pb-32 font-sans selection:bg-[#00C853]/20">
            <TopBar
                title="Profile"
                leftIcon={<ArrowLeft className="w-[22px] h-[22px] flex-shrink-0" strokeWidth={2.5} />}
                rightIcon={null}
            />

            <main className="max-w-md mx-auto px-5 pt-3">
                <div className="bg-white p-5 rounded-[32px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center gap-5 mb-5 border border-gray-100/50">
                    <div className="relative">
                        <div className="w-[88px] h-[88px] rounded-full overflow-hidden bg-gray-200 ring-[3px] ring-[#00C853] ring-offset-2">
                            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200" alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute bottom-0 right-0 w-[24px] h-[24px] bg-[#00C853] border-[2.5px] border-white rounded-full flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 text-white" strokeWidth={4} />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-[22px] font-extrabold text-[#111827] mb-1 tracking-tight leading-none">Ahmad</h2>
                        <p className="text-[14px] font-medium text-gray-400">User</p>
                    </div>
                </div>

                <div className="flex gap-[10px] mb-6">
                    <div className="flex-1 bg-white rounded-full py-[14px] px-4 text-center text-[13px] font-bold text-[#111827] border border-[#f3f4f6] shadow-sm tracking-wide">+998-xxx-xx-xx</div>
                    <div className="flex-1 bg-white rounded-full py-[14px] px-4 text-center text-[13px] font-bold text-[#111827] border border-[#f3f4f6] shadow-sm tracking-wide">Telegram user name</div>
                </div>

                <div className="space-y-[12px] mb-6">
                    {menuItems.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <button key={index} className="w-full bg-white flex items-center p-[16px] pr-5 hover:bg-gray-50 active:scale-[0.98] transition-all rounded-[28px] shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-100/50">
                                <div className="w-[52px] h-[52px] rounded-full bg-[#f4faed] flex items-center justify-center shrink-0">
                                    <Icon className="w-6 h-6 text-[#00C853]" strokeWidth={2.2} />
                                </div>
                                <div className="ml-4 text-left">
                                    <span className="font-extrabold text-[#111827] text-[16px] block mb-0.5">{item.label}</span>
                                    {item.sublabel && <span className="font-medium text-[#9CA3AF] text-[13px] block leading-none">{item.sublabel}</span>}
                                </div>

                                <div className="ml-auto flex items-center gap-3">
                                    <ChevronRight className="w-5 h-5 text-[#9CA3AF]" strokeWidth={2.5} />
                                </div>
                            </button>
                        )
                    })}
                </div>

                <div className="bg-white p-6 rounded-[28px] shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-[#f3f4f6] mb-6 relative overflow-hidden">
                    <h3 className="text-[17px] font-extrabold text-[#111827] mb-1.5 tracking-tight">Do'kon egasimisiz?</h3>
                    <p className="text-[13px] font-medium text-[#9CA3AF] mb-6 leading-[1.4] relative z-10 w-[80%]">
                        Mahsulotingizni joylang va stockni boshqaring!<br />
                        <span className="text-[11px] text-[#9CA3AF]/70 mt-1 block">Arizangiz qabul qilingandan so'ng faollashadi!</span>
                    </p>
                    <div className="flex gap-[10px] relative z-10">
                        <button className="flex-1 bg-[#00C853] text-[#111827] font-bold text-[14px] py-[14px] rounded-full flex items-center justify-center gap-2 shadow-[0_2px_10px_rgba(0,200,83,0.2)] active:scale-95 transition-all">
                            <Store className="w-[18px] h-[18px]" strokeWidth={2.5} /> Do'kon ochish
                        </button>
                        <button className="flex-1 bg-white text-[#111827] border-2 border-[#f3f4f6] font-bold text-[14px] py-[14px] rounded-full flex items-center justify-center gap-2 active:scale-95 transition-all">
                            <LayoutDashboard className="w-[18px] h-[18px]" strokeWidth={2.5} /> Sotuvchi paneli
                        </button>
                    </div>
                </div>
            </main>

            <BottomNav activeTab="profile" />
        </div>
    );
}
