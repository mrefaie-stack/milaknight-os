"use client";

import { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileText, CheckCircle2, MessageSquare, BarChart, Calendar, DollarSign, TrendingUp, Mail, Globe, Info } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { motion, Variants } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LiveMetrics } from "./live-metrics";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const container: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: "easeOut"
        }
    }
};

function formatNumber(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    return n.toLocaleString();
}

export function ClientDashboardView({ client, latestPlan, allReports, globalServices = [] }: { client: any, latestPlan: any, allReports: any[], globalServices?: any[] }) {
    const { t, isRtl } = useLanguage();
    const [viewMode, setViewMode] = useState<"month" | "total">("total");

    const latestReport = allReports && allReports.length > 0 ? allReports[0] : null;

    const metrics = useMemo(() => {
        if (!allReports || allReports.length === 0) return { platforms: {}, seoScore: client.seoScore || 0, emailMarketing: { emailsSent: 0, openRate: 0, clickRate: 0 } };

        const currentSeoScore = (() => {
            const latestReport = allReports[0];
            const latestM = typeof latestReport.metrics === 'string' ? JSON.parse(latestReport.metrics) : latestReport.metrics;
            return latestM?.seo?.score || client.seoScore || 0;
        })();

        const reportsToProcess = viewMode === "month" ? [allReports[0]] : allReports;

        const aggregated = {
            platforms: {} as any,
            seoScore: currentSeoScore,
            emailMarketing: { emailsSent: 0, openRate: 0, clickRate: 0 }
        };

        let emailWeight = 0;

        reportsToProcess.forEach((report, index) => {
            const m = typeof report.metrics === 'string' ? JSON.parse(report.metrics) : report.metrics;
            const campaigns = m?.campaigns || (m?.platforms ? [{ platforms: m.platforms }] : []);
            
            const em = m?.emailMarketing;
            if (em) {
                const emCampaigns = em.campaigns || (em.emailsSent > 0 ? [em] : []);
                emCampaigns.forEach((ec: any) => {
                    aggregated.emailMarketing.emailsSent += (Number(ec.emailsSent) || 0);
                    aggregated.emailMarketing.openRate += (Number(ec.openRate) || 0);
                    aggregated.emailMarketing.clickRate += (Number(ec.clickRate) || 0);
                    emailWeight++;
                });
            }

            const prevReport = allReports[index + 1];
            let prevXFollowers = 0;
            if (prevReport) {
                const prevM = typeof prevReport.metrics === 'string' ? JSON.parse(prevReport.metrics) : prevReport.metrics;
                const prevCamps = prevM?.campaigns || (prevM?.platforms ? [{ platforms: prevM.platforms }] : []);
                prevXFollowers = prevCamps.reduce((max: number, c: any) => Math.max(max, Number(c.platforms?.['x']?.currentFollowers) || 0), 0);
            }

            const currentReportX = campaigns.reduce((max: number, c: any) => Math.max(max, Number(c.platforms?.['x']?.currentFollowers) || 0), 0);
            if (currentReportX > 0 && prevXFollowers > 0) {
                if (!aggregated.platforms['x']) aggregated.platforms['x'] = { impressions: 0, engagement: 0, followers: 0, spend: 0, conversions: 0 };
                aggregated.platforms['x'].followers += Math.max(0, currentReportX - prevXFollowers);
            }

            campaigns.forEach((camp: any) => {
                if (camp.platforms) {
                    Object.keys(camp.platforms).forEach(pKey => {
                        if (!aggregated.platforms[pKey]) {
                            aggregated.platforms[pKey] = { impressions: 0, engagement: 0, followers: 0, spend: 0, conversions: 0 };
                        }
                        const pData = camp.platforms[pKey];
                        aggregated.platforms[pKey].impressions += (Number(pData.impressions) || 0);
                        aggregated.platforms[pKey].engagement += (Number(pData.engagement) || 0);
                        if (pKey !== 'x') {
                            aggregated.platforms[pKey].followers += (Number(pData.followers) || 0);
                        }

                        const paidSpend = pData.paidCampaigns?.length > 0
                            ? pData.paidCampaigns.reduce((acc: number, c: any) => acc + (Number(c.spend) || 0), 0)
                            : (Number(pData.spend) || 0);
                        aggregated.platforms[pKey].spend += paidSpend;

                        const paidResults = pData.paidCampaigns?.length > 0
                            ? pData.paidCampaigns.reduce((acc: number, c: any) => acc + (Number(c.results) || 0), 0)
                            : (Number(pData.conversions) || 0);
                        aggregated.platforms[pKey].conversions += paidResults;
                    });
                }
            });
        });

        if (emailWeight > 0) {
            aggregated.emailMarketing.openRate /= emailWeight;
            aggregated.emailMarketing.clickRate /= emailWeight;
        }

        return aggregated;
    }, [allReports, viewMode, client.seoScore]);

    const statCards = [
        {
            label: t("reports.impressions"),
            tooltip: isRtl ? "عدد المرات التي ظهر فيها محتواك أمام المستخدمين عبر جميع المنصات" : "Number of times your content was displayed to users across all platforms",
            value: Object.values(metrics.platforms).reduce((acc: number, p: any) => acc + (p.impressions || 0), 0),
            color: "text-primary",
            accent: "bg-primary/5",
            icon: <BarChart className="h-3 w-3" />,
            format: formatNumber
        },
        {
            label: t("reports.engagements"),
            tooltip: isRtl ? "إجمالي التفاعلات (إعجابات، تعليقات، مشاركات، حفظ) مع محتواك" : "Total interactions (likes, comments, shares, saves) with your content",
            value: Object.values(metrics.platforms).reduce((acc: number, p: any) => acc + (p.engagement || 0), 0),
            color: "text-emerald-500",
            accent: "bg-emerald-500/5",
            icon: <Sparkles className="h-3 w-3" />,
            format: formatNumber
        },
        {
            label: t("reports.growth"),
            tooltip: isRtl ? "عدد المتابعين الجدد المكتسبين عبر جميع المنصات خلال هذه الفترة" : "New followers gained across all platforms during this period",
            value: Object.values(metrics.platforms).reduce((acc: number, p: any) => acc + (p.followers || 0), 0),
            color: "text-blue-500",
            accent: "bg-blue-500/5",
            icon: <TrendingUp className="h-3 w-3" />,
            format: formatNumber
        },
        {
            label: isRtl ? "الإنفاق الإعلاني" : "Ad Spend",
            tooltip: isRtl ? "إجمالي المبالغ المنفقة على الحملات الإعلانية المدفوعة" : "Total amount spent on paid advertising campaigns",
            value: Object.values(metrics.platforms).reduce((acc: number, p: any) => acc + (p.spend || 0), 0),
            color: "text-orange-500",
            accent: "bg-orange-500/5",
            icon: <DollarSign className="h-3 w-3" />,
            format: (n: number) => `SAR ${formatNumber(n)}`
        },
        {
            label: t("reports.completed_actions"),
            tooltip: isRtl ? "نتائج الحملات المدفوعة (تحويلات، عملاء محتملون، نقرات)" : "Results from paid campaigns (conversions, leads, clicks)",
            value: Object.values(metrics.platforms).reduce((acc: number, p: any) => acc + (p.conversions || 0), 0),
            color: "text-rose-500",
            accent: "bg-rose-500/5",
            icon: <CheckCircle2 className="h-3 w-3" />,
            format: formatNumber
        },
        ...(metrics.emailMarketing.emailsSent > 0 ? [{
            label: isRtl ? "رسائل البريد" : "Emails Dispatched",
            tooltip: isRtl ? "إجمالي رسائل البريد الإلكتروني الترويجية المُرسلة لمشتركيك" : "Total promotional emails sent to your subscribers",
            value: metrics.emailMarketing.emailsSent,
            color: "text-rose-500",
            accent: "bg-rose-500/5",
            icon: <Mail className="h-3 w-3" />,
            format: formatNumber
        }] : []),
        {
            label: isRtl ? "سكور SEO" : "SEO Score",
            tooltip: isRtl ? "مؤشر أداء موقعك على محركات البحث (من 0 إلى 100%)" : "Your website's search engine optimization performance score (0–100%)",
            value: metrics?.seoScore || 0,
            color: "text-purple-500",
            accent: "bg-purple-500/5",
            icon: <Globe className="h-3 w-3" />,
            format: (n: number) => `${n}%`
        },
    ];

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-10"
            dir={isRtl ? "rtl" : "ltr"}
        >
            <motion.div variants={item} className={`flex flex-col md:flex-row md:items-center justify-between gap-6 ${isRtl ? 'text-right' : 'text-left'}`}>
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        {client.logoUrl && (
                            <img src={client.logoUrl} alt={client.name} className="h-16 w-16 object-contain bg-white/5 p-2 rounded-2xl border border-white/10" />
                        )}
                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tighter premium-gradient-text uppercase">
                            {t("dashboard.welcome_client").replace("{name}", client.name)}
                        </h1>
                    </div>
                </div>
                {client.amId && (
                    <Link href={`/messages?userId=${client.amId}`}>
                        <Button variant="default" className="font-black uppercase tracking-widest shadow-2xl shadow-primary/20 h-14 px-10 rounded-full hover:scale-105 transition-all">
                            <MessageSquare className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} /> {t("dashboard.message_am")}
                        </Button>
                    </Link>
                )}
            </motion.div>

            <Tabs defaultValue="overview" className="w-full">
                <motion.div variants={item} className="flex justify-center mb-8">
                    <TabsList className="bg-white/5 border border-white/10 rounded-full p-1 h-14">
                        <TabsTrigger value="overview" className="rounded-full px-8 text-xs font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-full transition-all">
                            {isRtl ? "نظرة عامة" : "OVERVIEW"}
                        </TabsTrigger>
                        <TabsTrigger value="live" className="rounded-full px-8 text-xs font-black uppercase tracking-widest data-[state=active]:bg-rose-500 data-[state=active]:text-white h-full transition-all flex items-center gap-2">
                            <span className="relative flex h-2 w-2 shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                            </span>
                            {isRtl ? "البيانات الحية" : "LIVE ANALYTICS"}
                        </TabsTrigger>
                    </TabsList>
                </motion.div>

                <TabsContent value="overview" className="space-y-10 mt-0">
                    <motion.div variants={item} className="flex items-center gap-4 mt-2 flex-wrap">
                        <p className="text-muted-foreground font-medium text-lg opacity-80">
                            {isRtl ? "نظرة على أداء علامتك التجارية" : "Your brand performance at a glance."}
                        </p>
                        <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)} className="print:hidden">
                            <TabsList className="bg-white/5 border border-white/10 rounded-full p-1 h-10">
                                <TabsTrigger value="month" className="rounded-full px-4 text-xs font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                    {isRtl ? "آخر تقرير" : "Latest Month"}
                                </TabsTrigger>
                                <TabsTrigger value="total" className="rounded-full px-4 text-xs font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                    {isRtl ? "الإجمالي" : "Lifetime Total"}
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </motion.div>

                    <div className={`grid gap-6 grid-cols-2 md:grid-cols-4 ${!metrics ? 'opacity-50' : ''}`}>
                        {statCards.map((m) => (
                            <motion.div key={m.label} variants={item}>
                                <Card className={`glass-card hover-lift border-none overflow-hidden rounded-2xl ${m.accent}`}>
                                    <CardHeader className={`pb-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                                        <CardTitle className={`text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                            {(m as any).icon}
                                            <span className="flex-1">{m.label}</span>
                                            {(m as any).tooltip && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button className="opacity-40 hover:opacity-80 transition-opacity shrink-0">
                                                            <Info className="h-3 w-3" />
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top" className="max-w-[200px] text-center leading-relaxed">
                                                        {(m as any).tooltip}
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className={isRtl ? 'text-right' : 'text-left'}>
                                        <div className={`text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter ${m.color}`}>
                                            {m.format(m.value)}
                                        </div>
                                        <p className="text-[10px] text-muted-foreground font-bold mt-1 opacity-50">
                                            {viewMode === 'total' ? (isRtl ? 'الإجمالي' : 'Lifetime') : (isRtl ? 'هذا الشهر' : 'This Month')}
                                        </p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                    <div className="grid gap-8 md:grid-cols-2">
                        <motion.div variants={item}>
                            <Card className="glass-card border-none overflow-hidden rounded-3xl group">
                                <CardHeader className="bg-primary/10 border-b border-white/5 py-6">
                                    <CardTitle className={`text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 ${isRtl ? 'flex-row-reverse text-right' : ''}`}>
                                        <CheckCircle2 className="h-4 w-4 text-primary" /> {t("dashboard.latest_plan")}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className={`p-10 space-y-8 ${isRtl ? 'text-right' : 'text-left'}`}>
                                    {latestPlan ? (
                                        <>
                                            <div className="space-y-2">
                                                <p className="text-4xl font-black uppercase tracking-tighter premium-gradient-text">{latestPlan.month}</p>
                                                <p className="text-sm font-bold text-muted-foreground opacity-70 uppercase tracking-widest">{t("dashboard.strategic_plan")}</p>
                                            </div>
                                            <div className={`flex items-center justify-between pt-6 border-t border-white/5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                                <div className={`flex flex-col ${isRtl ? 'items-start' : ''}`}>
                                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-50">{isRtl ? "الحالة" : "STATUS"}</span>
                                                    <span className="text-xl font-black text-emerald-500 uppercase tracking-tight">{t(`common.status.${latestPlan.status}`)}</span>
                                                </div>
                                                <Link href={`/client/action-plans`}>
                                                    <Button variant="secondary" size="lg" className="rounded-full font-black uppercase tracking-widest h-12 px-6 bg-white/5 hover:bg-white/10">
                                                        {t("dashboard.view_all")}
                                                    </Button>
                                                </Link>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="py-12 text-center opacity-40">
                                            <p className="text-muted-foreground font-black italic uppercase tracking-widest">{t("dashboard.no_plan_yet")}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div variants={item}>
                            <Card className="glass-card border-none overflow-hidden rounded-3xl group">
                                <CardHeader className="bg-emerald-500/10 border-b border-white/5 py-6">
                                    <CardTitle className={`text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 text-emerald-500 ${isRtl ? 'flex-row-reverse text-right' : ''}`}>
                                        <CheckCircle2 className="h-4 w-4" /> {t("dashboard.latest_report")}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className={`p-10 space-y-8 ${isRtl ? 'text-right' : 'text-left'}`}>
                                    {latestReport ? (
                                        <>
                                            <div className="space-y-2">
                                                <p className="text-4xl font-black uppercase tracking-tighter text-emerald-500">{latestReport.month}</p>
                                                <p className="text-sm font-bold text-muted-foreground opacity-70 uppercase tracking-widest">{t("dashboard.efficiency_review")}</p>
                                            </div>
                                            <div className={`flex items-center justify-between pt-6 border-t border-white/5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                                <div className={`flex flex-col ${isRtl ? 'items-start' : ''}`}>
                                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-50">{t("dashboard.metrics")}</span>
                                                    <span className="text-xl font-black text-primary uppercase tracking-tight">{isRtl ? "تم التحليل" : "METRICS ANALYZED"}</span>
                                                </div>
                                                <Link href={`/client/reports/${latestReport.id}`}>
                                                    <Button variant="secondary" size="lg" className="rounded-full font-black uppercase tracking-widest h-12 px-6 bg-white/5 hover:bg-white/10">
                                                        {t("dashboard.view_all")}
                                                    </Button>
                                                </Link>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="py-12 text-center opacity-40">
                                            <p className="text-muted-foreground font-black italic uppercase tracking-widest">{t("dashboard.no_report_yet")}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </TabsContent>

                <TabsContent value="live" className="mt-0">
                    <motion.div variants={item}>
                        <LiveMetrics />
                    </motion.div>
                </TabsContent>
            </Tabs>

            {globalServices.filter(gs => !client.services?.some((s: any) => s.globalServiceId === gs.id)).length > 0 && (
                <motion.div variants={item} className="space-y-5 pt-10 border-t border-white/5">
                    <div className={`flex items-center justify-between flex-wrap gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <div className={isRtl ? 'text-right' : ''}>
                            <h2 className={`text-xl font-black tracking-tight flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <Sparkles className="h-5 w-5 text-primary" />
                                {isRtl ? "اكتشف خدماتنا الإضافية" : "Discover Our Premium Services"}
                            </h2>
                            <p className="text-xs text-muted-foreground mt-0.5 font-medium opacity-70">
                                {isRtl ? "خدمات إضافية لتعزيز نمو علامتك التجارية" : "Add-on services to accelerate your brand growth"}
                            </p>
                        </div>
                        <Link href="/client/services">
                            <Button variant="ghost" size="sm" className={`text-[11px] font-black uppercase tracking-widest text-primary hover:text-primary flex items-center gap-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                {isRtl ? "عرض الكل" : "View All"}
                                <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {globalServices
                            .filter(gs => !client.services?.some((s: any) => s.globalServiceId === gs.id))
                            .slice(0, 3)
                            .map((service) => (
                                <Link key={service.id} href="/client/services">
                                    <div className="group p-5 rounded-2xl border border-white/8 bg-white/3 hover:bg-white/6 hover:border-primary/20 transition-all duration-300 cursor-pointer h-full flex flex-col gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                            <Sparkles className="h-5 w-5" />
                                        </div>
                                        <div className={`flex-1 ${isRtl ? 'text-right' : ''}`}>
                                            <h3 className="font-black text-sm leading-tight">
                                                {isRtl ? service.nameAr : service.nameEn}
                                            </h3>
                                            {(isRtl ? service.descriptionAr : service.descriptionEn) && (
                                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 opacity-70 font-medium">
                                                    {isRtl ? service.descriptionAr : service.descriptionEn}
                                                </p>
                                            )}
                                        </div>
                                        <span className={`text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1 ${isRtl ? 'flex-row-reverse self-end' : 'self-end'}`}>
                                            {isRtl ? "اطلب الآن" : "Request"} <ArrowRight className="h-3 w-3" />
                                        </span>
                                    </div>
                                </Link>
                            ))}
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}
