import { getActionPlans } from "@/app/actions/action-plan";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default async function ActionPlansPage() {
    const plans = await getActionPlans();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Action Plans</h1>
                    <p className="text-muted-foreground">Manage monthly content deliverables for clients.</p>
                </div>
                <Link href="/am/action-plans/create">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Create Plan
                    </Button>
                </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {(plans as any).map((plan: any) => (
                    <div key={plan.id} className="p-6 border rounded-xl bg-card hover:border-primary/50 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-semibold">{plan.client.name}</h3>
                                <p className="text-sm text-muted-foreground">{plan.month}</p>
                            </div>
                            <div className="flex flex-col gap-1">
                                <Badge variant={plan.status === 'REVISION_REQUESTED' ? 'destructive' : 'outline'}>{plan.items.length} Items</Badge>
                                {plan.status === 'REVISION_REQUESTED' && (
                                    <Badge className="bg-orange-500 text-white border-none">REVISION</Badge>
                                )}
                            </div>
                        </div>

                        {(plan as any).clientComment && (
                            <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg mb-4">
                                <p className="text-[11px] font-black uppercase text-orange-600 mb-1">Client Feedback</p>
                                <p className="text-xs text-orange-800 line-clamp-2 italic">"{(plan as any).clientComment}"</p>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-2 mt-4 text-[10px] font-black uppercase text-muted-foreground">
                            <span className="text-emerald-500">{plan.items.filter((i: any) => i.status === 'APPROVED').length} Approved</span>
                            <span>&bull;</span>
                            <span className="text-orange-500">{plan.items.filter((i: any) => i.status === 'PENDING').length} Pending</span>
                            <span>&bull;</span>
                            <span className="text-blue-500">{plan.status}</span>
                        </div>

                        <div className="mt-6">
                            <Link href={`/am/action-plans/${plan.id}`}>
                                <Button variant="outline" className="w-full">View Builder</Button>
                            </Link>
                        </div>
                    </div>
                ))}
                {plans.length === 0 && (
                    <div className="col-span-full py-12 text-center border border-dashed rounded-xl">
                        <p className="text-muted-foreground">No action plans created yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
