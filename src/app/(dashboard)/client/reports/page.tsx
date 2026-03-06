import { getReports } from "@/app/actions/report";
import { ReportListClient } from "@/components/reporting/report-list-client";

export default async function ClientReportsPage() {
    const reports = await getReports();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Performance</h1>
                <p className="text-muted-foreground">Review your monthly performance stats and ROI.</p>
            </div>

            <ReportListClient initialReports={reports as any} role="CLIENT" />
        </div>
    );
}
