"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, Facebook, Instagram, Video, Share2, Linkedin, Search, Youtube, TrendingUp, DollarSign, Target, Globe, BarChart3, Send, Mail, Trash2, Download, Loader2, MousePointer2, Zap, MessageSquare, Image as ImageIcon } from "lucide-react";
import { Bar, BarChart, Pie, PieChart, Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { publishReport, requestReportDeletion } from "@/app/actions/report";
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
};

const PLATFORM_NAMES = {
    facebook: "Facebook",
    instagram: "Instagram",
    tiktok: "TikTok",
    snapchat: "Snapchat",
    linkedin: "LinkedIn",
    google: "Google Ads",
    youtube: "YouTube",
    google_ads: "Google Ads"
};

export function ReportClientView({ report, metrics, role }: { report: any, metrics: any, role: string }) {
    const { t, isRtl } = useLanguage();
    const [isPublishing, setIsPublishing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [status, setStatus] = useState(report.status);
    const [isDeletionRequested, setIsDeletionRequested] = useState(false);

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
            await publishReport(report.id);
            setStatus("SENT");
            toast.success(t("dashboard.publish"));
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

    const activePlatforms = Object.keys(aggregatedPlatforms).filter(key => {
        const p = aggregatedPlatforms[key];
        return (p.impressions || 0) > 0 || (p.followers || 0) > 0 || (p.engagement || 0) > 0 || (p.views || 0) > 0 || (p.paidReach || 0) > 0;
    });

    // Calculate Global Totals from aggregated data
    const globalTotals = {
        impressions: activePlatforms.reduce((acc, key) => acc + (Number(aggregatedPlatforms[key].impressions) || 0), 0),
        engagement: activePlatforms.reduce((acc, key) => acc + (Number(aggregatedPlatforms[key].engagement) || 0), 0),
        followers: activePlatforms.reduce((acc, key) => acc + (Number(aggregatedPlatforms[key].followers) || 0), 0),
        conversions: activePlatforms.reduce((acc, key) => acc + (Number(aggregatedPlatforms[key].conversions) || 0), 0),
        spend: activePlatforms.reduce((acc, key) => acc + (Number(aggregatedPlatforms[key].spend) || 0), 0),
        paidReach: activePlatforms.reduce((acc, key) => acc + (Number(aggregatedPlatforms[key].paidReach) || 0), 0),
        views: activePlatforms.reduce((acc, key) => acc + (Number(aggregatedPlatforms[key].views) || 0), 0),
    };

    const hasViews = globalTotals.views > 0;
    const hasPaidReach = globalTotals.paidReach > 0;
    const hasConversions = globalTotals.conversions > 0;
    const hasSpend = globalTotals.spend > 0;

    const chartData = activePlatforms.map(key => ({
        name: PLATFORM_NAMES[key as keyof typeof PLATFORM_NAMES] || key,
        impressions: aggregatedPlatforms[key].impressions || 0,
        engagement: aggregatedPlatforms[key].engagement || 0,
        followers: aggregatedPlatforms[key].followers || 0,
        views: aggregatedPlatforms[key].views || 0,
        spend: aggregatedPlatforms[key].spend || 0,
        paidReach: aggregatedPlatforms[key].paidReach || 0,
        conversions: aggregatedPlatforms[key].conversions || 0,
    }));

    const platformChartData = chartData.filter(d =>
        (d.impressions > 0 || d.followers > 0 || d.engagement > 0 || d.views > 0) &&
        !['google', 'youtube', 'google_ads'].includes(d.name.toLowerCase().replace(' ', '_'))
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
                            <Send className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} /> {isPublishing ? t("dashboard.publishing") : t("dashboard.publish")}
                        </Button>
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
            <div className={`grid gap-4 grid-cols-2 md:grid-cols-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                {[
                    { label: t("reports.impressions"), value: globalTotals.impressions, color: 'bg-primary/5', valueColor: '', sub: t("common.combined"), subColor: 'text-emerald-500', icon: <TrendingUp className="h-3 w-3" /> },
                    { label: t("reports.engagements"), value: globalTotals.engagement, color: 'bg-blue-500/5', valueColor: '', sub: t("reports.interactions"), subColor: 'text-blue-500', icon: null },
                    { label: t("reports.growth"), value: globalTotals.followers, color: 'bg-purple-500/5', valueColor: '', sub: t("reports.new_followers"), subColor: 'text-purple-500', icon: null },
                    { label: t("reports.investment"), value: null, rawValue: `SAR ${(globalTotals.spend).toLocaleString()}`, color: 'bg-orange-500/5', valueColor: '', sub: t("reports.paid_media"), subColor: 'text-orange-500', icon: <DollarSign className="h-3 w-3" /> },
                ].map((card) => (
                    <Card key={card.label} className={`${card.color} border-none shadow-none backdrop-blur-md`}>
                        <CardHeader className={`pb-2 ${isRtl ? 'text-right' : 'text-left'}`}>
                            <CardTitle className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">{card.label}</CardTitle>
                        </CardHeader>
                        <CardContent className={isRtl ? 'text-right' : 'text-left'}>
                            <div className="text-2xl md:text-4xl font-black italic">{card.rawValue ?? (card.value || 0).toLocaleString()}</div>
                            <div className={`text-[10px] font-bold mt-2 flex items-center gap-1 ${card.subColor} ${isRtl ? 'flex-row-reverse' : ''}`}>
                                {card.icon}{card.sub}
                            </div>
                        </CardContent>
                    </Card>
                ))}
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

            {/* Global Reach Graph */}
            <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm p-4 md:p-10">
                <CardHeader className={`px-0 pt-0 ${isRtl ? 'text-right' : ''}`}>
                    <CardTitle className="text-2xl font-black">{t("reports.performance_dist")}</CardTitle>
                    <p className="text-sm text-muted-foreground">{t("reports.compare_metrics")}</p>
                </CardHeader>
                <CardContent className="h-[300px] md:h-[400px] w-full pt-10 px-0">
                    <div dir="ltr">
                        <ResponsiveContainer width="100%" height={340}>
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" fontSize={12} fontWeight="700" tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(15,15,25,0.95)', backdropFilter: 'blur(10px)', color: '#fff' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Bar dataKey="impressions" name={t("reports.impressions")} fill="#3b82f6" radius={[10, 10, 0, 0]} barSize={40} />
                                <Bar dataKey="engagement" name={t("reports.interactions")} fill="#10b981" radius={[10, 10, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Two-column charts: Pie + Followers Bar */}
            {platformChartData.length > 0 && (
                <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                    {/* Impressions Distribution Pie */}
                    <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm p-4 md:p-6">
                        <CardHeader className={`px-0 pt-0 ${isRtl ? 'text-right' : ''}`}>
                            <CardTitle className="text-xl font-black">{isRtl ? `توزيع ${t('reports.impressions')}` : `${t('reports.impressions')} Distribution`}</CardTitle>
                            <p className="text-sm text-muted-foreground">{isRtl ? 'حسب كل منصة' : 'Breakdown by platform'}</p>
                        </CardHeader>
                        <CardContent className="h-[280px] px-0">
                            <div dir="ltr">
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie data={platformChartData} dataKey="impressions" nameKey="name" cx="50%" cy="45%" outerRadius={85} innerRadius={45} paddingAngle={3}
                                            label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`} labelLine={false}>
                                            {platformChartData.map((_, index) => (<Cell key={index} fill={["#3b82f6", "#10b981", "#f97316", "#a855f7", "#ef4444", "#eab308", "#06b6d4"][index % 7]} />))}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(15,15,25,0.95)', color: '#fff' }} formatter={(v: any) => [v?.toLocaleString(), t("reports.impressions")]} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Followers horizontal bar */}
                    <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm p-4 md:p-6">
                        <CardHeader className={`px-0 pt-0 ${isRtl ? 'text-right' : ''}`}>
                            <CardTitle className="text-xl font-black">{isRtl ? 'متابعون جدد' : 'New Followers'}</CardTitle>
                            <p className="text-sm text-muted-foreground">{isRtl ? 'النمو لكل منصة هذه الفترة' : 'Growth per platform this period'}</p>
                        </CardHeader>
                        <CardContent className="h-[280px] px-0">
                            <div dir="ltr">
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={platformChartData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                                        <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} />
                                        <YAxis dataKey="name" type="category" fontSize={11} tickLine={false} axisLine={false} width={70} />
                                        <Tooltip contentStyle={{ borderRadius: '16px', background: 'rgba(15,15,25,0.95)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }} formatter={(v: any) => [v?.toLocaleString(), t("reports.growth")]} />
                                        <Bar dataKey="followers" name={isRtl ? "متابعون جدد" : t("reports.new_followers")} radius={[0, 8, 8, 0]} barSize={22}>
                                            {platformChartData.map((_, i) => (<Cell key={i} fill={["#a855f7", "#3b82f6", "#10b981", "#f97316", "#ef4444", "#eab308", "#06b6d4"][i % 7]} />))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Spend Distribution — only when spend data exists */}
                    {hasSpend && (
                        <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm p-4 md:p-6">
                            <CardHeader className={`px-0 pt-0 ${isRtl ? 'text-right' : ''}`}>
                                <CardTitle className="text-xl font-black">{t("reports.spend_dist")}</CardTitle>
                                <p className="text-sm text-muted-foreground">{t("reports.spend_dist_sub")}</p>
                            </CardHeader>
                            <CardContent className="h-[280px] px-0">
                                <div dir="ltr">
                                    <ResponsiveContainer width="100%" height={280}>
                                        <PieChart>
                                            <Pie data={spendData} dataKey="spend" nameKey="name" cx="50%" cy="45%" outerRadius={85} innerRadius={45} paddingAngle={3}
                                                label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`} labelLine={false}>
                                                {spendData.map((_, i) => (<Cell key={i} fill={["#f97316", "#ef4444", "#eab308", "#3b82f6", "#a855f7", "#10b981", "#06b6d4"][i % 7]} />))}
                                            </Pie>
                                            <Tooltip contentStyle={{ borderRadius: '16px', background: 'rgba(15,15,25,0.95)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }} formatter={(v: any) => [`$${v?.toLocaleString()}`, t("reports.investment")]} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Video Views bar — only when views data exists */}
                    {hasViews && (
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
                                            <Tooltip contentStyle={{ borderRadius: '16px', background: 'rgba(15,15,25,0.95)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }} formatter={(v: any) => [v?.toLocaleString(), t("common.views")]} />
                                            <Bar dataKey="views" name={t("common.views")} radius={[0, 8, 8, 0]} barSize={22} fill="#ec4899">
                                                {chartData.filter(d => d.views > 0).map((_, i) => (<Cell key={i} fill={["#ec4899", "#f97316", "#06b6d4", "#8b5cf6"][i % 4]} />))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* === Paid Ads Dedicated Section === */}
            {hasSpend && (() => {
                const paidPlatforms = activePlatforms.filter(k => (aggregatedPlatforms[k].spend || 0) > 0);
                return (
                    <div className="space-y-6">
                        <div className={`flex items-center gap-4 ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}>
                            <div className="p-3 bg-orange-500/10 rounded-2xl">
                                <DollarSign className="h-6 w-6 text-orange-500" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black tracking-tighter">
                                    {isRtl ? 'الإعلانات المدفوعة' : 'Paid Advertising'}
                                </h2>
                                <p className="text-sm text-muted-foreground font-medium">
                                    {isRtl ? 'أداء الحملات الإعلانية المدفوعة عبر المنصات' : 'Performance across all active paid campaigns'}
                                </p>
                            </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {paidPlatforms.map(key => {
                                const d = aggregatedPlatforms[key];
                                const cpa = d.conversions > 0 && d.spend > 0 ? (d.spend / d.conversions).toFixed(2) : null;
                                const Icon = PLATFORM_ICONS[key as keyof typeof PLATFORM_ICONS] || BarChart3;
                                return (
                                    <div key={key} className="p-6 rounded-3xl bg-orange-500/5 border border-orange-500/15 space-y-4">
                                        <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                            <Icon className="h-5 w-5 text-orange-500" />
                                            <span className="font-black text-base">{PLATFORM_NAMES[key as keyof typeof PLATFORM_NAMES] || key}</span>
                                        </div>

                                        {d.paidCampaigns?.length > 0 ? (
                                            <div className="space-y-4 pt-2">
                                                {d.paidCampaigns.map((camp: any, idx: number) => (
                                                    <div key={idx} className="p-4 rounded-2xl bg-background/40 border border-white/5 space-y-2">
                                                        <div className={`flex justify-between items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                                                            <div className="font-bold text-xs">{camp.name}</div>
                                                            <div className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 uppercase">
                                                                {isRtl ? (
                                                                    camp.objective === 'AWARENESS' ? 'وعي' :
                                                                        camp.objective === 'REACH' ? 'وصول' :
                                                                            camp.objective === 'TRAFFIC' ? 'زيارة' :
                                                                                camp.objective === 'ENGAGEMENT' ? 'تفاعل' :
                                                                                    camp.objective === 'MESSAGES' ? 'رسايل' :
                                                                                        camp.objective === 'LEADS' ? 'ليدز' :
                                                                                            camp.objective === 'CONVERSIONS' ? 'تحويل' : camp.objective
                                                                ) : camp.objective.toLowerCase()}
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-3 gap-2">
                                                            <div className={isRtl ? 'text-right' : 'text-left'}>
                                                                <div className="text-[9px] text-muted-foreground uppercase">{isRtl ? 'صرف' : 'Spend'}</div>
                                                                <div className="text-xs font-black">SAR {camp.spend?.toLocaleString()}</div>
                                                            </div>
                                                            <div className={isRtl ? 'text-right' : 'text-left'}>
                                                                <div className="text-[9px] text-muted-foreground uppercase">{isRtl ? 'وصول' : 'Reach'}</div>
                                                                <div className="text-xs font-black">{camp.reach?.toLocaleString()}</div>
                                                            </div>
                                                            <div className={isRtl ? 'text-right' : 'text-left'}>
                                                                <div className="text-[9px] text-muted-foreground uppercase">
                                                                    {camp.objective === 'MESSAGES' ? (isRtl ? 'رسايل' : 'Msgs') :
                                                                        camp.objective === 'LEADS' ? (isRtl ? 'ليدز' : 'Leads') :
                                                                            (isRtl ? 'نتايج' : 'Results')}
                                                                </div>
                                                                <div className="text-xs font-black">{camp.results?.toLocaleString()}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className={`flex justify-between items-center px-2 py-1 bg-orange-500/10 rounded-lg ${isRtl ? 'flex-row-reverse' : ''}`}>
                                                    <span className="text-[10px] font-black uppercase text-orange-500">{isRtl ? 'إجمالي المنصة' : 'Platform Total'}</span>
                                                    <span className="text-xs font-black text-orange-500">SAR {(d.paidCampaigns.reduce((acc: number, c: any) => acc + (Number(c.spend) || 0), 0)).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="p-3 bg-background/50 rounded-xl">
                                                    <div className="text-[10px] font-black uppercase text-orange-500 mb-1">{isRtl ? 'الإنفاق' : 'Spend'}</div>
                                                    <div className="text-xl font-black">SAR {(d.spend || 0).toLocaleString()}</div>
                                                </div>
                                                {d.paidReach > 0 && <div className="p-3 bg-background/50 rounded-xl">
                                                    <div className="text-[10px] font-black uppercase text-muted-foreground mb-1">{isRtl ? 'الوصول المدفوع' : 'Paid Reach'}</div>
                                                    <div className="text-xl font-black">{(d.paidReach || 0).toLocaleString()}</div>
                                                </div>}
                                                {d.conversions > 0 && <div className="p-3 bg-background/50 rounded-xl">
                                                    <div className="text-[10px] font-black uppercase text-muted-foreground mb-1">{isRtl ? 'تحويلات' : 'Conversions'}</div>
                                                    <div className="text-xl font-black">{d.conversions}</div>
                                                </div>}
                                                {cpa && <div className="p-3 bg-background/50 rounded-xl">
                                                    <div className="text-[10px] font-black uppercase text-orange-500 mb-1">{isRtl ? 'تكلفة التحويل' : 'Cost/Conv.'}</div>
                                                    <div className="text-xl font-black text-orange-500">SAR {cpa}</div>
                                                </div>}
                                                {d.clicks > 0 && <div className="p-3 bg-background/50 rounded-xl">
                                                    <div className="text-[10px] font-black uppercase text-muted-foreground mb-1">{isRtl ? 'النقرات' : 'Clicks'}</div>
                                                    <div className="text-xl font-black">{(d.clicks || 0).toLocaleString()}</div>
                                                </div>}
                                                {d.cpc > 0 && <div className="p-3 bg-background/50 rounded-xl">
                                                    <div className="text-[10px] font-black uppercase text-muted-foreground mb-1">CPC</div>
                                                    <div className="text-xl font-black">SAR {d.cpc}</div>
                                                </div>}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })()}

            {/* Individual Platform Deep Dives */}
            <div className="space-y-16 print:space-y-8">
                <h2 className={`text-3xl font-black border-primary py-2 uppercase tracking-tighter print:text-2xl ${isRtl ? 'border-r-8 pr-6 text-right' : 'border-l-8 pl-6 text-left'}`}>{t("reports.platform_analysis")}</h2>
                <div className="space-y-16">
                    {campaigns.map((camp: any) => (
                        <div key={camp.id} className="space-y-8">
                            <div className={`flex items-center gap-4 border-b-2 border-primary/20 pb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <div className="h-10 w-2 bg-primary rounded-full" />
                                <h3 className="text-2xl font-black tracking-tight">{camp.name}</h3>
                            </div>

                            <div className="grid gap-8 grid-cols-1 lg:grid-cols-2 print:grid-cols-1">
                                {Object.keys(camp.platforms || {}).map(platId => {
                                    const data = camp.platforms[platId];
                                    const Icon = PLATFORM_ICONS[platId as keyof typeof PLATFORM_ICONS] || BarChart3;
                                    const engRate = data.impressions > 0 ? ((data.engagement / data.impressions) * 100).toFixed(2) : "0.00";
                                    const cpa = data.conversions > 0 && data.spend > 0 ? (data.spend / data.conversions).toFixed(2) : null;
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
                                                    {data.spend > 0 && <div className="text-[10px] bg-orange-500/20 text-orange-500 border border-orange-500/20 px-3 py-1 rounded-full font-black">{t("reports.ad_active")}</div>}
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-8 space-y-8 print:p-6 print:space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    {[
                                                        { label: t('reports.impressions'), value: data.impressions, color: 'text-blue-500' },
                                                        { label: t('reports.engagements'), value: data.engagement, color: 'text-emerald-500' },
                                                        { label: t('reports.growth'), value: data.followers, color: 'text-purple-500' },
                                                        { label: t('common.views'), value: data.views, color: 'text-pink-500' },
                                                        { label: isRtl ? 'الحفظ والمشاركة' : 'Saves / Shares', value: (data.saves || 0) + (data.shares || 0), color: 'text-orange-500' },
                                                        { label: isRtl ? 'وقت المشاهدة' : 'Watch Time', value: data.watchTime, suffix: 's', color: 'text-indigo-500' },
                                                        { label: t('reports.paid_reach'), value: data.paidReach, color: 'text-teal-500' },
                                                        { label: t('reports.conversions'), value: data.conversions, color: 'text-rose-500' },
                                                    ].map((item, i) => (item.value || 0) > 0 ? (
                                                        <div key={i} className={`p-4 rounded-2xl bg-muted/20 border border-border/50 print:bg-white print:border ${isRtl ? 'text-right' : 'text-left'}`}>
                                                            <div className="text-[10px] font-black uppercase text-muted-foreground mb-1">{item.label}</div>
                                                            <div className={`text-2xl font-black ${item.color}`}>{(item.value || 0).toLocaleString()}{item.suffix || ''}</div>
                                                        </div>
                                                    ) : null)}
                                                </div>

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
                                                                        <img src={post.imageUrl} alt="" className="w-full h-full object-cover transition-transform group-hover/post:scale-110" />
                                                                    ) : post.videoUrl ? (
                                                                        <video
                                                                            src={post.videoUrl}
                                                                            className="w-full h-full object-cover"
                                                                            controls
                                                                            preload="metadata"
                                                                        />
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
            {metrics.emailMarketing?.emailsSent > 0 && (
                <div className="space-y-8">
                    <h2 className={`text-3xl font-black border-primary py-2 uppercase tracking-tighter ${isRtl ? 'border-r-8 pr-6 text-right' : 'border-l-8 pl-6 text-left'}`}>{t("reports.email_analysis")}</h2>
                    <Card className="border-none bg-emerald-500/5 backdrop-blur-md shadow-xl overflow-hidden">
                        <CardHeader className="bg-emerald-500/10 py-6 px-10">
                            <div className={`flex items-center gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <Mail className="h-6 w-6 text-emerald-600" />
                                <CardTitle className="text-2xl font-black">{t("reports.pipeline")}</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-10 grid md:grid-cols-3 gap-8">
                            <div className={`text-center ${isRtl ? 'md:text-right' : 'md:text-left'}`}>
                                <p className="text-sm font-black text-muted-foreground uppercase mb-2">{t("reports.total_broadcasts")}</p>
                                <div className="text-5xl font-black">{metrics.emailMarketing.emailsSent.toLocaleString()}</div>
                                <p className="text-[10px] font-bold text-emerald-600 mt-2">{t("reports.emails_dispatched")}</p>
                            </div>
                            <div className={`text-center ${isRtl ? 'md:text-right' : 'md:text-left'}`}>
                                <p className="text-sm font-black text-muted-foreground uppercase mb-2">{t("reports.open_velocity")}</p>
                                <div className="text-5xl font-black text-emerald-600">{metrics.emailMarketing.openRate}%</div>
                                <div className="w-full h-2 bg-emerald-100 rounded-full mt-4 overflow-hidden">
                                    <div className={`h-full bg-emerald-500 ${isRtl ? 'float-right' : ''}`} style={{ width: `${metrics.emailMarketing.openRate}%` }} />
                                </div>
                            </div>
                            <div className={`text-center ${isRtl ? 'md:text-right' : 'md:text-left'}`}>
                                <p className="text-sm font-black text-muted-foreground uppercase mb-2">{t("reports.click_confidence")}</p>
                                <div className="text-5xl font-black text-blue-600">{metrics.emailMarketing.clickRate}%</div>
                                <div className="w-full h-2 bg-blue-100 rounded-full mt-4 overflow-hidden">
                                    <div className={`h-full bg-blue-500 ${isRtl ? 'float-right' : ''}`} style={{ width: `${metrics.emailMarketing.clickRate}%` }} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* SEO Section */}
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
                                <h4 className="text-xs font-black text-purple-600 uppercase mb-2 tracking-widest">{t("dashboard.primary_keyword")}</h4>
                                <p className="text-2xl font-black italic">"{metrics.seo?.rank || t("dashboard.authority_growth")}"</p>
                            </div>
                            <div className={`p-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 ${isRtl ? 'text-right' : ''}`}>
                                <h4 className="text-xs font-black text-emerald-600 uppercase mb-2 tracking-widest">{isRtl ? 'سرعة الصفحة' : 'Page Speed'}</h4>
                                <p className="text-2xl font-black">{metrics.seo?.speed || 0}%</p>
                            </div>
                            <div className={`p-6 bg-blue-500/5 rounded-2xl border border-blue-500/10 ${isRtl ? 'text-right' : ''}`}>
                                <h4 className="text-xs font-black text-blue-600 uppercase mb-2 tracking-widest">{isRtl ? 'جاهزية الجوال' : 'Mobile Ready'}</h4>
                                <p className="text-2xl font-black">{metrics.seo?.mobile || 0}%</p>
                            </div>
                            <div className={`p-6 bg-muted/10 rounded-2xl border border-border ${isRtl ? 'text-right' : ''}`}>
                                <h4 className="text-xs font-black text-muted-foreground uppercase mb-2 tracking-widest">{t("reports.technical_performance")}</h4>
                                <p className="text-xs font-bold leading-tight">{metrics.seo?.notes || t("dashboard.seo_notes")}</p>
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

            <div className="text-center py-20 opacity-20 print:block hidden font-bold uppercase tracking-widest text-xs">
                {t("dashboard.performance_portfolio_generated")}
            </div>
        </div>
    );
}
