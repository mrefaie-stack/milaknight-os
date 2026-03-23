'use client';

import { useState, useEffect, cloneElement } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, DollarSign, Eye, LineChart, MousePointer2, PlaySquare, TrendingUp, Activity, Smartphone, Hash, Users, MapPin, Search, CalendarDays, ExternalLink, RefreshCw, AlertCircle, Sparkles, Plus, Image as ImageIcon, MessageCircle, Heart, Share2, Info, Facebook, Instagram, Loader2, Ghost, Linkedin, Twitter, ShoppingCart, ShoppingBag, Package, Clock, Youtube, Megaphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/language-context';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type SnapPeriod = 'all' | '7d' | '30d' | '90d' | 'custom';

function toIso(date: Date) { return date.toISOString(); }
function daysAgo(n: number) { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(0,0,0,0); return d; }

export function LiveMetrics() {
    const { isRtl } = useLanguage();
    const [metaData, setMetaData] = useState<any>(null);
    const [snapData, setSnapData] = useState<any>(null);
    const [snapLoading, setSnapLoading] = useState(false);
    const [linkedinData, setLinkedinData] = useState<any>(null);
    const [xData, setXData] = useState<any>(null);
    const [sallaData, setSallaData] = useState<any>(null);
    const [youtubeData, setYoutubeData] = useState<any>(null);
    const [googleAdsData, setGoogleAdsData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('facebook');
    const [snapPeriod, setSnapPeriod] = useState<SnapPeriod>('all');
    const [snapCustomStart, setSnapCustomStart] = useState('');
    const [snapCustomEnd, setSnapCustomEnd] = useState('');

    const fetchSnap = async (period: SnapPeriod, customStart?: string, customEnd?: string) => {
        setSnapLoading(true);
        try {
            let url = '/api/dashboard/live/snapchat';
            const now = new Date(); now.setHours(23,59,59,999);
            if (period === '7d')  url += `?start=${toIso(daysAgo(7))}&end=${toIso(now)}`;
            if (period === '30d') url += `?start=${toIso(daysAgo(30))}&end=${toIso(now)}`;
            if (period === '90d') url += `?start=${toIso(daysAgo(90))}&end=${toIso(now)}`;
            if (period === 'custom' && customStart && customEnd) {
                const startDate = new Date(customStart + 'T00:00:00');
                const endDate = new Date(customEnd + 'T23:59:59');
                if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                    url += `?start=${startDate.toISOString()}&end=${endDate.toISOString()}`;
                }
            }
            const res = await fetch(url);
            if (res.ok) setSnapData(await res.json());
        } finally {
            setSnapLoading(false);
        }
    };

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const [metaRes, snapRes, linkedinRes, xRes, sallaRes, youtubeRes, googleAdsRes] = await Promise.allSettled([
                    fetch('/api/dashboard/live/meta'),
                    fetch('/api/dashboard/live/snapchat'),
                    fetch('/api/dashboard/live/linkedin'),
                    fetch('/api/dashboard/live/x'),
                    fetch('/api/dashboard/live/salla'),
                    fetch('/api/dashboard/live/youtube'),
                    fetch('/api/dashboard/live/google-ads')
                ]);

                if (metaRes.status === 'fulfilled') {
                    const json = await metaRes.value.json();
                    if (metaRes.value.ok) setMetaData(json);
                    else setError(json.error || 'Meta fetch failed');
                }

                if (snapRes.status === 'fulfilled' && snapRes.value.ok) {
                    setSnapData(await snapRes.value.json());
                }

                if (linkedinRes.status === 'fulfilled' && linkedinRes.value.ok) {
                    setLinkedinData(await linkedinRes.value.json());
                }

                if (xRes.status === 'fulfilled' && xRes.value.ok) {
                    setXData(await xRes.value.json());
                }

                if (sallaRes.status === 'fulfilled' && sallaRes.value.ok) {
                    setSallaData(await sallaRes.value.json());
                }

                if (youtubeRes.status === 'fulfilled' && youtubeRes.value.ok) {
                    setYoutubeData(await youtubeRes.value.json());
                }

                if (googleAdsRes.status === 'fulfilled' && googleAdsRes.value.ok) {
                    setGoogleAdsData(await googleAdsRes.value.json());
                }
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
            accountName: snapData?.accountName || 'Snapchat Ads',
            icon: <Ghost className="w-5 h-5" />,
            color: '#FFFC00',
            textColor: 'text-black',
            isLive: !!snapData,
            error: !snapData ? (isRtl ? "حساب سناب شات غير مربوط" : "Snapchat not connected") : null,
            organicMetrics: [
                { label: isRtl ? "إجمالي الظهور" : "Impressions", value: snapData?.stats?.impressions?.toLocaleString() ?? '—', color: "text-blue-400", icon: <Eye className="w-4 h-4" /> },
                { label: isRtl ? "مشاهدات الفيديو" : "Video Views", value: snapData?.stats?.videoViews?.toLocaleString() ?? '—', color: "text-rose-500", icon: <PlaySquare className="w-4 h-4" /> },
                { label: isRtl ? "سحب للأعلى" : "Swipe Ups", value: snapData?.stats?.swipes?.toLocaleString() ?? '—', color: "text-emerald-500", icon: <MousePointer2 className="w-4 h-4" /> },
                { label: isRtl ? "إجمالي الإنفاق" : "Total Spend", value: snapData?.stats?.spend != null ? `SAR ${snapData.stats.spend.toFixed(2)}` : '—', color: "text-orange-500", icon: <DollarSign className="w-4 h-4" /> },
            ],
            adMetrics: snapData ? [
                { label: isRtl ? "إجمالي الإنفاق" : "Total Spend", value: `SAR ${snapData.stats.spend?.toFixed(2) ?? '0.00'}`, color: "text-orange-500", icon: <DollarSign className="w-4 h-4" /> },
                { label: isRtl ? "الظهور" : "Impressions", value: snapData.stats.impressions?.toLocaleString() ?? '0', color: "text-primary", icon: <Eye className="w-4 h-4" /> },
                { label: isRtl ? "سحب للأعلى" : "Swipe Ups", value: snapData.stats.swipes?.toLocaleString() ?? '0', color: "text-emerald-500", icon: <MousePointer2 className="w-4 h-4" /> },
                { label: isRtl ? "إعلانات نشطة" : "Live Ads", value: isRtl ? `${snapData.adCount ?? 0} / ${snapData.validAdCount ?? 0}` : `${snapData.validAdCount ?? 0} / ${snapData.adCount ?? 0}`, color: "text-blue-500", icon: <Hash className="w-4 h-4" /> },
            ] : [],
            activeAds: snapData ? (snapData.topAds || []).map((a: any) => ({
                id: a.id,
                name: a.name,
                status: a.isValid ? 'active' : 'paused',
                spend: `SAR ${a.stats?.spend?.toFixed(2) ?? '0.00'}`,
                results: `${a.stats?.impressions?.toLocaleString() ?? '0'} ${isRtl ? 'ظهور' : 'impr'}`
            })) : []
        },
        {
            id: 'x',
            name: 'X',
            accountName: xData ? `@${xData.username}` : 'X Account',
            icon: <Twitter className="w-5 h-5" />,
            color: '#000000',
            isLive: !!xData,
            error: !xData ? (isRtl ? "حساب X غير مربوط" : "X not connected") : null,
            organicMetrics: [
                { label: isRtl ? "المتابعون" : "Followers", value: xData?.stats?.followers?.toLocaleString() ?? '—', color: "text-blue-400", icon: <Users className="w-4 h-4" /> },
                { label: isRtl ? "يتابع" : "Following", value: xData?.stats?.following?.toLocaleString() ?? '—', color: "text-emerald-500", icon: <Activity className="w-4 h-4" /> },
                { label: isRtl ? "التغريدات" : "Tweets", value: xData?.stats?.tweets?.toLocaleString() ?? '—', color: "text-primary", icon: <MessageCircle className="w-4 h-4" /> },
                { label: isRtl ? "الإعجابات المُعطاة" : "Likes Given", value: xData?.stats?.likes?.toLocaleString() ?? '—', color: "text-rose-500", icon: <Heart className="w-4 h-4" /> },
            ],
            adMetrics: xData ? [
                { label: isRtl ? "القوائم" : "Listed In", value: xData.stats.listed?.toLocaleString() ?? '0', color: "text-purple-500", icon: <Hash className="w-4 h-4" /> },
                { label: isRtl ? "المتابعون" : "Followers", value: xData.stats.followers?.toLocaleString() ?? '0', color: "text-blue-400", icon: <Users className="w-4 h-4" /> },
                { label: isRtl ? "التغريدات" : "Total Tweets", value: xData.stats.tweets?.toLocaleString() ?? '0', color: "text-primary", icon: <MessageCircle className="w-4 h-4" /> },
                { label: isRtl ? "يتابع" : "Following", value: xData.stats.following?.toLocaleString() ?? '0', color: "text-emerald-500", icon: <Activity className="w-4 h-4" /> },
            ] : [],
            activeAds: []
        },
        {
            id: 'linkedin',
            name: 'LinkedIn',
            accountName: linkedinData?.accountName || 'LinkedIn Company Page',
            icon: <Linkedin className="w-5 h-5" />,
            color: '#0077B5',
            isLive: !!linkedinData,
            error: !linkedinData ? (isRtl ? "حساب لينكد إن غير مربوط" : "LinkedIn not connected") : null,
            organicMetrics: [
                { label: isRtl ? "المتابعون" : "Followers", value: linkedinData?.stats?.followers?.toLocaleString() ?? '—', color: "text-blue-400", icon: <Users className="w-4 h-4" /> },
                { label: isRtl ? "زوار الصفحة" : "Unique Visitors", value: linkedinData?.stats?.uniqueVisitors?.toLocaleString() ?? '—', color: "text-emerald-500", icon: <Activity className="w-4 h-4" /> },
                { label: isRtl ? "مشاهدات الصفحة" : "Page Views", value: linkedinData?.stats?.pageViews?.toLocaleString() ?? '—', color: "text-primary", icon: <Eye className="w-4 h-4" /> },
                { label: isRtl ? "الظهور" : "Post Impressions", value: linkedinData?.stats?.impressions?.toLocaleString() ?? '—', color: "text-purple-400", icon: <TrendingUp className="w-4 h-4" /> },
            ],
            adMetrics: linkedinData ? [
                { label: isRtl ? "النقرات" : "Post Clicks", value: linkedinData.stats.clicks?.toLocaleString() ?? '0', color: "text-emerald-500", icon: <MousePointer2 className="w-4 h-4" /> },
                { label: isRtl ? "الظهور" : "Impressions", value: linkedinData.stats.impressions?.toLocaleString() ?? '0', color: "text-primary", icon: <Eye className="w-4 h-4" /> },
                { label: isRtl ? "المشاركات" : "Shares", value: linkedinData.stats.shares?.toLocaleString() ?? '0', color: "text-blue-500", icon: <Share2 className="w-4 h-4" /> },
                { label: isRtl ? "التفاعل" : "Engagement", value: linkedinData.stats.engagement?.toFixed(4) ?? '0', color: "text-orange-500", icon: <TrendingUp className="w-4 h-4" /> },
            ] : [],
            activeAds: []
        },
        {
            id: 'salla',
            name: 'Salla',
            accountName: sallaData?.storeName || (sallaData?.domain ? sallaData.domain : 'Salla Store'),
            icon: <ShoppingBag className="w-5 h-5" />,
            color: '#7C3AED',
            isLive: !!sallaData,
            error: !sallaData ? (isRtl ? "متجر سلة غير مربوط" : "Salla store not connected") : null,
            organicMetrics: [
                { label: isRtl ? "إجمالي الطلبات" : "Total Orders", value: sallaData?.stats?.totalOrders?.toLocaleString() ?? '—', color: "text-violet-400", icon: <ShoppingCart className="w-4 h-4" /> },
                { label: isRtl ? "الإيرادات" : "Revenue", value: sallaData?.stats?.revenue != null ? `SAR ${sallaData.stats.revenue.toLocaleString()}` : '—', color: "text-emerald-500", icon: <DollarSign className="w-4 h-4" /> },
                { label: isRtl ? "إجمالي العملاء" : "Total Customers", value: sallaData?.stats?.totalCustomers?.toLocaleString() ?? '—', color: "text-blue-400", icon: <Users className="w-4 h-4" /> },
                { label: isRtl ? "إجمالي المنتجات" : "Total Products", value: sallaData?.stats?.totalProducts?.toLocaleString() ?? '—', color: "text-orange-400", icon: <Package className="w-4 h-4" /> },
            ],
            adMetrics: sallaData ? [
                { label: isRtl ? "متوسط قيمة الطلب" : "Avg Order Value", value: `SAR ${sallaData.stats.avgOrderValue?.toLocaleString() ?? '0'}`, color: "text-violet-500", icon: <TrendingUp className="w-4 h-4" /> },
                { label: isRtl ? "طلبات معلقة" : "Pending Orders", value: sallaData.stats.pendingOrders?.toLocaleString() ?? '0', color: "text-yellow-500", icon: <Clock className="w-4 h-4" /> },
                { label: isRtl ? "سلال متروكة" : "Abandoned Carts", value: sallaData.stats.abandonedCarts?.toLocaleString() ?? '0', color: "text-rose-500", icon: <ShoppingCart className="w-4 h-4" /> },
                { label: isRtl ? "العملاء" : "Customers", value: sallaData.stats.totalCustomers?.toLocaleString() ?? '0', color: "text-blue-400", icon: <Users className="w-4 h-4" /> },
            ] : [],
            activeAds: sallaData ? (sallaData.recentOrders || []).map((o: any) => ({
                id: o.id,
                name: `${o.id} — ${o.customer}`,
                status: o.statusSlug === 'complete' ? 'active' : (o.statusSlug || 'pending'),
                spend: `SAR ${o.total?.toLocaleString() ?? '0'}`,
                results: o.status
            })) : []
        },
        {
            id: 'youtube',
            name: 'YouTube',
            accountName: youtubeData?.accountName || 'YouTube Channel',
            icon: <Youtube className="w-5 h-5" />,
            color: '#FF0000',
            isLive: !!youtubeData,
            error: !youtubeData ? (isRtl ? "حساب يوتيوب غير مربوط" : "YouTube not connected") : null,
            organicMetrics: [
                { label: isRtl ? "المشتركون" : "Subscribers", value: youtubeData?.stats?.subscribers?.toLocaleString() ?? '—', color: "text-red-500", icon: <Users className="w-4 h-4" /> },
                { label: isRtl ? "إجمالي المشاهدات" : "Total Views", value: youtubeData?.stats?.totalViews?.toLocaleString() ?? '—', color: "text-emerald-500", icon: <Eye className="w-4 h-4" /> },
                { label: isRtl ? "مشاهدات (28 يوم)" : "Views (28d)", value: youtubeData?.stats?.recentViews?.toLocaleString() ?? '—', color: "text-primary", icon: <TrendingUp className="w-4 h-4" /> },
                { label: isRtl ? "عدد الفيديوهات" : "Videos", value: youtubeData?.stats?.videoCount?.toLocaleString() ?? '—', color: "text-orange-400", icon: <PlaySquare className="w-4 h-4" /> },
            ],
            adMetrics: youtubeData ? [
                { label: isRtl ? "وقت المشاهدة (دقيقة)" : "Watch Time (min)", value: youtubeData.stats.watchTimeMinutes?.toLocaleString() ?? '0', color: "text-red-400", icon: <Clock className="w-4 h-4" /> },
                { label: isRtl ? "متوسط مدة المشاهدة" : "Avg View Duration", value: `${Math.round(youtubeData.stats.avgViewDuration ?? 0)}s`, color: "text-primary", icon: <Activity className="w-4 h-4" /> },
                { label: isRtl ? "مشتركون جدد" : "New Subscribers", value: youtubeData.stats.subscribersGained?.toLocaleString() ?? '0', color: "text-emerald-500", icon: <Users className="w-4 h-4" /> },
                { label: isRtl ? "الإعجابات" : "Likes", value: youtubeData.stats.likes?.toLocaleString() ?? '0', color: "text-rose-500", icon: <Heart className="w-4 h-4" /> },
            ] : [],
            activeAds: youtubeData ? (youtubeData.recentVideos || []).map((v: any) => ({
                id: v.id,
                name: v.title,
                status: 'active',
                spend: `${v.views?.toLocaleString() ?? '0'} ${isRtl ? 'مشاهدة' : 'views'}`,
                results: `${v.likes?.toLocaleString() ?? '0'} ${isRtl ? 'إعجاب' : 'likes'}`
            })) : []
        },
        {
            id: 'google-ads',
            name: 'Google Ads',
            accountName: googleAdsData?.accountName || 'Google Ads',
            icon: <Megaphone className="w-5 h-5" />,
            color: '#4285F4',
            isLive: !!googleAdsData,
            error: !googleAdsData ? (isRtl ? "حساب جوجل أدز غير مربوط" : "Google Ads not connected") : null,
            organicMetrics: [
                { label: isRtl ? "الظهور" : "Impressions", value: googleAdsData?.stats?.totalImpressions?.toLocaleString() ?? '—', color: "text-blue-400", icon: <Eye className="w-4 h-4" /> },
                { label: isRtl ? "النقرات" : "Clicks", value: googleAdsData?.stats?.totalClicks?.toLocaleString() ?? '—', color: "text-emerald-500", icon: <MousePointer2 className="w-4 h-4" /> },
                { label: isRtl ? "الإنفاق" : "Spend", value: googleAdsData?.stats?.totalCost != null ? `SAR ${googleAdsData.stats.totalCost.toLocaleString()}` : '—', color: "text-orange-500", icon: <DollarSign className="w-4 h-4" /> },
                { label: isRtl ? "التحويلات" : "Conversions", value: googleAdsData?.stats?.totalConversions?.toLocaleString() ?? '—', color: "text-primary", icon: <TrendingUp className="w-4 h-4" /> },
            ],
            adMetrics: googleAdsData ? [
                { label: isRtl ? "متوسط النقر (%)" : "Avg CTR (%)", value: `${googleAdsData.stats.avgCtr ?? '0'}%`, color: "text-blue-400", icon: <Activity className="w-4 h-4" /> },
                { label: isRtl ? "تكلفة النقرة" : "Avg CPC", value: `SAR ${googleAdsData.stats.avgCpc ?? '0'}`, color: "text-orange-500", icon: <BarChart className="w-4 h-4" /> },
                { label: isRtl ? "معدل التحويل" : "Conv. Rate (%)", value: `${googleAdsData.stats.conversionRate ?? '0'}%`, color: "text-emerald-500", icon: <TrendingUp className="w-4 h-4" /> },
                { label: isRtl ? "الحسابات" : "Accounts", value: googleAdsData.customerCount?.toString() ?? '0', color: "text-primary", icon: <Hash className="w-4 h-4" /> },
            ] : [],
            activeAds: googleAdsData ? (googleAdsData.campaigns || []).map((c: any) => ({
                id: c.id,
                name: c.name,
                status: c.status === 'ENABLED' ? 'active' : 'paused',
                spend: `SAR ${c.cost?.toFixed(2) ?? '0.00'}`,
                results: `${c.impressions?.toLocaleString() ?? '0'} ${isRtl ? 'ظهور' : 'impr'}`
            })) : []
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
                                    <Badge variant="outline" className="text-xs">
                                        {activeTab === 'snapchat'
                                            ? ({ all: isRtl ? 'كل الوقت' : 'All Time', '7d': isRtl ? 'آخر ٧ أيام' : 'Last 7 Days', '30d': isRtl ? 'آخر ٣٠ يوم' : 'Last 30 Days', '90d': isRtl ? 'آخر ٩٠ يوم' : 'Last 90 Days', custom: isRtl ? 'نطاق مخصص' : 'Custom Range' } as Record<SnapPeriod,string>)[snapPeriod]
                                            : activeTab === 'salla'
                                            ? (isRtl ? 'آخر ٥٠ طلب' : 'Last 50 Orders')
                                            : isRtl ? 'آخر ٣٠ يوم' : 'Last 30 Days'}
                                    </Badge>
                                    <Badge variant="success" className="text-xs">Optimized</Badge>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Snapchat Date Range Picker */}
                    {activeTab === 'snapchat' && !currentPlatform.error && (
                        <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border">
                            <CalendarDays className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span className="text-xs text-muted-foreground shrink-0">{isRtl ? 'الفترة:' : 'Period:'}</span>
                            {(['all', '7d', '30d', '90d'] as SnapPeriod[]).map((p) => {
                                const labels: Record<string, string> = { all: isRtl ? 'كل الوقت' : 'All Time', '7d': isRtl ? '٧ أيام' : '7 Days', '30d': isRtl ? '٣٠ يوم' : '30 Days', '90d': isRtl ? '٩٠ يوم' : '90 Days' };
                                return (
                                    <button
                                        key={p}
                                        onClick={() => { setSnapPeriod(p); fetchSnap(p); }}
                                        disabled={snapLoading}
                                        className={cn(
                                            "px-3 py-1 rounded-md text-xs font-medium transition-colors",
                                            snapPeriod === p ? "bg-[#FFFC00] text-black" : "bg-muted hover:bg-muted/80 text-muted-foreground"
                                        )}
                                    >{labels[p]}</button>
                                );
                            })}
                            <button
                                onClick={() => setSnapPeriod('custom')}
                                className={cn(
                                    "px-3 py-1 rounded-md text-xs font-medium transition-colors",
                                    snapPeriod === 'custom' ? "bg-[#FFFC00] text-black" : "bg-muted hover:bg-muted/80 text-muted-foreground"
                                )}
                            >{isRtl ? 'مخصص' : 'Custom'}</button>
                            {snapPeriod === 'custom' && (
                                <div className="flex items-center gap-2 flex-wrap">
                                    <input
                                        type="date"
                                        value={snapCustomStart}
                                        onChange={e => setSnapCustomStart(e.target.value)}
                                        className="text-xs bg-background border border-border rounded px-2 py-1 text-foreground"
                                    />
                                    <span className="text-xs text-muted-foreground">→</span>
                                    <input
                                        type="date"
                                        value={snapCustomEnd}
                                        onChange={e => setSnapCustomEnd(e.target.value)}
                                        className="text-xs bg-background border border-border rounded px-2 py-1 text-foreground"
                                    />
                                    <button
                                        onClick={() => fetchSnap('custom', snapCustomStart, snapCustomEnd)}
                                        disabled={!snapCustomStart || !snapCustomEnd || snapLoading}
                                        className="px-3 py-1 rounded-md text-xs font-medium bg-primary text-primary-foreground disabled:opacity-40"
                                    >{isRtl ? 'تطبيق' : 'Apply'}</button>
                                </div>
                            )}
                            {snapLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
                        </div>
                    )}

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
                                        <p className="section-label text-muted-foreground">
                                            {activeTab === 'salla'
                                                ? (isRtl ? "إحصائيات المتجر" : "Store Overview")
                                                : (isRtl ? "الأداء العضوي" : "Organic Growth")}
                                        </p>
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
                                        <p className="section-label text-orange-500/70">
                                            {activeTab === 'salla'
                                                ? (isRtl ? "تفاصيل إضافية" : "Store Details")
                                                : (isRtl ? "أداء الميزانية" : "Ad Reach & ROI")}
                                        </p>
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
                                        <p className="section-label text-muted-foreground">
                                            {activeTab === 'salla'
                                                ? (isRtl ? "آخر الطلبات" : "Recent Orders")
                                                : (isRtl ? "الإعلانات النشطة" : "Active Creatives")}
                                        </p>
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
                                            {activeTab === 'salla'
                                                ? <ShoppingCart className="w-8 h-8 mb-3 text-muted-foreground/30" />
                                                : <PlaySquare className="w-8 h-8 mb-3 text-muted-foreground/30" />
                                            }
                                            <p className="text-xs text-muted-foreground">
                                                {activeTab === 'salla'
                                                    ? (isRtl ? "لا توجد طلبات حديثة" : "No recent orders")
                                                    : (isRtl ? "لا توجد حملات حية حالياً" : "No active campaigns at the moment")}
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

                    {/* Snapchat Extras: Targeting + Objective Breakdown */}
                    {activeTab === 'snapchat' && snapData && (
                        <div className="grid md:grid-cols-2 gap-4">
                            {/* Objective Breakdown */}
                            {snapData.objectiveBreakdown && Object.keys(snapData.objectiveBreakdown).length > 0 && (
                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="h-3 w-0.5 bg-yellow-400 rounded-full" />
                                            <p className="section-label text-muted-foreground">{isRtl ? "تفاصيل الأهداف" : "Campaign Objectives"}</p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(snapData.objectiveBreakdown).map(([obj, count]) => (
                                                <div key={obj} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-muted border border-border">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                                                    <span className="text-xs font-medium">{obj.replace(/_/g, ' ')}</span>
                                                    <span className="text-xs text-muted-foreground">({count as number})</span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Targeting Overview */}
                            {snapData.targeting && (
                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="h-3 w-0.5 bg-emerald-500 rounded-full" />
                                            <p className="section-label text-muted-foreground">{isRtl ? "استهداف الحملة النشطة" : "Active Campaign Targeting"}</p>
                                        </div>
                                        <div className="space-y-2">
                                            {(snapData.targeting.ageMin || snapData.targeting.ageMax) && (
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-muted-foreground">{isRtl ? "الفئة العمرية" : "Age Range"}</span>
                                                    <span className="font-medium">{snapData.targeting.ageMin ?? '—'} – {snapData.targeting.ageMax ?? '—'}</span>
                                                </div>
                                            )}
                                            {snapData.targeting.countries?.length > 0 && (
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-muted-foreground">{isRtl ? "الدول" : "Countries"}</span>
                                                    <span className="font-medium">{snapData.targeting.countries.join(', ')}</span>
                                                </div>
                                            )}
                                            {snapData.targeting.dailyBudget > 0 && (
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-muted-foreground">{isRtl ? "الميزانية اليومية" : "Daily Budget"}</span>
                                                    <span className="font-medium">SAR {snapData.targeting.dailyBudget.toFixed(2)}</span>
                                                </div>
                                            )}
                                            {snapData.targeting.optimizationGoal && (
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-muted-foreground">{isRtl ? "هدف التحسين" : "Optimization Goal"}</span>
                                                    <span className="font-medium">{snapData.targeting.optimizationGoal.replace(/_/g, ' ')}</span>
                                                </div>
                                            )}
                                            {snapData.targeting.bidStrategy && (
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-muted-foreground">{isRtl ? "استراتيجية المزايدة" : "Bid Strategy"}</span>
                                                    <span className="font-medium">{snapData.targeting.bidStrategy.replace(/_/g, ' ')}</span>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
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
