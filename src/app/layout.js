import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";
import AnalyticsGate from "@/components/AnalyticsGate";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "UtilHub - Developer Tools",
  description: "A suite of developer utilities: JSON, YAML, Markdown, Base64, Hash, Regex, and more.",
  manifest: "/manifest.json",
  // Never leak the current URL (or its fragment-held tool state) to other sites
  referrer: "no-referrer",
};

// Runs before first paint so the saved theme applies without a flash or an empty server render.
const themeScript = `try{var t=localStorage.getItem("theme");if(t)document.documentElement.setAttribute("data-theme",t)}catch(e){}`;

import { OfflineIndicator } from "@/components/common/OfflineIndicator";

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ClientLayout>
          {children}
        </ClientLayout>
        <OfflineIndicator />
        <AnalyticsGate />
      </body>
    </html>
  );
}
