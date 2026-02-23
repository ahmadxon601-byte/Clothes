import { ChevronLeft, Heart, Share2, Star } from 'lucide-react';
import { Chips } from '../../components/Chips';
import { Stepper } from '../../components/Stepper';
import { BottomSheetBar } from '../../components/BottomSheetBar';

const SIZES = ['XS', 'S', 'M', 'L', 'XL'];
const COLORS = ['#111827', '#F3F4F6', '#A3E635', '#EF4444'];

export function ProductDetails() {
    return (
        <div className="min-h-screen bg-white pb-32 font-sans relative">
            <div className="absolute top-0 left-0 right-0 z-40 px-4 pt-12 pb-4 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent">
                <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition-all">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="flex gap-3">
                    <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition-all">
                        <Share2 className="w-5 h-5" />
                    </button>
                    <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition-all">
                        <Heart className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="relative w-full h-[55vh] max-w-md mx-auto bg-gray-100">
                <img
                    src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800"
                    alt="Product"
                    className="w-full h-full object-cover"
                />
                <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
                    <div className="w-6 h-1.5 bg-white rounded-full"></div>
                    <div className="w-1.5 h-1.5 bg-white/50 rounded-full"></div>
                    <div className="w-1.5 h-1.5 bg-white/50 rounded-full"></div>
                </div>
            </div>

            <div className="max-w-md mx-auto px-4 pt-6 bg-white rounded-t-[32px] -mt-8 relative z-20">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <p className="text-lime-600 font-bold text-sm mb-1 uppercase tracking-wider">Essentials</p>
                        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Oversized Cotton Tee</h1>
                    </div>
                    <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-bold text-gray-900">4.8</span>
                    </div>
                </div>

                <p className="text-3xl font-extrabold text-gray-900 mb-6">$45.00</p>

                <div className="mb-6">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-base font-bold text-gray-900">Select Size</h3>
                        <button className="text-sm font-semibold text-gray-500 underline">Size Guide</button>
                    </div>
                    <Chips options={SIZES} activeOption="M" />
                </div>

                <div className="mb-6">
                    <h3 className="text-base font-bold text-gray-900 mb-3">Color</h3>
                    <div className="flex gap-3">
                        {COLORS.map((hex, i) => (
                            <button
                                key={i}
                                className={`w-10 h-10 rounded-full border-[3px] shadow-sm transition-transform active:scale-90
                  ${i === 0 ? 'border-lime-400 ring-2 ring-lime-100 ring-offset-2' : 'border-white'}
                `}
                                style={{ backgroundColor: hex }}
                            />
                        ))}
                    </div>
                </div>

                <div className="mb-8 flex items-center justify-between bg-gray-50 p-4 rounded-[24px]">
                    <h3 className="text-base font-bold text-gray-900">Quantity</h3>
                    <Stepper value={1} />
                </div>

                <div>
                    <h3 className="text-base font-bold text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-500 leading-relaxed text-sm">
                        Crafted from premium heavyweight organic cotton, this oversized tee features a relaxed drop-shoulder fit and ribbed crewneck. Perfect for everyday casual wear.
                    </p>
                </div>
            </div>

            <BottomSheetBar
                totalLabel="Total Price"
                totalPrice="$45.00"
                buttonText="Add to Cart"
            />
        </div>
    );
}
