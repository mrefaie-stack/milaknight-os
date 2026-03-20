'use client';

import { useState, useEffect, cloneElement } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, DollarSign, Eye, LineChart, MousePointer2, PlaySquare, TrendingUp, Activity, Smartphone, Hash, Users, MapPin, Search, CalendarDays, ExternalLink, RefreshCw, AlertCircle, Sparkles, Plus, Image as ImageIcon, MessageCircle, Heart, Share2, Info, Facebook, Instagram, Loader2, Ghost, Linkedin, Twitter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/language-context';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export function LiveMetrics() {
    const { isRtl } = useLanguage();
    const [metaData, setMetaData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('facebook');

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const res = await fetch('/api/dashboard/live/meta');
                const json = await res.json();
                console.log('Live Metrics API Response:', json);
                if (!res.ok) throw new Error(json.error || 'Failed to fetch');
                setMetaData(json);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <div className="text-center">
                    <p className="text-sm font-medium text-primary">
                        {isRtl ? "جاري مزامنة البيانات الحية..." : "Syncing Live Data..."}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        {isRtl ? "يرجى الانتظار قليلاً" : "Please wait a moment"}
                    </p>
                </div>
            </div>
        );
    }

    const platforms = [
        {
            id: 'facebook',
            name: 'Facebook',
            accountName: metaData?.accountName || 'Facebook Page',
            icon: <Facebook className="w-5 h-5" />,
            color: '#1877F2',
            isLive: !error && metaData,
            error: error,
            organicMetrics: [
                { label: isRtl ? "المتابعون" : "Followers", value: metaData?.organicMetrics?.fb?.followers?.toLocaleString() || '0', color: "text-blue-400", icon: <Users className="w-4 h-4" /> },
                { label: isRtl ? "الوصول" : "Reach", value: metaData?.organicMetrics?.fb?.reach?.toLocaleString() || '0', color: "text-emerald-500", icon: <Activity className="w-4 h-4" /> },
                { label: isRtl ? "التفاعل" : "Engagement", value: metaData?.organicMetrics?.fb?.engagement?.toLocaleString() || '0', color: "text-primary", icon: <TrendingUp className="w-4 h-4" /> },
                { label: isRtl ? "بينات الصفحة" : "Page Views", value: 'Live', color: "text-purple-400", icon: <Eye className="w-4 h-4" /> },
            ],
            adMetrics: metaData ? [
                { label: isRtl ? "الإنفاق" : "Spend", value: `SAR ${metaData.metrics.spend}`, color: "text-orange-500", icon: <DollarSign className="w-4 h-4" /> },
                { label: isRtl ? "الظهور" : "Impressions", value: metaData.metrics.impressions?.toLocaleString() || '0', color: "text-primary", icon: <Eye className="w-4 h-4" /> },
                { label: isRtl ? "النقرات" : "Link Clicks", value: metaData.metrics.clicks?.toLocaleString() || '0', color: "text-emerald-500", icon: <MousePointer2 className="w-4 h-4" /> },
                { label: isRtl ? "تكلفة النقرة" : "Avg. CPC", value: `SAR ${metaData.metrics.cpc}`, color: "text-blue-500", icon: <BarChart className="w-4 h-4" /> },
            ] : [],
            activeAds: metaData?.activeAds || []
        },
        {
            id: 'instagram',
            name: 'Instagram',
            accountName: metaData?.accountName || 'Instagram Business',
            icon: <Instagram className="w-5 h-5" />,
            color: '#E4405F',
            isLive: !error && metaData?.organicMetrics?.ig?.connected,
            error: !metaData?.organicMetrics?.ig?.connected ? (isRtl ? "حساب إنستجرام غير مربوط بهذه الصفحة" : "Instagram account not linked to this page") : error,
            organicMetrics: [
                { label: isRtl ? "المتابعون" : "Followers", value: metaData?.organicMetrics?.ig?.followers?.toLocaleString() || '0', color: "text-rose-400", icon: <Users className="w-4 h-4" /> },
                { label: isRtl ? "الوصول" : "Reach", value: metaData?.organicMetrics?.ig?.reach?.toLocaleString() || '0', color: "text-emerald-500", icon: <Activity className="w-4 h-4" /> },
                { label: isRtl ? "مشاهدات الفيديو" : "Video Views", value: metaData?.organicMetrics?.ig?.videoViews?.toLocaleString() || '0', color: "text-primary", icon: <PlaySquare className="w-4 h-4" /> },
                { label: isRtl ? "التفاعلات" : "Interactions", value: metaData?.organicMetrics?.ig?.interactions?.toLocaleString() || '0', color: "text-rose-500", icon: <Heart className="w-4 h-4" /> },
            ],
            adMetrics: metaData ? [
                { label: isRtl ? "الإنفاق" : "Spend", value: `SAR ${metaData.metrics.spend}`, color: "text-orange-500", icon: <DollarSign className="w-4 h-4" /> },
                { label: isRtl ? "الظهور" : "Impressions", value: metaData.metrics.impressions?.toLocaleString() || '0', color: "text-primary", icon: <Eye className="w-4 h-4" /> },
                { label: isRtl ? "النقرات" : "Link Clicks", value: metaData.metrics.clicks?.toLocaleString() || '0', color: "text-emerald-500", icon: <MousePointer2 className="w-4 h-4" /> },
                { label: isRtl ? "تكلفة النقرة" : "Avg. CPC", value: `SAR ${metaData.metrics.cpc}`, color: "text-blue-500", icon: <BarChart className="w-4 h-4" /> },
            ] : [],
            activeAds: metaData?.activeAds || []
        },
        {
            id: 'tiktok',
            name: 'TikTok',
            accountName: 'TikTok Business',
            icon: <PlaySquare className="w-5 h-5" />,
            color: '#000000',
            isLive: false,
            organicMetrics: [
                { label: isRtl ? "المتابعون" : "Followers", value: '312K', color: "text-blue-400", icon: <TrendingUp className="w-4 h-4" /> },
                { label: isRtl ? "الإعجابات" : "Total Likes", value: '4.5M', color: "text-rose-500", icon: <Heart className="w-4 h-4" /> },
                { label: isRtl ? "المشاركات" : "Shares", value: '88K', color: "text-emerald-500", icon: <Share2 className="w-4 h-4" /> },
                { label: isRtl ? "مشاهدات الفيديو" : "Profile Views", value: '1.2M', color: "text-purple-500", icon: <Eye className="w-4 h-4" /> },
            ],
            adMetrics: [
                { label: isRtl ? "الإنفاق" : "Spend", value: `SAR 520`, color: "text-orange-500", icon: <DollarSign className="w-4 h-4" /> },
                { label: isRtl ? "مشاهدات الإعلان" : "Ad Video Views", value: '45,000', color: "text-primary", icon: <Eye className="w-4 h-4" /> },
                { label: isRtl ? "النقرات" : "Clicks", value: '1,200', color: "text-emerald-500", icon: <MousePointer2 className="w-4 h-4" /> },
                { label: isRtl ? "تكلفة النقرة" : "Avg. CPC", value: `SAR 0.43`, color: "text-blue-500", icon: <BarChart className="w-4 h-4" /> },
            ],
            activeAds: [
                { id: '4', name: isRtl ? "تحدي تيك توك" : "Hashtag Challenge", status: 'active', spend: '400 SAR', results: '22k Views' }
            ]
        },
        {
            id: 'snapchat',
            name: 'Snapchat',
            accountName: 'Snapchat Public Profile',
            icon: <Ghost className="w-5 h-5" />,
            color: '#FFFC00',
            textColor: 'text-black',
            isLive: false,
            organicMetrics: [
                { label: isRtl ? "المشتركون" : "Subscribers", value: '88,200', color: "text-blue-400", icon: <TrendingUp className="w-4 h-4" /> },
                { label: isRtl ? "مشاهدات القصة" : "Story Views", value: '450K', color: "text-rose-500", icon: <Eye className="w-4 h-4" /> },
                { label: isRtl ? "التقاط الشاشة" : "Screenshots", value: '3,200', color: "text-emerald-500", icon: <Smartphone className="w-4 h-4" /> },
                { label: isRtl ? "تفاعل الفلاتر" : "Lens Plays", value: '12K', color: "text-purple-500", icon: <Sparkles className="w-4 h-4" /> },
            ],
            adMetrics: [
                { label: isRtl ? "الإنفاق" : "Spend", value: `SAR 340`, color: "text-orange-500", icon: <DollarSign className="w-4 h-4" /> },
                { label: isRtl ? "الظهور" : "Ad Impressions", value: '14,200', color: "text-primary", icon: <Eye className="w-4 h-4" /> },
                { label: isRtl ? "سحب الشاشة" : "Swipe Ups", value: '890', color: "text-emerald-500", icon: <MousePointer2 className="w-4 h-4" /> },
                { label: isRtl ? "تكلفة السحب" : "Avg. CPSU", value: `SAR 0.38`, color: "text-blue-500", icon: <BarChart className="w-4 h-4" /> },
            ],
            activeAds: [
                { id: '3', name: isRtl ? "فلتر رمضان" : "Ramadan Lens", status: 'active', spend: '200 SAR', results: '500 Scans' }
            ]
        },
        {
            id: 'x',
            name: 'X',
            accountName: 'X Business Account',
            icon: <Twitter className="w-5 h-5" />,
            color: '#000000',
            isLive: false,
            organicMetrics: [
                { label: isRtl ? "المتابعون" : "Followers", value: '12.5K', color: "text-blue-400", icon: <Users className="w-4 h-4" /> },
                { label: isRtl ? "مرات الظهور" : "Impressions", value: '140K', color: "text-emerald-500", icon: <Activity className="w-4 h-4" /> },
                { label: isRtl ? "التفاعل" : "Engagement Rate", value: '3.2%', color: "text-primary", icon: <TrendingUp className="w-4 h-4" /> },
                { label: isRtl ? "إعادة النشر" : "Reposts", value: '450', color: "text-purple-400", icon: <RefreshCw className="w-4 h-4" /> },
            ],
            adMetrics: [
                { label: isRtl ? "الإنفاق" : "Spend", value: `SAR 410`, color: "text-orange-500", icon: <DollarSign className="w-4 h-4" /> },
                { label: isRtl ? "ظهور الإعلان" : "Ad Impressions", value: '55,000', color: "text-primary", icon: <Eye className="w-4 h-4" /> },
                { label: isRtl ? "النقرات" : "Link Clicks", value: '820', color: "text-emerald-500", icon: <MousePointer2 className="w-4 h-4" /> },
                { label: isRtl ? "التكلفة لكل نقرة" : "Avg. CPC", value: `SAR 0.50`, color: "text-blue-500", icon: <BarChart className="w-4 h-4" /> },
            ],
            activeAds: []
        },
        {
            id: 'linkedin',
            name: 'LinkedIn',
            accountName: 'LinkedIn Company Page',
            icon: <Linkedin className="w-5 h-5" />,
            color: '#0077B5',
            isLive: false,
            organicMetrics: [
                { label: isRtl ? "المتابعون" : "Followers", value: '5,200', color: "text-blue-400", icon: <Users className="w-4 h-4" /> },
                { label: isRtl ? "الوصول" : "Unique Visitors", value: '1,200', color: "text-emerald-500", icon: <Activity className="w-4 h-4" /> },
                { label: isRtl ? "التفاعل" : "Engagement Rate", value: '5.8%', color: "text-primary", icon: <TrendingUp className="w-4 h-4" /> },
                { label: isRtl ? "المنشورات" : "Post Reach", value: '8,500', color: "text-purple-400", icon: <Search className="w-4 h-4" /> },
            ],
            adMetrics: [
                { label: isRtl ? "الإنفاق" : "Spend", value: `SAR 1,200`, color: "text-orange-500", icon: <DollarSign className="w-4 h-4" /> },
                { label: isRtl ? "الظهور" : "Ad Impressions", value: '12,400', color: "text-primary", icon: <Eye className="w-4 h-4" /> },
                { label: isRtl ? "النقرات" : "Link Clicks", value: '340', color: "text-emerald-500", icon: <MousePointer2 className="w-4 h-4" /> },
                { label: isRtl ? "التكلفة للحصول على عميل" : "Avg. CPL", value: `SAR 35.00`, color: "text-blue-500", icon: <BarChart className="w-4 h-4" /> },
            ],
            activeAds: []
        }
    ];

    const currentPlatform = platforms.find(p => p.id === activeTab) || platforms[0];

    return (
        <div className="space-y-6">
            {/* Tab Switcher */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-muted/40 rounded-lg border border-border w-fit">
                {platforms.map((platform) => (
                    <button
                        key={platform.id}
                        onClick={() => setActiveTab(platform.id)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 relative",
                            activeTab === platform.id
                                ? "text-white shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                    >
                        {activeTab === platform.id && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute inset-0 z-0 rounded-md"
                                style={{ backgroundColor: platform.color }}
                            />
                        )}
                        <span className={cn(
                            "relative z-10 transition-colors",
                            activeTab === platform.id && platform.id === 'snapchat' ? 'text-black' : ''
                        )}>
                            {platform.icon}
                        </span>
                        <span className={cn(
                            "relative z-10 text-xs font-medium transition-colors",
                            activeTab === platform.id && platform.id === 'snapchat' ? 'text-black' : ''
                        )}>
                            {platform.name}
                        </span>
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                >
                    {/* Platform Stats Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card">
                        <div className="flex items-center gap-4">
                            <div
                                className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
                                style={{ backgroundColor: currentPlatform.color }}
                            >
                                <div className={currentPlatform.textColor}>
                                    {currentPlatform.icon && typeof currentPlatform.icon === 'object' && 'type' in (currentPlatform.icon as any)
                                        ? cloneElement(currentPlatform.icon as any, { className: 'w-6 h-6' })
                                        : currentPlatform.icon
                                    }
                                </div>
                            </div>
                            <div>
                                <h3 className="text-base font-semibold">{currentPlatform.name}</h3>
                                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                    <Activity className="w-3 h-3" /> {currentPlatform.accountName}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted border border-border">
                                <span className={cn("w-1.5 h-1.5 rounded-full", currentPlatform.isLive ? "bg-emerald-500" : "bg-muted-foreground/40")} />
                                <span className="section-label text-muted-foreground">
                                    {currentPlatform.isLive ? "Live" : "Placeholder"}
                                </span>
                            </div>
                            {!currentPlatform.error && (
                                <>
                                    <Badge variant="outline" className="text-xs">Last 30 Days</Badge>
                                    <Badge variant="success" className="text-xs">Optimized</Badge>
                                </>
                            )}
                        </div>
                    </div>

                    {currentPlatform.error ? (
                        <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 px-4 py-3 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                            <p className="text-xs text-destructive/80">{currentPlatform.error}</p>
                        </div>
                    ) : (
                        <div className="grid lg:grid-cols-12 gap-6">
                            {/* Main Metrics Content */}
                            <div className="lg:col-span-8 space-y-6">
                                {/* Organic Grid */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-0.5 bg-primary rounded-full" />
                                        <p className="section-label text-muted-foreground">{isRtl ? "الأداء العضوي" : "Organic Growth"}</p>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {currentPlatform.organicMetrics.map((metric, i) => (
                                            <Card key={i} className="hover:bg-muted/30 transition-colors">
                                                <CardContent className="p-4">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className={cn("p-1.5 rounded-md bg-muted", metric.color)}>
                                                            {metric.icon}
                                                        </div>
                                                        <TrendingUp className="w-3 h-3 text-muted-foreground/30" />
                                                    </div>
                                                    <p className="section-label text-muted-foreground line-clamp-1">{metric.label}</p>
                                                    <h5 className={cn("text-2xl font-bold mt-1", metric.color)}>{metric.value}</h5>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>

                                {/* Ads Performance Grid */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-0.5 bg-orange-500 rounded-full" />
                                        <p className="section-label text-orange-500/70">{isRtl ? "أداء الميزانية" : "Ad Reach & ROI"}</p>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {currentPlatform.adMetrics.map((metric, i) => (
                                            <Card key={i} className="hover:bg-muted/30 transition-colors">
                                                <CardContent className="p-4">
                                                    <div className="mb-3">
                                                        <div className={cn("p-1.5 rounded-md bg-muted w-fit", metric.color)}>
                                                            {metric.icon}
                                                        </div>
                                                    </div>
                                                    <p className="section-label text-muted-foreground line-clamp-1">{metric.label}</p>
                                                    <h5 className={cn("text-2xl font-bold mt-1", metric.color)}>{metric.value}</h5>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Active Ads Side Panel */}
                            <div className="lg:col-span-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-0.5 bg-emerald-500 rounded-full" />
                                        <p className="section-label text-muted-foreground">{isRtl ? "الإعلانات النشطة" : "Active Creatives"}</p>
                                    </div>
                                    <Badge variant="success" className="text-[9px]">Live</Badge>
                                </div>

                                <div className="space-y-2">
                                    {currentPlatform.activeAds.length > 0 ? (
                                        currentPlatform.activeAds.map((ad, i) => (
                                            <Card key={i} className="hover:bg-muted/30 transition-colors">
                                                <CardContent className="p-3.5">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                                                <ImageIcon className="w-5 h-5 text-muted-foreground/40" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium leading-tight">{ad.name}</p>
                                                                <div className="flex items-center gap-1.5 mt-1">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                                    <span className="section-label text-muted-foreground">{ad.status}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <p className="text-xs font-medium">{ad.spend}</p>
                                                            <p className="section-label text-muted-foreground mt-0.5">{ad.results}</p>
                                                        </div>
                                                    </div>

                                                    <div className="mt-3 h-1 w-full bg-muted rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: '70%' }}
                                                            className="h-full bg-primary rounded-full"
                                                        />
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))
                                    ) : (
                                        <div className="py-12 flex flex-col items-center justify-center text-center rounded-lg border border-dashed border-border">
                                            <PlaySquare className="w-8 h-8 mb-3 text-muted-foreground/30" />
                                            <p className="text-xs text-muted-foreground">
                                                {isRtl ? "لا توجد حملات حية حالياً" : "No active campaigns at the moment"}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <button className="w-full py-2.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                                    {isRtl ? "عرض جميع الإعلانات" : "View Analytics Report"}
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Footer Notice */}
            <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-muted-foreground/60">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-muted">
                        <Info className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-[10px] max-w-sm leading-relaxed">
                        {isRtl
                            ? "يتم جلب البيانات الحقيقية فقط للمنصات المفعلة. المنصات الأخرى تظهر أغراض التوضيح وسوف يتم تفعيلها فور الربط."
                            : "Real-time metrics are synced only for connected platforms. Other platforms show simulation data for visualization."}
                    </p>
                </div>
                <p className="text-[9px] shrink-0">Last sync: {new Date().toLocaleTimeString()}</p>
            </div>
        </div>
    );
}
