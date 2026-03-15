"use client";

import { useEffect, useState, useCallback } from "react";
import { signIn } from "next-auth/react";
import { useLanguage } from "@/contexts/language-context";
import { motion, AnimatePresence } from "framer-motion";
import { setMyStatus } from "@/app/actions/presence";
import {
    BellOff, Circle, ChevronDown, Clock, Wifi, WifiOff,
    CalendarDays, Video, Users, ExternalLink, RefreshCw
} from "lucide-react";
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

type CalendarEvent = {
    id: string;
    title: string;
    start: string;
    end: string;
    meetLink: string | null;
    attendees: string[];
};

const STATUSES = [
    { value: "ONLINE", labelEn: "Online", labelAr: "متصل", color: "bg-emerald-500" },
    { value: "AWAY", labelEn: "Away", labelAr: "بعيد", color: "bg-yellow-400" },
    { value: "MEETING", labelEn: "In a Meeting", labelAr: "في اجتماع", color: "bg-rose-500" },
    { value: "DND", labelEn: "Focus Mode", labelAr: "وضع التركيز", color: "bg-purple-500" },
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

function formatEventTime(start: string, end: string, isRtl: boolean): string {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const now = new Date();
    const isToday = startDate.toDateString() === now.toDateString();
    const isTomorrow = new Date(now.getTime() + 86400000).toDateString() === startDate.toDateString();

    const timeStr = startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const endStr = endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const dayLabel = isToday
        ? (isRtl ? "اليوم" : "Today")
        : isTomorrow
        ? (isRtl ? "غداً" : "Tomorrow")
        : startDate.toLocaleDateString(isRtl ? "ar" : "en", { weekday: "long" });

    return `${dayLabel} · ${timeStr} – ${endStr}`;
}

function isNow(start: string, end: string): boolean {
    const now = Date.now();
    return new Date(start).getTime() <= now && now <= new Date(end).getTime();
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
    hasGoogleToken: boolean;
};

export function OfficeView({ initialData, currentUserId, hasGoogleToken }: Props) {
    const { isRtl } = useLanguage();
    const [presences, setPresences] = useState<PresenceData[]>(
        initialData.map((p) => ({ ...p, isCurrentUser: p.userId === currentUserId }))
    );
    const [connected, setConnected] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [calendarConnected, setCalendarConnected] = useState(hasGoogleToken);
    const [calendarLoading, setCalendarLoading] = useState(hasGoogleToken);

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

    const refreshCalendar = useCallback(async () => {
        try {
            const res = await fetch("/api/google/calendar");
            if (!res.ok) return;
            const data = await res.json();
            setCalendarConnected(data.connected);
            setEvents(data.events || []);
        } catch {
        } finally {
            setCalendarLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshPresence();
        const p = setInterval(refreshPresence, 15000);
        return () => clearInterval(p);
    }, [refreshPresence]);

    useEffect(() => {
        if (hasGoogleToken) {
            refreshCalendar();
            const c = setInterval(refreshCalendar, 5 * 60 * 1000);
            return () => clearInterval(c);
        }
    }, [hasGoogleToken, refreshCalendar]);

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

            {/* Meetings Section */}
            <div className="space-y-4">
                <div className={cn("flex items-center justify-between", isRtl ? "flex-row-reverse" : "")}>
                    <div className={cn("flex items-center gap-2", isRtl ? "flex-row-reverse" : "")}>
                        <CalendarDays className="h-4 w-4 text-primary/60" />
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/40">
                            {isRtl ? "الاجتماعات القادمة — ٧ أيام" : "Upcoming Meetings — Next 7 Days"}
                        </p>
                    </div>
                    {calendarConnected && (
                        <button
                            onClick={refreshCalendar}
                            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw className="h-3.5 w-3.5 text-muted-foreground/40" />
                        </button>
                    )}
                </div>

                {!calendarConnected ? (
                    /* Not connected */
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl border border-white/8 bg-white/3 p-8 flex flex-col items-center gap-4 text-center"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                            <svg className="h-7 w-7" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-black text-sm">
                                {isRtl ? "ربط جوجل كاليندر" : "Connect Google Calendar"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {isRtl
                                    ? "اتصل بحسابك على جوجل لتشاهد اجتماعاتك هنا"
                                    : "Sign in with your Google account to see your meetings here"}
                            </p>
                        </div>
                        <button
                            onClick={() => signIn("google", { callbackUrl: "/office" })}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black text-sm font-bold hover:bg-white/90 transition-colors"
                        >
                            <svg className="h-4 w-4" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            {isRtl ? "الدخول بجوجل" : "Sign in with Google"}
                        </button>
                    </motion.div>
                ) : calendarLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-20 rounded-2xl bg-white/3 animate-pulse" />
                        ))}
                    </div>
                ) : events.length === 0 ? (
                    <div className="rounded-2xl border border-white/8 bg-white/3 p-8 text-center">
                        <CalendarDays className="h-8 w-8 text-muted-foreground/20 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground font-medium">
                            {isRtl ? "لا توجد اجتماعات في الأيام السبعة القادمة" : "No meetings in the next 7 days"}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {events.map((event) => {
                            const live = isNow(event.start, event.end);
                            return (
                                <motion.div
                                    key={event.id}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn(
                                        "rounded-2xl border p-4 flex items-center gap-4 transition-all",
                                        isRtl ? "flex-row-reverse text-right" : "",
                                        live
                                            ? "border-emerald-500/30 bg-emerald-500/5"
                                            : "border-white/8 bg-white/3 hover:bg-white/5"
                                    )}
                                >
                                    {/* Icon */}
                                    <div className={cn(
                                        "shrink-0 w-10 h-10 rounded-xl flex items-center justify-center",
                                        live ? "bg-emerald-500/20" : "bg-white/5"
                                    )}>
                                        <Video className={cn("h-4 w-4", live ? "text-emerald-400" : "text-muted-foreground/40")} />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className={cn("flex items-center gap-2 flex-wrap", isRtl ? "flex-row-reverse" : "")}>
                                            {live && (
                                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full">
                                                    {isRtl ? "الآن" : "Live"}
                                                </span>
                                            )}
                                            <p className="text-sm font-black truncate">{event.title}</p>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {formatEventTime(event.start, event.end, isRtl)}
                                        </p>
                                        {event.attendees.length > 0 && (
                                            <div className={cn("flex items-center gap-1 mt-1", isRtl ? "flex-row-reverse" : "")}>
                                                <Users className="h-3 w-3 text-muted-foreground/30 shrink-0" />
                                                <p className="text-[11px] text-muted-foreground/50 truncate">
                                                    {event.attendees.join(", ")}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Join button */}
                                    {event.meetLink && (
                                        <a
                                            href={event.meetLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={cn(
                                                "shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all",
                                                live
                                                    ? "bg-emerald-500 text-white hover:bg-emerald-400"
                                                    : "bg-white/8 text-white hover:bg-white/15 border border-white/10"
                                            )}
                                        >
                                            <ExternalLink className="h-3 w-3" />
                                            {isRtl ? "انضم" : "Join"}
                                        </a>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

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
