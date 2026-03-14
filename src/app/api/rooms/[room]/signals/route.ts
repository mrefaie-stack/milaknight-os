import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emitSignal, onSignal } from "@/lib/signal-bus";

// GET — SSE stream: delivers signals in real-time (no polling needed)
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ room: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === "CLIENT") {
        return NextResponse.json([], { status: 401 });
    }

    const { room } = await params;
    const roomId = decodeURIComponent(room);
    const userId = session.user.id;
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            // Flush any signals that arrived before this SSE connection opened
            try {
                const pending = await (prisma as any).webRTCSignal.findMany({
                    where: { roomId, toUserId: userId, consumed: false },
                    orderBy: { createdAt: "asc" },
                });
                if (pending.length > 0) {
                    await (prisma as any).webRTCSignal.updateMany({
                        where: { id: { in: pending.map((s: any) => s.id) } },
                        data: { consumed: true },
                    });
                    for (const s of pending) {
                        controller.enqueue(encoder.encode(
                            `data: ${JSON.stringify({ fromUserId: s.fromUserId, type: s.type, payload: JSON.parse(s.payload) })}\n\n`
                        ));
                    }
                }

                // Clean up consumed signals older than 5 minutes
                const cutoff = new Date(Date.now() - 5 * 60 * 1000);
                (prisma as any).webRTCSignal.deleteMany({
                    where: { consumed: true, createdAt: { lt: cutoff } },
                }).catch(() => {});
            } catch { /* ignore */ }

            // Subscribe to real-time signals from the in-process event bus
            const unsub = onSignal(userId, (sig) => {
                try {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(sig)}\n\n`));
                } catch { /* stream closed */ }
            });

            // Heartbeat every 20s to keep proxies/load-balancers from closing the connection
            const heartbeat = setInterval(() => {
                try {
                    controller.enqueue(encoder.encode(`: ping\n\n`));
                } catch { /* stream closed */ }
            }, 20000);

            // Cleanup when client disconnects
            req.signal.addEventListener("abort", () => {
                unsub();
                clearInterval(heartbeat);
                try { controller.close(); } catch { /* already closed */ }
            });
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no", // disable nginx buffering
        },
    });
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

    // Persist to DB (fallback for when SSE isn't connected yet)
    await (prisma as any).webRTCSignal.create({
        data: {
            roomId,
            fromUserId: session.user.id,
            toUserId,
            type,
            payload: JSON.stringify(payload),
        },
    });

    // Also push directly to the recipient's SSE stream (near-instant delivery)
    emitSignal(toUserId, { fromUserId: session.user.id, type, payload });

    return NextResponse.json({ ok: true });
}
