"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/language-context";
import { ClipboardCheck, Plus, Clock, CheckCircle2, XCircle, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
        all:      approvals.length,
        pending:  approvals.filter((a) => a.status === "PENDING_LEADER" || a.status === "PENDING_MM").length,
        approved: approvals.filter((a) => a.status === "APPROVED").length,
        rejected: approvals.filter((a) => a.status === "REJECTED").length,
    };

    const tabs: { key: Tab; label: string; labelAr: string; icon: React.ComponentType<{ className?: string }> }[] = [
        { key: "all",      label: "All",      labelAr: "الكل",          icon: Filter },
        { key: "pending",  label: "Pending",  labelAr: "قيد الانتظار", icon: Clock },
        { key: "approved", label: "Approved", labelAr: "معتمد",         icon: CheckCircle2 },
        { key: "rejected", label: "Rejected", labelAr: "مرفوض",         icon: XCircle },
    ];

    return (
        <div className="space-y-6 max-w-5xl mx-auto" dir={isRtl ? "rtl" : "ltr"}>
            {/* Header */}
            <div className={cn("flex flex-col sm:flex-row sm:items-end justify-between gap-4", isRtl ? "sm:flex-row-reverse text-right" : "")}>
                <div>
                    <p className="section-label text-muted-foreground mb-1">
                        {isRtl ? "إدارة الموافقات" : "Approval Management"}
                    </p>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {isRtl ? "طلبات الموافقة" : "Approvals"}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {isRtl ? "إدارة طلبات الموافقة بين الفرق" : "Manage team approval requests"}
                    </p>
                </div>
                {canCreate && (
                    <Button
                        onClick={() => setCreateOpen(true)}
                        className={cn("gap-2 shrink-0", isRtl ? "flex-row-reverse" : "")}
                    >
                        <Plus className="h-4 w-4" />
                        {isRtl ? "طلب موافقة جديد" : "New Request"}
                    </Button>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: isRtl ? "الإجمالي" : "Total",    value: counts.all,      className: "" },
                    { label: isRtl ? "قيد الانتظار" : "Pending",  value: counts.pending,  className: "text-orange-500" },
                    { label: isRtl ? "معتمد" : "Approved",       value: counts.approved, className: "text-emerald-500" },
                    { label: isRtl ? "مرفوض" : "Rejected",       value: counts.rejected, className: "text-destructive" },
                ].map((stat) => (
                    <Card key={stat.label}>
                        <CardHeader className="pb-1 pt-4">
                            <p className={cn("section-label text-[10px] text-muted-foreground", isRtl ? "text-right" : "")}>
                                {stat.label}
                            </p>
                        </CardHeader>
                        <CardContent className="pt-0 pb-4">
                            <div className={cn("text-2xl font-bold tracking-tight", stat.className, isRtl ? "text-right" : "")}>
                                {stat.value}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Tabs */}
            <div className={cn("flex gap-1.5 flex-wrap", isRtl ? "flex-row-reverse" : "")}>
                {tabs.map(({ key, label, labelAr, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors border",
                            tab === key
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background text-muted-foreground border-border hover:bg-muted",
                        )}
                    >
                        <Icon className="h-3.5 w-3.5" />
                        {isRtl ? labelAr : label}
                        {counts[key] > 0 && (
                            <span className={cn(
                                "px-1 py-0.5 rounded text-[9px]",
                                tab === key ? "bg-primary-foreground/20" : "bg-muted",
                            )}>
                                {counts[key]}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* List */}
            {filtered.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                    <ClipboardCheck className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">{isRtl ? "لا توجد طلبات" : "No requests"}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((approval, i) => (
                        <motion.div
                            key={approval.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03, duration: 0.25 }}
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
