'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [email, setEmail] = useState('');

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (data.success) {
                setSent(true);
            } else {
                toast.error(data.error || 'Something went wrong. Please try again.');
            }
        } catch {
            toast.error('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="w-full max-w-[400px] space-y-6">
                <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-primary/10">
                        <span className="text-base font-bold tracking-tight text-primary">MK</span>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">MilaKnight OS</h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">Agency Operating System</p>
                    </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
                    {sent ? (
                        <div className="flex flex-col items-center gap-4 py-4 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10">
                                <CheckCircle className="h-7 w-7 text-green-500" />
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-[15px] font-semibold tracking-tight">Check your email</h2>
                                <p className="text-sm text-muted-foreground">
                                    If <span className="font-medium text-foreground">{email}</span> is registered, you&apos;ll receive a reset link shortly. Check your spam folder too.
                                </p>
                            </div>
                            <Link href="/login" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                                <ArrowLeft className="h-3 w-3" /> Back to sign in
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-1">
                                <h2 className="text-[15px] font-semibold tracking-tight">Forgot your password?</h2>
                                <p className="text-sm text-muted-foreground">Enter your email and we&apos;ll send you a reset link.</p>
                            </div>

                            <form onSubmit={onSubmit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="email" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        Email Address
                                    </Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="name@milaknight.com"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            disabled={isLoading}
                                            required
                                            className="pl-10"
                                        />
                                    </div>
                                </div>

                                <Button disabled={isLoading} className="w-full">
                                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                                </Button>
                            </form>

                            <div className="text-center">
                                <Link href="/login" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5">
                                    <ArrowLeft className="h-3 w-3" /> Back to sign in
                                </Link>
                            </div>
                        </>
                    )}
                </div>

                <p className="text-center text-[11px] text-muted-foreground">
                    © 2026 MilaKnight · All rights reserved ·{' '}
                    <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground transition-colors">Privacy Policy</Link>
                </p>
            </div>
        </div>
    );
}
