"use client";

import "@/app/globals.css";
// import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { ModeToggle } from "@/components/ui/mode-toggle";
import Sidebar from "@/components/ui/sidebar";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

// const inter = Inter({ subsets: ["latin"] });
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const pathname = usePathname();

  useEffect(() => {
    setIsMounted(true);

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768); // Tailwind's sm: breakpoint
    };

    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  if (!isMounted) {
    return <div className="p-5">Loading...</div>;
  }

 // Determine background size based on route & device
const backgroundSizes: Record<string, { mobile: string; desktop: string }> = {
  "/dashboard": { mobile: "110% 20%", desktop: "80% 60%" },
  "/trial": { mobile: "40% 11%", desktop: "35% 20%" },
  "/test": { mobile: "20% 5%", desktop: "20% 7%" },
  "/employee":{ mobile: "45% 9%", desktop: "30% 15%" },
};

let backgroundSize = "40% 20.5%"; // default

// Match by prefix instead of exact path
for (const route in backgroundSizes) {
  if (pathname.startsWith(route)) {
    backgroundSize = isMobile
      ? backgroundSizes[route].mobile
      : backgroundSizes[route].desktop;
    break;
  }
}

const handleSignOut = () => {
  signOut({ callbackUrl: "/sign-in" }); // Redirect to /sign-in
};

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {/* Top Bar with ModeToggle and Sign Out */}
      <div className="absolute top-15 right-4">
        {pathname === "/dashboard" && (
          <button
            onClick={handleSignOut}
            className="px-2 py-1 rounded hover:bg-blue-600 transition"
          >
            Sign Out
          </button>
        )}
      </div>

      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>

      {/* Background and Layout Wrapper */}
      <div
        className="min-h-screen flex flex-col items-center justify-center bg-no-repeat bg-left p-6"
        style={{
          backgroundImage: "url('/images/final2-Photoroom.png')",
          backgroundSize: backgroundSize,
          backgroundPosition: "top",
        }}
      >
        <div>
          <Sidebar />

          {/* Main Content */}
          <div className="p-6 space-y-6 overflow-x-hidden">
            <main className="space-y-3">{children}</main>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
