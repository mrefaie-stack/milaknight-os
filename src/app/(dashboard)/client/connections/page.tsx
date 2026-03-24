'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Facebook, CheckCircle, AlertCircle, Loader2, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function ClientConnectionsPage() {
    const searchParams = useSearchParams();
    const [connections, setConnections] = useState<{ facebook: boolean; snapchat: boolean; tiktok: boolean; linkedin: boolean; x: boolean; salla: boolean; google: boolean }>({
        facebook: false, snapchat: false, tiktok: false, linkedin: false, x: false, salla: false, google: false
    });
    const [metaPages, setMetaPages] = useState<any[]>([]);
    const [metaAccounts, setMetaAccounts] = useState<any[]>([]);
    const [snapAdAccounts, setSnapAdAccounts] = useState<any[]>([]);
    const [linkedinPages, setLinkedinPages] = useState<any[]>([]);
    const [selectedPage, setSelectedPage] = useState('');
    const [selectedAccount, setSelectedAccount] = useState('');
    const [selectedSnapAccount, setSelectedSnapAccount] = useState('');
    const [selectedLinkedinPage, setSelectedLinkedinPage] = useState('');
    const [linkedinNeedsApproval, setLinkedinNeedsApproval] = useState(false);
    const [googleAdsAccounts, setGoogleAdsAccounts] = useState<{ id: string; name: string; currencyCode: string }[]>([]);
    const [selectedGoogleAdsAccount, setSelectedGoogleAdsAccount] = useState('');
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
        } else if (success === 'x') {
            toast.success('X (Twitter) account connected!');
        } else if (success === 'salla') {
            toast.success('Salla store connected!');
        } else if (success === 'google') {
            toast.success('Google connected! Loading your Google Ads accounts...');
            loadGoogleAdsAccounts();
        } else if (success === 'linkedin') {
            const select = searchParams?.get('select') === '1';
            const noPages = searchParams?.get('no_pages') === '1';
            if (select) {
                toast.success('LinkedIn connected! Select your company page below.');
                loadLinkedinPages();
            } else if (noPages) {
                toast.warning('LinkedIn connected but no company pages found. You may need to enable Community Management API in your LinkedIn app.');
                setLinkedinNeedsApproval(true);
            } else {
                toast.success('LinkedIn connected!');
            }
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

    const handleConnectLinkedIn = () => {
        window.location.href = '/api/auth/linkedin';
    };

    const handleConnectX = () => {
        window.location.href = '/api/auth/x';
    };

    const handleConnectSalla = () => {
        window.location.href = '/api/auth/salla';
    };

    const loadGoogleAdsAccounts = async () => {
        const res = await fetch('/api/client/google/ad-accounts');
        if (res.ok) {
            const data = await res.json();
            if (data.accounts?.length >= 1) {
                setGoogleAdsAccounts(data.accounts);
                if (data.selected) setSelectedGoogleAdsAccount(data.selected);
            }
        }
    };

    const handleSaveGoogleAds = async () => {
        if (!selectedGoogleAdsAccount) { toast.error('Please select a Google Ads account'); return; }
        setSaving('google-ads');
        try {
            const account = googleAdsAccounts.find(a => a.id === selectedGoogleAdsAccount);
            const res = await fetch('/api/client/google/select-account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customerId: account?.id, customerName: account?.name })
            });
            if (!res.ok) throw new Error('Failed');
            toast.success('Google Ads account selected!');
            setGoogleAdsAccounts([]);
        } catch {
            toast.error('Failed to save Google Ads account');
        } finally {
            setSaving(null);
        }
    };

    const handleConnectGoogle = () => {
        window.location.href = '/api/auth/google';
    };

    const loadLinkedinPages = async () => {
        const res = await fetch('/api/client/linkedin/pages');
        if (res.ok) {
            const data = await res.json();
            if (data.pages?.length > 0) setLinkedinPages(data.pages);
            else setLinkedinNeedsApproval(true);
        }
    };

    const handleSaveLinkedin = async () => {
        if (!selectedLinkedinPage) { toast.error('Please select a company page'); return; }
        setSaving('linkedin');
        try {
            const page = linkedinPages.find(p => p.id === selectedLinkedinPage);
            const res = await fetch('/api/client/linkedin/select-page', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orgId: page?.id, orgName: page?.name })
            });
            if (!res.ok) throw new Error('Failed');
            toast.success('LinkedIn company page linked!');
            setConnections(p => ({ ...p, linkedin: true }));
            setLinkedinPages([]);
        } catch {
            toast.error('Failed to save LinkedIn page');
        } finally {
            setSaving(null);
        }
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

                {/* LinkedIn */}
                <Card className={connections.linkedin ? 'border-green-500/30 bg-green-500/5' : 'border-[#0077B5]/20 bg-[#0077B5]/5'}>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="p-2 bg-[#0077B5]/10 rounded-lg">
                                <Linkedin className="w-8 h-8 text-[#0077B5]" />
                            </div>
                            {connections.linkedin ? (
                                <span className="flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-500 text-xs rounded-full border border-green-500/20">
                                    <CheckCircle className="w-3 h-3" /> Connected
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 px-2 py-1 bg-yellow-500/10 text-yellow-500 text-xs rounded-full border border-yellow-500/20">
                                    <AlertCircle className="w-3 h-3" /> Not Connected
                                </span>
                            )}
                        </div>
                        <CardTitle className="mt-4">LinkedIn</CardTitle>
                        <CardDescription>Connect your LinkedIn Company Page to track followers, visits, and post performance.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button
                            onClick={handleConnectLinkedIn}
                            className="w-full bg-[#0077B5] hover:bg-[#0077B5]/90 text-white font-semibold py-5 rounded-xl"
                        >
                            <Linkedin className="w-4 h-4 mr-2" />
                            {connections.linkedin ? 'Reconnect LinkedIn' : 'Connect LinkedIn'}
                        </Button>

                        {linkedinPages.length > 0 && (
                            <div className="space-y-3 pt-2 border-t border-border">
                                <p className="text-xs text-muted-foreground font-medium">Select your company page:</p>
                                <Select value={selectedLinkedinPage} onValueChange={setSelectedLinkedinPage}>
                                    <SelectTrigger className="bg-muted/30 border-border rounded-xl text-xs h-9">
                                        <SelectValue placeholder="Select company page" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {linkedinPages.map(p => (
                                            <SelectItem key={p.id} value={p.id} className="text-xs">{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    size="sm"
                                    onClick={handleSaveLinkedin}
                                    disabled={saving === 'linkedin'}
                                    className="w-full h-9 rounded-xl bg-[#0077B5] text-white font-bold text-xs"
                                >
                                    {saving === 'linkedin' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Page'}
                                </Button>
                            </div>
                        )}

                        {linkedinNeedsApproval && (
                            <div className="pt-2 border-t border-border text-xs text-muted-foreground space-y-1">
                                <p className="font-medium text-yellow-500">Company pages not found</p>
                                <p>Go to your LinkedIn Developer App → Products → Request access to <strong>Community Management API</strong>, then reconnect.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* X (Twitter) */}
                <Card className={connections.x ? 'border-green-500/30 bg-green-500/5' : 'border-border'}>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="p-2 bg-black/10 rounded-lg">
                                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" aria-hidden="true">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                    </svg>
                                </div>
                            </div>
                            {connections.x ? (
                                <span className="flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-500 text-xs rounded-full border border-green-500/20">
                                    <CheckCircle className="w-3 h-3" /> Connected
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 px-2 py-1 bg-yellow-500/10 text-yellow-500 text-xs rounded-full border border-yellow-500/20">
                                    <AlertCircle className="w-3 h-3" /> Not Connected
                                </span>
                            )}
                        </div>
                        <CardTitle className="mt-4">X (Twitter)</CardTitle>
                        <CardDescription>Connect your X account to track followers, tweets, and engagement.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={handleConnectX}
                            className="w-full bg-black hover:bg-black/80 text-white font-semibold py-5 rounded-xl"
                        >
                            <svg viewBox="0 0 24 24" className="w-4 h-4 mr-2 fill-white" aria-hidden="true">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                            {connections.x ? 'Reconnect X Account' : 'Connect X Account'}
                        </Button>
                    </CardContent>
                </Card>

                {/* Google (YouTube + Google Ads) */}
                <Card className={connections.google ? 'border-green-500/30 bg-green-500/5' : 'border-[#EA4335]/20 bg-[#EA4335]/5'}>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="p-2 bg-white/10 rounded-lg">
                                <svg className="w-8 h-8" viewBox="0 0 48 48" aria-hidden="true">
                                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                                </svg>
                            </div>
                            {connections.google ? (
                                <span className="flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-500 text-xs rounded-full border border-green-500/20">
                                    <CheckCircle className="w-3 h-3" /> Connected
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 px-2 py-1 bg-yellow-500/10 text-yellow-500 text-xs rounded-full border border-yellow-500/20">
                                    <AlertCircle className="w-3 h-3" /> Not Connected
                                </span>
                            )}
                        </div>
                        <CardTitle className="mt-4">Google (YouTube + Ads)</CardTitle>
                        <CardDescription>Connect your Google account to track YouTube channel stats and Google Ads campaigns.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button
                            onClick={handleConnectGoogle}
                            className="w-full bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 font-semibold py-5 rounded-xl"
                        >
                            <svg className="w-4 h-4 mr-2" viewBox="0 0 48 48" aria-hidden="true">
                                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                            </svg>
                            {connections.google ? 'Reconnect Google' : 'Connect with Google'}
                        </Button>

                        {connections.google && googleAdsAccounts.length === 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={loadGoogleAdsAccounts}
                                className="w-full h-9 rounded-xl text-xs border-border"
                            >
                                Change Google Ads Account
                            </Button>
                        )}

                        {googleAdsAccounts.length >= 1 && (
                            <div className="space-y-3 pt-2 border-t border-border">
                                <p className="text-xs text-muted-foreground font-medium">Select your Google Ads account:</p>
                                <Select value={selectedGoogleAdsAccount} onValueChange={setSelectedGoogleAdsAccount}>
                                    <SelectTrigger className="bg-muted/30 border-border rounded-xl text-xs h-9">
                                        <SelectValue placeholder="Select Google Ads account" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {googleAdsAccounts.map(a => (
                                            <SelectItem key={a.id} value={a.id} className="text-xs">
                                                {a.name} ({a.currencyCode})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    size="sm"
                                    onClick={handleSaveGoogleAds}
                                    disabled={saving === 'google-ads'}
                                    className="w-full h-9 rounded-xl font-bold text-xs"
                                >
                                    {saving === 'google-ads' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Selection'}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Salla */}
                <Card className={connections.salla ? 'border-green-500/30 bg-green-500/5' : 'border-[#7C3AED]/20 bg-[#7C3AED]/5'}>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="p-2 bg-[#7C3AED]/10 rounded-lg">
                                <div className="w-8 h-8 bg-[#7C3AED] rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">S</span>
                                </div>
                            </div>
                            {connections.salla ? (
                                <span className="flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-500 text-xs rounded-full border border-green-500/20">
                                    <CheckCircle className="w-3 h-3" /> Connected
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 px-2 py-1 bg-yellow-500/10 text-yellow-500 text-xs rounded-full border border-yellow-500/20">
                                    <AlertCircle className="w-3 h-3" /> Not Connected
                                </span>
                            )}
                        </div>
                        <CardTitle className="mt-4">سلة (Salla)</CardTitle>
                        <CardDescription>Connect your Salla store to track orders, revenue, products, and customers.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={handleConnectSalla}
                            className="w-full bg-[#7C3AED] hover:bg-[#7C3AED]/90 text-white font-semibold py-5 rounded-xl"
                        >
                            {connections.salla ? 'Reconnect Salla Store' : 'Connect Salla Store'}
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
