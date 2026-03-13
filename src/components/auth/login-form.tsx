"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
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
        window.location.assign(from || "/");
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
