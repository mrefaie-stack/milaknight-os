"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function approveItem(itemId: string) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "CLIENT" && session?.user?.role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    const item = await prisma.contentItem.update({
        where: { id: itemId },
        data: { status: "APPROVED" }
    });

    revalidatePath(`/client/action-plans/${item.planId}`);
    return item;
}

export async function requestEdit(itemId: string, comment: string) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "CLIENT" && session?.user?.role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    // Update item status and feedback
    const item = await prisma.contentItem.update({
        where: { id: itemId },
        data: {
            status: "NEEDS_EDIT",
            clientComment: comment,
            feedbackResolved: false
        }
    });

    // Update overall plan status to REVISION_REQUESTED
    await prisma.actionPlan.update({
        where: { id: item.planId },
        data: { status: "REVISION_REQUESTED" }
    });

    // Notify AM
    const plan = await prisma.actionPlan.findUnique({
        where: { id: item.planId },
        include: { client: { include: { accountManager: true } } }
    });

    if (plan?.client?.accountManager?.id) {
        await prisma.notification.create({
            data: {
                userId: plan.client.accountManager.id,
                title: "Revision Requested",
                message: `Client requested an edit on an item in ${plan.month} plan.`,
                type: "SYSTEM",
                link: `/am/action-plans/${plan.id}`
            }
        });
    }

    revalidatePath(`/client/action-plans/${item.planId}`);
    revalidatePath(`/am/action-plans/${item.planId}`);
    return item;
}
