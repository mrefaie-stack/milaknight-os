"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EditClientDialog } from "@/components/admin/edit-client-dialog";
import { ArrowRight, ArrowLeft, User2, BarChart2, Users2, Search, Trash2, Loader2 } from "lucide-react";
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

const PACKAGE_COLORS: Record<string, string> = {
    STARTER: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    GROWTH: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    PREMIUM: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    ENTERPRISE: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    BASIC: "bg-blue-500/10 text-blue-500 border-blue-500/20",
};

const PLAN_STATUS_AR: Record<string, string> = {
    APPROVED: "معتمد", DRAFT: "مسودة", PENDING: "قيد المراجعة",
    REVISION_REQUESTED: "يحتاج تعديل", PUBLISHED: "منشور",
};
const REPORT_STATUS_AR: Record<string, string> = {
    SENT: "مُرسل", DRAFT: "مسودة",
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
            <div className="border border-dashed rounded-3xl p-16 text-center flex flex-col items-center justify-center space-y-3 bg-card/20">
                <div className="h-16 w-16 rounded-full bg-primary/5 flex items-center justify-center mb-2">
                    <Users2 className="h-8 w-8 text-primary opacity-30" />
                </div>
                <h3 className="font-black text-xl tracking-tight">
                    {isRtl ? "لا يوجد عملاء بعد" : "No clients yet"}
                </h3>
                <p className="text-muted-foreground text-sm font-medium">
                    {isRtl ? "أضف أول عميل للبدء." : "Add your first client to get started."}
                </p>
            </div>
        );
    }

    const isAdminPath = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
    const basePath = isAdminPath ? '/admin' : '/am';
    const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

    return (
        <div className="space-y-5" dir={isRtl ? "rtl" : "ltr"}>
            {/* Search bar */}
            <div className="relative">
                <input
                    type="text"
                    placeholder={isRtl ? "بحث بالاسم، المجال، أو مدير الحساب..." : "Search by name, industry, or account manager..."}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className={`w-full h-12 px-5 ${isRtl ? 'pl-12' : 'pr-12'} rounded-2xl bg-card/50 border border-white/10 text-sm font-medium focus:outline-none focus:border-primary/40 placeholder:text-muted-foreground/50 backdrop-blur-sm`}
                />
                <Search className={`absolute ${isRtl ? 'left-4' : 'right-4'} top-3.5 h-5 w-5 text-muted-foreground opacity-40`} />
            </div>

            {/* Count */}
            <p className="text-xs font-black uppercase tracking-wider text-muted-foreground opacity-50">
                {isRtl
                    ? `${filtered.length} ${filtered.length === 1 ? 'عميل' : 'عملاء'}`
                    : `${filtered.length} ${filtered.length === 1 ? 'Client' : 'Clients'}`}
            </p>

            {/* Cards Grid */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {filtered.map((client) => {
                    const latestReport = client.reports?.[0];
                    const latestPlan = client.actionPlans?.[0];
                    const pkgClass = PACKAGE_COLORS[client.package] || "bg-muted/20 text-muted-foreground border-border";

                    const planStatusDisplay = latestPlan?.status
                        ? (isRtl ? (PLAN_STATUS_AR[latestPlan.status] || latestPlan.status) : latestPlan.status)
                        : "—";
                    const reportStatusDisplay = latestReport?.status
                        ? (isRtl ? (REPORT_STATUS_AR[latestReport.status] || latestReport.status) : latestReport.status)
                        : "—";

                    return (
                        <div
                            key={client.id}
                            className="group relative flex flex-col rounded-3xl border border-white/8 bg-card/40 backdrop-blur-md p-6 gap-4 hover:border-primary/20 hover:bg-card/60 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
                        >
                            {/* Top Row */}
                            <div className={`flex items-start justify-between gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center font-black text-primary text-xl shrink-0">
                                        {client.name.substring(0, 1).toUpperCase()}
                                    </div>
                                    <div className={isRtl ? 'text-right' : 'text-left'}>
                                        <h3 className="font-black text-lg leading-tight tracking-tight">{client.name}</h3>
                                        <p className="text-[11px] font-bold text-muted-foreground opacity-60 uppercase tracking-wider">{client.industry || "—"}</p>
                                    </div>
                                </div>
                                {client.package && (
                                    <Badge className={`text-[10px] font-black uppercase tracking-wider border ${pkgClass} shrink-0`}>
                                        {client.package}
                                    </Badge>
                                )}
                            </div>

                            {/* Stats Row */}
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="p-2 rounded-xl bg-white/5">
                                    <div className="text-[9px] font-black uppercase text-muted-foreground opacity-50 mb-0.5">
                                        {isRtl ? "م.الحساب" : "AM"}
                                    </div>
                                    <div className="text-xs font-black truncate">{client.accountManager?.firstName || "—"}</div>
                                </div>
                                <div className="p-2 rounded-xl bg-white/5">
                                    <div className="text-[9px] font-black uppercase text-muted-foreground opacity-50 mb-0.5">
                                        {isRtl ? "الخطة" : "Plan"}
                                    </div>
                                    <div className={`text-xs font-black ${latestPlan?.status === 'APPROVED' ? 'text-emerald-500' : 'text-orange-500'}`}>
                                        {planStatusDisplay}
                                    </div>
                                </div>
                                <div className="p-2 rounded-xl bg-white/5">
                                    <div className="text-[9px] font-black uppercase text-muted-foreground opacity-50 mb-0.5">
                                        {isRtl ? "التقرير" : "Report"}
                                    </div>
                                    <div className={`text-xs font-black ${latestReport?.status === 'SENT' ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {reportStatusDisplay}
                                    </div>
                                </div>
                            </div>

                            {/* Services */}
                            {client.services?.length > 0 && (
                                <div className={`flex gap-1.5 flex-wrap ${isRtl ? 'flex-row-reverse' : ''}`}>
                                    {client.services.map((s: any) => (
                                        <Badge key={s.id} variant="secondary" className="text-[10px] rounded-full font-bold">{s.name}</Badge>
                                    ))}
                                </div>
                            )}

                            {/* Actions */}
                            <div className={`flex items-center justify-between pt-3 border-t border-white/5 mt-auto gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <Link href={`${basePath}/clients/${client.id}`} className="flex-1">
                                    <Button variant="ghost" size="sm" className={`w-full rounded-xl font-black uppercase tracking-wide text-xs h-9 hover:bg-primary/10 hover:text-primary flex items-center gap-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
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
                <div className="text-center py-12 text-muted-foreground font-bold opacity-50">
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
