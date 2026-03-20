"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EditClientDialog } from "@/components/admin/edit-client-dialog";
import { ArrowRight, ArrowLeft, Users2, Search, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import { deleteClient } from "@/app/actions/client";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const PLAN_STATUS_AR: Record<string, string> = {
    APPROVED: "معتمد", DRAFT: "مسودة", PENDING: "قيد المراجعة",
    REVISION_REQUESTED: "يحتاج تعديل", PUBLISHED: "منشور",
};
const REPORT_STATUS_AR: Record<string, string> = {
    SENT: "مُرسل", DRAFT: "مسودة",
};

const PLAN_VARIANT: Record<string, any> = {
    APPROVED: "success", PUBLISHED: "success",
    DRAFT: "ghost", PENDING: "warning",
    REVISION_REQUESTED: "destructive",
};

export function ClientList({ clients, accountManagers, marketingManagers, services, canEdit = true }: {
    clients: any[],
    accountManagers?: any[],
    marketingManagers?: any[],
    services?: any[],
    canEdit?: boolean
}) {
    const { isRtl } = useLanguage();
    const [search, setSearch] = useState("");

    const filtered = clients.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.industry || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.accountManager?.firstName || "").toLowerCase().includes(search.toLowerCase())
    );

    if (clients.length === 0) {
        return (
            <div className="border border-dashed rounded-lg p-16 text-center flex flex-col items-center justify-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-2">
                    <Users2 className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-[15px]">
                    {isRtl ? "لا يوجد عملاء بعد" : "No clients yet"}
                </h3>
                <p className="text-muted-foreground text-sm">
                    {isRtl ? "أضف أول عميل للبدء." : "Add your first client to get started."}
                </p>
            </div>
        );
    }

    const isAdminPath = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
    const basePath = isAdminPath ? '/admin' : '/am';
    const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

    return (
        <div className="space-y-4" dir={isRtl ? "rtl" : "ltr"}>
            {/* Search bar */}
            <div className="relative">
                <Search className={cn(
                    "absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground",
                    isRtl ? "left-3" : "right-3",
                )} />
                <input
                    type="text"
                    placeholder={isRtl ? "بحث بالاسم، المجال، أو مدير الحساب..." : "Search by name, industry, or account manager..."}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className={cn(
                        "w-full h-9 px-3 rounded-lg bg-background border border-border text-sm",
                        "focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/15",
                        "placeholder:text-muted-foreground/60",
                        isRtl ? "pl-10" : "pr-10",
                    )}
                />
            </div>

            {/* Count */}
            <p className="section-label text-muted-foreground">
                {isRtl
                    ? `${filtered.length} ${filtered.length === 1 ? 'عميل' : 'عملاء'}`
                    : `${filtered.length} ${filtered.length === 1 ? 'Client' : 'Clients'}`}
            </p>

            {/* Cards Grid */}
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {filtered.map((client) => {
                    const latestReport = client.reports?.[0];
                    const latestPlan   = client.actionPlans?.[0];

                    const planStatusDisplay = latestPlan?.status
                        ? (isRtl ? (PLAN_STATUS_AR[latestPlan.status] || latestPlan.status) : latestPlan.status)
                        : "—";
                    const reportStatusDisplay = latestReport?.status
                        ? (isRtl ? (REPORT_STATUS_AR[latestReport.status] || latestReport.status) : latestReport.status)
                        : "—";

                    return (
                        <div
                            key={client.id}
                            className="flex flex-col rounded-lg border border-border bg-card p-4 gap-3 hover:border-border/80 hover:bg-muted/30 transition-colors duration-150"
                        >
                            {/* Top Row */}
                            <div className={cn("flex items-start justify-between gap-3", isRtl ? "flex-row-reverse" : "")}>
                                <div className={cn("flex items-center gap-3", isRtl ? "flex-row-reverse" : "")}>
                                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary text-base shrink-0">
                                        {client.name.substring(0, 1).toUpperCase()}
                                    </div>
                                    <div className={isRtl ? "text-right" : ""}>
                                        <h3 className="font-semibold text-[15px] leading-tight">{client.name}</h3>
                                        <p className="text-xs text-muted-foreground">{client.industry || "—"}</p>
                                    </div>
                                </div>
                                {client.package && (
                                    <Badge variant="ghost" className="text-[10px] uppercase shrink-0">
                                        {client.package}
                                    </Badge>
                                )}
                            </div>

                            {/* Stats Row */}
                            <div className="grid grid-cols-3 gap-2">
                                <div className="p-2 rounded-md bg-muted/50 text-center">
                                    <div className="section-label text-[9px] mb-0.5">
                                        {isRtl ? "م.الحساب" : "AM"}
                                    </div>
                                    <div className="text-xs font-medium truncate">{client.accountManager?.firstName || "—"}</div>
                                </div>
                                <div className="p-2 rounded-md bg-muted/50 text-center">
                                    <div className="section-label text-[9px] mb-0.5">
                                        {isRtl ? "الخطة" : "Plan"}
                                    </div>
                                    <Badge
                                        variant={PLAN_VARIANT[latestPlan?.status] || "ghost"}
                                        className="text-[9px] px-1 py-0"
                                    >
                                        {planStatusDisplay}
                                    </Badge>
                                </div>
                                <div className="p-2 rounded-md bg-muted/50 text-center">
                                    <div className="section-label text-[9px] mb-0.5">
                                        {isRtl ? "التقرير" : "Report"}
                                    </div>
                                    <Badge
                                        variant={latestReport?.status === "SENT" ? "success" : "ghost"}
                                        className="text-[9px] px-1 py-0"
                                    >
                                        {reportStatusDisplay}
                                    </Badge>
                                </div>
                            </div>

                            {/* Services */}
                            {client.services?.length > 0 && (
                                <div className={cn("flex gap-1 flex-wrap", isRtl ? "flex-row-reverse" : "")}>
                                    {client.services.map((s: any) => (
                                        <Badge key={s.id} variant="secondary" className="text-[10px]">{s.name}</Badge>
                                    ))}
                                </div>
                            )}

                            {/* Actions */}
                            <div className={cn(
                                "flex items-center justify-between pt-3 border-t border-border mt-auto gap-2",
                                isRtl ? "flex-row-reverse" : "",
                            )}>
                                <Link href={`${basePath}/clients/${client.id}`} className="flex-1">
                                    <Button variant="ghost" size="sm" className={cn(
                                        "w-full text-xs gap-1",
                                        isRtl ? "flex-row-reverse" : "",
                                    )}>
                                        {isRtl ? "عرض الملف" : "View Profile"}
                                        <ArrowIcon className="h-3 w-3" />
                                    </Button>
                                </Link>
                                {canEdit && accountManagers && (
                                    <div className="flex items-center gap-1">
                                        <EditClientDialog
                                            client={client}
                                            accountManagers={accountManagers}
                                            marketingManagers={marketingManagers || []}
                                            services={services}
                                        />
                                        <DeleteClientButton clientId={client.id} clientName={client.name} />
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {filtered.length === 0 && search && (
                <div className="text-center py-12 text-sm text-muted-foreground">
                    {isRtl ? `لا نتائج لـ "${search}"` : `No results for "${search}"`}
                </div>
            )}
        </div>
    );
}

function DeleteClientButton({ clientId, clientName }: { clientId: string, clientName: string }) {
    const { t, isRtl } = useLanguage();
    const [loading, setLoading] = useState(false);

    async function handleDelete() {
        setLoading(true);
        try {
            await deleteClient(clientId);
            toast.success(isRtl ? "تم حذف العميل بنجاح" : "Client deleted successfully");
        } catch (error: any) {
            toast.error(error.message || "Failed to delete client");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent dir={isRtl ? "rtl" : "ltr"}>
                <DialogHeader>
                    <DialogTitle className={isRtl ? "text-right" : ""}>
                        {isRtl ? "هل أنت متأكد من الحذف؟" : "Are you sure?"}
                    </DialogTitle>
                    <DialogDescription className={isRtl ? "text-right" : ""}>
                        {isRtl
                            ? `سيتم حذف العميل "${clientName}" وكافة البيانات المرتبطة به نهائياً.`
                            : `This will permanently delete the client "${clientName}" and all associated data.`}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className={isRtl ? "flex-row-reverse gap-2" : ""}>
                    <DialogClose asChild>
                        <Button variant="outline">{t("common.cancel")}</Button>
                    </DialogClose>
                    <Button
                        variant="destructive"
                        onClick={(e) => {
                            e.preventDefault();
                            handleDelete();
                        }}
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (isRtl ? "حذف" : "Delete")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
