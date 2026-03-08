import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PlanApprovalHeader } from "@/components/action-plan/plan-approval-header";
import { ClientActionPlanView } from "@/components/action-plan/client-action-plan-view";

export default async function ClientActionPlanPage({ params }: { params: Promise<{ planId: string }> }) {
    const { planId } = await params;
    const plan = await prisma.actionPlan.findUnique({
        where: { id: planId },
        include: {
            items: {
                where: { status: { not: "DRAFT" } },
                include: {
                    comments: {
                        include: { user: true },
                        orderBy: { createdAt: "asc" }
                    }
                },
                orderBy: { createdAt: "asc" },
            },
        }
    });

    if (!plan) return notFound();

    return (
        <ClientActionPlanView plan={plan as any} items={(plan as any).items} />
    );
}
