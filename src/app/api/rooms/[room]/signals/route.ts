import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — consume all pending signals for me in this room
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ room: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === "CLIENT") {
        return NextResponse.json([], { status: 401 });
    }

    const { room } = await params;
    const roomId = decodeURIComponent(room);

    // Atomically fetch + mark consumed
    const signals = await (prisma as any).$transaction(async (tx: any) => {
        const pending = await tx.webRTCSignal.findMany({
            where: {
                roomId,
                toUserId: session.user.id,
                consumed: false,
            },
            orderBy: { createdAt: "asc" },
        });

        if (pending.length > 0) {
            await tx.webRTCSignal.updateMany({
                where: { id: { in: pending.map((s: any) => s.id) } },
                data: { consumed: true },
            });
        }

        return pending;
    });

    return NextResponse.json(
        signals.map((s: any) => ({
            id: s.id,
            fromUserId: s.fromUserId,
            type: s.type,
            payload: JSON.parse(s.payload),
        }))
    );
}

// POST — send a signal to another user
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ room: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === "CLIENT") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { room } = await params;
    const roomId = decodeURIComponent(room);
    const { toUserId, type, payload } = await req.json();

    if (!toUserId || !type || payload === undefined) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    await (prisma as any).webRTCSignal.create({
        data: {
            roomId,
            fromUserId: session.user.id,
            toUserId,
            type,
            payload: JSON.stringify(payload),
        },
    });

    return NextResponse.json({ ok: true });
}
