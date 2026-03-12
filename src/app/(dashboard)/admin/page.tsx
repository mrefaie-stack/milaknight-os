import { getClients } from "@/app/actions/client";
import { AdminDashboardView } from "@/components/dashboard/admin-dashboard-view";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminDashboardPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");
    const role = session.user.role;
    const clients = await getClients();

    return (
        <AdminDashboardView clients={clients} role={role} />
    );
}
