"use client";

import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { X, Check, Search } from "lucide-react";

interface ImageCropperProps {
    image: string;
    cropShape: "rect" | "round";
    aspect: number;
    onCropComplete: (croppedImage: Blob) => void;
    onCancel: () => void;
}

export default function ImageCropper({ image, cropShape, aspect, onCropComplete, onCancel }: ImageCropperProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

    const onCropChange = (crop: { x: number; y: number }) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom: number) => {
        setZoom(zoom);
    };

    const onCropAreaComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const createImage = (url: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener("load", () => resolve(image));
            image.addEventListener("error", (error) => reject(error));
            image.setAttribute("crossOrigin", "anonymous"); // needed to avoid cross-origin issues
            image.src = url;
        });

    const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<Blob> => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
            throw new Error("No 2d context");
        }

        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        );

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                if (blob) resolve(blob);
            }, "image/jpeg");
        });
    };

    const handleConfirm = async () => {
        try {
            const croppedImage = await getCroppedImg(image, croppedAreaPixels);
            onCropComplete(croppedImage);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-brand-obsidian/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
            <div className="relative w-full max-w-2xl aspect-square bg-white rounded-3xl overflow-hidden shadow-2xl">
                <Cropper
                    image={image}
                    crop={crop}
                    zoom={zoom}
                    aspect={aspect}
                    cropShape={cropShape}
                    onCropChange={onCropChange}
                    onZoomChange={onZoomChange}
                    onCropComplete={onCropAreaComplete}
                    showGrid={false}
                />
            </div>

            <div className="mt-8 w-full max-w-md bg-white/10 backdrop-blur-lg px-8 py-6 rounded-3xl border border-white/20 flex flex-col items-center space-y-6">
                <div className="w-full space-y-2">
                    <div className="flex justify-between text-xs text-white/50 uppercase tracking-widest font-bold">
                        <span>Zoom</span>
                        <span>{Math.round(zoom * 100)}%</span>
                    </div>
                    <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        aria-labelledby="Zoom"
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-full accent-brand-gold"
                    />
                </div>

                <div className="flex items-center space-x-4 w-full">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-6 py-3 border border-white/20 text-white rounded-full text-xs font-bold tracking-widest uppercase hover:bg-white/10 transition-all flex items-center justify-center space-x-2"
                    >
                        <X className="w-4 h-4" />
                        <span>Cancelar</span>
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-1 px-6 py-3 bg-brand-gold text-white rounded-full text-xs font-bold tracking-widest uppercase shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center space-x-2"
                    >
                        <Check className="w-4 h-4" />
                        <span>Confirmar</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
