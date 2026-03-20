import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="w-full max-w-[400px] space-y-6">
                {/* Branding */}
                <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-primary/10">
                        <span className="text-base font-bold tracking-tight text-primary">MK</span>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            MilaKnight OS
                        </h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Agency Operating System
                        </p>
                    </div>
                </div>

                {/* Card */}
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
                    <div className="space-y-1">
                        <h2 className="text-[15px] font-semibold tracking-tight">Welcome back</h2>
                        <p className="text-sm text-muted-foreground">Sign in to continue to your workspace</p>
                    </div>

                    <Suspense fallback={
                        <div className="text-center text-sm py-6 text-muted-foreground animate-pulse">Loading...</div>
                    }>
                        <LoginForm />
                    </Suspense>
                </div>

                <p className="text-center text-[11px] text-muted-foreground">
                    © 2026 MilaKnight · All rights reserved
                </p>
            </div>
        </div>
    );
}
