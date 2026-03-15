"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Mail, Lock, ArrowRight } from "lucide-react";

function GoogleIcon() {
    return (
        <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
    );
}

export function LoginForm() {
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    async function onGoogleSignIn() {
        setGoogleLoading(true);
        await signIn("google", { callbackUrl: searchParams.get("from") || "/office" });
    }

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);

        const formData = new FormData(event.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        const signInResult = await signIn("credentials", {
            email: email.toLowerCase(),
            password,
            redirect: false,
        });

        setIsLoading(false);

        if (!signInResult?.ok) {
            return toast.error("Invalid email or password", {
                description: "Please check your credentials and try again.",
            });
        }

        const from = searchParams.get("from");
        if (from) {
            window.location.assign(from);
            return;
        }

        // Get session to redirect based on role directly
        const session = await getSession();
        const role = session?.user?.role?.toUpperCase();
        if (role === "ADMIN" || role === "MARKETING_MANAGER") {
            window.location.assign("/admin");
        } else if (role === "AM" || role === "ACCOUNT_MANAGER") {
            window.location.assign("/am");
        } else if (role === "CLIENT") {
            window.location.assign("/client");
        } else if (role === "HR_MANAGER") {
            window.location.assign("/hr-manager");
        } else if (role === "MODERATOR") {
            window.location.assign("/moderator");
        } else if (role === "ART_TEAM") {
            window.location.assign("/art-team");
        } else if (role === "ART_LEADER") {
            window.location.assign("/art-leader");
        } else if (role === "CONTENT_TEAM") {
            window.location.assign("/content-team");
        } else if (role === "CONTENT_LEADER") {
            window.location.assign("/content-leader");
        } else if (role === "SEO_TEAM") {
            window.location.assign("/seo-team");
        } else if (role === "SEO_LEAD") {
            window.location.assign("/seo-lead");
        } else {
            window.location.assign("/moderator");
        }
    }

    return (
        <div className="space-y-5">
        <Button
            type="button"
            onClick={onGoogleSignIn}
            disabled={googleLoading || isLoading}
            variant="outline"
            className="w-full h-12 font-bold rounded-xl border-white/10 bg-white/5 hover:bg-white/10 flex items-center gap-3"
        >
            {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
            Sign in with Google
        </Button>

        <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-muted-foreground font-medium">or</span>
            <div className="flex-1 h-px bg-white/10" />
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    Email Address
                </Label>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
                    <Input
                        id="email"
                        name="email"
                        placeholder="name@milaknight.com"
                        type="email"
                        autoCapitalize="none"
                        autoComplete="email"
                        autoCorrect="off"
                        disabled={isLoading}
                        required
                        className="pl-10 h-12 bg-white/5 border-white/10 rounded-xl focus-visible:border-primary/50 focus-visible:ring-primary/20 placeholder:text-muted-foreground/40"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    Password
                </Label>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        disabled={isLoading}
                        required
                        className="pl-10 h-12 bg-white/5 border-white/10 rounded-xl focus-visible:border-primary/50 focus-visible:ring-primary/20"
                    />
                </div>
            </div>

            <Button
                disabled={isLoading}
                className="w-full h-12 font-black uppercase tracking-widest rounded-xl shadow-xl shadow-primary/20 hover:scale-[1.01] transition-all"
            >
                {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <ArrowRight className="mr-2 h-4 w-4" />
                )}
                {isLoading ? "Signing in..." : "Sign In"}
            </Button>
        </form>
        </div>
    );
}
