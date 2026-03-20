"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/language-context";
import { useRouter } from "next/navigation";
import {
    Users, Clock, CheckCircle2, XCircle,
    Plus, Megaphone, Star, Calendar, ChevronRight, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    MEETING: "bg-rose-500", DND: "bg-violet-500", OFFLINE: "bg-zinc-400",
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
        <div className="space-y-6">
            {/* Header */}
            <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4", isRtl ? "sm:flex-row-reverse text-right" : "")}>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {isRtl ? "الموارد البشرية" : "HR Dashboard"}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {isRtl ? "إدارة الفريق والإجازات والأداء" : "Manage your team, leaves, and performance"}
                    </p>
                </div>
                <Button onClick={() => setShowAnnounce(true)} className={cn("gap-2 shrink-0", isRtl ? "flex-row-reverse" : "")}>
                    <Megaphone className="h-4 w-4" />
                    {isRtl ? "إعلان جديد" : "New Announcement"}
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { icon: Users,    label: isRtl ? "الموظفون" : "Team",             value: stats.totalEmployees,                         className: "text-blue-500" },
                    { icon: Clock,    label: isRtl ? "متصل الآن" : "Online Now",       value: onlineCount,                                  className: "text-emerald-500" },
                    { icon: Calendar, label: isRtl ? "إجازات معلقة" : "Pending Leaves", value: stats.pendingLeaves,                          className: "text-warning" },
                    { icon: Star,     label: isRtl ? "متوسط الأداء" : "Avg Performance", value: stats.avgScore ? `${stats.avgScore}/5` : "—", className: "text-violet-500" },
                ].map(({ icon: Icon, label, value, className }, i) => (
                    <Card key={i}>
                        <CardHeader className={cn("pb-2 pt-4 flex flex-row items-center gap-2", isRtl ? "flex-row-reverse" : "")}>
                            <Icon className={cn("h-4 w-4", className)} />
                            <p className="section-label text-[10px] text-muted-foreground">{label}</p>
                        </CardHeader>
                        <CardContent className="pt-0 pb-4">
                            <div className={cn("text-2xl font-bold tracking-tight", className, isRtl ? "text-right" : "")}>
                                {value}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid md:grid-cols-[1fr_320px] gap-5">
                {/* Employee Grid */}
                <div className="space-y-3">
                    <p className="section-label text-muted-foreground">
                        {isRtl ? "الفريق" : "Team Members"} ({employees.length})
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {employees.map((emp, i) => {
                            const status      = emp.presence?.status ?? "OFFLINE";
                            const lastReview  = emp.performanceReviews[0];
                            const pendingCount = emp.leaveRequests.length;

                            return (
                                <button
                                    key={emp.id}
                                    onClick={() => router.push(`${employeeBasePath}/${emp.id}`)}
                                    className={cn(
                                        "text-left p-3.5 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors group",
                                        isRtl ? "text-right" : "",
                                    )}
                                >
                                    <div className={cn("flex items-start gap-3", isRtl ? "flex-row-reverse" : "")}>
                                        <div className="relative shrink-0">
                                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                                                {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                                            </div>
                                            <span className={cn(
                                                "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card",
                                                STATUS_COLORS[status] ?? "bg-zinc-400",
                                            )} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {emp.firstName} {emp.lastName}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {emp.department ?? ROLE_LABELS[emp.role] ?? emp.role}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                {lastReview && (
                                                    <span className="flex items-center gap-0.5 text-[10px] text-yellow-500 font-medium">
                                                        <Star className="h-2.5 w-2.5 fill-current" />
                                                        {lastReview.score}/5
                                                    </span>
                                                )}
                                                {pendingCount > 0 && (
                                                    <span className="text-[10px] bg-warning/10 text-warning px-1.5 py-0.5 rounded font-medium">
                                                        {pendingCount} {isRtl ? "إجازة معلقة" : "pending leave"}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <ChevronRight className={cn("h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0", isRtl ? "rotate-180" : "")} />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Pending Leaves */}
                <div className="space-y-3">
                    <p className="section-label text-muted-foreground">
                        {isRtl ? "طلبات الإجازات المعلقة" : "Pending Leave Requests"}
                    </p>
                    {pendingLeaves.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground/50 rounded-lg border border-dashed border-border">
                            <CheckCircle2 className="h-7 w-7" />
                            <p className="text-xs">{isRtl ? "لا توجد طلبات معلقة" : "No pending requests"}</p>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {pendingLeaves.map(leave => (
                                <motion.div
                                    key={leave.id}
                                    initial={{ opacity: 0, x: 8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -8 }}
                                    className="p-3.5 rounded-lg border border-warning/20 bg-warning/5 space-y-3"
                                >
                                    <div className={cn("flex items-start gap-2", isRtl ? "flex-row-reverse text-right" : "")}>
                                        <div>
                                            <p className="text-sm font-medium">
                                                {leave.user.firstName} {leave.user.lastName}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {LEAVE_TYPE_AR[leave.type] ?? leave.type} · {leave.days} {isRtl ? "يوم" : "days"}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                                                {new Date(leave.startDate).toLocaleDateString()} – {new Date(leave.endDate).toLocaleDateString()}
                                            </p>
                                            {leave.reason && (
                                                <p className="text-xs text-muted-foreground mt-1 italic">"{leave.reason}"</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleReview(leave.id, "APPROVED")}
                                            disabled={reviewingId === leave.id}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-medium hover:bg-emerald-500/15 transition-colors disabled:opacity-50"
                                        >
                                            {reviewingId === leave.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                                            {isRtl ? "موافقة" : "Approve"}
                                        </button>
                                        <button
                                            onClick={() => handleReview(leave.id, "REJECTED")}
                                            disabled={reviewingId === leave.id}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md bg-destructive/10 text-destructive border border-destructive/20 text-xs font-medium hover:bg-destructive/15 transition-colors disabled:opacity-50"
                                        >
                                            <XCircle className="h-3.5 w-3.5" />
                                            {isRtl ? "رفض" : "Reject"}
                                        </button>
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
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                        onClick={() => setShowAnnounce(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            onClick={e => e.stopPropagation()}
                            className="w-full max-w-md bg-card border border-border rounded-xl p-5 space-y-4 shadow-lg"
                        >
                            <h2 className={cn("text-[15px] font-semibold", isRtl ? "text-right" : "")}>
                                {isRtl ? "إعلان جديد للفريق" : "New Team Announcement"}
                            </h2>
                            <input
                                value={annTitle}
                                onChange={e => setAnnTitle(e.target.value)}
                                placeholder={isRtl ? "عنوان الإعلان..." : "Announcement title..."}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-3 focus:ring-primary/15"
                                dir={isRtl ? "rtl" : "ltr"}
                            />
                            <textarea
                                value={annContent}
                                onChange={e => setAnnContent(e.target.value)}
                                placeholder={isRtl ? "محتوى الإعلان..." : "Announcement content..."}
                                rows={4}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-3 focus:ring-primary/15 resize-none"
                                dir={isRtl ? "rtl" : "ltr"}
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowAnnounce(false)}
                                    className="flex-1 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                                >
                                    {isRtl ? "إلغاء" : "Cancel"}
                                </button>
                                <button
                                    onClick={handleAnnounce}
                                    disabled={posting || !annTitle.trim() || !annContent.trim()}
                                    className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-40 transition-colors"
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
