import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import NextTopLoader from "nextjs-toploader";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Pingo · Cada lead tem uma origem",
  description: "Rastreie conversas do WhatsApp e dispare eventos para o Meta Pixel com precisão.",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${jakartaSans.variable} font-[family-name:var(--font-jakarta)] antialiased bg-zinc-950 text-zinc-100`}>
        <NextTopLoader
          color="#10b981"
          height={2}
          showSpinner={false}
          shadow="0 0 10px #10b981, 0 0 5px #10b981"
        />
        {children}
        <Toaster richColors theme="dark" position="top-right" />
      </body>
    </html>
  );
}
