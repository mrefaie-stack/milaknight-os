"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/language-context";
import { useRouter } from "next/navigation";
import {
    Users, Clock, TrendingUp, CheckCircle2, XCircle,
    Plus, Megaphone, Star, Calendar, ChevronRight, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAllLeaves, reviewLeave, createAnnouncement } from "@/app/actions/hr";
import { toast } from "sonner";

type Employee = {
    id: string; firstName: string; lastName: string; email: string; role: string;
    department: string | null; contractType: string | null;
    presence: { status: string; activity: string; updatedAt: string } | null;
    leaveRequests: { id: string }[];
    performanceReviews: { score: number; period: string; createdAt: string }[];
};

type Leave = {
    id: string; type: string; startDate: string; endDate: string; days: number;
    reason: string | null; status: string; reviewNote: string | null;
    user: { id: string; firstName: string; lastName: string; role: string; department: string | null };
    reviewedBy: { firstName: string; lastName: string } | null;
};

type Stats = { totalEmployees: number; pendingLeaves: number; approvedThisMonth: number; avgScore: number };

const STATUS_COLORS: Record<string, string> = {
    ONLINE: "bg-emerald-500", AWAY: "bg-yellow-400",
    MEETING: "bg-rose-500", DND: "bg-purple-500", OFFLINE: "bg-zinc-500",
};

const ROLE_LABELS: Record<string, string> = {
    ADMIN: "Admin", AM: "Account Manager", MARKETING_MANAGER: "Marketing Manager", MODERATOR: "Moderator",
};

const LEAVE_TYPE_AR: Record<string, string> = {
    VACATION: "إجازة سنوية", SICK: "إجازة مرضية", PERSONAL: "إجازة شخصية", EMERGENCY: "إجازة طارئة",
};

type Props = { employees: Employee[]; initialStats: Stats; employeeBasePath?: string };

