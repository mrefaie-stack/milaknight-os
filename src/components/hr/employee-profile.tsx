"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/language-context";
import {
    User, Calendar, Phone, Briefcase, DollarSign, Star, FileText,
    ChevronLeft, CheckCircle2, XCircle, Clock, Plus, Loader2, Save
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    updateEmployeeProfile, addPerformanceReview, addHRNote
} from "@/app/actions/hr";
import { toast } from "sonner";

type Leave = {
    id: string; type: string; startDate: string; endDate: string; days: number;
    reason: string | null; status: string; reviewNote: string | null;
    reviewedBy: { firstName: string; lastName: string } | null;
};
type Review = {
    id: string; period: string; score: number; strengths: string | null;
    improvements: string | null; goals: string | null; notes: string | null;
    createdAt: string;
    reviewer: { firstName: string; lastName: string };
};
type HRNote = {
    id: string; content: string; createdAt: string;
    author: { firstName: string; lastName: string };
};
type Employee = {
    id: string; firstName: string; lastName: string; email: string; role: string;
    hireDate: string | null; birthday: string | null; phone: string | null;
    department: string | null; contractType: string | null; salary: number | null;
    presence: { status: string; activity: string | null; room: string | null; updatedAt: string } | null;
    leaveRequests: Leave[];
    performanceReviews: Review[];
    hrNotes: HRNote[];
};

const STATUS_COLORS: Record<string, string> = {
    ONLINE: "bg-emerald-500", AWAY: "bg-yellow-400",
    MEETING: "bg-rose-500", DND: "bg-purple-500", OFFLINE: "bg-zinc-500",
};
const LEAVE_STATUS_STYLE: Record<string, string> = {
    PENDING: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    APPROVED: "bg-green-500/15 text-green-400 border-green-500/30",
    REJECTED: "bg-red-500/15 text-red-400 border-red-500/30",
};
const LEAVE_TYPE_AR: Record<string, string> = {
    VACATION: "إجازة سنوية", SICK: "إجازة مرضية", PERSONAL: "إجازة شخصية", EMERGENCY: "إجازة طارئة",
};
const CONTRACT_AR: Record<string, string> = {
    FULL_TIME: "دوام كامل", PART_TIME: "دوام جزئي", FREELANCE: "فريلانس", INTERN: "متدرب",
};
const ROLE_LABELS: Record<string, { ar: string; en: string }> = {
    ADMIN: { ar: "مسؤول النظام", en: "Admin" },
    AM: { ar: "مدير حساب", en: "Account Manager" },
    MARKETING_MANAGER: { ar: "مدير تسويق", en: "Marketing Manager" },
    MODERATOR: { ar: "موديريتور", en: "Moderator" },
    CONTENT_TEAM: { ar: "كونتنت تيم", en: "Content Team" },
    CONTENT_LEADER: { ar: "كونتنت ليدر", en: "Content Leader" },
    ART_TEAM: { ar: "آرت تيم", en: "Art Team" },
    ART_LEADER: { ar: "آرت ليدر", en: "Art Leader" },
    SEO_TEAM: { ar: "سيو تيم", en: "SEO Team" },
    SEO_LEAD: { ar: "سيو ليد", en: "SEO Lead" },
};

const TABS = ["info", "leaves", "performance", "notes"] as const;

type Props = { employee: Employee; viewerRole: string };

