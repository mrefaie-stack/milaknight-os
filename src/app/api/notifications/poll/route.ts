import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/notifications/poll?since=<ISO>
// Returns new unread notifications created after `since`
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json([], { status: 401 });

    const since = req.nextUrl.searchParams.get("since");
    const after = since ? new Date(since) : new Date(Date.now() - 60 * 1000);

    const notifications = await prisma.notification.findMany({
        where: {
            userId: session.user.id,
            isRead: false,
            createdAt: { gt: after },
        },
        orderBy: { createdAt: "asc" },
        take: 10,
    });

    return NextResponse.json(notifications.map(n => ({
        id: n.id,
        title: n.title,
        message: n.message,
        link: (n as any).link ?? null,
        createdAt: n.createdAt.toISOString(),
    })));
}
