import { ArrowRight, Mail, Lock } from 'lucide-react';

export function SignIn() {
    return (
        <div className="min-h-screen bg-white flex flex-col p-6 max-w-md mx-auto relative">
            <div className="flex-1 flex flex-col justify-center">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">Welcome Back</h1>
                <p className="text-gray-500 mb-8 font-medium">Sign in to your account to continue</p>

                <div className="space-y-4">
                    <div className="relative">
                        <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="email"
                            placeholder="Email address"
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-[20px] focus:ring-2 focus:ring-lime-400 focus:bg-white focus:border-transparent outline-none transition-all placeholder:text-gray-400 text-gray-900 font-medium"
                        />
                    </div>
                    <div className="relative">
                        <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="password"
                            placeholder="Password"
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-[20px] focus:ring-2 focus:ring-lime-400 focus:bg-white focus:border-transparent outline-none transition-all placeholder:text-gray-400 text-gray-900 font-medium"
                        />
                    </div>
                </div>

                <div className="mt-5 flex justify-end">
                    <a href="#" className="text-sm font-bold text-gray-900 hover:text-gray-700">Forgot Password?</a>
                </div>

                <button className="mt-8 w-full bg-lime-400 text-[#1a2e05] font-bold py-4 rounded-full flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-[0_8px_30px_rgba(163,230,53,0.3)]">
                    Sign In <ArrowRight className="w-5 h-5" />
                </button>
            </div>

            <div className="mt-auto text-center pb-8 pt-4">
                <p className="text-gray-500 text-sm font-medium">
                    Don't have an account? <a href="#" className="font-bold text-gray-900 hover:underline">Sign Up</a>
                </p>
            </div>
        </div>
    );
}
