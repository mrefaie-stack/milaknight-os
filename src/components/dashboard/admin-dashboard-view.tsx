"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, FileText, CheckCircle, Clock, ArrowRight, UserPlus, TrendingUp, AlertCircle } from "lucide-react";
import Link from "next/link";
import { DeadlineTicker } from "@/components/dashboard/deadline-ticker";
import { ReminderButton } from "@/components/dashboard/reminder-button";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { useLanguage } from "@/contexts/language-context";
import { motion, Variants } from "framer-motion";

const container: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};
const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const STAT_COLORS = [
    { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-500", glow: "shadow-blue-500/10" },
    { bg: "bg-orange-500/10", border: "border-orange-500/20", text: "text-orange-500", glow: "shadow-orange-500/10" },
    { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-500", glow: "shadow-emerald-500/10" },
    { bg: "bg-primary/10", border: "border-primary/20", text: "text-primary", glow: "shadow-primary/10" },
];

export function AdminDashboardView({ clients }: { clients: any[] }) {
    const { t, isRtl } = useLanguage();

    const totalClients = clients.length;
    const pendingPlans = clients.filter(c => c.actionPlans?.some((p: any) => p.status === "PENDING")).length;
    const reportsThisMonth = clients.filter(c => c.reports?.some((r: any) => r.status === "SENT")).length;
    const totalPlans = clients.reduce((acc, c) => acc + (c.actionPlans?.length || 0), 0);

    const stats = [
        { label: t("dashboard.active_clients"), value: totalClients, icon: Users, href: "/admin/clients" },
        { label: t("dashboard.pending_approvals"), value: pendingPlans, icon: Clock, href: "/admin/clients" },
        { label: t("dashboard.reports_this_month"), value: reportsThisMonth, icon: CheckCircle, href: "/admin/clients" },
        { label: t("dashboard.managed_plans"), value: totalPlans, icon: FileText, href: "/admin/clients" },
    ];

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-8" dir={isRtl ? "rtl" : "ltr"}>

            {/* ── Hero Header ── */}
            <motion.div variants={item} className={`flex flex-col md:flex-row md:items-center justify-between gap-6 ${isRtl ? 'text-right' : 'text-left'}`}>
                <div className="space-y-1">
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-primary/40">
                        {isRtl ? "لوحة تحكم الإدارة" : "Admin Control Panel"}
                    </p>
                    <h1 className="text-5xl md:text-6xl font-black tracking-tighter premium-gradient-text uppercase">
                        {t("dashboard.agency_oversight")}
                    </h1>
                    <p className="text-muted-foreground font-medium text-lg opacity-80">
                        {t("dashboard.ops_status")}
                    </p>
                </div>
                <div className={`flex flex-wrap gap-3 items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <div className="glass-card p-4 rounded-2xl border-white/10">
                        <DeadlineTicker />
                    </div>
                    <Link href="/admin/clients">
                        <Button className="h-12 px-6 rounded-full font-black uppercase tracking-widest bg-gradient-to-r from-primary to-purple-600 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300">
                            <UserPlus className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                            {isRtl ? "إضافة عميل" : "Add Client"}
                        </Button>
                    </Link>
                </div>
            </motion.div>

            {/* ── KPI Cards ── */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, idx) => {
                    const c = STAT_COLORS[idx];
                    return (
                        <motion.div key={stat.label} variants={item}>
                            <Link href={stat.href}>
                                <Card className={`glass-card hover-lift border ${c.border} overflow-hidden group cursor-pointer shadow-xl ${c.glow}`}>
                                    <CardHeader className={`flex flex-row items-center justify-between pb-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70">
                                            {stat.label}
                                        </CardTitle>
                                        <div className={`p-2 rounded-xl ${c.bg} group-hover:scale-110 transition-transform`}>
                                            <stat.icon className={`h-4 w-4 ${c.text}`} />
                                        </div>
                                    </CardHeader>
                                    <CardContent className={isRtl ? 'text-right' : 'text-left'}>
                                        <div className={`text-5xl font-black tracking-tighter ${c.text}`}>{stat.value}</div>
                                    </CardContent>
                                    <div className={`h-1 ${c.bg} border-t ${c.border} scale-x-0 group-hover:scale-x-100 transition-transform origin-left`} />
                                </Card>
                            </Link>
                        </motion.div>
                    );
                })}
            </div>

            {/* ── Client Health + Activity ── */}
            <div className="grid gap-8 md:grid-cols-7">
                <motion.div variants={item} className="md:col-span-4 h-full">
                    <Card className="glass-card border-none overflow-hidden h-full">
                        <CardHeader className={`flex flex-row items-center justify-between border-b border-white/5 pb-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <div>
                                <CardTitle className="text-xl font-black tracking-tight">{t("dashboard.client_health")}</CardTitle>
                                <p className="text-xs text-muted-foreground font-medium mt-1">
                                    {isRtl ? 'حالة جميع المحافظ النشطة' : 'Real-time status of all active portfolios'}
                                </p>
                            </div>
                            <Link href="/admin/clients" className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-1 hover:opacity-70 transition-opacity">
                                {t("dashboard.view_all")} <ArrowRight className={`h-3 w-3 ${isRtl ? 'rotate-180' : ''}`} />
                            </Link>
                        </CardHeader>
                        <CardContent className="pt-4 px-4 pb-4">
                            <div className="space-y-2">
                                {clients.slice(0, 8).map((client) => {
                                    const latestPlan = client.actionPlans?.[0];
                                    const latestReport = client.reports?.[0];
                                    const needsReport = !latestReport || latestReport.status !== "SENT";
                                    const needsPlan = !latestPlan || latestPlan.status !== "APPROVED";
                                    const hasIssue = needsReport || needsPlan;

                                    return (
                                        <Link href={`/admin/clients/${client.id}`} key={client.id}>
                                            <div className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/3 hover:bg-white/8 hover:border-primary/20 transition-all group gap-3 ${isRtl ? 'flex-row-reverse text-right' : ''}`}>
                                                <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                                    <div className="relative h-10 w-10 rounded-full bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center font-black text-primary text-lg shrink-0">
                                                        {client.name.substring(0, 1).toUpperCase()}
                                                        {hasIssue && (
                                                            <span className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-orange-500 rounded-full border-2 border-background" />
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-black tracking-tight truncate">{client.name}</span>
                                                        <span className="text-[10px] uppercase font-black text-primary/40 tracking-wider">
                                                            {client.accountManager?.firstName || (isRtl ? "غير معيّن" : "Unassigned")} · {client.package}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className={`flex items-center gap-6 shrink-0 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-[9px] uppercase font-black text-muted-foreground opacity-50">{t("dashboard.plan")}</span>
                                                        <span className={`text-xs font-black ${latestPlan?.status === 'APPROVED' ? 'text-emerald-500' : 'text-orange-500'}`}>
                                                            {latestPlan?.status ? t(`common.status.${latestPlan.status}`) : t("dashboard.missing")}
                                                        </span>
                                                    </div>
                                                    <div className={`flex flex-col items-center border-border/30 ${isRtl ? 'border-r pr-6' : 'border-l pl-6'}`}>
                                                        <span className="text-[9px] uppercase font-black text-muted-foreground opacity-50">{t("dashboard.report")}</span>
                                                        <span className={`text-xs font-black ${latestReport?.status === 'SENT' ? 'text-emerald-500' : 'text-red-500'}`}>
                                                            {latestReport?.status ? t(`common.status.${latestReport.status}`) : t("dashboard.pending")}
                                                        </span>
                                                    </div>
                                                    {client.amId && hasIssue && (
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
                                        </Link>
                                    );
                                })}
                                {clients.length === 0 && (
                                    <div className="text-center py-20 bg-white/5 rounded-2xl border border-dashed border-white/10">
                                        <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-20" />
                                        <p className="text-muted-foreground font-bold italic opacity-40">{t("dashboard.no_clients_found")}</p>
                                        <Link href="/admin/clients" className="mt-4 inline-block">
                                            <Button size="sm" className="rounded-full mt-2 font-black uppercase tracking-wide">
                                                <UserPlus className="h-3 w-3 mr-2" /> {isRtl ? "أضف أول عميل" : "Add First Client"}
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                                {clients.length > 8 && (
                                    <Link href="/admin/clients">
                                        <div className="text-center py-3 text-xs font-black uppercase tracking-widest text-primary hover:opacity-70 transition-opacity">
                                            {isRtl ? `عرض ${clients.length - 8} عميل آخر` : `View ${clients.length - 8} more clients`} →
                                        </div>
                                    </Link>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={item} className="md:col-span-3">
                    <Card className="glass-card border-none h-full overflow-hidden">
                        <CardHeader className={`border-b border-white/5 pb-6 ${isRtl ? 'text-right' : 'text-left'}`}>
                            <CardTitle className="text-xl font-black tracking-tight">{t("dashboard.internal_feed")}</CardTitle>
                            <p className="text-xs text-muted-foreground font-medium mt-1">
                                {isRtl ? "آخر التحديثات الداخلية" : "Agency-wide mission updates"}
                            </p>
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
