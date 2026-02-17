"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Lock, User, ArrowRight } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            router.push("/admin/dashboard");
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center p-6 bg-[#FDFCFB]">
            <div className="w-full max-w-md bg-white border border-[#F0EBE5] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.03)] overflow-hidden">
                <div className="p-8 md:p-12">
                    <div className="flex flex-col items-center mb-10">
                        <div className="w-16 h-16 rounded-full bg-brand-pearl border-2 border-brand-gold flex items-center justify-center mb-6 shadow-sm">
                            <span className="font-serif text-3xl text-brand-gold italic">B</span>
                        </div>
                        <h1 className="font-serif text-3xl text-brand-obsidian mb-2">Beelia Admin</h1>
                        <p className="text-sm text-brand-obsidian/40 tracking-widest uppercase font-bold">Inicia Sesión</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] tracking-[0.2em] font-bold text-brand-obsidian/50 uppercase ml-1">Email</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-obsidian/20" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@beelia.shop"
                                    className="w-full pl-12 pr-4 py-4 bg-brand-pearl/30 border border-[#F0EBE5] rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold/50 transition-all text-sm"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] tracking-[0.2em] font-bold text-brand-obsidian/50 uppercase ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-obsidian/20" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-4 py-4 bg-brand-pearl/30 border border-[#F0EBE5] rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold/50 transition-all text-sm"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100 italic">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="group w-full flex items-center justify-center space-x-3 px-8 py-4 bg-brand-obsidian text-white rounded-xl shadow-lg hover:shadow-xl hover:translate-y-[-1px] active:translate-y-[0] transition-all duration-300 disabled:opacity-50"
                        >
                            <span className="text-sm tracking-[0.1em] font-bold uppercase">
                                {loading ? "Accediendo..." : "Entrar al Panel"}
                            </span>
                            {!loading && <ArrowRight className="w-4 h-4 text-white/70 group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </form>
                </div>

                <div className="bg-brand-pearl/20 border-t border-[#F0EBE5] p-6 text-center">
                    <p className="text-[9px] text-brand-obsidian/30 tracking-[0.3em] uppercase font-bold">
                        Protected by Supabase Auth
                    </p>
                </div>
            </div>
        </main>
    );
}
