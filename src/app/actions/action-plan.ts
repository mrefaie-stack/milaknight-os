"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/email";
import { logActivity } from "./activity";

export async function getActionPlans(clientId?: string) {
    const session = await getServerSession(authOptions);

    if (!session) throw new Error("Unauthorized");

    // If AM, return plans for their clients. If Client, return their plans. If Admin, return all.
    let where = {};
    if (session.user.role === "AM") {
        where = { client: { amId: session.user.id } };
    } else if (session.user.role === "CLIENT") {
        const client = await prisma.client.findUnique({ where: { userId: session.user.id } });
        if (client) {
            where = {
                clientId: client.id,
                status: { not: "DRAFT" }
            };
        } else {
            return []; // No client linked
        }
    } else if (session.user.role === "MODERATOR") {
        where = { status: { in: ["APPROVED", "SCHEDULED"] } };
    }

    if (clientId) {
        where = { ...where, clientId };
    }

    return prisma.actionPlan.findMany({
        where,
        include: {
            client: true,
            items: true,
        },
        orderBy: { createdAt: "desc" }
    });
}

export async function createActionPlan(clientId: string, month: string) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "AM" && session.user.role !== "ADMIN")) {
        throw new Error("Unauthorized");
    }
    if (session.user.role === "AM") {
        const client = await prisma.client.findUnique({ where: { id: clientId } });
        if (!client || client.amId !== session.user.id) throw new Error("Unauthorized Access");
    }
    if (session.user.role === "AM") {
        const client = await prisma.client.findUnique({ where: { id: clientId } });
        if (!client || client.amId !== session.user.id) throw new Error("Unauthorized Access");
    }

    const plan = await prisma.actionPlan.create({
        data: {
            clientId,
            month,
        },
        include: { client: true }
    });

    await logActivity(`created a new content plan draft for ${plan.client.name} (${month})`, "ActionPlan", plan.id);

    revalidatePath("/am/action-plans");
    return plan;
}

export async function addContentItem(planId: string, data: any) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "AM" && session.user.role !== "ADMIN")) {
        throw new Error("Unauthorized");
    }
    if (session.user.role === "AM") {
        const plan = await prisma.actionPlan.findUnique({ where: { id: planId }, include: { client: true } });
        if (!plan || plan.client.amId !== session.user.id) throw new Error("Unauthorized Access");
    }

    const item = await prisma.contentItem.create({
        data: {
            planId,
            type: data.type,
            platform: data.platform,
            scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
            imageUrl: data.imageUrl,
            videoUrl: data.videoUrl,
            captionAr: data.captionAr,
            captionEn: data.captionEn,
            pollQuestion: data.pollQuestion,
            pollOptionA: data.pollOptionA,
            pollOptionB: data.pollOptionB,
            articleTitle: data.articleTitle,
            articleContent: data.articleContent,
            emailSubject: data.emailSubject,
            emailBody: data.emailBody,
            emailDesign: data.emailDesign,
            platformCaptions: data.platformCaptions,
            amComment: data.amComment,
            status: "DRAFT",
        }
    });

    revalidatePath(`/am/action-plans/${planId}`);
    return item;
}

