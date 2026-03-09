import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { ModeratorActionPlanDetailView } from "@/components/action-plan/moderator-action-plan-detail-view";

export default async function ModeratorActionPlanDetailPage({ params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "MODERATOR") redirect("/login");

    const plan = await prisma.actionPlan.findUnique({
        where: { id: params.id },
        include: {
            client: true,
            items: {
                where: { status: "APPROVED" },
                orderBy: { scheduledDate: "asc" }
            }
        }
    });

    if (!plan || plan.status !== "APPROVED") notFound();

    return <ModeratorActionPlanDetailView plan={plan} items={(plan as any).items} />;
}
