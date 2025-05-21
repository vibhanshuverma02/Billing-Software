"use client";

import "@/app/globals.css";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { ModeToggle } from "@/components/ui/mode-toggle";
import Sidebar from "@/components/ui/sidebar";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { SplashScreen } from "@/components/ui/SplaashScreen";


export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const [showSplash, setShowSplash] = useState(pathname === "/dashboard");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (pathname === "/dashboard") {
      setShowSplash(true);
      const timer = setTimeout(() => setShowSplash(false), 3000);
      return () => clearTimeout(timer);
    } else {
      setShowSplash(false);
    }
  }, [pathname]);

  const handleSignOut = () => {
    signOut({ callbackUrl: "/sign-in" });
  };

  if (!isMounted) {
    return <div className="p-5">Loading...</div>;
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {showSplash && pathname === "/dashboard" ? (
        <SplashScreen />
      ) : (
        <>
          {/* Header Controls */}
          <div className="fixed top-4 right-4 z-20 flex gap-4 items-center">
            {pathname === "/dashboard" && (
              <button
                onClick={handleSignOut}
                className="px-3 py-1 text-sm rounded bg-blue-500 text-white hover:bg-blue-600 transition"
              >
                Sign Out
              </button>
            )}
            <ModeToggle />
          </div>

          {/* Centered Logo for non-dashboard routes */}
          {pathname !== "/dashboard" && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
              <img
                src="/images/final2-Photoroom.png"
                alt="KSC Logo"
                className="w-14 sm:w-20 md:w-24 object-contain"
              />
            </div>
          )}

          {/* Layout Body */}
          <div className="min-h-screen w-full flex flex-col md:flex-row items-center md:items-start justify-start p-4 sm:p-6 relative gap-4">
            <Sidebar />
            <div className="w-full max-w-7xl px-4 py-6 space-y-6 overflow-x-hidden">
              <main className="space-y-4">{children}</main>
            </div>
          </div>
        </>
      )}
    </ThemeProvider>
  );
}
