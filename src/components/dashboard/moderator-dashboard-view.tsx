"use client";

import { useLanguage } from "@/contexts/language-context";
import { CheckCircle2, Calendar, Layers, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, Variants } from "framer-motion";

const container: Variants = {
    hidden: { opacity: 0 },
    show:   { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item: Variants = {
    hidden: { opacity: 0, y: 10 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

export function ModeratorDashboardView({ plans }: { plans: any[] }) {
    const { isRtl } = useLanguage();

    const approvedCount  = plans.filter(p => p.status === "APPROVED").length;
    const scheduledCount = plans.filter(p => p.status === "SCHEDULED").length;

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6" dir={isRtl ? "rtl" : "ltr"}>

            {/* ── Header ── */}
            <motion.div variants={item}>
                <Card className="border-border">
                    <CardHeader className={cn("pb-4", isRtl ? "text-right" : "")}>
                        <div className={cn("flex items-center gap-2 mb-2", isRtl ? "flex-row-reverse" : "")}>
                            <div className="p-1.5 rounded-md bg-emerald-500/10">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            </div>
                            <span className="section-label text-emerald-500">
                                {isRtl ? "ناشر المحتوى" : "Moderator"}
                            </span>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">
                                {isRtl ? "أهلاً بك" : "Welcome back"}
                                {" — "}
                                <span className="text-emerald-500">
                                    {isRtl ? "جاهز للنشر اليوم؟" : "Ready to publish today?"}
                                </span>
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                {isRtl
                                    ? "لديك الوصول فقط للخطط المعتمدة من قبل العميل لتسهيل عملية النشر والجدولة."
                                    : "You only have access to client-approved plans to facilitate publishing and scheduling."}
                            </p>
                        </div>
                    </CardHeader>
                </Card>
            </motion.div>

            {/* ── Stats ── */}
            <motion.div variants={item} className="grid grid-cols-3 gap-3">
                {[
                    {
                        label: isRtl ? "بانتظار النشر" : "Awaiting Publish",
                        value: approvedCount,
                        icon: Layers,
                        iconClass: "text-emerald-500",
                        bg: "bg-emerald-500/10",
                    },
                    {
                        label: isRtl ? "مجدول" : "Scheduled",
                        value: scheduledCount,
                        icon: Calendar,
                        iconClass: "text-blue-500",
                        bg: "bg-blue-500/10",
                    },
                    {
                        label: isRtl ? "الإجمالي" : "Total Plans",
                        value: plans.length,
                        icon: CheckCircle2,
                        iconClass: "text-muted-foreground",
                        bg: "bg-muted",
                    },
                ].map((stat) => (
                    <Card key={stat.label}>
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
                            <div className={cn("text-2xl font-bold tracking-tight", isRtl ? "text-right" : "")}>
                                {stat.value}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </motion.div>

            {/* ── Recent Plans ── */}
            <motion.div variants={item} className="space-y-3">
                <div className={cn("flex items-center justify-between", isRtl ? "flex-row-reverse" : "")}>
                    <h2 className="text-[15px] font-semibold">
                        {isRtl ? "الخطط الأخيرة" : "Recent Plans"}
                    </h2>
                    <Link
                        href="/moderator/action-plans"
                        className="text-xs font-medium hover:underline text-emerald-500"
                    >
                        {isRtl ? "عرض الكل" : "View All"}
                    </Link>
                </div>

                <div className="space-y-1.5">
                    {plans.length > 0 ? (
                        plans.slice(0, 5).map((plan) => (
                            <Link
                                key={plan.id}
                                href={`/moderator/action-plans/${plan.id}`}
                                className={cn(
                                    "group flex items-center justify-between p-3.5 rounded-lg border border-border",
                                    "hover:border-border/80 hover:bg-muted transition-all duration-150",
                                    isRtl ? "flex-row-reverse" : "",
                                )}
                            >
                                <div className={cn("flex items-center gap-3", isRtl ? "flex-row-reverse" : "")}>
                                    <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center overflow-hidden shrink-0 border border-border">
                                        {plan.client?.logoUrl
                                            ? <img src={plan.client.logoUrl} className="w-full h-full object-cover" alt="" />
                                            : <Layers className="h-4 w-4 text-muted-foreground" />
                                        }
                                    </div>
                                    <div className={isRtl ? "text-right" : ""}>
                                        <p className="text-sm font-medium">{plan.month}</p>
                                        <p className="text-xs text-muted-foreground">{plan.client?.name}</p>
                                    </div>
                                </div>

                                <div className={cn("flex items-center gap-3", isRtl ? "flex-row-reverse" : "")}>
                                    <div className={cn("hidden sm:block", isRtl ? "text-left" : "text-right")}>
                                        <Badge
                                            variant={plan.status === "SCHEDULED" ? "success" : "info"}
                                            className="text-[10px]"
                                        >
                                            {plan.status === "SCHEDULED"
                                                ? (isRtl ? "مجدول" : "Scheduled")
                                                : (isRtl ? "جاهز" : "Ready")}
                                        </Badge>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">
                                            {plan.items?.length || 0} {isRtl ? "بند" : "items"}
                                        </p>
                                    </div>
                                    <ChevronRight className={cn(
                                        "h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5",
                                        isRtl ? "rotate-180 group-hover:-translate-x-0.5 group-hover:translate-x-0" : "",
                                    )} />
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 gap-2 rounded-lg border border-dashed border-border">
                            <Layers className="h-8 w-8 text-muted-foreground/30" />
                            <p className="text-sm text-muted-foreground">
                                {isRtl ? "لا توجد خطط معتمدة حالياً" : "No approved plans currently"}
                            </p>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
