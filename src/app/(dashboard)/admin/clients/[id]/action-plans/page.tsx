import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FolderKanban } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function ClientActionPlansPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const client = await prisma.client.findUnique({
        where: { id },
        include: {
            actionPlans: {
                orderBy: { createdAt: "desc" },
                include: { client: true, items: true }
            }
        }
    });

    if (!client) return notFound();

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 text-primary rounded-xl">
                    <FolderKanban className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-3xl font-black tracking-tighter">{client.name} - Action Plans</h1>
                    <p className="text-muted-foreground font-medium text-sm">All content deliverables for this portfolio</p>
                </div>
            </div>

            <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>Action Plans Log</CardTitle>
                    <CardDescription>Review and manage generated action plans.</CardDescription>
                </CardHeader>
                <div className="px-6 pb-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {(client as any).actionPlans.map((plan: any) => (
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
                        {(client as any).actionPlans.length === 0 && (
                            <div className="col-span-full py-12 text-center border border-dashed rounded-xl">
                                <p className="text-muted-foreground">No action plans created yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
}
