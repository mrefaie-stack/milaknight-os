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

const STATUS_CONFIG: Record<string, { label: string; labelAr: string; variant: any; icon: React.ComponentType<{ className?: string }> }> = {
    PENDING_LEADER: { label: "Pending Leader",       labelAr: "انتظار الليدر",          variant: "warning",     icon: Clock },
    PENDING_MM:     { label: "Pending Marketing Mgr", labelAr: "انتظار مدير التسويق",   variant: "info",        icon: Clock },
    APPROVED:       { label: "Approved",              labelAr: "معتمد",                  variant: "success",     icon: CheckCircle2 },
    REJECTED:       { label: "Rejected",              labelAr: "مرفوض",                  variant: "destructive", icon: XCircle },
};

const ROLE_LABELS: Record<string, string> = {
    ART_TEAM: "Art Team", CONTENT_TEAM: "Content Team", SEO_TEAM: "SEO Team",
    ART_LEADER: "Art Leader", CONTENT_LEADER: "Content Leader", SEO_LEAD: "SEO Lead",
    MARKETING_MANAGER: "Marketing Manager", AM: "Account Manager", ADMIN: "Admin",
};

function StepDot({ done, active, rejected }: { done: boolean; active: boolean; rejected: boolean }) {
    if (rejected) return (
        <div className="w-5 h-5 rounded-full bg-destructive/15 border border-destructive/30 flex items-center justify-center">
            <XCircle className="h-3 w-3 text-destructive" />
        </div>
    );
    if (done) return (
        <div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
        </div>
    );
    if (active) return (
        <div className="w-5 h-5 rounded-full bg-warning/15 border border-warning/30 flex items-center justify-center">
            <Clock className="h-3 w-3 text-warning animate-pulse" />
        </div>
    );
    return <div className="w-5 h-5 rounded-full bg-muted border border-border" />;
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

    const openReject = (mode: "leader" | "mm") => { setRejectOpen(mode); setRejectComment(""); };
    const closeReject = () => { setRejectOpen(null); setRejectComment(""); };

    const status = approval.status;
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING_LEADER;
    const StatusIcon = cfg.icon;

    const isLeaderAndCanAct = LEADER_ROLES.has(userRole) && status === "PENDING_LEADER";
    const isMmAndCanAct = userRole === "MARKETING_MANAGER" && status === "PENDING_MM" && approval.mmId === userId;

    const hasLeaderStep = !LEADER_ROLES.has(approval.creatorRole);
    const leaderDone     = approval.leaderAction === "APPROVED";
    const leaderRejected = approval.leaderAction === "REJECTED";
    const leaderActive   = hasLeaderStep && status === "PENDING_LEADER";
    const mmDone         = approval.mmAction === "APPROVED";
    const mmRejected     = approval.mmAction === "REJECTED";
    const mmActive       = status === "PENDING_MM";

    async function handleLeaderAction(action: "APPROVED" | "REJECTED") {
        setLoading(true);
        try {
            await leaderActOnApproval(approval.id, action, action === "REJECTED" ? rejectComment : undefined);
            toast.success(action === "APPROVED" ? (isRtl ? "تمت الموافقة" : "Approved") : (isRtl ? "تم الرفض" : "Rejected"));
            closeReject();
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
            toast.success(action === "APPROVED" ? (isRtl ? "تم الاعتماد النهائي" : "Final Approval Done") : (isRtl ? "تم الرفض" : "Rejected"));
            closeReject();
            router.refresh();
        } catch {
            toast.error(isRtl ? "حدث خطأ" : "Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Card>
            <CardContent className="p-0">
                {/* Main row */}
                <div className={cn("p-4 flex items-start gap-3", isRtl ? "flex-row-reverse" : "")}>
                    {/* Status icon */}
                    <div className="p-2 rounded-lg bg-muted shrink-0 mt-0.5">
                        <StatusIcon className="h-4 w-4 text-muted-foreground" />
                    </div>

                    {/* Content */}
                    <div className={cn("flex-1 min-w-0", isRtl ? "text-right" : "")}>
                        <div className={cn("flex items-start justify-between gap-3 flex-wrap", isRtl ? "flex-row-reverse" : "")}>
                            <div className="min-w-0">
                                <h3 className="text-sm font-semibold leading-tight truncate">{approval.title}</h3>
                                <div className={cn("flex items-center gap-2 mt-1 flex-wrap text-xs text-muted-foreground", isRtl ? "flex-row-reverse" : "")}>
                                    <span>{approval.client.name}</span>
                                    <span>·</span>
                                    <span>{ROLE_LABELS[approval.creatorRole] || approval.creatorRole}</span>
                                    <span>·</span>
                                    <span>{formatDistanceToNow(new Date(approval.createdAt), { addSuffix: true })}</span>
                                </div>
                            </div>
                            <div className={cn("flex items-center gap-2 shrink-0", isRtl ? "flex-row-reverse" : "")}>
                                <Badge variant={cfg.variant} className="text-[10px]">
                                    {isRtl ? cfg.labelAr : cfg.label}
                                </Badge>
                                <button
                                    onClick={() => setExpanded(!expanded)}
                                    className="p-1.5 rounded-md bg-muted hover:bg-muted/80 transition-colors"
                                >
                                    {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                </button>
                            </div>
                        </div>

                        {/* Workflow stepper */}
                        <div className={cn("flex items-center gap-2 mt-3 flex-wrap", isRtl ? "flex-row-reverse" : "")}>
                            <div className={cn("flex items-center gap-1.5", isRtl ? "flex-row-reverse" : "")}>
                                <div className="w-5 h-5 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
                                    <User className="h-2.5 w-2.5 text-primary" />
                                </div>
                                <span className="section-label text-[9px] text-muted-foreground hidden sm:block">
                                    {isRtl ? "إنشاء" : "Created"}
                                </span>
                            </div>

                            {hasLeaderStep && (
                                <>
                                    <div className="h-px w-4 bg-border shrink-0" />
                                    <div className={cn("flex items-center gap-1.5", isRtl ? "flex-row-reverse" : "")}>
                                        <StepDot done={leaderDone} active={leaderActive} rejected={leaderRejected} />
                                        <span className="section-label text-[9px] text-muted-foreground hidden sm:block">
                                            {isRtl ? "الليدر" : "Leader"}
                                        </span>
                                    </div>
                                </>
                            )}

                            <div className="h-px w-4 bg-border shrink-0" />
                            <div className={cn("flex items-center gap-1.5", isRtl ? "flex-row-reverse" : "")}>
                                <StepDot done={mmDone} active={mmActive} rejected={mmRejected} />
                                <span className="section-label text-[9px] text-muted-foreground hidden sm:block">
                                    {isRtl ? "مدير التسويق" : "Marketing"}
                                </span>
                            </div>

                            <div className="h-px w-4 bg-border shrink-0" />
                            <div className={cn("flex items-center gap-1.5", isRtl ? "flex-row-reverse" : "")}>
                                <StepDot
                                    done={status === "APPROVED"}
                                    active={false}
                                    rejected={status === "REJECTED"}
                                />
                                <span className="section-label text-[9px] text-muted-foreground hidden sm:block">
                                    {isRtl ? "نهائي" : "Final"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Expanded details */}
                {expanded && (
                    <div className={cn("px-4 pb-4 space-y-3 border-t border-border pt-4", isRtl ? "text-right" : "")}>
                        {approval.description && (
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {approval.description}
                            </p>
                        )}

                        <div className={cn("flex items-center gap-2 flex-wrap", isRtl ? "flex-row-reverse" : "")}>
                            <a
                                href={approval.clickupLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-medium rounded-md px-2.5 py-1.5 bg-primary/10 text-primary hover:bg-primary/15 transition-colors"
                            >
                                <ExternalLink className="h-3 w-3" />
                                {isRtl ? "رابط ClickUp" : "ClickUp Task"}
                            </a>
                            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted rounded-md px-2.5 py-1.5">
                                <User className="h-3 w-3" />
                                {approval.creator.firstName} {approval.creator.lastName}
                            </span>
                        </div>

                        {/* Leader comment */}
                        {approval.leaderComment && (
                            <div className="rounded-md p-3 bg-muted border border-border">
                                <p className="section-label text-[9px] text-muted-foreground mb-1">
                                    {isRtl ? "ملاحظة الليدر" : "Leader Comment"}
                                </p>
                                <p className="text-xs text-muted-foreground">{approval.leaderComment}</p>
                            </div>
                        )}

                        {/* MM comment */}
                        {approval.mmComment && (
                            <div className="rounded-md p-3 bg-muted border border-border">
                                <p className="section-label text-[9px] text-muted-foreground mb-1">
                                    {isRtl ? "ملاحظة مدير التسويق" : "Marketing Manager Comment"}
                                </p>
                                <p className="text-xs text-muted-foreground">{approval.mmComment}</p>
                            </div>
                        )}

                        {/* Leader actions */}
                        {isLeaderAndCanAct && rejectOpen !== "leader" && (
                            <div className={cn("flex gap-2 pt-1", isRtl ? "flex-row-reverse" : "")}>
                                <Button onClick={() => handleLeaderAction("APPROVED")} disabled={loading} size="sm" className="gap-1.5">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    {isRtl ? "موافقة" : "Approve"}
                                </Button>
                                <Button onClick={() => openReject("leader")} variant="outline" size="sm" className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10">
                                    <XCircle className="h-3.5 w-3.5" />
                                    {isRtl ? "رفض" : "Reject"}
                                </Button>
                            </div>
                        )}

                        {/* Leader reject form */}
                        {isLeaderAndCanAct && rejectOpen === "leader" && (
                            <div className="space-y-2">
                                <Textarea
                                    value={rejectComment}
                                    onChange={(e) => setRejectComment(e.target.value)}
                                    placeholder={isRtl ? "سبب الرفض (اختياري)" : "Reason for rejection (optional)"}
                                    className="resize-none h-20"
                                    dir={isRtl ? "rtl" : "ltr"}
                                />
                                <div className={cn("flex gap-2", isRtl ? "flex-row-reverse" : "")}>
                                    <Button onClick={() => handleLeaderAction("REJECTED")} disabled={loading} size="sm" variant="destructive">
                                        {isRtl ? "تأكيد الرفض" : "Confirm Reject"}
                                    </Button>
                                    <Button onClick={closeReject} variant="ghost" size="sm">
                                        {isRtl ? "إلغاء" : "Cancel"}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* MM actions */}
                        {isMmAndCanAct && rejectOpen !== "mm" && (
                            <div className={cn("flex gap-2 pt-1", isRtl ? "flex-row-reverse" : "")}>
                                <Button onClick={() => handleMmAction("APPROVED")} disabled={loading} size="sm" className="gap-1.5">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    {isRtl ? "اعتماد نهائي" : "Final Approve"}
                                </Button>
                                <Button onClick={() => openReject("mm")} variant="outline" size="sm" className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10">
                                    <XCircle className="h-3.5 w-3.5" />
                                    {isRtl ? "رفض" : "Reject"}
                                </Button>
                            </div>
                        )}

                        {/* MM reject form */}
                        {isMmAndCanAct && rejectOpen === "mm" && (
                            <div className="space-y-2">
                                <Textarea
                                    value={rejectComment}
                                    onChange={(e) => setRejectComment(e.target.value)}
                                    placeholder={isRtl ? "سبب الرفض (اختياري)" : "Reason for rejection (optional)"}
                                    className="resize-none h-20"
                                    dir={isRtl ? "rtl" : "ltr"}
                                />
                                <div className={cn("flex gap-2", isRtl ? "flex-row-reverse" : "")}>
                                    <Button onClick={() => handleMmAction("REJECTED")} disabled={loading} size="sm" variant="destructive">
                                        {isRtl ? "تأكيد الرفض" : "Confirm Reject"}
                                    </Button>
                                    <Button onClick={closeReject} variant="ghost" size="sm">
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
