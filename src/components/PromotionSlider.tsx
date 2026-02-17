"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronRight } from "lucide-react";

interface Promotion {
    id: number;
    title: string;
    description: string;
    image_url: string;
    external_link: string;
    start_date: string;
    end_date: string;
}

export default function PromotionSlider({ promotions }: { promotions: Promotion[] }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (promotions.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % promotions.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [promotions.length]);

    if (promotions.length === 0) return null;

    return (
        <div className="w-full px-8 mb-10 overflow-hidden">
            <div className="relative aspect-[16/8] w-full rounded-[2.5rem] overflow-hidden shadow-2xl group">
                {promotions.map((promo, index) => (
                    <div
                        key={promo.id}
                        className={`absolute inset-0 transition-all duration-1000 ease-in-out ${index === currentIndex ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10 pointer-events-none"
                            }`}
                    >
                        {promo.image_url ? (
                            <Image
                                src={promo.image_url}
                                alt={promo.title}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-brand-pearl to-[#F0EBE5] flex items-center justify-center">
                                <span className="font-serif text-brand-gold italic">Promo</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8">
                            <h3 className="text-white font-serif text-2xl mb-1">{promo.title}</h3>
                            <p className="text-white/70 text-xs line-clamp-1 mb-4 italic">{promo.description}</p>
                            {promo.external_link && (
                                <a
                                    href={promo.external_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center space-x-2 text-brand-gold text-[10px] font-bold tracking-[0.2em] uppercase hover:underline"
                                >
                                    <span>Ver más</span>
                                    <ChevronRight className="w-3 h-3" />
                                </a>
                            )}
                        </div>
                    </div>
                ))}

                {/* Dots Indicator */}
                {promotions.length > 1 && (
                    <div className="absolute bottom-6 right-8 flex space-x-2">
                        {promotions.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`h-1 rounded-full transition-all duration-500 ${index === currentIndex ? "w-6 bg-brand-gold" : "w-1.5 bg-white/30"
                                    }`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
