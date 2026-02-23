import { TopBar } from '../../components/TopBar';
import { Camera } from 'lucide-react';

export function AddProduct() {
    return (
        <div className="min-h-screen bg-white pb-10 font-sans">
            <TopBar title="Add Product" />

            <main className="max-w-md mx-auto px-4 pt-6 space-y-6">
                {/* Image Upload Placeholder */}
                <div className="w-full aspect-video bg-gray-50 rounded-[24px] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 active:bg-gray-100 transition-colors cursor-pointer">
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm mb-3">
                        <Camera className="w-6 h-6 text-gray-700" />
                    </div>
                    <span className="font-bold text-sm text-gray-900">Upload Product Images</span>
                    <span className="text-xs font-medium mt-1">PNG, JPG up to 5MB</span>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2 ml-1">Product Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Essential Oversized Tee"
                            className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-[20px] focus:ring-2 focus:ring-lime-400 outline-none text-gray-900 font-medium"
                        />
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-bold text-gray-900 mb-2 ml-1">Price ($)</label>
                            <input
                                type="number"
                                placeholder="0.00"
                                className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-[20px] focus:ring-2 focus:ring-lime-400 outline-none text-gray-900 font-medium"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-bold text-gray-900 mb-2 ml-1">Stock</label>
                            <input
                                type="number"
                                placeholder="0"
                                className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-[20px] focus:ring-2 focus:ring-lime-400 outline-none text-gray-900 font-medium"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2 ml-1">Category</label>
                        <select className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-[20px] focus:ring-2 focus:ring-lime-400 outline-none text-gray-900 font-medium appearance-none">
                            <option>Select Category...</option>
                            <option>Clothing</option>
                            <option>Shoes</option>
                            <option>Accessories</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2 ml-1">Description</label>
                        <textarea
                            rows={4}
                            placeholder="Describe the product..."
                            className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-[24px] focus:ring-2 focus:ring-lime-400 outline-none text-gray-900 font-medium resize-none"
                        />
                    </div>
                </div>

                <div className="pt-4">
                    <button className="w-full bg-gray-900 text-white font-bold py-4 rounded-full active:scale-95 transition-transform shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                        Publish Product
                    </button>
                </div>
            </main>
        </div>
    );
}
