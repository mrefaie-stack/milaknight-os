"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Bell, BellOff, ExternalLink, CheckCircle } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useLanguage } from "@/contexts/language-context";
import { markAsRead } from "@/app/actions/notification";
import { useRouter } from "next/navigation";

export function NotificationsView({ initialNotifications }: { initialNotifications: any[] }) {
    const { t, isRtl } = useLanguage();
    const router = useRouter();

    async function handleMarkRead(id: string) {
        await markAsRead(id);
        router.refresh();
    }

    return (
        <div className="space-y-6" dir={isRtl ? "rtl" : "ltr"}>
            <div className={isRtl ? 'text-right' : 'text-left'}>
                <h1 className="text-4xl font-black tracking-tighter premium-gradient-text uppercase">
                    {t("common.notifications")}
                </h1>
                <p className="text-muted-foreground font-medium opacity-70">
                    {t("notifications.subtitle") || "Stay updated on alerts, messages, and system activities."}
                </p>
            </div>

            <Card className="glass-card border-none overflow-hidden rounded-3xl">
                <CardContent className="p-0">
                    <div className="divide-y divide-white/5">
                        {initialNotifications.map((n) => (
                            <div
                                key={n.id}
                                className={`p-6 flex items-start gap-4 transition-all hover:bg-white/5 ${!n.isRead ? 'bg-primary/5' : ''} ${isRtl ? 'flex-row-reverse' : ''}`}
                            >
                                <div className={`p-3 rounded-2xl ${!n.isRead ? 'bg-primary/20 text-primary animate-pulse' : 'bg-white/5 text-muted-foreground opacity-40'}`}>
                                    <Bell className="h-5 w-5" />
                                </div>
                                <div className={`flex-1 space-y-2 ${isRtl ? 'text-right' : 'text-left'}`}>
                                    <div className={`flex items-center justify-between gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                        <p className="font-black tracking-tight text-lg">{n.title}</p>
                                        <span className="text-[10px] font-black uppercase text-muted-foreground opacity-40 shrink-0">
                                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                                        {n.message}
                                    </p>

                                    <div className={`flex items-center gap-6 pt-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                        {n.link && (
                                            <Link
                                                href={n.link}
                                                className="text-[10px] font-black text-primary flex items-center gap-2 hover:opacity-70 uppercase tracking-widest bg-primary/10 px-4 py-2 rounded-full transition-all"
                                            >
                                                {t("common.view_details") || "View Details"} <ExternalLink className="h-3 w-3" />
                                            </Link>
                                        )}
                                        {!n.isRead && (
                                            <button
                                                onClick={() => handleMarkRead(n.id)}
                                                className="text-[10px] font-black text-emerald-500 flex items-center gap-2 hover:opacity-70 uppercase tracking-widest px-2 transition-all"
                                            >
                                                <CheckCircle className="h-3 w-3" /> {t("common.mark_read") || "Mark as Read"}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {initialNotifications.length === 0 && (
                            <div className="p-24 text-center flex flex-col items-center justify-center space-y-6 opacity-30">
                                <div className="p-6 bg-white/5 rounded-full">
                                    <BellOff className="h-12 w-12" />
                                </div>
                                <p className="text-muted-foreground font-black uppercase tracking-[0.2em] italic text-sm">
                                    {t("notifications.empty") || "You're all caught up!"}
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
