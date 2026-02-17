"use client";

import { useState, useEffect } from "react";
import { Bell, BellRing, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { requestForToken, onMessageListener } from "@/lib/firebase";

export function PushSubscription() {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>("default");

    const [shouldVibrate, setShouldVibrate] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
            setIsIOS(ios);
            setIsStandalone(window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone);

            if ("Notification" in window) {
                setPermission(Notification.permission);

                const checkSubscription = async () => {
                    const token = localStorage.getItem("fcm_token");
                    if (token) setIsSubscribed(true);
                };
                checkSubscription();

                // Trigger vibration feedback after a short delay
                if (Notification.permission === "default") {
                    const timer = setTimeout(() => setShouldVibrate(true), 1500);
                    return () => clearTimeout(timer);
                }

                // Listen for foreground messages
                onMessageListener().then((payload: any) => {
                    console.log("Foreground message received:", payload);
                });
            }
        }
    }, []);

    const handleSubscribe = async () => {
        if (isIOS && !isStandalone) {
            alert("Para recibir alertas en iOS, por favor añade esta app a tu pantalla de inicio primero.");
            return;
        }

        if (!("Notification" in window)) {
            alert("Este navegador no soporta notificaciones.");
            return;
        }

        setLoading(true);
        try {
            const result = await Notification.requestPermission();
            setPermission(result);

            if (result === "granted") {
                const fcmToken = await requestForToken();

                if (fcmToken) {
                    setIsSubscribed(true);
                    localStorage.setItem("fcm_token", fcmToken);

                    await supabase.from("push_devices").upsert([
                        {
                            subscription_token: { token: fcmToken },
                            device_type: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? "mobile" : "desktop",
                            last_used_at: new Date().toISOString()
                        }
                    ], { onConflict: 'subscription_token' });
                }
            } else {
                alert("Las notificaciones fueron denegadas.");
            }
        } catch (error) {
            console.error("Error subscribing to push:", error);
        } finally {
            setLoading(false);
        }
    };

    if (permission === "denied") return null;

    return (
        <button
            onClick={handleSubscribe}
            disabled={loading || isSubscribed}
            className={`flex-1 flex items-center justify-center space-x-3 px-6 py-5 rounded-2xl border transition-all duration-300 shadow-lg active:scale-95 ${isSubscribed
                ? "bg-brand-pearl/20 border-brand-gold/10 text-brand-obsidian/40 cursor-default"
                : "bg-white border-brand-gold/20 text-brand-obsidian hover:shadow-xl hover:scale-[1.02]"
                }`}
        >
            {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-brand-gold" />
            ) : (
                <div className={`${shouldVibrate ? "animate-vibrate" : ""}`}>
                    {isSubscribed ? (
                        <BellRing className="w-5 h-5 text-brand-gold" />
                    ) : (
                        <Bell className="w-5 h-5 text-brand-gold/60" />
                    )}
                </div>
            )}
            <span className="text-[11px] tracking-[0.2em] font-bold uppercase whitespace-nowrap">
                {isSubscribed ? "SUSCRITO" : "ALERTAS"}
            </span>
        </button>
    );
}
