"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Users, FileText, CheckCircle, Clock, ArrowRight,
    UserPlus, TrendingUp, AlertCircle, Activity,
} from "lucide-react";
import Link from "next/link";
import { DeadlineTicker } from "@/components/dashboard/deadline-ticker";
import { ReminderButton } from "@/components/dashboard/reminder-button";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { ClickupDueTodayWidget } from "@/components/clickup/clickup-due-today-widget";
import { useLanguage } from "@/contexts/language-context";
import { motion, Variants } from "framer-motion";
import { cn } from "@/lib/utils";

const container: Variants = {
    hidden: { opacity: 0 },
    show:   { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item: Variants = {
    hidden: { opacity: 0, y: 12 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

const STAT_STYLES = [
    { icon: "text-blue-500",    bg: "bg-blue-500/8",    border: "border-blue-500/20"    },
    { icon: "text-amber-500",   bg: "bg-amber-500/8",   border: "border-amber-500/20"   },
    { icon: "text-emerald-500", bg: "bg-emerald-500/8", border: "border-emerald-500/20" },
    { icon: "text-primary",     bg: "bg-primary/8",     border: "border-primary/20"     },
    { icon: "text-violet-500",  bg: "bg-violet-500/8",  border: "border-violet-500/20"  },
];

export function AdminDashboardView({ clients, role }: { clients: any[]; role?: string }) {
    const { t, isRtl } = useLanguage();
    const isAdmin = role === "ADMIN";

    const totalClients   = clients.length;
    const pendingPlans   = clients.filter(c => c.actionPlans?.some((p: any) => p.status === "PENDING")).length;
    const reportsSent    = clients.filter(c => c.reports?.some((r: any) => r.status === "SENT")).length;
    const totalPlans     = clients.reduce((acc, c) => acc + (c.actionPlans?.length || 0), 0);
    const totalRevenue   = clients.reduce((acc, c) => acc + (c.monthlyFee || 0), 0);
    const topClients     = [...clients].sort((a, b) => (b.monthlyFee || 0) - (a.monthlyFee || 0)).slice(0, 5);

    const stats = [
        { label: t("dashboard.active_clients"),    value: totalClients,  icon: Users,        href: "/admin/clients" },
        { label: t("dashboard.pending_approvals"), value: pendingPlans,  icon: Clock,        href: "/admin/clients" },
        { label: t("dashboard.reports_this_month"),value: reportsSent,   icon: CheckCircle,  href: "/admin/clients" },
        { label: t("dashboard.managed_plans"),     value: totalPlans,    icon: FileText,     href: "/admin/clients" },
        ...(isAdmin ? [{
            label: isRtl ? "الإيرادات الشهرية" : "Monthly Revenue",
            value: `${totalRevenue.toLocaleString()} SAR`,
            icon: TrendingUp,
            href: "/admin/clients",
        }] : []),
    ];

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6" dir={isRtl ? "rtl" : "ltr"}>

            {/* ── Page Header ── */}
            <motion.div variants={item} className={cn(
                "flex flex-col sm:flex-row sm:items-start justify-between gap-4",
                isRtl ? "text-right" : "",
            )}>
                <div className="space-y-1">
                    <p className="section-label">
                        {isRtl ? "لوحة الإدارة" : "Admin Control Panel"}
                    </p>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {t("dashboard.agency_oversight")}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {t("dashboard.ops_status")}
                    </p>
                </div>
                <div className={cn("flex flex-wrap items-center gap-2", isRtl ? "flex-row-reverse" : "")}>
                    <div className="surface px-3 py-2 rounded-lg">
                        <DeadlineTicker />
                    </div>
                    {isAdmin && (
                        <Link href="/admin/clients">
                            <Button size="sm">
                                <UserPlus className="h-3.5 w-3.5" />
                                {isRtl ? "إضافة عميل" : "Add Client"}
                            </Button>
                        </Link>
                    )}
                </div>
            </motion.div>

            {/* ── KPI Stats ── */}
            <div className={cn(
                "grid gap-3",
                isAdmin ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-5" : "grid-cols-2 md:grid-cols-4",
            )}>
                {stats.map((stat, idx) => {
                    const s = STAT_STYLES[idx % STAT_STYLES.length];
                    return (
                        <motion.div key={stat.label} variants={item}>
                            <Link href={stat.href}>
                                <Card className={cn(
                                    "h-full hover:border-border transition-all duration-150 cursor-pointer group",
                                    "hover:shadow-[0_2px_8px_rgb(0_0_0/0.06)]",
                                )}>
                                    <CardHeader className={cn(
                                        "flex flex-row items-center justify-between pb-2",
                                        isRtl ? "flex-row-reverse" : "",
                                    )}>
                                        <CardTitle className="section-label text-[10px]">{stat.label}</CardTitle>
                                        <div className={cn("p-1.5 rounded-md", s.bg)}>
                                            <stat.icon className={cn("h-3.5 w-3.5", s.icon)} />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className={cn(
                                            "text-2xl font-bold tracking-tight",
                                            isRtl ? "text-right" : "",
                                        )}>
                                            {stat.value}
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        </motion.div>
                    );
                })}
            </div>

            {/* ── Client Health + Side Panel ── */}
            <div className="grid gap-4 md:grid-cols-7">
                {/* Client list */}
                <motion.div variants={item} className="md:col-span-4">
                    <Card className="h-full">
                        <CardHeader className={cn(
                            "flex flex-row items-center justify-between border-b border-border pb-4",
                            isRtl ? "flex-row-reverse" : "",
                        )}>
                            <div className={isRtl ? "text-right" : ""}>
                                <CardTitle className="text-[15px]">{t("dashboard.client_health")}</CardTitle>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {isRtl ? "حالة جميع المحافظ النشطة" : "Status of all active portfolios"}
                                </p>
                            </div>
                            <Link
                                href="/admin/clients"
                                className={cn(
                                    "flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors",
                                    isRtl ? "flex-row-reverse" : "",
                                )}
                            >
                                {t("dashboard.view_all")}
                                <ArrowRight className={cn("h-3 w-3", isRtl ? "rotate-180" : "")} />
                            </Link>
                        </CardHeader>
                        <CardContent className="p-2">
                            <div className="space-y-0.5">
                                {clients.slice(0, 8).map((client) => {
                                    const latestPlan   = client.actionPlans?.[0];
                                    const latestReport = client.reports?.[0];
                                    const hasIssue     = !latestReport || latestReport.status !== "SENT"
                                        || !latestPlan || latestPlan.status !== "APPROVED";

                                    return (
                                        <Link href={`/admin/clients/${client.id}`} key={client.id}>
                                            <div className={cn(
                                                "flex items-center justify-between px-3 py-2.5 rounded-lg",
                                                "hover:bg-muted transition-colors duration-100 group",
                                                isRtl ? "flex-row-reverse" : "",
                                            )}>
                                                <div className={cn("flex items-center gap-2.5 min-w-0", isRtl ? "flex-row-reverse" : "")}>
                                                    {/* Avatar */}
                                                    <div className="relative h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary text-sm shrink-0">
                                                        {client.name.charAt(0).toUpperCase()}
                                                        {hasIssue && (
                                                            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-amber-500 rounded-full border-2 border-card" />
                                                        )}
                                                    </div>
                                                    <div className={cn("min-w-0", isRtl ? "text-right" : "")}>
                                                        <p className="text-sm font-medium truncate">{client.name}</p>
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {client.accountManager?.firstName || (isRtl ? "غير معيّن" : "Unassigned")}
                                                            {" · "}
                                                            <span className="uppercase">{client.package}</span>
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className={cn("flex items-center gap-3 shrink-0", isRtl ? "flex-row-reverse" : "")}>
                                                    <div className="text-center hidden sm:block">
                                                        <p className="section-label text-[9px]">{t("dashboard.plan")}</p>
                                                        <Badge
                                                            variant={latestPlan?.status === "APPROVED" ? "success" : "warning"}
                                                            className="text-[9px] px-1.5 py-0 mt-0.5"
                                                        >
                                                            {latestPlan?.status
                                                                ? t(`common.status.${latestPlan.status}`)
                                                                : t("dashboard.missing")}
                                                        </Badge>
                                                    </div>
                                                    <div className="text-center hidden sm:block">
                                                        <p className="section-label text-[9px]">{t("dashboard.report")}</p>
                                                        <Badge
                                                            variant={latestReport?.status === "SENT" ? "success" : "destructive"}
                                                            className="text-[9px] px-1.5 py-0 mt-0.5"
                                                        >
                                                            {latestReport?.status
                                                                ? t(`common.status.${latestReport.status}`)
                                                                : t("dashboard.pending")}
                                                        </Badge>
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
                                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                            <Users className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <p className="text-sm text-muted-foreground">{t("dashboard.no_clients_found")}</p>
                                        <Link href="/admin/clients">
                                            <Button size="sm">
                                                <UserPlus className="h-3.5 w-3.5" />
                                                {isRtl ? "أضف أول عميل" : "Add First Client"}
                                            </Button>
                                        </Link>
                                    </div>
                                )}

                                {clients.length > 8 && (
                                    <Link href="/admin/clients">
                                        <div className={cn(
                                            "flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors",
                                        )}>
                                            {isRtl
                                                ? `عرض ${clients.length - 8} عميل آخر`
                                                : `View ${clients.length - 8} more clients`}
                                            <ArrowRight className={cn("h-3 w-3", isRtl ? "rotate-180" : "")} />
                                        </div>
                                    </Link>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Side panel */}
                <motion.div variants={item} className="md:col-span-3 flex flex-col gap-4">
                    {/* Revenue leaderboard (ADMIN only) */}
                    {isAdmin && (
                        <Card>
                            <CardHeader className={cn("border-b border-border pb-4", isRtl ? "text-right" : "")}>
                                <div className={cn("flex items-center gap-2", isRtl ? "flex-row-reverse" : "")}>
                                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                                    <CardTitle className="text-[15px]">
                                        {isRtl ? "قائمة كبار العملاء" : "Client Leaderboard"}
                                    </CardTitle>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {isRtl ? "مقارنة حسب الرسوم الشهرية" : "Top clients by monthly fee"}
                                </p>
                            </CardHeader>
                            <CardContent className="p-2">
                                <div className="space-y-0.5">
                                    {topClients.map((client, i) => (
                                        <div
                                            key={client.id}
                                            className={cn(
                                                "flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted transition-colors",
                                                isRtl ? "flex-row-reverse" : "",
                                            )}
                                        >
                                            <div className={cn("flex items-center gap-2.5", isRtl ? "flex-row-reverse" : "")}>
                                                <div className={cn(
                                                    "w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold",
                                                    i === 0 ? "bg-amber-500/15 text-amber-500"
                                                        : i === 1 ? "bg-zinc-400/15 text-zinc-400"
                                                        : i === 2 ? "bg-orange-600/15 text-orange-600"
                                                        : "bg-muted text-muted-foreground",
                                                )}>
                                                    {i + 1}
                                                </div>
                                                <div className={cn(isRtl ? "text-right" : "")}>
                                                    <p className="text-sm font-medium">{client.name}</p>
                                                    <p className="text-xs text-muted-foreground uppercase">
                                                        {client.industry || "—"}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-sm font-semibold text-emerald-500">
                                                {(client.monthlyFee || 0).toLocaleString()} SAR
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Activity feed */}
                    <Card className="flex-1">
                        <CardHeader className={cn("border-b border-border pb-4", isRtl ? "text-right" : "")}>
                            <div className={cn("flex items-center gap-2", isRtl ? "flex-row-reverse" : "")}>
                                <Activity className="h-4 w-4 text-primary" />
                                <CardTitle className="text-[15px]">{t("dashboard.internal_feed")}</CardTitle>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {isRtl ? "آخر التحديثات الداخلية" : "Agency-wide updates"}
                            </p>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <ActivityFeed />
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* ── ClickUp Widget ── */}
            <motion.div variants={item}>
                <ClickupDueTodayWidget />
            </motion.div>
        </motion.div>
    );
}
