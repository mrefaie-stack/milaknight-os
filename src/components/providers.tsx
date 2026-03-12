'use client';

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/contexts/language-context";
import { Toaster } from "@/components/ui/sonner";
import { CommandPalette } from "@/components/dashboard/command-palette";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <LanguageProvider>
          <div className="mesh-background" aria-hidden="true" />
          <CommandPalette />
          <main className="relative z-10 min-h-screen">
            {children}
          </main>
          <Toaster position="top-center" richColors />
        </LanguageProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
