import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { ReportComparisonView } from "@/components/reporting/report-comparison-view";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function CompareReportsPage({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
    const { ids } = await searchParams;
    const session = await getServerSession(authOptions);

    if (!ids) {
        redirect("/client/reports"); // Default fallback
    }

    const reportIds = ids.split(",");

    const where: any = { id: { in: reportIds } };
    if (session?.user?.role === "AM") {
        where.client = { amId: session.user.id };
    } else if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MODERATOR") {
        return notFound();
    }

    const reports = await prisma.report.findMany({
        where,
        include: { client: true }
    });

    if (reports.length < 2) {
        return <div className="p-8 text-center text-red-500 font-bold">Please select at least 2 reports to compare.</div>;
    }

    return <ReportComparisonView reports={reports} role={session?.user?.role || "CLIENT"} />;
}
