"use client";

import { useEffect, useState, useCallback } from "react";
import { useLanguage } from "@/contexts/language-context";
import { motion, AnimatePresence } from "framer-motion";
import { setMyStatus } from "@/app/actions/presence";
import Link from "next/link";
import {
    Building2, Target, BarChart3, Users, MessageSquare,
    CheckSquare, Coffee, Phone, BellOff, Circle,
    ChevronDown, ExternalLink, Clock, Wifi, WifiOff
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type PresenceData = {
    userId: string;
    name: string;
    role: string;
    status: string;
    activity: string;
    activityUrl: string | null;
    room: string;
    updatedAt: string | null;
    isCurrentUser: boolean;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const ROOMS = [
    {
        id: "Strategy Room",
        nameAr: "غرفة الاستراتيجية",
        nameEn: "Strategy Room",
        icon: Target,
        color: "text-blue-400",
        bg: "bg-blue-500/8",
        border: "border-blue-500/20",
        glow: "shadow-blue-500/10",
    },
    {
        id: "Analytics Hub",
        nameAr: "مركز التحليلات",
        nameEn: "Analytics Hub",
        icon: BarChart3,
        color: "text-emerald-400",
        bg: "bg-emerald-500/8",
        border: "border-emerald-500/20",
        glow: "shadow-emerald-500/10",
    },
    {
        id: "Client Zone",
        nameAr: "منطقة العملاء",
        nameEn: "Client Zone",
        icon: Users,
        color: "text-orange-400",
        bg: "bg-orange-500/8",
        border: "border-orange-500/20",
        glow: "shadow-orange-500/10",
    },
    {
        id: "Messaging",
        nameAr: "المراسلات",
        nameEn: "Messaging",
        icon: MessageSquare,
        color: "text-purple-400",
        bg: "bg-purple-500/8",
        border: "border-purple-500/20",
        glow: "shadow-purple-500/10",
    },
    {
        id: "Task Board",
        nameAr: "لوحة المهام",
        nameEn: "Task Board",
        icon: CheckSquare,
        color: "text-teal-400",
        bg: "bg-teal-500/8",
        border: "border-teal-500/20",
        glow: "shadow-teal-500/10",
    },
    {
        id: "Meeting Room",
        nameAr: "غرفة الاجتماعات",
        nameEn: "Meeting Room",
        icon: Phone,
        color: "text-rose-400",
        bg: "bg-rose-500/8",
        border: "border-rose-500/20",
        glow: "shadow-rose-500/10",
    },
    {
        id: "Admin HQ",
        nameAr: "المقر الإداري",
        nameEn: "Admin HQ",
        icon: Building2,
        color: "text-yellow-400",
        bg: "bg-yellow-500/8",
        border: "border-yellow-500/20",
        glow: "shadow-yellow-500/10",
    },
    {
        id: "Lounge",
        nameAr: "الاستراحة",
        nameEn: "Lounge",
        icon: Coffee,
        color: "text-muted-foreground",
        bg: "bg-white/3",
        border: "border-white/8",
        glow: "",
    },
];

const STATUSES = [
    { value: "ONLINE",  labelEn: "Online",       labelAr: "متصل",          color: "bg-emerald-500", dot: "text-emerald-500" },
    { value: "AWAY",    labelEn: "Away",          labelAr: "بعيد",          color: "bg-yellow-400",  dot: "text-yellow-400" },
    { value: "MEETING", labelEn: "In a Meeting",  labelAr: "في اجتماع",     color: "bg-rose-500",    dot: "text-rose-500" },
    { value: "DND",     labelEn: "Focus Mode",    labelAr: "وضع التركيز",   color: "bg-purple-500",  dot: "text-purple-500" },
];

const ROLE_LABELS: Record<string, { ar: string; en: string }> = {
    ADMIN: { ar: "مسؤول", en: "Admin" },
    AM: { ar: "مدير حساب", en: "Account Manager" },
    MARKETING_MANAGER: { ar: "مدير تسويق", en: "Marketing Manager" },
    MODERATOR: { ar: "ناشر محتوى", en: "Moderator" },
};

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

// ─── User Card ────────────────────────────────────────────────────────────────

function UserCard({ user, isRtl }: { user: PresenceData; isRtl: boolean }) {
    const s = statusMeta(user.status);
    const initials = user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
    const roleLabel = ROLE_LABELS[user.role];

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={cn(
                "relative p-4 rounded-2xl border transition-all duration-300 group",
                user.isCurrentUser
                    ? "border-primary/30 bg-primary/5 ring-1 ring-primary/20"
                    : "border-white/8 bg-white/3 hover:bg-white/6 hover:border-white/15",
                user.status === "OFFLINE" && "opacity-50"
            )}
        >
            <div className={cn("flex items-start gap-3", isRtl ? "flex-row-reverse" : "")}>
                {/* Avatar */}
                <div className="relative shrink-0">
                    <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm",
                        user.isCurrentUser ? "bg-primary/20 text-primary" : "bg-white/10 text-foreground"
                    )}>
                        {initials}
                    </div>
                    {/* Status dot */}
                    <span className={cn(
                        "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background",
                        s.color
                    )} />
                </div>

                {/* Info */}
                <div className={cn("flex-1 min-w-0", isRtl ? "text-right" : "text-left")}>
                    <div className={cn("flex items-center gap-1.5 flex-wrap", isRtl ? "flex-row-reverse" : "")}>
                        <p className="text-sm font-black truncate leading-tight">
                            {user.name}
                            {user.isCurrentUser && (
                                <span className="ml-1.5 text-[9px] font-black text-primary uppercase tracking-widest">
                                    {isRtl ? "(أنت)" : "(you)"}
                                </span>
                            )}
                        </p>
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground opacity-60 mt-0.5">
                        {roleLabel ? (isRtl ? roleLabel.ar : roleLabel.en) : user.role}
                    </p>
                    <p className={cn("text-[11px] font-medium mt-1 truncate", `text-${s.dot.replace("text-", "")}`)}>
                        {isRtl ? (
                            s.value === "ONLINE" ? user.activity :
                            s.value === "AWAY" ? `بعيد · ${timeAgo(user.updatedAt, true)}` :
                            s.value === "MEETING" ? "في اجتماع" :
                            s.value === "DND" ? "وضع التركيز" : "غير متصل"
                        ) : (
                            s.value === "ONLINE" ? user.activity :
                            s.value === "AWAY" ? `Away · ${timeAgo(user.updatedAt, false)}` :
                            s.value === "MEETING" ? "In a Meeting" :
                            s.value === "DND" ? "Focus Mode" : "Offline"
                        )}
                    </p>
                </div>
            </div>

            {/* Jump link */}
            {user.activityUrl && user.status === "ONLINE" && !user.isCurrentUser && (
                <Link
                    href={user.activityUrl}
                    className={cn(
                        "mt-3 flex items-center gap-1.5 text-[10px] font-black text-primary/60 hover:text-primary uppercase tracking-widest transition-colors opacity-0 group-hover:opacity-100",
                        isRtl ? "flex-row-reverse" : ""
                    )}
                >
                    <ExternalLink className="h-3 w-3" />
                    {isRtl ? "انتقل إلى نفس الصفحة" : "Jump to their page"}
                </Link>
            )}
        </motion.div>
    );
}

