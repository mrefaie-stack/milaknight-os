"use client";

import { cn } from "@/lib/utils";
import type { RoomDef, RoomMember } from "@/lib/rooms";

type Props = {
    room: RoomDef;
    members: RoomMember[];
    isCurrentUserHere: boolean;
    onClick: () => void;
    isRtl: boolean;
};

const ROLE_ABBR: Record<string, string> = {
    ADMIN: "AD",
    AM: "AM",
    MARKETING_MANAGER: "MM",
    MODERATOR: "MO",
};

export function RoomTile({ room, members, isCurrentUserHere, onClick, isRtl }: Props) {
    const Icon = room.icon;
    const hasMembers = members.length > 0;
    const label = isRtl ? room.nameAr : room.nameEn;

    return (
        <button
            onClick={onClick}
            className={cn(
                "relative flex flex-col justify-between p-3 rounded-2xl border transition-all duration-300 text-left w-full h-full min-h-[100px]",
                "hover:scale-[1.02] active:scale-[0.98]",
                hasMembers ? [room.bg, room.activeBorder, `shadow-lg ${room.glow}`] : ["bg-white/2 border-white/5 hover:border-white/15"],
                isCurrentUserHere && "ring-2 ring-primary/50 ring-offset-2 ring-offset-background"
            )}
        >
            {/* Live pulse */}
            {hasMembers && (
                <span className="absolute top-2.5 right-2.5 flex h-2 w-2">
                    <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", room.color.replace("text-", "bg-"))} />
                    <span className={cn("relative inline-flex rounded-full h-2 w-2", room.color.replace("text-", "bg-"))} />
                </span>
            )}

            {/* Header */}
            <div className="flex items-center gap-2">
                <div className={cn("flex items-center justify-center w-7 h-7 rounded-xl bg-white/5", room.color)}>
                    <Icon className="h-3.5 w-3.5" />
                </div>
                <span className={cn("text-[11px] font-black uppercase tracking-wide leading-tight", hasMembers ? room.color : "text-muted-foreground")}>
                    {label}
                </span>
            </div>

            {/* Members avatars */}
            {hasMembers ? (
                <div className="flex items-center gap-1 flex-wrap mt-2">
                    {members.slice(0, 6).map((m) => (
                        <div
                            key={m.userId}
                            title={m.name}
                            className={cn(
                                "flex items-center justify-center w-7 h-7 rounded-full text-[8px] font-black border-2",
                                m.isCurrentUser
                                    ? "bg-primary text-primary-foreground border-primary/50"
                                    : "bg-white/10 text-foreground border-white/10"
                            )}
                        >
                            {m.name.charAt(0).toUpperCase()}
                            <span className="text-[6px] opacity-60">{ROLE_ABBR[m.role] || ""}</span>
                        </div>
                    ))}
                    {members.length > 6 && (
                        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-white/10 text-[8px] font-black text-muted-foreground border-2 border-white/10">
                            +{members.length - 6}
                        </div>
                    )}
                </div>
            ) : (
                <p className="text-[10px] text-muted-foreground/40 font-medium mt-1">
                    {isRtl ? "فارغة" : "Empty"}
                </p>
            )}
        </button>
    );
}
