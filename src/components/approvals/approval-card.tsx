"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    CheckCircle2, XCircle, Clock, ExternalLink, User, ChevronDown, ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { leaderActOnApproval, mmActOnApproval } from "@/app/actions/approvals";
import { toast } from "sonner";

const LEADER_ROLES = new Set(["ART_LEADER", "CONTENT_LEADER", "SEO_LEAD"]);

const STATUS_CONFIG: Record<string, { label: string; labelAr: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
    PENDING_LEADER: { label: "Pending Leader", labelAr: "انتظار الليدر", color: "bg-orange-500/10 text-orange-400 border-orange-500/20", icon: Clock },
    PENDING_MM: { label: "Pending Marketing Mgr", labelAr: "انتظار مدير التسويق", color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: Clock },
    APPROVED: { label: "Approved", labelAr: "معتمد", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: CheckCircle2 },
    REJECTED: { label: "Rejected", labelAr: "مرفوض", color: "bg-rose-500/10 text-rose-400 border-rose-500/20", icon: XCircle },
};

const ROLE_LABELS: Record<string, string> = {
    ART_TEAM: "Art Team", CONTENT_TEAM: "Content Team", SEO_TEAM: "SEO Team",
    ART_LEADER: "Art Leader", CONTENT_LEADER: "Content Leader", SEO_LEAD: "SEO Lead",
    MARKETING_MANAGER: "Marketing Manager", AM: "Account Manager", ADMIN: "Admin",
};

function StepDot({ done, active, rejected }: { done: boolean; active: boolean; rejected: boolean }) {
    if (rejected) return (
        <div className="w-5 h-5 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center">
            <XCircle className="h-3 w-3 text-rose-400" />
        </div>
    );
    if (done) return (
        <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
        </div>
    );
    if (active) return (
        <div className="w-5 h-5 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
            <Clock className="h-3 w-3 text-orange-400 animate-pulse" />
        </div>
    );
    return <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10" />;
}

