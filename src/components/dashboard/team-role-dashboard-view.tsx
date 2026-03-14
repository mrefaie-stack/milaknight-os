"use client";

import { useLanguage } from "@/contexts/language-context";
import { CheckCircle2, Calendar, Layers, ChevronRight, Users, TrendingUp } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type RoleConfig = {
    color: string;
    bg: string;
    gradient: string;
    icon: React.ReactNode;
    labelEn: string;
    labelAr: string;
    isLeader: boolean;
    plansHref: string;
    clientsHref?: string;
};

const ROLE_CONFIG: Record<string, RoleConfig> = {
    ART_TEAM: {
        color: "text-pink-400",
        bg: "bg-pink-500/10 border-pink-500/20",
        gradient: "from-pink-500/20 to-pink-700/5",
        icon: <span className="text-3xl">🎨</span>,
        labelEn: "Art Team",
        labelAr: "آرت تيم",
        isLeader: false,
        plansHref: "/art-team/action-plans",
    },
    ART_LEADER: {
        color: "text-pink-300",
        bg: "bg-pink-500/10 border-pink-500/30",
        gradient: "from-pink-500/25 to-pink-700/10",
        icon: <span className="text-3xl">🎨</span>,
        labelEn: "Art Leader",
        labelAr: "آرت ليدر",
        isLeader: true,
        plansHref: "/art-leader/action-plans",
        clientsHref: "/art-leader/clients",
    },
    CONTENT_TEAM: {
        color: "text-violet-400",
        bg: "bg-violet-500/10 border-violet-500/20",
        gradient: "from-violet-500/20 to-violet-700/5",
        icon: <span className="text-3xl">✍️</span>,
        labelEn: "Content Team",
        labelAr: "كونتنت تيم",
        isLeader: false,
        plansHref: "/content-team/action-plans",
    },
    CONTENT_LEADER: {
        color: "text-violet-300",
        bg: "bg-violet-500/10 border-violet-500/30",
        gradient: "from-violet-500/25 to-violet-700/10",
        icon: <span className="text-3xl">✍️</span>,
        labelEn: "Content Leader",
        labelAr: "كونتنت ليدر",
        isLeader: true,
        plansHref: "/content-leader/action-plans",
        clientsHref: "/content-leader/clients",
    },
    SEO_TEAM: {
        color: "text-cyan-400",
        bg: "bg-cyan-500/10 border-cyan-500/20",
        gradient: "from-cyan-500/20 to-cyan-700/5",
        icon: <span className="text-3xl">📈</span>,
        labelEn: "SEO Team",
        labelAr: "سيو تيم",
        isLeader: false,
        plansHref: "/seo-team/action-plans",
    },
    SEO_LEAD: {
        color: "text-cyan-300",
        bg: "bg-cyan-500/10 border-cyan-500/30",
        gradient: "from-cyan-500/25 to-cyan-700/10",
        icon: <span className="text-3xl">📈</span>,
        labelEn: "SEO Lead",
        labelAr: "سيو ليد",
        isLeader: true,
        plansHref: "/seo-lead/action-plans",
        clientsHref: "/seo-lead/clients",
    },
};

type Props = {
    role: string;
    plans: any[];
};

