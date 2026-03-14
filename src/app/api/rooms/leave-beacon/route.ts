import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST — called via navigator.sendBeacon() when tab/page is closed
// sendBeacon only supports POST, not DELETE
export async function POST(req: NextRequest) {
    // sendBeacon doesn't send auth cookies reliably in all browsers,
    // so we also accept a userId in the body as fallback
    const session = await getServerSession(authOptions);

    let userId = session?.user?.id;

    if (!userId) {
        try {
            const body = await req.json();
            userId = body?.userId;
        } catch { /* ignore */ }
    }

    if (!userId) return new NextResponse(null, { status: 204 });

    try {
        // Find which room user is in
        const rs = await (prisma as any).roomSession.findUnique({
            where: { userId },
            select: { roomId: true },
        });

        await (prisma as any).roomSession.deleteMany({ where: { userId } });
        await (prisma as any).webRTCSignal.deleteMany({ where: { fromUserId: userId } });

        if (rs?.roomId) {
            const remaining = await (prisma as any).roomSession.count({
                where: { roomId: rs.roomId },
            });
            if (remaining === 0) {
                await (prisma as any).roomChatMessage.deleteMany({ where: { roomId: rs.roomId } });
            }
        }
    } catch { /* silent */ }

    return new NextResponse(null, { status: 204 });
}
