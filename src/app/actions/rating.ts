"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function currentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export async function getRatingStatus(): Promise<{ shouldShow: boolean }> {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "CLIENT") return { shouldShow: false };

    const client = await prisma.client.findUnique({ where: { userId: session.user.id }, select: { id: true } });
    if (!client) return { shouldShow: false };

    const existing = await prisma.clientRating.findUnique({
        where: { clientId_month: { clientId: client.id, month: currentMonth() } },
    });

    return { shouldShow: !existing };
}

export async function submitRating(stars: number, feedback?: string): Promise<void> {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "CLIENT") throw new Error("Unauthorized");

    const client = await prisma.client.findUnique({ where: { userId: session.user.id }, select: { id: true } });
    if (!client) throw new Error("Client not found");

    await prisma.clientRating.upsert({
        where: { clientId_month: { clientId: client.id, month: currentMonth() } },
        create: { clientId: client.id, month: currentMonth(), stars, feedback: feedback || null },
        update: { stars, feedback: feedback || null },
    });
}
