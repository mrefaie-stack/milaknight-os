import { getClients } from "@/app/actions/client";
import { ReportCreatorClient } from "@/components/reporting/report-creator";

export default async function CreateReportPage() {
    const clients = await getClients();

    return (
        <div className="container py-6">
            <ReportCreatorClient clients={clients} />
        </div>
    );
}
