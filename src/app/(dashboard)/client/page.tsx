import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ClientDashboardView } from "@/components/dashboard/client-dashboard-view";

export default async function ClientDashboardPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const client = await prisma.client.findFirst({
        where: { userId: session.user.id },
        include: {
            actionPlans: {
                orderBy: { month: "desc" },
                take: 1,
            },
            reports: {
                where: { status: "SENT" },
                orderBy: { month: "desc" },
            },
        }
    });

    if (!client) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <p className="text-muted-foreground italic font-medium">No client profile linked to this account.</p>
            </div>
        );
    }

    const allReports: any[] = (client as any).reports;
    const latestReport = allReports[0];
    const latestPlan = (client as any).actionPlans[0];

    return (
        <ClientDashboardView
            client={client}
            latestPlan={latestPlan}
            allReports={allReports}
        />
    );
}
