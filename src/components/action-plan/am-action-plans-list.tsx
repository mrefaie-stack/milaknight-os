"use client";
import Link from "next/link";
import { Plus, FolderKanban, CheckCircle2, Clock, AlertCircle, ChevronRight, ChevronLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";
import { cn } from "@/lib/utils";
import { requestActionPlanDeletion } from "@/app/actions/action-plan";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const STATUS_META = {
    DRAFT: { ar: "مسودة", en: "Draft", variant: "ghost" as const, icon: Clock },
    PENDING: { ar: "قيد المراجعة", en: "Pending", variant: "warning" as const, icon: Clock },
    APPROVED: { ar: "معتمدة", en: "Approved", variant: "success" as const, icon: CheckCircle2 },
    REVISION_REQUESTED: { ar: "يحتاج تعديل", en: "Needs Revision", variant: "destructive" as const, icon: AlertCircle },
    PUBLISHED: { ar: "منشورة", en: "Published", variant: "info" as const, icon: CheckCircle2 },
} as const;

export function AmActionPlansList({ plans, role }: { plans: any[], role?: string }) {
    const { isRtl } = useLanguage();
    const Chevron = isRtl ? ChevronLeft : ChevronRight;

    const totalPlans     = plans.length;
    const approvedPlans  = plans.filter((p) => p.status === "APPROVED").length;
    const pendingRevision = plans.filter((p) => p.status === "REVISION_REQUESTED").length;

    const roleLabel = role === "MARKETING_MANAGER"
        ? (isRtl ? "مدير تسويق" : "Marketing Manager")
        : role === "ADMIN"
            ? (isRtl ? "مسؤول النظام" : "Administrator")
            : (isRtl ? "مدير حساب" : "Account Manager");

    return (
        <div className="space-y-6" dir={isRtl ? "rtl" : "ltr"}>
            {/* Header */}
            <div className={cn(
                "flex flex-col sm:flex-row sm:items-end justify-between gap-4",
                isRtl ? "sm:flex-row-reverse text-right" : "",
            )}>
                <div>
                    <p className="section-label text-muted-foreground mb-1">{roleLabel}</p>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {isRtl ? "خطط المحتوى" : "Action Plans"}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {isRtl ? "إدارة المحتوى الشهري للعملاء." : "Manage monthly content deliverables for your clients."}
                    </p>
                </div>
                {(role === "AM" || role === "ADMIN") && (
                    <Link href="/am/action-plans/create">
                        <Button className={cn("gap-2 shrink-0", isRtl ? "flex-row-reverse" : "")}>
                            <Plus className="h-4 w-4" />
                            {isRtl ? "خطة جديدة" : "New Action Plan"}
                        </Button>
                    </Link>
                )}
            </div>

            {/* Stats row */}
            {totalPlans > 0 && (
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: isRtl ? "إجمالي" : "Total", value: totalPlans, className: "" },
                        { label: isRtl ? "معتمدة" : "Approved", value: approvedPlans, className: "text-emerald-500" },
                        { label: isRtl ? "تحتاج تعديل" : "Needs Revision", value: pendingRevision, className: "text-destructive" },
                    ].map(stat => (
                        <Card key={stat.label}>
                            <CardHeader className="pb-1 pt-4">
                                <p className="section-label text-[10px] text-muted-foreground">{stat.label}</p>
                            </CardHeader>
                            <CardContent className="pt-1 pb-4">
                                <div className={cn("text-2xl font-bold tracking-tight", stat.className)}>
                                    {stat.value}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Plans grid */}
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {plans.map((plan: any) => {
                    const sm = STATUS_META[plan.status as keyof typeof STATUS_META] || STATUS_META.DRAFT;
                    const StatusIcon = sm.icon;
                    const approved = plan.items.filter((i: any) => i.status === "APPROVED").length;
                    const total    = plan.items.length;
                    const pct      = total > 0 ? Math.round((approved / total) * 100) : 0;
                    const needsRevision = plan.status === "REVISION_REQUESTED";
                    const hasFeedback   = plan.items.some((i: any) => i.clientComment && !i.feedbackResolved);

                    return (
                        <div key={plan.id} className="group relative">
                            <Link href={`/am/action-plans/${plan.id}`} className="block">
                            <div className={cn(
                                "p-4 rounded-lg bg-card border transition-colors duration-150",
                                needsRevision
                                    ? "border-destructive/30 hover:border-destructive/50"
                                    : "border-border hover:border-border/80 hover:bg-muted/30",
                            )}>
                                {/* Top row */}
                                <div className={cn("flex items-start justify-between mb-3", isRtl ? "flex-row-reverse" : "")}>
                                    <div className={isRtl ? "text-right" : ""}>
                                        <p className="section-label text-[10px] text-muted-foreground mb-0.5">{plan.client.name}</p>
                                        <h3 className="text-[15px] font-semibold">{plan.month}</h3>
                                    </div>
                                    <Badge variant={sm.variant} className="text-[10px] gap-1 shrink-0">
                                        <StatusIcon className="h-3 w-3" />
                                        {isRtl ? sm.ar : sm.en}
                                    </Badge>
                                </div>

                                {/* Client feedback alert */}
                                {hasFeedback && (
                                    <div className={cn(
                                        "mb-3 px-3 py-2 bg-warning/10 border border-warning/20 rounded-md flex items-center gap-2",
                                        isRtl ? "flex-row-reverse" : "",
                                    )}>
                                        <AlertCircle className="h-3.5 w-3.5 text-warning shrink-0" />
                                        <span className="text-[11px] text-warning">
                                            {isRtl ? "ملاحظات العميل في انتظار الرد" : "Client feedback pending response"}
                                        </span>
                                    </div>
                                )}

                                {/* Progress bar */}
                                <div className="space-y-1 mb-3">
                                    <div className={cn("flex justify-between text-[10px] text-muted-foreground", isRtl ? "flex-row-reverse" : "")}>
                                        <span>{isRtl ? `${approved}/${total} تمت الموافقة` : `${approved}/${total} approved`}</span>
                                        <span>{pct}%</span>
                                    </div>
                                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className={cn("h-full rounded-full transition-all duration-500", pct === 100 ? "bg-emerald-500" : "bg-primary")}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className={cn("flex items-center justify-between", isRtl ? "flex-row-reverse" : "")}>
                                    <div className={cn("flex gap-3 text-[10px]", isRtl ? "flex-row-reverse" : "")}>
                                        <span className="text-emerald-500">
                                            {plan.items.filter((i: any) => i.status === "APPROVED").length} ✓ {isRtl ? "معتمد" : "Approved"}
                                        </span>
                                        <span className="text-muted-foreground">
                                            {plan.items.filter((i: any) => i.status === "PENDING").length} {isRtl ? "قيد الانتظار" : "Pending"}
                                        </span>
                                    </div>
                                    <Chevron className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                                </div>
                            </div>
                            </Link>

                            {/* Delete button — only for AM */}
                            {role === "AM" && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                            onClick={(e) => e.preventDefault()}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>{isRtl ? 'طلب حذف الخطة' : 'Request Plan Deletion'}</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                {isRtl
                                                    ? `سيتم إرسال طلب حذف خطة "${plan.client.name} - ${plan.month}" للمسؤول للموافقة عليه.`
                                                    : `A deletion request for "${plan.client.name} - ${plan.month}" will be sent to the admin for approval.`}
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>{isRtl ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
                                            <AlertDialogAction
                                                className="bg-destructive hover:bg-destructive/90"
                                                onClick={async () => {
                                                    try {
                                                        await requestActionPlanDeletion(plan.id);
                                                        toast.success(isRtl ? 'تم إرسال طلب الحذف للمسؤول' : 'Deletion request sent to admin');
                                                    } catch (e: any) {
                                                        toast.error(e.message || 'Error');
                                                    }
                                                }}
                                            >
                                                {isRtl ? 'إرسال الطلب' : 'Send Request'}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </div>
                    );
                })}

                {plans.length === 0 && (
                    <div className="col-span-full py-20 rounded-lg border border-dashed border-border text-center">
                        <FolderKanban className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                        <p className="text-sm font-medium text-muted-foreground">
                            {isRtl ? "لا توجد خطط محتوى بعد." : "No action plans created yet."}
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                            {isRtl ? "أنشئ أول خطة لعميل للبدء." : "Create your first plan for a client to get started."}
                        </p>
                        <Link href="/am/action-plans/create" className="inline-block mt-5">
                            <Button size="sm" className={cn("gap-2", isRtl ? "flex-row-reverse" : "")}>
                                <Plus className="h-4 w-4" />
                                {isRtl ? "إنشاء أول خطة" : "Create First Plan"}
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
