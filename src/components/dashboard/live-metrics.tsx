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
            <div className="h-[60vh] flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Activity className="w-8 h-8 text-primary animate-pulse" />
                    </div>
                </div>
                <div className="text-center">
                    <p className="text-lg font-black uppercase tracking-widest text-primary animate-pulse">
                        {isRtl ? "جاري مزامنة البيانات الحية..." : "Syncing Live Data..."}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2 uppercase font-bold tracking-[0.3em]">
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
        <div className="space-y-8">
            {/* Tab Switcher */}
            <div className="flex flex-wrap items-center gap-2 p-1.5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 w-fit">
                {platforms.map((platform) => (
                    <button
                        key={platform.id}
                        onClick={() => setActiveTab(platform.id)}
                        className={cn(
                            "flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 relative group overflow-hidden",
                            activeTab === platform.id 
                                ? "text-white" 
                                : "text-muted-foreground hover:text-white hover:bg-white/5"
                        )}
                    >
                        {activeTab === platform.id && (
                            <motion.div 
                                layoutId="activeTab" 
                                className="absolute inset-0 z-0 shadow-lg"
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
                            "relative z-10 font-black uppercase tracking-widest text-[10px] transition-colors",
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
                    transition={{ duration: 0.3 }}
                    className="space-y-10"
                >
                    {/* Platform Stats Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-[2rem] bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 backdrop-blur-xl relative overflow-hidden group">
                        {/* Status Pulse */}
                        <div className="absolute top-0 right-0 p-8">
                             <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                                <span className={cn("w-1.5 h-1.5 rounded-full", currentPlatform.isLive ? "bg-emerald-500 animate-pulse" : "bg-zinc-500")} />
                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                    {currentPlatform.isLive ? "Live" : "Placeholder"}
                                </span>
                             </div>
                        </div>

                        <div className="flex items-center gap-6 relative z-10">
                            <div 
                                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl relative overflow-hidden"
                                style={{ backgroundColor: currentPlatform.color }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                                <div className={currentPlatform.textColor}>
                                    {currentPlatform.icon && typeof currentPlatform.icon === 'object' && 'type' in (currentPlatform.icon as any)
                                        ? cloneElement(currentPlatform.icon as any, { className: 'w-8 h-8' })
                                        : currentPlatform.icon
                                    }
                                </div>
                            </div>
                            <div>
                                <h3 className="text-3xl font-black uppercase tracking-tight leading-none">{currentPlatform.name}</h3>
                                <p className="text-sm text-muted-foreground font-bold mt-2 flex items-center gap-2 opacity-60">
                                    <Activity className="w-3 h-3" /> {currentPlatform.accountName}
                                </p>
                            </div>
                        </div>

                        {currentPlatform.error ? (
                            <div className="flex items-center gap-4 bg-red-500/10 border border-red-500/20 px-6 py-4 rounded-2xl md:max-w-xs relative z-10">
                                <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
                                <p className="text-xs font-bold text-red-500/80 leading-relaxed">
                                    {currentPlatform.error}
                                </p>
                            </div>
                        ) : (
                            <div className="flex items-center gap-8 relative z-10">
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Timeframe</p>
                                    <Badge variant="outline" className="rounded-lg bg-primary/5 text-primary border-primary/20 font-black px-3 py-1">Last 30 Days</Badge>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Status</p>
                                    <Badge variant="outline" className="rounded-lg bg-emerald-500/5 text-emerald-500 border-emerald-500/20 font-black px-3 py-1">Optimized</Badge>
                                </div>
                            </div>
                        )}

                        {/* Background Decoration */}
                        <div 
                            className="absolute -right-20 -bottom-20 w-64 h-64 rounded-full opacity-[0.03] blur-3xl pointer-events-none transition-transform duration-1000 group-hover:scale-110"
                            style={{ backgroundColor: currentPlatform.color }}
                        />
                    </div>

                    {!currentPlatform.error && (
                        <div className="grid lg:grid-cols-12 gap-10">
                            {/* Main Metrics Content */}
                            <div className="lg:col-span-8 space-y-10">
                                {/* Organic Grid */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="h-4 w-1 bg-primary rounded-full" />
                                        <h4 className="text-sm font-black uppercase tracking-[0.2em]">{isRtl ? "الأداء العضوي" : "Organic Growth"}</h4>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        {currentPlatform.organicMetrics.map((metric, i) => (
                                            <div key={i} className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all group/card">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className={cn("p-2 rounded-xl bg-white/5", metric.color)}>
                                                        {metric.icon}
                                                    </div>
                                                    <TrendingUp className="w-3 h-3 text-muted-foreground opacity-20 group-hover/card:opacity-100 transition-opacity" />
                                                </div>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground line-clamp-1">{metric.label}</p>
                                                <h5 className={cn("text-2xl font-black mt-1 tracking-tighter", metric.color)}>{metric.value}</h5>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Ads Performance Grid */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="h-4 w-1 bg-orange-500 rounded-full" />
                                        <h4 className="text-sm font-black uppercase tracking-[0.2em] text-orange-500/80">{isRtl ? "أداء الميزانية" : "Ad Reach & ROI"}</h4>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        {currentPlatform.adMetrics.map((metric, i) => (
                                            <div key={i} className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all group/card">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className={cn("p-2 rounded-xl bg-white/5", metric.color)}>
                                                        {metric.icon}
                                                    </div>
                                                </div>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground line-clamp-1">{metric.label}</p>
                                                <h5 className={cn("text-2xl font-black mt-1 tracking-tighter", metric.color)}>{metric.value}</h5>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Active Ads Side Panel */}
                            <div className="lg:col-span-4 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-4 w-1 bg-emerald-500 rounded-full" />
                                        <h4 className="text-sm font-black uppercase tracking-[0.2em]">{isRtl ? "الإعلانات النشطة" : "Active Creatives"}</h4>
                                    </div>
                                    <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-black text-[9px] uppercase px-2">Live</Badge>
                                </div>

                                <div className="space-y-4">
                                    {currentPlatform.activeAds.length > 0 ? (
                                        currentPlatform.activeAds.map((ad, i) => (
                                            <div key={i} className="group/ad p-4 rounded-3xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] transition-all relative overflow-hidden">
                                                <div className="flex items-start justify-between gap-4 relative z-10">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-500 relative overflow-hidden shrink-0">
                                                            <ImageIcon className="w-6 h-6 opacity-40 group-hover/ad:scale-110 transition-transform duration-500" />
                                                            <div className="absolute inset-0 bg-gradient-to-tr from-black/60 to-transparent" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black tracking-tight leading-tight group-hover/ad:text-primary transition-colors">{ad.name}</p>
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{ad.status}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs font-black text-white">{ad.spend}</p>
                                                        <p className="text-[9px] text-muted-foreground font-bold mt-1 uppercase tracking-tighter opacity-70">{ad.results}</p>
                                                    </div>
                                                </div>
                                                
                                                {/* Mini Performance Bar */}
                                                <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden relative">
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: '70%' }}
                                                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-emerald-500 rounded-full"
                                                    />
                                                </div>

                                                <button className="absolute inset-0 opacity-0 group-hover/ad:opacity-100 flex items-center justify-center bg-black/60 backdrop-blur-[2px] transition-opacity duration-300">
                                                    <span className="px-4 py-2 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-wider scale-90 group-hover/ad:scale-100 transition-transform flex items-center gap-2">
                                                        View Details <ExternalLink className="w-3 h-3" />
                                                    </span>
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-20 flex flex-col items-center justify-center text-center opacity-20 border-2 border-dashed border-white/5 rounded-[2rem]">
                                            <PlaySquare className="w-12 h-12 mb-4" />
                                            <p className="text-[10px] font-black uppercase tracking-widest leading-loose">
                                                {isRtl ? "لا توجد حملات حية حالياً" : "Zero active campaigns\nat the moment"}
                                            </p>
                                        </div>
                                    )}
                                </div>
                                
                                <button className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:bg-white/10 hover:text-white transition-all">
                                    {isRtl ? "عرض جميع الإعلانات" : "View Analytics Report"}
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Footer Notice */}
            <div className="mt-10 pt-10 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6 opacity-40">
                <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-white/5">
                        <Info className="w-4 h-4" />
                    </div>
                    <p className="text-[10px] font-bold max-w-sm leading-relaxed">
                        {isRtl 
                            ? "يتم جلب البيانات الحقيقية فقط للمنصات المفعلة. المنصات الأخرى تظهر أغراض التوضيح وسوف يتم تفعيلها فور الربط."
                            : "Real-time metrics are synced only for connected platforms. Other platforms show simulation data for visualization."}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <p className="text-[9px] font-black uppercase tracking-widest">Last data sync: {new Date().toLocaleTimeString()}</p>
                    <RefreshCw className="w-3 h-3 animate-spin-slow" />
                </div>
            </div>
        </div>
    );
}

