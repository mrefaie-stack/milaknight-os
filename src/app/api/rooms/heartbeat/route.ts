import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT — keep the current user's room session alive
export async function PUT() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === "CLIENT") {
        return NextResponse.json({ ok: false }, { status: 401 });
    }

    await (prisma as any).roomSession.updateMany({
        where: { userId: session.user.id },
        data: { updatedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
}
