"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock, User, Building, Sparkles, AlertCircle } from "lucide-react";
import { updateRequestStatus } from "@/app/actions/service-request";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export function AdminRequestsUI({ initialRequests }: { initialRequests: any[] }) {
    const { isRtl, t } = useLanguage();
    const [requests, setRequests] = useState(initialRequests);
    const [loading, setLoading] = useState<string | null>(null);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [rejectReason, setRejectReason] = useState("");

    const handleAction = async (requestId: string, status: "APPROVED" | "REJECTED", adminNotes?: string) => {
        setLoading(requestId);
        try {
            const updated = await updateRequestStatus(requestId, status, adminNotes);
            setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status, adminNotes } : r));
            toast.success(status === "APPROVED" ? "Request approved" : "Request rejected");
        } catch (error: any) {
            toast.error(error.message || "Action failed");
        } finally {
            setLoading(null);
            setRejectDialogOpen(false);
            setRejectReason("");
            setSelectedRequest(null);
        }
    };

    const openRejectDialog = (request: any) => {
        setSelectedRequest(request);
        setRejectDialogOpen(true);
    };

    return (
        <div className="space-y-8" dir={isRtl ? "rtl" : "ltr"}>
            <div className={`space-y-2 ${isRtl ? 'text-right' : ''}`}>
                <h1 className="text-4xl font-black tracking-tight premium-gradient-text uppercase">
                    {isRtl ? "طلبات الخدمات" : "Service Requests"}
                </h1>
                <p className="text-muted-foreground font-medium opacity-60">
                    {isRtl ? "إدارة طلبات العملاء للخدمات الجديدة." : "Manage client requests for additional agency services."}
                </p>
            </div>

            <div className="grid gap-4">
                {requests.length === 0 ? (
                    <div className="py-20 text-center glass-card rounded-3xl opacity-40">
                        <Sparkles className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                        <p className="font-black italic uppercase tracking-widest">{isRtl ? "لا توجد طلبات حالياً" : "No requests found"}</p>
                    </div>
                ) : (
                    requests.map((request) => (
                        <Card key={request.id} className="glass-card border-none overflow-hidden rounded-3xl hover:bg-white/5 transition-all">
                            <CardContent className="p-6">
                                <div className={`flex flex-col md:flex-row md:items-center justify-between gap-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                    {/* Client & Service Info */}
                                    <div className={`flex items-start gap-4 flex-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                            <Building className="h-7 w-7" />
                                        </div>
                                        <div className={`space-y-1 ${isRtl ? 'text-right' : ''}`}>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-xl font-black">{request.client?.name || "Unknown Client"}</h3>
                                                <Badge variant="outline" className="rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-widest bg-primary/5 text-primary">
                                                    {isRtl ? request.globalService?.nameAr : request.globalService?.nameEn}
                                                </Badge>
                                            </div>
                                            <div className={`flex items-center gap-3 text-xs font-bold text-muted-foreground ${isRtl ? 'flex-row-reverse' : ''}`}>
                                                <div className="flex items-center gap-1">
                                                    <User className="h-3 w-3" />
                                                    {request.client?.accountManager ? `${request.client.accountManager.firstName} ${request.client.accountManager.lastName}` : "No AM"}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    <span suppressHydrationWarning>{request.createdAt ? new Date(request.createdAt).toLocaleDateString() : ""}</span>
                                                </div>
                                            </div>
                                            {request.notes && (
                                                <p className="text-sm mt-2 p-3 rounded-xl bg-white/5 italic opacity-80">
                                                    "{request.notes}"
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions & Status */}
                                    <div className={`flex items-center gap-3 shrink-0 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                        {request.status === 'PENDING' ? (
                                            <>
                                                <Button
                                                    onClick={() => openRejectDialog(request)}
                                                    variant="secondary"
                                                    disabled={loading === request.id}
                                                    className="rounded-full font-black uppercase tracking-widest text-xs h-10 px-6 bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                                >
                                                    <XCircle className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                                                    {isRtl ? "رفض" : "Reject"}
                                                </Button>
                                                <Button
                                                    onClick={() => handleAction(request.id, "APPROVED")}
                                                    disabled={loading === request.id}
                                                    className="rounded-full font-black uppercase tracking-widest text-xs h-10 px-6 shadow-lg shadow-emerald-500/20"
                                                >
                                                    <CheckCircle2 className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                                                    {isRtl ? "موافقة" : "Approve"}
                                                </Button>
                                            </>
                                        ) : (
                                            <div className={`flex flex-col ${isRtl ? 'items-end' : 'items-start'}`}>
                                                <Badge className={`
                                                    rounded-full px-6 py-2 font-black uppercase tracking-widest text-xs
                                                    ${request.status === 'APPROVED' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}
                                                `}>
                                                    {isRtl ? (request.status === 'APPROVED' ? 'تم الموافقة' : 'مرفوض') : request.status}
                                                </Badge>
                                                {request.adminNotes && (
                                                    <p className="text-[10px] text-muted-foreground font-bold mt-1 max-w-[150px] truncate">
                                                        {request.adminNotes}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Reject Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent className="rounded-3xl border-none" dir={isRtl ? "rtl" : "ltr"}>
                    <DialogHeader>
                        <DialogTitle className={isRtl ? "text-right" : ""}>
                            {isRtl ? "رفض الطلب" : "Reject Request"}
                        </DialogTitle>
                        <DialogDescription className={isRtl ? "text-right" : ""}>
                            {isRtl ? "هل أنت متأكد من رفض هذا الطلب؟ يمكنك إضافة ملاحظات للعميل." : "Are you sure you want to reject this request? You can provide a reason."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            placeholder={isRtl ? "مثال: هذه الخدمة غير متوفرة في منطقتك حالياً" : "Example: This service is currently unavailable for your region."}
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className={`min-h-[100px] rounded-2xl ${isRtl ? 'text-right' : ''}`}
                        />
                    </div>
                    <DialogFooter className={isRtl ? 'flex-row-reverse gap-2' : ''}>
                        <Button variant="ghost" onClick={() => setRejectDialogOpen(false)} className="rounded-full font-bold">
                            {isRtl ? "إلغاء" : "Cancel"}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => selectedRequest && handleAction(selectedRequest.id, "REJECTED", rejectReason)}
                            className="rounded-full font-bold"
                        >
                            {isRtl ? "تأكيد الرفض" : "Confirm Rejection"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
