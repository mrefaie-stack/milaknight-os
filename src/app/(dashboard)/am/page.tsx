import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ClientAMDashboard } from "@/components/dashboard/am-dashboard-view";

export default async function AMDashboardPage() {
    const session = await getServerSession(authOptions);
    const amId = session?.user?.id;

    const clients = await prisma.client.findMany({
        where: { amId },
        include: {
            actionPlans: { orderBy: { createdAt: 'desc' }, take: 1 },
            reports: { orderBy: { createdAt: 'desc' }, take: 1 },
        }
    });

    return (
        <ClientAMDashboard
            clients={clients}
            userName={session?.user?.name || ""}
        />
    );
}
