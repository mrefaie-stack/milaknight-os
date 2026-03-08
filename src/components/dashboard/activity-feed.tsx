"use client";

import { useEffect, useState } from "react";
import { getRecentActivities } from "@/app/actions/activity";
import { formatDistanceToNow } from "date-fns";
import { Activity, User, FileText, CheckCircle2, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

export function ActivityFeed() {
    const { t, isRtl } = useLanguage();
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

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-20">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p className="text-xs font-black uppercase tracking-widest">{isRtl ? 'جاري التزامن...' : 'Synchronizing...'}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4" dir={isRtl ? "rtl" : "ltr"}>
            <div className="space-y-3">
                {activities.map((log) => (
                    <div key={log.id} className={`flex gap-4 items-start p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <div className="mt-1 p-2 bg-primary/10 rounded-xl group-hover:scale-110 transition-transform">
                            {getIcon(log.entityType)}
                        </div>
                        <div className="flex-1">
                            <p className={`text-sm font-bold leading-tight ${isRtl ? 'text-right' : 'text-left'}`}>
                                <span className="text-primary">{log.user.firstName} {log.user.lastName}</span>
                                <span className="text-muted-foreground font-medium opacity-80"> {log.action}</span>
                            </p>
                            <p className={`text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1 opacity-40 ${isRtl ? 'text-right' : 'text-left'}`}>
                                {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                            </p>
                        </div>
                    </div>
                ))}

                {activities.length === 0 && (
                    <div className="text-center py-12 opacity-30">
                        <p className="text-sm font-black uppercase tracking-widest italic">{t("dashboard.no_activities_found") || "No recent activity"}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
