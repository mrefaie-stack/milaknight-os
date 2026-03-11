import { prisma } from "@/lib/prisma";
import { getReportById, getPreviousReport } from "@/app/actions/report";
import { notFound, redirect } from "next/navigation";
import { ReportClientView } from "@/components/reporting/report-client-view";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function ReportViewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const report = await prisma.report.findUnique({
        where: { id },
        include: { client: true }
    });
    if (!report) return notFound();

    // Permission Check
    if (session?.user?.role === "CLIENT") {
        const client = await prisma.client.findUnique({ where: { userId: session.user.id } });
        if (!client || report.clientId !== client.id) return notFound();
    } else if (session?.user?.role === "AM") {
        if (report.client.amId !== session.user.id) return notFound();
    } else if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MODERATOR") {
        return notFound();
    }

    const metrics: any = typeof report.metrics === 'string' ? JSON.parse(report.metrics) : report.metrics;
    const previousReport = await getPreviousReport(report.clientId, report.month);

    return <ReportClientView report={report} metrics={metrics} role={session?.user?.role || "CLIENT"} previousMetrics={previousReport?.metrics ?? null} />;
}
