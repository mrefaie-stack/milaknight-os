"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/email";

const TEAM_LEADER_ROLE: Record<string, string> = {
    ART_TEAM: "ART_LEADER",
    CONTENT_TEAM: "CONTENT_LEADER",
    SEO_TEAM: "SEO_LEAD",
};

const LEADER_TEAM_ROLE: Record<string, string> = {
    ART_LEADER: "ART_TEAM",
    CONTENT_LEADER: "CONTENT_TEAM",
    SEO_LEAD: "SEO_TEAM",
};

const TEAM_ROLES = new Set(["ART_TEAM", "CONTENT_TEAM", "SEO_TEAM"]);
const LEADER_ROLES = new Set(["ART_LEADER", "CONTENT_LEADER", "SEO_LEAD"]);
const CAN_CREATE = new Set([...TEAM_ROLES, ...LEADER_ROLES]);
const CAN_VIEW = new Set([...CAN_CREATE, "MARKETING_MANAGER", "AM", "ADMIN"]);

async function notify(userId: string, title: string, message: string, link: string) {
    await prisma.notification.create({
        data: { userId, title, message, type: "APPROVAL", link },
    });
}

async function notifyByEmail(userId: string, subject: string, html: string) {
    try {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
        if (user?.email) {
            await sendEmail({ to: user.email, subject, html });
        }
    } catch {
        // silent fail
    }
}

export async function createApprovalRequest(data: {
    title: string;
    description?: string;
    clickupLink: string;
    clientId: string;
}) {
    const session = await getServerSession(authOptions);
    if (!session || !CAN_CREATE.has(session.user.role)) throw new Error("Unauthorized");

    const creatorRole = session.user.role;
    const isLeader = LEADER_ROLES.has(creatorRole);

    const client = await prisma.client.findUnique({
        where: { id: data.clientId },
        select: { id: true, name: true, mmId: true },
    });
    if (!client) throw new Error("Client not found");
    if (!client.mmId) throw new Error("هذا العميل ليس لديه مدير تسويق معيّن — لا يمكن إرسال طلب الموافقة");

    const status = isLeader ? "PENDING_MM" : "PENDING_LEADER";

    const request = await prisma.approvalRequest.create({
        data: {
            title: data.title,
            description: data.description,
            clickupLink: data.clickupLink,
            status,
            creatorId: session.user.id,
            creatorRole,
            clientId: data.clientId,
            mmId: client.mmId ?? undefined,
        },
        include: { creator: { select: { firstName: true, lastName: true } } },
    });

    const creatorName = `${request.creator.firstName} ${request.creator.lastName}`;
    const link = "/approvals";
    const baseUrl = process.env.NEXTAUTH_URL || "";

    if (isLeader) {
        if (client.mmId) {
            await notify(client.mmId, "طلب موافقة جديد", `${creatorName} أرسل طلب موافقة على "${data.title}" للعميل ${client.name}`, link);
            await notifyByEmail(client.mmId,
                `New Approval Request – ${data.title}`,
                `<p><b>${creatorName}</b> submitted an approval request for client <b>${client.name}</b>.</p><p><b>Title:</b> ${data.title}</p><p><a href="${baseUrl}${link}">View Request</a></p>`
            );
        }
    } else {
        const leaderRole = TEAM_LEADER_ROLE[creatorRole];
        const leaders = await prisma.user.findMany({ where: { role: leaderRole }, select: { id: true } });
        for (const leader of leaders) {
            await notify(leader.id, "طلب موافقة من الفريق", `${creatorName} يطلب موافقتك على "${data.title}"`, link);
            await notifyByEmail(leader.id,
                `Team Approval Request – ${data.title}`,
                `<p><b>${creatorName}</b> needs your approval for: <b>${data.title}</b></p><p><a href="${baseUrl}${link}">Review Request</a></p>`
            );
        }
    }

    revalidatePath("/approvals");
    return request;
}

