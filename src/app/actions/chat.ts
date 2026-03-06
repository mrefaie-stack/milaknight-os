"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getMessages(otherUserId: string) {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    const userId = session.user.id;

    return prisma.message.findMany({
        where: {
            OR: [
                { senderId: userId, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: userId }
            ]
        },
        orderBy: { createdAt: "asc" },
        include: {
            sender: { select: { firstName: true, lastName: true, role: true } }
        }
    });
}

export async function sendMessage(receiverId: string, text: string) {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    const message = await prisma.message.create({
        data: {
            senderId: session.user.id,
            receiverId,
            text,
        }
    });

    // Create a notification for the receiver
    await prisma.notification.create({
        data: {
            userId: receiverId,
            title: `New Message from ${session.user.name}`,
            message: text.substring(0, 50) + (text.length > 50 ? "..." : ""),
            type: "CHAT",
            link: "/messages"
        }
    });

    revalidatePath("/messages");
    return message;
}

export async function getRecentChats() {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    const userId = session.user.id;

    // Get unique users I've chatted with
    const sent = await prisma.message.findMany({
        where: { senderId: userId },
        select: { receiverId: true },
        distinct: ['receiverId']
    });

    const received = await prisma.message.findMany({
        where: { receiverId: userId },
        select: { senderId: true },
        distinct: ['senderId']
    });

    const userIds = [...new Set([...sent.map(s => s.receiverId), ...received.map(r => r.senderId)])];

    return prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, firstName: true, lastName: true, role: true }
    });
}
