import { cookies } from "next/headers";
import { AdminActivationBanner } from "@/components/admin/AdminActivationBanner";
import { getOrCreateUser } from "@/lib/clerk";
import MainHeader from "@/components/layout/MainHeader";
import MainFooter from "@/components/layout/MainFooter";
import { AppSidebar } from "@/components/layout/AppSidebar";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { Outfit } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import type { Metadata } from "next";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-outfit",
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
  const cookieStore = await cookies();
  const isAdmin = user?.email === "alaqmarak0810@gmail.com";
  const isActivated = cookieStore.get("admin_session")?.value === "true";
  const showAdminBanner = isAdmin && !isActivated;

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${outfit.className} antialiased text-foreground`}
      >
        <GoogleAnalytics gaId="G-2WPNMVD1D5" />
        <ClerkProvider>
          {/* Wrapper for sticky footer layout */}
          <div className="flex h-screen overflow-hidden">
            {/* Sidebar */}
            {user && <AppSidebar showAdmin={isAdmin && isActivated} />}

            {/* Main Content Area */}
            <div className="flex flex-col flex-1 overflow-y-auto relative">
              {showAdminBanner && user?.email && (
                <AdminActivationBanner email={user.email} />
              )}

              {/* --- Main Header --- */}
              <MainHeader />

              {/* --- Main Page Content --- */}
              <main className="flex-grow">
                {children}
              </main>

              {/* --- Main Footer --- */}
              <MainFooter />
            </div>
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