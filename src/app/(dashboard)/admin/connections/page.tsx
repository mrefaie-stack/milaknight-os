'use client';

import React from 'react';
import { signIn, useSession } from 'next-auth/react';
import { Facebook, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MetaMapping } from '@/components/admin/meta-mapping';
import { SnapchatMapping } from '@/components/admin/snapchat-mapping';

export default function ConnectionsPage() {
    const { data: session } = useSession();

    const handleConnectFacebook = () => {
        signIn('facebook', { callbackUrl: '/admin/connections' });
    };

    const handleConnectSnapchat = () => {
        window.location.href = '/api/auth/snapchat';
    };

    const handleConnectTikTok = () => {
        window.location.href = '/api/auth/tiktok';
    };

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <header className="mb-10">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Platform Connections</h1>
                <p className="text-muted-foreground">
                    Connect your social media accounts to enable real-time tracking in the Live Dashboard.
                </p>
            </header>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Meta / Facebook Connection */}
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="p-2 bg-[#1877F2]/10 rounded-lg">
                                <Facebook className="w-8 h-8 text-[#1877F2]" />
                            </div>
                            <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/10 text-yellow-500 text-xs rounded-full border border-yellow-500/20">
                                <AlertCircle className="w-3 h-3" />
                                Pending Setup
                            </div>
                        </div>
                        <CardTitle className="mt-4">Meta (Facebook & Instagram)</CardTitle>
                        <CardDescription>
                            Access real-time ad performance and organic insights from your Meta Business accounts.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button 
                            onClick={handleConnectFacebook}
                            className="w-full bg-[#1877F2] hover:bg-[#1877F2]/90 text-white font-semibold py-6 rounded-xl transition-all hover:scale-[1.02]"
                        >
                            <Facebook className="w-5 h-5 mr-2" />
                            Connect Meta Account
                        </Button>
                        <p className="text-[10px] text-muted-foreground mt-4 text-center">
                            By connecting, you agree to allow MilaKnight OS to access your ad accounts and page insights.
                        </p>
                    </CardContent>
                </Card>

                {/* Snapchat Connection */}
                <Card className="border-yellow-500/20 bg-yellow-500/5">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="p-2 bg-yellow-500/10 rounded-lg">
                                <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">👻</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/10 text-yellow-500 text-xs rounded-full border border-yellow-500/20">
                                <AlertCircle className="w-3 h-3" />
                                Pending Setup
                            </div>
                        </div>
                        <CardTitle className="mt-4">Snapchat Ads</CardTitle>
                        <CardDescription>
                            Connect your Snapchat Business account to track ad performance and insights.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={handleConnectSnapchat}
                            className="w-full bg-yellow-400 hover:bg-yellow-400/90 text-black font-semibold py-6 rounded-xl transition-all hover:scale-[1.02]"
                        >
                            Connect Snapchat Account
                        </Button>
                        <p className="text-[10px] text-muted-foreground mt-4 text-center">
                            By connecting, you allow MilaKnight OS to access your Snapchat Ads data.
                        </p>
                    </CardContent>
                </Card>

                {/* TikTok Connection */}
                <Card className="border-border">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="p-2 bg-black/10 rounded-lg">
                                <div className="w-8 h-8 bg-black rounded-sm flex items-center justify-center">
                                    <span className="text-white font-bold text-xs">TT</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/10 text-yellow-500 text-xs rounded-full border border-yellow-500/20">
                                <AlertCircle className="w-3 h-3" />
                                Pending Setup
                            </div>
                        </div>
                        <CardTitle className="mt-4">TikTok Ads</CardTitle>
                        <CardDescription>
                            Connect your TikTok For Business account to track ad spend and conversions.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={handleConnectTikTok}
                            className="w-full bg-black hover:bg-black/80 text-white font-semibold py-6 rounded-xl transition-all hover:scale-[1.02]"
                        >
                            Connect TikTok Account
                        </Button>
                        <p className="text-[10px] text-muted-foreground mt-4 text-center">
                            By connecting, you allow MilaKnight OS to access your TikTok Ads data.
                        </p>
                    </CardContent>
                </Card>
            </div>

            <MetaMapping />
            <SnapchatMapping />

            <section className="mt-16 bg-card border rounded-2xl p-8">
                <h3 className="text-lg font-semibold mb-4">Security & Privacy</h3>
                <div className="grid gap-4 text-sm text-muted-foreground">
                    <div className="flex gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                        <p>We use official OAuth 2.0 protocols. We never see or store your Facebook password.</p>
                    </div>
                    <div className="flex gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                        <p>Access tokens are encrypted and used only to fetch data for your personal dashboard.</p>
                    </div>
                    <div className="flex gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                        <p>You can revoke access at any time through this panel or your Facebook settings.</p>
                    </div>
                </div>
            </section>
        </div>
    );
}
