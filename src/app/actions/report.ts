"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/email";
import { logActivity } from "./activity";
import { geminiFlash } from "@/lib/ai/gemini";

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

        // BOLA Fix: Prevent AM from reassigning the report to a client they do not own
        if (clientId && clientId !== checkReport.clientId) {
            const newClient = await prisma.client.findUnique({ where: { id: clientId } });
            if (!newClient || newClient.amId !== session.user.id) {
                throw new Error("Unauthorized Access: You cannot reassign this report to a client you do not manage.");
            }
        }
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
                link: `/admin/approvals`
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
    revalidatePath("/admin/approvals");
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
    revalidatePath("/admin/approvals");
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
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) return null;

    if (session.user.role === "CLIENT") {
        if (client.userId !== session.user.id) throw new Error("Unauthorized Access");
    } else if (session.user.role === "AM") {
        if (client.amId !== session.user.id) throw new Error("Unauthorized Access");
    } else if (session.user.role === "MARKETING_MANAGER") {
        if ((client as any).mmId !== session.user.id) throw new Error("Unauthorized Access");
    } else if (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR" && session.user.role !== "SEO_LEAD") {
        throw new Error("Unauthorized Access");
    }

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

export async function deleteReport(reportId: string) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "AM" && session.user.role !== "ADMIN")) {
        throw new Error("Unauthorized");
    }

    const report = await prisma.report.findUnique({ where: { id: reportId }, include: { client: true } });
    if (!report) throw new Error("Report not found");
    if (session.user.role === "AM" && report.client.amId !== session.user.id) {
        throw new Error("Unauthorized Access");
    }

    await prisma.report.delete({ where: { id: reportId } });
    await logActivity(`deleted performance report for ${report.client.name} (${report.month})`, "Report", reportId);

    revalidatePath("/am/reports");
    revalidatePath(`/client/reports`);
    return { success: true };
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

export async function generateReportSummary(metricsData: any, clientId?: string) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "AM" && session.user.role !== "ADMIN")) {
        throw new Error("Unauthorized");
    }

    // Fetch client name if clientId provided
    let clientName = "Client";
    if (clientId) {
        const client = await (prisma as any).client.findUnique({ where: { id: clientId }, select: { name: true, industry: true } });
        if (client) clientName = client.name;
    }

    // Extract platform data from campaigns structure
    const campaigns: any[] = metricsData?.campaigns || [];
    const lines: string[] = [];

    campaigns.forEach((campaign: any, idx: number) => {
        const platforms = campaign.platforms || {};
        const label = campaigns.length > 1 ? `Campaign: ${campaign.name || `#${idx + 1}`}` : "";
        if (label) lines.push(label);

        const fb = platforms.facebook;
        const ig = platforms.instagram;
        const snap = platforms.snapchat;
        const tiktok = platforms.tiktok;
        const yt = platforms.youtube;
        const gads = platforms.googleAds;
        const x = platforms.x || platforms.twitter;
        const linkedin = platforms.linkedin;

        if (fb) lines.push(`• Facebook — Impressions: ${fb.impressions || 0}, Reach: ${fb.reach || 0}, Engagement: ${fb.engagement || 0}, Clicks: ${fb.clicks || 0}, Followers: ${fb.followers || 0}`);
        if (ig) lines.push(`• Instagram — Views: ${ig.views || 0}, Reach: ${ig.reach || 0}, Engagement: ${ig.engagement || 0}, Clicks: ${ig.clicks || 0}, Followers: ${ig.followers || 0}`);
        if (snap) lines.push(`• Snapchat Ads — Impressions: ${snap.impressions || 0}, Swipes: ${snap.swipes || 0}, Spend: $${snap.spend || 0}, Reach: ${snap.reach || 0}`);
        if (tiktok) lines.push(`• TikTok — Impressions: ${tiktok.impressions || 0}, Clicks: ${tiktok.clicks || 0}, Views: ${tiktok.videoViews || tiktok.views || 0}, Spend: $${tiktok.spend || 0}`);
        if (yt) lines.push(`• YouTube — Views: ${yt.views || yt.recentViews || 0}, Subscribers: ${yt.subscribers || 0}, Watch Time: ${yt.watchTimeMinutes || 0} min`);
        if (gads) lines.push(`• Google Ads — Impressions: ${gads.impressions || gads.totalImpressions || 0}, Clicks: ${gads.clicks || gads.totalClicks || 0}, Spend: $${gads.spend || gads.totalCost || 0}, Conversions: ${gads.conversions || gads.totalConversions || 0}`);
        if (x) lines.push(`• X (Twitter) — Impressions: ${x.impressions || 0}, Engagement: ${x.engagement || 0}, Followers: ${x.followers || 0}`);
        if (linkedin) lines.push(`• LinkedIn — Impressions: ${linkedin.impressions || 0}, Clicks: ${linkedin.clicks || 0}, Followers: ${linkedin.followers || 0}`);
    });

    const seo = metricsData?.seo;
    if (seo && (seo.score > 0 || seo.clicks > 0)) {
        lines.push(`• SEO — Score: ${seo.score}/100, Clicks: ${seo.clicks || 0}, Impressions: ${seo.impressions || 0}, Speed: ${seo.speed || 0}`);
    }

    const emailData = metricsData?.emailMarketing;
    if (emailData?.campaigns?.length > 0) {
        emailData.campaigns.forEach((ec: any) => {
            if (ec.emailsSent > 0) lines.push(`• Email Marketing — Sent: ${ec.emailsSent}, Open Rate: ${ec.openRate}%, Click Rate: ${ec.clickRate}%`);
        });
    }

    const performanceData = lines.length > 0 ? lines.join("\n") : "No platform data available yet.";

    const prompt = `You are a senior digital marketing analyst writing a professional monthly performance summary for an agency client report.

Client: ${clientName}
Performance Data:
${performanceData}

Write a concise, professional bilingual summary (3-4 sentences each) based on the actual numbers above.
Highlight real achievements, trends, and strategic recommendations.
Respond ONLY with valid JSON — no markdown, no explanation:
{
  "ar": "ملخص احترافي بالعربية (3-4 جمل موجزة واضحة)",
  "en": "Professional summary in English (3-4 concise sentences)"
}`;

    const result = await geminiFlash.generateContent(prompt);
    let text = result.response.text().trim();
    text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(text);

    return {
        summaryAr: parsed.ar,
        summaryEn: parsed.en
    };
}

export async function getPendingReportsForMM() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "MARKETING_MANAGER") {
        throw new Error("Unauthorized");
    }

    return (prisma as any).report.findMany({
        where: {
            mmStatus: "PENDING",
            client: { mmId: session.user.id },
        },
        include: {
            client: true,
        },
        orderBy: { updatedAt: "desc" },
    });
}
