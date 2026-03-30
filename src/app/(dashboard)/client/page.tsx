import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ClientDashboardView } from "@/components/dashboard/client-dashboard-view";
import { RatingPopup } from "@/components/client/rating-popup";

export default async function ClientDashboardPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const client = await prisma.client.findFirst({
        where: { userId: session.user.id },
        include: {
            actionPlans: {
                where: { status: { not: "DRAFT" } },
                orderBy: { month: "desc" },
                take: 1,
            },
            reports: {
                where: { status: "SENT" },
                orderBy: { month: "desc" },
            },
            services: { include: { globalService: true } },
        }
    });

    const globalServices = await prisma.globalService.findMany({
        orderBy: { nameEn: "asc" }
    });

    if (!client) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <p className="text-muted-foreground italic font-medium">No client profile linked to this account.</p>
            </div>
        );
    }

    const clientData = client as typeof client & { reports: typeof client extends { reports: infer R } ? R : never; actionPlans: typeof client extends { actionPlans: infer A } ? A : never };
    const allReports = clientData.reports;
    const latestPlan = clientData.actionPlans[0];

    return (
        <>
            <ClientDashboardView
                client={client}
                latestPlan={latestPlan}
                allReports={allReports}
                globalServices={globalServices}
            />
            <RatingPopup />
        </>
    );
}
