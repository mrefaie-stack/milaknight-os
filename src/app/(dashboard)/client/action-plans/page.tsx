import { getActionPlans } from "@/app/actions/action-plan";
import Link from "next/link";
import { FolderKanban, CheckCircle2, Clock, AlertCircle, ChevronRight, FileCheck } from "lucide-react";

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
    DRAFT: { label: "Draft", color: "text-gray-400", bg: "bg-gray-400/10", border: "border-gray-400/20", icon: Clock },
    PENDING: { label: "Pending", color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20", icon: Clock },
    APPROVED: { label: "Approved", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: CheckCircle2 },
    REVISION_REQUESTED: { label: "Action Needed", color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30", icon: AlertCircle },
    PUBLISHED: { label: "Published", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", icon: FileCheck },
};

export default async function ClientActionPlansPage() {
    const plans = await getActionPlans();

    const totalPlans = plans.length;
    const approved = (plans as any[]).filter((p: any) => p.status === "APPROVED").length;
    const needsAction = (plans as any[]).filter((p: any) => p.status === "REVISION_REQUESTED" || (p.items?.some((i: any) => i.status === "PENDING"))).length;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Content Plans</p>
                <h1 className="text-4xl font-black tracking-tighter">My Action Plans</h1>
                <p className="text-muted-foreground font-medium">Review and approve your monthly social media content.</p>
            </div>

            {/* Stats */}
            {totalPlans > 0 && (
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: "Total Plans", value: totalPlans, color: "text-foreground" },
                        { label: "Approved", value: approved, color: "text-emerald-500" },
                        { label: "Need Review", value: needsAction, color: "text-orange-500" },
                    ].map(stat => (
                        <div key={stat.label} className="p-4 rounded-2xl bg-card/40 border border-white/5 text-center">
                            <div className={`text-3xl font-black ${stat.color}`}>{stat.value}</div>
                            <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-0.5">{stat.label}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Plans grid */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {(plans as any[]).map((plan: any) => {
                    const sm = STATUS_META[plan.status] || STATUS_META.PENDING;
                    const StatusIcon = sm.icon;
                    const totalItems = plan.items?.length || 0;
                    const approvedItems = plan.items?.filter((i: any) => i.status === "APPROVED").length || 0;
                    const pendingItems = plan.items?.filter((i: any) => i.status === "PENDING" || i.status === "DRAFT").length || 0;
                    const pct = totalItems > 0 ? Math.round((approvedItems / totalItems) * 100) : 0;
                    const needsAction = plan.status === "REVISION_REQUESTED" || pendingItems > 0;

                    return (
                        <Link key={plan.id} href={`/client/action-plans/${plan.id}`} className="group block">
                            <div className={`relative p-5 rounded-2xl bg-card/50 backdrop-blur-sm border transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 overflow-hidden ${plan.status === "REVISION_REQUESTED"
                                    ? "border-red-500/30 shadow-red-500/5"
                                    : needsAction
                                        ? "border-orange-500/20"
                                        : "border-white/8 hover:border-primary/20"
                                }`}>

                                {/* Subtle gradient top */}
                                <div className={`absolute top-0 inset-x-0 h-1 transition-opacity ${plan.status === "APPROVED" ? "bg-emerald-500" :
                                        plan.status === "REVISION_REQUESTED" ? "bg-red-500" :
                                            pendingItems > 0 ? "bg-orange-500" : "bg-primary/40"
                                    }`} />

                                {/* Month & status */}
                                <div className="flex items-start justify-between mt-1 mb-4">
                                    <div>
                                        <h3 className="text-2xl font-black tracking-tight">{plan.month}</h3>
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Monthly Content Plan</p>
                                    </div>
                                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black ${sm.bg} ${sm.color} border ${sm.border}`}>
                                        <StatusIcon className="h-3 w-3" />
                                        {sm.label.toUpperCase()}
                                    </div>
                                </div>

                                {/* Action required banner */}
                                {pendingItems > 0 && plan.status !== "APPROVED" && (
                                    <div className="mb-3 px-3 py-2 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center gap-2">
                                        <AlertCircle className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                                        <span className="text-[10px] font-black text-orange-500">{pendingItems} items awaiting your review</span>
                                    </div>
                                )}

                                {/* Approval progress */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[9px] font-black text-muted-foreground">
                                        <span>{approvedItems} of {totalItems} items approved</span>
                                        <span>{pct}%</span>
                                    </div>
                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-700 ${pct === 100 ? "bg-emerald-500" : "bg-primary"}`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>

                                {/* CTA */}
                                <div className="mt-4 flex items-center justify-between">
                                    <span className="text-[10px] font-black text-primary group-hover:text-primary/80">
                                        {plan.status === "APPROVED" ? "View plan →" : "Review now →"}
                                    </span>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                                </div>
                            </div>
                        </Link>
                    );
                })}

                {plans.length === 0 && (
                    <div className="col-span-full py-24 rounded-3xl border-2 border-dashed border-white/10 text-center">
                        <FolderKanban className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                        <p className="text-muted-foreground font-bold">No action plans available yet.</p>
                        <p className="text-sm text-muted-foreground opacity-60 mt-1">Your Account Manager will create a content plan for you soon.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
