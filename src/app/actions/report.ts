"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/email";
import { logActivity } from "./activity";

export async function createReport(clientId: string, month: string, metricsData: any) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "AM" && session.user.role !== "ADMIN")) {
        throw new Error("Unauthorized");
    }
    if (session.user.role === "AM") {
        const client = await prisma.client.findUnique({ where: { id: clientId } });
        if (!client || client.amId !== session.user.id) throw new Error("Unauthorized Access");
    }

    const report = await prisma.report.create({
        data: {
            clientId,
            month,
            metrics: JSON.stringify(metricsData),
            status: "DRAFT",
        },
        include: { client: true }
    });

    await logActivity(`created a new report draft for ${report.client.name}`, "Report", report.id);

    revalidatePath("/am/reports");
    return report;
}

export async function updateReport(reportId: string, metricsData: any, month?: string, clientId?: string) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "AM" && session.user.role !== "ADMIN")) {
        throw new Error("Unauthorized");
    }
    if (session.user.role === "AM") {
        const checkReport = await prisma.report.findUnique({ where: { id: reportId }, include: { client: true } });
        if (!checkReport || checkReport.client.amId !== session.user.id) throw new Error("Unauthorized Access");
    }

    const report = await prisma.report.update({
        where: { id: reportId },
        data: {
            metrics: JSON.stringify(metricsData),
            month: month || undefined,
            clientId: clientId || undefined,
        }
    });

    revalidatePath(`/am/reports/${reportId}`);
    return report;
}

export async function publishReport(reportId: string) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "AM" && session.user.role !== "ADMIN")) {
        throw new Error("Unauthorized");
    }
    if (session.user.role === "AM") {
        const checkReport = await prisma.report.findUnique({ where: { id: reportId }, include: { client: true } });
        if (!checkReport || checkReport.client.amId !== session.user.id) throw new Error("Unauthorized Access");
    }

    const report = await prisma.report.update({
        where: { id: reportId },
        data: { status: "SENT" },
        include: { client: { include: { user: true } } }
    });

    // Notify the client
    if (report.client?.user) {
        await prisma.notification.create({
            data: {
                userId: report.client.user.id,
                title: "New Performance Report Available",
                message: `Your performance report for ${report.month} is ready for viewing.`,
                type: "SYSTEM",
                link: `/client/reports/${report.id}`
            }
        });

        // Send Email
        await sendEmail({
            to: report.client.user.email,
            subject: `Performance Report - ${report.month}`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; background: #f4f4f5; border-radius: 8px; max-width: 600px; margin: auto;">
                    <h2 style="color: #4f46e5; margin-bottom: 20px;">MilaKnight Reports</h2>
                    <p style="font-size: 16px;">Hello ${report.client.user.firstName},</p>
                    <p style="font-size: 16px;">Your performance report for <strong>${report.month}</strong> is now available for review.</p>
                    <br/>
                    <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/client/reports/${report.id}" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">View Report</a>
                    <br/><br/>
                    <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;"/>
                    <p style="font-size: 12px; color: #6b7280;">If you have any questions, please reach out to your Account Manager.</p>
                </div>
            `
        });
    }

    await logActivity(`published performance report for ${report.client.name}`, "Report", reportId);

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

    const report = await prisma.report.findUnique({ where: { id: reportId }, include: { client: true } });
    if (!report || report.client.amId !== session.user.id) throw new Error("Unauthorized Access");

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

    await logActivity(`approved deletion request for ${request.entityType}`, request.entityType, request.entityId);

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
