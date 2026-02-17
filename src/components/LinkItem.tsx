"use client";

import { Play } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface LinkItemProps {
    id: number;
    label: string;
    url: string;
}

export default function LinkItem({ id, label, url }: LinkItemProps) {
    const handleClick = async () => {
        // Increment click count in Supabase via RPC
        await supabase.rpc("increment_link_click", { link_id: id });
    };

    return (
        <a
            href={url}
            onClick={handleClick}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center w-full bg-white hover:bg-brand-pearl/50 border border-brand-gold/20 hover:border-brand-gold/40 rounded-2xl p-4 transition-all duration-300 hover:shadow-lg active:scale-95"
        >
            <div className="flex-shrink-0 mr-4 transition-transform group-hover:scale-110">
                <Play className="w-2.5 h-2.5 fill-brand-gold text-brand-gold" />
            </div>
            <span className="text-[12px] tracking-[0.2em] font-bold text-brand-obsidian/80 uppercase">
                {label}
            </span>
        </a>
    );
}
