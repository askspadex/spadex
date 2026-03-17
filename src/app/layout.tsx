import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "@/styles/globals.css";
import { cn } from "@/lib/utils";
import { Session_Provider } from "@/providers/session-provider";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SpadeX Store - Premium Products, Seamless Shopping",
  description: "SpadeX Store is a modern ecommerce platform offering premium products with secure checkout, fast delivery, and seamless shopping experience.",
  keywords: "SpadeX Store, ecommerce, premium products, secure checkout, fast delivery, seamless shopping",
  icons: {
    icon: "/logo/logo.png", // Change it later to your actual logo 
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable)}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Session_Provider>
          {children}
        </Session_Provider>
      </body>
    </html>
  );
}
