"use client";

import { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    FileText, CheckCircle2, MessageSquare, BarChart,
    Calendar, DollarSign, TrendingUp, Mail, Globe,
    Info, Sparkles, ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";
import { motion, Variants } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LiveMetrics } from "./live-metrics";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const container: Variants = {
    hidden: { opacity: 0 },
    show:   { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item: Variants = {
    hidden: { opacity: 0, y: 10 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

function formatNumber(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1_000)     return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
    return n.toLocaleString();
}

export function ClientDashboardView({
    client,
    latestPlan,
    allReports,
    globalServices = [],
}: {
    client: any;
    latestPlan: any;
    allReports: any[];
    globalServices?: any[];
}) {
    const { t, isRtl } = useLanguage();
    const [viewMode, setViewMode] = useState<"month" | "total">("total");

    const latestReport = allReports?.[0] ?? null;

    const metrics = useMemo(() => {
        if (!allReports || allReports.length === 0) {
            return {
                platforms: {},
                seoScore: client.seoScore || 0,
                emailMarketing: { emailsSent: 0, openRate: 0, clickRate: 0 },
            };
        }

        const currentSeoScore = (() => {
            const m = typeof allReports[0].metrics === "string"
                ? JSON.parse(allReports[0].metrics)
                : allReports[0].metrics;
            return m?.seo?.score || client.seoScore || 0;
        })();

        const reportsToProcess = viewMode === "month" ? [allReports[0]] : allReports;
        const aggregated: any = {
            platforms: {},
            seoScore: currentSeoScore,
            emailMarketing: { emailsSent: 0, openRate: 0, clickRate: 0 },
        };
        let emailWeight = 0;

        reportsToProcess.forEach((report: any, index: number) => {
            const m = typeof report.metrics === "string" ? JSON.parse(report.metrics) : report.metrics;
            const campaigns = m?.campaigns || (m?.platforms ? [{ platforms: m.platforms }] : []);

            const em = m?.emailMarketing;
            if (em) {
                const emCampaigns = em.campaigns || (em.emailsSent > 0 ? [em] : []);
                emCampaigns.forEach((ec: any) => {
                    aggregated.emailMarketing.emailsSent  += Number(ec.emailsSent)  || 0;
                    aggregated.emailMarketing.openRate    += Number(ec.openRate)    || 0;
                    aggregated.emailMarketing.clickRate   += Number(ec.clickRate)   || 0;
                    emailWeight++;
                });
            }

            const prevReport = allReports[index + 1];
            let prevXFollowers = 0;
            if (prevReport) {
                const prevM = typeof prevReport.metrics === "string" ? JSON.parse(prevReport.metrics) : prevReport.metrics;
                const prevCamps = prevM?.campaigns || (prevM?.platforms ? [{ platforms: prevM.platforms }] : []);
                prevXFollowers = prevCamps.reduce((max: number, c: any) => Math.max(max, Number(c.platforms?.x?.currentFollowers) || 0), 0);
            }

            const currentX = campaigns.reduce((max: number, c: any) => Math.max(max, Number(c.platforms?.x?.currentFollowers) || 0), 0);
            if (currentX > 0 && prevXFollowers > 0) {
                if (!aggregated.platforms.x) aggregated.platforms.x = { impressions: 0, engagement: 0, followers: 0, spend: 0, conversions: 0 };
                aggregated.platforms.x.followers += Math.max(0, currentX - prevXFollowers);
            }

            campaigns.forEach((camp: any) => {
                if (!camp.platforms) return;
                Object.keys(camp.platforms).forEach((pKey) => {
                    if (!aggregated.platforms[pKey]) {
                        aggregated.platforms[pKey] = { impressions: 0, engagement: 0, followers: 0, spend: 0, conversions: 0 };
                    }
                    const pData = camp.platforms[pKey];
                    aggregated.platforms[pKey].impressions += Number(pData.impressions) || 0;
                    aggregated.platforms[pKey].engagement  += Number(pData.engagement)  || 0;
                    if (pKey !== "x") aggregated.platforms[pKey].followers += Number(pData.followers) || 0;

                    const spend = pData.paidCampaigns?.length > 0
                        ? pData.paidCampaigns.reduce((a: number, c: any) => a + (Number(c.spend) || 0), 0)
                        : Number(pData.spend) || 0;
                    aggregated.platforms[pKey].spend += spend;

                    const conversions = pData.paidCampaigns?.length > 0
                        ? pData.paidCampaigns.reduce((a: number, c: any) => a + (Number(c.results) || 0), 0)
                        : Number(pData.conversions) || 0;
                    aggregated.platforms[pKey].conversions += conversions;
                });
            });
        });

        if (emailWeight > 0) {
            aggregated.emailMarketing.openRate  /= emailWeight;
            aggregated.emailMarketing.clickRate /= emailWeight;
        }

        return aggregated;
    }, [allReports, viewMode, client.seoScore]);

    const statCards = [
        {
            label: t("reports.impressions"),
            tooltip: isRtl
                ? "عدد المرات التي ظهر فيها محتواك أمام المستخدمين"
                : "Times your content was displayed to users across all platforms",
            value: Object.values(metrics.platforms).reduce((acc: number, p: any) => acc + (p.impressions || 0), 0),
            color: "text-primary",
            bg: "bg-primary/8",
            icon: <BarChart className="h-3.5 w-3.5" />,
            format: formatNumber,
        },
        {
            label: t("reports.engagements"),
            tooltip: isRtl
                ? "إجمالي التفاعلات (إعجابات، تعليقات، مشاركات)"
                : "Total interactions (likes, comments, shares, saves)",
            value: Object.values(metrics.platforms).reduce((acc: number, p: any) => acc + (p.engagement || 0), 0),
            color: "text-emerald-500",
            bg: "bg-emerald-500/8",
            icon: <Sparkles className="h-3.5 w-3.5" />,
            format: formatNumber,
        },
        {
            label: t("reports.growth"),
            tooltip: isRtl
                ? "عدد المتابعين الجدد عبر جميع المنصات"
                : "New followers gained across all platforms",
            value: Object.values(metrics.platforms).reduce((acc: number, p: any) => acc + (p.followers || 0), 0),
            color: "text-blue-500",
            bg: "bg-blue-500/8",
            icon: <TrendingUp className="h-3.5 w-3.5" />,
            format: formatNumber,
        },
        {
            label: isRtl ? "الإنفاق الإعلاني" : "Ad Spend",
            tooltip: isRtl
                ? "إجمالي المبالغ المنفقة على الحملات الإعلانية"
                : "Total spent on paid advertising campaigns",
            value: Object.values(metrics.platforms).reduce((acc: number, p: any) => acc + (p.spend || 0), 0),
            color: "text-amber-500",
            bg: "bg-amber-500/8",
            icon: <DollarSign className="h-3.5 w-3.5" />,
            format: (n: number) => `SAR ${formatNumber(n)}`,
        },
        {
            label: t("reports.completed_actions"),
            tooltip: isRtl
                ? "نتائج الحملات المدفوعة (تحويلات، عملاء محتملون)"
                : "Results from paid campaigns (conversions, leads)",
            value: Object.values(metrics.platforms).reduce((acc: number, p: any) => acc + (p.conversions || 0), 0),
            color: "text-rose-500",
            bg: "bg-rose-500/8",
            icon: <CheckCircle2 className="h-3.5 w-3.5" />,
            format: formatNumber,
        },
        ...(metrics.emailMarketing.emailsSent > 0 ? [{
            label: isRtl ? "رسائل البريد" : "Emails Sent",
            tooltip: isRtl
                ? "إجمالي رسائل البريد الإلكتروني المُرسلة"
                : "Total promotional emails sent to subscribers",
            value: metrics.emailMarketing.emailsSent,
            color: "text-violet-500",
            bg: "bg-violet-500/8",
            icon: <Mail className="h-3.5 w-3.5" />,
            format: formatNumber,
        }] : []),
        {
            label: isRtl ? "سكور SEO" : "SEO Score",
            tooltip: isRtl
                ? "مؤشر أداء موقعك على محركات البحث"
                : "Website search engine optimization score (0–100%)",
            value: metrics?.seoScore || 0,
            color: "text-purple-500",
            bg: "bg-purple-500/8",
            icon: <Globe className="h-3.5 w-3.5" />,
            format: (n: number) => `${n}%`,
        },
    ];

    const unavailableServices = globalServices.filter(
        gs => !client.services?.some((s: any) => s.globalServiceId === gs.id)
    );

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6" dir={isRtl ? "rtl" : "ltr"}>

            {/* ── Page Header ── */}
            <motion.div variants={item} className={cn(
                "flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                isRtl ? "text-right" : "",
            )}>
                <div className={cn("flex items-center gap-3", isRtl ? "flex-row-reverse" : "")}>
                    {client.logoUrl && (
                        <img
                            src={client.logoUrl}
                            alt={client.name}
                            className="h-12 w-12 object-contain rounded-lg border border-border bg-card p-1.5 shrink-0"
                        />
                    )}
                    <div className="space-y-0.5">
                        <p className="section-label">{isRtl ? "بوابة العميل" : "Client Portal"}</p>
                        <h1 className="text-xl font-bold tracking-tight">
                            {t("dashboard.welcome_client").replace("{name}", client.name)}
                        </h1>
                    </div>
                </div>
                {client.amId && (
                    <Link href={`/messages?userId=${client.amId}`}>
                        <Button size="sm">
                            <MessageSquare className="h-3.5 w-3.5" />
                            {t("dashboard.message_am")}
                        </Button>
                    </Link>
                )}
            </motion.div>

            {/* ── Tabs ── */}
            <Tabs defaultValue="overview" className="w-full">
                <motion.div variants={item}>
                    <TabsList variant="line" className="w-full justify-start mb-2">
                        <TabsTrigger value="overview">
                            {isRtl ? "نظرة عامة" : "Overview"}
                        </TabsTrigger>
                        <TabsTrigger value="live" className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2 shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                            </span>
                            {isRtl ? "البيانات الحية" : "Live Analytics"}
                        </TabsTrigger>
                    </TabsList>
                </motion.div>

                {/* ── Overview Tab ── */}
                <TabsContent value="overview" className="space-y-6 mt-0">
                    {/* View mode toggle */}
                    <motion.div variants={item} className={cn(
                        "flex items-center justify-between gap-3 flex-wrap",
                        isRtl ? "flex-row-reverse" : "",
                    )}>
                        <p className="text-sm text-muted-foreground">
                            {isRtl ? "أداء علامتك التجارية" : "Your brand performance"}
                        </p>
                        <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)} className="print:hidden">
                            <TabsList className="h-8">
                                <TabsTrigger value="month" className="text-xs px-3 py-1">
                                    {isRtl ? "آخر تقرير" : "Latest"}
                                </TabsTrigger>
                                <TabsTrigger value="total" className="text-xs px-3 py-1">
                                    {isRtl ? "الإجمالي" : "Lifetime"}
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </motion.div>

                    {/* Metric cards */}
                    <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                        {statCards.map((m) => (
                            <motion.div key={m.label} variants={item}>
                                <Card className="hover:border-border transition-all duration-150">
                                    <CardHeader className={cn("pb-1", isRtl ? "text-right" : "")}>
                                        <div className={cn(
                                            "flex items-center gap-1.5 text-muted-foreground",
                                            isRtl ? "flex-row-reverse" : "",
                                        )}>
                                            <div className={cn("p-1 rounded", m.bg, m.color)}>
                                                {m.icon}
                                            </div>
                                            <span className="section-label text-[9px] flex-1">{m.label}</span>
                                            {(m as any).tooltip && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button className="text-muted-foreground/40 hover:text-muted-foreground transition-colors shrink-0">
                                                            <Info className="h-3 w-3" />
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top" className="max-w-[180px] text-center">
                                                        {(m as any).tooltip}
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className={isRtl ? "text-right" : ""}>
                                        <div className={cn("text-2xl font-bold tracking-tight", m.color)}>
                                            {m.format(m.value)}
                                        </div>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">
                                            {viewMode === "total"
                                                ? (isRtl ? "الإجمالي" : "Lifetime")
                                                : (isRtl ? "هذا الشهر" : "This month")}
                                        </p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                    {/* Plan & Report cards */}
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Latest Plan */}
                        <motion.div variants={item}>
                            <Card>
                                <CardHeader className={cn(
                                    "flex flex-row items-center gap-2 border-b border-border pb-4",
                                    isRtl ? "flex-row-reverse" : "",
                                )}>
                                    <div className="p-1.5 rounded-md bg-primary/10">
                                        <FileText className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className={cn("flex-1", isRtl ? "text-right" : "")}>
                                        <CardTitle className="text-[14px]">{t("dashboard.latest_plan")}</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className={cn("pt-4 space-y-4", isRtl ? "text-right" : "")}>
                                    {latestPlan ? (
                                        <>
                                            <div>
                                                <p className="text-xl font-bold tracking-tight">{latestPlan.month}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {t("dashboard.strategic_plan")}
                                                </p>
                                            </div>
                                            <div className={cn(
                                                "flex items-center justify-between pt-3 border-t border-border",
                                                isRtl ? "flex-row-reverse" : "",
                                            )}>
                                                <div>
                                                    <p className="section-label text-[9px]">{isRtl ? "الحالة" : "Status"}</p>
                                                    <Badge
                                                        variant={latestPlan.status === "APPROVED" ? "success" : "warning"}
                                                        className="mt-1"
                                                    >
                                                        {t(`common.status.${latestPlan.status}`)}
                                                    </Badge>
                                                </div>
                                                <Link href="/client/action-plans">
                                                    <Button variant="outline" size="sm">
                                                        {t("dashboard.view_all")}
                                                        <ArrowRight className={cn("h-3.5 w-3.5", isRtl ? "rotate-180" : "")} />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="py-8 text-center">
                                            <p className="text-sm text-muted-foreground">{t("dashboard.no_plan_yet")}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Latest Report */}
                        <motion.div variants={item}>
                            <Card>
                                <CardHeader className={cn(
                                    "flex flex-row items-center gap-2 border-b border-border pb-4",
                                    isRtl ? "flex-row-reverse" : "",
                                )}>
                                    <div className="p-1.5 rounded-md bg-emerald-500/10">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    </div>
                                    <div className={cn("flex-1", isRtl ? "text-right" : "")}>
                                        <CardTitle className="text-[14px]">{t("dashboard.latest_report")}</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className={cn("pt-4 space-y-4", isRtl ? "text-right" : "")}>
                                    {latestReport ? (
                                        <>
                                            <div>
                                                <p className="text-xl font-bold tracking-tight text-emerald-500">
                                                    {latestReport.month}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {t("dashboard.efficiency_review")}
                                                </p>
                                            </div>
                                            <div className={cn(
                                                "flex items-center justify-between pt-3 border-t border-border",
                                                isRtl ? "flex-row-reverse" : "",
                                            )}>
                                                <div>
                                                    <p className="section-label text-[9px]">{t("dashboard.metrics")}</p>
                                                    <Badge variant="success" className="mt-1">
                                                        {isRtl ? "تم التحليل" : "Analyzed"}
                                                    </Badge>
                                                </div>
                                                <Link href={`/client/reports/${latestReport.id}`}>
                                                    <Button variant="outline" size="sm">
                                                        {t("dashboard.view_all")}
                                                        <ArrowRight className={cn("h-3.5 w-3.5", isRtl ? "rotate-180" : "")} />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="py-8 text-center">
                                            <p className="text-sm text-muted-foreground">{t("dashboard.no_report_yet")}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </TabsContent>

                {/* ── Live Tab ── */}
                <TabsContent value="live" className="mt-0">
                    <motion.div variants={item}>
                        <LiveMetrics />
                    </motion.div>
                </TabsContent>
            </Tabs>

            {/* ── Upsell Services ── */}
            {unavailableServices.length > 0 && (
                <motion.div variants={item} className="space-y-4 pt-2 border-t border-border">
                    <div className={cn(
                        "flex items-center justify-between flex-wrap gap-3",
                        isRtl ? "flex-row-reverse" : "",
                    )}>
                        <div className={isRtl ? "text-right" : ""}>
                            <div className={cn("flex items-center gap-2 mb-0.5", isRtl ? "flex-row-reverse" : "")}>
                                <Sparkles className="h-4 w-4 text-primary" />
                                <h2 className="text-[15px] font-semibold">
                                    {isRtl ? "خدمات إضافية" : "Additional Services"}
                                </h2>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {isRtl ? "لتعزيز نمو علامتك التجارية" : "Accelerate your brand growth"}
                            </p>
                        </div>
                        <Link href="/client/services">
                            <Button variant="ghost" size="sm" className={cn("gap-1", isRtl ? "flex-row-reverse" : "")}>
                                {isRtl ? "عرض الكل" : "View All"}
                                <ArrowRight className={cn("h-3.5 w-3.5", isRtl ? "rotate-180" : "")} />
                            </Button>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {unavailableServices.slice(0, 3).map((service) => (
                            <Link key={service.id} href="/client/services">
                                <div className={cn(
                                    "group flex flex-col gap-3 p-4 rounded-lg border border-border",
                                    "hover:border-primary/30 hover:bg-muted/50 transition-all duration-150 cursor-pointer h-full",
                                )}>
                                    <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                                        <Sparkles className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className={cn("flex-1", isRtl ? "text-right" : "")}>
                                        <h3 className="font-medium text-sm">
                                            {isRtl ? service.nameAr : service.nameEn}
                                        </h3>
                                        {(isRtl ? service.descriptionAr : service.descriptionEn) && (
                                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                                {isRtl ? service.descriptionAr : service.descriptionEn}
                                            </p>
                                        )}
                                    </div>
                                    <span className={cn(
                                        "text-xs font-medium text-primary flex items-center gap-1",
                                        isRtl ? "flex-row-reverse" : "",
                                    )}>
                                        {isRtl ? "اطلب الآن" : "Request"}
                                        <ArrowRight className="h-3 w-3" />
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
