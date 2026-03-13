import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — fetch recent chat messages for room (last 50, last 2 hours)
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
    const since = req.nextUrl.searchParams.get("since");

    const where: any = {
        roomId,
        createdAt: { gte: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    };

    if (since) {
        where.createdAt = { gt: new Date(since) };
    }

    const messages = await (prisma as any).roomChatMessage.findMany({
        where,
        orderBy: { createdAt: "asc" },
        take: 50,
    });

    return NextResponse.json(
        messages.map((m: any) => ({
            id: m.id,
            userId: m.userId,
            userName: m.userName,
            text: m.text,
            createdAt: m.createdAt.toISOString(),
            isCurrentUser: m.userId === session.user.id,
        }))
    );
}

// POST — send a message to the room
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
    const { text } = await req.json();

    if (!text?.trim()) {
        return NextResponse.json({ error: "Empty message" }, { status: 400 });
    }

    const message = await (prisma as any).roomChatMessage.create({
        data: {
            roomId,
            userId: session.user.id,
            userName: session.user.name || "Unknown",
            text: text.trim().slice(0, 1000),
        },
    });

    return NextResponse.json({
        id: message.id,
        userId: message.userId,
        userName: message.userName,
        text: message.text,
        createdAt: message.createdAt.toISOString(),
        isCurrentUser: true,
    });
}
