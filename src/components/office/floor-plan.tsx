"use client";

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
            className="grid gap-2"
            style={{
                gridTemplateColumns: "repeat(5, 1fr)",
                gridAutoRows: "minmax(110px, auto)",
            }}
        >
            {ROOMS.map((room) => {
                const members = roomMembers[room.id] || [];
                const isCurrentUserHere = members.some(m => m.userId === currentUserId);

                return (
                    <div
                        key={room.id}
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
                    </div>
                );
            })}
        </div>
    );
}
