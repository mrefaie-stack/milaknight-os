"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { requestInsightRefresh } from "@/app/actions/insights";
import type { InsightType } from "@/app/actions/insights";
import { formatDistanceToNow } from "date-fns";

const CACHE_MS = 12 * 60 * 60 * 1000;

function formatCountdown(ms: number, isRtl: boolean): string {
    const totalMins = Math.ceil(ms / 60000);
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;

    if (isRtl) {
        if (hours > 0 && mins > 0) return `باقي ${hours}س ${mins}د`;
        if (hours > 0) return `باقي ${hours} ساعة`;
        return `باقي ${mins} دقيقة`;
    } else {
        if (hours > 0 && mins > 0) return `${hours}h ${mins}m left`;
        if (hours > 0) return `${hours}h left`;
        return `${mins}m left`;
    }
}

interface Props {
    type: InsightType;
    createdAt: Date;
    isRtl: boolean;
}

export function RefreshInsightButton({ type, createdAt, isRtl }: Props) {
    const router = useRouter();
    const [remainingMs, setRemainingMs] = useState<number>(() => {
        const age = Date.now() - new Date(createdAt).getTime();
        return Math.max(0, CACHE_MS - age);
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Tick every 30s to keep countdown fresh
    useEffect(() => {
        if (remainingMs <= 0) return;
        const id = setInterval(() => {
            const age = Date.now() - new Date(createdAt).getTime();
            setRemainingMs(Math.max(0, CACHE_MS - age));
        }, 30000);
        return () => clearInterval(id);
    }, [createdAt, remainingMs]);

    const handleRefresh = useCallback(async () => {
        if (remainingMs > 0 || loading) return;
        setLoading(true);
        setError(null);
        try {
            const result = await requestInsightRefresh(type);
            if (result.ok) {
                router.refresh();
            } else if (result.remainingMs) {
                setRemainingMs(result.remainingMs);
            }
        } catch {
            setError(isRtl ? "حدث خطأ، حاول مجدداً" : "Something went wrong");
        } finally {
            setLoading(false);
        }
    }, [remainingMs, loading, type, router, isRtl]);

    const locked = remainingMs > 0;

    return (
        <div className={`flex flex-col items-${isRtl ? "start" : "end"} gap-1`}>
            <div className={`flex items-center gap-2 text-[11px] text-muted-foreground font-medium opacity-60 ${isRtl ? "flex-row-reverse" : ""}`}>
                <RefreshCw className="h-3 w-3 shrink-0" />
                <span>
                    {isRtl ? "آخر تحديث" : "Updated"} {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
                </span>
            </div>

            {locked ? (
                <div className={`flex items-center gap-1.5 text-[11px] text-muted-foreground/50 font-medium ${isRtl ? "flex-row-reverse" : ""}`}>
                    <Clock className="h-3 w-3 shrink-0" />
                    <span>{formatCountdown(remainingMs, isRtl)}</span>
                </div>
            ) : (
                <button
                    onClick={handleRefresh}
                    disabled={loading}
                    className={cn(
                        "flex items-center gap-1.5 text-[11px] font-semibold rounded-full px-3 py-1 transition-all",
                        "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20",
                        loading && "opacity-60 cursor-not-allowed",
                    )}
                >
                    {loading ? (
                        <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                    ) : (
                        <RefreshCw className="h-3 w-3 shrink-0" />
                    )}
                    <span>
                        {loading
                            ? (isRtl ? "جاري التحديث..." : "Updating...")
                            : (isRtl ? "تحديث الآن" : "Refresh now")}
                    </span>
                </button>
            )}

            {error && (
                <span className="text-[10px] text-rose-400">{error}</span>
            )}
        </div>
    );
}
