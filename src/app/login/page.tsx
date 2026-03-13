import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
            {/* Background glow orbs */}
            <div className="pointer-events-none absolute top-[-15%] left-[-10%] h-[55%] w-[55%] rounded-full bg-primary/20 blur-[140px]" />
            <div className="pointer-events-none absolute bottom-[-15%] right-[-10%] h-[45%] w-[45%] rounded-full bg-purple-500/15 blur-[120px]" />
            <div className="pointer-events-none absolute top-1/2 left-1/2 h-[30%] w-[30%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[80px]" />

            <div className="relative z-10 w-full max-w-[420px] space-y-8">
                {/* Branding */}
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 shadow-xl shadow-primary/10">
                        <span className="text-xl font-black tracking-tighter text-primary">MK</span>
                    </div>
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter premium-gradient-text">
                            MilaKnight OS
                        </h1>
                        <p className="mt-1 text-sm font-medium text-muted-foreground">
                            Agency Operating System
                        </p>
                    </div>
                </div>

                {/* Card */}
                <div className="rounded-3xl border border-white/10 bg-card/60 p-8 shadow-2xl shadow-black/30 backdrop-blur-xl space-y-6">
                    <div className="space-y-1">
                        <h2 className="text-xl font-black tracking-tight">Welcome back</h2>
                        <p className="text-sm text-muted-foreground">Sign in to continue to your workspace</p>
                    </div>

                    <Suspense fallback={
                        <div className="text-center text-sm py-6 text-muted-foreground animate-pulse">Loading...</div>
                    }>
                        <LoginForm />
                    </Suspense>
                </div>

                <p className="text-center text-[11px] text-muted-foreground opacity-50">
                    © 2026 MilaKnight · All rights reserved
                </p>
            </div>
        </div>
    );
}
