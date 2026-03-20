"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, ExternalLink } from "lucide-react";
import { getClickupDueTodayTasks } from "@/app/actions/clickup";

export function ClickupDueTodayWidget() {
    const { isRtl } = useLanguage();
    const [tasks, setTasks] = useState<any[] | null>(null); // null = not connected

    useEffect(() => {
        getClickupDueTodayTasks().then(setTasks).catch(() => setTasks(null));
    }, []);

    // null = not connected; [] = connected but no tasks today
    if (tasks === null || tasks.length === 0) return null;

    return (
        <Card className="bg-card border-border" dir={isRtl ? "rtl" : "ltr"}>
            <CardContent className="p-5">
                <div className={`flex items-center gap-2 mb-3 ${isRtl ? "flex-row-reverse" : ""}`}>
                    <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <Clock className="h-4 w-4 text-amber-400" />
                    </div>
                    <div>
                        <p className="section-label text-amber-400">ClickUp</p>
                        <p className="text-sm font-semibold">
                            {isRtl ? `مهام اليوم (${tasks.length})` : `Due Today (${tasks.length})`}
                        </p>
                    </div>
                </div>
                <div className="space-y-1.5">
                    {tasks.slice(0, 5).map((task: any) => (
                        <a
                            key={task.id}
                            href={task.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-2 p-2 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all group ${isRtl ? "flex-row-reverse" : ""}`}
                        >
                            <div
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: task.status?.color || "#6bc7f6" }}
                            />
                            <span className="text-xs font-medium flex-1 truncate group-hover:text-primary transition-colors">
                                {task.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground truncate shrink-0 max-w-[80px]">
                                {task.list?.name}
                            </span>
                            <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
                        </a>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
