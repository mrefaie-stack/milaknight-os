import { getClients } from "@/app/actions/client";
import { AdminDashboardView } from "@/components/dashboard/admin-dashboard-view";

export default async function AdminDashboardPage() {
    const clients = await getClients();

    return (
        <AdminDashboardView clients={clients} />
    );
}