export function TeamRoleDashboardView({ role, plans }: Props) {
    const { isRtl } = useLanguage();
    const cfg = ROLE_CONFIG[role] ?? ROLE_CONFIG.ART_TEAM;

    const approvedCount = plans.filter(p => p.status === "APPROVED").length;
    const scheduledCount = plans.filter(p => p.status === "SCHEDULED").length;

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Hero */}
            <div className={cn("relative rounded-3xl overflow-hidden border p-8 md:p-12 bg-gradient-to-br", cfg.gradient, cfg.bg)}>
                <div className="relative z-10 space-y-3">
                    <div className={cn("flex items-center gap-2 text-[10px] font-black uppercase tracking-widest", cfg.color)}>
                        <CheckCircle2 className="h-4 w-4" />
                        {isRtl ? cfg.labelAr : cfg.labelEn}
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter">
                        {isRtl ? "أهلاً بك،" : "Welcome back,"}
                        <br />
                        <span className={cfg.color}>
                            {isRtl ? "جاهز للعمل اليوم؟" : "Ready to work today?"}
                        </span>
                    </h1>
                    <p className="text-muted-foreground font-medium max-w-xl">
                        {isRtl
                            ? "لديك الوصول للخطط المعتمدة من قبل العميل."
                            : "You have access to client-approved content plans."}
                    </p>
                </div>
                <div className="absolute -bottom-4 -right-4 opacity-10 text-[120px] pointer-events-none select-none">
                    {cfg.icon}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-6 rounded-3xl bg-card border border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className={cn("p-2 rounded-xl", cfg.bg)}>
                            <Layers className={cn("h-5 w-5", cfg.color)} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            {isRtl ? "بانتظار النشر" : "Awaiting Publish"}
                        </span>
                    </div>
                    <div className="text-3xl font-black">{approvedCount}</div>
                </div>

                <div className="p-6 rounded-3xl bg-card border border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-xl bg-blue-500/10">
                            <Calendar className="h-5 w-5 text-blue-400" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            {isRtl ? "مجدول" : "Scheduled"}
                        </span>
                    </div>
                    <div className="text-3xl font-black">{scheduledCount}</div>
                </div>

                <div className="p-6 rounded-3xl bg-card border border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-xl bg-emerald-500/10">
                            <TrendingUp className="h-5 w-5 text-emerald-400" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            {isRtl ? "الإجمالي" : "Total Plans"}
                        </span>
                    </div>
                    <div className="text-3xl font-black">{plans.length}</div>
                </div>
            </div>

            {/* Quick Links for Leaders */}
            {cfg.isLeader && cfg.clientsHref && (
                <div className={cn("p-5 rounded-2xl border flex items-center justify-between gap-4 hover:border-opacity-50 transition-all cursor-pointer", cfg.bg, isRtl && "flex-row-reverse")}>
                    <Link href={cfg.clientsHref} className={cn("flex items-center gap-3 flex-1", isRtl && "flex-row-reverse")}>
                        <div className={cn("p-2.5 rounded-xl", cfg.bg)}>
                            <Users className={cn("h-5 w-5", cfg.color)} />
                        </div>
                        <div className={isRtl ? "text-right" : ""}>
                            <p className="font-black text-sm">{isRtl ? "العملاء" : "Clients"}</p>
                            <p className="text-xs text-muted-foreground">{isRtl ? "عرض جميع العملاء" : "View all clients"}</p>
                        </div>
                        <ChevronRight className={cn("h-4 w-4 text-muted-foreground ml-auto", isRtl && "rotate-180 mr-auto ml-0")} />
                    </Link>
                </div>
            )}

            {/* Recent Plans */}
            <div className="space-y-4">
                <div className={cn("flex items-center justify-between", isRtl && "flex-row-reverse")}>
                    <h2 className="text-xl font-black uppercase tracking-tight">
                        {isRtl ? "الخطط الأخيرة" : "Recent Plans"}
                    </h2>
                    <Link href={cfg.plansHref} className={cn("text-xs font-black uppercase tracking-widest hover:underline", cfg.color)}>
                        {isRtl ? "عرض الكل" : "View All"}
                    </Link>
                </div>

                <div className="grid gap-4">
                    {plans.length > 0 ? (
                        plans.slice(0, 5).map((plan) => (
                            <Link
                                key={plan.id}
                                href={`${cfg.plansHref}/${plan.id}`}
                                className={cn(
                                    "group flex items-center justify-between p-5 rounded-2xl bg-card border border-white/10 hover:border-primary/30 hover:bg-primary/5 transition-all",
                                    isRtl && "flex-row-reverse"
                                )}
                            >
                                <div className={cn("flex items-center gap-4", isRtl && "flex-row-reverse")}>
                                    <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center overflow-hidden border border-white/5">
                                        {plan.client?.logoUrl
                                            ? <img src={plan.client.logoUrl} className="w-full h-full object-cover" alt="" />
                                            : <Layers className="h-6 w-6 text-muted-foreground" />}
                                    </div>
                                    <div className={isRtl ? "text-right" : ""}>
                                        <h3 className="font-black text-lg leading-none mb-1">{plan.month}</h3>
                                        <p className="text-xs text-muted-foreground font-bold">{plan.client?.name}</p>
                                    </div>
                                </div>
                                <div className={cn("flex items-center gap-4", isRtl && "flex-row-reverse")}>
                                    <div className={cn("hidden sm:block", isRtl ? "text-left" : "text-right")}>
                                        <div className={cn("text-xs font-black uppercase mb-0.5",
                                            plan.status === "SCHEDULED" ? "text-emerald-500" : "text-blue-400")}>
                                            {plan.status === "SCHEDULED" ? (isRtl ? "مجدول" : "SCHEDULED") : (isRtl ? "جاهز" : "READY")}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground font-bold">
                                            {plan.items?.length || 0} {isRtl ? "بند" : "items"}
                                        </div>
                                    </div>
                                    <div className="p-2 rounded-full bg-primary/5 group-hover:bg-primary group-hover:text-white transition-all">
                                        <ChevronRight className={cn("h-5 w-5", isRtl && "rotate-180")} />
                                    </div>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="py-12 text-center rounded-3xl border-2 border-dashed border-white/5">
                            <p className="text-muted-foreground font-bold">
                                {isRtl ? "لا توجد خطط معتمدة حالياً" : "No approved plans currently"}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
