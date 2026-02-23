import { TopBar } from '../../components/TopBar';
import { Store, MapPin, Phone, CreditCard } from 'lucide-react';

export function Settings() {
    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans">
            <TopBar title="Store Settings" />

            <main className="max-w-md mx-auto px-4 pt-6 space-y-6">
                <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 text-center">
                    <div className="w-24 h-24 rounded-full bg-lime-100 mx-auto flex items-center justify-center mb-4 relative">
                        <Store className="w-10 h-10 text-lime-600" />
                        <button className="absolute bottom-0 right-0 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm active:scale-95 transition-transform">
                            <span className="text-xs leading-none">+</span>
                        </button>
                    </div>
                    <h2 className="text-xl font-extrabold text-gray-900 mb-1 tracking-tight">Urban Trends</h2>
                    <p className="text-sm font-medium text-gray-500">Premium Streetwear</p>
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-500 ml-4 uppercase tracking-wider">Store Information</h3>

                    <div className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-gray-100">
                        <div className="p-4 flex items-center gap-4 border-b border-gray-100">
                            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 shrink-0">
                                <Store className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs font-bold text-gray-500">Store Name</label>
                                <input type="text" defaultValue="Urban Trends" className="w-full text-sm font-bold text-gray-900 outline-none block mt-1" />
                            </div>
                        </div>

                        <div className="p-4 flex items-center gap-4 border-b border-gray-100">
                            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 shrink-0">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs font-bold text-gray-500">Location</label>
                                <input type="text" defaultValue="New York, USA" className="w-full text-sm font-bold text-gray-900 outline-none block mt-1" />
                            </div>
                        </div>

                        <div className="p-4 flex items-center gap-4 border-b border-gray-100">
                            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 shrink-0">
                                <Phone className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs font-bold text-gray-500">Contact Number</label>
                                <input type="text" defaultValue="+1 (555) 123-4567" className="w-full text-sm font-bold text-gray-900 outline-none block mt-1" />
                            </div>
                        </div>

                        <div className="p-4 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 shrink-0">
                                <CreditCard className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs font-bold text-gray-500">Payout Account</label>
                                <input type="text" defaultValue="**** **** **** 4890" className="w-full text-sm font-bold text-gray-900 outline-none block mt-1" disabled />
                            </div>
                        </div>
                    </div>
                </div>

                <button className="w-full bg-lime-400 text-[#1a2e05] font-bold py-4 rounded-full active:scale-95 transition-transform shadow-sm">
                    Save Changes
                </button>
            </main>
        </div>
    );
}
