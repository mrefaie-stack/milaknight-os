'use client';

import { useState, useEffect, cloneElement } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    BarChart, DollarSign, Eye, MousePointer2, PlaySquare, TrendingUp, Activity,
    Hash, Users, CalendarDays, RefreshCw, AlertCircle, MessageCircle, Heart,
    Share2, Info, Facebook, Instagram, Loader2, Ghost, Linkedin, Twitter,
    ShoppingCart, ShoppingBag, Package, Clock, Youtube, Megaphone, Smartphone,
    Monitor, Tablet, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/language-context';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────
type Period = 'all' | '7d' | '30d' | '90d' | 'custom';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function toIso(d: Date) { return d.toISOString(); }
function daysAgo(n: number) { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(0, 0, 0, 0); return d; }

function buildUrl(base: string, period: Period, since: string, until: string) {
    if (period === 'custom' && since && until) return `${base}?since=${since}&until=${until}`;
    if (period === 'all') return base;
    const days = ({ '7d': 7, '30d': 30, '90d': 90 } as Record<string, number>)[period] ?? 30;
    const u = new Date().toISOString().slice(0, 10);
    const s = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
    return `${base}?since=${s}&until=${u}`;
}

function buildSnapUrl(period: Period, since: string, until: string) {
    const base = '/api/dashboard/live/snapchat';
    if (period === 'custom' && since && until) {
        return `${base}?start=${new Date(since + 'T00:00:00').toISOString()}&end=${new Date(until + 'T23:59:59').toISOString()}`;
    }
    if (period === 'all') return base;
    const days = ({ '7d': 7, '30d': 30, '90d': 90 } as Record<string, number>)[period] ?? 30;
    const now = new Date(); now.setHours(23, 59, 59, 999);
    return `${base}?start=${daysAgo(days).toISOString()}&end=${now.toISOString()}`;
}

