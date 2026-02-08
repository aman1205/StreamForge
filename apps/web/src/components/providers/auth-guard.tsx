"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { Zap } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, user } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    setIsChecking(true);
    const isAuthPage =
      pathname?.startsWith("/login") || pathname?.startsWith("/register");
    const isPublicPage = pathname === "/"; // Landing page is public? Maybe. Let's assume dashboard is '/' for now based on user request "dashboard"

    // If we have a token, we are authenticated
    const isAuthenticated = !!token;

    if (isAuthenticated) {
      if (isAuthPage || pathname === "/") {
        // Redirect to dashboard if trying to access auth pages or landing page while logged in
        router.push("/dashboard");
      } else {
        // Allow access to protected pages
        setIsChecking(false);
      }
    } else {
      if (isAuthPage || pathname === "/") {
        // Allow access to auth pages and landing page
        setIsChecking(false);
      } else {
        // Redirect to login if trying to access protected pages
        router.push("/login");
      }
    }
  }, [token, pathname, router]);

  if (isChecking) {
    // Show a loading screen while checking auth state to prevent flash of content
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center stream-glow">
            <Zap className="w-8 h-8 text-background" />
          </div>
          <p className="text-muted-foreground font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
