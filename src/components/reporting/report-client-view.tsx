"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, Facebook, Instagram, Video, Share2, Linkedin, Search, Youtube, TrendingUp, DollarSign, Target, Globe, BarChart3, Send, Mail, Trash2, Download, Loader2, MousePointer2, Zap, MessageSquare, Image as ImageIcon, ExternalLink, Users, Eye, Twitter, Save } from "lucide-react";
import { Bar, BarChart, Pie, PieChart, Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { publishReport, requestReportDeletion, submitReportFeedback, approveReportByMM, rejectReportByMM } from "@/app/actions/report";
import { useState } from "react";
import { toast } from "sonner";
import { generateReportPdf } from "@/lib/generate-report-pdf";

import { useLanguage } from "@/contexts/language-context";

const PLATFORM_ICONS = {
    facebook: Facebook,
    instagram: Instagram,
    tiktok: Video,
    snapchat: Share2,
    linkedin: Linkedin,
    google: Search,
    youtube: Youtube,
    x: Twitter,
};

const PLATFORM_NAMES = {
    facebook: "Facebook",
    instagram: "Instagram",
    tiktok: "TikTok",
    snapchat: "Snapchat",
    linkedin: "LinkedIn",
    google: "Google Ads",
    youtube: "YouTube",
    google_ads: "Google Ads",
    x: "X (Twitter)",
};

// Export PLATFORM_METRICS to use in other components
export const PLATFORM_METRICS: Record<string, { id: string, labelAr: string, labelEn: string, icon: any, suffix?: string }[]> = {
    facebook: [
        { id: "impressions", labelAr: "المشاهدات", labelEn: "Impressions", icon: Eye },
        { id: "reach", labelAr: "الوصول", labelEn: "Reach", icon: Users },
        { id: "engagement", labelAr: "تفاعلات المحتوى", labelEn: "Content interactions", icon: MousePointer2 },
        { id: "clicks", labelAr: "نقرات الرابط", labelEn: "Link clicks", icon: Target },
        { id: "profileVisits", labelAr: "إعجابات الصفحة", labelEn: "Page Likes", icon: Target },
        { id: "followers", labelAr: "متابعون جدد", labelEn: "New followers", icon: Users },
    ],
    instagram: [
        { id: "views", labelAr: "المشاهدات", labelEn: "Views", icon: Eye },
        { id: "reach", labelAr: "الوصول", labelEn: "Reach", icon: Users },
        { id: "engagement", labelAr: "تفاعلات المحتوى", labelEn: "Content interactions", icon: MousePointer2 },
        { id: "clicks", labelAr: "نقرات الرابط", labelEn: "Link clicks", icon: Target },
        { id: "profileVisits", labelAr: "زيارات الحساب", labelEn: "Profile visits", icon: Target },
        { id: "followers", labelAr: "متابعون جدد", labelEn: "New followers", icon: Users },
    ],
    linkedin: [
        { id: "impressions", labelAr: "الظهور", labelEn: "Impressions", icon: Eye },
        { id: "engagement", labelAr: "التفاعلات", labelEn: "Reactions", icon: MousePointer2 },
        { id: "comments", labelAr: "التعليقات", labelEn: "Comments", icon: MessageSquare },
        { id: "shares", labelAr: "إعادة النشر", labelEn: "Reposts", icon: Share2 },
        { id: "profileVisits", labelAr: "مشاهدات الصفحة", labelEn: "Page views", icon: Eye },
        { id: "followers", labelAr: "متابعون جدد", labelEn: "New followers", icon: Users },
        { id: "searches", labelAr: "عمليات البحث", labelEn: "Page searches", icon: Search },
    ],
    tiktok: [
        { id: "views", labelAr: "مشاهدات الفيديو", labelEn: "Video views", icon: Video },
        { id: "profileVisits", labelAr: "مشاهدات الملف الشخصي", labelEn: "Profile views", icon: Eye },
        { id: "likes", labelAr: "الإعجابات", labelEn: "Likes", icon: Target },
        { id: "comments", labelAr: "التعليقات", labelEn: "Comments", icon: MessageSquare },
        { id: "shares", labelAr: "المشاركات", labelEn: "Shares", icon: Share2 },
        { id: "followers", labelAr: "متابعون جدد", labelEn: "New followers", icon: Users },
    ],
    snapchat: [
        { id: "followers", labelAr: "متابعون جدد", labelEn: "New followers", icon: Users },
        { id: "views", labelAr: "إجمالي المشاهدات", labelEn: "Total views", icon: Eye },
        { id: "profileVisits", labelAr: "زيارات الملف", labelEn: "Profile views", icon: Eye },
    ],
    x: [
        { id: "impressions", labelAr: "الظهور", labelEn: "Impressions", icon: Eye },
        { id: "engagement", labelAr: "التفاعلات", labelEn: "Engagements", icon: MousePointer2 },
        { id: "profileVisits", labelAr: "زيارات الملف الشخصي", labelEn: "Profile visits", icon: Eye },
        { id: "replies", labelAr: "الردود", labelEn: "Replies", icon: MessageSquare },
        { id: "likes", labelAr: "الإعجابات", labelEn: "Likes", icon: Target },
        { id: "reposts", labelAr: "إعادة النشر", labelEn: "Reposts", icon: Share2 },
        { id: "bookmarks", labelAr: "العلامات المرجعية", labelEn: "Bookmarks", icon: Save },
        { id: "shares", labelAr: "المشاركات", labelEn: "Shares", icon: Share2 },
        { id: "followers", labelAr: "متابعون جدد", labelEn: "New followers", icon: Users },
        { id: "currentFollowers", labelAr: "إجمالي المتابعين", labelEn: "Total followers", icon: Users },
    ],
    google: [
        { id: "clicks", labelAr: "النقرات", labelEn: "Clicks", icon: MousePointer2 },
        { id: "impressions", labelAr: "الظهور", labelEn: "Impressions", icon: Eye },
        { id: "cpc", labelAr: "تكلفة النقرة", labelEn: "CPC", icon: DollarSign },
        { id: "conversions", labelAr: "التحويلات", labelEn: "Conversions", icon: Target },
    ],
    youtube: [
        { id: "views", labelAr: "المشاهدات", labelEn: "Views", icon: Video },
        { id: "watchTime", labelAr: "وقت المشاهدة", labelEn: "Watch Time", icon: Eye, suffix: "s" },
        { id: "engagement", labelAr: "التفاعلات", labelEn: "Engagement", icon: MousePointer2 },
        { id: "followers", labelAr: "مشتركون جدد", labelEn: "New Subscribers", icon: Users },
    ]
};

const PLATFORM_COLORS = [
    "text-blue-500", "text-emerald-500", "text-purple-500", "text-pink-500", "text-orange-500", "text-teal-500", "text-rose-500", "text-indigo-500"
];

export function ReportClientView({ report, metrics, role, previousMetrics }: { report: any, metrics: any, role: string, previousMetrics?: any }) {
    const { t, isRtl } = useLanguage();
    const [isPublishing, setIsPublishing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [status, setStatus] = useState(report.status);
    const [isDeletionRequested, setIsDeletionRequested] = useState(false);
    const [feedback, setFeedback] = useState(report.clientFeedback || "");
    const [isSendingFeedback, setIsSendingFeedback] = useState(false);
    const [feedbackSent, setFeedbackSent] = useState(!!report.clientFeedback);

    // MoM Delta helper: compare current value vs previous
    function getMoMDelta(current: number, prevMetrics: any, extractor: (m: any) => number): string | null {
        if (!prevMetrics) return null;
        const prev = extractor(prevMetrics);
        if (!prev || prev === 0) return null;
        const pct = ((current - prev) / prev) * 100;
        return (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%';
    }

    // Build previous month global totals for MoM
    function getPrevGlobal(prevM: any) {
        if (!prevM) return null;
        const prevCamps = prevM.campaigns || [{ platforms: prevM.platforms || {} }];
        const agg: Record<string, any> = {};
        prevCamps.forEach((c: any) => Object.entries(c.platforms || {}).forEach(([k, p]: [string, any]) => {
            if (!agg[k]) {
                agg[k] = {
                    impressions: Number(p.impressions) || 0,
                    engagement: Number(p.engagement) || 0,
                    followers: Number(p.followers) || 0,
                    currentFollowers: Number(p.currentFollowers) || 0,
                    views: Number(p.views) || 0,
                    paidReach: Number(p.paidReach) || 0,
                    spend: getPlatformSpend(p) || 0
                };
            } else {
                agg[k].impressions += (Number(p.impressions) || 0);
                agg[k].engagement += (Number(p.engagement) || 0);
                agg[k].followers += (Number(p.followers) || 0);
                agg[k].currentFollowers = Math.max(agg[k].currentFollowers, Number(p.currentFollowers) || 0);
                agg[k].views += (Number(p.views) || 0);
                agg[k].paidReach += (Number(p.paidReach) || 0);
                agg[k].spend += (getPlatformSpend(p) || 0);
            }
        }));
        return {
            impressions: Object.values(agg).reduce((s: number, p: any) => s + (p.impressions || 0), 0),
            engagement: Object.values(agg).reduce((s: number, p: any) => s + (p.engagement || 0), 0),
            followers: Object.values(agg).reduce((s: number, p: any) => s + (p.followers || 0), 0),
            spend: Object.values(agg).reduce((s: number, p: any) => s + (p.spend || 0), 0),
            platforms: agg
        };
    }
    const prevGlobal = getPrevGlobal(previousMetrics);

    async function handleDownloadPdf() {
        setIsDownloading(true);
        try {
            await generateReportPdf(report, metrics);
        } catch (e) {
            toast.error("Failed to generate PDF");
            console.error(e);
        } finally {
            setIsDownloading(false);
        }
    }

    async function handlePublish() {
        setIsPublishing(true);
        try {
            const res = await publishReport(report.id);
            if (res.internalReview) {
                setStatus("PENDING");
                toast.success(isRtl ? "تم إرسال التقرير للمراجعة الداخلية" : "Report sent for internal review");
            } else {
                setStatus("SENT");
                toast.success(t("dashboard.publish"));
            }
        } catch (error) {
            toast.error("Failed to publish report");
        } finally {
            setIsPublishing(false);
        }
    }

    async function handleDeleteRequest() {
        if (!confirm(t("dashboard.delete_confirm"))) return;

        setIsDeleting(true);
        try {
            await requestReportDeletion(report.id);
            setIsDeletionRequested(true);
            toast.success("Deletion request sent");
        } catch (error: any) {
            toast.error(error.message || "Failed to request deletion");
        } finally {
            setIsDeleting(false);
        }
    }

    // NEW: Handle Multi-Campaign structure
    const campaigns = metrics.campaigns || [
        { id: "default", name: "Main", platforms: metrics.platforms || {}, linkedItems: [] }
    ];

    // Aggregated platforms mapping (for charts and global totals)
    const aggregatedPlatforms: Record<string, any> = {};

    campaigns.forEach((camp: any) => {
        Object.entries(camp.platforms || {}).forEach(([platId, p]: [string, any]) => {
            if (!aggregatedPlatforms[platId]) {
                aggregatedPlatforms[platId] = { ...p, paidCampaigns: [...(p.paidCampaigns || [])] };
            } else {
                const existing = aggregatedPlatforms[platId];
                aggregatedPlatforms[platId] = {
                    ...existing,
                    followers: (existing.followers || 0) + (p.followers || 0),
                    currentFollowers: Math.max(existing.currentFollowers || 0, p.currentFollowers || 0),
                    engagement: (existing.engagement || 0) + (p.engagement || 0),
                    impressions: (existing.impressions || 0) + (p.impressions || 0),
                    views: (existing.views || 0) + (p.views || 0),
                    spend: (existing.spend || 0) + (p.spend || 0),
                    conversions: (existing.conversions || 0) + (p.conversions || 0),
                    paidReach: (existing.paidReach || 0) + (p.paidReach || 0),
                    organicReach: (existing.organicReach || 0) + (p.organicReach || 0),
                    clicks: (existing.clicks || 0) + (p.clicks || 0),
                    shares: (existing.shares || 0) + (p.shares || 0),
                    saves: (existing.saves || 0) + (p.saves || 0),
                    paidCampaigns: [...(existing.paidCampaigns || []), ...(p.paidCampaigns || [])]
                };
            }
        });
    });

    // X Growth Logic: If they provided currentFollowers (absolute) but NOT followers (growth), calculate it
    if (aggregatedPlatforms['x']) {
        const x = aggregatedPlatforms['x'];
        const prevX = prevGlobal?.platforms?.['x'];
        const currentTotalX = Number(x.currentFollowers) || 0;
        const previousTotalX = Number(prevX?.currentFollowers) || 0;
        
        // If currentTotalX exists and user hasn't explicitly entered growth in 'followers' field
        if (currentTotalX > 0 && (!x.followers || Number(x.followers) === 0)) {
            if (previousTotalX > 0) {
                x.followers = currentTotalX - previousTotalX;
            } else {
                // First report or no previous: treat all current as growth? 
                // Let's stick to 0 for growth unless previous exists, to avoid a huge spike.
                // But wait, the user says 1000 is not in total. If it's 1000 total, and growth is 0, 
                // it won't be in total. I'll stick to manual entry for now or previous-based.
            }
        }
    }

    // Helper: get effective spend for a platform (paidCampaigns sum if present, else platform.spend)
    function getPlatformSpend(p: any): number {
        if (p.paidCampaigns?.length > 0) {
            return p.paidCampaigns.reduce((acc: number, c: any) => acc + (Number(c.spend) || 0), 0);
        }
        return Number(p.spend) || 0;
    }

    function getPlatformResults(p: any): number {
        const paidResults = p.paidCampaigns?.length > 0
            ? p.paidCampaigns.reduce((acc: number, c: any) => acc + (Number(c.results) || 0), 0)
            : 0;
        return Math.max(Number(p.conversions) || 0, paidResults);
    }

    const activePlatforms = Object.keys(aggregatedPlatforms).filter(key => {
        const p = aggregatedPlatforms[key];
        return (
            (Number(p.impressions) || 0) !== 0 ||
            (Number(p.followers) || 0) !== 0 ||
            (Number(p.engagement) || 0) !== 0 ||
            (Number(p.views) || 0) !== 0 ||
            (Number(p.paidReach) || 0) !== 0 ||
            (Number(p.spend) || 0) !== 0 ||
            (Number(p.conversions) || 0) !== 0 ||
            (Number(p.currentFollowers) || 0) !== 0 ||
            (p.paidCampaigns?.length > 0)
        );
    });

    // Calculate Global Totals from aggregated data
    const globalTotals = {
        impressions: activePlatforms.reduce((acc, key) => acc + (Number(aggregatedPlatforms[key].impressions) || 0), 0),
        engagement: activePlatforms.reduce((acc, key) => acc + (Number(aggregatedPlatforms[key].engagement) || 0), 0),
        followers: activePlatforms.reduce((acc, key) => acc + (Number(aggregatedPlatforms[key].followers) || 0), 0),
        conversions: activePlatforms.reduce((acc, key) => acc + getPlatformResults(aggregatedPlatforms[key]), 0),
        spend: activePlatforms.reduce((acc, key) => acc + getPlatformSpend(aggregatedPlatforms[key]), 0),
        paidReach: activePlatforms.reduce((acc, key) => acc + (Number(aggregatedPlatforms[key].paidReach) || 0), 0),
        views: activePlatforms.reduce((acc, key) => acc + (Number(aggregatedPlatforms[key].views) || 0), 0),
    };

    // Email Marketing: support both old flat format and new campaigns array
    const emailCampaigns: any[] = (() => {
        const em = metrics.emailMarketing;
        if (!em) return [];
        if (em.campaigns && em.campaigns.length > 0) return em.campaigns;
        // Legacy flat format fallback
        if (em.emailsSent > 0) return [{ name: isRtl ? 'الحملة البريدية' : 'Email Campaign', emailsSent: em.emailsSent, openRate: em.openRate, clickRate: em.clickRate, unsubscribes: em.unsubscribes }];
        return [];
    })();
    const emailTotals = {
        emailsSent: emailCampaigns.reduce((s, c) => s + (Number(c.emailsSent) || 0), 0),
        openRate: emailCampaigns.length > 0 ? (emailCampaigns.reduce((s, c) => s + (Number(c.openRate) || 0), 0) / emailCampaigns.length) : 0,
        clickRate: emailCampaigns.length > 0 ? (emailCampaigns.reduce((s, c) => s + (Number(c.clickRate) || 0), 0) / emailCampaigns.length) : 0,
    };
    const hasEmail = emailTotals.emailsSent > 0;
    const hasSeo = (metrics.seo?.score > 0 || metrics.seo?.clicks > 0 || metrics.seo?.impressions > 0);

    const hasViews = globalTotals.views > 0;
    const hasPaidReach = globalTotals.paidReach > 0;
    const hasConversions = globalTotals.conversions > 0;
    const hasSpend = globalTotals.spend > 0;

    const baseChartData = activePlatforms.map(key => {
        const p = aggregatedPlatforms[key];
        // Logical mapping: For search/ads, clicks are the primary interaction
        let engagement = Number(p.engagement) || 0;
        if (['google', 'google_ads', 'google'].includes(key) && engagement === 0) {
            engagement = Number(p.clicks) || 0;
        }

        return {
            key,
            name: PLATFORM_NAMES[key as keyof typeof PLATFORM_NAMES] || key,
            impressions: Number(p.impressions) || 0,
            engagement,
            followers: Number(p.followers) || 0,
            views: Number(p.views) || 0,
            spend: getPlatformSpend(p),
            paidReach: Number(p.paidReach) || 0,
            conversions: getPlatformResults(p),
        };
    });

    if (hasSeo) {
        baseChartData.push({
            key: 'seo',
            name: isRtl ? 'تحسين محركات البحث' : 'SEO',
            impressions: Number(metrics.seo?.impressions) || 0,
            engagement: Number(metrics.seo?.clicks) || 0,
            followers: 0,
            views: 0,
            spend: 0,
            paidReach: 0,
            conversions: 0
        });
    }

    if (hasEmail) {
        baseChartData.push({
            key: 'email',
            name: isRtl ? 'التسويق عبر البريد' : 'Email Marketing',
            impressions: emailTotals.emailsSent,
            engagement: Math.round(emailTotals.emailsSent * ((emailTotals.openRate || 0) / 100)),
            followers: 0,
            views: 0,
            spend: 0,
            paidReach: 0,
            conversions: 0
        });
    }

    const chartData = baseChartData;

    const platformChartData = chartData.filter(d =>
        (d.impressions !== 0 || d.followers !== 0 || d.engagement !== 0 || d.views !== 0 || d.spend !== 0 || d.conversions !== 0 || (aggregatedPlatforms[d.key]?.currentFollowers || 0) !== 0) &&
        !['google', 'youtube', 'google_ads', 'seo', 'email'].includes(d.key)
    );

    const spendData = chartData.filter(d => d.spend > 0);

    return (
        <div className="space-y-12 max-w-6xl mx-auto pb-20 print:p-0 px-4 md:px-0" dir={isRtl ? "rtl" : "ltr"} id="pdf-content">
            {/* Header */}
            <div className={`flex flex-col md:flex-row md:items-end justify-between gap-6 print:flex-col print:items-start print:gap-2 print:mb-8 ${isRtl ? 'md:flex-row-reverse' : ''}`}>
                <div className={`space-y-1 ${isRtl ? 'md:text-right' : 'md:text-left'} print:text-left`}>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter premium-gradient-text uppercase print:text-black print:bg-none leading-none">
                        {t("reports.efficiency_report")}
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground font-medium uppercase tracking-[0.3em] opacity-60">
                        {report.client.name} • {report.month}
                    </p>
                </div>
                <div className={`flex gap-3 justify-center print:hidden ${isRtl ? 'flex-row-reverse' : ''}`} data-html2canvas-ignore="true">
                    {status === "DRAFT" && (
                        <Button
                            onClick={handlePublish}
                            disabled={isPublishing}
                            variant="default"
                            className="font-bold bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-500/20 rounded-full h-12 px-8"
                        >
                            <Send className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} /> {isPublishing ? t("dashboard.publishing") : (report.mmId ? (isRtl ? "إرسال للمدير" : "Send to Manager") : t("dashboard.publish"))}
                        </Button>
                    )}

                    {(role === "MARKETING_MANAGER" || role === "ADMIN") && report.mmStatus === "PENDING" && (
                        <div className="flex gap-2">
                            <Button
                                onClick={async () => {
                                    setIsPublishing(true);
                                    try {
                                        await approveReportByMM(report.id);
                                        setStatus("SENT");
                                        toast.success(isRtl ? "تمت الموافقة ونشر التقرير" : "Report approved and published");
                                    } catch (e) {
                                        toast.error("Failed to approve");
                                    } finally {
                                        setIsPublishing(false);
                                    }
                                }}
                                disabled={isPublishing}
                                variant="default"
                                className="font-bold bg-emerald-600 hover:bg-emerald-700 h-12 px-8 rounded-full"
                            >
                                {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : (isRtl ? "موافقة ونشر" : "Approve & Publish")}
                            </Button>
                            <Button
                                onClick={async () => {
                                    const reason = prompt(isRtl ? "سبب الرفض:" : "Reason for rejection:");
                                    if (!reason) return;
                                    setIsPublishing(true);
                                    try {
                                        await rejectReportByMM(report.id, reason);
                                        toast.success(isRtl ? "تم رفض التقرير" : "Report rejected");
                                    } catch (e) {
                                        toast.error("Failed to reject");
                                    } finally {
                                        setIsPublishing(false);
                                    }
                                }}
                                disabled={isPublishing}
                                variant="destructive"
                                className="font-bold h-12 px-8 rounded-full"
                            >
                                {isRtl ? "رفض" : "Reject"}
                            </Button>
                        </div>
                    )}
                    {role === "AM" && (
                        <Button
                            onClick={() => {
                                const url = `${window.location.origin}/p/report/${report.id}`;
                                navigator.clipboard.writeText(url);
                                toast.success(isRtl ? "تم نسخ الرابط العام بنجاح!" : "Public link copied to clipboard!");
                            }}
                            variant="outline"
                            className="font-bold rounded-full h-12 px-6"
                        >
                            <Share2 className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} /> {isRtl ? "نسخ رابط المشاركة" : "Copy Public Link"}
                        </Button>
                    )}

                    {role === "AM" && !isDeletionRequested && (
                        <Button
                            onClick={handleDeleteRequest}
                            disabled={isDeleting}
                            variant="destructive"
                            className="font-bold rounded-full h-12 px-6"
                        >
                            <Trash2 className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} /> {isDeleting ? t("dashboard.requesting") : t("dashboard.request_deletion")}
                        </Button>
                    )}
                    {isDeletionRequested && (
                        <div className="bg-orange-500/10 text-orange-500 text-xs font-black px-4 py-3 rounded-full border border-orange-500/20 flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                            </span>
                            {t("dashboard.pending_deletion")}
                        </div>
                    )}
                    <Button
                        onClick={handleDownloadPdf}
                        disabled={isDownloading}
                        variant="secondary"
                        className="font-bold rounded-full h-12 px-6 border border-primary/20"
                    >
                        {isDownloading ? <Loader2 className={`h-4 w-4 animate-spin ${isRtl ? 'ml-2' : 'mr-2'}`} /> : <Download className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />}
                        {isDownloading ? (isRtl ? "جاري التوليد..." : "Generating...") : (isRtl ? "تحميل PDF" : "Download PDF")}
                    </Button>
                </div>
            </div>

            {/* Global Performance Matrix — Row 1 */}
            <div className={`grid gap-4 grid-cols-2 md:grid-cols-${hasEmail ? '5' : '4'} ${isRtl ? 'flex-row-reverse' : ''}`}>
                {[
                    { label: t("reports.impressions"), value: globalTotals.impressions, color: 'bg-primary/5', sub: t("common.combined"), subColor: 'text-emerald-500', icon: <TrendingUp className="h-3 w-3" />, momKey: 'impressions' as const },
                    { label: t("reports.engagements"), value: globalTotals.engagement, color: 'bg-blue-500/5', sub: t("reports.interactions"), subColor: 'text-blue-500', icon: null, momKey: 'engagement' as const },
                    { label: t("reports.growth"), value: globalTotals.followers, color: 'bg-purple-500/5', sub: t("reports.new_followers"), subColor: 'text-purple-500', icon: null, momKey: 'followers' as const },
                    { label: t("reports.investment"), value: globalTotals.spend, rawValue: `SAR ${(globalTotals.spend).toLocaleString()}`, color: 'bg-orange-500/5', sub: t("reports.paid_media"), subColor: 'text-orange-500', icon: <DollarSign className="h-3 w-3" />, momKey: 'spend' as const },
                    ...(hasEmail ? [{ label: isRtl ? 'البريد الإلكتروني' : 'Email Marketing', value: emailTotals.emailsSent, color: 'bg-rose-500/5', sub: isRtl ? `فتح ${emailTotals.openRate.toFixed(0)}%` : `${emailTotals.openRate.toFixed(0)}% Open Rate`, subColor: 'text-rose-500', icon: <Mail className="h-3 w-3" />, momKey: null }] : []),
                ].map((card) => {
                    const delta = card.momKey ? getMoMDelta(card.value || 0, prevGlobal, (m) => m[card.momKey!] || 0) : null;
                    const isUp = delta?.startsWith('+');
                    return (
                        <Card key={card.label} className={`${card.color} border-none shadow-none backdrop-blur-md`}>
                            <CardHeader className={`pb-2 ${isRtl ? 'text-right' : 'text-left'}`}>
                                <CardTitle className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">{card.label}</CardTitle>
                            </CardHeader>
                            <CardContent className={isRtl ? 'text-right' : 'text-left'}>
                                <div className="text-2xl md:text-4xl font-black italic">{card.rawValue ?? (card.value || 0).toLocaleString()}</div>
                                <div className={`text-[10px] font-bold mt-2 flex items-center gap-1 ${card.subColor} ${isRtl ? 'flex-row-reverse' : ''}`}>
                                    {(card as any).icon}{card.sub}
                                </div>
                                {delta && (
                                    <div className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${isUp ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                        {isUp ? '↑' : '↓'} {delta} {isRtl ? 'مقارنة بالشهر الماضي' : 'vs last month'}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Global Performance Matrix — Row 2: extra metrics when available */}
            {(hasViews || hasPaidReach || hasConversions) && (
                <div className={`grid gap-4 grid-cols-2 md:grid-cols-${[hasViews, hasPaidReach, hasConversions].filter(Boolean).length} mt-0`}>
                    {hasViews && (
                        <Card className="bg-pink-500/5 border-none shadow-none">
                            <CardHeader className={`pb-2 ${isRtl ? 'text-right' : 'text-left'}`}><CardTitle className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">{t("common.views")}</CardTitle></CardHeader>
                            <CardContent className={isRtl ? 'text-right' : 'text-left'}>
                                <div className="text-2xl md:text-4xl font-black italic text-pink-500">{globalTotals.views.toLocaleString()}</div>
                                <div className="text-[10px] text-pink-500 font-bold mt-2">{isRtl ? 'تشغيلات الفيديو' : 'Video Plays'}</div>
                            </CardContent>
                        </Card>
                    )}
                    {hasPaidReach && (
                        <Card className="bg-teal-500/5 border-none shadow-none">
                            <CardHeader className={`pb-2 ${isRtl ? 'text-right' : 'text-left'}`}><CardTitle className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">{t("reports.paid_reach")}</CardTitle></CardHeader>
                            <CardContent className={isRtl ? 'text-right' : 'text-left'}>
                                <div className="text-2xl md:text-4xl font-black italic text-teal-500">{globalTotals.paidReach.toLocaleString()}</div>
                                <div className="text-[10px] text-teal-500 font-bold mt-2">{t("reports.targeted_audience")}</div>
                            </CardContent>
                        </Card>
                    )}
                    {hasConversions && (
                        <Card className="bg-rose-500/5 border-none shadow-none">
                            <CardHeader className={`pb-2 ${isRtl ? 'text-right' : 'text-left'}`}><CardTitle className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">{t("reports.conversions")}</CardTitle></CardHeader>
                            <CardContent className={isRtl ? 'text-right' : 'text-left'}>
                                <div className="text-2xl md:text-4xl font-black italic text-rose-500">{globalTotals.conversions.toLocaleString()}</div>
                                <div className="text-[10px] text-rose-500 font-bold mt-2">{t("reports.completed_actions")}</div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Executive Summary */}
            <Card className="border-none bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden ring-1 ring-white/10">
                <CardHeader className="bg-primary/10 py-4">
                    <CardTitle className={`text-lg font-black flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <TrendingUp className="h-5 w-5 text-primary" />
                        {t("reports.strategic_summary")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-8 pb-10 px-6 md:px-10">
                    <p className={`text-xl md:text-2xl leading-relaxed text-foreground/90 font-medium italic border-primary ${isRtl ? 'border-r-4 pr-8 text-right' : 'border-l-4 pl-8 text-left'}`}>
                        {metrics.summary || t("reports.default_summary")}
                    </p>
                </CardContent>
            </Card>

            {/* Strategic Dashboard: Growth Board */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm p-4 md:p-6">
                    <CardHeader className={`px-0 pt-0 ${isRtl ? 'text-right' : ''}`}>
                        <CardTitle className="text-xl font-black">{isRtl ? 'محرك النمو' : 'Growth Engine'}</CardTitle>
                        <p className="text-sm text-muted-foreground">{isRtl ? 'زيادة الجمهور عبر المنصات' : 'Audience acquisition across platforms'}</p>
                    </CardHeader>
                    <CardContent className="h-[300px] px-0">
                        <div dir="ltr">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={chartData.filter(d => d.followers !== 0)} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis dataKey="name" type="category" fontSize={11} tickLine={false} axisLine={false} width={80} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '16px', background: 'rgba(15,15,25,0.95)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }} 
                                        itemStyle={{ color: '#fff' }}
                                        labelStyle={{ color: '#fff' }}
                                        formatter={(v: any) => [v?.toLocaleString(), isRtl ? 'متابع جديد' : 'New Followers']} 
                                    />
                                    <Bar dataKey="followers" name={isRtl ? "متابعون جدد" : "New Followers"} radius={[0, 8, 8, 0]} barSize={25}>
                                        {chartData.filter(d => d.followers !== 0).map((_, i) => (<Cell key={i} fill={["#a855f7", "#3b82f6", "#10b981", "#f97316"][i % 4]} />))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Strategic Dashboard: Attention Board */}
                <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm p-4 md:p-6">
                    <CardHeader className={`px-0 pt-0 ${isRtl ? 'text-right' : ''}`}>
                        <CardTitle className="text-xl font-black">{isRtl ? 'خريطة الانتشار' : 'Attention Map'}</CardTitle>
                        <p className="text-sm text-muted-foreground">{isRtl ? 'توزيع المشاهدات والوصول' : 'Visibility distribution by platform'}</p>
                    </CardHeader>
                    <CardContent className="h-[300px] px-0">
                        <div dir="ltr">
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie data={chartData.filter(d => d.impressions > 0)} dataKey="impressions" nameKey="name" cx="50%" cy="45%" outerRadius={90} innerRadius={50} paddingAngle={4}
                                        label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`} labelLine={false}>
                                        {chartData.filter(d => d.impressions > 0).map((_, index) => (<Cell key={index} fill={["#3b82f6", "#10b981", "#f97316", "#ef4444", "#eab308"][index % 5]} />))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(15,15,25,0.95)', color: '#fff' }} 
                                        itemStyle={{ color: '#fff' }}
                                        labelStyle={{ color: '#fff' }}
                                        formatter={(v: any) => [v?.toLocaleString(), t("reports.impressions")]} 
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Strategic Dashboard: Intent & Results Board */}
            <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm p-4 md:p-10">
                <CardHeader className={`px-0 pt-0 ${isRtl ? 'text-right' : ''}`}>
                    <CardTitle className="text-2xl font-black">{isRtl ? 'الأفعال والنتائج المؤثرة' : 'High-Intent Results'}</CardTitle>
                    <p className="text-sm text-muted-foreground">{isRtl ? 'تجميع الأهداف المحققة والنقرات الإستراتيجية' : 'Aggregated conversions and strategic interactions'}</p>
                </CardHeader>
                <CardContent className="h-[340px] w-full pt-10 px-0">
                    <div dir="ltr">
                        <ResponsiveContainer width="100%" height={340}>
                            <BarChart data={chartData.filter(d => (d.conversions > 0 || d.engagement > 0))} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" fontSize={12} fontWeight="700" tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(15,15,25,0.95)', color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                        labelStyle={{ color: '#fff' }}
                                    />
                                <Legend />
                                <Bar dataKey="conversions" name={isRtl ? 'النتائج والتحويلات' : 'Conversions'} fill="#f43f5e" radius={[10, 10, 0, 0]} barSize={35} />
                                <Bar dataKey="engagement" name={isRtl ? 'تفاعلات إستراتيجية' : 'Strategic Interest'} fill="#10b981" radius={[10, 10, 0, 0]} barSize={35} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>



            {/* Standard Metrics fallback for Video/Specific views */}
            {hasViews && (
                <div className="grid gap-6 grid-cols-1">
                    <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm p-4 md:p-6">
                        <CardHeader className={`px-0 pt-0 ${isRtl ? 'text-right' : ''}`}>
                            <CardTitle className="text-xl font-black">{t("reports.video_views")}</CardTitle>
                            <p className="text-sm text-muted-foreground">{t("reports.video_views_sub")}</p>
                        </CardHeader>
                        <CardContent className="h-[280px] px-0">
                            <div dir="ltr">
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={chartData.filter(d => d.views > 0)} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                                        <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} />
                                        <YAxis dataKey="name" type="category" fontSize={11} tickLine={false} axisLine={false} width={70} />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '16px', background: 'rgba(15,15,25,0.95)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }} 
                                            itemStyle={{ color: '#fff' }}
                                            labelStyle={{ color: '#fff' }}
                                            formatter={(v: any) => [v?.toLocaleString(), t("common.views")]} 
                                        />
                                        <Bar dataKey="views" name={t("common.views")} radius={[0, 8, 8, 0]} barSize={22} fill="#ec4899">
                                            {chartData.filter(d => d.views > 0).map((_, i) => (<Cell key={i} fill={["#ec4899", "#f97316", "#06b6d4", "#8b5cf6"][i % 4]} />))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Individual Platform Deep Dives */}
            <div className="space-y-16 print:space-y-8">
                <h2 className={`text-3xl font-black border-primary py-2 uppercase tracking-tighter print:text-2xl ${isRtl ? 'border-r-8 pr-6 text-right' : 'border-l-8 pl-6 text-left'}`}>{t("reports.platform_analysis")}</h2>
                <div className="space-y-16">
                    {campaigns.map((camp: any, cIdx: number) => (
                        <div key={camp.id || cIdx} className="space-y-8">
                            {campaigns.length > 1 && (
                                <div className={`flex items-center gap-4 border-b-2 border-primary/20 pb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                    <div className="h-10 w-2 bg-primary rounded-full" />
                                    <h3 className="text-2xl font-black tracking-tight">{camp.name}</h3>
                                </div>
                            )}

                            <div className="grid gap-8 grid-cols-1 lg:grid-cols-2 print:grid-cols-1">
                                {Object.keys(camp.platforms || {}).map(platId => {
                                    const data = camp.platforms[platId];
                                    const currentPlatformSpend = getPlatformSpend(data);
                                    const currentPlatformResults = getPlatformResults(data);
                                    const Icon = PLATFORM_ICONS[platId as keyof typeof PLATFORM_ICONS] || BarChart3;
                                    const engRate = data.impressions > 0 ? ((data.engagement / data.impressions) * 100).toFixed(2) : "0.00";
                                    const cpa = currentPlatformResults > 0 && currentPlatformSpend > 0 ? (currentPlatformSpend / currentPlatformResults).toFixed(2) : null;
                                    const linkedPosts = (camp.linkedItems || []).filter((item: any) => item.platform === platId);

                                    return (
                                        <Card key={platId} className="border-none bg-card/30 backdrop-blur-md shadow-xl overflow-hidden group print:bg-white print:border print:shadow-none">
                                            <CardHeader className={`bg-muted/30 py-6 px-8 transition-colors group-hover:bg-primary/5 print:bg-muted/10 ${isRtl ? 'text-right' : 'text-left'}`}>
                                                <div className={`flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                                                    <div className={`flex items-center gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                                        <div className="p-3 bg-primary/10 rounded-2xl group-hover:scale-110 transition-transform print:scale-100">
                                                            <Icon className="h-6 w-6 text-primary" />
                                                        </div>
                                                        <div className={isRtl ? 'text-right' : 'text-left'}>
                                                            <CardTitle className="text-xl font-black">{PLATFORM_NAMES[platId as keyof typeof PLATFORM_NAMES] || platId}</CardTitle>
                                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t("reports.platform_deep_dive")}</p>
                                                        </div>
                                                    </div>
                                                    {currentPlatformSpend > 0 && <div className="text-[10px] bg-orange-500/20 text-orange-500 border border-orange-500/20 px-3 py-1 rounded-full font-black">{t("reports.ad_active")}</div>}
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-8 space-y-8 print:p-6 print:space-y-4">
                                                {/* Hero Platform Stats - Strategic Scorecard */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="bg-primary/5 rounded-3xl p-6 border border-primary/10 flex items-center justify-between">
                                                        <div>
                                                            <div className="text-[10px] uppercase font-black tracking-widest text-primary/60 mb-1">{isRtl ? 'الأداء الرئيسي' : 'Primary Performance'}</div>
                                                            <div className="text-3xl font-black text-primary">
                                                                {platId === 'google' || platId === 'google_ads' 
                                                                    ? `${(Number(data.clicks) || 0).toLocaleString()}` 
                                                                    : `${(Number(data.engagement) || 0).toLocaleString()}`}
                                                            </div>
                                                            <div className="text-[10px] font-bold opacity-60">
                                                                {platId === 'google' || platId === 'google_ads' ? (isRtl ? 'نقرات إستراتيجية' : 'Strategic Clicks') : (isRtl ? 'تفاعلات نشطة' : 'Active Interactions')}
                                                            </div>
                                                        </div>
                                                        <Zap className="h-8 w-8 text-primary/20 rotate-12" />
                                                    </div>
                                                    
                                                    {data.followers > 0 && (
                                                        <div className="bg-indigo-500/5 rounded-3xl p-6 border border-indigo-500/10 flex items-center justify-between">
                                                            <div>
                                                                <div className="text-[10px] uppercase font-black tracking-widest text-indigo-500/60 mb-1">{isRtl ? 'محرك النمو' : 'Growth Factor'}</div>
                                                                <div className="text-3xl font-black text-indigo-500">+{data.followers.toLocaleString()}</div>
                                                                <div className="text-[10px] font-bold opacity-60">
                                                                    {platId === 'youtube' ? (isRtl ? 'مشترك جديد' : 'New Subscribers') : (isRtl ? 'متابع جديد' : 'New Followers')}
                                                                </div>
                                                            </div>
                                                            <Users className="h-8 w-8 text-indigo-500/20" />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                    {(PLATFORM_METRICS[platId] || []).map((metric, i) => {
                                                        let val = data[metric.id];
                                                        // X (Twitter) special logic for New followers
                                                        if (platId === 'x' && metric.id === 'currentFollowers' && (val !== undefined && val !== null)) {
                                                            let prevVol = 0;
                                                            if (previousMetrics) {
                                                                const prevCamps = previousMetrics.campaigns || [{ platforms: previousMetrics.platforms || {} }];
                                                                prevCamps.forEach((c: any) => {
                                                                    const p = c.platforms?.[platId];
                                                                    if (p) prevVol += (Number(p.currentFollowers) || 0);
                                                                });
                                                            }
                                                            val = Math.max(0, val - prevVol); // Display difference
                                                        }
                                                        if (val === undefined || val === null || (val === 0 && metric.id !== 'currentFollowers')) return null; // Don't show empty metrics
                                                        return (
                                                            <div key={metric.id} className={`p-4 rounded-2xl bg-muted/20 border border-border/50 print:bg-white print:border ${isRtl ? 'text-right' : 'text-left'}`}>
                                                                <div className="text-[10px] font-black uppercase text-muted-foreground mb-1 flex items-center gap-1.5 justify-start">
                                                                    <metric.icon className={`h-3 w-3 ${PLATFORM_COLORS[i % PLATFORM_COLORS.length]}`} />
                                                                    {isRtl ? metric.labelAr : metric.labelEn}
                                                                </div>
                                                                <div className={`text-2xl font-black ${PLATFORM_COLORS[i % PLATFORM_COLORS.length]}`}>{(val || 0).toLocaleString()}{metric.suffix || ''}</div>
                                                            </div>
                                                        );
                                                    })}
                                                    {['tiktok', 'youtube'].includes(platId) && data.watchTime > 0 && PLATFORM_METRICS[platId]?.every(m => m.id !== 'watchTime') && (
                                                        <div className={`p-4 rounded-2xl bg-muted/20 border border-border/50 print:bg-white print:border ${isRtl ? 'text-right' : 'text-left'}`}>
                                                            <div className="text-[10px] font-black uppercase text-muted-foreground mb-1 flex items-center gap-1.5 justify-start">
                                                                <Eye className={`h-3 w-3 text-indigo-500`} />
                                                                {isRtl ? 'وقت المشاهدة' : 'Watch Time'}
                                                            </div>
                                                            <div className={`text-2xl font-black text-indigo-500`}>{(data.watchTime || 0).toLocaleString()}s</div>
                                                        </div>
                                                    )}
                                                </div>

                                                {data.paidCampaigns?.length > 0 && (
                                                    <div className="space-y-4">
                                                        <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                                            <DollarSign className="h-4 w-4 text-orange-500" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{isRtl ? 'تفاصيل الحملات الممولة' : 'Paid Campaign Details'}</span>
                                                        </div>
                                                        <div className="grid gap-4">
                                                            {data.paidCampaigns.map((paidCamp: any, pIdx: number) => (
                                                                <div key={pIdx} className="p-4 rounded-2xl bg-orange-500/5 border border-orange-500/10 space-y-3">
                                                                    <div className={`flex justify-between items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                                                                        <div className="font-bold text-sm text-orange-600">{paidCamp.name}</div>
                                                                        <div className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 uppercase">
                                                                            {isRtl ? (
                                                                                paidCamp.objective === 'AWARENESS' ? 'وعي' :
                                                                                    paidCamp.objective === 'REACH' ? 'وصول' :
                                                                                        paidCamp.objective === 'TRAFFIC' ? 'زيارة' :
                                                                                            paidCamp.objective === 'ENGAGEMENT' ? 'تفاعل' :
                                                                                                paidCamp.objective === 'MESSAGES' ? 'رسايل' :
                                                                                                    paidCamp.objective === 'LEADS' ? 'ليدز' :
                                                                                                        paidCamp.objective === 'CONVERSIONS' ? 'تحويل' : paidCamp.objective
                                                                            ) : paidCamp.objective.toLowerCase()}
                                                                        </div>
                                                                    </div>
                                                                    <div className="grid grid-cols-3 gap-4">
                                                                        <div className={isRtl ? 'text-right' : 'text-left'}>
                                                                            <div className="text-[10px] text-muted-foreground uppercase">{isRtl ? 'الإنفاق' : 'Spend'}</div>
                                                                            <div className="text-sm font-black italic">SAR {paidCamp.spend?.toLocaleString()}</div>
                                                                        </div>
                                                                        <div className={isRtl ? 'text-right' : 'text-left'}>
                                                                            <div className="text-[10px] text-muted-foreground uppercase">{isRtl ? 'الوصول' : 'Reach'}</div>
                                                                            <div className="text-sm font-black italic">{paidCamp.reach?.toLocaleString()}</div>
                                                                        </div>
                                                                        <div className={isRtl ? 'text-right' : 'text-left'}>
                                                                            <div className="text-[10px] text-muted-foreground uppercase">
                                                                                {paidCamp.objective === 'MESSAGES' ? (isRtl ? 'رسايل' : 'Msgs') :
                                                                                    paidCamp.objective === 'LEADS' ? (isRtl ? 'ليدز' : 'Leads') :
                                                                                        (isRtl ? 'نتايج' : 'Results')}
                                                                            </div>
                                                                            <div className="text-sm font-black italic">{paidCamp.results?.toLocaleString()}</div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {linkedPosts.length > 0 && (
                                                    <div className="space-y-4">
                                                        <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                                            <ImageIcon className="h-4 w-4 text-primary/60" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Featured Content</span>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            {linkedPosts.map((post: any) => (
                                                                <div key={post.id} className="group/post relative aspect-square rounded-2xl overflow-hidden border border-white/10 bg-white/5">
                                                                    {post.imageUrl ? (
                                                                        <div className="w-full h-full relative flex items-center justify-center bg-black/40">
                                                                            <img src={post.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover blur-lg opacity-30 scale-110" />
                                                                            <img src={post.imageUrl} alt="" className="relative z-10 w-full h-full object-contain transition-transform group-hover/post:scale-105" />
                                                                            <a
                                                                                href={post.imageUrl}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className={`absolute bottom-2 ${isRtl ? 'left-2' : 'right-2'} p-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/20 text-white/80 hover:text-white hover:bg-black/80 transition-all opacity-0 group-hover/post:opacity-100 z-20 flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest`}
                                                                            >
                                                                                <ExternalLink className="h-2.5 w-2.5" />
                                                                                {isRtl ? 'فتح' : 'Open'}
                                                                            </a>
                                                                        </div>
                                                                    ) : post.videoUrl ? (
                                                                        <div className="w-full h-full relative bg-black/40">
                                                                            <video
                                                                                src={post.videoUrl}
                                                                                className="w-full h-full object-contain"
                                                                                controls
                                                                                preload="metadata"
                                                                            />
                                                                            <a
                                                                                href={post.videoUrl}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className={`absolute bottom-10 ${isRtl ? 'left-2' : 'right-2'} p-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/20 text-white/80 hover:text-white hover:bg-black/80 transition-all opacity-0 group-hover/post:opacity-100 z-20 flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest`}
                                                                            >
                                                                                <ExternalLink className="h-2.5 w-2.5" />
                                                                                {isRtl ? 'فتح' : 'Open'}
                                                                            </a>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="w-full h-full p-4 text-[10px] italic text-muted-foreground overflow-hidden">
                                                                            {post.captionEn || post.captionAr}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-dashed">
                                                    <div className={`p-4 rounded-2xl bg-primary/5 border border-primary/10 ${isRtl ? 'text-right' : 'text-left'}`}>
                                                        <div className="text-[10px] font-black uppercase text-primary mb-1">{isRtl ? 'نسبة التفاعل' : 'Eng. Rate'}</div>
                                                        <div className="text-xl font-black text-primary">{engRate}%</div>
                                                    </div>
                                                    {cpa && (
                                                        <div className={`p-4 rounded-2xl bg-orange-500/5 border border-orange-500/10 ${isRtl ? 'text-right' : 'text-left'}`}>
                                                            <div className="text-[10px] font-black uppercase text-orange-500 mb-1">{isRtl ? 'تكلفة التحويل' : 'Cost / Conv'}</div>
                                                            <div className="text-xl font-black text-orange-500">SAR {cpa}</div>
                                                        </div>
                                                    )}
                                                </div>

                                                {data.comment && (
                                                    <div className={`p-4 rounded-xl bg-primary/5 border border-primary/15 ${isRtl ? 'text-right' : 'text-left'}`}>
                                                        <div className={`flex items-center gap-2 mb-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                                            <MessageSquare className="h-3.5 w-3.5 text-primary" />
                                                            <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                                                                {isRtl ? 'تعليق مدير الحساب' : 'Account Manager Note'}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-foreground/80 leading-relaxed">{data.comment}</p>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Email Marketing Section */}
            {hasEmail && (
                <div className="space-y-8">
                    <h2 className={`text-3xl font-black border-primary py-2 uppercase tracking-tighter ${isRtl ? 'border-r-8 pr-6 text-right' : 'border-l-8 pl-6 text-left'}`}>{t("reports.email_analysis")}</h2>

                    {/* Email Summary Totals */}
                    <div className={`grid gap-4 grid-cols-2 md:grid-cols-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <Card className="bg-rose-500/5 border-none shadow-none">
                            <CardHeader className={`pb-2 ${isRtl ? 'text-right' : 'text-left'}`}><CardTitle className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">{t("reports.total_broadcasts")}</CardTitle></CardHeader>
                            <CardContent className={isRtl ? 'text-right' : 'text-left'}>
                                <div className="text-2xl md:text-4xl font-black italic text-rose-500">{emailTotals.emailsSent.toLocaleString()}</div>
                                <div className="text-[10px] text-rose-500 font-bold mt-2">{t("reports.emails_dispatched")}</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-emerald-500/5 border-none shadow-none">
                            <CardHeader className={`pb-2 ${isRtl ? 'text-right' : 'text-left'}`}><CardTitle className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">{t("reports.open_velocity")}</CardTitle></CardHeader>
                            <CardContent className={isRtl ? 'text-right' : 'text-left'}>
                                <div className="text-2xl md:text-4xl font-black italic text-emerald-500">{emailTotals.openRate.toFixed(1)}%</div>
                                <div className="text-[10px] text-emerald-500 font-bold mt-2">{isRtl ? 'متوسط معدل الفتح' : 'Avg. Open Rate'}</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-blue-500/5 border-none shadow-none">
                            <CardHeader className={`pb-2 ${isRtl ? 'text-right' : 'text-left'}`}><CardTitle className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">{t("reports.click_confidence")}</CardTitle></CardHeader>
                            <CardContent className={isRtl ? 'text-right' : 'text-left'}>
                                <div className="text-2xl md:text-4xl font-black italic text-blue-500">{emailTotals.clickRate.toFixed(1)}%</div>
                                <div className="text-[10px] text-blue-500 font-bold mt-2">{isRtl ? 'متوسط معدل النقر' : 'Avg. Click Rate'}</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Per-Campaign Breakdown */}
                    {emailCampaigns.length > 1 && (
                        <div className="space-y-4">
                            <h3 className={`text-sm font-black uppercase tracking-widest text-muted-foreground ${isRtl ? 'text-right' : ''}`}>{isRtl ? 'تفاصيل الحملات' : 'Campaign Breakdown'}</h3>
                            <div className="grid gap-4">
                                {emailCampaigns.map((camp: any, idx: number) => (
                                    <Card key={idx} className="border-none bg-card/30 backdrop-blur-md overflow-hidden">
                                        <CardHeader className={`bg-rose-500/5 border-b border-white/5 py-4 px-6 flex flex-row items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                            <Mail className="h-4 w-4 text-rose-400" />
                                            <CardTitle className="text-sm font-black">{camp.name || `${isRtl ? 'حملة' : 'Campaign'} ${idx + 1}`}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {camp.emailsSent > 0 && (
                                                <div className={`p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 ${isRtl ? 'text-right' : ''}`}>
                                                    <div className="text-[10px] font-black uppercase text-rose-500 mb-1">{isRtl ? 'مرسلة' : 'Sent'}</div>
                                                    <div className="text-xl font-black">{Number(camp.emailsSent).toLocaleString()}</div>
                                                </div>
                                            )}
                                            {camp.openRate > 0 && (
                                                <div className={`p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 ${isRtl ? 'text-right' : ''}`}>
                                                    <div className="text-[10px] font-black uppercase text-emerald-500 mb-1">{isRtl ? 'معدل الفتح' : 'Open Rate'}</div>
                                                    <div className="text-xl font-black text-emerald-500">{camp.openRate}%</div>
                                                    <div className="w-full h-1.5 bg-emerald-100/20 rounded-full mt-2"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${camp.openRate}%` }} /></div>
                                                </div>
                                            )}
                                            {camp.clickRate > 0 && (
                                                <div className={`p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 ${isRtl ? 'text-right' : ''}`}>
                                                    <div className="text-[10px] font-black uppercase text-blue-500 mb-1">{isRtl ? 'معدل النقر' : 'Click Rate'}</div>
                                                    <div className="text-xl font-black text-blue-500">{camp.clickRate}%</div>
                                                    <div className="w-full h-1.5 bg-blue-100/20 rounded-full mt-2"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${camp.clickRate}%` }} /></div>
                                                </div>
                                            )}
                                            {camp.unsubscribes > 0 && (
                                                <div className={`p-4 rounded-2xl bg-muted/20 border border-border/30 ${isRtl ? 'text-right' : ''}`}>
                                                    <div className="text-[10px] font-black uppercase text-muted-foreground mb-1">{isRtl ? 'إلغاء اشتراك' : 'Unsubscribes'}</div>
                                                    <div className="text-xl font-black">{camp.unsubscribes}</div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* SEO Section */}
            {hasSeo && (
            <div className="space-y-8">
                <h2 className={`text-3xl font-black border-primary py-2 uppercase tracking-tighter ${isRtl ? 'border-r-8 pr-6 text-right' : 'border-l-8 pl-6 text-left'}`}>{t("dashboard.search_authority")}</h2>
                <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="bg-purple-500/5 py-6 px-10">
                        <div className={`flex items-center gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <Globe className="h-6 w-6 text-purple-500" />
                            <CardTitle className="text-2xl font-black">{t("reports.seo_title")}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-10 grid md:grid-cols-2 gap-12">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className={`p-6 bg-purple-500/5 rounded-2xl border border-purple-500/10 ${isRtl ? 'text-right' : ''}`}>
                                <h4 className="text-xs font-black text-purple-600 uppercase mb-2 tracking-widest">{isRtl ? 'النقرات' : 'Clicks'}</h4>
                                <p className="text-2xl font-black italic">{metrics.seo?.clicks?.toLocaleString() || 0}</p>
                            </div>
                            <div className={`p-6 bg-blue-500/5 rounded-2xl border border-blue-500/10 ${isRtl ? 'text-right' : ''}`}>
                                <h4 className="text-xs font-black text-blue-600 uppercase mb-2 tracking-widest">{isRtl ? 'مرات الظهور' : 'Impressions'}</h4>
                                <p className="text-2xl font-black">{metrics.seo?.impressions?.toLocaleString() || 0}</p>
                            </div>
                            <div className={`p-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 sm:col-span-2 ${isRtl ? 'text-right' : ''}`}>
                                <h4 className="text-xs font-black text-emerald-600 uppercase mb-2 tracking-widest">{isRtl ? 'سرعة الصفحة' : 'Page Speed'}</h4>
                                <p className="text-2xl font-black">{metrics.seo?.speed || 0}</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-center justify-center p-10 bg-muted/20 rounded-3xl relative overflow-hidden ring-1 ring-white/5 shadow-inner">
                            <div className="text-xs font-black uppercase text-muted-foreground mb-4 tracking-[0.3em]">{t("dashboard.authority_score")}</div>
                            <div className="text-8xl font-black text-primary z-10 drop-shadow-2xl">{metrics.seo?.score || 0}</div>
                            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03]">
                                <TrendingUp className="h-64 w-64" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            )}

            <div className="text-center py-20 opacity-20 print:block hidden font-bold uppercase tracking-widest text-xs">
                {t("dashboard.performance_portfolio_generated")}
            </div>

            {/* Client Feedback Section */}
            <div className={`print:hidden space-y-4 border border-white/10 rounded-3xl p-6 bg-card/30 backdrop-blur-md ${isRtl ? 'text-right' : 'text-left'}`}>
                <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <h3 className="font-black text-lg">{isRtl ? 'ملاحظاتك على التقرير' : 'Your Feedback on This Report'}</h3>
                </div>
                {/* AM sees client feedback if submitted */}
                {role !== 'CLIENT' && report.clientFeedback && (
                    <div className={`p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{isRtl ? 'ملاحظة العميل' : "Client's Feedback"}</p>
                        <p className="text-sm font-medium">{report.clientFeedback}</p>
                    </div>
                )}
                {role !== 'CLIENT' && !report.clientFeedback && (
                    <p className="text-sm text-muted-foreground">{isRtl ? 'لم يترك العميل أي ملاحظات بعد.' : 'No client feedback yet.'}</p>
                )}
                {role === 'CLIENT' && (
                    feedbackSent ? (
                        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                            <p className="text-sm font-bold text-emerald-500">{isRtl ? '✓ تم إرسال ملاحظاتك بنجاح!' : '✓ Your feedback was submitted successfully!'}</p>
                            {feedback && <p className="text-sm text-muted-foreground mt-1">{feedback}</p>}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <textarea
                                className={`flex w-full rounded-2xl border border-white/10 bg-background/50 p-4 text-sm font-medium shadow-inner focus:border-primary/50 outline-none placeholder:text-muted-foreground/40 min-h-[100px] ${isRtl ? 'text-right' : ''}`}
                                placeholder={isRtl ? 'شاركنا رأيك بالتقرير، ما أعجبك وما تودّ تطويره...' : 'Share your thoughts on this report — what you liked, what could be improved...'}
                                value={feedback}
                                onChange={e => setFeedback(e.target.value)}
                                dir={isRtl ? 'rtl' : 'ltr'}
                            />
                            <Button
                                disabled={!feedback.trim() || isSendingFeedback}
                                onClick={async () => {
                                    setIsSendingFeedback(true);
                                    try {
                                        await submitReportFeedback(report.id, feedback);
                                        setFeedbackSent(true);
                                        toast.success(isRtl ? 'تم إرسال ملاحظاتك!' : 'Feedback submitted!');
                                    } catch { toast.error('Failed to submit feedback'); }
                                    finally { setIsSendingFeedback(false); }
                                }}
                                className="rounded-full font-bold"
                            >
                                {isSendingFeedback ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                                {isRtl ? 'إرسال الملاحظة' : 'Submit Feedback'}
                            </Button>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
