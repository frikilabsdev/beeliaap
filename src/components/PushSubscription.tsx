"use client";

import { useState, useEffect } from "react";
import { Bell, BellRing, Loader2, Share2, PlusSquare, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { requestForToken, onMessageListener } from "@/lib/firebase";

export function PushSubscription() {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>("default");

    const [shouldVibrate, setShouldVibrate] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isChrome, setIsChrome] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const ua = navigator.userAgent;
            const ios = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
            const isChrome = /CriOS/i.test(ua);
            setIsIOS(ios);
            setIsChrome(isChrome);
            setIsStandalone(window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone);

            if ("Notification" in window) {
                setPermission(Notification.permission);

                const checkSW = async () => {
                    if ('serviceWorker' in navigator) {
                        try {
                            const registrations = await navigator.serviceWorker.getRegistrations();
                            console.log('Active SW registrations:', registrations.length);
                            registrations.forEach(r => console.log('SW Scope:', r.scope));
                        } catch (e) {
                            console.error('Error checking SW:', e);
                        }
                    }
                };
                checkSW();

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
                    if (payload.notification) {
                        alert(`Notificación: ${payload.notification.title}\n${payload.notification.body}`);
                    }
                });
            }
        }
    }, []);

    const handleSubscribe = async () => {
        if (isIOS && !isStandalone) {
            setShowInstructions(true);
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

                    const { error: upsertError } = await supabase.from("push_devices").upsert([
                        {
                            subscription_token: { token: fcmToken },
                            device_type: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? "mobile" : "desktop",
                            last_used_at: new Date().toISOString()
                        }
                    ], { onConflict: 'subscription_token' });

                    if (upsertError) {
                        console.error("Error saving token to database:", upsertError);
                        setIsSubscribed(false);
                        localStorage.removeItem("fcm_token");
                        alert("Hubo un error al guardar tu suscripción. Por favor, intenta de nuevo.");
                    }
                } else {
                    alert("No se pudo generar el token de notificaciones. Revisa la configuración Firebase/VAPID e intenta de nuevo.");
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

    // We no longer return null if denied, instead we show a "blocked" state to help user unblock
    // if (permission === "denied") return null;

    return (
        <>
            <button
                onClick={handleSubscribe}
                disabled={loading}
                className={`flex-1 flex items-center justify-center space-x-3 px-6 py-5 rounded-2xl border transition-all duration-300 shadow-lg active:scale-95 ${permission === "denied"
                    ? "bg-brand-pearl/20 border-brand-gold/10 text-brand-obsidian/40 cursor-default"
                    : isSubscribed
                        ? "bg-white border-brand-gold/40 text-brand-obsidian hover:shadow-xl hover:scale-[1.02]"
                        : "bg-white border-brand-gold/20 text-brand-obsidian hover:shadow-xl hover:scale-[1.02]"
                    }`}
            >
                {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-brand-gold" />
                ) : (
                    <div className={`${shouldVibrate ? "animate-vibrate" : ""}`}>
                        {permission === "denied" ? (
                            <Bell className="w-5 h-5 opacity-20" />
                        ) : isSubscribed ? (
                            <BellRing className="w-5 h-5 text-brand-gold" />
                        ) : (
                            <Bell className="w-5 h-5 text-brand-gold/60" />
                        )}
                    </div>
                )}
                <span className="text-[11px] tracking-[0.2em] font-bold uppercase whitespace-nowrap">
                    {permission === "denied" ? "BLOQUEADO" : isSubscribed ? "SUSCRITO" : "ALERTAS"}
                </span>
            </button>

            {/* iOS PWA Instructions Modal */}
            {showInstructions && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-12 sm:items-center sm:pb-0">
                    <div
                        className="fixed inset-0 bg-brand-obsidian/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setShowInstructions(false)}
                    />

                    <div className="relative w-full max-w-[400px] bg-white rounded-[2.5rem] p-8 shadow-2xl transform transition-all animate-in fade-in slide-in-from-bottom-8 duration-500">
                        <button
                            onClick={() => setShowInstructions(false)}
                            className="absolute top-6 right-6 p-2 text-brand-obsidian/20 hover:text-brand-obsidian transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 rounded-2xl bg-brand-pearl flex items-center justify-center mb-6 shadow-sm border border-brand-gold/10">
                                <BellRing className="w-10 h-10 text-brand-gold" />
                            </div>

                            <h3 className="font-serif text-3xl text-brand-obsidian mb-4">Activar Alertas</h3>
                            <p className="text-sm text-brand-obsidian/60 leading-relaxed mb-8 px-2">
                                Para recibir notificaciones exclusivas de Beelia en tu iPhone, debes añadir esta app a tu pantalla de inicio:
                            </p>

                            <div className="w-full space-y-6 text-left bg-brand-pearl/30 rounded-3xl p-6 border border-brand-gold/5 mb-8">
                                <div className="flex items-center space-x-4">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm border border-brand-gold/10">
                                        <Share2 className="w-4 h-4 text-brand-gold" />
                                    </div>
                                    <div className="text-xs text-brand-obsidian/80">
                                        Pulsa el botón de <strong>Compartir</strong> {isChrome ? "(en la barra superior)" : "(en la barra inferior)"}.
                                    </div>
                                </div>

                                <div className="flex items-center space-x-4">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm border border-brand-gold/10">
                                        <PlusSquare className="w-4 h-4 text-brand-gold" />
                                    </div>
                                    <div className="text-xs text-brand-obsidian/80">
                                        Selecciona la opción <strong>"Añadir a la pantalla de inicio"</strong>.
                                    </div>
                                </div>

                                <div className="flex items-center space-x-4">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-gold flex items-center justify-center shadow-sm">
                                        <BellRing className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="text-xs text-brand-obsidian/80">
                                        Abre la app desde tu inicio y pulsa <strong>"ALERTAS"</strong> nuevamente.
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowInstructions(false)}
                                className="w-full py-5 bg-brand-obsidian text-white rounded-2xl text-[11px] tracking-[0.2em] font-bold uppercase transition-all active:scale-95 shadow-lg"
                            >
                                ENTENDIDO
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
