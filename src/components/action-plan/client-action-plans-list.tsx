"use client";
import Link from "next/link";
import { FolderKanban, CheckCircle2, Clock, AlertCircle, ChevronRight, ChevronLeft, FileCheck } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

const STATUS_META = {
    DRAFT: { ar: "مسودة", en: "Draft", color: "text-gray-400", bg: "bg-gray-400/10", border: "border-gray-400/20", icon: Clock },
    PENDING: { ar: "قيد المراجعة", en: "Pending", color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20", icon: Clock },
    APPROVED: { ar: "معتمدة", en: "Approved", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: CheckCircle2 },
    REVISION_REQUESTED: { ar: "يحتاج تعديل", en: "Action Needed", color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30", icon: AlertCircle },
    PUBLISHED: { ar: "منشورة", en: "Published", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", icon: FileCheck },
} as const;

export function ClientActionPlansList({ plans }: { plans: any[] }) {
    const { isRtl } = useLanguage();
    const Chevron = isRtl ? ChevronLeft : ChevronRight;

    const totalPlans = plans.length;
    const approved = plans.filter((p) => p.status === "APPROVED").length;
    const needsAction = plans.filter((p) => p.status === "REVISION_REQUESTED" || p.items?.some((i: any) => i.status === "PENDING")).length;

    return (
        <div className="space-y-8" dir={isRtl ? "rtl" : "ltr"}>
            {/* Header */}
            <div className={`space-y-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">
                    {isRtl ? "خطط المحتوى" : "Content Plans"}
                </p>
                <h1 className="text-4xl font-black tracking-tighter">
                    {isRtl ? "خطط المحتوى الخاصة بي" : "My Action Plans"}
                </h1>
                <p className="text-muted-foreground font-medium">
                    {isRtl ? "راجع واعتمد خطط محتوى السوشيال ميديا الشهرية." : "Review and approve your monthly social media content."}
                </p>
            </div>

            {/* Stats */}
            {totalPlans > 0 && (
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: isRtl ? "إجمالي الخطط" : "Total Plans", value: totalPlans, color: "text-foreground" },
                        { label: isRtl ? "معتمدة" : "Approved", value: approved, color: "text-emerald-500" },
                        { label: isRtl ? "تحتاج مراجعة" : "Need Review", value: needsAction, color: "text-orange-500" },
                    ].map(stat => (
                        <div key={stat.label} className={`p-4 rounded-2xl bg-card/40 border border-white/5 text-center`}>
                            <div className={`text-3xl font-black ${stat.color}`}>{stat.value}</div>
                            <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-0.5">{stat.label}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Plans grid */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {plans.map((plan: any) => {
                    const sm = STATUS_META[plan.status as keyof typeof STATUS_META] || STATUS_META.PENDING;
                    const StatusIcon = sm.icon;
                    const totalItems = plan.items?.length || 0;
                    const approvedItems = plan.items?.filter((i: any) => i.status === "APPROVED").length || 0;
                    const pendingItems = plan.items?.filter((i: any) => i.status === "PENDING" || i.status === "DRAFT").length || 0;
                    const pct = totalItems > 0 ? Math.round((approvedItems / totalItems) * 100) : 0;
                    const hasIssue = plan.status === "REVISION_REQUESTED" || pendingItems > 0;

                    return (
                        <Link key={plan.id} href={`/client/action-plans/${plan.id}`} className="group block">
                            <div className={`relative p-5 rounded-2xl bg-card/50 backdrop-blur-sm border transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 overflow-hidden ${plan.status === "REVISION_REQUESTED" ? "border-red-500/30 shadow-red-500/5" :
                                    hasIssue ? "border-orange-500/20" : "border-white/8 hover:border-primary/20"
                                }`}>
                                <div className={`absolute top-0 inset-x-0 h-1 ${plan.status === "APPROVED" ? "bg-emerald-500" :
                                        plan.status === "REVISION_REQUESTED" ? "bg-red-500" :
                                            pendingItems > 0 ? "bg-orange-500" : "bg-primary/40"
                                    }`} />

                                <div className={`flex items-start justify-between mt-1 mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                    <div className={isRtl ? 'text-right' : 'text-left'}>
                                        <h3 className="text-2xl font-black tracking-tight">{plan.month}</h3>
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                                            {isRtl ? "خطة المحتوى الشهرية" : "Monthly Content Plan"}
                                        </p>
                                    </div>
                                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black ${sm.bg} ${sm.color} border ${sm.border}`}>
                                        <StatusIcon className="h-3 w-3" />
                                        {(isRtl ? sm.ar : sm.en).toUpperCase()}
                                    </div>
                                </div>

                                {pendingItems > 0 && plan.status !== "APPROVED" && (
                                    <div className={`mb-3 px-3 py-2 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center gap-2 ${isRtl ? 'flex-row-reverse text-right' : ''}`}>
                                        <AlertCircle className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                                        <span className="text-[10px] font-black text-orange-500">
                                            {isRtl ? `${pendingItems} عنصر في انتظار مراجعتك` : `${pendingItems} items awaiting your review`}
                                        </span>
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <div className={`flex justify-between text-[9px] font-black text-muted-foreground ${isRtl ? 'flex-row-reverse' : ''}`}>
                                        <span>{isRtl ? `${approvedItems} من ${totalItems} تمت الموافقة عليهم` : `${approvedItems} of ${totalItems} items approved`}</span>
                                        <span>{pct}%</span>
                                    </div>
                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full transition-all duration-700 ${pct === 100 ? "bg-emerald-500" : "bg-primary"}`} style={{ width: `${pct}%` }} />
                                    </div>
                                </div>

                                <div className={`mt-4 flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                                    <span className="text-[10px] font-black text-primary group-hover:text-primary/80">
                                        {plan.status === "APPROVED"
                                            ? (isRtl ? "← عرض الخطة" : "View plan →")
                                            : (isRtl ? "← مراجعة الآن" : "Review now →")}
                                    </span>
                                    <Chevron className="h-4 w-4 text-muted-foreground opacity-40 group-hover:opacity-100 transition-all" />
                                </div>
                            </div>
                        </Link>
                    );
                })}

                {plans.length === 0 && (
                    <div className="col-span-full py-24 rounded-3xl border-2 border-dashed border-white/10 text-center">
                        <FolderKanban className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                        <p className="text-muted-foreground font-bold">
                            {isRtl ? "لا توجد خطط محتوى بعد." : "No action plans available yet."}
                        </p>
                        <p className="text-sm text-muted-foreground opacity-60 mt-1">
                            {isRtl ? "سيقوم مدير حسابك بإنشاء خطة محتوى لك قريباً." : "Your Account Manager will create a content plan for you soon."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
