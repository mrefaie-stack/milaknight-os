import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ReportClientView } from "@/components/reporting/report-client-view";

export default async function PublicReportPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const report = await prisma.report.findUnique({
        where: { id },
        include: { client: true }
    });

    if (!report) return notFound();

    return (
        <div className="min-h-screen bg-background">
            {/* Adding a simple top bar to show this is a public view */}
            <div className="bg-primary/5 border-b border-primary/10 py-3 px-6 text-center font-bold tracking-widest uppercase text-xs text-muted-foreground flex items-center justify-center gap-2">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Live Public Report
            </div>
            <div className="p-4 md:p-8">
                <ReportClientView report={report} metrics={report.metrics as any} role="PUBLIC" />
            </div>
        </div>
    );
}
