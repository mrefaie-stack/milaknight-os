"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/language-context";
import { ClipboardCheck, Plus, Clock, CheckCircle2, XCircle, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CreateApprovalDialog } from "./create-approval-dialog";
import { ApprovalCard } from "./approval-card";

const CAN_CREATE = new Set(["ART_TEAM", "CONTENT_TEAM", "SEO_TEAM", "ART_LEADER", "CONTENT_LEADER", "SEO_LEAD"]);

type Tab = "all" | "pending" | "approved" | "rejected";

interface Approval {
    id: string;
    title: string;
    description: string | null;
    clickupLink: string;
    status: string;
    creatorRole: string;
    leaderAction: string | null;
    leaderComment: string | null;
    mmAction: string | null;
    mmComment: string | null;
    mmId: string | null;
    createdAt: Date | string;
    creator: { id: string; firstName: string; lastName: string; role: string };
    leader: { id: string; firstName: string; lastName: string } | null;
    mm: { id: string; firstName: string; lastName: string } | null;
    client: { id: string; name: string; logoUrl: string | null };
}

export function ApprovalsView({ approvals, userRole, userId }: {
    approvals: Approval[];
    userRole: string;
    userId: string;
}) {
    const { isRtl } = useLanguage();
    const [tab, setTab] = useState<Tab>("all");
    const [createOpen, setCreateOpen] = useState(false);

    const canCreate = CAN_CREATE.has(userRole);

    const filtered = useMemo(() => {
        if (tab === "all") return approvals;
        if (tab === "pending") return approvals.filter((a) => a.status === "PENDING_LEADER" || a.status === "PENDING_MM");
        if (tab === "approved") return approvals.filter((a) => a.status === "APPROVED");
        if (tab === "rejected") return approvals.filter((a) => a.status === "REJECTED");
        return approvals;
    }, [approvals, tab]);

    const counts = {
        all: approvals.length,
        pending: approvals.filter((a) => a.status === "PENDING_LEADER" || a.status === "PENDING_MM").length,
        approved: approvals.filter((a) => a.status === "APPROVED").length,
        rejected: approvals.filter((a) => a.status === "REJECTED").length,
    };

    const tabs: { key: Tab; label: string; labelAr: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
        { key: "all", label: "All", labelAr: "الكل", icon: Filter, color: "text-muted-foreground" },
        { key: "pending", label: "Pending", labelAr: "قيد الانتظار", icon: Clock, color: "text-orange-400" },
        { key: "approved", label: "Approved", labelAr: "معتمد", icon: CheckCircle2, color: "text-emerald-400" },
        { key: "rejected", label: "Rejected", labelAr: "مرفوض", icon: XCircle, color: "text-rose-400" },
    ];

    return (
        <div className="space-y-8 max-w-5xl mx-auto" dir={isRtl ? "rtl" : "ltr"}>
            {/* Header */}
            <div className={cn("flex flex-col md:flex-row md:items-end justify-between gap-4", isRtl ? "text-right" : "")}>
                <div className={cn("flex items-center gap-3", isRtl ? "flex-row-reverse" : "")}>
                    <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                        <ClipboardCheck className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter premium-gradient-text uppercase">
                            {isRtl ? "طلبات الموافقة" : "Approvals"}
                        </h1>
                        <p className="text-sm text-muted-foreground font-medium opacity-70">
                            {isRtl ? "إدارة طلبات الموافقة بين الفرق" : "Manage team approval requests"}
                        </p>
                    </div>
                </div>
                {canCreate && (
                    <Button
                        onClick={() => setCreateOpen(true)}
                        className="h-10 bg-violet-600 hover:bg-violet-700 text-white font-black uppercase tracking-wider rounded-xl gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        {isRtl ? "طلب موافقة جديد" : "New Request"}
                    </Button>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: isRtl ? "الإجمالي" : "Total", value: counts.all, color: "text-primary" },
                    { label: isRtl ? "قيد الانتظار" : "Pending", value: counts.pending, color: "text-orange-400" },
                    { label: isRtl ? "معتمد" : "Approved", value: counts.approved, color: "text-emerald-400" },
                    { label: isRtl ? "مرفوض" : "Rejected", value: counts.rejected, color: "text-rose-400" },
                ].map((stat) => (
                    <div key={stat.label} className="glass-card rounded-2xl p-4 text-center border border-white/5">
                        <div className={cn("text-3xl font-black", stat.color)}>{stat.value}</div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50 mt-1">
                            {stat.label}
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className={cn("flex gap-2 flex-wrap", isRtl ? "flex-row-reverse" : "")}>
                {tabs.map(({ key, label, labelAr, icon: Icon, color }) => (
                    <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={cn(
                            "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border",
                            tab === key
                                ? "bg-violet-500/15 border-violet-500/30 text-violet-400"
                                : "bg-white/3 border-white/5 text-muted-foreground hover:bg-white/6"
                        )}
                    >
                        <Icon className={cn("h-3.5 w-3.5", tab === key ? "text-violet-400" : color)} />
                        {isRtl ? labelAr : label}
                        {counts[key] > 0 && (
                            <span className={cn(
                                "rounded-full px-1.5 py-0.5 text-[9px] font-black",
                                tab === key ? "bg-violet-500/20 text-violet-300" : "bg-white/10 text-muted-foreground"
                            )}>
                                {counts[key]}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* List */}
            {filtered.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground opacity-40">
                    <ClipboardCheck className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p className="font-black uppercase tracking-widest text-sm">
                        {isRtl ? "لا توجد طلبات" : "No requests"}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filtered.map((approval, i) => (
                        <motion.div
                            key={approval.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04, duration: 0.3 }}
                        >
                            <ApprovalCard
                                approval={approval}
                                userRole={userRole}
                                userId={userId}
                                isRtl={isRtl}
                            />
                        </motion.div>
                    ))}
                </div>
            )}

            <CreateApprovalDialog open={createOpen} onClose={() => setCreateOpen(false)} />
        </div>
    );
}
