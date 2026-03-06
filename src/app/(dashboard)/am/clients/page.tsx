import { getClients } from "@/app/actions/client";
import { ClientList } from "@/components/clients/client-list";

export default async function AMClientsPage() {
    const clients = await getClients();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Clients</h1>
                <p className="text-muted-foreground">List of clients assigned to you.</p>
            </div>

            <ClientList clients={clients} />
        </div>
    );
}
