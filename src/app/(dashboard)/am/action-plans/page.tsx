import { getActionPlans } from "@/app/actions/action-plan";
import Link from "next/link";
import { Plus, FolderKanban, CheckCircle2, Clock, AlertCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    DRAFT: { label: "Draft", color: "text-gray-500", bg: "bg-gray-500/10", icon: Clock },
    PENDING: { label: "Pending Review", color: "text-orange-500", bg: "bg-orange-500/10", icon: Clock },
    APPROVED: { label: "Approved", color: "text-emerald-500", bg: "bg-emerald-500/10", icon: CheckCircle2 },
    REVISION_REQUESTED: { label: "Needs Revision", color: "text-red-500", bg: "bg-red-500/10", icon: AlertCircle },
    PUBLISHED: { label: "Published", color: "text-blue-500", bg: "bg-blue-500/10", icon: CheckCircle2 },
};

export default async function ActionPlansPage() {
    const plans = await getActionPlans();

    const totalPlans = plans.length;
    const approvedPlans = (plans as any[]).filter((p: any) => p.status === "APPROVED").length;
    const pendingRevision = (plans as any[]).filter((p: any) => p.status === "REVISION_REQUESTED").length;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mb-1">Account Manager</p>
                    <h1 className="text-4xl font-black tracking-tighter">Action Plans</h1>
                    <p className="text-muted-foreground font-medium mt-1">Manage monthly content deliverables for your clients.</p>
                </div>
                <Link href="/am/action-plans/create">
                    <Button className="font-black uppercase tracking-widest rounded-full h-12 px-8 shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                        <Plus className="mr-2 h-4 w-4" /> New Action Plan
                    </Button>
                </Link>
            </div>

            {/* Stats row */}
            {totalPlans > 0 && (
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: "Total Plans", value: totalPlans, color: "text-foreground" },
                        { label: "Approved", value: approvedPlans, color: "text-emerald-500" },
                        { label: "Need Revision", value: pendingRevision, color: "text-red-500" },
                    ].map(stat => (
                        <div key={stat.label} className="p-4 rounded-2xl bg-card/40 backdrop-blur-sm border border-white/5 text-center">
                            <div className={`text-3xl font-black ${stat.color}`}>{stat.value}</div>
                            <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-0.5">{stat.label}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Plans grid */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {(plans as any[]).map((plan: any) => {
                    const sm = STATUS_META[plan.status] || STATUS_META.DRAFT;
                    const StatusIcon = sm.icon;
                    const approved = plan.items.filter((i: any) => i.status === "APPROVED").length;
                    const total = plan.items.length;
                    const pct = total > 0 ? Math.round((approved / total) * 100) : 0;
                    const needsRevision = plan.status === "REVISION_REQUESTED";
                    const hasFeedback = plan.items.some((i: any) => i.clientComment && !i.feedbackResolved);

                    return (
                        <Link key={plan.id} href={`/am/action-plans/${plan.id}`} className="group block">
                            <div className={`p-5 rounded-2xl bg-card/50 backdrop-blur-sm border transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 ${needsRevision
                                    ? "border-red-500/30 hover:border-red-500/60 shadow-red-500/5"
                                    : "border-white/8 hover:border-primary/20 hover:shadow-primary/5"
                                }`}>

                                {/* Top row */}
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">{plan.client.name}</p>
                                        <h3 className="text-xl font-black tracking-tight">{plan.month}</h3>
                                    </div>
                                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black ${sm.bg} ${sm.color}`}>
                                        <StatusIcon className="h-3 w-3" />
                                        {sm.label.toUpperCase()}
                                    </div>
                                </div>

                                {/* Client feedback alert */}
                                {hasFeedback && (
                                    <div className="mb-3 px-3 py-2 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center gap-2">
                                        <AlertCircle className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                                        <span className="text-[10px] font-black text-orange-500">Client feedback pending response</span>
                                    </div>
                                )}

                                {/* Progress bar */}
                                <div className="space-y-1.5 mb-4">
                                    <div className="flex justify-between text-[9px] font-black text-muted-foreground">
                                        <span>{approved}/{total} approved</span>
                                        <span>{pct}%</span>
                                    </div>
                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-700 ${pct === 100 ? "bg-emerald-500" : "bg-primary"}`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Items count */}
                                <div className="flex items-center justify-between">
                                    <div className="flex gap-3 text-[9px] font-black">
                                        <span className="text-emerald-500">{plan.items.filter((i: any) => i.status === "APPROVED").length} ✓ Approved</span>
                                        <span className="text-orange-500">{plan.items.filter((i: any) => i.status === "PENDING").length} Pending</span>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                                </div>
                            </div>
                        </Link>
                    );
                })}

                {plans.length === 0 && (
                    <div className="col-span-full py-24 rounded-3xl border-2 border-dashed border-white/10 text-center">
                        <FolderKanban className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                        <p className="text-muted-foreground font-bold">No action plans created yet.</p>
                        <p className="text-sm text-muted-foreground opacity-60 mt-1">Create your first plan for a client to get started.</p>
                        <Link href="/am/action-plans/create" className="inline-block mt-6">
                            <Button className="font-black uppercase rounded-full px-8">
                                <Plus className="mr-2 h-4 w-4" /> Create First Plan
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
