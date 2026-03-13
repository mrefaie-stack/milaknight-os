"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/language-context";
import { Calendar, Plus, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { createLeaveRequest } from "@/app/actions/hr";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Leave = {
    id: string; type: string; startDate: string; endDate: string; days: number;
    reason: string | null; status: string; reviewNote: string | null;
    reviewedBy: { firstName: string; lastName: string } | null;
};

const LEAVE_TYPE_AR: Record<string, string> = {
    VACATION: "إجازة سنوية", SICK: "إجازة مرضية", PERSONAL: "إجازة شخصية", EMERGENCY: "إجازة طارئة",
};
const LEAVE_STATUS_STYLE: Record<string, string> = {
    PENDING: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    APPROVED: "bg-green-500/15 text-green-400 border-green-500/30",
    REJECTED: "bg-red-500/15 text-red-400 border-red-500/30",
};

type Props = { leaves: Leave[] };

export function LeaveRequestForm({ leaves }: Props) {
    const { isRtl } = useLanguage();
    const router = useRouter();
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        type: "VACATION",
        startDate: "",
        endDate: "",
        reason: "",
    });

    const handleSubmit = async () => {
        if (!form.startDate || !form.endDate) {
            toast.error(isRtl ? "يرجى تحديد التواريخ" : "Please select dates");
            return;
        }
        if (new Date(form.endDate) < new Date(form.startDate)) {
            toast.error(isRtl ? "تاريخ الانتهاء يجب أن يكون بعد تاريخ البدء" : "End date must be after start date");
            return;
        }
        setLoading(true);
        try {
            await createLeaveRequest({
                type: form.type,
                startDate: form.startDate,
                endDate: form.endDate,
                reason: form.reason || undefined,
            });
            toast.success(isRtl ? "تم إرسال طلب الإجازة" : "Leave request submitted");
            setForm({ type: "VACATION", startDate: "", endDate: "", reason: "" });
            setShowForm(false);
            router.refresh();
        } catch {
            toast.error(isRtl ? "حدث خطأ أثناء الإرسال" : "Failed to submit request");
        } finally {
            setLoading(false);
        }
    };

    const pendingCount = leaves.filter(l => l.status === "PENDING").length;
    const approvedCount = leaves.filter(l => l.status === "APPROVED").length;
    const totalDays = leaves.filter(l => l.status === "APPROVED").reduce((s, l) => s + l.days, 0);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-4", isRtl ? "text-right" : "")}>
                <div>
                    <h1 className="text-3xl md:text-5xl font-black tracking-tighter premium-gradient-text uppercase">
                        {isRtl ? "إجازاتي" : "My Leaves"}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {isRtl ? "تتبع طلبات إجازتك وتاريخها" : "Track your leave requests and history"}
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(v => !v)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                >
                    <Plus className="h-4 w-4" />
                    {isRtl ? "طلب إجازة جديد" : "New Leave Request"}
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: isRtl ? "المعلقة" : "Pending", value: pendingCount, color: "text-yellow-400", bg: "bg-yellow-500/8 border-yellow-500/20" },
                    { label: isRtl ? "الموافق عليها" : "Approved", value: approvedCount, color: "text-green-400", bg: "bg-green-500/8 border-green-500/20" },
                    { label: isRtl ? "أيام مأخوذة" : "Days Taken", value: totalDays, color: "text-blue-400", bg: "bg-blue-500/8 border-blue-500/20" },
                ].map(({ label, value, color, bg }) => (
                    <div key={label} className={cn("p-4 rounded-2xl border", bg, isRtl ? "text-right" : "")}>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">{label}</p>
                        <p className={cn("text-3xl font-black", color)}>{value}</p>
                    </div>
                ))}
            </div>

            {/* New Leave Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className={cn("p-5 rounded-2xl border border-primary/20 bg-primary/5 space-y-4", isRtl ? "text-right" : "")}>
                            <p className="text-sm font-black">{isRtl ? "طلب إجازة جديد" : "New Leave Request"}</p>

                            <div className="grid md:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                                        {isRtl ? "نوع الإجازة" : "Leave Type"}
                                    </label>
                                    <select
                                        value={form.type}
                                        onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary/40"
                                        dir={isRtl ? "rtl" : "ltr"}
                                    >
                                        {Object.entries(LEAVE_TYPE_AR).map(([val, ar]) => (
                                            <option key={val} value={val}>{isRtl ? ar : val.replace("_", " ")}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                                        {isRtl ? "السبب (اختياري)" : "Reason (optional)"}
                                    </label>
                                    <input
                                        type="text"
                                        value={form.reason}
                                        onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                                        placeholder={isRtl ? "سبب الإجازة..." : "Reason..."}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary/40"
                                        dir={isRtl ? "rtl" : "ltr"}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                                        {isRtl ? "تاريخ البداية" : "Start Date"}
                                    </label>
                                    <input
                                        type="date"
                                        value={form.startDate}
                                        onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary/40"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                                        {isRtl ? "تاريخ النهاية" : "End Date"}
                                    </label>
                                    <input
                                        type="date"
                                        value={form.endDate}
                                        onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary/40"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-muted-foreground hover:bg-white/5"
                                >
                                    {isRtl ? "إلغاء" : "Cancel"}
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading || !form.startDate || !form.endDate}
                                    className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-40 transition-colors"
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : (isRtl ? "إرسال الطلب" : "Submit Request")}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* History */}
            <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/40">
                    {isRtl ? "السجل" : "History"} ({leaves.length})
                </p>
                {leaves.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground/30">
                        <Calendar className="h-10 w-10" />
                        <p className="text-sm font-bold">{isRtl ? "لا توجد طلبات إجازة بعد" : "No leave requests yet"}</p>
                    </div>
                ) : leaves.map((leave, i) => (
                    <motion.div
                        key={leave.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className={cn("p-4 rounded-2xl border border-white/8 bg-white/2 space-y-2", isRtl ? "text-right" : "")}
                    >
                        <div className={cn("flex items-start justify-between gap-3", isRtl ? "flex-row-reverse" : "")}>
                            <div className="flex-1 min-w-0">
                                <div className={cn("flex items-center gap-2 flex-wrap", isRtl ? "flex-row-reverse" : "")}>
                                    <p className="text-sm font-black">
                                        {isRtl ? LEAVE_TYPE_AR[leave.type] : leave.type.replace("_", " ")}
                                    </p>
                                    <span className="text-[10px] text-muted-foreground/50">·</span>
                                    <p className="text-sm font-bold text-muted-foreground">{leave.days} {isRtl ? "يوم" : "days"}</p>
                                </div>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                    {new Date(leave.startDate).toLocaleDateString()} – {new Date(leave.endDate).toLocaleDateString()}
                                </p>
                                {leave.reason && (
                                    <p className="text-[11px] text-muted-foreground/60 italic mt-0.5">"{leave.reason}"</p>
                                )}
                                {leave.reviewNote && (
                                    <p className="text-[11px] text-muted-foreground/50 mt-1">
                                        {leave.reviewedBy && `${leave.reviewedBy.firstName}: `}{leave.reviewNote}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {leave.status === "PENDING" && <Clock className="h-3.5 w-3.5 text-yellow-400" />}
                                {leave.status === "APPROVED" && <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />}
                                {leave.status === "REJECTED" && <XCircle className="h-3.5 w-3.5 text-red-400" />}
                                <span className={cn("text-[10px] font-black px-2 py-1 rounded-full border uppercase", LEAVE_STATUS_STYLE[leave.status])}>
                                    {isRtl
                                        ? { PENDING: "معلق", APPROVED: "موافق", REJECTED: "مرفوض" }[leave.status]
                                        : leave.status}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
