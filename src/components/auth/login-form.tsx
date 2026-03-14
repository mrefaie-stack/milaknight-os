"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Mail, Lock, ArrowRight } from "lucide-react";

export function LoginForm() {
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);

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
    );
}
