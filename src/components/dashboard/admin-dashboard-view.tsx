"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, CheckCircle, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { DeadlineTicker } from "@/components/dashboard/deadline-ticker";
import { ReminderButton } from "@/components/dashboard/reminder-button";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { useLanguage } from "@/contexts/language-context";
import { motion, Variants } from "framer-motion";

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

export function AdminDashboardView({ clients }: { clients: any[] }) {
    const { t, isRtl } = useLanguage();

    // Calculate stats
    const totalClients = clients.length;
    const pendingPlans = clients.filter(c => c.actionPlans?.some((p: any) => p.status === "PENDING")).length;
    const reportsThisMonth = clients.filter(c => c.reports?.some((r: any) => r.status === "SENT")).length;

    const stats = [
        { label: t("dashboard.active_clients"), value: totalClients, icon: Users, color: "text-blue-500" },
        { label: t("dashboard.pending_approvals"), value: pendingPlans, icon: Clock, color: "text-orange-500" },
        { label: t("dashboard.reports_this_month"), value: reportsThisMonth, icon: CheckCircle, color: "text-emerald-500" },
        { label: t("dashboard.managed_plans"), value: clients.reduce((acc, c) => acc + (c.actionPlans?.length || 0), 0), icon: FileText, color: "text-primary" },
    ];

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8"
            dir={isRtl ? "rtl" : "ltr"}
        >
            <motion.div variants={item} className={`flex flex-col md:flex-row md:items-center justify-between gap-6 ${isRtl ? 'text-right' : 'text-left'}`}>
                <div className="space-y-1">
                    <h1 className="text-5xl font-black tracking-tighter premium-gradient-text uppercase">
                        {t("dashboard.agency_oversight")}
                    </h1>
                    <p className="text-muted-foreground font-medium text-lg opacity-80">
                        {t("dashboard.ops_status")}
                    </p>
                </div>
                <div className="glass-card p-4 rounded-2xl border-white/10">
                    <DeadlineTicker />
                </div>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <motion.div key={stat.label} variants={item}>
                        <Card className="glass-card hover-lift border-none overflow-hidden group">
                            <CardHeader className={`flex flex-row items-center justify-between pb-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary/60">
                                    {stat.label}
                                </CardTitle>
                                <stat.icon className={`h-4 w-4 ${stat.color} transition-transform group-hover:scale-125`} />
                            </CardHeader>
                            <CardContent className={isRtl ? 'text-right' : 'text-left'}>
                                <div className="text-4xl font-black tracking-tighter">{stat.value}</div>
                            </CardContent>
                            <div className="absolute inset-0 classic-shimmer animate-shimmer -translate-x-full pointer-events-none" />
                        </Card>
                    </motion.div>
                ))}
            </div>

            <div className="grid gap-8 md:grid-cols-7">
                <motion.div variants={item} className="md:col-span-4 h-full">
                    <Card className="glass-card border-none overflow-hidden h-full">
                        <CardHeader className={`flex flex-row items-center justify-between border-b border-white/5 pb-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <div>
                                <CardTitle className="text-xl font-black tracking-tight">{t("dashboard.client_health")}</CardTitle>
                                <p className="text-xs text-muted-foreground font-medium mt-1">Real-time status of all active portfolios</p>
                            </div>
                            <Link href="/admin/clients" className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-1 hover:opacity-70 transition-opacity">
                                {t("dashboard.view_all")} <ArrowRight className={`h-3 w-3 ${isRtl ? 'rotate-180' : ''}`} />
                            </Link>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-4">
                                {clients.map((client) => {
                                    const latestPlan = client.actionPlans?.[0];
                                    const latestReport = client.reports?.[0];
                                    const needsReport = !latestReport || latestReport.status !== "SENT";
                                    const needsPlan = !latestPlan || latestPlan.status !== "APPROVED";

                                    return (
                                        <div key={client.id} className={`flex flex-col md:flex-row md:items-center justify-between p-5 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all group gap-4 ${isRtl ? 'flex-row-reverse text-right' : ''}`}>
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary transition-transform group-hover:scale-110">
                                                    {client.name.substring(0, 1).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-black tracking-tight text-lg">{client.name}</span>
                                                    <span className={`text-[10px] uppercase font-black text-primary/40 tracking-wider ${isRtl ? 'text-right' : 'text-left'}`}>
                                                        {client.accountManager?.firstName || "Unassigned"} • {client.package}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className={`flex items-center gap-8 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                                <div className={`flex flex-col ${isRtl ? 'items-start' : 'items-end'}`}>
                                                    <span className="text-[9px] uppercase font-black text-muted-foreground tracking-tighter opacity-60">{t("dashboard.plan")}</span>
                                                    <span className={`text-xs font-black ${latestPlan?.status === 'APPROVED' ? 'text-emerald-500' : 'text-orange-500'}`}>
                                                        {latestPlan?.status ? t(`common.status.${latestPlan.status}`) : t("dashboard.missing")}
                                                    </span>
                                                </div>
                                                <div className={`flex flex-col ${isRtl ? 'items-start border-r border-white/10 pr-6' : 'items-end border-l border-white/10 pl-6'}`}>
                                                    <span className="text-[9px] uppercase font-black text-muted-foreground tracking-tighter opacity-60">{t("dashboard.report")}</span>
                                                    <span className={`text-xs font-black ${latestReport?.status === 'SENT' ? 'text-emerald-500' : 'text-red-500'}`}>
                                                        {latestReport?.status ? t(`common.status.${latestReport.status}`) : t("dashboard.pending")}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                {client.amId && (needsReport || needsPlan) && (
                                                    <ReminderButton
                                                        type="AM"
                                                        targetId={client.amId}
                                                        label={t("dashboard.remind_am")}
                                                        context={client.name}
                                                        size="xs"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                {clients.length === 0 && (
                                    <div className="text-center py-20 bg-white/5 rounded-2xl border border-dashed border-white/10">
                                        <p className="text-muted-foreground font-bold italic opacity-40">
                                            {t("dashboard.no_clients_found")}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={item} className="md:col-span-3">
                    <Card className="glass-card border-none h-full overflow-hidden">
                        <CardHeader className={`border-b border-white/5 pb-6 ${isRtl ? 'text-right' : 'text-left'}`}>
                            <CardTitle className="text-xl font-black tracking-tight">{t("dashboard.internal_feed")}</CardTitle>
                            <p className="text-xs text-muted-foreground font-medium mt-1">Agency-wide mission updates</p>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <ActivityFeed />
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </motion.div>
    );
}
