import { TopBar } from '../../components/TopBar';
import { BottomSheetBar } from '../../components/BottomSheetBar';
import { MapPin, CheckCircle2 } from 'lucide-react';

export function Checkout() {
    return (
        <div className="min-h-screen bg-gray-50 pb-32 font-sans">
            <TopBar title="Checkout" />

            <main className="max-w-md mx-auto px-4 pt-6">
                {/* Stepper UI */}
                <div className="flex justify-between items-center mb-8 px-2 relative">
                    <div className="absolute left-6 right-6 top-1/2 h-0.5 bg-gray-200 -z-0" />
                    <div className="absolute left-6 top-1/2 h-0.5 bg-lime-400 -z-0" style={{ width: '0%' }} />

                    <div className="flex flex-col items-center relative z-10 gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold shadow-md shadow-gray-300">1</div>
                        <span className="text-xs font-bold text-gray-900">Address</span>
                    </div>
                    <div className="flex flex-col items-center relative z-10 gap-2">
                        <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-200 text-gray-400 flex items-center justify-center font-bold">2</div>
                        <span className="text-xs font-bold text-gray-400">Payment</span>
                    </div>
                    <div className="flex flex-col items-center relative z-10 gap-2">
                        <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-200 text-gray-400 flex items-center justify-center font-bold">3</div>
                        <span className="text-xs font-bold text-gray-400">Review</span>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Shipping Address</h2>
                        <div className="bg-white p-5 rounded-[24px] border-2 border-lime-400 shadow-sm relative">
                            <div className="absolute top-4 right-4">
                                <CheckCircle2 className="w-6 h-6 text-lime-400" />
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-lime-100 flex items-center justify-center shrink-0">
                                    <MapPin className="w-5 h-5 text-lime-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-1">Home</h3>
                                    <p className="text-sm font-medium text-gray-500 mb-2">123 Fashion Street, Apt 4B<br />New York, NY 10001</p>
                                    <p className="text-sm font-semibold text-gray-900">+1 (555) 123-4567</p>
                                </div>
                            </div>
                        </div>

                        <button className="w-full mt-4 py-4 rounded-full border-2 border-dashed border-gray-300 text-gray-600 font-bold active:bg-gray-50">
                            + Add New Address
                        </button>
                    </div>

                    <div>
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Delivery Method</h2>
                        <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-gray-900 mb-1">Standard Delivery</h3>
                                <p className="text-sm font-medium text-gray-500">Est. 3-5 Business Days</p>
                            </div>
                            <span className="font-extrabold text-gray-900">$15.00</span>
                        </div>
                    </div>
                </div>
            </main>

            <BottomSheetBar
                totalLabel="Total Payment"
                totalPrice="$215.00"
                buttonText="Continue to Payment"
            />
        </div>
    );
}
