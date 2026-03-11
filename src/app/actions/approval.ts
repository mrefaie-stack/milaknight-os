"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logActivity } from "./activity";

export async function approveItem(itemId: string) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "CLIENT" && session?.user?.role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    const item = await prisma.contentItem.findUnique({
        where: { id: itemId },
        include: { plan: { include: { client: true } } }
    });

    if (!item) throw new Error("Item not found");

    if (session?.user?.role === "CLIENT") {
        if (item.plan.client.userId !== session.user.id) throw new Error("Unauthorized Access");
    }

    await prisma.contentItem.update({
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
    const item = await prisma.contentItem.findUnique({
        where: { id: itemId },
        include: { plan: { include: { client: true } } }
    });

    if (!item) throw new Error("Item not found");

    if (session?.user?.role === "CLIENT") {
        if (item.plan.client.userId !== session.user.id) throw new Error("Unauthorized Access");
    }

    await prisma.contentItem.update({
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

    if (plan) {
        await logActivity(`requested revision on content plan for ${plan.client.name} (${plan.month})`, "ActionPlan", item.planId);
    }

    revalidatePath(`/client/action-plans/${item.planId}`);
    revalidatePath(`/am/action-plans/${item.planId}`);
    return item;
}
export async function approveActionPlan(planId: string) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "CLIENT" && session?.user?.role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    const plan = await prisma.actionPlan.findUnique({
        where: { id: planId },
        include: { client: true }
    });

    if (!plan) throw new Error("Plan not found");

    if (session?.user?.role === "CLIENT") {
        if (plan.client.userId !== session.user.id) throw new Error("Unauthorized Access");
    }

    // Update ActionPlan status
    await prisma.actionPlan.update({
        where: { id: planId },
        data: { status: "APPROVED" },
    });

    // Re-fetch to include account manager for notification
    const updatedPlan = await prisma.actionPlan.findUnique({
        where: { id: planId },
        include: { client: { include: { accountManager: true } } }
    });
    if (!updatedPlan) throw new Error("Plan not found");

    // Update all items in the plan to APPROVED
    await prisma.contentItem.updateMany({
        where: { planId },
        data: { status: "APPROVED" }
    });

    // Notify AM
    if (updatedPlan.client?.accountManager?.id) {
        await prisma.notification.create({
            data: {
                userId: updatedPlan.client.accountManager.id,
                title: "Action Plan Approved",
                message: `The client ${updatedPlan.client.name} has approved the action plan for ${updatedPlan.month}.`,
                type: "SYSTEM",
                link: `/am/action-plans/${planId}`
            }
        });
    }

    await logActivity(`fully approved the content plan for ${updatedPlan.client.name} (${updatedPlan.month})`, "ActionPlan", planId);

    revalidatePath(`/client/action-plans/${planId}`);
    revalidatePath(`/am/action-plans/${planId}`);
    revalidatePath("/client/action-plans");
    revalidatePath("/am/action-plans");
    revalidatePath("/admin/clients");

    return { success: true };
}
