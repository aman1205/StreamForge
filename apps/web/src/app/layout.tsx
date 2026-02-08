import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { AuthGuard } from "@/components/providers/auth-guard";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "StreamForge - Event Streaming Platform",
  description: "Distributed Event Streaming & Real-Time Data Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          <AuthGuard>{children}</AuthGuard>
          <Toaster position="top-right" richColors />
        </QueryProvider>
      </body>
    </html>
  );
}
