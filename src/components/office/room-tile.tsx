"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { RoomDef, RoomMember } from "@/lib/rooms";
import { DoorOpen } from "lucide-react";

type Props = {
    room: RoomDef;
    members: RoomMember[];
    isCurrentUserHere: boolean;
    onClick: () => void;
    isRtl: boolean;
    isMobile?: boolean;
};

// Deterministic positions for floating avatar dots per slot index
const FLOAT_POSITIONS = [
    { top: "30%", left: "18%" },
    { top: "55%", left: "60%" },
    { top: "28%", left: "70%" },
    { top: "62%", left: "25%" },
    { top: "45%", left: "82%" },
    { top: "72%", left: "70%" },
];

const ROLE_COLORS: Record<string, string> = {
    ADMIN:             "bg-rose-500",
    AM:                "bg-blue-500",
    MARKETING_MANAGER: "bg-purple-500",
    MODERATOR:         "bg-teal-500",
};

export function RoomTile({ room, members, isCurrentUserHere, onClick, isRtl, isMobile = false }: Props) {
    const Icon = room.icon;
    const hasMembers = members.length > 0;
    const label = isRtl ? room.nameAr : room.nameEn;
    const dotColor = room.color.replace("text-", "bg-");

    return (
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className={cn(
                "relative flex flex-col justify-between p-3.5 rounded-2xl border text-left w-full h-full min-h-[110px] overflow-hidden",
                "transition-colors duration-300",
                hasMembers
                    ? [room.bg, room.activeBorder, `shadow-xl ${room.glow}`]
                    : "bg-white/2 border-white/6 hover:bg-white/4 hover:border-white/12",
                isCurrentUserHere && "ring-2 ring-primary/60 ring-offset-1 ring-offset-background"
            )}
        >
            {/* Ambient glow backdrop for active rooms */}
            {hasMembers && (
                <div className={cn(
                    "absolute inset-0 opacity-20 pointer-events-none",
                    `bg-gradient-to-br ${room.color.replace("text-", "from-")} to-transparent`
                )} />
            )}

            {/* Live pulse indicator */}
            {hasMembers && (
                <span className="absolute top-2.5 right-2.5 flex h-2.5 w-2.5 z-10">
                    <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-60", dotColor)} />
                    <span className={cn("relative inline-flex rounded-full h-2.5 w-2.5", dotColor)} />
                </span>
            )}

            {/* "You are here" crown */}
            {isCurrentUserHere && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/20 border border-primary/40 z-10"
                >
                    <span className="text-[8px] font-black text-primary uppercase tracking-wider">
                        {isRtl ? "أنت هنا" : "You"}
                    </span>
                </motion.div>
            )}

            {/* Floating avatars in room (spatial) */}
            {hasMembers && (
                <div className="absolute inset-0 pointer-events-none">
                    {members.slice(0, isMobile ? 3 : 6).map((m, i) => {
                        const pos = FLOAT_POSITIONS[i % FLOAT_POSITIONS.length];
                        const roleColor = ROLE_COLORS[m.role] || "bg-white/20";
                        return (
                            <motion.div
                                key={m.userId}
                                style={{ top: pos.top, left: pos.left, position: "absolute" }}
                                animate={{ y: [0, -4, 0] }}
                                transition={{
                                    duration: 2.5 + i * 0.4,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    delay: i * 0.3,
                                }}
                                className={cn(
                                    "flex items-center justify-center w-6 h-6 rounded-full text-[9px] font-black text-white border-2 shadow-lg",
                                    m.isCurrentUser
                                        ? "bg-primary border-primary/60 shadow-primary/40"
                                        : `${roleColor} border-black/20 shadow-black/30`
                                )}
                                title={m.name}
                            >
                                {m.name.charAt(0).toUpperCase()}
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Room label + icon */}
            <div className={cn("relative z-10 flex items-center gap-2", hasMembers ? "mt-auto" : "")}>
                <div className={cn(
                    "flex items-center justify-center w-7 h-7 rounded-xl transition-colors",
                    hasMembers ? "bg-white/10" : "bg-white/4",
                    room.color
                )}>
                    <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                    <span className={cn(
                        "block text-[11px] font-black uppercase tracking-wide leading-tight truncate",
                        hasMembers ? room.color : "text-muted-foreground/50"
                    )}>
                        {label}
                    </span>
                    {hasMembers ? (
                        <span className="text-[9px] text-muted-foreground/60 font-medium">
                            {members.length} {isRtl ? "شخص" : members.length === 1 ? "person" : "people"}
                        </span>
                    ) : (
                        <span className="text-[9px] text-muted-foreground/30 font-medium flex items-center gap-1">
                            <DoorOpen className="h-2.5 w-2.5" />
                            {isRtl ? "ادخل" : "Join"}
                        </span>
                    )}
                </div>
            </div>

            {/* Empty room subtle grid texture */}
            {!hasMembers && (
                <div
                    className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{
                        backgroundImage: "repeating-linear-gradient(0deg, currentColor, currentColor 1px, transparent 1px, transparent 20px), repeating-linear-gradient(90deg, currentColor, currentColor 1px, transparent 1px, transparent 20px)",
                    }}
                />
            )}
        </motion.button>
    );
}