export function HROverview({ employees, initialStats, employeeBasePath = "/admin/hr" }: Props) {
    const { isRtl } = useLanguage();
    const router = useRouter();
    const [pendingLeaves, setPendingLeaves] = useState<Leave[]>([]);
    const [stats, setStats] = useState(initialStats);
    const [reviewingId, setReviewingId] = useState<string | null>(null);
    const [showAnnounce, setShowAnnounce] = useState(false);
    const [annTitle, setAnnTitle] = useState("");
    const [annContent, setAnnContent] = useState("");
    const [posting, setPosting] = useState(false);

    useEffect(() => {
        getAllLeaves("PENDING").then(setPendingLeaves).catch(() => {});
    }, []);

    const handleReview = async (id: string, status: "APPROVED" | "REJECTED") => {
        setReviewingId(id);
        try {
            await reviewLeave(id, status);
            setPendingLeaves(p => p.filter(l => l.id !== id));
            setStats(s => ({ ...s, pendingLeaves: s.pendingLeaves - 1 }));
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

    const handleAnnounce = async () => {
        if (!annTitle.trim() || !annContent.trim()) return;
        setPosting(true);
        try {
            await createAnnouncement({ title: annTitle, content: annContent });
            toast.success(isRtl ? "تم نشر الإعلان" : "Announcement posted");
            setAnnTitle(""); setAnnContent(""); setShowAnnounce(false);
        } catch {
            toast.error(isRtl ? "حدث خطأ" : "Something went wrong");
        } finally {
            setPosting(false);
        }
    };

    const onlineCount = employees.filter(e => {
        if (!e.presence) return false;
        const mins = (Date.now() - new Date(e.presence.updatedAt).getTime()) / 60000;
        return e.presence.status !== "OFFLINE" && mins < 30;
    }).length;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-4", isRtl ? "text-right" : "")}>
                <div>
                    <h1 className="text-3xl md:text-5xl font-black tracking-tighter premium-gradient-text uppercase">
                        {isRtl ? "الموارد البشرية" : "HR Dashboard"}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {isRtl ? "إدارة الفريق والإجازات والأداء" : "Manage your team, leaves, and performance"}
                    </p>
                </div>
                <button
                    onClick={() => setShowAnnounce(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                >
                    <Megaphone className="h-4 w-4" />
                    {isRtl ? "إعلان جديد" : "New Announcement"}
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { icon: Users, label: isRtl ? "الموظفون" : "Team", value: stats.totalEmployees, color: "text-blue-400", bg: "bg-blue-500/8 border-blue-500/20" },
                    { icon: Clock, label: isRtl ? "متصل الآن" : "Online Now", value: onlineCount, color: "text-emerald-400", bg: "bg-emerald-500/8 border-emerald-500/20" },
                    { icon: Calendar, label: isRtl ? "إجازات معلقة" : "Pending Leaves", value: stats.pendingLeaves, color: "text-yellow-400", bg: "bg-yellow-500/8 border-yellow-500/20" },
                    { icon: Star, label: isRtl ? "متوسط الأداء" : "Avg Performance", value: stats.avgScore ? `${stats.avgScore}/5` : "—", color: "text-purple-400", bg: "bg-purple-500/8 border-purple-500/20" },
                ].map(({ icon: Icon, label, value, color, bg }, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                        className={cn("p-4 rounded-2xl border flex flex-col gap-2", bg)}
                    >
                        <div className={cn("flex items-center gap-2", isRtl ? "flex-row-reverse" : "")}>
                            <Icon className={cn("h-4 w-4", color)} />
                            <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">{label}</span>
                        </div>
                        <p className={cn("text-3xl font-black", color)}>{value}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid md:grid-cols-[1fr_340px] gap-6">
                {/* Employee Grid */}
                <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/40">
                        {isRtl ? "الفريق" : "Team Members"} ({employees.length})
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {employees.map((emp, i) => {
                            const status = emp.presence?.status ?? "OFFLINE";
                            const lastReview = emp.performanceReviews[0];
                            const pendingCount = emp.leaveRequests.length;

                            return (
                                <motion.button
                                    key={emp.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => router.push(`${employeeBasePath}/${emp.id}`)}
                                    className="text-left p-4 rounded-2xl border border-white/8 bg-white/2 hover:bg-white/5 hover:border-white/15 transition-all group"
                                >
                                    <div className={cn("flex items-start gap-3", isRtl ? "flex-row-reverse text-right" : "")}>
                                        <div className="relative shrink-0">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-black text-primary">
                                                {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                                            </div>
                                            <span className={cn(
                                                "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background",
                                                STATUS_COLORS[status] ?? "bg-zinc-500"
                                            )} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black truncate">
                                                {emp.firstName} {emp.lastName}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground font-medium">
                                                {emp.department ?? ROLE_LABELS[emp.role] ?? emp.role}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                {lastReview && (
                                                    <span className="flex items-center gap-0.5 text-[10px] text-yellow-400 font-bold">
                                                        <Star className="h-2.5 w-2.5 fill-current" />
                                                        {lastReview.score}/5
                                                    </span>
                                                )}
                                                {pendingCount > 0 && (
                                                    <span className="text-[10px] bg-yellow-500/15 text-yellow-400 px-1.5 py-0.5 rounded-full font-bold">
                                                        {pendingCount} {isRtl ? "إجازة معلقة" : "pending leave"}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <ChevronRight className={cn("h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0 mt-1", isRtl ? "rotate-180" : "")} />
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>

                {/* Pending Leaves */}
                <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/40">
                        {isRtl ? "طلبات الإجازات المعلقة" : "Pending Leave Requests"}
                    </p>
                    {pendingLeaves.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground/30">
                            <CheckCircle2 className="h-8 w-8" />
                            <p className="text-xs font-bold">{isRtl ? "لا توجد طلبات معلقة" : "No pending requests"}</p>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {pendingLeaves.map(leave => (
                                <motion.div
                                    key={leave.id}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="p-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 space-y-3"
                                >
                                    <div className={cn("flex items-start justify-between gap-2", isRtl ? "flex-row-reverse" : "")}>
                                        <div>
                                            <p className="text-sm font-black">
                                                {leave.user.firstName} {leave.user.lastName}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground">
                                                {LEAVE_TYPE_AR[leave.type] ?? leave.type} · {leave.days} {isRtl ? "يوم" : "days"}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                                                {new Date(leave.startDate).toLocaleDateString()} – {new Date(leave.endDate).toLocaleDateString()}
                                            </p>
                                            {leave.reason && (
                                                <p className="text-[11px] text-muted-foreground mt-1 italic">"{leave.reason}"</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <motion.button
                                            whileTap={{ scale: 0.93 }}
                                            onClick={() => handleReview(leave.id, "APPROVED")}
                                            disabled={reviewingId === leave.id}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-500/15 text-green-400 border border-green-500/30 text-xs font-bold hover:bg-green-500/25 transition-colors disabled:opacity-50"
                                        >
                                            {reviewingId === leave.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                                            {isRtl ? "موافقة" : "Approve"}
                                        </motion.button>
                                        <motion.button
                                            whileTap={{ scale: 0.93 }}
                                            onClick={() => handleReview(leave.id, "REJECTED")}
                                            disabled={reviewingId === leave.id}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-500/15 text-red-400 border border-red-500/30 text-xs font-bold hover:bg-red-500/25 transition-colors disabled:opacity-50"
                                        >
                                            <XCircle className="h-3.5 w-3.5" />
                                            {isRtl ? "رفض" : "Reject"}
                                        </motion.button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </div>

            {/* Announcement Modal */}
            <AnimatePresence>
                {showAnnounce && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowAnnounce(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.93, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.93 }}
                            onClick={e => e.stopPropagation()}
                            className="w-full max-w-md bg-card border border-white/10 rounded-3xl p-6 space-y-4 shadow-2xl"
                        >
                            <h2 className={cn("text-lg font-black", isRtl ? "text-right" : "")}>
                                {isRtl ? "إعلان جديد للفريق" : "New Team Announcement"}
                            </h2>
                            <input
                                value={annTitle}
                                onChange={e => setAnnTitle(e.target.value)}
                                placeholder={isRtl ? "عنوان الإعلان..." : "Announcement title..."}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/40"
                                dir={isRtl ? "rtl" : "ltr"}
                            />
                            <textarea
                                value={annContent}
                                onChange={e => setAnnContent(e.target.value)}
                                placeholder={isRtl ? "محتوى الإعلان..." : "Announcement content..."}
                                rows={4}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/40 resize-none"
                                dir={isRtl ? "rtl" : "ltr"}
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowAnnounce(false)}
                                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-muted-foreground hover:bg-white/5"
                                >
                                    {isRtl ? "إلغاء" : "Cancel"}
                                </button>
                                <button
                                    onClick={handleAnnounce}
                                    disabled={posting || !annTitle.trim() || !annContent.trim()}
                                    className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-40 transition-colors"
                                >
                                    {posting ? (isRtl ? "جاري النشر..." : "Posting...") : (isRtl ? "نشر" : "Post")}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
