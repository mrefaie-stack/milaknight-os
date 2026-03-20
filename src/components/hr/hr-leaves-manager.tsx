"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/language-context";
import { CheckCircle2, XCircle, Clock, Filter, Loader2, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { reviewLeave } from "@/app/actions/hr";
import { toast } from "sonner";

type Leave = {
    id: string; type: string; startDate: string; endDate: string; days: number;
    reason: string | null; status: string; reviewNote: string | null;
    user: { id: string; firstName: string; lastName: string; role: string; department: string | null };
    reviewedBy: { firstName: string; lastName: string } | null;
};

const LEAVE_TYPE_AR: Record<string, string> = {
    VACATION: "إجازة سنوية", SICK: "إجازة مرضية",
    PERSONAL: "إجازة شخصية", EMERGENCY: "إجازة طارئة",
};

const STATUS_COLORS: Record<string, string> = {
    PENDING: "border-yellow-500/30 bg-yellow-500/5 text-yellow-400",
    APPROVED: "border-green-500/30 bg-green-500/5 text-green-400",
    REJECTED: "border-red-500/30 bg-red-500/5 text-red-400",
};

const STATUS_LABEL: Record<string, { ar: string; en: string }> = {
    PENDING: { ar: "معلق", en: "Pending" },
    APPROVED: { ar: "موافق عليه", en: "Approved" },
    REJECTED: { ar: "مرفوض", en: "Rejected" },
};

type Props = { leaves: Leave[] };

export function HRLeavesManager({ leaves: initialLeaves }: Props) {
    const { isRtl } = useLanguage();
    const [leaves, setLeaves] = useState(initialLeaves);
    const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("PENDING");
    const [reviewingId, setReviewingId] = useState<string | null>(null);
    const [reviewNote, setReviewNote] = useState<Record<string, string>>({});

    const filtered = filter === "ALL" ? leaves : leaves.filter(l => l.status === filter);

    const pendingCount = leaves.filter(l => l.status === "PENDING").length;

    const handleReview = async (id: string, status: "APPROVED" | "REJECTED") => {
        setReviewingId(id);
        try {
            await reviewLeave(id, status, reviewNote[id]);
            setLeaves(prev => prev.map(l =>
                l.id === id ? { ...l, status, reviewedBy: null } : l
            ));
            toast.success(isRtl
                ? status === "APPROVED" ? "تمت الموافقة" : "تم الرفض"
                : status === "APPROVED" ? "Leave approved" : "Leave rejected"
            );
        } catch {
            toast.error(isRtl ? "حدث خطأ" : "Something went wrong");
        } finally {
            setReviewingId(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-4", isRtl ? "text-right" : "")}>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {isRtl ? "طلبات الإجازات" : "Leave Requests"}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {pendingCount > 0
                            ? isRtl ? `${pendingCount} طلب بانتظار المراجعة` : `${pendingCount} pending review`
                            : isRtl ? "لا توجد طلبات معلقة" : "No pending requests"}
                    </p>
                </div>

                {/* Filter */}
                <div className={cn("flex items-center gap-2 flex-wrap", isRtl ? "flex-row-reverse" : "")}>
                    <Filter className="h-3.5 w-3.5 text-muted-foreground/40" />
                    {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map(s => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            className={cn(
                                "px-3 py-1.5 rounded-md text-xs font-medium border transition-colors",
                                filter === s
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground hover:bg-muted"
                            )}
                        >
                            {s === "ALL"
                                ? (isRtl ? "الكل" : "All")
                                : isRtl ? STATUS_LABEL[s].ar : STATUS_LABEL[s].en}
                            {s === "PENDING" && pendingCount > 0 && (
                                <span className="ml-1.5 bg-yellow-500 text-black rounded-full px-1.5 py-0.5 text-[9px]">
                                    {pendingCount}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Leave Cards */}
            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground/30">
                    <CalendarDays className="h-10 w-10" />
                    <p className="text-sm font-bold">
                        {isRtl ? "لا توجد طلبات في هذه الفئة" : "No requests in this category"}
                    </p>
                </div>
            ) : (
                <div className="grid gap-3">
                    <AnimatePresence>
                        {filtered.map((leave, i) => (
                            <motion.div
                                key={leave.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ delay: i * 0.04 }}
                                className={cn(
                                    "p-4 rounded-lg border space-y-3",
                                    STATUS_COLORS[leave.status] ?? "border-border bg-card"
                                )}
                            >
                                <div className={cn("flex items-start justify-between gap-4", isRtl ? "flex-row-reverse" : "")}>
                                    <div className={cn("space-y-1", isRtl ? "text-right" : "")}>
                                        <div className={cn("flex items-center gap-2", isRtl ? "flex-row-reverse" : "")}>
                                            <p className="text-sm font-medium">
                                                {leave.user.firstName} {leave.user.lastName}
                                            </p>
                                            <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full font-medium text-muted-foreground">
                                                {leave.user.department ?? leave.user.role}
                                            </span>
                                        </div>
                                        <p className="text-[12px] text-muted-foreground">
                                            {isRtl ? (LEAVE_TYPE_AR[leave.type] ?? leave.type) : leave.type}
                                            {" · "}{leave.days} {isRtl ? "يوم" : "days"}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground/60">
                                            {new Date(leave.startDate).toLocaleDateString()} – {new Date(leave.endDate).toLocaleDateString()}
                                        </p>
                                        {leave.reason && (
                                            <p className="text-[11px] text-muted-foreground italic mt-1">"{leave.reason}"</p>
                                        )}
                                    </div>

                                    {/* Status badge */}
                                    <div className={cn(
                                        "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium border shrink-0",
                                        STATUS_COLORS[leave.status]
                                    )}>
                                        {leave.status === "PENDING" && <Clock className="h-3 w-3" />}
                                        {leave.status === "APPROVED" && <CheckCircle2 className="h-3 w-3" />}
                                        {leave.status === "REJECTED" && <XCircle className="h-3 w-3" />}
                                        {isRtl ? STATUS_LABEL[leave.status].ar : STATUS_LABEL[leave.status].en}
                                    </div>
                                </div>

                                {/* Review actions — only for pending */}
                                {leave.status === "PENDING" && (
                                    <div className="space-y-2">
                                        <input
                                            value={reviewNote[leave.id] ?? ""}
                                            onChange={e => setReviewNote(prev => ({ ...prev, [leave.id]: e.target.value }))}
                                            placeholder={isRtl ? "ملاحظة (اختياري)..." : "Review note (optional)..."}
                                            dir={isRtl ? "rtl" : "ltr"}
                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-[12px] outline-none focus:border-primary focus:ring-3 focus:ring-primary/15 placeholder:text-muted-foreground/40"
                                        />
                                        <div className={cn("flex gap-2", isRtl ? "flex-row-reverse" : "")}>
                                            <motion.button
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleReview(leave.id, "APPROVED")}
                                                disabled={reviewingId === leave.id}
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-medium hover:bg-emerald-500/15 transition-colors disabled:opacity-50"
                                            >
                                                {reviewingId === leave.id
                                                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    : <CheckCircle2 className="h-3.5 w-3.5" />}
                                                {isRtl ? "موافقة" : "Approve"}
                                            </motion.button>
                                            <motion.button
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleReview(leave.id, "REJECTED")}
                                                disabled={reviewingId === leave.id}
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md bg-destructive/10 text-destructive border border-destructive/20 text-xs font-medium hover:bg-destructive/15 transition-colors disabled:opacity-50"
                                            >
                                                <XCircle className="h-3.5 w-3.5" />
                                                {isRtl ? "رفض" : "Reject"}
                                            </motion.button>
                                        </div>
                                    </div>
                                )}

                                {/* Reviewed by */}
                                {leave.reviewedBy && leave.status !== "PENDING" && (
                                    <p className={cn("text-[10px] text-muted-foreground/40 font-medium", isRtl ? "text-right" : "")}>
                                        {isRtl ? "راجعها: " : "Reviewed by: "}
                                        {leave.reviewedBy.firstName} {leave.reviewedBy.lastName}
                                    </p>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
