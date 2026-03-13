"use client";

import { motion } from "framer-motion";
import { ROOMS } from "@/lib/rooms";
import type { RoomMember } from "@/lib/rooms";
import { RoomTile } from "./room-tile";

type Props = {
    roomMembers: Record<string, RoomMember[]>;
    currentUserId: string;
    onJoinRoom: (roomId: string) => void;
    isRtl: boolean;
};

export function FloorPlan({ roomMembers, currentUserId, onJoinRoom, isRtl }: Props) {
    return (
        <div
            className="grid gap-2.5"
            style={{
                gridTemplateColumns: "repeat(5, 1fr)",
                gridAutoRows: "minmax(120px, auto)",
            }}
        >
            {ROOMS.map((room, i) => {
                const members = roomMembers[room.id] || [];
                const isCurrentUserHere = members.some(m => m.userId === currentUserId);

                return (
                    <motion.div
                        key={room.id}
                        initial={{ opacity: 0, scale: 0.92, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{
                            delay: i * 0.06,
                            type: "spring",
                            stiffness: 260,
                            damping: 24,
                        }}
                        style={{
                            gridColumn: `span ${room.colSpan}`,
                            gridRow: `span ${room.rowSpan}`,
                        }}
                    >
                        <RoomTile
                            room={room}
                            members={members}
                            isCurrentUserHere={isCurrentUserHere}
                            onClick={() => onJoinRoom(room.id)}
                            isRtl={isRtl}
                        />
                    </motion.div>
                );
            })}
        </div>
    );
}