// ─── Room Card ────────────────────────────────────────────────────────────────

function RoomCard({ room, users, isRtl }: { room: typeof ROOMS[0]; users: PresenceData[]; isRtl: boolean }) {
    const Icon = room.icon;
    const activeUsers = users.filter((u) => u.status !== "OFFLINE");

    return (
        <div className={cn(
            "rounded-2xl border p-5 space-y-4 transition-all duration-300",
            room.border, room.bg,
            activeUsers.length > 0 ? `shadow-lg ${room.glow}` : "opacity-60"
        )}>
            {/* Room header */}
            <div className={cn("flex items-center justify-between", isRtl ? "flex-row-reverse" : "")}>
                <div className={cn("flex items-center gap-2", isRtl ? "flex-row-reverse" : "")}>
                    <div className={cn("p-2 rounded-xl bg-white/8 border border-white/10")}>
                        <Icon className={cn("h-4 w-4", room.color)} />
                    </div>
                    <div className={isRtl ? "text-right" : "text-left"}>
                        <p className="text-xs font-black uppercase tracking-widest">
                            {isRtl ? room.nameAr : room.nameEn}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-medium">
                            {activeUsers.length > 0
                                ? (isRtl ? `${activeUsers.length} شخص` : `${activeUsers.length} ${activeUsers.length === 1 ? "person" : "people"}`)
                                : (isRtl ? "لا أحد" : "empty")
                            }
                        </p>
                    </div>
                </div>
                {activeUsers.length > 0 && (
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                )}
            </div>

            {/* Users in room */}
            <AnimatePresence mode="popLayout">
                {users.length === 0 ? (
                    <p className={cn("text-[11px] text-muted-foreground font-medium opacity-40 py-2", isRtl ? "text-right" : "text-left")}>
                        {isRtl ? "الغرفة فارغة" : "No one here"}
                    </p>
                ) : (
                    <div className="space-y-2">
                        {users.map((user) => (
                            <UserCard key={user.userId} user={user} isRtl={isRtl} />
                        ))}
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Status Picker ────────────────────────────────────────────────────────────

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

// ─── Main Office View ─────────────────────────────────────────────────────────

export function OfficeView({ initialData, currentUserId }: { initialData: PresenceData[]; currentUserId: string }) {
    const { isRtl } = useLanguage();
    const [presences, setPresences] = useState<PresenceData[]>(
        initialData.map((p) => ({ ...p, isCurrentUser: p.userId === currentUserId }))
    );
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    const [connected, setConnected] = useState(true);

    const refresh = useCallback(async () => {
        try {
            const res = await fetch("/api/presence", { cache: "no-store" });
            if (!res.ok) return;
            const data = await res.json();
            setPresences(data);
            setLastRefresh(new Date());
            setConnected(true);
        } catch {
            setConnected(false);
        }
    }, []);

    // Poll every 15 seconds
    useEffect(() => {
        const interval = setInterval(refresh, 15000);
        return () => clearInterval(interval);
    }, [refresh]);

    const currentUser = presences.find((p) => p.isCurrentUser);
    const onlineCount = presences.filter((p) => p.status !== "OFFLINE").length;

    // Group users by room
    const getRoomUsers = (roomId: string) => {
        const all = presences.filter((p) => {
            const inRoom = p.room === roomId;
            if (roomId === "Lounge") {
                // Lounge gets everyone not in a named room
                return inRoom || !ROOMS.some((r) => r.id !== "Lounge" && p.room === r.id);
            }
            return inRoom;
        });
        // Sort: online first, then away, then offline
        return all.sort((a, b) => {
            const order: Record<string, number> = { ONLINE: 0, DND: 1, MEETING: 2, AWAY: 3, OFFLINE: 4 };
            return (order[a.status] ?? 4) - (order[b.status] ?? 4);
        });
    };

    // Active rooms (have at least one non-offline user)
    const activeRooms = ROOMS.filter((r) =>
        getRoomUsers(r.id).some((u) => u.status !== "OFFLINE")
    );
    const emptyRooms = ROOMS.filter((r) =>
        !getRoomUsers(r.id).some((u) => u.status !== "OFFLINE")
    );

    const offlineUsers = presences.filter((p) => p.status === "OFFLINE");

    const [time, setTime] = useState(() => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    useEffect(() => {
        const t = setInterval(() => setTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })), 10000);
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
                    <div className={cn("flex items-center gap-3 text-sm text-muted-foreground", isRtl ? "flex-row-reverse" : "")}>
                        <span className="font-bold">{time}</span>
                        <span className="text-white/20">·</span>
                        <span className={cn("flex items-center gap-1.5", isRtl ? "flex-row-reverse" : "")}>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="font-bold text-emerald-500">
                                {onlineCount} {isRtl ? "متصل الآن" : "online now"}
                            </span>
                        </span>
                        <span className="text-white/20">·</span>
                        <span className={cn("flex items-center gap-1 text-xs", isRtl ? "flex-row-reverse" : "")}>
                            {connected
                                ? <Wifi className="h-3 w-3 text-muted-foreground/40" />
                                : <WifiOff className="h-3 w-3 text-red-400" />
                            }
                            <span className="opacity-40">
                                {isRtl ? `آخر تحديث: ${lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : `Live · ${lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                            </span>
                        </span>
                    </div>
                </div>

                {/* My Status */}
                {currentUser && (
                    <div className={cn("flex items-center gap-3", isRtl ? "flex-row-reverse" : "")}>
                        <div className={cn("text-xs text-muted-foreground font-bold uppercase tracking-widest", isRtl ? "text-right" : "")}>
                            {isRtl ? "حالتي:" : "My status:"}
                        </div>
                        <StatusPicker currentStatus={currentUser.status} isRtl={isRtl} />
                    </div>
                )}
            </div>

            {/* Focus Mode banner */}
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
                            {isRtl ? "أنت في وضع التركيز — الفريق يعرف أنك مشغول" : "You're in focus mode — your team knows you're heads down"}
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Active Rooms */}
            {activeRooms.length > 0 && (
                <div className="space-y-4">
                    <p className={cn("text-[10px] font-black uppercase tracking-[0.25em] text-primary/40", isRtl ? "text-right" : "")}>
                        {isRtl ? "الغرف النشطة" : "Active Rooms"}
                    </p>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {activeRooms.map((room) => (
                            <RoomCard
                                key={room.id}
                                room={room}
                                users={getRoomUsers(room.id)}
                                isRtl={isRtl}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Empty Rooms */}
            {emptyRooms.length > 0 && (
                <div className="space-y-4">
                    <p className={cn("text-[10px] font-black uppercase tracking-[0.25em] text-primary/30", isRtl ? "text-right" : "")}>
                        {isRtl ? "الغرف الفارغة" : "Empty Rooms"}
                    </p>
                    <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                        {emptyRooms.map((room) => {
                            const Icon = room.icon;
                            return (
                                <div key={room.id} className={cn("p-4 rounded-2xl border border-white/5 bg-white/2 opacity-40 flex items-center gap-2", isRtl ? "flex-row-reverse" : "")}>
                                    <Icon className={cn("h-4 w-4 shrink-0", room.color)} />
                                    <span className="text-xs font-bold truncate">{isRtl ? room.nameAr : room.nameEn}</span>
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
