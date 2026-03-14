import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { ModeratorActionPlanDetailView } from "@/components/action-plan/moderator-action-plan-detail-view";

export default async function ContentLeaderPlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "CONTENT_LEADER") redirect("/login");

    const plan = await prisma.actionPlan.findUnique({
        where: { id },
        include: { client: true, items: { where: { status: "APPROVED" }, orderBy: { scheduledDate: "asc" } } },
    });
    if (!plan || (plan.status !== "APPROVED" && plan.status !== "SCHEDULED")) notFound();
    return <ModeratorActionPlanDetailView plan={plan} items={(plan as any).items} />;
}
