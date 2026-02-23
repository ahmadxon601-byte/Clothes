import { CheckCircle2, ArrowRight } from 'lucide-react';

export function OrderSuccess() {
    return (
        <div className="min-h-screen bg-white flex flex-col p-6 max-w-md mx-auto relative pt-12 text-center pb-8">
            <div className="flex-1 flex flex-col justify-center items-center">
                <div className="w-24 h-24 bg-lime-100 rounded-full flex items-center justify-center mb-8 relative">
                    <div className="absolute inset-0 bg-lime-400 opacity-20 animate-ping rounded-full"></div>
                    <CheckCircle2 className="w-12 h-12 text-lime-500" />
                </div>

                <h1 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">Order Successful!</h1>
                <p className="text-gray-500 mb-8 font-medium px-4">
                    Your order #123456789 has been placed successfully. You will receive an email confirmation shortly.
                </p>

                <div className="bg-gray-50 rounded-[24px] p-6 w-full mb-8 text-left">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-gray-500 font-medium">Date</span>
                        <span className="text-gray-900 font-bold">Today, 10:30 AM</span>
                    </div>
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-gray-500 font-medium">Payment</span>
                        <span className="text-gray-900 font-bold">Credit Card</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500 font-medium">Amount</span>
                        <span className="text-lime-600 font-extrabold text-lg">$215.00</span>
                    </div>
                </div>
            </div>

            <div className="mt-auto flex flex-col gap-3">
                <button className="w-full bg-gray-900 text-white font-bold py-4 rounded-full flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                    Track Order <ArrowRight className="w-5 h-5 text-lime-400" />
                </button>
                <button className="w-full bg-white text-gray-900 font-bold py-4 rounded-full border border-gray-200 active:bg-gray-50 transition-colors">
                    Continue Shopping
                </button>
            </div>
        </div>
    );
}
