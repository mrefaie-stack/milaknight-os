import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/20">
            <div className="w-full max-w-sm p-8 space-y-6 bg-card rounded-xl shadow-lg border border-border">
                <div className="flex flex-col space-y-2 text-center">
                    <h1 className="text-2xl font-bold tracking-tight">Login to MilaKnight OS</h1>
                    <p className="text-sm text-muted-foreground">
                        Enter your email to sign in to your account
                    </p>
                </div>
                <Suspense fallback={<div className="text-center text-sm p-4">Loading form...</div>}>
                    <LoginForm />
                </Suspense>
            </div>
        </div>
    );
}