export function EmployeeProfile({ employee: emp, viewerRole }: Props) {
    const { isRtl } = useLanguage();
    const isAdmin = viewerRole === "ADMIN";
    const [tab, setTab] = useState<typeof TABS[number]>("info");

    // Edit profile state
    const [editMode, setEditMode] = useState(false);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState({
        hireDate: emp.hireDate ? new Date(emp.hireDate).toISOString().split("T")[0] : "",
        birthday: emp.birthday ? new Date(emp.birthday).toISOString().split("T")[0] : "",
        phone: emp.phone ?? "",
        department: emp.department ?? "",
        contractType: emp.contractType ?? "",
        salary: emp.salary?.toString() ?? "",
    });

    // Add review state
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewForm, setReviewForm] = useState({ period: "", score: "5", strengths: "", improvements: "", goals: "", notes: "" });
    const [reviewLoading, setReviewLoading] = useState(false);

    // Add note state
    const [noteText, setNoteText] = useState("");
    const [noteLoading, setNoteLoading] = useState(false);

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            await updateEmployeeProfile(emp.id, {
                hireDate: profile.hireDate || null,
                birthday: profile.birthday || null,
                phone: profile.phone || null,
                department: profile.department || null,
                contractType: profile.contractType || null,
                salary: profile.salary ? parseInt(profile.salary) : null,
            });
            toast.success(isRtl ? "تم حفظ البيانات" : "Profile saved");
            setEditMode(false);
        } catch {
            toast.error(isRtl ? "حدث خطأ" : "Something went wrong");
        } finally {
            setSaving(false);
        }
    };

    const handleAddReview = async () => {
        if (!reviewForm.period || !reviewForm.score) return;
        setReviewLoading(true);
        try {
            await addPerformanceReview(emp.id, {
                period: reviewForm.period,
                score: parseInt(reviewForm.score),
                strengths: reviewForm.strengths || undefined,
                improvements: reviewForm.improvements || undefined,
                goals: reviewForm.goals || undefined,
                notes: reviewForm.notes || undefined,
            });
            toast.success(isRtl ? "تم إضافة التقييم" : "Review added");
            setShowReviewForm(false);
            setReviewForm({ period: "", score: "5", strengths: "", improvements: "", goals: "", notes: "" });
        } catch {
            toast.error(isRtl ? "حدث خطأ" : "Something went wrong");
        } finally {
            setReviewLoading(false);
        }
    };

    const handleAddNote = async () => {
        if (!noteText.trim()) return;
        setNoteLoading(true);
        try {
            await addHRNote(emp.id, noteText);
            toast.success(isRtl ? "تم إضافة الملاحظة" : "Note added");
            setNoteText("");
        } catch {
            toast.error(isRtl ? "حدث خطأ" : "Something went wrong");
        } finally {
            setNoteLoading(false);
        }
    };

    const status = emp.presence?.status ?? "OFFLINE";
    const roleLabel = ROLE_LABELS[emp.role];
    const avgScore = emp.performanceReviews.length
        ? Math.round((emp.performanceReviews.reduce((s, r) => s + r.score, 0) / emp.performanceReviews.length) * 10) / 10
        : null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className={cn("flex items-start gap-4", isRtl ? "flex-row-reverse" : "")}>
                <div className="relative shrink-0">
                    <div className="w-16 h-16 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-xl font-semibold text-primary">
                        {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                    </div>
                    <span className={cn(
                        "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background",
                        STATUS_COLORS[status] ?? "bg-zinc-500"
                    )} />
                </div>
                <div className={cn("flex-1", isRtl ? "text-right" : "")}>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {emp.firstName} {emp.lastName}
                    </h1>
                    <p className="text-sm text-muted-foreground">{emp.email}</p>
                    <div className={cn("flex items-center gap-2 mt-1.5 flex-wrap", isRtl ? "flex-row-reverse" : "")}>
                        <span className="section-label px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary">
                            {isRtl ? roleLabel?.ar : roleLabel?.en ?? emp.role}
                        </span>
                        {emp.department && (
                            <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-muted/30 border border-border text-muted-foreground">
                                {emp.department}
                            </span>
                        )}
                        {avgScore && (
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-yellow-400">
                                <Star className="h-3 w-3 fill-current" />{avgScore}/5
                            </span>
                        )}
                    </div>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => editMode ? handleSaveProfile() : setEditMode(true)}
                        disabled={saving}
                        className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : editMode ? <Save className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                        {editMode ? (isRtl ? "حفظ" : "Save") : (isRtl ? "تعديل" : "Edit")}
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className={cn("flex gap-1 p-1 bg-muted/20 rounded-xl border border-border", isRtl ? "flex-row-reverse" : "")}>
                {TABS.map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={cn(
                            "flex-1 py-2 rounded-xl section-label transition-all",
                            tab === t ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {isRtl
                            ? { info: "المعلومات", leaves: "الإجازات", performance: "الأداء", notes: "الملاحظات" }[t]
                            : { info: "Info", leaves: "Leaves", performance: "Performance", notes: "HR Notes" }[t]
                        }
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={tab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                >
                    {/* INFO TAB */}
                    {tab === "info" && (
                        <div className="grid md:grid-cols-2 gap-4">
                            {[
                                { icon: Calendar, label: isRtl ? "تاريخ التعيين" : "Hire Date", field: "hireDate" as const, type: "date" },
                                { icon: Calendar, label: isRtl ? "تاريخ الميلاد" : "Birthday", field: "birthday" as const, type: "date" },
                                { icon: Phone, label: isRtl ? "رقم الجوال" : "Phone", field: "phone" as const, type: "text" },
                                { icon: Briefcase, label: isRtl ? "القسم" : "Department", field: "department" as const, type: "text" },
                                { icon: Briefcase, label: isRtl ? "نوع العقد" : "Contract", field: "contractType" as const, type: "select" },
                                { icon: DollarSign, label: isRtl ? "الراتب (ر.س)" : "Salary (SAR)", field: "salary" as const, type: "number" },
                            ].map(({ icon: Icon, label, field, type }) => (
                                <div key={field} className={cn("p-4 rounded-xl border border-border bg-muted/10 space-y-2", isRtl ? "text-right" : "")}>
                                    <div className={cn("flex items-center gap-2 section-label text-muted-foreground/50", isRtl ? "flex-row-reverse" : "")}>
                                        <Icon className="h-3 w-3" />{label}
                                    </div>
                                    {editMode && isAdmin ? (
                                        type === "select" ? (
                                            <select
                                                value={profile[field]}
                                                onChange={e => setProfile(p => ({ ...p, [field]: e.target.value }))}
                                                className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/40"
                                                dir={isRtl ? "rtl" : "ltr"}
                                            >
                                                <option value="">{isRtl ? "غير محدد" : "Not set"}</option>
                                                {Object.entries(CONTRACT_AR).map(([val, ar]) => (
                                                    <option key={val} value={val}>{isRtl ? ar : val.replace("_", " ")}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type={type}
                                                value={profile[field]}
                                                onChange={e => setProfile(p => ({ ...p, [field]: e.target.value }))}
                                                className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/40"
                                                dir={isRtl ? "rtl" : "ltr"}
                                            />
                                        )
                                    ) : (
                                        <p className="text-sm font-bold text-foreground">
                                            {field === "hireDate" || field === "birthday"
                                                ? (emp[field] ? new Date(emp[field]!).toLocaleDateString() : "—")
                                                : field === "contractType"
                                                    ? (emp[field] ? (isRtl ? CONTRACT_AR[emp[field]!] : emp[field]!.replace("_", " ")) : "—")
                                                    : field === "salary"
                                                        ? (emp.salary ? `${emp.salary.toLocaleString()} ${isRtl ? "ر.س" : "SAR"}` : "—")
                                                        : (emp[field] as string ?? "—")}
                                        </p>
                                    )}
                                </div>
                            ))}

                            {/* Presence */}
                            <div className={cn("p-4 rounded-xl border border-border bg-muted/10 space-y-1 md:col-span-2", isRtl ? "text-right" : "")}>
                                <p className="section-label text-muted-foreground/50">
                                    {isRtl ? "الحالة الحالية" : "Current Status"}
                                </p>
                                <div className={cn("flex items-center gap-2", isRtl ? "flex-row-reverse" : "")}>
                                    <span className={cn("w-2.5 h-2.5 rounded-full", STATUS_COLORS[status])} />
                                    <span className="text-sm font-bold">{status}</span>
                                    {emp.presence?.activity && (
                                        <span className="text-xs text-muted-foreground">· {emp.presence.activity}</span>
                                    )}
                                    {emp.presence?.room && (
                                        <span className="text-xs text-muted-foreground/50">· {isRtl ? "في" : "in"} {emp.presence.room}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* LEAVES TAB */}
                    {tab === "leaves" && (
                        <div className="space-y-3">
                            {emp.leaveRequests.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground/30">
                                    <Calendar className="h-10 w-10" />
                                    <p className="text-sm font-bold">{isRtl ? "لا توجد إجازات" : "No leave requests"}</p>
                                </div>
                            ) : emp.leaveRequests.map(leave => (
                                <div key={leave.id} className={cn("p-4 rounded-xl border border-border bg-muted/10 space-y-2", isRtl ? "text-right" : "")}>
                                    <div className={cn("flex items-start justify-between gap-2", isRtl ? "flex-row-reverse" : "")}>
                                        <div>
                                            <p className="text-sm font-semibold">
                                                {isRtl ? LEAVE_TYPE_AR[leave.type] : leave.type.replace("_", " ")} · {leave.days} {isRtl ? "يوم" : "days"}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground">
                                                {new Date(leave.startDate).toLocaleDateString()} – {new Date(leave.endDate).toLocaleDateString()}
                                            </p>
                                            {leave.reason && <p className="text-[11px] text-muted-foreground italic mt-1">"{leave.reason}"</p>}
                                            {leave.reviewNote && (
                                                <p className="text-[11px] text-muted-foreground/70 mt-1">
                                                    {isRtl ? "ملاحظة: " : "Note: "}{leave.reviewNote}
                                                    {leave.reviewedBy && ` — ${leave.reviewedBy.firstName} ${leave.reviewedBy.lastName}`}
                                                </p>
                                            )}
                                        </div>
                                        <span className={cn("section-label px-2 py-1 rounded-full border", LEAVE_STATUS_STYLE[leave.status])}>
                                            {isRtl
                                                ? { PENDING: "معلق", APPROVED: "موافق", REJECTED: "مرفوض" }[leave.status]
                                                : leave.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* PERFORMANCE TAB */}
                    {tab === "performance" && (
                        <div className="space-y-4">
                            {["ADMIN", "MARKETING_MANAGER"].includes(viewerRole) && (
                                <button
                                    onClick={() => setShowReviewForm(v => !v)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    {isRtl ? "إضافة تقييم" : "Add Review"}
                                </button>
                            )}

                            <AnimatePresence>
                                {showReviewForm && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                <input
                                                    placeholder={isRtl ? "الفترة (مثال: 2025-Q1)" : "Period (e.g. 2025-Q1)"}
                                                    value={reviewForm.period}
                                                    onChange={e => setReviewForm(f => ({ ...f, period: e.target.value }))}
                                                    className="bg-muted/30 border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary/40"
                                                    dir={isRtl ? "rtl" : "ltr"}
                                                />
                                                <select
                                                    value={reviewForm.score}
                                                    onChange={e => setReviewForm(f => ({ ...f, score: e.target.value }))}
                                                    className="bg-muted/30 border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary/40"
                                                >
                                                    {[5, 4, 3, 2, 1].map(s => (
                                                        <option key={s} value={s}>{s}/5 {"⭐".repeat(s)}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            {["strengths", "improvements", "goals", "notes"].map(field => (
                                                <textarea
                                                    key={field}
                                                    placeholder={isRtl
                                                        ? { strengths: "نقاط القوة...", improvements: "مجالات التحسين...", goals: "الأهداف...", notes: "ملاحظات إضافية..." }[field]
                                                        : { strengths: "Strengths...", improvements: "Areas to improve...", goals: "Goals...", notes: "Additional notes..." }[field]
                                                    }
                                                    value={reviewForm[field as keyof typeof reviewForm]}
                                                    onChange={e => setReviewForm(f => ({ ...f, [field]: e.target.value }))}
                                                    rows={2}
                                                    className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary/40 resize-none"
                                                    dir={isRtl ? "rtl" : "ltr"}
                                                />
                                            ))}
                                            <button
                                                onClick={handleAddReview}
                                                disabled={reviewLoading || !reviewForm.period}
                                                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 transition-colors"
                                            >
                                                {reviewLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : (isRtl ? "إضافة التقييم" : "Add Review")}
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {emp.performanceReviews.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground/30">
                                    <Star className="h-10 w-10" />
                                    <p className="text-sm font-bold">{isRtl ? "لا توجد تقييمات" : "No reviews yet"}</p>
                                </div>
                            ) : emp.performanceReviews.map(review => (
                                <div key={review.id} className={cn("p-4 rounded-xl border border-border bg-muted/10 space-y-2", isRtl ? "text-right" : "")}>
                                    <div className={cn("flex items-center justify-between", isRtl ? "flex-row-reverse" : "")}>
                                        <p className="text-sm font-semibold">{review.period}</p>
                                        <div className="flex items-center gap-1 text-yellow-400">
                                            <Star className="h-3.5 w-3.5 fill-current" />
                                            <span className="text-sm font-semibold">{review.score}/5</span>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground/60">
                                        {isRtl ? "بقلم" : "By"} {review.reviewer.firstName} {review.reviewer.lastName} · {new Date(review.createdAt).toLocaleDateString()}
                                    </p>
                                    {review.strengths && (
                                        <div>
                                            <p className="section-label text-green-400/70 mb-0.5">{isRtl ? "نقاط القوة" : "Strengths"}</p>
                                            <p className="text-xs text-muted-foreground">{review.strengths}</p>
                                        </div>
                                    )}
                                    {review.improvements && (
                                        <div>
                                            <p className="section-label text-yellow-400/70 mb-0.5">{isRtl ? "التحسينات" : "Improvements"}</p>
                                            <p className="text-xs text-muted-foreground">{review.improvements}</p>
                                        </div>
                                    )}
                                    {review.goals && (
                                        <div>
                                            <p className="section-label text-blue-400/70 mb-0.5">{isRtl ? "الأهداف" : "Goals"}</p>
                                            <p className="text-xs text-muted-foreground">{review.goals}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* NOTES TAB */}
                    {tab === "notes" && (
                        <div className="space-y-4">
                            {["ADMIN", "MARKETING_MANAGER"].includes(viewerRole) && (
                                <div className="space-y-2">
                                    <textarea
                                        placeholder={isRtl ? "ملاحظة خاصة عن الموظف..." : "Private HR note about this employee..."}
                                        value={noteText}
                                        onChange={e => setNoteText(e.target.value)}
                                        rows={3}
                                        className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/40 resize-none"
                                        dir={isRtl ? "rtl" : "ltr"}
                                    />
                                    <button
                                        onClick={handleAddNote}
                                        disabled={noteLoading || !noteText.trim()}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-40 transition-colors"
                                    >
                                        {noteLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                                        {isRtl ? "إضافة ملاحظة" : "Add Note"}
                                    </button>
                                </div>
                            )}
                            {emp.hrNotes.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground/30">
                                    <FileText className="h-10 w-10" />
                                    <p className="text-sm font-bold">{isRtl ? "لا توجد ملاحظات" : "No notes yet"}</p>
                                </div>
                            ) : emp.hrNotes.map(note => (
                                <div key={note.id} className={cn("p-4 rounded-xl border border-border bg-muted/10", isRtl ? "text-right" : "")}>
                                    <p className="text-[11px] text-muted-foreground/50 mb-1">
                                        {note.author.firstName} {note.author.lastName} · {new Date(note.createdAt).toLocaleDateString()}
                                    </p>
                                    <p className="text-sm text-foreground/80">{note.content}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
