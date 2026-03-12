import { getClients, getAccountManagers, getMarketingManagers } from "@/app/actions/client";
import { getGlobalServices } from "@/app/actions/global-service";
import { ClientList } from "@/components/clients/client-list";
import { AddClientButton } from "@/components/clients/add-client-button";
import { AdminClientsHeader } from "@/components/admin/admin-clients-ui";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminClientsPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");
    const role = session.user.role;

    const clients = await getClients();
    const ams = await getAccountManagers();
    const mms = await getMarketingManagers();

    const pendingCount = clients.filter((c: any) =>
        c.actionPlans?.some((p: any) => p.status === "PENDING")
    ).length;

    const services = await getGlobalServices();

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <AdminClientsHeader clientCount={clients.length} pendingCount={pendingCount} />
                {role === "ADMIN" && <AddClientButton ams={ams} mms={mms} services={services} />}
            </div>

            <ClientList 
                clients={clients} 
                accountManagers={ams} 
                marketingManagers={mms} 
                services={services} 
                canEdit={role === "ADMIN"}
            />
        </div>
    );
}
