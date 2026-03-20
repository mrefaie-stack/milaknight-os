"use client";

import { useEffect, useState } from "react";
import { getRecentActivities } from "@/app/actions/activity";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { Activity, User, FileText, CheckCircle2, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

export function ActivityFeed() {
    const { isRtl } = useLanguage();
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getRecentActivities()
            .then(setActivities)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case "ActionPlan": return <FileText className="h-4 w-4 text-primary" />;
            case "Report": return <Activity className="h-4 w-4 text-emerald-500" />;
            case "User": return <User className="h-4 w-4 text-orange-500" />;
            default: return <CheckCircle2 className="h-4 w-4 text-primary" />;
        }
    };

    const timeAgo = (date: string) =>
        formatDistanceToNow(new Date(date), {
            addSuffix: true,
            locale: isRtl ? ar : undefined,
        });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-20">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p className="text-xs font-medium">
                    {isRtl ? "جاري التزامن..." : "Synchronizing..."}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4" dir={isRtl ? "rtl" : "ltr"}>
            <div className="space-y-3">
                {activities.map((log) => (
                    <div key={log.id} className={`flex gap-3 items-start p-3.5 rounded-lg border border-border hover:bg-muted/30 transition-colors ${isRtl ? "flex-row-reverse" : ""}`}>
                        <div className="mt-0.5 p-1.5 bg-muted rounded-md shrink-0">
                            {getIcon(log.entityType)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm leading-tight ${isRtl ? "text-right" : "text-left"}`}>
                                <span className="font-medium text-primary">{log.user.firstName} {log.user.lastName}</span>
                                <span className="text-muted-foreground"> {log.action}</span>
                            </p>
                            <p className={`text-[10px] text-muted-foreground mt-0.5 ${isRtl ? "text-right" : ""}`}>
                                {timeAgo(log.createdAt)}
                            </p>
                        </div>
                    </div>
                ))}

                {activities.length === 0 && (
                    <div className="text-center py-10">
                        <p className="text-sm text-muted-foreground">
                            {isRtl ? "لا توجد أنشطة حديثة" : "No recent activity"}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
