import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Database Kopi",
    template: "%s - Database Kopi",
  },
  description:
      "Pendataan baseline desa dan petani kopi - kondisi wilayah, kelembagaan, bisnis kopi, dan konservasi",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
      <html
          lang="id"
          suppressHydrationWarning
          className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
      <body className="min-h-full flex flex-col">
      {/* Set tema sebelum paint agar tidak ada kedipan putih saat mode gelap.
          Prioritas: pilihan pengguna (localStorage) -> preferensi OS. */}
      <script
          dangerouslySetInnerHTML={{
            __html:
                "(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();",
          }}
      />
      {children}
      </body>
      </html>
  );
}