"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReminderButton } from "@/components/dashboard/reminder-button";
import { Users, CheckCircle, Clock, TrendingUp, ArrowRight, FileText } from "lucide-react";
import Link from "next/link";
import { DeadlineTicker } from "@/components/dashboard/deadline-ticker";
import { ClickupDueTodayWidget } from "@/components/clickup/clickup-due-today-widget";
import { useLanguage } from "@/contexts/language-context";
import { motion, Variants } from "framer-motion";
import { cn } from "@/lib/utils";

const container: Variants = {
    hidden: { opacity: 0 },
    show:   { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item: Variants = {
    hidden: { opacity: 0, y: 12 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

export function ClientAMDashboard({ clients, userName }: { clients: any[]; userName: string }) {
    const { t, isRtl } = useLanguage();

    const stats = [
        {
            label: t("dashboard.assigned_clients"),
            value: clients.length,
            icon: Users,
            iconClass: "text-blue-500",
            bg: "bg-blue-500/8",
        },
        {
            label: t("dashboard.pending_approvals"),
            value: clients.filter(c => c.actionPlans[0]?.status === "PENDING").length,
            icon: Clock,
            iconClass: "text-amber-500",
            bg: "bg-amber-500/8",
        },
        {
            label: t("dashboard.reports_this_month"),
            value: clients.filter(c => c.reports[0]?.status === "SENT").length,
            icon: CheckCircle,
            iconClass: "text-emerald-500",
            bg: "bg-emerald-500/8",
        },
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
                        {isRtl ? "مدير الحساب" : "Account Manager"}
                    </p>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {t("dashboard.am_hub")}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {t("dashboard.managing_portfolios").replace("{name}", userName)}
                    </p>
                </div>
                <div className="surface px-3 py-2 rounded-lg shrink-0">
                    <DeadlineTicker />
                </div>
            </motion.div>

            {/* ── Stats ── */}
            <div className="grid gap-3 grid-cols-3">
                {stats.map((stat) => (
                    <motion.div key={stat.label} variants={item}>
                        <Card>
                            <CardHeader className={cn(
                                "flex flex-row items-center justify-between pb-2",
                                isRtl ? "flex-row-reverse" : "",
                            )}>
                                <CardTitle className="section-label text-[10px]">{stat.label}</CardTitle>
                                <div className={cn("p-1.5 rounded-md", stat.bg)}>
                                    <stat.icon className={cn("h-3.5 w-3.5", stat.iconClass)} />
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
                    </motion.div>
                ))}
            </div>

            {/* ── Portfolio Grid ── */}
            <motion.div variants={item}>
                <Card>
                    <CardHeader className={cn("border-b border-border pb-4", isRtl ? "text-right" : "")}>
                        <CardTitle className="text-[15px]">{t("dashboard.my_portfolios")}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("dashboard.portfolio_subtitle")}</p>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {clients.map((client) => {
                                const latestPlan   = client.actionPlans[0];
                                const latestReport = client.reports[0];

                                return (
                                    <div
                                        key={client.id}
                                        className="flex flex-col gap-4 p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                                    >
                                        {/* Client header */}
                                        <div className={cn(
                                            "flex items-start justify-between",
                                            isRtl ? "flex-row-reverse text-right" : "",
                                        )}>
                                            <div className="space-y-0.5 min-w-0">
                                                <h3 className="font-semibold text-[15px] truncate">{client.name}</h3>
                                                <Badge variant="ghost" className="text-[10px] uppercase px-1.5">
                                                    {client.package}
                                                </Badge>
                                            </div>
                                            <Link href={`/am/clients/${client.id}`}>
                                                <Button variant="ghost" size="icon-sm" className="shrink-0">
                                                    <ArrowRight className={cn("h-3.5 w-3.5", isRtl ? "rotate-180" : "")} />
                                                </Button>
                                            </Link>
                                        </div>

                                        {/* Status pills */}
                                        <div className={cn("grid grid-cols-2 gap-2", isRtl ? "text-right" : "")}>
                                            <div className="p-2.5 rounded-md bg-background border border-border">
                                                <p className="section-label text-[9px] mb-1">{t("dashboard.plan")}</p>
                                                <Badge
                                                    variant={latestPlan?.status === "APPROVED" ? "success" : "warning"}
                                                    className="text-[9px] px-1.5 py-0"
                                                >
                                                    {latestPlan?.status
                                                        ? t(`common.status.${latestPlan.status}`)
                                                        : t("dashboard.none")}
                                                </Badge>
                                            </div>
                                            <div className="p-2.5 rounded-md bg-background border border-border">
                                                <p className="section-label text-[9px] mb-1">{t("dashboard.report")}</p>
                                                <Badge
                                                    variant={latestReport?.status === "SENT" ? "success" : "ghost"}
                                                    className="text-[9px] px-1.5 py-0"
                                                >
                                                    {latestReport?.status
                                                        ? t(`common.status.${latestReport.status}`)
                                                        : t("dashboard.pending")}
                                                </Badge>
                                            </div>
                                        </div>

                                        {/* Quick actions */}
                                        <div className={cn("flex gap-2", isRtl ? "flex-row-reverse" : "")}>
                                            <Link href={`/am/action-plans/${latestPlan?.id || "create"}`} className="flex-1">
                                                <Button variant="outline" size="sm" className="w-full text-xs">
                                                    <FileText className="h-3 w-3" />
                                                    {t("dashboard.plan")}
                                                </Button>
                                            </Link>
                                            <Link href={`/am/reports/create?clientId=${client.id}`} className="flex-1">
                                                <Button variant="outline" size="sm" className="w-full text-xs">
                                                    <TrendingUp className="h-3 w-3" />
                                                    {t("dashboard.report")}
                                                </Button>
                                            </Link>
                                        </div>

                                        {latestPlan?.status === "APPROVED" && (
                                            <ReminderButton
                                                type="CLIENT"
                                                targetId={client.id}
                                                label={t("dashboard.remind_client")}
                                                variant="ghost"
                                                size="xs"
                                                className={cn(
                                                    "w-full text-xs text-muted-foreground hover:text-primary",
                                                    isRtl ? "flex-row-reverse" : "",
                                                )}
                                            />
                                        )}
                                    </div>
                                );
                            })}

                            {clients.length === 0 && (
                                <div className="col-span-full flex flex-col items-center justify-center py-12 gap-3 text-center">
                                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                        <Users className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {isRtl ? "لا يوجد عملاء معينون بعد" : "No clients assigned yet"}
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* ── ClickUp Widget ── */}
            <motion.div variants={item}>
                <ClickupDueTodayWidget />
            </motion.div>
        </motion.div>
    );
}
