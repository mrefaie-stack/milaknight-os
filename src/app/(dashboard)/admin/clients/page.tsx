import { getClients, getAccountManagers } from "@/app/actions/client";
import { getGlobalServices } from "@/app/actions/global-service";
import { ClientList } from "@/components/clients/client-list";
import { AddClientButton } from "@/components/clients/add-client-button";
import { AdminClientsHeader } from "@/components/admin/admin-clients-ui";

export default async function AdminClientsPage() {
    const clients = await getClients();
    const ams = await getAccountManagers();

    const pendingCount = clients.filter((c: any) =>
        c.actionPlans?.some((p: any) => p.status === "PENDING")
    ).length;

    const services = await getGlobalServices();

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <AdminClientsHeader clientCount={clients.length} pendingCount={pendingCount} />
                <AddClientButton ams={ams} services={services} />
            </div>

            <ClientList clients={clients} accountManagers={ams} services={services} />
        </div>
    );
}
