import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddItemDialog } from "@/components/action-plan/add-item-dialog";
import { PlanItemsList } from "@/components/action-plans/plan-items-list";
import { submitForApproval, requestActionPlanDeletion, notifyClientOfActionPlanUpdate } from "@/app/actions/action-plan";
import { Trash2, LayoutDashboard, ChevronRight } from "lucide-react";
import Link from "next/link";

export default async function ActionPlanBuilderPage({ params }: { params: Promise<{ planId: string }> }) {
    const { planId } = await params;
    const plan = await prisma.actionPlan.findUnique({
        where: { id: planId },
        include: {
            client: true,
            items: { orderBy: { createdAt: "desc" } },
        }
    });

    if (!plan) return notFound();

    const hasDrafts = (plan as any).items.some((i: any) => i.status === "DRAFT");

    async function submitAction() {
        "use server";
        await submitForApproval(plan!.id);
        redirect(`/am/action-plans/${plan!.id}`);
    }

    async function deleteRequestAction() {
        "use server";
        await requestActionPlanDeletion(plan!.id);
        redirect(`/am/action-plans/${plan!.id}`);
    }

    const pendingDeletion = await prisma.deletionRequest.findFirst({
        where: { entityType: "ActionPlan", entityId: planId, status: "PENDING" }
    });

    return (
        <div className="space-y-8">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Link href="/am/action-plans" className="hover:text-primary transition-colors">Action Plans</Link>
                <ChevronRight className="h-4 w-4" />
                <span className="text-foreground">{(plan as any).client.name}</span>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-8">
                <div>
                    <h1 className="text-4xl font-black tracking-tight">{(plan as any).client.name}</h1>
                    <p className="text-muted-foreground text-lg font-medium">Monthly Action Plan • {plan.month}</p>
                </div>
                <div className="flex gap-3">
                    <AddItemDialog planId={plan.id} />

                    {plan.status === "REVISION_REQUESTED" && (
                        <form action={async () => {
                            "use server";
                            await notifyClientOfActionPlanUpdate(planId);
                            redirect(`/am/action-plans/${planId}`);
                        }}>
                            <Button type="submit" variant="default" className="bg-emerald-600 hover:bg-emerald-700 font-bold shadow-lg shadow-emerald-200 h-11 px-6 rounded-full">
                                Notify Client of Fixes
                            </Button>
                        </form>
                    )}

                    {(plan.status === "DRAFT" || hasDrafts) && !pendingDeletion && plan.status !== "REVISION_REQUESTED" && (
                        <form action={submitAction}>
                            <Button type="submit" variant="default" className="font-bold shadow-lg shadow-primary/20 h-11 px-6 rounded-full">
                                Send to Client for Approval
                            </Button>
                        </form>
                    )}

                    {!pendingDeletion ? (
                        <form action={deleteRequestAction}>
                            <Button type="submit" variant="ghost" className="text-destructive hover:bg-destructive/10 font-bold rounded-full h-11 px-6">
                                <Trash2 className="mr-2 h-4 w-4" /> Request Deletion
                            </Button>
                        </form>
                    ) : (
                        <div className="bg-orange-500/10 text-orange-500 text-xs font-black px-4 py-3 rounded-full border border-orange-500/20 flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                            </span>
                            DELETION PENDING
                        </div>
                    )}
                </div>
            </div>

            <PlanItemsList items={(plan as any).items} planId={plan.id} />

            {(plan as any).items.length === 0 && (
                <div className="py-24 border-2 border-dashed rounded-2xl text-center bg-card/30 backdrop-blur-sm">
                    <div className="max-w-xs mx-auto space-y-4">
                        <div className="p-4 bg-muted rounded-full w-fit mx-auto">
                            <LayoutDashboard className="h-8 w-8 text-muted-foreground opacity-20" />
                        </div>
                        <h3 className="text-xl font-bold opacity-50">Plan is Empty</h3>
                        <p className="text-muted-foreground">Start by adding social media posts, videos, or polls for this client.</p>
                        <AddItemDialog planId={plan.id} />
                    </div>
                </div>
            )}
        </div>
    );
}
