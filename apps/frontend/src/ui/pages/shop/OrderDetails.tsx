import { TopBar } from '../../components/TopBar';
import { Check } from 'lucide-react';

const TRACKING_STEPS = [
    { id: 1, title: 'Order Placed', date: 'Oct 24, 10:30 AM', completed: true },
    { id: 2, title: 'Processing', date: 'Oct 24, 14:15 PM', completed: true },
    { id: 3, title: 'Shipped', date: 'Oct 25, 09:00 AM', completed: true },
    { id: 4, title: 'Out for Delivery', date: 'Estimated: Oct 26', completed: false },
    { id: 5, title: 'Delivered', date: '', completed: false },
];

export function OrderDetails() {
    return (
        <div className="min-h-screen bg-gray-50 pb-10 font-sans">
            <TopBar title="Order Details" />

            <main className="max-w-md mx-auto px-4 pt-6 space-y-6">
                <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Tracking</h2>
                    <div className="relative pl-4 space-y-6">
                        <div className="absolute left-6 top-2 bottom-2 w-0.5 bg-gray-100 -z-0" />

                        {TRACKING_STEPS.map((step) => (
                            <div key={step.id} className="relative z-10 flex gap-4 items-start">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5
                  ${step.completed ? 'bg-lime-400' : 'bg-gray-200 border-2 border-white'}
                `}>
                                    {step.completed && <Check className="w-3 h-3 text-[#1a2e05] stroke-[3]" />}
                                </div>
                                <div>
                                    <h3 className={`font-bold text-sm ${step.completed ? 'text-gray-900' : 'text-gray-500'}`}>{step.title}</h3>
                                    {step.date && <p className="text-xs font-medium text-gray-400 mt-0.5">{step.date}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 mb-1">Delivery Address</h3>
                        <p className="text-xs font-medium text-gray-500">123 Fashion Street, Apt 4B<br />New York, NY 10001</p>
                    </div>
                </div>

                <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 space-y-4">
                    <h2 className="text-lg font-bold text-gray-900 mb-2">Order Summary</h2>
                    <div className="flex justify-between">
                        <span className="text-gray-500 font-medium text-sm">2 Items</span>
                        <span className="text-gray-900 font-bold text-sm">$165.00</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500 font-medium text-sm">Delivery</span>
                        <span className="text-gray-900 font-bold text-sm">$15.00</span>
                    </div>
                    <div className="h-px w-full bg-gray-100 my-2" />
                    <div className="flex justify-between items-center">
                        <span className="text-gray-900 font-bold">Total Amount</span>
                        <span className="text-lime-600 font-extrabold text-xl">$180.00</span>
                    </div>
                </div>
            </main>
        </div>
    );
}
