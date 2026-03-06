"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function sendReminder(targetUserId: string, title: string, message: string, link?: string) {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    await prisma.notification.create({
        data: {
            userId: targetUserId,
            title,
            message,
            type: "REMINDER",
            link,
        }
    });

    revalidatePath("/notifications");
    return { success: true };
}

export async function remindAMAboutReport(amId: string, clientName: string) {
    return sendReminder(
        amId,
        "⚠️ موعد نهائي للتقرير",
        `تذكير: يرجى إنهاء وإرسال تقرير الأداء الخاص بـ ${clientName}.`,
        "/am/reports/create"
    );
}

export async function remindClientAboutPlan(clientId: string, planId: string) {
    const client = await prisma.client.findUnique({
        where: { id: clientId },
        include: { user: true }
    });

    if (!client?.userId) return;

    return sendReminder(
        client.userId,
        "📅 خطة العمل بانتظار المراجعة",
        "خطة المحتوى الشهرية الجديدة جاهزة للمراجعة والاعتماد من قبلك.",
    );
}

export async function getNotifications() {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    return prisma.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 50
    });
}

export async function markAsRead(notificationId: string) {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    await prisma.notification.update({
        where: { id: notificationId, userId: session.user.id },
        data: { isRead: true }
    });
    revalidatePath("/notifications");
}

export async function getUnreadNotificationCount() {
    const session = await getServerSession(authOptions);
    if (!session) return 0;

    return prisma.notification.count({
        where: { userId: session.user.id, isRead: false }
    });
}
