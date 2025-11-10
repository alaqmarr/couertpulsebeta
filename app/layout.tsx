import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "react-hot-toast";

// Import the new layout components
import MainHeader from "@/components/layout/MainHeader";
import MainFooter from "@/components/layout/MainFooter";
import { DockDemo } from "@/components/Dock";
import { getOrCreateUser } from "@/lib/clerk";

import { Poppins } from "next/font/google";
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "CourtPulse",
  description: "Real-time scoring and analytics for badminton teams and tournaments.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getOrCreateUser();
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${poppins.className} antialiased text-foreground`}
      >
        <ClerkProvider>
          {/* Wrapper for sticky footer layout */}
          <div className="flex flex-col min-h-screen">

            {/* --- Main Header --- */}
            <MainHeader />

            {/* --- Main Page Content --- */}
            <main className="flex-grow">
              {children}
            </main>
            {/* App-wide UI (like the dock) */}
            {user && (
              <DockDemo />
            )}
            {/* --- Main Footer --- */}
            <MainFooter />

          </div>

          {/* Styled Toaster for glass effect */}
          <Toaster
            position="bottom-right"
            toastOptions={{
              className:
                "bg-card/90 backdrop-blur-md text-foreground border border-primary/20 shadow-lg",
            }}
          />
        </ClerkProvider>
      </body>
    </html>
  );
}