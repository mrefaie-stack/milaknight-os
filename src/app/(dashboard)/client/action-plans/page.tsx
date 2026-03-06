import { getActionPlans } from "@/app/actions/action-plan";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default async function ClientActionPlansPage() {
    const plans = await getActionPlans(); // Action handles client filtering based on session role

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Action Plans</h1>
                <p className="text-muted-foreground">Review and approve your monthly content deliverables.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {plans.map((plan) => {
                    const pendingCount = plan.items.filter((i: any) => i.status === "PENDING").length;

                    return (
                        <div key={plan.id} className="p-6 border rounded-xl bg-card hover:border-primary/50 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-semibold text-lg">{plan.month} Plan</h3>
                                    {pendingCount > 0 ? (
                                        <Badge variant="destructive" className="mt-2 text-xs">{pendingCount} Action Required</Badge>
                                    ) : (
                                        <Badge variant="secondary" className="mt-2 text-xs">All Reviewed</Badge>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6">
                                <Link href={`/client/action-plans/${plan.id}`}>
                                    <Button variant="outline" className="w-full">Open Plan</Button>
                                </Link>
                            </div>
                        </div>
                    )
                })}
                {plans.length === 0 && (
                    <div className="col-span-full py-12 text-center border border-dashed rounded-xl">
                        <p className="text-muted-foreground">No action plans available for review yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
