import { Inter, Playfair_Display } from "next/font/google";
import "@/app/globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const playfair = Playfair_Display({
    subsets: ["latin"],
    variable: "--font-serif",
    display: "swap",
});

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className={`${inter.variable} ${playfair.variable} font-sans min-h-screen bg-[#FDFCFB] velvet-grain`}>
            {children}
        </div>
    );
}