export async function submitForApproval(planId: string) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "AM" && session.user.role !== "ADMIN")) throw new Error("Unauthorized");

    if (session.user.role === "AM") {
        const checkPlan = await prisma.actionPlan.findUnique({ where: { id: planId }, include: { client: true } });
        if (!checkPlan || checkPlan.client.amId !== session.user.id) throw new Error("Unauthorized Access");
    }

    // Update the plan status
    const plan = await prisma.actionPlan.update({
        where: { id: planId },
        data: { status: "PENDING" },
        include: { client: { include: { user: true } } }
    });

    // Update all items in this plan that are DRAFT to PENDING
    await prisma.contentItem.updateMany({
        where: { planId, status: "DRAFT" },
        data: { status: "PENDING" }
    });

    // Notify the client
    if (plan.client?.user) {
        await prisma.notification.create({
            data: {
                userId: plan.client.user.id,
                title: "Action Plan Ready",
                message: `Your action plan for ${plan.month} is ready for approval.`,
                type: "SYSTEM",
                link: `/client/action-plans`
            }
        });

        // Send Email
        await sendEmail({
            to: plan.client.user.email,
            subject: `Action Plan Ready for Approval - ${plan.month}`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; background: #f4f4f5; border-radius: 8px; max-width: 600px; margin: auto;">
                    <h2 style="color: #4f46e5; margin-bottom: 20px;">MilaKnight Action Plans</h2>
                    <p style="font-size: 16px;">Hello ${plan.client.user.firstName},</p>
                    <p style="font-size: 16px;">Your action plan for <strong>${plan.month}</strong> is ready for your review and approval.</p>
                    <br/>
                    <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/client/action-plans/${plan.id}" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Review Action Plan</a>
                    <br/><br/>
                    <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;"/>
                    <p style="font-size: 12px; color: #6b7280;">If you have any questions, please reach out to your Account Manager.</p>
                </div>
            `
        });
    }

    await logActivity(`submitted content plan for ${plan.client.name} (${plan.month}) for approval`, "ActionPlan", planId);

    revalidatePath(`/am/action-plans/${planId}`);
    revalidatePath("/client/action-plans");
}

export async function requestActionPlanDeletion(planId: string) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "AM") throw new Error("Only AMs can request deletions");

    const plan = await prisma.actionPlan.findUnique({ where: { id: planId }, include: { client: true } });
    if (!plan || plan.client.amId !== session.user.id) throw new Error("Unauthorized Access");

    return prisma.deletionRequest.create({
        data: {
            entityType: "ActionPlan",
            entityId: planId,
            requestedById: session.user.id,
            status: "PENDING"
        }
    });
}
export async function submitActionPlanFeedback(planId: string, itemFeedbacks: { itemId: string, comment: string }[] | string) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "CLIENT") throw new Error("Unauthorized");

    const checkPlan = await prisma.actionPlan.findUnique({ where: { id: planId }, include: { client: true } });
    if (!checkPlan || checkPlan.client.userId !== session.user.id) throw new Error("Unauthorized Access");

    // Update the plan status
    const plan = await prisma.actionPlan.update({
        where: { id: planId },
        data: { status: "REVISION_REQUESTED" },
        include: {
            client: {
                include: { accountManager: true }
            },
            items: true // Fetch items to apply legacy global feedback if necessary
        }
    });

    // Handle legacy string feedback vs granular array
    if (typeof itemFeedbacks === 'string') {
        if (itemFeedbacks.trim() && plan.items.length > 0) {
            // Apply the global comment to the first item as a fallback
            await prisma.contentItem.update({
                where: { id: plan.items[0].id },
                data: {
                    clientComment: itemFeedbacks,
                    feedbackResolved: false
                }
            });
        }
    } else {
        // Update each item with its granular feedback
        for (const fb of itemFeedbacks) {
            if (fb.comment.trim()) {
                await prisma.contentItem.update({
                    where: { id: fb.itemId },
                    data: {
                        clientComment: fb.comment,
                        feedbackResolved: false
                    }
                });
            }
        }
    }

    // Notify the AM
    if (plan.client?.accountManager?.email) {
        await prisma.notification.create({
            data: {
                userId: plan.client.accountManager.id,
                title: "Client Requested Revisions",
                message: `The client ${plan.client.name} requested revisions on multiple items for ${plan.month}.`,
                type: "SYSTEM",
                link: `/am/action-plans/${planId}`
            }
        });

        // Send Email
        await sendEmail({
            to: plan.client.accountManager.email,
            subject: `Action Plan Revisions Requested - ${plan.client.name}`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; background: #fff8f1; border-radius: 8px; border-left: 4px solid #f97316; max-width: 600px; margin: auto;">
                    <h2 style="color: #f97316; margin-bottom: 20px;">Revisions Requested</h2>
                    <p style="font-size: 16px;">Hello ${plan.client.accountManager.firstName},</p>
                    <p style="font-size: 16px;">The client <strong>${plan.client.name}</strong> has left feedback on their action plan for <strong>${plan.month}</strong>.</p>
                    <br/>
                    <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/am/action-plans/${plan.id}" style="display: inline-block; padding: 12px 24px; background-color: #f97316; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Review Feedback</a>
                </div>
            `
        });
    }

    await logActivity(`submitted feedback on content plan for ${plan.client.name} (${plan.month})`, "ActionPlan", planId);

    revalidatePath(`/client/action-plans/${planId}`);
    revalidatePath(`/am/action-plans/${planId}`);
    revalidatePath("/am/action-plans");
    return { success: true };
}

