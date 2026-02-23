import { ArrowLeft, Mail } from 'lucide-react';

export function ForgotPassword() {
    return (
        <div className="min-h-screen bg-white flex flex-col p-6 max-w-md mx-auto relative pt-12">
            <button className="absolute top-6 left-4 w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-900 active:scale-95 transition-transform">
                <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex-1 flex flex-col mt-16">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">Forgot Password</h1>
                <p className="text-gray-500 mb-8 font-medium">
                    Enter your email address and we'll send you a link to reset your password.
                </p>

                <div className="space-y-4">
                    <div className="relative">
                        <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="email"
                            placeholder="Email address"
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-[20px] focus:ring-2 focus:ring-lime-400 focus:bg-white focus:border-transparent outline-none transition-all placeholder:text-gray-400 text-gray-900 font-medium"
                        />
                    </div>
                </div>

                <button className="mt-8 w-full bg-gray-900 text-white font-bold py-4 rounded-full flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                    Send Reset Link
                </button>
            </div>
        </div>
    );
}
