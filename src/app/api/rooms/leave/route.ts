import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST — called by sendBeacon on page unload
export async function POST(_req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse(null, { status: 204 });

    await (prisma as any).roomSession.deleteMany({
        where: { userId: session.user.id },
    });

    await (prisma as any).webRTCSignal.deleteMany({
        where: { fromUserId: session.user.id },
    });

    return new NextResponse(null, { status: 204 });
}
