import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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

    // Permission Check
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");
    const client = await prisma.client.findUnique({ where: { userId: session.user.id } });
    if (!client || plan.clientId !== client.id) return notFound();
    if (plan.status === "DRAFT") return notFound();

    return (
        <ClientActionPlanView plan={plan as any} items={(plan as any).items} />
    );
}
