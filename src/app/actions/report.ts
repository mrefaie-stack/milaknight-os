"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createReport(clientId: string, month: string, metricsData: any) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "AM" && session?.user?.role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    const report = await prisma.report.create({
        data: {
            clientId,
            month,
            metrics: JSON.stringify(metricsData),
            status: "DRAFT",
        }
    });

    revalidatePath("/am/reports");
    return report;
}

export async function updateReport(reportId: string, metricsData: any) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "AM" && session?.user?.role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    const report = await prisma.report.update({
        where: { id: reportId },
        data: {
            metrics: JSON.stringify(metricsData),
        }
    });

    revalidatePath(`/am/reports/${reportId}`);
    return report;
}

export async function publishReport(reportId: string) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "AM" && session?.user?.role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    const report = await prisma.report.update({
        where: { id: reportId },
        data: { status: "SENT" },
        include: { client: true }
    });

    // Notify the client
    if (report.client?.userId) {
        await prisma.notification.create({
            data: {
                userId: report.client.userId,
                title: "New Performance Report Available",
                message: `Your performance report for ${report.month} is ready for viewing.`,
                type: "SYSTEM",
                link: `/client/reports/${report.id}`
            }
        });
    }

    revalidatePath("/am/reports");
    revalidatePath(`/am/reports/${reportId}`);
    revalidatePath("/client/reports");
    return report;
}

export async function getReports() {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    let where = {};
    if (session.user.role === "AM") {
        where = { client: { amId: session.user.id } };
    } else if (session.user.role === "CLIENT") {
        const client = await prisma.client.findUnique({ where: { userId: session.user.id } });
        if (client) {
            where = { clientId: client.id, status: "SENT" };
        } else {
            return [];
        }
    }

    return prisma.report.findMany({
        where,
        include: { client: true },
        orderBy: { createdAt: "desc" }
    });
}

export async function getReportById(id: string) {
    return prisma.report.findUnique({
        where: { id },
        include: { client: true }
    });
}

export async function requestReportDeletion(reportId: string) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "AM") throw new Error("Only AMs can request deletions");

    return prisma.deletionRequest.create({
        data: {
            entityType: "Report",
            entityId: reportId,
            requestedById: session.user.id,
            status: "PENDING"
        }
    });
}

export async function getDeletionRequests() {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");

    return prisma.deletionRequest.findMany({
        where: { status: "PENDING" },
        include: { requestedBy: true },
        orderBy: { createdAt: "desc" }
    });
}

export async function approveDeletionRequest(requestId: string) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");

    const request = await prisma.deletionRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new Error("Request not found");

    if (request.entityType === "Report") {
        await prisma.report.delete({ where: { id: request.entityId } });
    } else if (request.entityType === "ActionPlan") {
        await prisma.actionPlan.delete({ where: { id: request.entityId } });
    }

    await prisma.deletionRequest.update({
        where: { id: requestId },
        data: { status: "APPROVED" }
    });

    revalidatePath("/admin");
    revalidatePath("/am/reports");
    revalidatePath("/am/action-plans");
}

export async function rejectDeletionRequest(requestId: string) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");

    await prisma.deletionRequest.update({
        where: { id: requestId },
        data: { status: "REJECTED" }
    });

    revalidatePath("/admin");
}
