import { getReports } from "@/app/actions/report";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { ReportListClient } from "@/components/reporting/report-list-client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function ReportsPage() {
    const reports = await getReports();

    const session = await getServerSession(authOptions);
    const role = session?.user?.role as any || "AM";

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Performance Reports</h1>
                    <p className="text-muted-foreground">Create and manage client monthly reports.</p>
                </div>
                {(role === "AM" || role === "ADMIN") && (
                    <Link href="/am/reports/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> New Report
                        </Button>
                    </Link>
                )}
            </div>

            <ReportListClient initialReports={reports as any} role={role} />
        </div>
    );
}
