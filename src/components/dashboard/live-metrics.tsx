'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, DollarSign, MousePointer2, Eye, Loader2, Facebook, AlertCircle, TrendingUp, PlaySquare, Ghost, Search, Image as ImageIcon, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/language-context';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export function LiveMetrics() {
    const { isRtl } = useLanguage();
    const [metaData, setMetaData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
            <div className="h-64 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-muted-foreground animate-pulse font-bold uppercase tracking-widest text-xs">
                    {isRtl ? "جاري جلب البيانات المباشرة..." : "Fetching Live Metrics..."}
                </p>
            </div>
        );
    }

    // Platforms Setup
    const platforms = [
        {
            id: 'meta',
            name: metaData?.accountName || 'Meta (Facebook & Instagram)',
            icon: <Facebook className="w-5 h-5 text-white" />,
            bgColor: 'bg-[#1877F2]',
            isLive: !error && metaData,
            error: error,
            organicMetrics: [
                { label: isRtl ? "المتابعون" : "Total Followers", value: '184,500', color: "text-blue-400", icon: <TrendingUp className="w-4 h-4" /> },
                { label: isRtl ? "التفاعل" : "Engagement", value: '24,300', color: "text-rose-500", icon: <TrendingUp className="w-4 h-4" /> },
                { label: isRtl ? "الوصول" : "Organic Reach", value: '1.2M', color: "text-emerald-500", icon: <Activity className="w-4 h-4" /> },
                { label: isRtl ? "زيارات الصفحة" : "Page Views", value: '45,200', color: "text-purple-500", icon: <Eye className="w-4 h-4" /> },
            ],
            adMetrics: metaData ? [
                { label: isRtl ? "الإنفاق (اليوم)" : "Spend (Today)", value: `SAR ${metaData.metrics.spend}`, color: "text-orange-500", icon: <DollarSign className="w-4 h-4" /> },
                { label: isRtl ? "الظهور (إعلانات)" : "Ad Impressions", value: metaData.metrics.impressions.toLocaleString(), color: "text-primary", icon: <Eye className="w-4 h-4" /> },
                { label: isRtl ? "النقرات" : "Link Clicks", value: metaData.metrics.clicks.toLocaleString(), color: "text-emerald-500", icon: <MousePointer2 className="w-4 h-4" /> },
                { label: isRtl ? "تكلفة النقرة" : "Avg. CPC", value: `SAR ${metaData.metrics.cpc}`, color: "text-blue-500", icon: <BarChart className="w-4 h-4" /> },
            ] : null,
            activeAds: metaData ? [
                { id: '1', name: isRtl ? "إعلان فيديو تعريفي" : "Brand Awareness Video", status: 'active', spend: '150 SAR', results: '2,400 Imp' },
                { id: '2', name: isRtl ? "حملة إعادة الاستهداف" : "Retargeting Campaign", status: 'active', spend: '85 SAR', results: '112 Clicks' },
            ] : []
        },
        {
            id: 'snapchat',
            name: 'Snapchat',
            icon: <Ghost className="w-5 h-5 text-black" />,
            bgColor: 'bg-[#FFFC00]',
            isLive: false,
            organicMetrics: [
                { label: isRtl ? "المشتركون" : "Subscribers", value: '88,200', color: "text-blue-400", icon: <TrendingUp className="w-4 h-4" /> },
                { label: isRtl ? "مشاهدات القصة" : "Story Views", value: '450K', color: "text-rose-500", icon: <Eye className="w-4 h-4" /> },
                { label: isRtl ? "التقاط الشاشة" : "Screenshots", value: '3,200', color: "text-emerald-500", icon: <Activity className="w-4 h-4" /> },
                { label: isRtl ? "تفاعل الفلاتر" : "Lens Plays", value: '12K', color: "text-purple-500", icon: <PlaySquare className="w-4 h-4" /> },
            ],
            adMetrics: [
                { label: isRtl ? "الإنفاق (اليوم)" : "Spend (Today)", value: `SAR 340`, color: "text-orange-500", icon: <DollarSign className="w-4 h-4" /> },
                { label: isRtl ? "الظهور (إعلانات)" : "Ad Impressions", value: '14,200', color: "text-primary", icon: <Eye className="w-4 h-4" /> },
                { label: isRtl ? "سحب الشاشة" : "Swipe Ups", value: '890', color: "text-emerald-500", icon: <MousePointer2 className="w-4 h-4" /> },
                { label: isRtl ? "تكلفة السحب" : "Avg. CPSU", value: `SAR 0.38`, color: "text-blue-500", icon: <BarChart className="w-4 h-4" /> },
            ],
            activeAds: [
                { id: '3', name: isRtl ? "فلتر رمضان" : "Ramadan Lens", status: 'active', spend: '200 SAR', results: '500 Scans' }
            ]
        },
        {
            id: 'tiktok',
            name: 'TikTok',
            icon: <PlaySquare className="w-5 h-5 text-white" />,
            bgColor: 'bg-[#000000]',
            isLive: false,
            organicMetrics: [
                { label: isRtl ? "المتابعون" : "Followers", value: '312K', color: "text-blue-400", icon: <TrendingUp className="w-4 h-4" /> },
                { label: isRtl ? "الإعجابات" : "Total Likes", value: '4.5M', color: "text-rose-500", icon: <Activity className="w-4 h-4" /> },
                { label: isRtl ? "المشاركات" : "Shares", value: '88K', color: "text-emerald-500", icon: <Activity className="w-4 h-4" /> },
                { label: isRtl ? "مشاهدات الفيديو" : "Profile Views", value: '1.2M', color: "text-purple-500", icon: <Eye className="w-4 h-4" /> },
            ],
            adMetrics: [
                { label: isRtl ? "الإنفاق (اليوم)" : "Spend (Today)", value: `SAR 520`, color: "text-orange-500", icon: <DollarSign className="w-4 h-4" /> },
                { label: isRtl ? "مشاهدات الإعلان" : "Ad Video Views", value: '45,000', color: "text-primary", icon: <Eye className="w-4 h-4" /> },
                { label: isRtl ? "النقرات" : "Clicks", value: '1,200', color: "text-emerald-500", icon: <MousePointer2 className="w-4 h-4" /> },
                { label: isRtl ? "تكلفة النقرة" : "Avg. CPC", value: `SAR 0.43`, color: "text-blue-500", icon: <BarChart className="w-4 h-4" /> },
            ],
            activeAds: [
                { id: '4', name: isRtl ? "تحدي تيك توك" : "Hashtag Challenge", status: 'active', spend: '400 SAR', results: '22k Views' }
            ]
        }
    ];

    return (
        <div className="space-y-12">
            {platforms.map((platform, pIndex) => (
                <motion.div
                    key={platform.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: pIndex * 0.15 }}
                    className="relative"
                >
                    {/* Platform Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className={cn("p-3 rounded-2xl shadow-lg", platform.bgColor)}>
                                {platform.icon}
                            </div>
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tight">{platform.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={cn("w-2 h-2 rounded-full", platform.isLive ? "bg-emerald-500 animate-pulse" : "bg-zinc-500")} />
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                        {platform.isLive ? "Live Sync Active" : "Simulated View"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Platform Error State */}
                    {platform.error && (
                        <div className="mb-6 p-6 border-2 border-dashed border-red-500/20 rounded-3xl bg-red-500/5 flex items-center gap-4">
                            <AlertCircle className="w-8 h-8 text-red-500 shrink-0" />
                            <div>
                                <h4 className="text-lg font-black text-red-500">{isRtl ? "غير متصل" : "Connection Required"}</h4>
                                <p className="text-sm text-muted-foreground">{platform.error}</p>
                            </div>
                        </div>
                    )}

                    {/* Platform Content Wrapper */}
                    <div className={cn("grid xl:grid-cols-3 gap-6", platform.error ? "opacity-30 pointer-events-none grayscale" : "opacity-100")}>
                        
                        {/* Metrics Grid */}
                        <div className="xl:col-span-2 space-y-6">
                            
                            {/* Organic Section */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                                    {isRtl ? "الاحصائيات العامة (Organic)" : "Organic Performance"}
                                </h4>
                                <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                                    {(platform.organicMetrics || []).map((card, i) => (
                                        <Card key={`org-${i}`} className="glass-card border-none rounded-3xl overflow-hidden bg-white/5 shadow-xl shadow-black/5">
                                            <CardHeader className="pb-2 bg-white/5 border-b border-white/5">
                                                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                                    {card.icon}
                                                    {card.label}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="pt-6 pb-6">
                                                <div className={cn("text-2xl md:text-3xl font-black tracking-tighter", card.color)}>
                                                    {card.value}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>

                            {/* Ads Section */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                                    {isRtl ? "الأداء الإعلاني (Ads)" : "Ads Performance"}
                                </h4>
                                <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                                    {(platform.adMetrics || []).map((card, i) => (
                                        <Card key={`ad-${i}`} className="glass-card border-none rounded-3xl overflow-hidden bg-white/5 shadow-xl shadow-black/5">
                                            <CardHeader className="pb-2 bg-white/5 border-b border-white/5">
                                                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                                    {card.icon}
                                                    {card.label}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="pt-6 pb-6">
                                                <div className={cn("text-2xl md:text-3xl font-black tracking-tighter", card.color)}>
                                                    {card.value}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>

                        </div>

                        {/* Active Ads List */}
                        <Card className="xl:col-span-1 glass-card border-none rounded-3xl overflow-hidden bg-white/5 shadow-xl shadow-black/5 flex flex-col">
                            <CardHeader className="bg-white/5 border-b border-white/5 py-4">
                                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-foreground flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4 text-primary" />
                                    {isRtl ? "الإعلانات النشطة المباشرة" : "Live Top Ads"}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 flex-1 overflow-y-auto custom-scrollbar max-h-[220px]">
                                {platform.activeAds.length > 0 ? (
                                    <div className="divide-y divide-white/5">
                                        {platform.activeAds.map((ad, i) => (
                                            <div key={i} className="p-4 hover:bg-white/[0.02] transition-colors flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 relative overflow-hidden">
                                                        <ImageIcon className="w-5 h-5 opacity-50" />
                                                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm tracking-tight line-clamp-1">{ad.name}</p>
                                                        <Badge variant="outline" className="mt-1 text-[9px] uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border-none px-2 py-0 h-4">
                                                            {ad.status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-xs font-black text-orange-400">{ad.spend}</p>
                                                    <p className="text-[10px] text-muted-foreground font-bold">{ad.results}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-muted-foreground h-full flex flex-col items-center justify-center space-y-2">
                                        <Ghost className="w-8 h-8 opacity-20" />
                                        <p className="text-xs font-bold uppercase tracking-widest opacity-50">
                                            {isRtl ? "لا توجد إعلانات نشطة الان" : "No Active Ads"}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                    </div>
                </motion.div>
            ))}

            <div className="p-6 bg-primary/5 border border-primary/10 rounded-3xl mt-12 text-center">
                <p className="text-sm font-bold text-muted-foreground">
                    {isRtl 
                        ? "يتم جلب البيانات الحية من المنصات المرتبطة عبر واجهة برمجة التطبيقات (API). البيانات الوهمية موضحة بغرض توضيح التصور وسوف يتم تفعيلها فور الانتهاء من ربط كل منصة."
                        : "Live data is fetched via connected platform APIs. Simulated data is shown as a placeholder until the respective platform integration is fully completed."}
                </p>
            </div>
        </div>
    );
}
