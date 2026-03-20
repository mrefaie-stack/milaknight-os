"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Bell, BellOff, ExternalLink, CheckCircle, CheckCheck } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useLanguage } from "@/contexts/language-context";
import { markAsRead, markAllAsRead } from "@/app/actions/notification";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function NotificationsView({ initialNotifications }: { initialNotifications: any[] }) {
    const { t, isRtl } = useLanguage();
    const router = useRouter();

    async function handleMarkRead(id: string) {
        await markAsRead(id);
        router.refresh();
    }

    async function handleMarkAll() {
        await markAllAsRead();
        router.refresh();
    }

    const unreadCount = initialNotifications.filter(n => !n.isRead).length;

    return (
        <div className="space-y-5" dir={isRtl ? "rtl" : "ltr"}>
            <div className={cn("flex items-start justify-between gap-4 flex-wrap", isRtl ? "flex-row-reverse" : "")}>
                <div className={isRtl ? "text-right" : ""}>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {t("common.notifications")}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {t("notifications.subtitle") || "Stay updated on alerts, messages, and system activities."}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleMarkAll}
                        className="gap-2 text-emerald-500 hover:text-emerald-500 hover:bg-emerald-500/10"
                    >
                        <CheckCheck className="h-4 w-4" />
                        {isRtl ? "قراءة الكل" : "Mark All as Read"}
                    </Button>
                )}
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="divide-y divide-border">
                        {initialNotifications.map((n) => (
                            <div
                                key={n.id}
                                className={cn(
                                    "p-4 flex items-start gap-3 transition-colors hover:bg-muted/30",
                                    !n.isRead ? "bg-primary/5" : "",
                                    isRtl ? "flex-row-reverse" : "",
                                )}
                            >
                                <div className={cn(
                                    "p-2 rounded-lg shrink-0 mt-0.5",
                                    !n.isRead ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                                )}>
                                    <Bell className="h-4 w-4" />
                                </div>
                                <div className={cn("flex-1 space-y-1.5 min-w-0", isRtl ? "text-right" : "")}>
                                    <div className={cn("flex items-start justify-between gap-3", isRtl ? "flex-row-reverse" : "")}>
                                        <p className="text-sm font-semibold leading-tight">{n.title}</p>
                                        <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {n.message}
                                    </p>

                                    <div className={cn("flex items-center gap-4 pt-1", isRtl ? "flex-row-reverse" : "")}>
                                        {n.link && (
                                            <Link
                                                href={n.link}
                                                className="text-xs font-medium text-primary flex items-center gap-1.5 hover:underline"
                                            >
                                                {t("common.view_details") || "View Details"}
                                                <ExternalLink className="h-3 w-3" />
                                            </Link>
                                        )}
                                        {!n.isRead && (
                                            <button
                                                onClick={() => handleMarkRead(n.id)}
                                                className="text-xs font-medium text-emerald-500 flex items-center gap-1.5 hover:underline"
                                            >
                                                <CheckCircle className="h-3 w-3" />
                                                {t("common.mark_read") || "Mark as Read"}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {initialNotifications.length === 0 && (
                            <div className="p-16 text-center flex flex-col items-center justify-center gap-4">
                                <div className="p-4 bg-muted rounded-full">
                                    <BellOff className="h-8 w-8 text-muted-foreground/50" />
                                </div>
                                <p className="text-sm text-muted-foreground">
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
