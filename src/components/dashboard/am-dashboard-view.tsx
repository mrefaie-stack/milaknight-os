"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReminderButton } from "@/components/dashboard/reminder-button";
import { Users, CheckCircle, Clock, TrendingUp } from "lucide-react";
import Link from "next/link";
import { DeadlineTicker } from "@/components/dashboard/deadline-ticker";
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

export function ClientAMDashboard({ clients, userName }: { clients: any[], userName: string }) {
    const { t, isRtl } = useLanguage();

    const stats = [
        { label: t("dashboard.assigned_clients"), value: clients.length, icon: Users, color: "text-blue-500" },
        { label: t("dashboard.pending_approvals"), value: clients.filter(c => c.actionPlans[0]?.status === "PENDING").length, icon: Clock, color: "text-orange-500" },
        { label: t("dashboard.reports_this_month"), value: clients.filter(c => c.reports[0]?.status === "SENT").length, icon: CheckCircle, color: "text-emerald-500" },
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
                        {t("dashboard.am_hub")}
                    </h1>
                    <p className="text-muted-foreground font-medium text-lg opacity-80">
                        {t("dashboard.managing_portfolios").replace("{name}", userName)}
                    </p>
                </div>
                <div className="glass-card p-4 rounded-2xl border-white/10">
                    <DeadlineTicker />
                </div>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-3">
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
                                <div className="text-5xl font-black tracking-tighter">{stat.value}</div>
                            </CardContent>
                            <div className="absolute inset-0 classic-shimmer animate-shimmer -translate-x-full pointer-events-none" />
                        </Card>
                    </motion.div>
                ))}
            </div>

            <motion.div variants={item} className="grid gap-6">
                <Card className="glass-card border-none overflow-hidden">
                    <CardHeader className={`border-b border-white/5 pb-6 ${isRtl ? 'text-right' : 'text-left'}`}>
                        <CardTitle className="text-xl font-black tracking-tight">{t("dashboard.my_portfolios")}</CardTitle>
                        <p className="text-xs text-muted-foreground font-medium mt-1">{t("dashboard.portfolio_subtitle")}</p>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {clients.map((client) => {
                                const latestPlan = client.actionPlans[0];
                                const latestReport = client.reports[0];

                                return (
                                    <div key={client.id} className="bg-white/5 hover:bg-white/10 transition-all border border-white/5 shadow-none group relative overflow-hidden rounded-2xl p-6 space-y-6">
                                        <div className={`flex justify-between items-start ${isRtl ? 'flex-row-reverse text-right' : ''}`}>
                                            <div className="space-y-1">
                                                <h3 className="font-black text-xl tracking-tight">{client.name}</h3>
                                                <p className="text-[9px] uppercase font-black text-primary tracking-[0.2em]">{client.package} {t("dashboard.mission_label")}</p>
                                            </div>
                                            <Link href={`/am/clients/${client.id}`}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all">
                                                    <TrendingUp className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </div>

                                        <div className={`grid grid-cols-2 gap-3 ${isRtl ? 'text-right' : 'text-left'}`}>
                                            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                                <p className="text-[9px] uppercase font-black text-muted-foreground tracking-tighter opacity-60">{t("dashboard.plan")}</p>
                                                <p className={`text-xs font-black mt-1 ${latestPlan?.status === 'APPROVED' ? 'text-emerald-500' : 'text-orange-500'}`}>
                                                    {latestPlan?.status ? t(`common.status.${latestPlan.status}`) : t("dashboard.none")}
                                                </p>
                                            </div>
                                            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                                <p className="text-[9px] uppercase font-black text-muted-foreground tracking-tighter opacity-60">{t("dashboard.report")}</p>
                                                <p className={`text-xs font-black mt-1 ${latestReport?.status === 'SENT' ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                                                    {latestReport?.status ? t(`common.status.${latestReport.status}`) : t("dashboard.pending")}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 pt-2">
                                            <Link href={`/am/action-plans/${latestPlan?.id || 'create'}`} className="flex-1">
                                                <Button variant="secondary" size="sm" className="w-full text-[10px] font-black h-9 uppercase tracking-widest bg-white/10 hover:bg-white/20">{t("dashboard.plan")}</Button>
                                            </Link>
                                            <Link href={`/am/reports/create?clientId=${client.id}`} className="flex-1">
                                                <Button variant="secondary" size="sm" className="w-full text-[10px] font-black h-9 uppercase tracking-widest bg-white/10 hover:bg-white/20">{t("dashboard.report")}</Button>
                                            </Link>
                                        </div>

                                        {latestPlan?.status === "APPROVED" && (
                                            <ReminderButton
                                                type="CLIENT"
                                                targetId={client.id}
                                                label={t("dashboard.remind_client")}
                                                variant="ghost"
                                                size="xs"
                                                className={`w-full text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary ${isRtl ? 'flex-row-reverse' : ''}`}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
}