function fmt(n: number | string | undefined, decimals = 0) {
    const num = Number(n) || 0;
    return num.toLocaleString('en', { maximumFractionDigits: decimals });
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SectionHeader({ color, label }: { color: string; label: string }) {
    return (
        <div className="flex items-center gap-2">
            <div className={`h-3 w-0.5 rounded-full ${color}`} />
            <p className="section-label text-muted-foreground">{label}</p>
        </div>
    );
}

function StatCard({ label, value, color, icon, sub }: {
    label: string; value: string | number; color: string; icon: React.ReactNode; sub?: string;
}) {
    return (
        <Card className="hover:bg-muted/30 transition-colors">
            <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                    <div className={cn('p-1.5 rounded-md bg-muted', color)}>{icon}</div>
                    <TrendingUp className="w-3 h-3 text-muted-foreground/30" />
                </div>
                <p className="section-label text-muted-foreground line-clamp-1">{label}</p>
                <h5 className={cn('text-xl font-bold mt-1 leading-tight', color)}>{value}</h5>
                {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
            </CardContent>
        </Card>
    );
}

function PeriodBar({
    period, since, until, loading, color, onApply, supportsAll = false, isRtl
}: {
    period: Period; since: string; until: string; loading: boolean; color: string;
    onApply: (p: Period, s: string, u: string) => void; supportsAll?: boolean; isRtl: boolean;
}) {
    const [localSince, setLocalSince] = useState(since);
    const [localUntil, setLocalUntil] = useState(until);

    const presets: { value: Period; label: string }[] = [
        ...(supportsAll ? [{ value: 'all' as Period, label: isRtl ? 'كل الوقت' : 'All Time' }] : []),
        { value: '7d', label: isRtl ? '٧أ' : '7D' },
        { value: '30d', label: isRtl ? '٣٠ي' : '30D' },
        { value: '90d', label: isRtl ? '٩٠ي' : '90D' },
        { value: 'custom', label: isRtl ? 'مخصص' : 'Custom' }
    ];

    return (
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border">
            <CalendarDays className="w-4 h-4 text-muted-foreground shrink-0" />
            {presets.map(p => (
                <button
                    key={p.value}
                    disabled={loading}
                    onClick={() => {
                        if (p.value !== 'custom') onApply(p.value, '', '');
                        else onApply('custom', '', '');
                    }}
                    className={cn(
                        'px-3 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-50',
                        period === p.value ? 'text-white' : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                    )}
                    style={period === p.value ? { backgroundColor: color } : {}}
                >{p.label}</button>
            ))}
            {period === 'custom' && (
                <div className="flex items-center gap-2 flex-wrap">
                    <input type="date" value={localSince} onChange={e => setLocalSince(e.target.value)}
                        className="text-xs bg-background border border-border rounded px-2 py-1 text-foreground" />
                    <span className="text-xs text-muted-foreground">→</span>
                    <input type="date" value={localUntil} onChange={e => setLocalUntil(e.target.value)}
                        className="text-xs bg-background border border-border rounded px-2 py-1 text-foreground" />
                    <button onClick={() => onApply('custom', localSince, localUntil)}
                        disabled={!localSince || !localUntil || loading}
                        className="px-3 py-1 rounded-md text-xs font-medium bg-primary text-primary-foreground disabled:opacity-40"
                    >{isRtl ? 'تطبيق' : 'Apply'}</button>
                </div>
            )}
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function LiveMetrics() {
    const { isRtl } = useLanguage();

    // Platform data
    const [metaData, setMetaData] = useState<any>(null);
    const [snapData, setSnapData] = useState<any>(null);
    const [linkedinData, setLinkedinData] = useState<any>(null);
    const [xData, setXData] = useState<any>(null);
    const [sallaData, setSallaData] = useState<any>(null);
    const [youtubeData, setYoutubeData] = useState<any>(null);
    const [googleAdsData, setGoogleAdsData] = useState<any>(null);
    const [googleAdsError, setGoogleAdsError] = useState<string | null>(null);
    const [tiktokData, setTiktokData] = useState<any>(null);

    // UI state
    const [loading, setLoading] = useState(true);
    const [metaError, setMetaError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('facebook');

    // Loading states per platform
    const [metaLoading, setMetaLoading] = useState(false);
    const [snapLoading, setSnapLoading] = useState(false);
    const [gadsLoading, setGadsLoading] = useState(false);
    const [ytLoading, setYtLoading] = useState(false);
    const [sallaLoading, setSallaLoading] = useState(false);
    const [liLoading, setLiLoading] = useState(false);
    const [tiktokLoading, setTiktokLoading] = useState(false);

    // Period state per platform
    const [metaPeriod, setMetaPeriod] = useState<Period>('30d');
    const [metaSince, setMetaSince] = useState('');
    const [metaUntil, setMetaUntil] = useState('');

    const [snapPeriod, setSnapPeriod] = useState<Period>('all');
    const [snapSince, setSnapSince] = useState('');
    const [snapUntil, setSnapUntil] = useState('');

    const [gadsPeriod, setGadsPeriod] = useState<Period>('30d');
    const [gadsSince, setGadsSince] = useState('');
    const [gadsUntil, setGadsUntil] = useState('');

    const [ytPeriod, setYtPeriod] = useState<Period>('30d');
    const [ytSince, setYtSince] = useState('');
    const [ytUntil, setYtUntil] = useState('');

    const [sallaPeriod, setSallaPeriod] = useState<Period>('30d');
    const [sallaSince, setSallaSince] = useState('');
    const [sallaUntil, setSallaUntil] = useState('');

    const [liPeriod, setLiPeriod] = useState<Period>('30d');
    const [liSince, setLiSince] = useState('');
    const [liUntil, setLiUntil] = useState('');

    const [tiktokPeriod, setTiktokPeriod] = useState<Period>('30d');
    const [tiktokSince, setTiktokSince] = useState('');
    const [tiktokUntil, setTiktokUntil] = useState('');

    // ── Fetch functions ──────────────────────────────────────────────────────
    const fetchMeta = async (p: Period, s: string, u: string) => {
        setMetaLoading(true); setMetaPeriod(p); setMetaSince(s); setMetaUntil(u);
        try {
            const res = await fetch(buildUrl('/api/dashboard/live/meta', p, s, u));
            const json = await res.json();
            if (res.ok) { setMetaData(json); setMetaError(null); }
            else setMetaError(json.error || 'Meta error');
        } finally { setMetaLoading(false); }
    };

    const fetchSnap = async (p: Period, s: string, u: string) => {
        setSnapLoading(true); setSnapPeriod(p); setSnapSince(s); setSnapUntil(u);
        try {
            const res = await fetch(buildSnapUrl(p, s, u));
            if (res.ok) setSnapData(await res.json());
        } finally { setSnapLoading(false); }
    };

    const fetchGads = async (p: Period, s: string, u: string) => {
        setGadsLoading(true); setGadsPeriod(p); setGadsSince(s); setGadsUntil(u);
        setGoogleAdsError(null);
        try {
            const res = await fetch(buildUrl('/api/dashboard/live/google-ads', p, s, u));
            const json = await res.json();
            if (res.ok) setGoogleAdsData(json);
            else setGoogleAdsError(json.error || 'Google Ads error');
        } finally { setGadsLoading(false); }
    };

    const fetchYt = async (p: Period, s: string, u: string) => {
        setYtLoading(true); setYtPeriod(p); setYtSince(s); setYtUntil(u);
        try {
            const res = await fetch(buildUrl('/api/dashboard/live/youtube', p, s, u));
            if (res.ok) setYoutubeData(await res.json());
        } finally { setYtLoading(false); }
    };

    const fetchSalla = async (p: Period, s: string, u: string) => {
        setSallaLoading(true); setSallaPeriod(p); setSallaSince(s); setSallaUntil(u);
        try {
            const res = await fetch(buildUrl('/api/dashboard/live/salla', p, s, u));
            if (res.ok) setSallaData(await res.json());
        } finally { setSallaLoading(false); }
    };

    const fetchLi = async (p: Period, s: string, u: string) => {
        setLiLoading(true); setLiPeriod(p); setLiSince(s); setLiUntil(u);
        try {
            const res = await fetch(buildUrl('/api/dashboard/live/linkedin', p, s, u));
            if (res.ok) setLinkedinData(await res.json());
        } finally { setLiLoading(false); }
    };

    const fetchTiktok = async (p: Period, s: string, u: string) => {
        setTiktokLoading(true); setTiktokPeriod(p); setTiktokSince(s); setTiktokUntil(u);
        try {
            const res = await fetch(buildUrl('/api/dashboard/live/tiktok', p, s, u));
            if (res.ok) setTiktokData(await res.json());
        } finally { setTiktokLoading(false); }
    };

    // ── Initial load ─────────────────────────────────────────────────────────
    useEffect(() => {
        async function fetchAll() {
            setLoading(true);
            const [metaRes, snapRes, liRes, xRes, sallaRes, ytRes, gadsRes, tiktokRes] = await Promise.allSettled([
                fetch(buildUrl('/api/dashboard/live/meta', '30d', '', '')),
                fetch('/api/dashboard/live/snapchat'),
                fetch('/api/dashboard/live/linkedin'),
                fetch('/api/dashboard/live/x'),
                fetch(buildUrl('/api/dashboard/live/salla', '30d', '', '')),
                fetch(buildUrl('/api/dashboard/live/youtube', '30d', '', '')),
                fetch(buildUrl('/api/dashboard/live/google-ads', '30d', '', '')),
                fetch(buildUrl('/api/dashboard/live/tiktok', '30d', '', ''))
            ]);
            if (metaRes.status === 'fulfilled') {
                const j = await metaRes.value.json();
                if (metaRes.value.ok) setMetaData(j); else setMetaError(j.error);
            }
            if (snapRes.status === 'fulfilled' && snapRes.value.ok) setSnapData(await snapRes.value.json());
            if (liRes.status === 'fulfilled' && liRes.value.ok) setLinkedinData(await liRes.value.json());
            if (xRes.status === 'fulfilled' && xRes.value.ok) setXData(await xRes.value.json());
            if (sallaRes.status === 'fulfilled' && sallaRes.value.ok) setSallaData(await sallaRes.value.json());
            if (ytRes.status === 'fulfilled' && ytRes.value.ok) setYoutubeData(await ytRes.value.json());
            if (gadsRes.status === 'fulfilled') {
                const j = await gadsRes.value.json().catch(() => ({}));
                if (gadsRes.value.ok) setGoogleAdsData(j);
                else setGoogleAdsError(j.error || 'Google Ads error');
            }
            if (tiktokRes.status === 'fulfilled' && tiktokRes.value.ok) setTiktokData(await tiktokRes.value.json());
            setLoading(false);
        }
        fetchAll();
    }, []);

    // ── Tab definitions ───────────────────────────────────────────────────────
    const tabs = [
        { id: 'facebook', name: 'Facebook', icon: <Facebook className="w-5 h-5" />, color: '#1877F2', isLive: !metaError && !!metaData },
        { id: 'instagram', name: 'Instagram', icon: <Instagram className="w-5 h-5" />, color: '#E4405F', isLive: !metaError && !!metaData?.organicMetrics?.ig?.connected },
        { id: 'snapchat', name: 'Snapchat', icon: <Ghost className="w-5 h-5" />, color: '#FFFC00', textColor: 'text-black', isLive: !!snapData },
        { id: 'google-ads', name: 'Google Ads', icon: <Megaphone className="w-5 h-5" />, color: '#4285F4', isLive: !!googleAdsData },
        { id: 'youtube', name: 'YouTube', icon: <Youtube className="w-5 h-5" />, color: '#FF0000', isLive: !!youtubeData },
        { id: 'salla', name: 'Salla', icon: <ShoppingBag className="w-5 h-5" />, color: '#7C3AED', isLive: !!sallaData },
        { id: 'linkedin', name: 'LinkedIn', icon: <Linkedin className="w-5 h-5" />, color: '#0077B5', isLive: !!linkedinData },
        { id: 'x', name: 'X', icon: <Twitter className="w-5 h-5" />, color: '#000000', isLive: !!xData },
        { id: 'tiktok', name: 'TikTok', icon: <PlaySquare className="w-5 h-5" />, color: '#010101', isLive: !!tiktokData }
    ];
    const currentTab = tabs.find(t => t.id === activeTab) || tabs[0];

    // ── Errors per platform ───────────────────────────────────────────────────
    const platformError: Record<string, string | null> = {
        facebook: metaError || (!metaData ? (isRtl ? 'حساب فيسبوك غير مربوط' : 'Facebook not connected') : null),
        instagram: metaError || (!metaData?.organicMetrics?.ig?.connected ? (isRtl ? 'حساب إنستجرام غير مربوط بهذه الصفحة' : 'Instagram not linked to this page') : null),
        snapchat: !snapData ? (isRtl ? 'حساب سناب شات غير مربوط' : 'Snapchat not connected') : null,
        'google-ads': googleAdsError || (!googleAdsData ? (isRtl ? 'جوجل أدز غير مربوط' : 'Google Ads not connected') : null),
        youtube: !youtubeData ? (isRtl ? 'يوتيوب غير مربوط' : 'YouTube not connected') : null,
        salla: !sallaData ? (isRtl ? 'متجر سلة غير مربوط' : 'Salla store not connected') : null,
        linkedin: !linkedinData ? (isRtl ? 'لينكد إن غير مربوط' : 'LinkedIn not connected') : null,
        x: !xData ? (isRtl ? 'حساب X غير مربوط' : 'X not connected') : null,
        tiktok: !tiktokData ? (isRtl ? 'تيك توك غير مربوط' : 'TikTok not connected') : null
    };

    // ─────────────────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <div className="text-center">
                    <p className="text-sm font-medium text-primary">{isRtl ? 'جاري مزامنة البيانات الحية...' : 'Syncing Live Data...'}</p>
                    <p className="text-xs text-muted-foreground mt-1">{isRtl ? 'يرجى الانتظار قليلاً' : 'Please wait a moment'}</p>
                </div>
            </div>
        );
    }

    const cur = (d: any) => d?.currency || 'USD';
    const sc = (d: any) => d?.currency || 'SAR';

    return (
        <div className="space-y-6">
            {/* Tab Switcher */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-muted/40 rounded-lg border border-border w-fit">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={cn('flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 relative',
                            activeTab === tab.id ? 'text-white shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        )}>
                        {activeTab === tab.id && (
                            <motion.div layoutId="activeTab" className="absolute inset-0 z-0 rounded-md" style={{ backgroundColor: tab.color }} />
                        )}
                        <span className={cn('relative z-10 transition-colors', activeTab === tab.id && tab.id === 'snapchat' ? 'text-black' : '')}>
                            {tab.icon}
                        </span>
                        <span className={cn('relative z-10 text-xs font-medium', activeTab === tab.id && tab.id === 'snapchat' ? 'text-black' : '')}>
                            {tab.name}
                        </span>
                        {tab.isLive && (
                            <span className={cn('relative z-10 w-1.5 h-1.5 rounded-full bg-emerald-500', tab.id === 'snapchat' ? '' : '')} />
                        )}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }} className="space-y-5">

                    {/* Platform Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: currentTab.color }}>
                                <span className={currentTab.textColor || 'text-white'}>
                                    {cloneElement(currentTab.icon as any, { className: 'w-6 h-6' })}
                                </span>
                            </div>
                            <div>
                                <h3 className="text-base font-semibold">{currentTab.name}</h3>
                                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                    <Activity className="w-3 h-3" />
                                    {activeTab === 'facebook' ? (metaData?.accountName || 'Facebook Page')
                                        : activeTab === 'instagram' ? (metaData?.accountName || 'Instagram Business')
                                        : activeTab === 'snapchat' ? (snapData?.accountName || 'Snapchat Ads')
                                        : activeTab === 'google-ads' ? (googleAdsData?.accountName || 'Google Ads')
                                        : activeTab === 'youtube' ? (youtubeData?.accountName || 'YouTube Channel')
                                        : activeTab === 'salla' ? (sallaData?.storeName || sallaData?.domain || 'Salla Store')
                                        : activeTab === 'linkedin' ? (linkedinData?.accountName || 'LinkedIn Page')
                                        : activeTab === 'x' ? (xData ? `@${xData.username}` : 'X Account')
                                        : 'TikTok'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted border border-border">
                                <span className={cn('w-1.5 h-1.5 rounded-full', currentTab.isLive ? 'bg-emerald-500' : 'bg-muted-foreground/40')} />
                                <span className="section-label text-muted-foreground">{currentTab.isLive ? 'Live' : 'Offline'}</span>
                            </div>
                            {currentTab.isLive && <Badge variant="success" className="text-xs">Optimized</Badge>}
                        </div>
                    </div>

                    {/* Error state */}
                    {platformError[activeTab] ? (
                        <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 px-4 py-3 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                            <p className="text-xs text-destructive/80">{platformError[activeTab]}</p>
                        </div>
                    ) : (

                    /* ═══ PLATFORM CONTENT ════════════════════════════════════════════ */
                    <div className="space-y-5">

                        {/* ── FACEBOOK ──────────────────────────────────────────────────── */}
                        {activeTab === 'facebook' && metaData && (
                            <>
                                <PeriodBar period={metaPeriod} since={metaSince} until={metaUntil} loading={metaLoading} color="#1877F2"
                                    onApply={(p, s, u) => fetchMeta(p, s, u)} isRtl={isRtl} />

                                <div className="grid lg:grid-cols-12 gap-5">
                                    <div className="lg:col-span-8 space-y-5">
                                        <div className="space-y-3">
                                            <SectionHeader color="bg-blue-500" label={isRtl ? 'الأداء العضوي — فيسبوك' : 'Organic Performance — Facebook'} />
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                <StatCard label={isRtl ? 'المتابعون' : 'Page Followers'} value={fmt(metaData.organicMetrics?.fb?.followers)} color="text-blue-400" icon={<Users className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'الوصول' : 'Reach'} value={fmt(metaData.organicMetrics?.fb?.reach)} color="text-emerald-500" icon={<Activity className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'التفاعل' : 'Engagement'} value={fmt(metaData.organicMetrics?.fb?.engagement)} color="text-primary" icon={<TrendingUp className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'متابعون جدد' : 'New Followers'} value={fmt(metaData.organicMetrics?.fb?.newFollowers)} color="text-violet-400" icon={<Users className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'مشاهدات الفيديو' : 'Video Views'} value={fmt(metaData.organicMetrics?.fb?.videoViews)} color="text-rose-400" icon={<PlaySquare className="w-4 h-4" />} />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <SectionHeader color="bg-orange-500" label={isRtl ? 'أداء الإعلانات' : 'Ad Performance'} />
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                <StatCard label={isRtl ? 'الإنفاق' : 'Spend'} value={`${cur(metaData)} ${metaData.metrics.spend}`} color="text-orange-500" icon={<DollarSign className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'الظهور' : 'Impressions'} value={fmt(metaData.metrics.impressions)} color="text-primary" icon={<Eye className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'النقرات' : 'Clicks'} value={fmt(metaData.metrics.clicks)} color="text-emerald-500" icon={<MousePointer2 className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'نسبة النقر' : 'CTR'} value={`${metaData.metrics.ctr}%`} color="text-blue-400" icon={<BarChart className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'تكلفة النقرة' : 'CPC'} value={`${cur(metaData)} ${metaData.metrics.cpc}`} color="text-blue-500" icon={<BarChart className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'الوصول (إعلان)' : 'Ad Reach'} value={fmt(metaData.metrics.reach)} color="text-cyan-500" icon={<Activity className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'التكرار' : 'Frequency'} value={metaData.metrics.frequency} color="text-yellow-500" icon={<Hash className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'التحويلات' : 'Conversions'} value={fmt(metaData.metrics.conversions)} color="text-green-500" icon={<TrendingUp className="w-4 h-4" />} />
                                            </div>
                                        </div>

                                        {/* Campaign breakdown */}
                                        {metaData.campaigns?.length > 0 && (
                                            <div className="space-y-3">
                                                <SectionHeader color="bg-violet-500" label={isRtl ? 'تفاصيل الحملات' : 'Campaign Breakdown'} />
                                                <div className="rounded-lg border border-border overflow-hidden">
                                                    <table className="w-full text-xs">
                                                        <thead><tr className="bg-muted/50 text-muted-foreground">
                                                            <th className="text-left px-3 py-2 font-medium">{isRtl ? 'الحملة' : 'Campaign'}</th>
                                                            <th className="text-right px-3 py-2 font-medium">{isRtl ? 'الإنفاق' : 'Spend'}</th>
                                                            <th className="text-right px-3 py-2 font-medium">{isRtl ? 'ظهور' : 'Impr.'}</th>
                                                            <th className="text-right px-3 py-2 font-medium">CTR%</th>
                                                            <th className="text-right px-3 py-2 font-medium">{isRtl ? 'وصول' : 'Reach'}</th>
                                                        </tr></thead>
                                                        <tbody>
                                                            {metaData.campaigns.slice(0, 6).map((c: any, i: number) => (
                                                                <tr key={i} className="border-t border-border hover:bg-muted/30">
                                                                    <td className="px-3 py-2">
                                                                        <div className="font-medium truncate max-w-[160px]">{c.name}</div>
                                                                        <div className="text-muted-foreground text-[10px]">{c.objective?.replace(/_/g, ' ')}</div>
                                                                    </td>
                                                                    <td className="px-3 py-2 text-right text-orange-500 font-medium">{cur(metaData)} {parseFloat(c.spend || '0').toFixed(2)}</td>
                                                                    <td className="px-3 py-2 text-right">{fmt(c.impressions)}</td>
                                                                    <td className="px-3 py-2 text-right">{c.ctr}%</td>
                                                                    <td className="px-3 py-2 text-right">{fmt(c.reach)}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Active Ads Sidebar */}
                                    <div className="lg:col-span-4 space-y-3">
                                        <SectionHeader color="bg-emerald-500" label={isRtl ? 'الإعلانات النشطة' : 'Active Ads'} />
                                        {(metaData.activeAds || []).length > 0 ? (
                                            <div className="space-y-2">
                                                {metaData.activeAds.map((ad: any, i: number) => (
                                                    <Card key={i} className="hover:bg-muted/30 transition-colors">
                                                        <CardContent className="p-3">
                                                            <p className="text-sm font-medium truncate">{ad.name}</p>
                                                            <div className="flex justify-between items-center mt-1.5 text-xs text-muted-foreground">
                                                                <span className="text-orange-500 font-medium">{ad.spend}</span>
                                                                <span>{ad.results}</span>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="py-8 flex flex-col items-center justify-center text-center rounded-lg border border-dashed border-border">
                                                <PlaySquare className="w-8 h-8 mb-2 text-muted-foreground/30" />
                                                <p className="text-xs text-muted-foreground">{isRtl ? 'لا توجد إعلانات نشطة' : 'No active ads'}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ── INSTAGRAM ─────────────────────────────────────────────────── */}
                        {activeTab === 'instagram' && metaData && (
                            <>
                                <PeriodBar period={metaPeriod} since={metaSince} until={metaUntil} loading={metaLoading} color="#E4405F"
                                    onApply={(p, s, u) => fetchMeta(p, s, u)} isRtl={isRtl} />

                                <div className="grid lg:grid-cols-12 gap-5">
                                    <div className="lg:col-span-8 space-y-5">
                                        <div className="space-y-3">
                                            <SectionHeader color="bg-rose-500" label={isRtl ? 'الأداء العضوي — إنستجرام' : 'Organic Performance — Instagram'} />
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                <StatCard label={isRtl ? 'المتابعون' : 'Followers'} value={fmt(metaData.organicMetrics?.ig?.followers)} color="text-rose-400" icon={<Users className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'الوصول' : 'Reach'} value={fmt(metaData.organicMetrics?.ig?.reach)} color="text-emerald-500" icon={<Activity className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'مشاهدات الفيديو' : 'Video Views'} value={fmt(metaData.organicMetrics?.ig?.videoViews)} color="text-primary" icon={<PlaySquare className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'التفاعلات' : 'Interactions'} value={fmt(metaData.organicMetrics?.ig?.interactions)} color="text-rose-500" icon={<Heart className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'زيارات الملف' : 'Profile Views'} value={fmt(metaData.organicMetrics?.ig?.profileViews)} color="text-purple-400" icon={<Eye className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'نقرات الموقع' : 'Website Clicks'} value={fmt(metaData.organicMetrics?.ig?.websiteClicks)} color="text-cyan-500" icon={<MousePointer2 className="w-4 h-4" />} />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <SectionHeader color="bg-orange-500" label={isRtl ? 'أداء الإعلانات (مشترك)' : 'Ad Performance (Shared Account)'} />
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                <StatCard label={isRtl ? 'الإنفاق' : 'Spend'} value={`${cur(metaData)} ${metaData.metrics.spend}`} color="text-orange-500" icon={<DollarSign className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'الظهور' : 'Impressions'} value={fmt(metaData.metrics.impressions)} color="text-primary" icon={<Eye className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'النقرات' : 'Clicks'} value={fmt(metaData.metrics.clicks)} color="text-emerald-500" icon={<MousePointer2 className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'نسبة النقر' : 'CTR'} value={`${metaData.metrics.ctr}%`} color="text-blue-400" icon={<BarChart className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'تكلفة النقرة' : 'CPC'} value={`${cur(metaData)} ${metaData.metrics.cpc}`} color="text-blue-500" icon={<BarChart className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'الوصول' : 'Reach'} value={fmt(metaData.metrics.reach)} color="text-cyan-500" icon={<Activity className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'التكرار' : 'Frequency'} value={metaData.metrics.frequency} color="text-yellow-500" icon={<Hash className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'التحويلات' : 'Conversions'} value={fmt(metaData.metrics.conversions)} color="text-green-500" icon={<TrendingUp className="w-4 h-4" />} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="lg:col-span-4 space-y-3">
                                        <SectionHeader color="bg-emerald-500" label={isRtl ? 'الإعلانات النشطة' : 'Active Ads'} />
                                        {(metaData.activeAds || []).length > 0 ? (
                                            <div className="space-y-2">
                                                {metaData.activeAds.map((ad: any, i: number) => (
                                                    <Card key={i} className="hover:bg-muted/30">
                                                        <CardContent className="p-3">
                                                            <p className="text-sm font-medium truncate">{ad.name}</p>
                                                            <div className="flex justify-between items-center mt-1.5 text-xs text-muted-foreground">
                                                                <span className="text-orange-500 font-medium">{ad.spend}</span>
                                                                <span>{ad.results}</span>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="py-8 flex flex-col items-center justify-center rounded-lg border border-dashed border-border">
                                                <PlaySquare className="w-8 h-8 mb-2 text-muted-foreground/30" />
                                                <p className="text-xs text-muted-foreground">{isRtl ? 'لا توجد إعلانات' : 'No active ads'}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ── SNAPCHAT ───────────────────────────────────────────────────── */}
                        {activeTab === 'snapchat' && snapData && (
                            <>
                                <PeriodBar period={snapPeriod} since={snapSince} until={snapUntil} loading={snapLoading} color="#FFFC00"
                                    onApply={(p, s, u) => fetchSnap(p, s, u)} supportsAll isRtl={isRtl} />

                                <div className="grid lg:grid-cols-12 gap-5">
                                    <div className="lg:col-span-8 space-y-5">
                                        <div className="space-y-3">
                                            <SectionHeader color="bg-yellow-400" label={isRtl ? 'أداء الإعلانات' : 'Ad Performance'} />
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                <StatCard label={isRtl ? 'الظهور' : 'Impressions'} value={fmt(snapData.stats?.impressions)} color="text-blue-400" icon={<Eye className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'مشاهدات الفيديو' : 'Video Views'} value={fmt(snapData.stats?.videoViews)} color="text-rose-500" icon={<PlaySquare className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'سحب للأعلى' : 'Swipe Ups'} value={fmt(snapData.stats?.swipes)} color="text-emerald-500" icon={<MousePointer2 className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'إجمالي الإنفاق' : 'Total Spend'} value={snapData.stats?.spend != null ? `${sc(snapData)} ${snapData.stats.spend.toFixed(2)}` : '—'} color="text-orange-500" icon={<DollarSign className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'الوصول (تقريبي)' : 'Reach (est.)'} value={fmt(snapData.stats?.reach)} color="text-cyan-500" icon={<Activity className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'CPM' : 'CPM'} value={snapData.stats?.cpm != null ? `${sc(snapData)} ${snapData.stats.cpm.toFixed(2)}` : '—'} color="text-yellow-500" icon={<BarChart className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'حملات نشطة' : 'Active Campaigns'} value={snapData.activeCampaignCount ?? 0} color="text-primary" icon={<Megaphone className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'إعلانات نشطة / كل' : 'Valid / Total Ads'} value={`${snapData.validAdCount ?? 0} / ${snapData.adCount ?? 0}`} color="text-blue-500" icon={<Hash className="w-4 h-4" />} />
                                            </div>
                                        </div>

                                        {/* Objective breakdown */}
                                        {snapData.objectiveBreakdown && Object.keys(snapData.objectiveBreakdown).length > 0 && (
                                            <div className="space-y-3">
                                                <SectionHeader color="bg-yellow-400" label={isRtl ? 'أهداف الحملات' : 'Campaign Objectives'} />
                                                <div className="flex flex-wrap gap-2">
                                                    {Object.entries(snapData.objectiveBreakdown).map(([obj, count]) => (
                                                        <div key={obj} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-muted border border-border">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                                                            <span className="text-xs font-medium">{obj.replace(/_/g, ' ')}</span>
                                                            <span className="text-xs text-muted-foreground">({count as number})</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Top Campaigns */}
                                        {snapData.topCampaigns?.length > 0 && (
                                            <div className="space-y-3">
                                                <SectionHeader color="bg-emerald-500" label={isRtl ? 'أفضل الحملات' : 'Top Campaigns'} />
                                                <div className="rounded-lg border border-border overflow-hidden">
                                                    <table className="w-full text-xs">
                                                        <thead><tr className="bg-muted/50 text-muted-foreground">
                                                            <th className="text-left px-3 py-2 font-medium">{isRtl ? 'الحملة' : 'Campaign'}</th>
                                                            <th className="text-right px-3 py-2 font-medium">{isRtl ? 'الإنفاق' : 'Spend'}</th>
                                                            <th className="text-right px-3 py-2 font-medium">{isRtl ? 'ظهور' : 'Impr.'}</th>
                                                            <th className="text-right px-3 py-2 font-medium">{isRtl ? 'سحب' : 'Swipes'}</th>
                                                        </tr></thead>
                                                        <tbody>
                                                            {snapData.topCampaigns.map((c: any, i: number) => (
                                                                <tr key={i} className="border-t border-border hover:bg-muted/30">
                                                                    <td className="px-3 py-2">
                                                                        <div className="font-medium truncate max-w-[160px]">{c.name}</div>
                                                                        <div className="text-muted-foreground text-[10px]">{c.objective?.replace(/_/g, ' ')}</div>
                                                                    </td>
                                                                    <td className="px-3 py-2 text-right text-orange-500">{sc(snapData)} {c.stats?.spend?.toFixed(2)}</td>
                                                                    <td className="px-3 py-2 text-right">{fmt(c.stats?.impressions)}</td>
                                                                    <td className="px-3 py-2 text-right">{fmt(c.stats?.swipes)}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}

                                        {/* Targeting Info */}
                                        {snapData.targeting && (
                                            <div className="space-y-3">
                                                <SectionHeader color="bg-emerald-500" label={isRtl ? 'استهداف الحملة النشطة' : 'Active Campaign Targeting'} />
                                                <Card><CardContent className="p-4">
                                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                                        {(snapData.targeting.ageMin || snapData.targeting.ageMax) && (
                                                            <div className="flex justify-between"><span className="text-muted-foreground">{isRtl ? 'الفئة العمرية' : 'Age Range'}</span><span className="font-medium">{snapData.targeting.ageMin ?? '—'} – {snapData.targeting.ageMax ?? '—'}</span></div>
                                                        )}
                                                        {snapData.targeting.countries?.length > 0 && (
                                                            <div className="flex justify-between"><span className="text-muted-foreground">{isRtl ? 'الدول' : 'Countries'}</span><span className="font-medium">{snapData.targeting.countries.join(', ')}</span></div>
                                                        )}
                                                        {snapData.targeting.dailyBudget > 0 && (
                                                            <div className="flex justify-between"><span className="text-muted-foreground">{isRtl ? 'ميزانية يومية' : 'Daily Budget'}</span><span className="font-medium">{sc(snapData)} {snapData.targeting.dailyBudget.toFixed(2)}</span></div>
                                                        )}
                                                        {snapData.targeting.optimizationGoal && (
                                                            <div className="flex justify-between"><span className="text-muted-foreground">{isRtl ? 'هدف التحسين' : 'Optimization'}</span><span className="font-medium">{snapData.targeting.optimizationGoal.replace(/_/g, ' ')}</span></div>
                                                        )}
                                                    </div>
                                                </CardContent></Card>
                                            </div>
                                        )}
                                    </div>

                                    {/* Top Ads Sidebar */}
                                    <div className="lg:col-span-4 space-y-3">
                                        <SectionHeader color="bg-yellow-400" label={isRtl ? 'أفضل الإعلانات' : 'Top Ads'} />
                                        {(snapData.topAds || []).length > 0 ? (
                                            <div className="space-y-2">
                                                {snapData.topAds.map((a: any, i: number) => (
                                                    <Card key={i} className="hover:bg-muted/30">
                                                        <CardContent className="p-3">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', a.isValid ? 'bg-emerald-500' : 'bg-muted-foreground/40')} />
                                                                <p className="text-xs font-medium truncate">{a.name}</p>
                                                            </div>
                                                            <div className="flex justify-between text-xs text-muted-foreground">
                                                                <span className="text-orange-500">{sc(snapData)} {a.stats?.spend?.toFixed(2) ?? '0.00'}</span>
                                                                <span>{fmt(a.stats?.impressions)} {isRtl ? 'ظهور' : 'impr'}</span>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="py-8 flex flex-col items-center justify-center rounded-lg border border-dashed border-border">
                                                <Ghost className="w-8 h-8 mb-2 text-muted-foreground/30" />
                                                <p className="text-xs text-muted-foreground">{isRtl ? 'لا توجد إعلانات' : 'No ads found'}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ── GOOGLE ADS ────────────────────────────────────────────────── */}
                        {activeTab === 'google-ads' && googleAdsData && (
                            <>
                                <PeriodBar period={gadsPeriod} since={gadsSince} until={gadsUntil} loading={gadsLoading} color="#4285F4"
                                    onApply={(p, s, u) => fetchGads(p, s, u)} isRtl={isRtl} />

                                <div className="grid lg:grid-cols-12 gap-5">
                                    <div className="lg:col-span-8 space-y-5">
                                        {/* Overview */}
                                        <div className="space-y-3">
                                            <SectionHeader color="bg-blue-500" label={isRtl ? 'نظرة عامة على الحساب' : 'Account Overview'} />
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                <StatCard label={isRtl ? 'الظهور' : 'Impressions'} value={fmt(googleAdsData.stats?.totalImpressions)} color="text-blue-400" icon={<Eye className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'النقرات' : 'Clicks'} value={fmt(googleAdsData.stats?.totalClicks)} color="text-emerald-500" icon={<MousePointer2 className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'التحويلات' : 'Conversions'} value={fmt(googleAdsData.stats?.totalConversions, 1)} color="text-green-500" icon={<TrendingUp className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'الإنفاق الكلي' : 'Total Cost'} value={`${cur(googleAdsData)} ${fmt(googleAdsData.stats?.totalCost, 2)}`} color="text-orange-500" icon={<DollarSign className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'نسبة النقر' : 'Avg CTR'} value={`${googleAdsData.stats?.avgCtr ?? 0}%`} color="text-blue-400" icon={<Activity className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'تكلفة النقرة' : 'Avg CPC'} value={`${cur(googleAdsData)} ${googleAdsData.stats?.avgCpc ?? 0}`} color="text-orange-500" icon={<BarChart className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'معدل التحويل' : 'Conv. Rate'} value={`${googleAdsData.stats?.conversionRate ?? 0}%`} color="text-emerald-500" icon={<TrendingUp className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'تكلفة التحويل' : 'Cost/Conv.'} value={`${cur(googleAdsData)} ${googleAdsData.stats?.costPerConversion ?? 0}`} color="text-purple-500" icon={<DollarSign className="w-4 h-4" />} />
                                            </div>
                                        </div>

                                        {/* Campaign Type Breakdown */}
                                        {googleAdsData.campaignTypeBreakdown && Object.keys(googleAdsData.campaignTypeBreakdown).length > 0 && (
                                            <div className="space-y-3">
                                                <SectionHeader color="bg-blue-400" label={isRtl ? 'أنواع الحملات' : 'Campaign Types'} />
                                                <div className="flex flex-wrap gap-2">
                                                    {Object.entries(googleAdsData.campaignTypeBreakdown).map(([type, data]: [string, any]) => (
                                                        <div key={type} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted border border-border">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                                            <div>
                                                                <div className="text-xs font-medium">{type.replace(/_/g, ' ')}</div>
                                                                <div className="text-[10px] text-muted-foreground">{data.count} {isRtl ? 'حملة' : 'campaigns'} · {cur(googleAdsData)} {data.spend.toFixed(2)}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Device Breakdown */}
                                        {googleAdsData.deviceBreakdown && Object.keys(googleAdsData.deviceBreakdown).length > 0 && (
                                            <div className="space-y-3">
                                                <SectionHeader color="bg-cyan-500" label={isRtl ? 'توزيع الأجهزة' : 'Device Breakdown'} />
                                                <div className="grid grid-cols-3 gap-3">
                                                    {Object.entries(googleAdsData.deviceBreakdown).map(([device, data]: [string, any]) => {
                                                        const totalImpr = Object.values(googleAdsData.deviceBreakdown).reduce((s: number, d: any) => s + (d.impressions || 0), 0);
                                                        const pct = totalImpr > 0 ? Math.round((data.impressions / totalImpr) * 100) : 0;
                                                        const icon = device === 'MOBILE' ? <Smartphone className="w-4 h-4" /> : device === 'DESKTOP' ? <Monitor className="w-4 h-4" /> : <Tablet className="w-4 h-4" />;
                                                        return (
                                                            <Card key={device} className="hover:bg-muted/30">
                                                                <CardContent className="p-3 text-center">
                                                                    <div className="flex justify-center mb-1 text-muted-foreground">{icon}</div>
                                                                    <div className="text-lg font-bold">{pct}%</div>
                                                                    <div className="text-[10px] text-muted-foreground">{device}</div>
                                                                    <div className="text-[10px] text-muted-foreground">{fmt(data.impressions)} {isRtl ? 'ظهور' : 'impr'}</div>
                                                                </CardContent>
                                                            </Card>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Top Keywords */}
                                        {googleAdsData.topKeywords?.length > 0 && (
                                            <div className="space-y-3">
                                                <SectionHeader color="bg-green-500" label={isRtl ? 'أفضل الكلمات المفتاحية' : 'Top Keywords'} />
                                                <div className="rounded-lg border border-border overflow-hidden">
                                                    <table className="w-full text-xs">
                                                        <thead><tr className="bg-muted/50 text-muted-foreground">
                                                            <th className="text-left px-3 py-2">{isRtl ? 'الكلمة' : 'Keyword'}</th>
                                                            <th className="text-right px-3 py-2">{isRtl ? 'ظهور' : 'Impr.'}</th>
                                                            <th className="text-right px-3 py-2">{isRtl ? 'نقرات' : 'Clicks'}</th>
                                                            <th className="text-right px-3 py-2">{isRtl ? 'تكلفة' : 'Cost'}</th>
                                                        </tr></thead>
                                                        <tbody>
                                                            {googleAdsData.topKeywords.map((kw: any, i: number) => (
                                                                <tr key={i} className="border-t border-border hover:bg-muted/30">
                                                                    <td className="px-3 py-2">
                                                                        <div className="font-medium flex items-center gap-1"><Search className="w-3 h-3 text-muted-foreground" />{kw.keyword}</div>
                                                                        <div className="text-[10px] text-muted-foreground">{kw.matchType}</div>
                                                                    </td>
                                                                    <td className="px-3 py-2 text-right">{fmt(kw.impressions)}</td>
                                                                    <td className="px-3 py-2 text-right">{fmt(kw.clicks)}</td>
                                                                    <td className="px-3 py-2 text-right text-orange-500">{cur(googleAdsData)} {kw.cost.toFixed(2)}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Campaigns Sidebar */}
                                    <div className="lg:col-span-4 space-y-3">
                                        <SectionHeader color="bg-blue-400" label={isRtl ? 'أفضل الحملات' : 'Top Campaigns'} />
                                        {(googleAdsData.campaigns || []).length > 0 ? (
                                            <div className="space-y-2">
                                                {googleAdsData.campaigns.slice(0, 8).map((c: any, i: number) => (
                                                    <Card key={i} className="hover:bg-muted/30">
                                                        <CardContent className="p-3">
                                                            <div className="flex items-center gap-1.5 mb-1">
                                                                <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', c.status === 'ENABLED' ? 'bg-emerald-500' : 'bg-yellow-500')} />
                                                                <p className="text-xs font-medium truncate">{c.name}</p>
                                                            </div>
                                                            <div className="text-[10px] text-muted-foreground mb-1">{c.channelType?.replace(/_/g, ' ')}</div>
                                                            <div className="flex justify-between text-xs">
                                                                <span className="text-orange-500 font-medium">{cur(googleAdsData)} {c.cost?.toFixed(2) ?? '0.00'}</span>
                                                                <span className="text-muted-foreground">{fmt(c.impressions)} {isRtl ? 'ظهور' : 'impr'}</span>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="py-8 flex flex-col items-center justify-center rounded-lg border border-dashed border-border">
                                                <Megaphone className="w-8 h-8 mb-2 text-muted-foreground/30" />
                                                <p className="text-xs text-muted-foreground">{isRtl ? 'لا توجد حملات' : 'No campaigns in range'}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ── YOUTUBE ───────────────────────────────────────────────────── */}
                        {activeTab === 'youtube' && youtubeData && (
                            <>
                                <PeriodBar period={ytPeriod} since={ytSince} until={ytUntil} loading={ytLoading} color="#FF0000"
                                    onApply={(p, s, u) => fetchYt(p, s, u)} isRtl={isRtl} />

                                <div className="grid lg:grid-cols-12 gap-5">
                                    <div className="lg:col-span-8 space-y-5">
                                        <div className="space-y-3">
                                            <SectionHeader color="bg-red-500" label={isRtl ? 'إحصائيات القناة' : 'Channel Overview'} />
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                <StatCard label={isRtl ? 'المشتركون' : 'Subscribers'} value={fmt(youtubeData.stats?.subscribers)} color="text-red-500" icon={<Users className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'إجمالي المشاهدات' : 'Total Views'} value={fmt(youtubeData.stats?.totalViews)} color="text-emerald-500" icon={<Eye className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'عدد الفيديوهات' : 'Videos'} value={fmt(youtubeData.stats?.videoCount)} color="text-orange-400" icon={<PlaySquare className="w-4 h-4" />} />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <SectionHeader color="bg-red-400" label={isRtl ? `تحليلات الفترة (${youtubeData.period})` : `Period Analytics (${youtubeData.period})`} />
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                <StatCard label={isRtl ? 'المشاهدات' : 'Views'} value={fmt(youtubeData.stats?.recentViews)} color="text-primary" icon={<Eye className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'دقائق المشاهدة' : 'Watch Time (min)'} value={fmt(youtubeData.stats?.watchTimeMinutes)} color="text-red-400" icon={<Clock className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'متوسط المدة (ث)' : 'Avg Duration (s)'} value={`${Math.round(youtubeData.stats?.avgViewDuration ?? 0)}s`} color="text-primary" icon={<Activity className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'معدل الاحتفاظ' : 'Avg View %'} value={`${youtubeData.stats?.avgViewPercentage ?? 0}%`} color="text-cyan-500" icon={<TrendingUp className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'مشتركون جدد' : 'New Subscribers'} value={fmt(youtubeData.stats?.subscribersGained)} color="text-emerald-500" icon={<Users className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'إلغاء اشتراك' : 'Unsubscribes'} value={fmt(youtubeData.stats?.subscribersLost)} color="text-rose-500" icon={<Users className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'الإعجابات' : 'Likes'} value={fmt(youtubeData.stats?.likes)} color="text-rose-500" icon={<Heart className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'التعليقات' : 'Comments'} value={fmt(youtubeData.stats?.comments)} color="text-blue-400" icon={<MessageCircle className="w-4 h-4" />} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Recent Videos Sidebar */}
                                    <div className="lg:col-span-4 space-y-3">
                                        <SectionHeader color="bg-red-400" label={isRtl ? 'أحدث الفيديوهات' : 'Recent Videos'} />
                                        {(youtubeData.recentVideos || []).length > 0 ? (
                                            <div className="space-y-2">
                                                {youtubeData.recentVideos.map((v: any, i: number) => (
                                                    <Card key={i} className="hover:bg-muted/30">
                                                        <CardContent className="p-3">
                                                            <p className="text-xs font-medium line-clamp-2 mb-1.5">{v.title}</p>
                                                            <div className="flex gap-3 text-[10px] text-muted-foreground">
                                                                <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" /> {fmt(v.views)}</span>
                                                                <span className="flex items-center gap-0.5"><Heart className="w-3 h-3" /> {fmt(v.likes)}</span>
                                                                <span className="flex items-center gap-0.5"><MessageCircle className="w-3 h-3" /> {fmt(v.comments)}</span>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="py-8 flex flex-col items-center justify-center rounded-lg border border-dashed border-border">
                                                <Youtube className="w-8 h-8 mb-2 text-muted-foreground/30" />
                                                <p className="text-xs text-muted-foreground">{isRtl ? 'لا توجد فيديوهات' : 'No videos found'}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ── SALLA ─────────────────────────────────────────────────────── */}
                        {activeTab === 'salla' && sallaData && (
                            <>
                                <PeriodBar period={sallaPeriod} since={sallaSince} until={sallaUntil} loading={sallaLoading} color="#7C3AED"
                                    onApply={(p, s, u) => fetchSalla(p, s, u)} isRtl={isRtl} />

                                <div className="grid lg:grid-cols-12 gap-5">
                                    <div className="lg:col-span-8 space-y-5">
                                        <div className="space-y-3">
                                            <SectionHeader color="bg-violet-500" label={isRtl ? 'نظرة عامة على المتجر' : 'Store Overview'} />
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                <StatCard label={isRtl ? 'إجمالي الطلبات' : 'Total Orders'} value={fmt(sallaData.stats?.totalOrders)} color="text-violet-400" icon={<ShoppingCart className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'الإيرادات' : 'Revenue'} value={`${sc(sallaData)} ${fmt(sallaData.stats?.revenue, 2)}`} color="text-emerald-500" icon={<DollarSign className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'متوسط قيمة الطلب' : 'Avg Order Value'} value={`${sc(sallaData)} ${fmt(sallaData.stats?.avgOrderValue, 2)}`} color="text-violet-500" icon={<TrendingUp className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'طلبات معلقة' : 'Pending'} value={fmt(sallaData.stats?.pendingOrders)} color="text-yellow-500" icon={<Clock className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'إجمالي المنتجات' : 'Products'} value={fmt(sallaData.stats?.totalProducts)} color="text-orange-400" icon={<Package className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'إجمالي العملاء' : 'Customers'} value={fmt(sallaData.stats?.totalCustomers)} color="text-blue-400" icon={<Users className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'سلال متروكة' : 'Abandoned Carts'} value={fmt(sallaData.stats?.abandonedCarts)} color="text-rose-500" icon={<ShoppingCart className="w-4 h-4" />} />
                                            </div>
                                        </div>

                                        {/* Order Status Breakdown */}
                                        {sallaData.orderStatusBreakdown && Object.keys(sallaData.orderStatusBreakdown).length > 0 && (
                                            <div className="space-y-3">
                                                <SectionHeader color="bg-violet-400" label={isRtl ? 'توزيع حالات الطلبات' : 'Order Status Breakdown'} />
                                                <div className="flex flex-wrap gap-2">
                                                    {Object.entries(sallaData.orderStatusBreakdown).map(([status, count]) => (
                                                        <div key={status} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-muted border border-border">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                                                            <span className="text-xs font-medium">{status.replace(/_/g, ' ')}</span>
                                                            <span className="text-xs text-muted-foreground">({count as number})</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Top Products */}
                                        {sallaData.topProducts?.length > 0 && (
                                            <div className="space-y-3">
                                                <SectionHeader color="bg-orange-400" label={isRtl ? 'المنتجات (حديثة)' : 'Products (Recent)'} />
                                                <div className="rounded-lg border border-border overflow-hidden">
                                                    <table className="w-full text-xs">
                                                        <thead><tr className="bg-muted/50 text-muted-foreground">
                                                            <th className="text-left px-3 py-2 font-medium">{isRtl ? 'المنتج' : 'Product'}</th>
                                                            <th className="text-right px-3 py-2 font-medium">{isRtl ? 'السعر' : 'Price'}</th>
                                                            <th className="text-right px-3 py-2 font-medium">{isRtl ? 'الحالة' : 'Status'}</th>
                                                        </tr></thead>
                                                        <tbody>
                                                            {sallaData.topProducts.map((p: any, i: number) => (
                                                                <tr key={i} className="border-t border-border hover:bg-muted/30">
                                                                    <td className="px-3 py-2">
                                                                        <div className="font-medium truncate max-w-[180px]">{p.name || `Product #${p.id}`}</div>
                                                                        {p.sku && <div className="text-[10px] text-muted-foreground">SKU: {p.sku}</div>}
                                                                    </td>
                                                                    <td className="px-3 py-2 text-right text-emerald-500 font-medium">{p.currency || sc(sallaData)} {p.price}</td>
                                                                    <td className="px-3 py-2 text-right"><Badge variant="outline" className="text-[10px]">{p.status}</Badge></td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Recent Orders Sidebar */}
                                    <div className="lg:col-span-4 space-y-3">
                                        <SectionHeader color="bg-emerald-500" label={isRtl ? 'آخر الطلبات' : 'Recent Orders'} />
                                        {(sallaData.recentOrders || []).length > 0 ? (
                                            <div className="space-y-2">
                                                {sallaData.recentOrders.map((o: any, i: number) => (
                                                    <Card key={i} className="hover:bg-muted/30">
                                                        <CardContent className="p-3">
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <p className="text-xs font-medium">{o.id}</p>
                                                                    <p className="text-[10px] text-muted-foreground truncate max-w-[100px]">{o.customer}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-xs font-medium text-emerald-500">{o.currency || sc(sallaData)} {o.total?.toLocaleString() ?? '0'}</p>
                                                                    <p className="text-[10px] text-muted-foreground">{o.status}</p>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="py-8 flex flex-col items-center justify-center rounded-lg border border-dashed border-border">
                                                <ShoppingCart className="w-8 h-8 mb-2 text-muted-foreground/30" />
                                                <p className="text-xs text-muted-foreground">{isRtl ? 'لا توجد طلبات' : 'No recent orders'}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ── LINKEDIN ──────────────────────────────────────────────────── */}
                        {activeTab === 'linkedin' && linkedinData && (
                            <>
                                <PeriodBar period={liPeriod} since={liSince} until={liUntil} loading={liLoading} color="#0077B5"
                                    onApply={(p, s, u) => fetchLi(p, s, u)} isRtl={isRtl} />

                                <div className="space-y-3">
                                    <SectionHeader color="bg-blue-600" label={isRtl ? 'أداء الصفحة' : 'Page Performance'} />
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        <StatCard label={isRtl ? 'المتابعون' : 'Followers'} value={fmt(linkedinData.stats?.followers)} color="text-blue-400" icon={<Users className="w-4 h-4" />} />
                                        <StatCard label={isRtl ? 'زوار فريدون' : 'Unique Visitors'} value={fmt(linkedinData.stats?.uniqueVisitors)} color="text-emerald-500" icon={<Activity className="w-4 h-4" />} />
                                        <StatCard label={isRtl ? 'مشاهدات الصفحة' : 'Page Views'} value={fmt(linkedinData.stats?.pageViews)} color="text-primary" icon={<Eye className="w-4 h-4" />} />
                                        <StatCard label={isRtl ? 'الظهور' : 'Post Impressions'} value={fmt(linkedinData.stats?.impressions)} color="text-purple-400" icon={<TrendingUp className="w-4 h-4" />} />
                                        <StatCard label={isRtl ? 'النقرات' : 'Post Clicks'} value={fmt(linkedinData.stats?.clicks)} color="text-emerald-500" icon={<MousePointer2 className="w-4 h-4" />} />
                                        <StatCard label={isRtl ? 'المشاركات' : 'Shares'} value={fmt(linkedinData.stats?.shares)} color="text-blue-500" icon={<Share2 className="w-4 h-4" />} />
                                        <StatCard label={isRtl ? 'التفاعل' : 'Engagement Rate'} value={(Number(linkedinData.stats?.engagement || 0) * 100).toFixed(2) + '%'} color="text-orange-500" icon={<TrendingUp className="w-4 h-4" />} />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ── X (TWITTER) ───────────────────────────────────────────────── */}
                        {activeTab === 'x' && xData && (() => {
                            const tweets: any[] = xData.recentTweets || [];
                            const totalImp = tweets.reduce((s: number, t: any) => s + (t.impressions || 0), 0);
                            const totalLikes = tweets.reduce((s: number, t: any) => s + (t.likes || 0), 0);
                            const totalRt = tweets.reduce((s: number, t: any) => s + (t.retweets || 0), 0);
                            const totalReplies = tweets.reduce((s: number, t: any) => s + (t.replies || 0), 0);
                            const engRate = totalImp > 0 ? ((totalLikes + totalRt + totalReplies) / totalImp * 100).toFixed(2) : '0.00';
                            return (
                            <div className="space-y-5">
                                {/* Profile Card */}
                                <Card className="border-border">
                                    <CardContent className="p-4 flex items-center gap-4">
                                        {xData.profileImageUrl ? (
                                            <img src={xData.profileImageUrl} alt="profile" className="w-14 h-14 rounded-full object-cover ring-2 ring-gray-700" />
                                        ) : (
                                            <div className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center">
                                                <Twitter className="w-6 h-6 text-gray-400" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm">{xData.accountName}</p>
                                            <p className="text-xs text-muted-foreground">@{xData.username}</p>
                                            {xData.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{xData.description}</p>}
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-lg font-bold">{fmt(xData.stats?.followers)}</p>
                                            <p className="text-[10px] text-muted-foreground">{isRtl ? 'متابع' : 'Followers'}</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Account Stats */}
                                <div className="space-y-3">
                                    <SectionHeader color="bg-gray-700" label={isRtl ? 'إحصائيات الحساب' : 'Account Stats'} />
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        <StatCard label={isRtl ? 'المتابعون' : 'Followers'} value={fmt(xData.stats?.followers)} color="text-blue-400" icon={<Users className="w-4 h-4" />} />
                                        <StatCard label={isRtl ? 'يتابع' : 'Following'} value={fmt(xData.stats?.following)} color="text-emerald-500" icon={<Activity className="w-4 h-4" />} />
                                        <StatCard label={isRtl ? 'إجمالي التغريدات' : 'Total Posts'} value={fmt(xData.stats?.tweets)} color="text-primary" icon={<MessageCircle className="w-4 h-4" />} />
                                        <StatCard label={isRtl ? 'القوائم' : 'Listed In'} value={fmt(xData.stats?.listed)} color="text-purple-500" icon={<Hash className="w-4 h-4" />} />
                                    </div>
                                </div>

                                {/* Tweet Engagement Aggregate */}
                                {tweets.length > 0 && (
                                    <div className="space-y-3">
                                        <SectionHeader color="bg-gray-700" label={isRtl ? 'أداء آخر ١٠ تغريدات' : 'Last 10 Posts Performance'} />
                                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                            <StatCard label={isRtl ? 'إجمالي المشاهدات' : 'Total Impressions'} value={fmt(totalImp)} color="text-sky-400" icon={<Eye className="w-4 h-4" />} />
                                            <StatCard label={isRtl ? 'إجمالي الإعجابات' : 'Total Likes'} value={fmt(totalLikes)} color="text-rose-500" icon={<Heart className="w-4 h-4" />} />
                                            <StatCard label={isRtl ? 'إعادة النشر' : 'Retweets'} value={fmt(totalRt)} color="text-emerald-500" icon={<Share2 className="w-4 h-4" />} />
                                            <StatCard label={isRtl ? 'الردود' : 'Replies'} value={fmt(totalReplies)} color="text-amber-500" icon={<MessageCircle className="w-4 h-4" />} />
                                            <StatCard label={isRtl ? 'معدل التفاعل' : 'Eng. Rate'} value={`${engRate}%`} color="text-violet-400" icon={<TrendingUp className="w-4 h-4" />} />
                                        </div>
                                    </div>
                                )}

                                {/* Recent Tweets */}
                                <div className="space-y-3">
                                    <SectionHeader color="bg-gray-700" label={isRtl ? 'أحدث التغريدات' : 'Recent Posts'} />
                                    {tweets.length > 0 ? (
                                        <div className="grid sm:grid-cols-2 gap-3">
                                            {tweets.map((t: any, i: number) => (
                                                <Card key={i} className="hover:bg-muted/30 transition-colors">
                                                    <CardContent className="p-3 space-y-2">
                                                        <p className="text-xs line-clamp-3 leading-relaxed">{t.text}</p>
                                                        {t.createdAt && (
                                                            <p className="text-[10px] text-muted-foreground/60">
                                                                {new Date(t.createdAt).toLocaleDateString(isRtl ? 'ar' : 'en', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </p>
                                                        )}
                                                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground pt-1 border-t border-border">
                                                            <span className="flex items-center gap-0.5"><Heart className="w-3 h-3 text-rose-400" /> {fmt(t.likes)}</span>
                                                            <span className="flex items-center gap-0.5"><Share2 className="w-3 h-3 text-emerald-400" /> {fmt(t.retweets)}</span>
                                                            <span className="flex items-center gap-0.5"><MessageCircle className="w-3 h-3 text-amber-400" /> {fmt(t.replies)}</span>
                                                            {t.quotes > 0 && <span className="flex items-center gap-0.5"><Hash className="w-3 h-3 text-blue-400" /> {fmt(t.quotes)}</span>}
                                                            {t.impressions > 0 && <span className="flex items-center gap-0.5 ml-auto"><Eye className="w-3 h-3 text-sky-400" /> {fmt(t.impressions)}</span>}
                                                            {t.bookmarks > 0 && <span className="flex items-center gap-0.5"><CalendarDays className="w-3 h-3 text-violet-400" /> {fmt(t.bookmarks)}</span>}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-8 flex flex-col items-center justify-center rounded-lg border border-dashed border-border">
                                            <Twitter className="w-8 h-8 mb-2 text-muted-foreground/30" />
                                            <p className="text-xs text-muted-foreground">{isRtl ? 'لا توجد تغريدات حديثة' : 'No recent posts'}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            );
                        })()}

                        {/* ── TIKTOK ────────────────────────────────────────────────────── */}
                        {activeTab === 'tiktok' && tiktokData && (
                            <>
                                <PeriodBar period={tiktokPeriod} since={tiktokSince} until={tiktokUntil} loading={tiktokLoading} color="#010101"
                                    onApply={(p, s, u) => fetchTiktok(p, s, u)} isRtl={isRtl} />

                                <div className="space-y-5">
                                    {/* Ad Performance */}
                                    <div className="space-y-3">
                                        <SectionHeader color="bg-gray-800" label={isRtl ? 'أداء الإعلانات' : 'Ad Performance'} />
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            <StatCard label={isRtl ? 'الإنفاق' : 'Spend'} value={`${tiktokData.currency} ${fmt(tiktokData.stats?.spend, 2)}`} color="text-emerald-500" icon={<DollarSign className="w-4 h-4" />} />
                                            <StatCard label={isRtl ? 'الانطباعات' : 'Impressions'} value={fmt(tiktokData.stats?.impressions)} color="text-blue-400" icon={<Eye className="w-4 h-4" />} />
                                            <StatCard label={isRtl ? 'النقرات' : 'Clicks'} value={fmt(tiktokData.stats?.clicks)} color="text-primary" icon={<MousePointer2 className="w-4 h-4" />} />
                                            <StatCard label={isRtl ? 'الوصول' : 'Reach'} value={fmt(tiktokData.stats?.reach)} color="text-violet-400" icon={<Users className="w-4 h-4" />} />
                                            <StatCard label="CTR" value={`${fmt(tiktokData.stats?.ctr, 2)}%`} color="text-amber-500" icon={<TrendingUp className="w-4 h-4" />} />
                                            <StatCard label="CPM" value={`${tiktokData.currency} ${fmt(tiktokData.stats?.cpm, 2)}`} color="text-rose-500" icon={<BarChart className="w-4 h-4" />} />
                                            <StatCard label="CPC" value={`${tiktokData.currency} ${fmt(tiktokData.stats?.cpc, 2)}`} color="text-sky-400" icon={<DollarSign className="w-4 h-4" />} />
                                            <StatCard label={isRtl ? 'التكرار' : 'Frequency'} value={fmt(tiktokData.stats?.frequency, 2)} color="text-orange-400" icon={<Activity className="w-4 h-4" />} />
                                        </div>
                                    </div>

                                    {/* Video Stats */}
                                    <div className="space-y-3">
                                        <SectionHeader color="bg-gray-800" label={isRtl ? 'أداء الفيديو' : 'Video Performance'} />
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            <StatCard label={isRtl ? 'مشاهدات الفيديو' : 'Video Views'} value={fmt(tiktokData.stats?.videoViews)} color="text-pink-500" icon={<PlaySquare className="w-4 h-4" />} />
                                            <StatCard label={isRtl ? 'شاهد ٢ ث' : 'Watched 2s'} value={fmt(tiktokData.stats?.video2s)} color="text-fuchsia-400" icon={<Eye className="w-4 h-4" />} />
                                            <StatCard label={isRtl ? 'شاهد ٦ ث' : 'Watched 6s'} value={fmt(tiktokData.stats?.video6s)} color="text-purple-400" icon={<Eye className="w-4 h-4" />} />
                                            <StatCard label={isRtl ? 'اكتمال ١٠٠٪' : '100% Complete'} value={fmt(tiktokData.stats?.videoP100)} color="text-emerald-400" icon={<TrendingUp className="w-4 h-4" />} />
                                        </div>
                                        {/* Video completion bar */}
                                        {tiktokData.stats?.videoViews > 0 && (
                                            <Card className="border-border">
                                                <CardContent className="p-4">
                                                    <p className="text-xs text-muted-foreground mb-3">{isRtl ? 'نسب إتمام مشاهدة الفيديو' : 'Video Completion Rates'}</p>
                                                    {[
                                                        { label: '25%', val: tiktokData.stats?.videoP25 },
                                                        { label: '50%', val: tiktokData.stats?.videoP50 },
                                                        { label: '75%', val: tiktokData.stats?.videoP75 },
                                                        { label: '100%', val: tiktokData.stats?.videoP100 }
                                                    ].map(({ label, val }) => {
                                                        const pct = tiktokData.stats?.videoViews > 0 ? Math.round(val / tiktokData.stats.videoViews * 100) : 0;
                                                        return (
                                                            <div key={label} className="flex items-center gap-3 mb-2">
                                                                <span className="text-[10px] text-muted-foreground w-8 shrink-0">{label}</span>
                                                                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                                                    <div className="h-full bg-pink-500 rounded-full" style={{ width: `${pct}%` }} />
                                                                </div>
                                                                <span className="text-[10px] text-muted-foreground w-10 text-right">{pct}%</span>
                                                            </div>
                                                        );
                                                    })}
                                                </CardContent>
                                            </Card>
                                        )}
                                    </div>

                                    {/* Engagement & Conversion */}
                                    <div className="grid sm:grid-cols-2 gap-5">
                                        <div className="space-y-3">
                                            <SectionHeader color="bg-gray-800" label={isRtl ? 'التفاعل' : 'Engagement'} />
                                            <div className="grid grid-cols-2 gap-3">
                                                <StatCard label={isRtl ? 'زيارات البروفايل' : 'Profile Visits'} value={fmt(tiktokData.stats?.profileVisits)} color="text-sky-400" icon={<Users className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'متابعون جدد' : 'New Follows'} value={fmt(tiktokData.stats?.follows)} color="text-emerald-500" icon={<TrendingUp className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'الإعجابات' : 'Likes'} value={fmt(tiktokData.stats?.likes)} color="text-rose-500" icon={<Heart className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'التعليقات' : 'Comments'} value={fmt(tiktokData.stats?.comments)} color="text-amber-500" icon={<MessageCircle className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'المشاركات' : 'Shares'} value={fmt(tiktokData.stats?.shares)} color="text-violet-400" icon={<Share2 className="w-4 h-4" />} />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <SectionHeader color="bg-gray-800" label={isRtl ? 'التحويلات' : 'Conversions'} />
                                            <div className="grid grid-cols-2 gap-3">
                                                <StatCard label={isRtl ? 'التحويلات' : 'Conversions'} value={fmt(tiktokData.stats?.conversions)} color="text-emerald-500" icon={<TrendingUp className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'تكلفة/تحويل' : 'Cost/Conv.'} value={`${tiktokData.currency} ${fmt(tiktokData.stats?.costPerConversion, 2)}`} color="text-amber-500" icon={<DollarSign className="w-4 h-4" />} />
                                                <StatCard label="ROAS" value={fmt(tiktokData.stats?.roas, 2)} color="text-blue-400" icon={<BarChart className="w-4 h-4" />} />
                                                <StatCard label={isRtl ? 'الحملات النشطة' : 'Active Campaigns'} value={fmt(tiktokData.activeCampaignCount)} color="text-green-400" icon={<Megaphone className="w-4 h-4" />} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Objective Breakdown */}
                                    {Object.keys(tiktokData.objectiveBreakdown || {}).length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(tiktokData.objectiveBreakdown).map(([obj, cnt]: any) => (
                                                <Badge key={obj} variant="outline" className="text-[10px] gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500 inline-block" />
                                                    {obj.replace(/_/g, ' ')}: {cnt}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}

                                    {/* Campaigns + Top Ads */}
                                    <div className="grid lg:grid-cols-12 gap-5">
                                        {/* Campaigns Table */}
                                        <div className="lg:col-span-8 space-y-3">
                                            <SectionHeader color="bg-gray-800" label={isRtl ? 'الحملات' : 'Campaigns'} />
                                            {(tiktokData.campaigns || []).length > 0 ? (
                                                <div className="overflow-x-auto rounded-lg border border-border">
                                                    <table className="w-full text-xs">
                                                        <thead className="bg-muted/50">
                                                            <tr>
                                                                <th className="text-left p-2 text-muted-foreground font-medium">{isRtl ? 'الحملة' : 'Campaign'}</th>
                                                                <th className="text-center p-2 text-muted-foreground font-medium">{isRtl ? 'الهدف' : 'Objective'}</th>
                                                                <th className="text-center p-2 text-muted-foreground font-medium">{isRtl ? 'الحالة' : 'Status'}</th>
                                                                <th className="text-right p-2 text-muted-foreground font-medium">{isRtl ? 'الإنفاق' : 'Spend'}</th>
                                                                <th className="text-right p-2 text-muted-foreground font-medium">{isRtl ? 'الانطباعات' : 'Impr.'}</th>
                                                                <th className="text-right p-2 text-muted-foreground font-medium">CTR</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {tiktokData.campaigns.map((c: any, i: number) => (
                                                                <tr key={i} className="border-t border-border hover:bg-muted/30 transition-colors">
                                                                    <td className="p-2 font-medium max-w-[160px] truncate">{c.name}</td>
                                                                    <td className="p-2 text-center text-muted-foreground">{(c.objective || '').replace(/_/g, ' ')}</td>
                                                                    <td className="p-2 text-center">
                                                                        <Badge variant="outline" className={cn('text-[9px]', c.status === 'ENABLE' ? 'text-emerald-500 border-emerald-500/30' : 'text-muted-foreground')}>
                                                                            {c.status === 'ENABLE' ? (isRtl ? 'نشطة' : 'Active') : (isRtl ? 'متوقفة' : 'Paused')}
                                                                        </Badge>
                                                                    </td>
                                                                    <td className="p-2 text-right">{fmt(c.stats?.spend, 2)}</td>
                                                                    <td className="p-2 text-right">{fmt(c.stats?.impressions)}</td>
                                                                    <td className="p-2 text-right">{fmt(c.stats?.ctr, 2)}%</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
                                                    {isRtl ? 'لا توجد حملات' : 'No campaigns found'}
                                                </div>
                                            )}
                                        </div>

                                        {/* Top Ads */}
                                        <div className="lg:col-span-4 space-y-3">
                                            <SectionHeader color="bg-gray-800" label={isRtl ? 'أفضل الإعلانات (إنفاقاً)' : 'Top Ads by Spend'} />
                                            {(tiktokData.topAds || []).length > 0 ? (
                                                <div className="space-y-2">
                                                    {tiktokData.topAds.map((ad: any, i: number) => (
                                                        <Card key={i} className="hover:bg-muted/30 transition-colors">
                                                            <CardContent className="p-3">
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <span className="text-[10px] text-muted-foreground">Ad {ad.id?.slice(-6)}</span>
                                                                    <span className="text-xs font-semibold text-emerald-500">{tiktokData.currency} {fmt(ad.spend, 2)}</span>
                                                                </div>
                                                                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                                                                    <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" /> {fmt(ad.impressions)}</span>
                                                                    <span className="flex items-center gap-0.5"><MousePointer2 className="w-3 h-3" /> {fmt(ad.clicks)}</span>
                                                                    <span className="flex items-center gap-0.5"><PlaySquare className="w-3 h-3" /> {fmt(ad.videoViews)}</span>
                                                                    <span className="flex items-center gap-0.5"><TrendingUp className="w-3 h-3" /> {fmt(ad.ctr, 2)}%</span>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
                                                    {isRtl ? 'لا توجد إعلانات' : 'No ads data'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                    </div>
                    /* ═══════════════════════════════════════════════════════════════════ */
                    )}

                </motion.div>
            </AnimatePresence>

            {/* Footer */}
            <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-muted-foreground/60">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-muted">
                        <Info className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-[10px] max-w-sm leading-relaxed">
                        {isRtl
                            ? 'يتم جلب البيانات الحقيقية فقط للمنصات المفعلة. استخدم محدد التاريخ لتحليل أي فترة زمنية.'
                            : 'Real-time metrics synced for connected platforms. Use the date picker to analyze any time period.'}
                    </p>
                </div>
                <p className="text-[9px] shrink-0">Last sync: {new Date().toLocaleTimeString()}</p>
            </div>
        </div>
    );
}
