import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — list all members currently in the room
export async function GET(
    _req: NextRequest,
    { params }: { params: { room: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === "CLIENT") {
        return NextResponse.json([], { status: 401 });
    }

    const roomId = decodeURIComponent(params.room);

    const sessions = await (prisma as any).roomSession.findMany({
        where: {
            roomId,
            updatedAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
        },
        include: {
            user: { select: { id: true, firstName: true, lastName: true, role: true } },
        },
    });

    return NextResponse.json(
        sessions.map((s: any) => ({
            userId: s.user.id,
            name: `${s.user.firstName} ${s.user.lastName}`.trim(),
            role: s.user.role,
            isCurrentUser: s.user.id === session.user.id,
        }))
    );
}
