'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Facebook, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function ClientConnectionsPage() {
    const searchParams = useSearchParams();
    const [connections, setConnections] = useState<{ facebook: boolean; snapchat: boolean; tiktok: boolean }>({
        facebook: false, snapchat: false, tiktok: false
    });
    const [metaPages, setMetaPages] = useState<any[]>([]);
    const [metaAccounts, setMetaAccounts] = useState<any[]>([]);
    const [snapAdAccounts, setSnapAdAccounts] = useState<any[]>([]);
    const [selectedPage, setSelectedPage] = useState('');
    const [selectedAccount, setSelectedAccount] = useState('');
    const [selectedSnapAccount, setSelectedSnapAccount] = useState('');
    const [saving, setSaving] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const success = searchParams?.get('success');

    useEffect(() => {
        loadStatus();
    }, []);

    useEffect(() => {
        if (success === 'facebook') {
            toast.success('Meta account connected! Select your page and ad account below.');
            loadMetaSetup();
        } else if (success === 'snapchat') {
            toast.success('Snapchat connected!');
            const needsSelect = searchParams?.get('select') === '1';
            if (needsSelect) loadSnapchatSetup();
        } else if (success === 'tiktok') {
            toast.success('TikTok connected!');
        } else if (searchParams?.get('error')) {
            toast.error('Connection failed. Please try again.');
        }
    }, [success]);

    const loadStatus = async () => {
        try {
            const res = await fetch('/api/client/connections/status');
            if (res.ok) {
                const data = await res.json();
                setConnections(data);
            }
        } catch (e) {
            console.error('Status load error:', e);
        } finally {
            setLoading(false);
        }
    };

    const loadMetaSetup = async () => {
        const [pagesRes, accountsRes] = await Promise.all([
            fetch('/api/client/meta/pages'),
            fetch('/api/client/meta/ad-accounts')
        ]);
        const pages = await pagesRes.json();
        const accounts = await accountsRes.json();
        if (pages.pages?.length > 0) setMetaPages(pages.pages);
        if (accounts.accounts?.length > 0) setMetaAccounts(accounts.accounts);
    };

    const loadSnapchatSetup = async () => {
        const res = await fetch('/api/client/snapchat/ad-accounts');
        if (res.ok) {
            const data = await res.json();
            if (data.accounts?.length > 0) setSnapAdAccounts(data.accounts);
        }
    };

    const handleConnectMeta = () => {
        signIn('facebook', { callbackUrl: '/client/connections?success=facebook' });
    };

    const handleConnectSnapchat = () => {
        window.location.href = '/api/auth/snapchat';
    };

    const handleConnectTikTok = () => {
        window.location.href = '/api/auth/tiktok';
    };

    const handleSaveMeta = async () => {
        if (!selectedAccount) { toast.error('Please select an Ad Account'); return; }
        setSaving('meta');
        try {
            const page = metaPages.find(p => p.id === selectedPage);
            const account = metaAccounts.find(a => a.id === selectedAccount);
            const res = await fetch('/api/client/link-social', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    platform: 'FACEBOOK',
                    platformAccountId: account?.id,
                    platformAccountName: account?.name,
                    pageId: page?.id,
                    pageName: page?.name
                })
            });
            if (!res.ok) throw new Error('Failed');
            toast.success('Meta account linked successfully!');
            setConnections(p => ({ ...p, facebook: true }));
            setMetaPages([]);
            setMetaAccounts([]);
        } catch {
            toast.error('Failed to save Meta connection');
        } finally {
            setSaving(null);
        }
    };

    const handleSaveSnap = async () => {
        if (!selectedSnapAccount) { toast.error('Please select an Ad Account'); return; }
        setSaving('snap');
        try {
            const account = snapAdAccounts.find(a => a.id === selectedSnapAccount);
            const res = await fetch('/api/client/link-social', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    platform: 'SNAPCHAT',
                    platformAccountId: account?.id,
                    platformAccountName: account?.name
                })
            });
            if (!res.ok) throw new Error('Failed');
            toast.success('Snapchat account linked!');
            setConnections(p => ({ ...p, snapchat: true }));
            setSnapAdAccounts([]);
        } catch {
            toast.error('Failed to save Snapchat connection');
        } finally {
            setSaving(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <header className="mb-10">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Connect Your Accounts</h1>
                <p className="text-muted-foreground">
                    Link your social media accounts so we can track your performance in real time.
                </p>
            </header>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Meta */}
                <Card className={connections.facebook ? 'border-green-500/30 bg-green-500/5' : 'border-primary/20 bg-primary/5'}>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="p-2 bg-[#1877F2]/10 rounded-lg">
                                <Facebook className="w-8 h-8 text-[#1877F2]" />
                            </div>
                            {connections.facebook ? (
                                <span className="flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-500 text-xs rounded-full border border-green-500/20">
                                    <CheckCircle className="w-3 h-3" /> Connected
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 px-2 py-1 bg-yellow-500/10 text-yellow-500 text-xs rounded-full border border-yellow-500/20">
                                    <AlertCircle className="w-3 h-3" /> Not Connected
                                </span>
                            )}
                        </div>
                        <CardTitle className="mt-4">Meta (Facebook & Instagram)</CardTitle>
                        <CardDescription>Connect your Facebook Page and Ad Account.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button
                            onClick={handleConnectMeta}
                            className="w-full bg-[#1877F2] hover:bg-[#1877F2]/90 text-white font-semibold py-5 rounded-xl"
                        >
                            <Facebook className="w-4 h-4 mr-2" />
                            {connections.facebook ? 'Reconnect Meta' : 'Connect Meta Account'}
                        </Button>

                        {/* Page + Ad Account selection (shown after connecting) */}
                        {(metaPages.length > 0 || metaAccounts.length > 0) && (
                            <div className="space-y-3 pt-2 border-t border-border">
                                <p className="text-xs text-muted-foreground font-medium">Select your accounts:</p>
                                {metaPages.length > 0 && (
                                    <div className="space-y-1">
                                        <span className="text-[10px] text-muted-foreground">Facebook / Instagram Page</span>
                                        <Select value={selectedPage} onValueChange={setSelectedPage}>
                                            <SelectTrigger className="bg-muted/30 border-border rounded-xl text-xs h-9">
                                                <SelectValue placeholder="Select your page" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {metaPages.map(p => (
                                                    <SelectItem key={p.id} value={p.id} className="text-xs">{p.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                {metaAccounts.length > 0 && (
                                    <div className="space-y-1">
                                        <span className="text-[10px] text-muted-foreground">Ad Account</span>
                                        <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                                            <SelectTrigger className="bg-muted/30 border-border rounded-xl text-xs h-9">
                                                <SelectValue placeholder="Select your ad account" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {metaAccounts.map(a => (
                                                    <SelectItem key={a.id} value={a.id} className="text-xs">{a.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                <Button
                                    size="sm"
                                    onClick={handleSaveMeta}
                                    disabled={saving === 'meta'}
                                    className="w-full h-9 rounded-xl font-bold text-xs"
                                >
                                    {saving === 'meta' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Selection'}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Snapchat */}
                <Card className={connections.snapchat ? 'border-green-500/30 bg-green-500/5' : 'border-yellow-500/20 bg-yellow-500/5'}>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="p-2 bg-yellow-400/10 rounded-lg">
                                <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">👻</span>
                                </div>
                            </div>
                            {connections.snapchat ? (
                                <span className="flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-500 text-xs rounded-full border border-green-500/20">
                                    <CheckCircle className="w-3 h-3" /> Connected
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 px-2 py-1 bg-yellow-500/10 text-yellow-500 text-xs rounded-full border border-yellow-500/20">
                                    <AlertCircle className="w-3 h-3" /> Not Connected
                                </span>
                            )}
                        </div>
                        <CardTitle className="mt-4">Snapchat Ads</CardTitle>
                        <CardDescription>Connect your Snapchat Business Ad Account.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button
                            onClick={handleConnectSnapchat}
                            className="w-full bg-yellow-400 hover:bg-yellow-400/90 text-black font-semibold py-5 rounded-xl"
                        >
                            {connections.snapchat ? 'Reconnect Snapchat' : 'Connect Snapchat'}
                        </Button>

                        {snapAdAccounts.length > 1 && (
                            <div className="space-y-3 pt-2 border-t border-border">
                                <p className="text-xs text-muted-foreground font-medium">Select your ad account:</p>
                                <Select value={selectedSnapAccount} onValueChange={setSelectedSnapAccount}>
                                    <SelectTrigger className="bg-muted/30 border-border rounded-xl text-xs h-9">
                                        <SelectValue placeholder="Select ad account" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {snapAdAccounts.map(a => (
                                            <SelectItem key={a.id} value={a.id} className="text-xs">{a.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    size="sm"
                                    onClick={handleSaveSnap}
                                    disabled={saving === 'snap'}
                                    className="w-full h-9 rounded-xl bg-yellow-400 text-black font-bold text-xs"
                                >
                                    {saving === 'snap' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Selection'}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* TikTok */}
                <Card className={connections.tiktok ? 'border-green-500/30 bg-green-500/5' : 'border-border'}>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="p-2 bg-black/10 rounded-lg">
                                <div className="w-8 h-8 bg-black rounded-sm flex items-center justify-center">
                                    <span className="text-white font-bold text-xs">TT</span>
                                </div>
                            </div>
                            {connections.tiktok ? (
                                <span className="flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-500 text-xs rounded-full border border-green-500/20">
                                    <CheckCircle className="w-3 h-3" /> Connected
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 px-2 py-1 bg-yellow-500/10 text-yellow-500 text-xs rounded-full border border-yellow-500/20">
                                    <AlertCircle className="w-3 h-3" /> Not Connected
                                </span>
                            )}
                        </div>
                        <CardTitle className="mt-4">TikTok Ads</CardTitle>
                        <CardDescription>Connect your TikTok For Business Ad Account.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={handleConnectTikTok}
                            className="w-full bg-black hover:bg-black/80 text-white font-semibold py-5 rounded-xl"
                        >
                            {connections.tiktok ? 'Reconnect TikTok' : 'Connect TikTok'}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <section className="mt-12 bg-card border rounded-2xl p-6">
                <h3 className="text-sm font-semibold mb-3">Security & Privacy</h3>
                <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> We use official OAuth 2.0. We never see or store your passwords.</div>
                    <div className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> Tokens are encrypted and used only to display your own data.</div>
                    <div className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> You can disconnect at any time by reconnecting with a different account.</div>
                </div>
            </section>
        </div>
    );
}
