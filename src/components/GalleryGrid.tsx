"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface GalleryImage {
    id: number;
    image_url: string;
}

interface GalleryGridProps {
    images: GalleryImage[];
}

export default function GalleryGrid({ images }: GalleryGridProps) {
    if (!images || images.length === 0) return null;

    // Limit to 9 images according to rules
    const displayImages = images.slice(0, 9);
    const count = displayImages.length;

    // Rules:
    // 2 images: 2 columns (1 row, large)
    // 3 images: 3 columns (1 row)
    // 4 images: 2 columns (2 rows)
    // 6 images: 3 columns (2 rows)
    // 9 images: 3 columns (3 rows)

    let gridCols = "grid-cols-3";
    let gap = "gap-3";

    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    const handleNext = useCallback(() => {
        if (selectedIndex !== null) {
            setSelectedIndex((selectedIndex + 1) % count);
        }
    }, [selectedIndex, count]);

    const handlePrev = useCallback(() => {
        if (selectedIndex !== null) {
            setSelectedIndex((selectedIndex - 1 + count) % count);
        }
    }, [selectedIndex, count]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (selectedIndex === null) return;
            if (e.key === "Escape") setSelectedIndex(null);
            if (e.key === "ArrowRight") handleNext();
            if (e.key === "ArrowLeft") handlePrev();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedIndex, handleNext, handlePrev]);

    useEffect(() => {
        if (selectedIndex !== null) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }

        return () => {
            document.body.style.overflow = "";
        };
    }, [selectedIndex]);

    return (
        <div className="w-full px-8 mb-20">
            <div className={`grid ${gridCols} ${gap}`}>
                {displayImages.map((img, index) => (
                    <div
                        key={img.id}
                        onClick={() => setSelectedIndex(index)}
                        className="relative aspect-square rounded-2xl overflow-hidden border border-brand-gold/10 shadow-sm hover:shadow-md transition-all duration-500 hover:scale-[1.02] cursor-pointer"
                    >
                        <Image
                            src={img.image_url}
                            alt="Beelia Gallery"
                            fill
                            className="object-cover"
                            sizes="(max-width: 600px) 33vw, 200px"
                        />
                    </div>
                ))}
            </div>

            {/* Premium Lightbox Overlay */}
            {selectedIndex !== null && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-obsidian/95 backdrop-blur-md animate-in fade-in duration-300"
                    onClick={() => setSelectedIndex(null)}
                >
                    <button
                        className="absolute top-8 right-8 text-brand-gold p-2 hover:scale-110 active:scale-95 transition-all z-[110]"
                        onClick={() => setSelectedIndex(null)}
                    >
                        <X className="w-8 h-8" />
                    </button>

                    {count > 1 && (
                        <>
                            <button
                                className="absolute left-4 sm:left-8 text-brand-gold/50 hover:text-brand-gold p-4 hover:scale-110 active:scale-95 transition-all z-[110]"
                                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                            >
                                <ChevronLeft className="w-10 h-10" />
                            </button>
                            <button
                                className="absolute right-4 sm:right-8 text-brand-gold/50 hover:text-brand-gold p-4 hover:scale-110 active:scale-95 transition-all z-[110]"
                                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                            >
                                <ChevronRight className="w-10 h-10" />
                            </button>
                        </>
                    )}

                    <div
                        className="relative w-[90vw] h-[70vh] sm:w-[80vw] sm:h-[80vh] animate-in zoom-in-95 duration-500"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Image
                            src={displayImages[selectedIndex].image_url}
                            alt="Beelia Gallery Fullview"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>

                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-2">
                        {displayImages.map((_, i) => (
                            <div
                                key={i}
                                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === selectedIndex ? 'bg-brand-gold w-4' : 'bg-brand-gold/20'}`}
                            />
                        ))}
                    </div>
                </div>
            )}
            {images.length > 9 && (
                <p className="text-center text-[9px] text-brand-obsidian/20 tracking-[0.2em] font-bold uppercase mt-6">
                    MÁS EN NUESTRO INSTAGRAM
                </p>
            )}
        </div>
    );
}
