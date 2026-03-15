"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendReminder } from "@/app/actions/notification";

export async function joinRoom(roomId: string) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === "CLIENT") throw new Error("Unauthorized");

    await (prisma as any).roomSession.upsert({
        where: { userId: session.user.id },
        update: { roomId, updatedAt: new Date() },
        create: { userId: session.user.id, roomId },
    });
}

export async function leaveRoom() {
    const session = await getServerSession(authOptions);
    if (!session) return;

    // Find which room user is in before deleting
    const mySession = await (prisma as any).roomSession.findUnique({
        where: { userId: session.user.id },
        select: { roomId: true },
    });

    await (prisma as any).roomSession.deleteMany({
        where: { userId: session.user.id },
    });

    // If this was the last person in the room, clear the chat history
    if (mySession?.roomId) {
        const remaining = await (prisma as any).roomSession.count({
            where: { roomId: mySession.roomId },
        });
        if (remaining === 0) {
            await (prisma as any).roomChatMessage.deleteMany({
                where: { roomId: mySession.roomId },
            });
        }
    }
}

export async function getRoomSessions(): Promise<Record<string, { userId: string; name: string; role: string }[]>> {
    const sessions = await (prisma as any).roomSession.findMany({
        where: {
            updatedAt: { gte: new Date(Date.now() - 75 * 1000) }, // 75s — requires heartbeat every 30s
        },
        include: {
            user: { select: { id: true, firstName: true, lastName: true, role: true } },
        },
    });

    const map: Record<string, { userId: string; name: string; role: string }[]> = {};
    for (const s of sessions) {
        if (!map[s.roomId]) map[s.roomId] = [];
        map[s.roomId].push({
            userId: s.user.id,
            name: `${s.user.firstName} ${s.user.lastName}`.trim(),
            role: s.user.role,
        });
    }
    return map;
}

export async function getMyRoomSession(): Promise<string | null> {
    const session = await getServerSession(authOptions);
    if (!session) return null;

    const rs = await (prisma as any).roomSession.findUnique({
        where: { userId: session.user.id },
    });
    return rs?.roomId ?? null;
}

export async function inviteToRoom(targetUserId: string, roomId: string) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === "CLIENT") throw new Error("Unauthorized");

    const senderName = session.user.name || "A teammate";

    await sendReminder(
        targetUserId,
        `🏢 ${senderName} ${roomId === "Lounge" ? "invited you to the Lounge" : `invited you to ${roomId}`}`,
        `Join ${senderName} in the virtual office.`,
        "/office"
    );
}
