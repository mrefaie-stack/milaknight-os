"use client";

import { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileText, CheckCircle2, MessageSquare, BarChart, Calendar, DollarSign, TrendingUp, Mail, Globe } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { motion, Variants } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight } from "lucide-react";

export function ClientDashboardView({ client, latestPlan, allReports, globalServices = [] }: { client: any, latestPlan: any, allReports: any[], globalServices?: any[] }) {
    const { t, isRtl } = useLanguage();
    // Default is "total" (Lifetime) — user can switch to current month
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
            
            // Email Marketing aggregation
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

            // For X dynamic followers
            const prevReport = allReports[index + 1];
            let prevXFollowers = 0;
            if (prevReport) {
                const prevM = typeof prevReport.metrics === 'string' ? JSON.parse(prevReport.metrics) : prevReport.metrics;
                const prevCampaigns = prevM?.campaigns || (prevM?.platforms ? [{ platforms: prevM.platforms }] : []);
                prevCampaigns.forEach((c: any) => {
                    const px = c.platforms?.['x'];
                    if (px) prevXFollowers += (Number(px.currentFollowers) || 0);
                });
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
                        
                        if (pKey === 'x') {
                            const current = Number(pData.currentFollowers) || 0;
                            const diff = Math.max(0, current - prevXFollowers);
                            aggregated.platforms[pKey].followers += diff;
                        } else {
                            aggregated.platforms[pKey].followers += (Number(pData.followers) || 0);
                        }

                        // Handle both old flat and new nested paidCampaigns
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

    const totalSpend = metrics
        ? Object.values(metrics.platforms || {}).reduce((acc: number, p: any) => {
            // Use paidCampaigns sum if available to avoid double-counting with platform.spend
            const paidSpend = (p as any).paidCampaigns?.length > 0
                ? (p as any).paidCampaigns.reduce((s: number, c: any) => s + (Number(c.spend) || 0), 0)
                : (Number((p as any).spend) || 0);
            return acc + paidSpend;
        }, 0)
        : 0;

    const statCards = [
        {
            label: t("reports.impressions"),
            value: metrics ? Object.values(metrics.platforms || {}).reduce((acc: number, p: any) => acc + (Number(p.impressions) || 0), 0) : 0,
            color: "text-primary",
            accent: "bg-primary/5",
            icon: <BarChart className="h-3 w-3" />,
            format: formatNumber
        },
        {
            label: t("reports.engagements"),
            value: metrics ? Object.values(metrics.platforms || {}).reduce((acc: number, p: any) => acc + (Number(p.engagement) || 0), 0) : 0,
            color: "text-emerald-500",
            accent: "bg-emerald-500/5",
            icon: <Sparkles className="h-3 w-3" />,
            format: formatNumber
        },
        {
            label: t("reports.growth"),
            value: metrics ? Object.values(metrics.platforms || {}).reduce((acc: number, p: any) => acc + (Number(p.followers) || 0), 0) : 0,
            color: "text-blue-500",
            accent: "bg-blue-500/5",
            icon: <TrendingUp className="h-3 w-3" />,
            format: formatNumber
        },
        {
            label: isRtl ? "الإنفاق الإعلاني" : "Ad Spend",
            value: totalSpend,
            color: "text-orange-500",
            accent: "bg-orange-500/5",
            icon: <DollarSign className="h-3 w-3" />,
            format: (n: number) => `SAR ${formatNumber(n)}`
        },
        {
            label: t("reports.completed_actions"),
            value: metrics ? Object.values(metrics.platforms || {}).reduce((acc: number, p: any) => acc + (Number(p.conversions) || 0), 0) : 0,
            color: "text-rose-500",
            accent: "bg-rose-500/5",
            icon: <CheckCircle2 className="h-3 w-3" />,
            format: formatNumber
        },
        ...(metrics?.emailMarketing?.emailsSent > 0 ? [{
            label: isRtl ? "رسائل البريد" : "Emails Dispatched",
            value: metrics.emailMarketing.emailsSent,
            color: "text-rose-500",
            accent: "bg-rose-500/5",
            icon: <Mail className="h-3 w-3" />,
            format: formatNumber
        }] : []),
        {
            label: isRtl ? "سكور SEO" : "SEO Score",
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
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
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

            {/* KPI Cards */}
            <div className={`grid gap-6 grid-cols-2 md:grid-cols-4 ${!metrics ? 'opacity-50' : ''}`}>
                {statCards.map((m) => (
                    <motion.div key={m.label} variants={item}>
                        <Card className={`glass-card hover-lift border-none overflow-hidden rounded-2xl ${m.accent}`}>
                            <CardHeader className={`pb-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 flex items-center gap-2">
                                    {(m as any).icon}
                                    {m.label}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className={isRtl ? 'text-right' : 'text-left'}>
                                <div className={`text-4xl md:text-5xl font-black tracking-tighter ${m.color}`}>
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
                            <div className="absolute inset-x-0 bottom-0 h-1 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
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
                            <div className="absolute inset-x-0 bottom-0 h-1 bg-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
            {/* Service Discovery Section */}
            <motion.div variants={item} className="space-y-6">
                <div className={`flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <div className={isRtl ? 'text-right' : ''}>
                        <h2 className="text-3xl font-black flex items-center gap-3">
                            <Sparkles className="h-6 w-6 text-primary" />
                            {isRtl ? "اكتشف خدماتنا الإضافية" : "Discover Our Premium Services"}
                        </h2>
                        <p className="text-muted-foreground font-medium opacity-60">
                            {isRtl ? "ارتقِ بعلامتك التجارية إلى المستوى التالي مع حلولنا المختصة." : "Take your brand to the next level with our specialized solutions."}
                        </p>
                    </div>
                    <Link href="/client/services">
                        <Button variant="outline" className="rounded-full font-bold group">
                            {isRtl ? "عرض الكل" : "View All"}
                            <ArrowRight className={`h-4 w-4 ${isRtl ? 'mr-2 rotate-180' : 'ml-2'} group-hover:translate-x-1 transition-transform`} />
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-6">
                    {globalServices
                        .filter(gs => !client.services?.some((s: any) => s.globalServiceId === gs.id))
                        .slice(0, 3)
                        .map((service) => (
                            <Card key={service.id} className="glass-card border-none overflow-hidden rounded-3xl group hover:bg-white/5 transition-all">
                                <CardContent className="p-8 space-y-4">
                                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 p-3">
                                        <Sparkles className="h-full w-full" />
                                    </div>
                                    <h3 className={`text-xl font-black ${isRtl ? 'text-right' : ''}`}>
                                        {isRtl ? service.nameAr : service.nameEn}
                                    </h3>
                                    <p className={`text-sm text-muted-foreground font-medium line-clamp-2 ${isRtl ? 'text-right' : ''}`}>
                                        {isRtl ? service.descriptionAr : service.descriptionEn}
                                    </p>
                                    <div className={`pt-4 ${isRtl ? 'text-right' : ''}`}>
                                        <Link href={`/client/services?request=${service.id}`}>
                                            <Button className="w-full rounded-full font-black uppercase tracking-widest text-xs h-10">
                                                {isRtl ? "طلب الخدمة" : "Request Service"}
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                </div>
            </motion.div>
        </motion.div>
    );
}
