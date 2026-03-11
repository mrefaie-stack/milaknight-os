import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { ReportComparisonView } from "@/components/reporting/report-comparison-view";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function CompareReportsPage({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
    const { ids } = await searchParams;
    const session = await getServerSession(authOptions);

    if (!ids) {
        redirect("/client/reports");
    }

    const reportIds = ids.split(",");

    if (!session) redirect("/login");
    const client = await prisma.client.findUnique({ where: { userId: session.user.id } });
    if (!client) return notFound();

    const reports = await prisma.report.findMany({
        where: { 
            id: { in: reportIds },
            clientId: client.id
        },
        include: { client: true }
    });

    if (reports.length < 2) {
        return <div className="p-8 text-center text-red-500 font-bold">Please select at least 2 reports to compare.</div>;
    }

    return <ReportComparisonView reports={reports} role={session?.user?.role || "CLIENT"} />;
}
