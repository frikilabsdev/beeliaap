import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const playfair = Playfair_Display({
    subsets: ["latin"],
    variable: "--font-serif",
    display: "swap",
});

export const metadata: Metadata = {
    title: "Beelia | Linktree",
    description: "Enlace central de la marca Beelia - Joyería y accesorios",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "Beelia",
    },
    formatDetection: {
        telephone: false,
    },
    icons: {
        apple: "/apple-touch-icon.png",
    }
};

export const viewport: Viewport = {
    themeColor: "#D4AF37",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es" className={`${inter.variable} ${playfair.variable}`}>
            <body className="font-sans antialiased velvet-grain min-h-screen">
                {children}
            </body>
        </html>
    );
}
