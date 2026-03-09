"use client";

import { useLanguage } from "@/contexts/language-context";
import {
    LayoutDashboard,
    CheckCircle2,
    Calendar,
    ExternalLink,
    ChevronRight,
    Layers
} from "lucide-react";
import Link from "next/link";

export function ModeratorDashboardView({ plans }: { plans: any[] }) {
    const { isRtl, t } = useLanguage();

    const approvedCount = plans.length;

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Legend / Hero */}
            <div className="relative rounded-3xl overflow-hidden bg-primary/10 border border-primary/20 p-8 md:p-12">
                <div className="relative z-10 space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                        <CheckCircle2 className="h-4 w-4" />
                        {isRtl ? "لوحة تحكم الناشر" : "MODERATOR DASHBOARD"}
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter">
                        {isRtl ? "أهلاً بك،" : "Welcome back,"}
                        <br />
                        <span className="premium-gradient-text">
                            {isRtl ? "جاهز للنشر اليوم؟" : "Ready to publish today?"}
                        </span>
                    </h1>
                    <p className="text-muted-foreground font-medium max-w-xl">
                        {isRtl
                            ? "لديك الوصول فقط للخطط المعتمدة من قبل العميل لتسهيل عملية النشر والجدولة."
                            : "You only have access to plans approved by the client to facilitate publishing and scheduling."}
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-6 rounded-3xl bg-card border border-white/10 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                            <Layers className="h-5 w-5" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{isRtl ? "الخطط المعتمدة" : "APPROVED PLANS"}</span>
                    </div>
                    <div className="text-3xl font-black">{approvedCount}</div>
                </div>
            </div>

            {/* Recent Approved Plans */}
            <div className="space-y-4">
                <div className={`flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <h2 className="text-xl font-black uppercase tracking-tight">{isRtl ? "خطط بانتظار النشر" : "Plans Awaiting Publishing"}</h2>
                    <Link href="/moderator/action-plans" className="text-xs font-black text-primary hover:underline uppercase tracking-widest">
                        {isRtl ? "عرض الكل" : "VIEW ALL"}
                    </Link>
                </div>

                <div className="grid gap-4">
                    {plans.length > 0 ? (
                        plans.slice(0, 5).map((plan) => (
                            <Link
                                key={plan.id}
                                href={`/moderator/action-plans/${plan.id}`}
                                className={`group flex items-center justify-between p-5 rounded-2xl bg-card border border-white/10 hover:border-primary/30 hover:bg-primary/5 transition-all ${isRtl ? 'flex-row-reverse' : ''}`}
                            >
                                <div className={`flex items-center gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                    <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center overflow-hidden border border-white/5">
                                        {plan.client?.logoUrl ? (
                                            <img src={plan.client.logoUrl} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <Layers className="h-6 w-6 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-lg leading-none mb-1">{plan.month}</h3>
                                        <p className="text-xs text-muted-foreground font-bold">{plan.client?.name}</p>
                                    </div>
                                </div>
                                <div className={`flex items-center gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                    <div className="text-right px-4 hidden sm:block">
                                        <div className="text-xs font-black text-emerald-600 uppercase mb-0.5">{isRtl ? "معتمد" : "APPROVED"}</div>
                                        <div className="text-[10px] text-muted-foreground font-bold">{plan.items?.length || 0} {isRtl ? "بند محتوى" : "items"}</div>
                                    </div>
                                    <div className="p-2 rounded-full bg-primary/5 group-hover:bg-primary group-hover:text-white transition-all">
                                        {isRtl ? <ChevronRight className="h-5 w-5 rotate-180" /> : <ChevronRight className="h-5 w-5" />}
                                    </div>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="py-12 text-center rounded-3xl border-2 border-dashed border-white/5">
                            <p className="text-muted-foreground font-bold">{isRtl ? "لا توجد خطط معتمدة حالياً" : "No approved plans currently"}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
