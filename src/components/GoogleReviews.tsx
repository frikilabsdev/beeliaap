"use client";

import { Star, MessageSquarePlus, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";

interface Review {
    text: string;
    rating: number;
    author: string;
}

interface ReviewsData {
    rating: number;
    reviewCount: string;
    reviews: Review[];
}

export default function GoogleReviews() {
    const [data, setData] = useState<ReviewsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const googleReviewUrl = "https://g.page/r/CRgLO5mCTm51EAE/review";

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const res = await fetch('/api/reviews');
                const json = await res.json();
                setData(json);
            } catch (err) {
                console.error("Failed to fetch reviews:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchReviews();
    }, []);

    // Auto-scroll logic for slider if multiple reviews
    useEffect(() => {
        if (data && data.reviews.length > 1) {
            const timer = setInterval(() => {
                setCurrentIndex((prev) => (prev + 1) % data.reviews.length);
            }, 6000);
            return () => clearInterval(timer);
        }
    }, [data]);

    const nextReview = () => {
        if (data) setCurrentIndex((prev) => (prev + 1) % data.reviews.length);
    };

    const prevReview = () => {
        if (data) setCurrentIndex((prev) => (prev - 1 + data.reviews.length) % data.reviews.length);
    };

    if (loading) {
        return (
            <div className="w-full px-8 mb-16 animate-pulse">
                <div className="bg-white rounded-3xl p-8 border border-brand-gold/10 h-64 flex flex-col items-center justify-center">
                    <div className="w-24 h-4 bg-gray-100 rounded-full mb-6"></div>
                    <div className="w-full h-12 bg-gray-50 rounded-2xl mb-8"></div>
                    <div className="w-48 h-10 bg-gray-100 rounded-xl"></div>
                </div>
            </div>
        );
    }

    const currentReview = data?.reviews[currentIndex];

    return (
        <div className="w-full px-8 mb-16">
            <div className="bg-white rounded-3xl p-8 border border-brand-gold/10 shadow-[0_10px_40px_rgba(0,0,0,0.03)] flex flex-col items-center relative overflow-hidden">

                {/* Header with Google Logo / Branding */}
                <div className="flex flex-col items-center mb-6">
                    <div className="flex items-center space-x-2">
                        <div className="flex space-x-0.5">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Star
                                    key={i}
                                    className={`w-4 h-4 ${i <= Math.round(data?.rating || 4) ? 'fill-brand-gold text-brand-gold' : 'text-brand-gold/20'}`}
                                />
                            ))}
                        </div>
                        <span className="text-lg font-serif font-bold text-brand-obsidian">{data?.rating || "4.0"}</span>
                    </div>
                    <p className="text-[8px] tracking-[0.2em] font-bold text-brand-obsidian/30 uppercase mt-1">
                        {data?.reviewCount || "1"} OPINIONES EN GOOGLE
                    </p>
                </div>

                {/* Review Content / Slider Area */}
                <div className="w-full relative min-h-[100px] flex items-center justify-center">
                    {data && data.reviews.length > 1 && (
                        <>
                            <button onClick={prevReview} className="absolute left-[-10px] p-2 text-brand-gold/40 hover:text-brand-gold transition-colors">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button onClick={nextReview} className="absolute right-[-10px] p-2 text-brand-gold/40 hover:text-brand-gold transition-colors">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </>
                    )}

                    <div className="relative text-center w-full px-4">
                        <div className="absolute -top-4 left-0 text-3xl font-serif text-brand-gold/10 pointer-events-none">"</div>
                        <p className="text-[13px] leading-relaxed italic text-brand-obsidian/70 font-medium animate-in fade-in duration-700">
                            {currentReview?.text || "Excelente servicio y atención."}
                        </p>
                        <div className="absolute -bottom-6 right-0 text-3xl font-serif text-brand-gold/10 pointer-events-none rotate-180">"</div>
                    </div>
                </div>

                {/* Slider Dots if multiple */}
                {data && data.reviews.length > 1 && (
                    <div className="flex space-x-1.5 mt-8 mb-2">
                        {data.reviews.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-brand-gold w-4' : 'bg-brand-gold/20'}`}
                            />
                        ))}
                    </div>
                )}

                {/* Info Text wrapper if no slider dots */}
                {(!data || data.reviews.length <= 1) && <div className="mt-8"></div>}

                {/* CTA Button */}
                <a
                    href={googleReviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full group flex items-center justify-center space-x-3 px-6 py-5 bg-brand-obsidian text-white rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 active:scale-95 border border-brand-obsidian"
                >
                    <MessageSquarePlus className="w-4 h-4 text-brand-gold group-hover:rotate-12 transition-transform" />
                    <span className="text-[11px] tracking-[0.2em] font-bold uppercase whitespace-nowrap">DEJAR UNA RESEÑA</span>
                </a>
            </div>
        </div>
    );
}
