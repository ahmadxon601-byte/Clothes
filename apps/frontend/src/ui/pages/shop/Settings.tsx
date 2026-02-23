import { useState } from 'react';
import { TopBar } from '../../components/TopBar';
import { Moon, Bell, Shield, Lock, ChevronRight } from 'lucide-react';

export function Settings() {
    const [darkTheme, setDarkTheme] = useState(false);
    const [notifications, setNotifications] = useState(true);

    return (
        <div className="min-h-screen bg-gray-50 pb-10 font-sans">
            <TopBar title="Settings" />

            <main className="max-w-md mx-auto px-4 pt-6 space-y-6">

                <div>
                    <h2 className="text-sm font-bold text-gray-500 ml-4 mb-3 uppercase tracking-wider">Preferences</h2>
                    <div className="bg-white rounded-[32px] p-2 shadow-sm border border-gray-100">
                        <div className="flex items-center p-4">
                            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100 text-gray-700">
                                <Moon className="w-5 h-5" />
                            </div>
                            <span className="font-bold text-gray-900 text-sm ml-4">Dark Theme</span>
                            <div className="ml-auto">
                                <button
                                    onClick={() => setDarkTheme(!darkTheme)}
                                    className={`w-12 h-6 rounded-full p-1 transition-colors ${darkTheme ? 'bg-lime-400' : 'bg-gray-200'}`}
                                >
                                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${darkTheme ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center p-4">
                            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100 text-gray-700">
                                <Bell className="w-5 h-5" />
                            </div>
                            <span className="font-bold text-gray-900 text-sm ml-4">Push Notifications</span>
                            <div className="ml-auto">
                                <button
                                    onClick={() => setNotifications(!notifications)}
                                    className={`w-12 h-6 rounded-full p-1 transition-colors ${notifications ? 'bg-lime-400' : 'bg-gray-200'}`}
                                >
                                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${notifications ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <h2 className="text-sm font-bold text-gray-500 ml-4 mb-3 uppercase tracking-wider">Security</h2>
                    <div className="bg-white rounded-[32px] p-2 shadow-sm border border-gray-100">
                        <button className="w-full flex items-center p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors rounded-[24px]">
                            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100 text-gray-700">
                                <Lock className="w-5 h-5" />
                            </div>
                            <span className="font-bold text-gray-900 text-sm ml-4">Change Password</span>
                            <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
                        </button>
                        <button className="w-full flex items-center p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors rounded-[24px]">
                            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100 text-gray-700">
                                <Shield className="w-5 h-5" />
                            </div>
                            <span className="font-bold text-gray-900 text-sm ml-4">Privacy Policy</span>
                            <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
