"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, CheckCircle2, Clock, XCircle, ArrowLeft, ArrowRight, MessageSquare } from "lucide-react";
import Link from "next/link";
import { createServiceRequest } from "@/app/actions/service-request";
import { toast } from "sonner";
import { motion } from "framer-motion";

export function ClientServiceCatalog({ client, globalServices, requests }: { client: any, globalServices: any[], requests: any[] }) {
    const { isRtl, t } = useLanguage();
    const [loading, setLoading] = useState<string | null>(null);

    const handleRequest = async (serviceId: string) => {
        setLoading(serviceId);
        try {
            await createServiceRequest(serviceId);
            toast.success(isRtl ? "تم إرسال طلبك بنجاح" : "Service request sent successfully");
        } catch (error: any) {
            toast.error(error.message || "Failed to send request");
        } finally {
            setLoading(null);
        }
    };

    const isSubscribed = (serviceId: string) => client.services?.some((s: any) => s.globalServiceId === serviceId);
    const getRequestStatus = (serviceId: string) => requests.find(r => r.globalServiceId === serviceId && r.status === "PENDING") ? "PENDING" : null;

    return (
        <div className="space-y-10 max-w-6xl mx-auto" dir={isRtl ? "rtl" : "ltr"}>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className={`space-y-2 ${isRtl ? 'text-right' : ''}`}>
                    <h1 className="text-5xl font-black tracking-tighter premium-gradient-text uppercase">
                        {isRtl ? "مكتبة الخدمات" : "Service Catalog"}
                    </h1>
                    <p className="text-muted-foreground font-medium text-lg opacity-80">
                        {isRtl ? "استكشف خدماتنا الإضافية ووسع نطاق علامتك التجارية." : "Explore extra services and scale your brand reach."}
                    </p>
                </div>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {globalServices.map((service) => {
                    const subscribed = isSubscribed(service.id);
                    const pending = getRequestStatus(service.id);

                    return (
                        <motion.div
                            key={service.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            <Card className={`glass-card border-none overflow-hidden rounded-3xl h-full flex flex-col group transition-all duration-500 ${subscribed ? 'bg-emerald-500/5' : 'hover:bg-white/5'}`}>
                                <CardContent className="p-8 flex-1 flex flex-col space-y-4">
                                    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-2 transition-transform group-hover:scale-110 duration-500 ${subscribed ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10 text-primary'}`}>
                                        {service.icon ? (
                                            // Placeholder for icon mapping if implemented
                                            <Sparkles className="h-7 w-7" />
                                        ) : (
                                            <Sparkles className="h-7 w-7" />
                                        )}
                                    </div>

                                    <div className="space-y-2 flex-1">
                                        <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                            <h3 className="text-2xl font-black tracking-tight">
                                                {isRtl ? service.nameAr : service.nameEn}
                                            </h3>
                                            {subscribed && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                                        </div>
                                        <p className={`text-sm text-muted-foreground font-medium leading-relaxed opacity-70 ${isRtl ? 'text-right' : ''}`}>
                                            {isRtl ? service.descriptionAr : service.descriptionEn}
                                        </p>
                                    </div>

                                    <div className={`pt-6 border-t border-white/5 mt-auto ${isRtl ? 'text-right' : ''}`}>
                                        {subscribed ? (
                                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[10px] w-full justify-center">
                                                {isRtl ? "خدمة نشطة" : "Active Service"}
                                            </Badge>
                                        ) : pending ? (
                                            <Button disabled className="w-full rounded-full font-black uppercase tracking-widest text-[10px] h-12 bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500/10">
                                                <Clock className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                                                {isRtl ? "قيد المراجعة" : "Pending Approval"}
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={() => handleRequest(service.id)}
                                                disabled={loading === service.id}
                                                className="w-full rounded-full font-black uppercase tracking-widest text-[10px] h-12 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all"
                                            >
                                                {loading === service.id ? (isRtl ? "جاري الإرسال..." : "Sending...") : (isRtl ? "طلب هذه الخدمة" : "Request This Service")}
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>

            {/* Request History Section */}
            {requests.length > 0 && (
                <div className="space-y-6 pt-10">
                    <h2 className={`text-3xl font-black uppercase tracking-tighter ${isRtl ? 'text-right' : ''}`}>
                        {isRtl ? "سجل طلباتي" : "My Requests History"}
                    </h2>
                    <div className="grid gap-4">
                        {requests.map((request) => (
                            <div key={request.id} className={`p-6 rounded-3xl bg-card/40 border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <div className={`flex items-center gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                    <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-primary font-black">
                                        <Clock className="h-5 w-5" />
                                    </div>
                                    <div className={isRtl ? 'text-right' : ''}>
                                        <p className="font-black text-lg">{isRtl ? request.globalService.nameAr : request.globalService.nameEn}</p>
                                        <p className="text-xs text-muted-foreground font-bold opacity-60">
                                            {new Date(request.createdAt).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { dateStyle: 'long' })}
                                        </p>
                                    </div>
                                </div>
                                <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                    {request.status === 'REJECTED' && request.adminNotes && (
                                        <p className="text-xs text-red-400 font-medium max-w-[200px] text-center italic">
                                            "{request.adminNotes}"
                                        </p>
                                    )}
                                    <Badge variant="outline" className={`
                                        rounded-full px-4 py-1.5 font-black uppercase tracking-widest text-[9px]
                                        ${request.status === 'PENDING' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : ''}
                                        ${request.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : ''}
                                        ${request.status === 'REJECTED' ? 'bg-red-500/10 text-red-500 border-red-500/20' : ''}
                                    `}>
                                        {isRtl ? (
                                            request.status === 'PENDING' ? 'قيد الانتظار' :
                                                request.status === 'APPROVED' ? 'تمت الموافقة' : 'مرفوض'
                                        ) : request.status}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
