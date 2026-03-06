import { getClients, getAccountManagers } from "@/app/actions/client";
import { ClientList } from "@/components/clients/client-list";
import { AddClientButton } from "@/components/clients/add-client-button";

export default async function AdminClientsPage() {
    const clients = await getClients();
    const ams = await getAccountManagers();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
                    <p className="text-muted-foreground">Manage your agency clients and their services.</p>
                </div>
                <AddClientButton ams={ams} />
            </div>

            {/* 
        We pass data to a Client component to handle interactivity, 
        or we can just render it on the server if no interaction is needed. 
        For a polished OS, a data table is best. 
       */}
            <ClientList clients={clients} accountManagers={ams} />
        </div>
    );
}
