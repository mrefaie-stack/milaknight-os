"use client";

import { useEffect, useState, useCallback } from "react";
import { useLanguage } from "@/contexts/language-context";
import { motion, AnimatePresence } from "framer-motion";
import { setMyStatus } from "@/app/actions/presence";
import { BellOff, Circle, ChevronDown, Clock, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type PresenceData = {
    userId: string;
    name: string;
    role: string;
    status: string;
    activity: string;
    activityUrl: string | null;
    updatedAt: string | null;
    isCurrentUser: boolean;
};

const STATUSES = [
    { value: "ONLINE",  labelEn: "Online",       labelAr: "متصل",        color: "bg-emerald-500" },
    { value: "AWAY",    labelEn: "Away",          labelAr: "بعيد",        color: "bg-yellow-400" },
    { value: "MEETING", labelEn: "In a Meeting",  labelAr: "في اجتماع",   color: "bg-rose-500" },
    { value: "DND",     labelEn: "Focus Mode",    labelAr: "وضع التركيز", color: "bg-purple-500" },
];

function statusMeta(status: string) {
    return STATUSES.find((s) => s.value === status) || STATUSES[0];
}

function timeAgo(updatedAt: string | null, isRtl: boolean): string {
    if (!updatedAt) return "";
    const mins = Math.floor((Date.now() - new Date(updatedAt).getTime()) / 60000);
    if (mins < 1) return isRtl ? "الآن" : "just now";
    if (mins < 60) return isRtl ? `منذ ${mins}د` : `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    return isRtl ? `منذ ${hrs}س` : `${hrs}h ago`;
}

function StatusPicker({ currentStatus, isRtl }: { currentStatus: string; isRtl: boolean }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState<string | null>(null);
    const s = statusMeta(currentStatus);

    async function changeStatus(value: string) {
        setLoading(value);
        setOpen(false);
        try {
            await setMyStatus(value);
            toast.success(isRtl ? "تم تحديث الحالة" : "Status updated");
        } catch {
            toast.error(isRtl ? "فشل تحديث الحالة" : "Failed to update status");
        } finally {
            setLoading(null);
        }
    }

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 transition-all",
                    isRtl ? "flex-row-reverse" : ""
                )}
            >
                <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", s.color)} />
                <span className="text-xs font-black">{isRtl ? s.labelAr : s.labelEn}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className={cn(
                            "absolute top-full mt-1 w-52 bg-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50",
                            isRtl ? "right-0" : "left-0"
                        )}
                    >
                        {STATUSES.map((st) => (
                            <button
                                key={st.value}
                                onClick={() => changeStatus(st.value)}
                                disabled={loading === st.value}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-sm font-bold",
                                    isRtl ? "flex-row-reverse text-right" : "text-left",
                                    currentStatus === st.value && "bg-white/5"
                                )}
                            >
                                <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", st.color)} />
                                <div className={isRtl ? "text-right" : "text-left"}>
                                    <span className="block">{isRtl ? st.labelAr : st.labelEn}</span>
                                    {st.value === "DND" && (
                                        <span className="text-[10px] text-muted-foreground font-medium">
                                            {isRtl ? "يمنع الإشعارات" : "Suppresses distractions"}
                                        </span>
                                    )}
                                </div>
                                {currentStatus === st.value && <Circle className="h-2 w-2 text-primary fill-primary ml-auto" />}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

type Props = {
    initialData: PresenceData[];
    currentUserId: string;
};

export function OfficeView({ initialData, currentUserId }: Props) {
    const { isRtl } = useLanguage();
    const [presences, setPresences] = useState<PresenceData[]>(
        initialData.map((p) => ({ ...p, isCurrentUser: p.userId === currentUserId }))
    );
    const [connected, setConnected] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

    const refreshPresence = useCallback(async () => {
        try {
            const res = await fetch("/api/presence", { cache: "no-store" });
            if (!res.ok) return;
            const data: PresenceData[] = await res.json();
            setPresences(data.map(p => ({ ...p, isCurrentUser: p.userId === currentUserId })));
            setLastRefresh(new Date());
            setConnected(true);
        } catch {
            setConnected(false);
        }
    }, [currentUserId]);

    useEffect(() => {
        refreshPresence();
        const p = setInterval(refreshPresence, 15000);
        return () => clearInterval(p);
    }, [refreshPresence]);

    const currentUser = presences.find((p) => p.isCurrentUser);
    const onlineUsers = presences.filter((p) => p.status !== "OFFLINE");
    const offlineUsers = presences.filter((p) => p.status === "OFFLINE");

    const [time, setTime] = useState(() =>
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
    useEffect(() => {
        const t = setInterval(() =>
            setTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })), 10000
        );
        return () => clearInterval(t);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8 pb-10"
            dir={isRtl ? "rtl" : "ltr"}
        >
            {/* Header */}
            <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-4", isRtl ? "text-right" : "")}>
                <div className="space-y-1">
                    <h1 className="text-3xl md:text-5xl font-black tracking-tighter premium-gradient-text uppercase">
                        {isRtl ? "المكتب الافتراضي" : "Virtual Office"}
                    </h1>
                    <div className={cn("flex items-center gap-3 text-sm text-muted-foreground flex-wrap", isRtl ? "flex-row-reverse" : "")}>
                        <span className="font-bold">{time}</span>
                        <span className="text-white/20">·</span>
                        <span className={cn("flex items-center gap-1.5", isRtl ? "flex-row-reverse" : "")}>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="font-bold text-emerald-500">
                                {onlineUsers.length} {isRtl ? "متصل الآن" : "online now"}
                            </span>
                        </span>
                        <span className="text-white/20">·</span>
                        <span className={cn("flex items-center gap-1 text-xs", isRtl ? "flex-row-reverse" : "")}>
                            {connected
                                ? <Wifi className="h-3 w-3 text-muted-foreground/40" />
                                : <WifiOff className="h-3 w-3 text-red-400" />
                            }
                            <span className="opacity-40">
                                {lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                        </span>
                    </div>
                </div>
                {currentUser && (
                    <div className={cn("flex items-center gap-3", isRtl ? "flex-row-reverse" : "")}>
                        <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                            {isRtl ? "حالتي:" : "My status:"}
                        </span>
                        <StatusPicker currentStatus={currentUser.status} isRtl={isRtl} />
                    </div>
                )}
            </div>

            {/* Focus Mode Banner */}
            {currentUser?.status === "DND" && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                        "flex items-center gap-3 p-4 rounded-2xl border border-purple-500/20 bg-purple-500/10",
                        isRtl ? "flex-row-reverse text-right" : ""
                    )}
                >
                    <BellOff className="h-5 w-5 text-purple-400 shrink-0" />
                    <div>
                        <p className="text-sm font-black text-purple-300">
                            {isRtl ? "وضع التركيز نشط" : "Focus Mode Active"}
                        </p>
                        <p className="text-xs text-purple-400/60 font-medium">
                            {isRtl ? "أنت في وضع التركيز" : "You're in focus mode — your team knows you're heads down"}
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Online Team */}
            {onlineUsers.filter(p => !p.isCurrentUser).length > 0 && (
                <div className="space-y-3">
                    <p className={cn("text-[10px] font-black uppercase tracking-[0.25em] text-primary/40", isRtl ? "text-right" : "")}>
                        {isRtl ? "الفريق المتصل" : "Online Team"}
                    </p>
                    <div className={cn("flex flex-wrap gap-3", isRtl ? "flex-row-reverse" : "")}>
                        {onlineUsers.filter(p => !p.isCurrentUser).map((user) => {
                            const initials = user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
                            const s = statusMeta(user.status);
                            return (
                                <div
                                    key={user.userId}
                                    className={cn("flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/8", isRtl ? "flex-row-reverse" : "")}
                                >
                                    <div className="relative">
                                        <div className="w-7 h-7 rounded-lg bg-white/8 flex items-center justify-center text-[11px] font-black">
                                            {initials}
                                        </div>
                                        <span className={cn("absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background", s.color)} />
                                    </div>
                                    <div className={isRtl ? "text-right" : ""}>
                                        <p className="text-xs font-black">{user.name}</p>
                                        <p className="text-[10px] text-muted-foreground">{isRtl ? s.labelAr : s.labelEn}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Offline Users */}
            {offlineUsers.length > 0 && (
                <div className="space-y-3">
                    <p className={cn("text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/30", isRtl ? "text-right" : "")}>
                        {isRtl ? "غير متصل" : "Offline"}
                    </p>
                    <div className={cn("flex flex-wrap gap-3", isRtl ? "flex-row-reverse" : "")}>
                        {offlineUsers.map((user) => {
                            const initials = user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
                            return (
                                <div
                                    key={user.userId}
                                    className={cn("flex items-center gap-2 px-3 py-2 rounded-xl bg-white/3 border border-white/5 opacity-40", isRtl ? "flex-row-reverse" : "")}
                                >
                                    <div className="relative">
                                        <div className="w-7 h-7 rounded-lg bg-white/8 flex items-center justify-center text-[11px] font-black">
                                            {initials}
                                        </div>
                                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background bg-zinc-600" />
                                    </div>
                                    <div className={isRtl ? "text-right" : ""}>
                                        <p className="text-xs font-black">{user.name}</p>
                                        {user.updatedAt && (
                                            <p className={cn("text-[9px] text-muted-foreground flex items-center gap-0.5", isRtl ? "flex-row-reverse" : "")}>
                                                <Clock className="h-2.5 w-2.5" />
                                                {timeAgo(user.updatedAt, isRtl)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </motion.div>
    );
}
