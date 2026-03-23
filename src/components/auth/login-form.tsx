"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export function LoginForm() {
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

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
        <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
                <Label htmlFor="email" className="section-label">
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
                        className="pl-10"
                    />
                </div>
            </div>

            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="section-label">
                        Password
                    </Label>
                    <Link
                        href="/forgot-password"
                        className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                    >
                        Forgot password?
                    </Link>
                </div>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
                    <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        disabled={isLoading}
                        required
                        className="pl-10 pr-10"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground"
                        tabIndex={-1}
                    >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>
            </div>

            <Button disabled={isLoading} className="w-full">
                {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <ArrowRight className="h-4 w-4" />
                )}
                {isLoading ? "Signing in..." : "Sign In"}
            </Button>
        </form>
    );
}
