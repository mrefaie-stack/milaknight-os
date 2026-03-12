"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/email";
import { logActivity } from "./activity";

export async function createReport(clientId: string, month: string, metricsData: any, scheduledSendAt?: Date) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "AM" && session.user.role !== "ADMIN")) {
        throw new Error("Unauthorized");
    }
    if (session.user.role === "AM") {
        const client = await prisma.client.findUnique({ where: { id: clientId } });
        if (!client || client.amId !== session.user.id) throw new Error("Unauthorized Access");
    }

    const report = await (prisma as any).report.create({
        data: {
            clientId,
            month,
            metrics: JSON.stringify(metricsData),
            status: "DRAFT",
            scheduledSendAt
        },
        include: { client: true }
    });

    await logActivity(`created a new report draft for ${report.client.name}`, "Report", report.id);

    revalidatePath("/am/reports");
    return report;
}

export async function updateReport(reportId: string, metricsData: any, month?: string, clientId?: string, scheduledSendAt?: Date | null) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "AM" && session.user.role !== "ADMIN")) {
        throw new Error("Unauthorized");
    }
    if (session.user.role === "AM") {
        const checkReport = await prisma.report.findUnique({ where: { id: reportId }, include: { client: true } });
        if (!checkReport || checkReport.client.amId !== session.user.id) throw new Error("Unauthorized Access");
    }

    const report = await (prisma as any).report.update({
        where: { id: reportId },
        data: {
            metrics: JSON.stringify(metricsData),
            month: month || undefined,
            clientId: clientId || undefined,
            scheduledSendAt: scheduledSendAt !== undefined ? scheduledSendAt : undefined
        }
    });
    
    // Reset plan approval if items are updated
    await (prisma as any).report.update({
        where: { id: reportId },
        data: { 
            mmStatus: "DRAFT",
            status: "DRAFT"
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

    const report = await (prisma as any).report.findUnique({
        where: { id: reportId },
        include: { client: { include: { user: true } } }
    });

    if (!report) throw new Error("Report not found");
    if (session.user.role === "AM" && report.client.amId !== session.user.id) throw new Error("Unauthorized Access");

    // If there is a Marketing Manager, it needs their approval first
    if (report.client.mmId) {
        await (prisma as any).report.update({
            where: { id: reportId },
            data: { mmStatus: "PENDING" }
        });

        // Notify MM
        await prisma.notification.create({
            data: {
                userId: report.client.mmId,
                title: "Annual/Monthly Report Review Required",
                message: `The account manager has submitted a report for ${report.client.name} (${report.month}) for your review.`,
                type: "SYSTEM",
                link: `/tasks`
            }
        });

        await logActivity(`submitted report for ${report.client.name} (${report.month}) for internal MM review`, "Report", reportId);
        
        revalidatePath(`/am/reports/${reportId}`);
        return { success: true, internalReview: true };
    }

    // No MM, proceed directly to client
    await (prisma as any).report.update({
        where: { id: reportId },
        data: { status: "SENT" },
    });

    // Update client's global SEO score from this report
    try {
        const m = typeof report.metrics === 'string' ? JSON.parse(report.metrics) : report.metrics;
        if (m?.seo?.score !== undefined) {
            await (prisma as any).client.update({
                where: { id: report.clientId },
                data: { seoScore: Number(m.seo.score) || 0 }
            });
        }
    } catch (e) {
        console.error("Failed to sync SEO score to client", e);
    }

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
    return { success: true, toClient: true };
}

export async function approveReportByMM(reportId: string) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "MARKETING_MANAGER" && session.user.role !== "ADMIN")) {
        throw new Error("Unauthorized");
    }

    const report = await (prisma as any).report.findUnique({
        where: { id: reportId },
        include: { client: { include: { user: true, accountManager: true } } }
    });

    if (!report) throw new Error("Report not found");
    if (session.user.role === "MARKETING_MANAGER" && report.client.mmId !== session.user.id) {
        throw new Error("Unauthorized Access");
    }

    // Approve internally
    await (prisma as any).report.update({
        where: { id: reportId },
        data: { 
            mmStatus: "APPROVED",
            status: "SENT" // Now it can go to client
        }
    });

    // Notify AM
    if (report.client?.accountManager) {
        await prisma.notification.create({
            data: {
                userId: report.client.accountManager.id,
                title: "Report Approved by MM",
                message: `The Marketing Manager has approved the report for ${report.client.name} (${report.month}) and it has been published to the client.`,
                type: "SYSTEM",
                link: `/am/reports/${reportId}`
            }
        });
    }

    // Notify Client
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
                </div>
            `
        });
    }

    await logActivity(`MM approved report for ${report.client.name} (${report.month})`, "Report", reportId);

    revalidatePath(`/am/reports/${reportId}`);
    revalidatePath("/client/reports");
    revalidatePath("/tasks");
    return { success: true };
}

export async function rejectReportByMM(reportId: string, feedback: string) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "MARKETING_MANAGER" && session.user.role !== "ADMIN")) {
        throw new Error("Unauthorized");
    }

    const report = await (prisma as any).report.findUnique({
        where: { id: reportId },
        include: { client: { include: { accountManager: true } } }
    });

    if (!report) throw new Error("Report not found");
    if (session.user.role === "MARKETING_MANAGER" && report.client.mmId !== session.user.id) {
        throw new Error("Unauthorized Access");
    }

    // Reject internally
    await (prisma as any).report.update({
        where: { id: reportId },
        data: { 
            mmStatus: "REJECTED",
        }
    });

    // Notify AM
    if (report.client?.accountManager) {
        await prisma.notification.create({
            data: {
                userId: report.client.accountManager.id,
                title: "Report Rejected by MM",
                message: `The Marketing Manager rejected the report for ${report.client.name} (${report.month}). Reason: ${feedback}`,
                type: "SYSTEM",
                link: `/am/reports/${reportId}`
            }
        });
    }

    await logActivity(`MM rejected report for ${report.client.name} (${report.month})`, "Report", reportId);

    revalidatePath(`/am/reports/${reportId}`);
    revalidatePath("/tasks");
    return { success: true };
}

export async function getReports() {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    let where = {};
    if (session.user.role === "AM") {
        where = { client: { amId: session.user.id } };
    } else if (session.user.role === "MARKETING_MANAGER") {
        where = { client: { mmId: session.user.id } };
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
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    const report = await prisma.report.findUnique({
        where: { id },
        include: { client: true }
    });

    if (!report) return null;

    // Permission Check
    if (session.user.role === "CLIENT") {
        if (report.client.userId !== session.user.id) throw new Error("Unauthorized Access");
    } else if (session.user.role === "AM") {
        if (report.client.amId !== session.user.id) throw new Error("Unauthorized Access");
    } else if (session.user.role === "MARKETING_MANAGER") {
        if ((report.client as any).mmId !== session.user.id) throw new Error("Unauthorized Access");
    } else if (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR") {
        throw new Error("Unauthorized Access");
    }

    return report;
}

export async function getPreviousReport(clientId: string, currentMonth: string) {
    // Get all reports for this client ordered by month descending
    const reports = await prisma.report.findMany({
        where: { clientId, status: "SENT" },
        orderBy: { month: "desc" },
    });
    // Find the one just before the current month
    const idx = reports.findIndex(r => r.month === currentMonth);
    const prev = idx >= 0 ? reports[idx + 1] : reports[0];
    if (!prev) return null;
    return { ...prev, metrics: typeof prev.metrics === 'string' ? JSON.parse(prev.metrics) : prev.metrics };
}

export async function submitReportFeedback(reportId: string, feedback: string) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "CLIENT") throw new Error("Unauthorized");

    const report = await prisma.report.findUnique({ where: { id: reportId }, include: { client: { include: { accountManager: true } } } });
    if (!report || report.client.userId !== session.user.id) throw new Error("Unauthorized Access");

    const updated = await prisma.report.update({
        where: { id: reportId },
        data: { clientFeedback: feedback, clientFeedbackAt: new Date() } as any,
    });

    // Notify the AM
    if (report.client.accountManager) {
        await prisma.notification.create({
            data: {
                userId: report.client.accountManager.id,
                title: `Client Feedback on Report`,
                message: `${report.client.name} left feedback on the ${report.month} report.`,
                type: "SYSTEM",
                link: `/am/reports/${reportId}`,
            }
        });
    }

    revalidatePath(`/am/reports/${reportId}`);
    revalidatePath(`/client/reports/${reportId}`);
    return updated;
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

export async function generateReportSummary(metricsData: any) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "AM" && session.user.role !== "ADMIN")) {
        throw new Error("Unauthorized");
    }

    // Heuristic-based summary generation (Bilingual)
    const metrics = metricsData;

    const summaryAr = `ملخص الأداء: 
شهد هذا الشهر ${metrics.global?.reach?.value > 1000 ? 'نمواً ملحوظاً في الوصول' : 'أداءً مستقراً'}. 
تم تحقيق ${metrics.global?.conversions?.value || 0} عملية تحويل بنسبة تفاعل ${metrics.global?.engagement?.value || 0}%.
التركيز في المرحلة القادمة سيكون على ${metrics.seo?.score < 70 ? 'تحسين السيو' : 'زيادة وتيرة النشر'}.`;

    const summaryEn = `Performance Summary:
This month showed ${metrics.global?.reach?.value > 1000 ? 'significant growth in reach' : 'stable performance'}.
Achieved ${metrics.global?.conversions?.value || 0} conversions with an engagement rate of ${metrics.global?.engagement?.value || 0}%.
Next phase focus will be on ${metrics.seo?.score < 70 ? 'improving SEO' : 'increasing posting frequency'}.`;

    return {
        summaryAr,
        summaryEn
    };
}
