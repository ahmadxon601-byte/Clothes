import { ArrowRight } from 'lucide-react';

export function Splash() {


    const slides = [
        {
            title: "Find Your Style",
            desc: "Discover the best outfits tailored just for you.",
            img: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800"
        }
    ];

    return (
        <div className="min-h-screen bg-white flex flex-col relative max-w-md mx-auto">
            <div className="flex-1 relative">
                <img
                    src={slides[0].img}
                    alt="Splash"
                    className="w-full h-[65vh] object-cover rounded-b-[40px]"
                />
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent" />
            </div>

            <div className="px-6 pb-12 pt-8 flex flex-col items-center text-center">
                <div className="flex gap-1.5 mb-8">
                    <div className="w-6 h-1.5 bg-lime-400 rounded-full"></div>
                    <div className="w-1.5 h-1.5 bg-gray-200 rounded-full"></div>
                    <div className="w-1.5 h-1.5 bg-gray-200 rounded-full"></div>
                </div>

                <h1 className="text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">
                    {slides[0].title}
                </h1>
                <p className="text-gray-500 text-base mb-10 max-w-[280px]">
                    {slides[0].desc}
                </p>

                <button className="w-full bg-gray-900 text-white font-bold py-4 rounded-full flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                    Get Started <ArrowRight className="w-5 h-5 text-lime-400" />
                </button>
            </div>
        </div>
    );
}
