import { prisma } from "@/lib/prisma";
import { getActionPlans, createActionPlan, addContentItem, submitForApproval, approveActionPlan, approveContentItem, scheduleActionPlan } from "@/app/actions/action-plan";
import { getReports, getReportById, publishReport } from "@/app/actions/report";
import { getClients } from "@/app/actions/client";
import { getNotifications, sendReminder } from "@/app/actions/notification";
import { getTeamMembers } from "@/app/actions/user";
import { getRecentActivities } from "@/app/actions/activity";
import { getMeetingRequests, requestMeeting } from "@/app/actions/meeting";

// Execute a tool call and return the result as a string
export async function executeTool(
  toolName: string,
  input: Record<string, unknown>,
  userRole: string,
  userId: string
): Promise<string> {
  try {
    switch (toolName) {
      // ==================== READ TOOLS ====================
      case "get_clients": {
        const clients = await getClients();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const summary = (clients as any[]).map((c: any) => ({
          id: c.id,
          name: c.name,
          industry: c.industry,
          accountManager: c.accountManager
            ? `${c.accountManager.firstName} ${c.accountManager.lastName}`
            : null,
          package: c.package,
          activeServices: c.activeServices,
          planCount: c.actionPlans?.length || 0,
          reportCount: c.reports?.length || 0,
        }));
        return JSON.stringify(summary);
      }

      case "get_action_plans": {
        const plans = await getActionPlans(input.clientId as string | undefined);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const summary = (plans as any[]).map((p: any) => ({
          id: p.id,
          month: p.month,
          status: p.status,
          clientName: p.client?.name,
          itemCount: p.items?.length || 0,
          items: p.items?.map((i: any) => ({
            type: i.type,
            status: i.status,
            platform: i.platform,
          })),
        }));
        return JSON.stringify(summary);
      }

      case "get_reports": {
        const reports = await getReports();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const summary = (reports as any[]).map((r: any) => ({
          id: r.id,
          month: r.month,
          status: r.status,
          clientName: r.client?.name,
          createdAt: r.createdAt,
        }));
        return JSON.stringify(summary);
      }

      case "get_report_by_id": {
        const report = await getReportById(input.reportId as string);
        if (!report) return JSON.stringify({ error: "Report not found" });
        const metrics =
          typeof report.metrics === "string"
            ? JSON.parse(report.metrics)
            : report.metrics;
        return JSON.stringify({
          id: report.id,
          month: report.month,
          status: report.status,
          clientName: report.client?.name,
          metrics,
        });
      }

      case "get_notifications": {
        const notifications = await getNotifications();
        return JSON.stringify(notifications);
      }

      case "get_team_members": {
        const members = await getTeamMembers();
        return JSON.stringify(members);
      }

      case "get_recent_activities": {
        const activities = await getRecentActivities();
        return JSON.stringify(activities);
      }

      case "get_meeting_requests": {
        const meetings = await getMeetingRequests();
        return JSON.stringify(meetings);
      }

      case "query_analytics": {
        return await queryAnalytics(
          input.clientId as string,
          input.month as string | undefined,
          input.compareWithPrevious as boolean | undefined,
          userRole,
          userId
        );
      }

      // ==================== WRITE TOOLS ====================
      case "create_action_plan": {
        const plan = await createActionPlan(
          input.clientId as string,
          input.month as string
        );
        return JSON.stringify({
          success: true,
          planId: plan.id,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          message: `Action plan created for ${(plan as any).client?.name} (${plan.month})`,
        });
      }

      case "add_content_item": {
        const item = await addContentItem(input.planId as string, {
          type: input.type,
          platform: input.platform,
          captionAr: input.captionAr,
          captionEn: input.captionEn,
          scheduledDate: input.scheduledDate,
        });
        return JSON.stringify({
          success: true,
          itemId: item.id,
          message: `Content item (${item.type}) added successfully`,
        });
      }

      case "submit_plan_for_approval": {
        await submitForApproval(input.planId as string);
        return JSON.stringify({
          success: true,
          message: "Plan submitted for client approval",
        });
      }

      case "approve_action_plan": {
        await approveActionPlan(input.planId as string);
        return JSON.stringify({
          success: true,
          message: "Action plan approved successfully",
        });
      }

      case "approve_content_item": {
        await approveContentItem(
          input.itemId as string,
          input.planId as string
        );
        return JSON.stringify({
          success: true,
          message: "Content item approved",
        });
      }

      case "schedule_action_plan": {
        await scheduleActionPlan(input.planId as string);
        return JSON.stringify({
          success: true,
          message: "Action plan marked as scheduled",
        });
      }

      case "publish_report": {
        await publishReport(input.reportId as string);
        return JSON.stringify({
          success: true,
          message: "Report published and sent to client",
        });
      }

      case "send_notification": {
        await sendReminder(
          input.targetUserId as string,
          input.title as string,
          input.message as string
        );
        return JSON.stringify({
          success: true,
          message: "Notification sent successfully",
        });
      }

      case "request_meeting": {
        const meeting = await requestMeeting({
          reason: input.reason as string,
          teams: input.teams as string[],
        });
        return JSON.stringify({
          success: true,
          meetingId: meeting.id,
          message: "Meeting requested successfully",
        });
      }

      default:
        return JSON.stringify({ error: `Unknown tool: ${toolName}` });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return JSON.stringify({ error: message });
  }
}

// Custom analytics query for Q&A
async function queryAnalytics(
  clientId: string,
  month?: string,
  compareWithPrevious?: boolean,
  userRole?: string,
  userId?: string
): Promise<string> {
  // Verify access
  if (userRole === "CLIENT") {
    const client = await prisma.client.findUnique({
      where: { userId: userId },
    });
    if (!client || client.id !== clientId) {
      return JSON.stringify({ error: "Unauthorized: not your client" });
    }
  } else if (userRole === "AM") {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });
    if (!client || client.amId !== userId) {
      return JSON.stringify({ error: "Unauthorized: not your assigned client" });
    }
  }

  // Get client info
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { name: true, seoScore: true, activeServices: true, package: true },
  });

  if (!client) return JSON.stringify({ error: "Client not found" });

  // Get reports
  const reports = await prisma.report.findMany({
    where: { clientId, status: "SENT" },
    orderBy: { month: "desc" },
    take: compareWithPrevious ? 2 : 1,
  });

  if (month) {
    const specificReport = await prisma.report.findFirst({
      where: { clientId, month, status: "SENT" },
    });
    if (specificReport) {
      const metrics =
        typeof specificReport.metrics === "string"
          ? JSON.parse(specificReport.metrics)
          : specificReport.metrics;

      let previousMetrics = null;
      if (compareWithPrevious) {
        const prevReport = await prisma.report.findFirst({
          where: {
            clientId,
            month: { lt: month },
            status: "SENT",
          },
          orderBy: { month: "desc" },
        });
        if (prevReport) {
          previousMetrics =
            typeof prevReport.metrics === "string"
              ? JSON.parse(prevReport.metrics)
              : prevReport.metrics;
        }
      }

      return JSON.stringify({
        client: client.name,
        month,
        metrics,
        previousMetrics,
        seoScore: client.seoScore,
      });
    }
  }

  // Return latest report(s)
  const results = reports.map((r) => ({
    month: r.month,
    metrics:
      typeof r.metrics === "string" ? JSON.parse(r.metrics) : r.metrics,
  }));

  return JSON.stringify({
    client: client.name,
    seoScore: client.seoScore,
    package: client.package,
    reports: results,
  });
}
