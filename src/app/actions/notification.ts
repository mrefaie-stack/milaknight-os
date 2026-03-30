"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function sendReminder(targetUserId: string, title: string, message: string, link?: string) {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "HR_MANAGER"].includes(session.user.role)) {
        throw new Error("Unauthorized: Only Admins or HR can trigger manual system reminders");
    }

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
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "MARKETING_MANAGER"].includes(session.user.role)) {
        throw new Error("Unauthorized");
    }

    if (session.user.role === "MARKETING_MANAGER") {
        const verifyAM = await prisma.client.findFirst({
            where: { amId, mmId: session.user.id }
        });
        if (!verifyAM) throw new Error("Unauthorized Access: This AM does not manage any of your clients.");
    }

    return prisma.notification.create({
        data: {
            userId: amId,
            title: "⚠️ موعد نهائي للتقرير",
            message: `تذكير: يرجى إنهاء وإرسال تقرير الأداء الخاص بـ ${clientName}.`,
            type: "REMINDER",
            link: "/am/reports/create"
        }
    });
}


export async function remindClientAboutPlan(clientId: string, planId: string) {
    const session = await getServerSession(authOptions);
    if (!session || !["AM", "ADMIN", "MARKETING_MANAGER"].includes(session.user.role)) {
        throw new Error("Unauthorized");
    }

    const client = await prisma.client.findUnique({
        where: { id: clientId },
        include: { user: true }
    });

    if (!client?.userId) return;

    if (session.user.role === "AM" && client.amId !== session.user.id) {
        throw new Error("Unauthorized Access");
    }
    if (session.user.role === "MARKETING_MANAGER" && client.mmId !== session.user.id) {
        throw new Error("Unauthorized Access");
    }

    return prisma.notification.create({
        data: {
            userId: client.userId,
            title: "📅 خطة العمل بانتظار المراجعة",
            message: "خطة المحتوى الشهرية الجديدة جاهزة للمراجعة والاعتماد من قبلك.",
            type: "REMINDER",
            link: `/client/action-plans/${planId}` // Fixed link
        }
    });
}

export async function getNotifications() {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    const raw = await prisma.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 50
    });
    
    return raw.map(n => ({
        ...n,
        createdAt: n.createdAt.toISOString()
    }));
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

export async function markAllAsRead() {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    await prisma.notification.updateMany({
        where: { userId: session.user.id, isRead: false },
        data: { isRead: true },
    });
    revalidatePath("/notifications");
}