interface ApprovalData {
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

export function ApprovalCard({ approval, userRole, userId, isRtl }: {
    approval: ApprovalData;
    userRole: string;
    userId: string;
    isRtl: boolean;
}) {
    const router = useRouter();
    const [expanded, setExpanded] = useState(false);
    const [rejectOpen, setRejectOpen] = useState<"leader" | "mm" | null>(null);
    const [rejectComment, setRejectComment] = useState("");
    const [loading, setLoading] = useState(false);

    const status = approval.status;
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING_LEADER;
    const StatusIcon = cfg.icon;

    const isLeaderAndCanAct = LEADER_ROLES.has(userRole) && status === "PENDING_LEADER";
    const isMmAndCanAct = userRole === "MARKETING_MANAGER" && status === "PENDING_MM" && approval.mmId === userId;

    const hasLeaderStep = !LEADER_ROLES.has(approval.creatorRole);
    const leaderDone = approval.leaderAction === "APPROVED";
    const leaderRejected = approval.leaderAction === "REJECTED";
    const leaderActive = hasLeaderStep && status === "PENDING_LEADER";
    const mmDone = approval.mmAction === "APPROVED";
    const mmRejected = approval.mmAction === "REJECTED";
    const mmActive = status === "PENDING_MM";

    async function handleLeaderAction(action: "APPROVED" | "REJECTED") {
        setLoading(true);
        try {
            await leaderActOnApproval(approval.id, action, action === "REJECTED" ? rejectComment : undefined);
            toast.success(action === "APPROVED"
                ? (isRtl ? "تمت الموافقة" : "Approved")
                : (isRtl ? "تم الرفض" : "Rejected"));
            setRejectOpen(null);
            router.refresh();
        } catch {
            toast.error(isRtl ? "حدث خطأ" : "Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    async function handleMmAction(action: "APPROVED" | "REJECTED") {
        setLoading(true);
        try {
            await mmActOnApproval(approval.id, action, action === "REJECTED" ? rejectComment : undefined);
            toast.success(action === "APPROVED"
                ? (isRtl ? "تم الاعتماد النهائي" : "Final Approval Done")
                : (isRtl ? "تم الرفض" : "Rejected"));
            setRejectOpen(null);
            router.refresh();
        } catch {
            toast.error(isRtl ? "حدث خطأ" : "Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Card className="glass-card border-white/5 rounded-2xl overflow-hidden">
            <CardContent className="p-0">
                {/* Main row */}
                <div className={cn("p-5 flex items-start gap-4", isRtl ? "flex-row-reverse" : "")}>
                    {/* Status icon */}
                    <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                        cfg.color
                    )}>
                        <StatusIcon className="h-5 w-5" />
                    </div>

                    {/* Content */}
                    <div className={cn("flex-1 min-w-0", isRtl ? "text-right" : "")}>
                        <div className={cn("flex items-start justify-between gap-3 flex-wrap", isRtl ? "flex-row-reverse" : "")}>
                            <div className="min-w-0">
                                <h3 className="font-black text-base leading-tight truncate">{approval.title}</h3>
                                <div className={cn("flex items-center gap-2 mt-1 flex-wrap", isRtl ? "flex-row-reverse" : "")}>
                                    <span className="text-[10px] font-black text-muted-foreground opacity-60 uppercase">
                                        {approval.client.name}
                                    </span>
                                    <span className="text-muted-foreground opacity-30 text-[10px]">·</span>
                                    <span className="text-[10px] font-black text-muted-foreground opacity-60 uppercase">
                                        {ROLE_LABELS[approval.creatorRole] || approval.creatorRole}
                                    </span>
                                    <span className="text-muted-foreground opacity-30 text-[10px]">·</span>
                                    <span className="text-[10px] text-muted-foreground opacity-40">
                                        {formatDistanceToNow(new Date(approval.createdAt), { addSuffix: true })}
                                    </span>
                                </div>
                            </div>
                            <div className={cn("flex items-center gap-2 shrink-0", isRtl ? "flex-row-reverse" : "")}>
                                <Badge variant="outline" className={cn("text-[9px] font-black uppercase tracking-widest rounded-full border whitespace-nowrap", cfg.color)}>
                                    {isRtl ? cfg.labelAr : cfg.label}
                                </Badge>
                                <button
                                    onClick={() => setExpanded(!expanded)}
                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                                >
                                    {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                </button>
                            </div>
                        </div>

                        {/* Workflow stepper */}
                        <div className={cn("flex items-center gap-2 mt-3 flex-wrap", isRtl ? "flex-row-reverse" : "")}>
                            {/* Created */}
                            <div className={cn("flex items-center gap-1.5", isRtl ? "flex-row-reverse" : "")}>
                                <div className="w-5 h-5 rounded-full bg-violet-500/20 border border-violet-500/40 flex items-center justify-center">
                                    <User className="h-2.5 w-2.5 text-violet-400" />
                                </div>
                                <span className="text-[9px] font-black text-muted-foreground opacity-50 uppercase hidden sm:block">
                                    {isRtl ? "إنشاء" : "Created"}
                                </span>
                            </div>

                            {hasLeaderStep && (
                                <>
                                    <div className="h-px w-5 bg-white/10 shrink-0" />
                                    <div className={cn("flex items-center gap-1.5", isRtl ? "flex-row-reverse" : "")}>
                                        <StepDot done={leaderDone} active={leaderActive} rejected={leaderRejected} />
                                        <span className="text-[9px] font-black text-muted-foreground opacity-50 uppercase hidden sm:block">
                                            {isRtl ? "الليدر" : "Leader"}
                                        </span>
                                    </div>
                                </>
                            )}

                            <div className="h-px w-5 bg-white/10 shrink-0" />
                            <div className={cn("flex items-center gap-1.5", isRtl ? "flex-row-reverse" : "")}>
                                <StepDot done={mmDone} active={mmActive} rejected={mmRejected} />
                                <span className="text-[9px] font-black text-muted-foreground opacity-50 uppercase hidden sm:block">
                                    {isRtl ? "مدير التسويق" : "Marketing"}
                                </span>
                            </div>

                            <div className="h-px w-5 bg-white/10 shrink-0" />
                            <div className={cn("flex items-center gap-1.5", isRtl ? "flex-row-reverse" : "")}>
                                <StepDot
                                    done={status === "APPROVED"}
                                    active={false}
                                    rejected={status === "REJECTED"}
                                />
                                <span className="text-[9px] font-black text-muted-foreground opacity-50 uppercase hidden sm:block">
                                    {isRtl ? "نهائي" : "Final"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Expanded details */}
                {expanded && (
                    <div className={cn("px-5 pb-5 space-y-4 border-t border-white/5 pt-4", isRtl ? "text-right" : "")}>
                        {approval.description && (
                            <p className="text-sm text-muted-foreground opacity-70 leading-relaxed">
                                {approval.description}
                            </p>
                        )}

                        <div className={cn("flex items-center gap-2 flex-wrap", isRtl ? "flex-row-reverse" : "")}>
                            <a
                                href={approval.clickupLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-[10px] font-black rounded-xl px-3 py-1.5 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition-colors"
                            >
                                <ExternalLink className="h-3 w-3" />
                                {isRtl ? "رابط ClickUp" : "ClickUp Task"}
                            </a>
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-black rounded-xl px-3 py-1.5 bg-white/5 text-muted-foreground">
                                <User className="h-3 w-3" />
                                {approval.creator.firstName} {approval.creator.lastName}
                            </span>
                        </div>

                        {/* Leader comment */}
                        {approval.leaderComment && (
                            <div className="rounded-xl p-3 bg-white/3 border border-white/5">
                                <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-50 mb-1">
                                    {isRtl ? "ملاحظة الليدر" : "Leader Comment"}
                                </div>
                                <p className="text-xs text-muted-foreground">{approval.leaderComment}</p>
                            </div>
                        )}

                        {/* MM comment */}
                        {approval.mmComment && (
                            <div className="rounded-xl p-3 bg-white/3 border border-white/5">
                                <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-50 mb-1">
                                    {isRtl ? "ملاحظة مدير التسويق" : "Marketing Manager Comment"}
                                </div>
                                <p className="text-xs text-muted-foreground">{approval.mmComment}</p>
                            </div>
                        )}

                        {/* Leader actions */}
                        {isLeaderAndCanAct && rejectOpen !== "leader" && (
                            <div className={cn("flex gap-2 pt-2", isRtl ? "flex-row-reverse" : "")}>
                                <Button
                                    onClick={() => handleLeaderAction("APPROVED")}
                                    disabled={loading}
                                    className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl gap-1.5"
                                >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    {isRtl ? "موافقة" : "Approve"}
                                </Button>
                                <Button
                                    onClick={() => { setRejectOpen("leader"); setRejectComment(""); }}
                                    variant="outline"
                                    className="h-9 border-rose-500/30 text-rose-400 hover:bg-rose-500/10 font-black text-xs rounded-xl gap-1.5"
                                >
                                    <XCircle className="h-3.5 w-3.5" />
                                    {isRtl ? "رفض" : "Reject"}
                                </Button>
                            </div>
                        )}

                        {/* Leader reject form */}
                        {isLeaderAndCanAct && rejectOpen === "leader" && (
                            <div className="space-y-3">
                                <Textarea
                                    value={rejectComment}
                                    onChange={(e) => setRejectComment(e.target.value)}
                                    placeholder={isRtl ? "سبب الرفض (اختياري)" : "Reason for rejection (optional)"}
                                    className="bg-white/5 border-white/10 rounded-xl text-sm resize-none h-20"
                                    dir={isRtl ? "rtl" : "ltr"}
                                />
                                <div className={cn("flex gap-2", isRtl ? "flex-row-reverse" : "")}>
                                    <Button
                                        onClick={() => handleLeaderAction("REJECTED")}
                                        disabled={loading}
                                        className="h-9 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl"
                                    >
                                        {isRtl ? "تأكيد الرفض" : "Confirm Reject"}
                                    </Button>
                                    <Button onClick={() => setRejectOpen(null)} variant="ghost" className="h-9 text-xs rounded-xl">
                                        {isRtl ? "إلغاء" : "Cancel"}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* MM actions */}
                        {isMmAndCanAct && rejectOpen !== "mm" && (
                            <div className={cn("flex gap-2 pt-2", isRtl ? "flex-row-reverse" : "")}>
                                <Button
                                    onClick={() => handleMmAction("APPROVED")}
                                    disabled={loading}
                                    className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl gap-1.5"
                                >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    {isRtl ? "اعتماد نهائي" : "Final Approve"}
                                </Button>
                                <Button
                                    onClick={() => { setRejectOpen("mm"); setRejectComment(""); }}
                                    variant="outline"
                                    className="h-9 border-rose-500/30 text-rose-400 hover:bg-rose-500/10 font-black text-xs rounded-xl gap-1.5"
                                >
                                    <XCircle className="h-3.5 w-3.5" />
                                    {isRtl ? "رفض" : "Reject"}
                                </Button>
                            </div>
                        )}

                        {/* MM reject form */}
                        {isMmAndCanAct && rejectOpen === "mm" && (
                            <div className="space-y-3">
                                <Textarea
                                    value={rejectComment}
                                    onChange={(e) => setRejectComment(e.target.value)}
                                    placeholder={isRtl ? "سبب الرفض (اختياري)" : "Reason for rejection (optional)"}
                                    className="bg-white/5 border-white/10 rounded-xl text-sm resize-none h-20"
                                    dir={isRtl ? "rtl" : "ltr"}
                                />
                                <div className={cn("flex gap-2", isRtl ? "flex-row-reverse" : "")}>
                                    <Button
                                        onClick={() => handleMmAction("REJECTED")}
                                        disabled={loading}
                                        className="h-9 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl"
                                    >
                                        {isRtl ? "تأكيد الرفض" : "Confirm Reject"}
                                    </Button>
                                    <Button onClick={() => setRejectOpen(null)} variant="ghost" className="h-9 text-xs rounded-xl">
                                        {isRtl ? "إلغاء" : "Cancel"}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
