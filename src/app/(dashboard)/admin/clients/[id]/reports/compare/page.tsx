import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { ReportComparisonView } from "@/components/reporting/report-comparison-view";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function AdminCompareReportsPage({
    params,
    searchParams
}: {
    params: Promise<{ id: string }>,
    searchParams: Promise<{ ids?: string }>
}) {
    const { id: clientId } = await params;
    const { ids } = await searchParams;
    const session = await getServerSession(authOptions);

    if (!ids) {
        redirect(`/admin/clients/${clientId}/reports`);
    }

    const reportIds = ids.split(",");

    const reports = await prisma.report.findMany({
        where: { id: { in: reportIds }, clientId },
        include: { client: true }
    });

    if (reports.length < 2) {
        return <div className="p-8 text-center text-red-500 font-bold">Please select at least 2 reports to compare.</div>;
    }

    return <ReportComparisonView reports={reports} role={"ADMIN"} />;
}
