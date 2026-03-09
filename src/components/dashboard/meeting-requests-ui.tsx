"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import { updateMeetingStatus } from "@/app/actions/meeting";
import { toast } from "sonner";
import {
    CalendarDays,
    Clock,
    CheckCircle2,
    XCircle,
    Users,
    MessageSquare,
    ChevronRight,
    Search,
    Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";

const STATUS_CONFIG: Record<string, { color: string, icon: any, labelAr: string, labelEn: string }> = {
    PENDING: { color: "text-orange-500 bg-orange-500/10 border-orange-500/20", icon: Clock, labelAr: "قيد الانتظار", labelEn: "Pending" },
    COMPLETED: { color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle2, labelAr: "مكتمل", labelEn: "Completed" },
    CANCELLED: { color: "text-red-500 bg-red-500/10 border-red-500/20", icon: XCircle, labelAr: "ملغي", labelEn: "Cancelled" },
};

export function MeetingRequestsUI({ requests: initialRequests, userRole }: { requests: any[], userRole: string }) {
    const { isRtl } = useLanguage();
    const [requests, setRequests] = useState(initialRequests);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("ALL");
    const [isLoading, setIsLoading] = useState<string | null>(null);

    const filteredRequests = requests.filter(req => {
        const matchesSearch = (req.client?.name || "").toLowerCase().includes(search.toLowerCase()) ||
            (req.reason || "").toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === "ALL" || req.status === filter;
        return matchesSearch && matchesFilter;
    });

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        setIsLoading(id);
        try {
            await updateMeetingStatus(id, newStatus);
            setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
            toast.success(isRtl ? "تم تحديث حالة الطلب" : "Status updated successfully");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                    <Input
                        placeholder={isRtl ? "البحث في الطلبات..." : "Search requests..."}
                        className={`${isRtl ? 'pr-9' : 'pl-9'} rounded-2xl border-white/10 bg-white/5`}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                    {["ALL", "PENDING", "COMPLETED", "CANCELLED"].map(s => (
                        <Button
                            key={s}
                            variant={filter === s ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilter(s)}
                            className="rounded-xl font-black uppercase tracking-widest text-[10px] h-9"
                        >
                            {s === "ALL" ? (isRtl ? "الكل" : "ALL") : (isRtl ? STATUS_CONFIG[s].labelAr : STATUS_CONFIG[s].labelEn)}
                        </Button>
                    ))}
                </div>
            </div>

            {filteredRequests.length > 0 ? (
                <div className="grid gap-4">
                    {filteredRequests.map((req) => {
                        const status = STATUS_CONFIG[req.status] || STATUS_CONFIG.PENDING;
                        const StatusIcon = status.icon;

                        return (
                            <Card key={req.id} className="group overflow-hidden bg-card/40 backdrop-blur-xl border-white/10 hover:border-primary/20 transition-all duration-300 rounded-3xl">
                                <CardContent className="p-0">
                                    <div className={`flex flex-col md:flex-row md:items-center p-6 gap-6 ${isRtl ? 'md:flex-row-reverse' : ''}`}>
                                        {/* Client Info (for AM/Admin) */}
                                        {(userRole === "AM" || userRole === "ADMIN") && (
                                            <div className={`flex items-center gap-3 min-w-[200px] ${isRtl ? 'flex-row-reverse text-right' : ''}`}>
                                                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                                    {req.client?.logoUrl ? (
                                                        <img src={req.client.logoUrl} alt="" className="h-8 w-8 object-contain" />
                                                    ) : (
                                                        <Users className="h-6 w-6 text-primary" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-black text-sm uppercase tracking-tight">{req.client?.name}</p>
                                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Client Request</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Reason & Content */}
                                        <div className={`flex-1 space-y-2 ${isRtl ? 'text-right' : 'text-left'}`}>
                                            <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                                <MessageSquare className="h-4 w-4 text-primary opacity-60" />
                                                <h3 className="font-bold text-base leading-tight">{req.reason}</h3>
                                            </div>
                                            <div className={`flex flex-wrap items-center gap-3 text-xs text-muted-foreground ${isRtl ? 'flex-row-reverse' : ''}`}>
                                                <div className={`flex items-center gap-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                                    <Users className="h-3.5 w-3.5" />
                                                    <span>{isRtl ? "الفرق المطلوبة:" : "Teams:"} {req.teams}</span>
                                                </div>
                                                <div className={`flex items-center gap-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                                    <CalendarDays className="h-3.5 w-3.5" />
                                                    <span>{new Date(req.createdAt).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status & Actions */}
                                        <div className={`flex flex-col md:items-end gap-4 min-w-[150px] ${isRtl ? 'md:items-start' : ''}`}>
                                            <Badge className={`rounded-lg py-1 px-3 border font-black text-[10px] uppercase tracking-widest ${status.color}`}>
                                                <StatusIcon className={`h-3 w-3 ${isRtl ? 'ml-1.5' : 'mr-1.5'}`} />
                                                {isRtl ? status.labelAr : status.labelEn}
                                            </Badge>

                                            {(userRole === "AM" || userRole === "ADMIN") && req.status === "PENDING" && (
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10 rounded-xl text-[10px] font-black"
                                                        onClick={() => handleStatusUpdate(req.id, "COMPLETED")}
                                                        disabled={isLoading === req.id}
                                                    >
                                                        {isRtl ? "إتمام" : "COMPLETE"}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-xl text-[10px] font-black"
                                                        onClick={() => handleStatusUpdate(req.id, "CANCELLED")}
                                                        disabled={isLoading === req.id}
                                                    >
                                                        {isRtl ? "إلغاء" : "CANCEL"}
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <div className="py-24 rounded-3xl border-2 border-dashed border-white/10 text-center">
                    <CalendarDays className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                    <p className="text-muted-foreground font-semibold">{isRtl ? 'لا توجد طلبات اجتماعات حالياً.' : 'No meeting requests found.'}</p>
                </div>
            )}
        </div>
    );
}
