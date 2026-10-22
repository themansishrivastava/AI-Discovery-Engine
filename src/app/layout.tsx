import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600"],
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Groww SIP Discovery Engine | PM Growth Workbench",
  description:
    "AI-Powered Discovery Engine & 12-Month SIP Retention Metric Decomposition for First-Time Mutual Fund Investors in India.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} ${inter.variable} ${jetbrains.variable} dark`}>
      <body className="font-sans antialiased selection:bg-[#00D09C]/20 selection:text-[#00D09C]">
        {children}
      </body>
    </html>
  );
}
