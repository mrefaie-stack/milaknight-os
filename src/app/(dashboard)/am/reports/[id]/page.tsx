import { getReportById } from "@/app/actions/report";
import { notFound } from "next/navigation";
import { ReportClientView } from "@/components/reporting/report-client-view";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function ReportViewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const report = await getReportById(id);
    if (!report) return notFound();

    const metrics: any = typeof report.metrics === 'string' ? JSON.parse(report.metrics) : report.metrics;

    return <ReportClientView report={report} metrics={metrics} role={session?.user?.role || "CLIENT"} />;
}