export async function leaderActOnApproval(id: string, action: "APPROVED" | "REJECTED", comment?: string) {
    const session = await getServerSession(authOptions);
    if (!session || !LEADER_ROLES.has(session.user.role)) throw new Error("Unauthorized");

    const [request, actingUser] = await Promise.all([
        prisma.approvalRequest.findUnique({
            where: { id },
            include: {
                creator: { select: { id: true, firstName: true, lastName: true } },
                client: { select: { name: true, mmId: true } },
            },
        }),
        prisma.user.findUnique({ where: { id: session.user.id }, select: { firstName: true, lastName: true } }),
    ]);
    if (!request || request.status !== "PENDING_LEADER") throw new Error("Invalid request");

    const leaderName = actingUser ? `${actingUser.firstName} ${actingUser.lastName}`.trim() : "Leader";
    const link = "/approvals";
    const baseUrl = process.env.NEXTAUTH_URL || "";

    if (action === "APPROVED") {
        await prisma.approvalRequest.update({
            where: { id },
            data: {
                status: "PENDING_MM",
                leaderId: session.user.id,
                leaderAction: "APPROVED",
                leaderComment: comment || null,
                leaderActedAt: new Date(),
            },
        });

        await notify(request.creator.id, "وافق الليدر على طلبك", `وافق ${leaderName} على "${request.title}" — الآن بانتظار مدير التسويق`, link);
        await notifyByEmail(request.creator.id, `Leader Approved – ${request.title}`,
            `<p><b>${leaderName}</b> approved your request <b>${request.title}</b>. Now awaiting Marketing Manager approval.</p><p><a href="${baseUrl}${link}">View</a></p>`
        );

        if (request.client.mmId) {
            await notify(request.client.mmId, "طلب موافقة بانتظارك", `وافق الليدر على "${request.title}" للعميل ${request.client.name}`, link);
            await notifyByEmail(request.client.mmId, `Approval Awaiting Your Decision – ${request.title}`,
                `<p>Leader approved <b>${request.title}</b> for client <b>${request.client.name}</b>. Your approval is needed.</p><p><a href="${baseUrl}${link}">Review</a></p>`
            );
        }
    } else {
        await prisma.approvalRequest.update({
            where: { id },
            data: {
                status: "REJECTED",
                leaderId: session.user.id,
                leaderAction: "REJECTED",
                leaderComment: comment || null,
                leaderActedAt: new Date(),
                rejectedBy: "LEADER",
            },
        });

        await notify(request.creator.id, "رُفض طلبك من الليدر", `رفض ${leaderName} طلب "${request.title}"${comment ? `: ${comment}` : ""}`, link);
        await notifyByEmail(request.creator.id, `Request Rejected – ${request.title}`,
            `<p><b>${leaderName}</b> rejected your request <b>${request.title}</b>.</p>${comment ? `<p><b>Reason:</b> ${comment}</p>` : ""}<p><a href="${baseUrl}${link}">View</a></p>`
        );
    }

    revalidatePath("/approvals");
}

