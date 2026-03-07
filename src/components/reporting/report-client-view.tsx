"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, Facebook, Instagram, Video, Share2, Linkedin, Search, Youtube, TrendingUp, DollarSign, Target, Globe, BarChart3, Send, Mail, Trash2, Download, Loader2 } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";
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

    // Prepare chart data only for platforms with data
    const activePlatforms = Object.keys(metrics.platforms || {}).filter(key => {
        const p = metrics.platforms[key];
        return (p.impressions || 0) > 0 || (p.followers || 0) > 0 || (p.engagement || 0) > 0 || (p.views || 0) > 0 || (p.paidReach || 0) > 0;
    });

    const chartData = activePlatforms.map(key => ({
        name: PLATFORM_NAMES[key as keyof typeof PLATFORM_NAMES] || key,
        impressions: metrics.platforms[key].impressions || 0,
        engagement: metrics.platforms[key].engagement || 0,
        followers: metrics.platforms[key].followers || 0,
    }));

    // Calculate Global Totals
    const globalTotals = {
        impressions: activePlatforms.reduce((acc, key) => acc + (Number(metrics.platforms[key].impressions) || 0), 0),
        engagement: activePlatforms.reduce((acc, key) => acc + (Number(metrics.platforms[key].engagement) || 0), 0),
        followers: activePlatforms.reduce((acc, key) => acc + (Number(metrics.platforms[key].followers) || 0), 0),
        conversions: activePlatforms.reduce((acc, key) => acc + (Number(metrics.platforms[key].conversions) || 0), 0),
        spend: activePlatforms.reduce((acc, key) => acc + (Number(metrics.platforms[key].spend) || 0), 0),
    };

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
                                toast.success("Public link copied to clipboard!");
                            }}
                            variant="outline"
                            className="font-bold rounded-full h-12 px-6"
                        >
                            <Share2 className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} /> Copy Public Link
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
                        {isDownloading ? "Generating..." : "Download PDF"}
                    </Button>
                </div>
            </div>

            {/* Global Performance Matrix */}
            <div className={`grid gap-6 grid-cols-2 md:grid-cols-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Card className="bg-primary/5 border-none shadow-none backdrop-blur-md">
                    <CardHeader className={`pb-2 ${isRtl ? 'text-right' : 'text-left'}`}>
                        <CardTitle className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">{t("reports.impressions")}</CardTitle>
                    </CardHeader>
                    <CardContent className={isRtl ? 'text-right' : 'text-left'}>
                        <div className="text-2xl md:text-4xl font-black italic">{(globalTotals.impressions).toLocaleString()}</div>
                        <div className={`text-[10px] text-emerald-500 font-bold mt-2 flex items-center gap-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <TrendingUp className="h-3 w-3" /> {t("common.combined")}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-blue-500/5 border-none shadow-none">
                    <CardHeader className={`pb-2 ${isRtl ? 'text-right' : 'text-left'}`}>
                        <CardTitle className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">{t("reports.engagements")}</CardTitle>
                    </CardHeader>
                    <CardContent className={isRtl ? 'text-right' : 'text-left'}>
                        <div className="text-2xl md:text-4xl font-black italic">{(globalTotals.engagement).toLocaleString()}</div>
                        <div className={`text-[10px] text-blue-500 font-bold mt-2 flex items-center gap-1 ${isRtl ? 'flex-row-reverse' : ''}`}>{t("reports.interactions")}</div>
                    </CardContent>
                </Card>
                <Card className="bg-purple-500/5 border-none shadow-none">
                    <CardHeader className={`pb-2 ${isRtl ? 'text-right' : 'text-left'}`}>
                        <CardTitle className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">{t("reports.growth")}</CardTitle>
                    </CardHeader>
                    <CardContent className={isRtl ? 'text-right' : 'text-left'}>
                        <div className="text-2xl md:text-4xl font-black italic">{(globalTotals.followers).toLocaleString()}</div>
                        <div className="text-[10px] text-purple-500 font-bold mt-2">{t("reports.new_followers")}</div>
                    </CardContent>
                </Card>
                <Card className="bg-orange-500/5 border-none shadow-none">
                    <CardHeader className={`pb-2 ${isRtl ? 'text-right' : 'text-left'}`}>
                        <CardTitle className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">{t("reports.investment")}</CardTitle>
                    </CardHeader>
                    <CardContent className={isRtl ? 'text-right' : 'text-left'}>
                        <div className="text-2xl md:text-4xl font-black italic">${(globalTotals.spend).toLocaleString()}</div>
                        <div className="text-[10px] text-orange-500 font-bold mt-2">{t("reports.paid_media")}</div>
                    </CardContent>
                </Card>
            </div>

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
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <XAxis dataKey="name" fontSize={12} fontWeight="700" tickLine={false} axisLine={false} reversed={isRtl} />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} orientation={isRtl ? 'right' : 'left'} />
                            <Tooltip
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                contentStyle={{ borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.5)' }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            <Bar dataKey="impressions" name={t("reports.impressions")} fill="#3b82f6" radius={[10, 10, 0, 0]} barSize={40} />
                            <Bar dataKey="engagement" name={t("reports.interactions")} fill="#10b981" radius={[10, 10, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Individual Platform Deep Dives */}
            <div className="space-y-16 print:space-y-8">
                <h2 className={`text-3xl font-black border-primary py-2 uppercase tracking-tighter print:text-2xl ${isRtl ? 'border-r-8 pr-6 text-right' : 'border-l-8 pl-6 text-left'}`}>{t("reports.platform_analysis")}</h2>
                <div className="grid gap-8 grid-cols-1 lg:grid-cols-2 print:grid-cols-1">
                    {activePlatforms.map(key => {
                        const data = metrics.platforms[key];
                        const Icon = PLATFORM_ICONS[key as keyof typeof PLATFORM_ICONS] || BarChart3;

                        return (
                            <Card key={key} className="border-none bg-card/30 backdrop-blur-md shadow-xl overflow-hidden group print:bg-white print:border print:shadow-none">
                                <CardHeader className={`bg-muted/30 py-6 px-8 transition-colors group-hover:bg-primary/5 print:bg-muted/10 ${isRtl ? 'text-right' : 'text-left'}`}>
                                    <div className={`flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                                        <div className={`flex items-center gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                            <div className="p-3 bg-primary/10 rounded-2xl group-hover:scale-110 transition-transform print:scale-100">
                                                <Icon className="h-6 w-6 text-primary" />
                                            </div>
                                            <div className={isRtl ? 'text-right' : 'text-left'}>
                                                <CardTitle className="text-xl font-black">{PLATFORM_NAMES[key as keyof typeof PLATFORM_NAMES] || key}</CardTitle>
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
                                        ].map((item, i) => (item.value || 0) > 0 ? (
                                            <div key={i} className={`p-4 rounded-2xl bg-muted/20 border border-border/50 print:bg-white print:border ${isRtl ? 'text-right' : 'text-left'}`}>
                                                <div className="text-[10px] font-black uppercase text-muted-foreground mb-1">{item.label}</div>
                                                <div className={`text-2xl font-black ${item.color}`}>{(item.value || 0).toLocaleString()}</div>
                                            </div>
                                        ) : null)}
                                    </div>
                                    <div className="pt-4 border-t border-dashed">
                                        <div className={`flex justify-between items-center bg-orange-500/5 p-4 rounded-xl border border-orange-500/10 print:bg-white ${isRtl ? 'flex-row-reverse' : ''}`}>
                                            <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                                <DollarSign className="h-4 w-4 text-orange-500" />
                                                <span className="text-xs font-bold uppercase tracking-wider">{t("reports.campaign_investment")}</span>
                                            </div>
                                            <span className="text-xl font-black text-orange-500">${(data.spend || 0).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
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
                            <CardTitle className="text-2xl font-black">{isRtl ? 'تحسين محركات البحث' : 'Search Engine Optimization'}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-10 grid md:grid-cols-2 gap-12">
                        <div className="space-y-6">
                            <div className={`p-6 bg-purple-500/5 rounded-2xl border border-purple-500/10 ${isRtl ? 'text-right' : ''}`}>
                                <h4 className="text-xs font-black text-purple-600 uppercase mb-2 tracking-widest">{t("dashboard.primary_keyword")}</h4>
                                <p className="text-2xl font-black italic">"{metrics.seo?.rank || t("dashboard.authority_growth")}"</p>
                            </div>
                            <div className={`p-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 ${isRtl ? 'text-right' : ''}`}>
                                <h4 className="text-xs font-black text-emerald-600 uppercase mb-2 tracking-widest">{isRtl ? 'الأداء التقني' : 'Technical Performance'}</h4>
                                <p className="text-sm font-bold leading-relaxed">{metrics.seo?.notes || t("dashboard.seo_notes")}</p>
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
