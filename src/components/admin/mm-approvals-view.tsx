"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
    CheckSquare,
    FolderKanban,
    BarChart3,
    Clock,
    CheckCircle2,
    XCircle,
    Loader2,
    ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { approveActionPlanByMM, rejectActionPlanByMM } from "@/app/actions/action-plan";
import { approveReportByMM, rejectReportByMM } from "@/app/actions/report";

interface PendingPlan {
    id: string;
    month: string;
    mmStatus: string;
    client: { id: string; name: string; nameAr?: string | null; nameEn?: string | null };
    items: { id: string; status: string }[];
}

interface PendingReport {
    id: string;
    month: string;
    mmStatus: string;
    client: { id: string; name: string; nameAr?: string | null; nameEn?: string | null };
}

interface Props {
    pendingPlans: PendingPlan[];
    pendingReports: PendingReport[];
}

export function MmApprovalsView({ pendingPlans, pendingReports }: Props) {
    const { isRtl } = useLanguage();

    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [rejectingType, setRejectingType] = useState<"plan" | "report" | null>(null);
    const [feedback, setFeedback] = useState("");

    // Optimistic removal after action
    const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
    const plans = pendingPlans.filter((p) => !removedIds.has(p.id));
    const reports = pendingReports.filter((r) => !removedIds.has(r.id));

    const clientName = (client: PendingPlan["client"]) => {
        if (isRtl && client.nameAr) return client.nameAr;
        if (!isRtl && client.nameEn) return client.nameEn;
        return client.name;
    };

    async function handleApprove(id: string, type: "plan" | "report") {
        setLoadingId(id);
        try {
            if (type === "plan") {
                await approveActionPlanByMM(id);
                toast.success(isRtl ? "تمت الموافقة على الخطة" : "Action plan approved");
            } else {
                await approveReportByMM(id);
                toast.success(isRtl ? "تمت الموافقة على التقرير" : "Report approved");
            }
            setRemovedIds((prev) => new Set(prev).add(id));
        } catch (err: any) {
            toast.error(err.message || (isRtl ? "فشلت العملية" : "Action failed"));
        } finally {
            setLoadingId(null);
        }
    }

    function openRejectDialog(id: string, type: "plan" | "report") {
        setRejectingId(id);
        setRejectingType(type);
        setFeedback("");
    }

    async function handleRejectConfirm() {
        if (!rejectingId || !rejectingType || !feedback.trim()) return;
        setLoadingId(rejectingId);
        try {
            if (rejectingType === "plan") {
                await rejectActionPlanByMM(rejectingId, feedback);
                toast.success(isRtl ? "تم رفض الخطة وإشعار المدير" : "Plan rejected, AM notified");
            } else {
                await rejectReportByMM(rejectingId, feedback);
                toast.success(isRtl ? "تم رفض التقرير وإشعار المدير" : "Report rejected, AM notified");
            }
            setRemovedIds((prev) => new Set(prev).add(rejectingId!));
            setRejectingId(null);
            setRejectingType(null);
            setFeedback("");
        } catch (err: any) {
            toast.error(err.message || (isRtl ? "فشل الرفض" : "Rejection failed"));
        } finally {
            setLoadingId(null);
        }
    }

    return (
        <div className="space-y-8" dir={isRtl ? "rtl" : "ltr"}>
            {/* Header */}
            <div className={`space-y-2 ${isRtl ? "text-right" : ""}`}>
                <div className={`flex items-center gap-3 ${isRtl ? "flex-row-reverse justify-end" : ""}`}>
                    <div className="p-2 rounded-lg bg-primary/10">
                        <CheckSquare className="h-5 w-5 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {isRtl ? "الموافقات" : "Approvals"}
                    </h1>
                </div>
                <p className="text-muted-foreground font-medium opacity-60">
                    {isRtl
                        ? `${plans.length} خطة · ${reports.length} تقرير بانتظار مراجعتك`
                        : `${plans.length} action plan${plans.length !== 1 ? "s" : ""} · ${reports.length} report${reports.length !== 1 ? "s" : ""} pending your review`}
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                            <FolderKanban className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{plans.length}</p>
                            <p className="section-label text-muted-foreground">
                                {isRtl ? "خطط عمل" : "Action Plans"}
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
                            <BarChart3 className="h-5 w-5 text-violet-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{reports.length}</p>
                            <p className="section-label text-muted-foreground">
                                {isRtl ? "تقارير" : "Reports"}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="plans">
                <TabsList>
                    <TabsTrigger value="plans">
                        {isRtl ? `خطط العمل (${plans.length})` : `Action Plans (${plans.length})`}
                    </TabsTrigger>
                    <TabsTrigger value="reports">
                        {isRtl ? `التقارير (${reports.length})` : `Reports (${reports.length})`}
                    </TabsTrigger>
                </TabsList>

                {/* Action Plans Tab */}
                <TabsContent value="plans" className="mt-6 space-y-4">
                    {plans.length === 0 ? (
                        <EmptyState
                            icon={<FolderKanban className="h-16 w-16 opacity-10" />}
                            title={isRtl ? "لا توجد خطط بانتظار المراجعة" : "No Action Plans Pending"}
                            subtitle={isRtl ? "تم مراجعة جميع خطط العمل." : "All action plans have been reviewed."}
                        />
                    ) : (
                        plans.map((plan) => (
                            <Card key={plan.id} className="hover:bg-muted/30 transition-colors">
                                <CardContent className="p-5">
                                    <div className={`flex items-start justify-between gap-4 ${isRtl ? "flex-row-reverse" : ""}`}>
                                        <div className={`flex items-start gap-4 ${isRtl ? "flex-row-reverse" : ""}`}>
                                            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 shrink-0 mt-0.5">
                                                <FolderKanban className="h-5 w-5 text-blue-400" />
                                            </div>
                                            <div className={isRtl ? "text-right" : ""}>
                                                <p className="section-label text-muted-foreground mb-0.5">
                                                    {clientName(plan.client)}
                                                </p>
                                                <p className="text-base font-semibold">{plan.month}</p>
                                                <div className={`flex items-center gap-2 mt-1.5 ${isRtl ? "flex-row-reverse" : ""}`}>
                                                    <Clock className="h-3.5 w-3.5 text-amber-400" />
                                                    <span className="text-xs text-amber-400 font-bold">
                                                        {isRtl ? "بانتظار موافقتك" : "Awaiting your approval"}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground opacity-50">·</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {plan.items.length} {isRtl ? "عنصر" : "items"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`flex items-center gap-2 shrink-0 ${isRtl ? "flex-row-reverse" : ""}`}>
                                            <Link href={`/am/action-plans/${plan.id}`}>
                                                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                    {isRtl ? "التفاصيل" : "Details"}
                                                </Button>
                                            </Link>
                                            <Button
                                                size="sm"
                                                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                                                disabled={loadingId === plan.id}
                                                onClick={() => handleApprove(plan.id, "plan")}
                                            >
                                                {loadingId === plan.id ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                ) : (
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                )}
                                                {isRtl ? "موافقة" : "Approve"}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                className="gap-1.5 text-xs"
                                                disabled={loadingId === plan.id}
                                                onClick={() => openRejectDialog(plan.id, "plan")}
                                            >
                                                <XCircle className="h-3.5 w-3.5" />
                                                {isRtl ? "رفض" : "Reject"}
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>

                {/* Reports Tab */}
                <TabsContent value="reports" className="mt-6 space-y-4">
                    {reports.length === 0 ? (
                        <EmptyState
                            icon={<BarChart3 className="h-16 w-16 opacity-10" />}
                            title={isRtl ? "لا توجد تقارير بانتظار المراجعة" : "No Reports Pending"}
                            subtitle={isRtl ? "تم مراجعة جميع التقارير." : "All reports have been reviewed."}
                        />
                    ) : (
                        reports.map((report) => (
                            <Card key={report.id} className="hover:bg-muted/30 transition-colors">
                                <CardContent className="p-5">
                                    <div className={`flex items-start justify-between gap-4 ${isRtl ? "flex-row-reverse" : ""}`}>
                                        <div className={`flex items-start gap-4 ${isRtl ? "flex-row-reverse" : ""}`}>
                                            <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 shrink-0 mt-0.5">
                                                <BarChart3 className="h-5 w-5 text-violet-400" />
                                            </div>
                                            <div className={isRtl ? "text-right" : ""}>
                                                <p className="section-label text-muted-foreground mb-0.5">
                                                    {clientName(report.client)}
                                                </p>
                                                <p className="text-base font-semibold">{report.month}</p>
                                                <div className={`flex items-center gap-2 mt-1.5 ${isRtl ? "flex-row-reverse" : ""}`}>
                                                    <Clock className="h-3.5 w-3.5 text-amber-400" />
                                                    <span className="text-xs text-amber-400 font-bold">
                                                        {isRtl ? "بانتظار موافقتك" : "Awaiting your approval"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`flex items-center gap-2 shrink-0 ${isRtl ? "flex-row-reverse" : ""}`}>
                                            <Link href={`/am/reports/${report.id}`}>
                                                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                    {isRtl ? "التفاصيل" : "Details"}
                                                </Button>
                                            </Link>
                                            <Button
                                                size="sm"
                                                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                                                disabled={loadingId === report.id}
                                                onClick={() => handleApprove(report.id, "report")}
                                            >
                                                {loadingId === report.id ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                ) : (
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                )}
                                                {isRtl ? "موافقة" : "Approve"}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                className="gap-1.5 text-xs"
                                                disabled={loadingId === report.id}
                                                onClick={() => openRejectDialog(report.id, "report")}
                                            >
                                                <XCircle className="h-3.5 w-3.5" />
                                                {isRtl ? "رفض" : "Reject"}
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>
            </Tabs>

            {/* Reject Dialog */}
            <Dialog open={!!rejectingId} onOpenChange={(open) => { if (!open) { setRejectingId(null); setRejectingType(null); setFeedback(""); } }}>
                <DialogContent className="sm:max-w-md" dir={isRtl ? "rtl" : "ltr"}>
                    <DialogHeader>
                        <DialogTitle className={isRtl ? "text-right" : ""}>
                            {isRtl ? "رفض وطلب مراجعة" : "Reject & Request Revision"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <p className={`text-sm text-muted-foreground ${isRtl ? "text-right" : ""}`}>
                            {isRtl
                                ? "اكتب سبب الرفض. سيتم إشعار مدير الحساب بهذا السبب."
                                : "Provide a reason for rejection. The Account Manager will be notified."}
                        </p>
                        <Textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder={isRtl ? "سبب الرفض..." : "Reason for rejection..."}
                            className={`min-h-[100px] ${isRtl ? "text-right" : ""}`}
                            dir={isRtl ? "rtl" : "ltr"}
                        />
                    </div>
                    <DialogFooter className={isRtl ? "flex-row-reverse sm:flex-row-reverse" : ""}>
                        <Button
                            variant="outline"
                            onClick={() => { setRejectingId(null); setRejectingType(null); setFeedback(""); }}
                        >
                            {isRtl ? "إلغاء" : "Cancel"}
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={!feedback.trim() || !!loadingId}
                            onClick={handleRejectConfirm}
                            className="gap-2 font-bold"
                        >
                            {loadingId ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <XCircle className="h-4 w-4" />
                            )}
                            {isRtl ? "تأكيد الرفض" : "Confirm Rejection"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="text-muted-foreground">{icon}</div>
            <div>
                <p className="text-base font-semibold">{title}</p>
                <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            </div>
        </div>
    );
}
