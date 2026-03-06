import { getReportById } from "@/app/actions/report";
import { notFound } from "next/navigation";
import { ReportCreatorClient } from "@/components/reporting/report-creator";

export default async function EditReportPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const report = await getReportById(id);
    if (!report) return notFound();

    // In edit mode, we only need the current client
    const clients = [report.client];

    return (
        <div className="space-y-8">
            <ReportCreatorClient clients={clients} initialData={report} />
        </div>
    );
}
