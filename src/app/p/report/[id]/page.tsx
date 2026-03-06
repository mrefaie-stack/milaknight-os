import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ReportClientView } from "@/components/reporting/report-client-view";

import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageToggle } from "@/components/ui/language-toggle";

export default async function PublicReportPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const report = await prisma.report.findUnique({
        where: { id },
        include: { client: true }
    });

    if (!report) return notFound();

    const metrics: any = typeof report.metrics === 'string' ? JSON.parse(report.metrics) : report.metrics;

    return (
        <div className="min-h-screen bg-background">
            <div className="bg-background border-b border-border py-2 px-6 flex items-center justify-between sticky top-0 z-50">
                <div className="text-center font-bold tracking-widest uppercase text-xs text-muted-foreground flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Live Public Report
                </div>
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <LanguageToggle />
                </div>
            </div>
            <div className="p-4 md:p-8">
                <ReportClientView report={report} metrics={metrics} role="PUBLIC" />
            </div>
        </div>
    );
}