export async function mmActOnApproval(id: string, action: "APPROVED" | "REJECTED", comment?: string) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "MARKETING_MANAGER") throw new Error("Unauthorized");

    const [request, actingUser] = await Promise.all([
        prisma.approvalRequest.findUnique({
            where: { id, mmId: session.user.id },
            include: {
                creator: { select: { id: true, firstName: true, lastName: true } },
                leader: { select: { id: true, firstName: true, lastName: true } },
                client: { select: { name: true } },
            },
        }),
        prisma.user.findUnique({ where: { id: session.user.id }, select: { firstName: true, lastName: true } }),
    ]);
    if (!request || request.status !== "PENDING_MM") throw new Error("Invalid request");

    const mmName = actingUser ? `${actingUser.firstName} ${actingUser.lastName}`.trim() : "Marketing Manager";
    const link = "/approvals";
    const baseUrl = process.env.NEXTAUTH_URL || "";

    const updateData: Record<string, unknown> = {
        mmAction: action,
        mmComment: comment || null,
        mmActedAt: new Date(),
        status: action === "APPROVED" ? "APPROVED" : "REJECTED",
    };
    if (action === "REJECTED") updateData.rejectedBy = "MM";

    await prisma.approvalRequest.update({ where: { id }, data: updateData });

    if (action === "APPROVED") {
        await notify(request.creator.id, "تم اعتماد طلبك نهائياً", `وافق ${mmName} على "${request.title}"`, link);
        await notifyByEmail(request.creator.id, `Approved – ${request.title}`,
            `<p><b>${mmName}</b> approved your request <b>${request.title}</b>!</p><p><a href="${baseUrl}${link}">View</a></p>`
        );
        if (request.leader) {
            await notify(request.leader.id, "تم اعتماد الطلب", `وافق ${mmName} على "${request.title}"`, link);
        }
    } else {
        await notify(request.creator.id, "رُفض طلبك من مدير التسويق", `رفض ${mmName} طلب "${request.title}"${comment ? `: ${comment}` : ""}`, link);
        await notifyByEmail(request.creator.id, `Request Rejected – ${request.title}`,
            `<p><b>${mmName}</b> rejected your request <b>${request.title}</b>.</p>${comment ? `<p><b>Reason:</b> ${comment}</p>` : ""}<p><a href="${baseUrl}${link}">View</a></p>`
        );
        if (request.leader) {
            await notify(request.leader.id, "رُفض الطلب", `رفض ${mmName} طلب "${request.title}"`, link);
        }
    }

    revalidatePath("/approvals");
}

export async function getApprovals() {
    const session = await getServerSession(authOptions);
    if (!session || !CAN_VIEW.has(session.user.role)) throw new Error("Unauthorized");

    const role = session.user.role;
    let where: Record<string, unknown> = {};

    if (role === "ADMIN") {
        // all
    } else if (role === "MARKETING_MANAGER") {
        where = { mmId: session.user.id };
    } else if (role === "AM") {
        const myClients = await prisma.client.findMany({ where: { amId: session.user.id }, select: { id: true } });
        where = { clientId: { in: myClients.map((c) => c.id) } };
    } else if (LEADER_ROLES.has(role)) {
        const teamRole = LEADER_TEAM_ROLE[role];
        where = { OR: [{ creatorId: session.user.id }, { creatorRole: teamRole }] };
    } else if (TEAM_ROLES.has(role)) {
        where = { creatorId: session.user.id };
    }

    return prisma.approvalRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
            creator: { select: { id: true, firstName: true, lastName: true, role: true } },
            leader: { select: { id: true, firstName: true, lastName: true } },
            mm: { select: { id: true, firstName: true, lastName: true } },
            client: { select: { id: true, name: true, logoUrl: true } },
        },
    });
}

export async function getClientsForApproval() {
    const session = await getServerSession(authOptions);
    if (!session || !CAN_CREATE.has(session.user.role)) return [];

    return prisma.client.findMany({
        select: { id: true, name: true, logoUrl: true, mmId: true },
        orderBy: { name: "asc" },
    });
}

export async function getPendingApprovalCount(): Promise<number> {
    const session = await getServerSession(authOptions);
    if (!session || !CAN_VIEW.has(session.user.role)) return 0;

    const role = session.user.role;

    if (role === "ADMIN") {
        return prisma.approvalRequest.count({ where: { status: { in: ["PENDING_LEADER", "PENDING_MM"] } } });
    }
    if (role === "MARKETING_MANAGER") {
        return prisma.approvalRequest.count({ where: { mmId: session.user.id, status: "PENDING_MM" } });
    }
    if (LEADER_ROLES.has(role)) {
        return prisma.approvalRequest.count({ where: { creatorRole: LEADER_TEAM_ROLE[role], status: "PENDING_LEADER" } });
    }
    return 0;
}
