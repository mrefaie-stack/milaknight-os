'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Lock, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'checking' | 'valid' | 'invalid' | 'success'>('checking');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [userEmail, setUserEmail] = useState('');

    useEffect(() => {
        if (!token) { setStatus('invalid'); return; }
        fetch(`/api/auth/reset-password?token=${token}`)
            .then(r => r.json())
            .then(data => {
                if (data.valid) { setStatus('valid'); setUserEmail(data.email || ''); }
                else setStatus('invalid');
            })
            .catch(() => setStatus('invalid'));
    }, [token]);

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (password !== confirm) { toast.error('Passwords do not match'); return; }
        if (password.length < 8) { toast.error('Password must be at least 8 characters'); return; }

        setIsLoading(true);
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password })
            });
            const data = await res.json();
            if (data.success) {
                setStatus('success');
                setTimeout(() => router.push('/login'), 3000);
            } else {
                toast.error(data.error || 'Something went wrong');
                if (data.error?.includes('expired')) setStatus('invalid');
            }
        } catch {
            toast.error('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
            {status === 'checking' && (
                <div className="flex flex-col items-center gap-3 py-6">
                    <Loader2 className="h-7 w-7 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Verifying your reset link...</p>
                </div>
            )}

            {status === 'invalid' && (
                <div className="flex flex-col items-center gap-4 py-4 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
                        <XCircle className="h-7 w-7 text-red-500" />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-[15px] font-semibold tracking-tight">Link expired or invalid</h2>
                        <p className="text-sm text-muted-foreground">This reset link is no longer valid. Please request a new one.</p>
                    </div>
                    <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
                        Request new reset link
                    </Link>
                </div>
            )}

            {status === 'success' && (
                <div className="flex flex-col items-center gap-4 py-4 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10">
                        <CheckCircle className="h-7 w-7 text-green-500" />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-[15px] font-semibold tracking-tight">Password updated!</h2>
                        <p className="text-sm text-muted-foreground">Your password has been reset. Redirecting to sign in...</p>
                    </div>
                    <Link href="/login" className="text-xs font-medium text-primary hover:underline">Go to sign in</Link>
                </div>
            )}

            {status === 'valid' && (
                <>
                    <div className="space-y-1">
                        <h2 className="text-[15px] font-semibold tracking-tight">Set new password</h2>
                        <p className="text-sm text-muted-foreground">
                            {userEmail ? <>For <span className="font-medium text-foreground">{userEmail}</span></> : 'Choose a strong password.'}
                        </p>
                    </div>

                    <form onSubmit={onSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="password" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                New Password
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Min. 8 characters"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    disabled={isLoading}
                                    required
                                    minLength={8}
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

                        <div className="space-y-1.5">
                            <Label htmlFor="confirm" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Confirm Password
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
                                <Input
                                    id="confirm"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Repeat your password"
                                    value={confirm}
                                    onChange={e => setConfirm(e.target.value)}
                                    disabled={isLoading}
                                    required
                                    className="pl-10"
                                />
                            </div>
                            {confirm && password !== confirm && (
                                <p className="text-[11px] text-red-500">Passwords do not match</p>
                            )}
                        </div>

                        <Button disabled={isLoading || (!!confirm && password !== confirm)} className="w-full">
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            {isLoading ? 'Updating...' : 'Update Password'}
                        </Button>
                    </form>
                </>
            )}
        </div>
    );
}

export default function ResetPasswordPage() {
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

                <Suspense fallback={
                    <div className="rounded-xl border border-border bg-card p-6 flex justify-center py-10">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                }>
                    <ResetPasswordForm />
                </Suspense>

                <p className="text-center text-[11px] text-muted-foreground">
                    © 2026 MilaKnight · All rights reserved
                </p>
            </div>
        </div>
    );
}
