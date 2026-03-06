"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function logActivity(action: string, entityType: string, entityId: string) {
    const session = await getServerSession(authOptions);
    if (!session) return;

    await prisma.activityLog.create({
        data: {
            userId: session.user.id,
            action,
            entityType,
            entityId,
        }
    });
}

export async function getRecentActivities() {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");

    return prisma.activityLog.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
            user: { select: { firstName: true, lastName: true, role: true } }
        }
    });
}
