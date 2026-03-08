import { getClients, getAccountManagers } from "@/app/actions/client";
import { ClientList } from "@/components/clients/client-list";
import { AddClientButton } from "@/components/clients/add-client-button";
import { Users2 } from "lucide-react";

export default async function AdminClientsPage() {
    const clients = await getClients();
    const ams = await getAccountManagers();

    const pendingCount = clients.filter((c: any) =>
        c.actionPlans?.some((p: any) => p.status === "PENDING")
    ).length;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-primary/40 mb-1">Client Portfolio</p>
                    <h1 className="text-5xl font-black tracking-tighter premium-gradient-text uppercase">Clients</h1>
                    <p className="text-muted-foreground font-medium mt-1">
                        {clients.length} active clients · {pendingCount} pending approvals
                    </p>
                </div>
                <AddClientButton ams={ams} />
            </div>

            <ClientList clients={clients} accountManagers={ams} />
        </div>
    );
}
