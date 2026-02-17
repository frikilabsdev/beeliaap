import { Play, Download, Heart } from "lucide-react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import LinkItem from "@/components/LinkItem";
import PromotionSlider from "@/components/PromotionSlider";
import { PushSubscription } from "@/components/PushSubscription";
import GalleryGrid from "@/components/GalleryGrid";
import GoogleReviews from "@/components/GoogleReviews";

// Use 'force-dynamic' to ensure we always get the latest data from Supabase
export const revalidate = 0;

export default async function Home() {
    // Fetch site configuration, active links, and promotions in parallel
    const [configResponse, linksResponse, promotionsResponse, galleryResponse] = await Promise.all([
        supabase.from("config").select("*").single(),
        supabase.from("links").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
        supabase.from("promotions")
            .select("*")
            .eq("is_active", true)
            .or(`end_date.is.null,end_date.gt.${new Date().toISOString()}`)
            .order("created_at", { ascending: false }),
        supabase.from("gallery").select("*").order("sort_order", { ascending: true }).limit(9)
    ]);

    const config = configResponse.data || {
        site_name: "Beelia",
        social_handle: "@beelia.shop",
        site_description: "Joyas que cuentan tu historia. Descubre nuestra colección exclusiva."
    };

    const links = linksResponse.data || [];
    const promotions = promotionsResponse.data || [];
    const gallery = galleryResponse.data || [];

    return (
        <main className="min-h-[100dvh] bg-white flex flex-col items-center overflow-x-hidden">
            {/* Centered container for Desktop harmony */}
            <div className="w-full max-w-[600px] flex flex-col items-center bg-white min-h-[100dvh] shadow-[0_0_50px_rgba(0,0,0,0.02)]">

                {/* Header Banner */}
                <div className="relative w-full aspect-[16/9] md:aspect-[21/9] overflow-hidden sm:rounded-b-[2.5rem] lg:rounded-t-[2.5rem] lg:mt-6 transition-all duration-700 ease-out shadow-sm pt-[env(safe-area-inset-top)] bg-brand-gold/10">
                    <Image
                        src={config.header_image_url || "/img/header.png"}
                        alt="Beelia Floral Header"
                        fill
                        className="object-cover scale-105 hover:scale-100 transition-transform duration-[2000ms]"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Profile Section */}
                <div className="relative -mt-20 md:-mt-24 flex flex-col items-center z-10 px-6">
                    <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-full border-[8px] border-white shadow-2xl overflow-hidden bg-brand-pearl mb-8 transition-all hover:scale-[1.02] duration-500">
                        {config.profile_image_url ? (
                            <Image src={config.profile_image_url} alt={config.site_name} fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-pearl to-[#F0EBE5]">
                                <span className="font-serif text-6xl text-brand-gold italic">
                                    {config.site_name?.[0] || "B"}
                                </span>
                            </div>
                        )}
                    </div>

                    <h1 className="font-serif text-5xl text-brand-obsidian mb-1 tracking-tight">
                        {config.site_name}
                    </h1>
                    <p className="text-sm font-sans tracking-[0.25em] text-brand-obsidian font-bold mb-6 uppercase opacity-90">
                        {config.social_handle}
                    </p>

                    {/* Primary Actions: Contact & Notifications */}
                    <div className="flex w-full space-x-4 mb-10 px-1">
                        {/* Guardar Contacto */}
                        <a
                            href={config.vcard_url || "/beelia.vcf"}
                            download="Beelia.vcf"
                            className="flex-[1.2] group flex items-center justify-center space-x-3 px-4 py-5 bg-brand-gold text-white rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 active:scale-95"
                        >
                            <Download className="w-4 h-4 text-white/90 group-hover:animate-bounce" />
                            <span className="text-[11px] tracking-[0.2em] font-bold uppercase whitespace-nowrap">CONTACTO</span>
                        </a>

                        {/* Push Notification */}
                        <PushSubscription />
                    </div>

                    <p className="text-[11px] tracking-[0.2em] text-brand-obsidian/50 font-semibold uppercase mb-10 text-center max-w-[280px] leading-relaxed">
                        {config.site_description}
                    </p>
                </div>

                {/* Promotions Slider */}
                <PromotionSlider promotions={promotions} />

                {/* Links List - Dynamic from Supabase */}
                <div className="w-full px-8 space-y-4 mb-16">
                    {links.map((link) => (
                        <LinkItem key={link.id} id={link.id} label={link.title} url={link.url} />
                    ))}
                    {links.length === 0 && (
                        <p className="text-center text-xs text-brand-obsidian/20 italic tracking-widest uppercase">
                            No hay enlaces disponibles
                        </p>
                    )}
                </div>

                {/* Google Reviews Section */}
                <GoogleReviews />

                {/* Gallery Section */}
                <GalleryGrid images={gallery} />

                {/* Footer */}
                <footer className="mt-auto px-8 pb-[calc(110px+env(safe-area-inset-bottom))] pt-16 flex flex-col items-center">
                    <div className="w-12 h-[1px] bg-brand-gold/20 mb-8" />

                    <div className="flex flex-col items-center space-y-3 md:block text-[10px] text-brand-obsidian/60 tracking-[0.25em] uppercase font-bold text-center leading-relaxed">
                        <div className="flex items-center justify-center space-x-2 mb-1">
                            <span>© 2026 BEELIA SHOP</span>
                            <span className="w-1 h-1 rounded-full bg-brand-gold/40" />
                            <span className="flex items-center">
                                HECHO CON <Heart className="w-3 h-3 mx-1.5 fill-brand-gold text-brand-gold animate-pulse" /> POR
                            </span>
                        </div>
                        <a
                            href="https://frikilabs.click"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-gold hover:text-brand-gold/80 transition-colors underline decoration-brand-gold/30 underline-offset-4"
                        >
                            FRIKILABS.CLICK
                        </a>
                    </div>
                </footer>
            </div>
        </main>
    );
}