export async function resolveActionPlanItem(itemId: string, planId: string) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "AM" && session.user.role !== "ADMIN")) {
        throw new Error("Unauthorized");
    }

    await prisma.contentItem.update({
        where: { id: itemId },
        data: { feedbackResolved: true }
    });

    revalidatePath(`/am/action-plans/${planId}`);
    return { success: true };
}

export async function notifyClientOfActionPlanUpdate(planId: string) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "AM" && session.user.role !== "ADMIN")) {
        throw new Error("Unauthorized");
    }

    const plan = await prisma.actionPlan.update({
        where: { id: planId },
        data: { status: "PENDING" }, // Back to pending so client can review and approve
        include: { client: { include: { user: true } } }
    });

    if (plan.client?.user) {
        await prisma.notification.create({
            data: {
                userId: plan.client.user.id,
                title: "Action Plan Updated",
                message: `Your action plan for ${plan.month} has been updated based on your feedback.`,
                type: "SYSTEM",
                link: `/client/action-plans/${plan.id}`
            }
        });

        // Send Email
        await sendEmail({
            to: plan.client.user.email,
            subject: `Action Plan Updated - ${plan.month}`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; background: #f0fdf4; border-radius: 8px; border-left: 4px solid #10b981; max-width: 600px; margin: auto;">
                    <h2 style="color: #10b981; margin-bottom: 20px;">Action Plan Fixes Ready</h2>
                    <p style="font-size: 16px;">Hello ${plan.client.user.firstName},</p>
                    <p style="font-size: 16px;">Your Account Manager has addressed the feedback on your action plan for <strong>${plan.month}</strong>.</p>
                    <br/>
                    <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/client/action-plans/${plan.id}" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Review Fixes</a>
                </div>
            `
        });
    }

    revalidatePath(`/am/action-plans/${planId}`);
    revalidatePath(`/client/action-plans`);
    return { success: true };
}

export async function deleteContentItem(itemId: string, planId: string) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "AM" && session?.user?.role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    await prisma.contentItem.delete({
        where: { id: itemId }
    });

    revalidatePath(`/am/action-plans/${planId}`);
    return { success: true };
}

export async function unapproveContentItem(itemId: string, planId: string) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "CLIENT") throw new Error("Unauthorized");

    const plan = await prisma.actionPlan.findUnique({
        where: { id: planId },
        include: { client: true }
    });

    if (!plan || plan.client.userId !== session.user.id) throw new Error("Unauthorized Access");

    await prisma.contentItem.update({
        where: { id: itemId },
        data: { status: "PENDING" }
    });

    // Also update plan status to PENDING if it was APPROVED (so AM knows something changed)
    if (plan.status === "APPROVED") {
        await prisma.actionPlan.update({
            where: { id: planId },
            data: { status: "PENDING" }
        });
    }

    revalidatePath(`/client/action-plans/${planId}`);
    revalidatePath(`/am/action-plans/${planId}`);
    return { success: true };
}

export async function getApprovedPosts(clientId: string) {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    // Fetch approved content items for this client from across all action plans
    return prisma.contentItem.findMany({
        where: {
            plan: {
                clientId,
                status: { in: ["APPROVED", "SCHEDULED"] }
            },
            status: "APPROVED"
        },
        orderBy: { scheduledDate: "desc" }
    });
}

export async function approveContentItem(itemId: string, planId: string) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "CLIENT") throw new Error("Unauthorized");

    const plan = await prisma.actionPlan.findUnique({
        where: { id: planId },
        include: { client: true, items: true }
    });

    if (!plan || plan.client.userId !== session.user.id) throw new Error("Unauthorized Access");

    await prisma.contentItem.update({
        where: { id: itemId },
        data: { status: "APPROVED" }
    });

    // Check if ALL items in this plan are now approved
    const allItems = await prisma.contentItem.findMany({ where: { planId } });
    const allApproved = allItems.every(i => i.status === "APPROVED");

    if (allApproved) {
        await prisma.actionPlan.update({
            where: { id: planId },
            data: { status: "APPROVED" }
        });
    }

    revalidatePath(`/client/action-plans/${planId}`);
    revalidatePath(`/am/action-plans/${planId}`);
    return { success: true };
}

export async function approveActionPlan(planId: string) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "CLIENT") throw new Error("Unauthorized");

    const plan = await prisma.actionPlan.findUnique({
        where: { id: planId },
        include: { client: true }
    });

    if (!plan || plan.client.userId !== session.user.id) throw new Error("Unauthorized Access");

    // Approve the plan
    await prisma.actionPlan.update({
        where: { id: planId },
        data: { status: "APPROVED" }
    });

    // Also approve all items in the plan that are not already approved
    await prisma.contentItem.updateMany({
        where: {
            planId,
            status: { in: ["PENDING", "REVISION_REQUESTED", "DRAFT"] }
        },
        data: { status: "APPROVED" }
    });

    await logActivity(`approved the action plan for ${plan.month}`, "ActionPlan", planId);

    revalidatePath(`/client/action-plans/${planId}`);
    revalidatePath(`/am/action-plans/${planId}`);
    revalidatePath("/am/action-plans");
    revalidatePath("/client/action-plans");

    return { success: true };
}
export async function scheduleActionPlan(planId: string) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "MODERATOR") throw new Error("Unauthorized");

    const plan = await prisma.actionPlan.update({
        where: { id: planId },
        data: { status: "SCHEDULED" },
        include: {
            client: {
                include: {
                    accountManager: true
                }
            }
        }
    });

    // Notify the AM
    if (plan.client?.accountManager) {
        await prisma.notification.create({
            data: {
                userId: plan.client.accountManager.id,
                title: "Action Plan Scheduled",
                message: `The moderator has scheduled the action plan for ${plan.client.name} for ${plan.month}.`,
                type: "SYSTEM",
                link: `/am/action-plans/${planId}`
            }
        });

        // Send Email to AM
        if (plan.client.accountManager.email) {
            await sendEmail({
                to: plan.client.accountManager.email,
                subject: `Action Plan Scheduled - ${plan.client.name}`,
                html: `
                    <div style="font-family: sans-serif; padding: 20px; background: #f0fdf4; border-radius: 8px; border-left: 4px solid #10b981; max-width: 600px; margin: auto;">
                        <h2 style="color: #10b981; margin-bottom: 20px;">Action Plan Scheduled</h2>
                        <p style="font-size: 16px;">Hello ${plan.client.accountManager.firstName},</p>
                        <p style="font-size: 16px;">The moderator has marked the action plan for <strong>${plan.client.name}</strong> (${plan.month}) as <strong>SCHEDULED</strong>.</p>
                        <br/>
                        <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/am/action-plans/${plan.id}" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">View Details</a>
                    </div>
                `
            });
        }
    }

    // Notify Admins
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
    for (const admin of admins) {
        await prisma.notification.create({
            data: {
                userId: admin.id,
                title: "Action Plan Scheduled",
                message: `Moderator scheduled plan for ${plan.client.name} (${plan.month}).`,
                type: "SYSTEM",
                link: `/admin/clients/${plan.clientId}/action-plans`
            }
        });
    }

    await logActivity(`scheduled action plan for ${plan.client.name} (${plan.month})`, "ActionPlan", planId);

    revalidatePath(`/moderator/action-plans/${planId}`);
    revalidatePath("/moderator/action-plans");
    revalidatePath(`/am/action-plans/${planId}`);
    revalidatePath("/am/action-plans");
    revalidatePath(`/admin/clients/${plan.clientId}/action-plans`);

    return { success: true };
}
