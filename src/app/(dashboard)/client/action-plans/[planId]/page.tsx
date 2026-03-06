import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PlanApprovalHeader } from "@/components/action-plan/plan-approval-header";
import { ClientApprovalActions } from "@/components/action-plan/client-approval-actions";
import { Badge } from "@/components/ui/badge";
import { Image as ImageIcon, Video, AlignLeft, HelpCircle, MessageCircle, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function ClientActionPlanPage({ params }: { params: Promise<{ planId: string }> }) {
    const { planId } = await params;
    const plan = await prisma.actionPlan.findUnique({
        where: { id: planId },
        include: {
            items: {
                where: { status: { not: "DRAFT" } }, // Clients shouldn't see DRAFTS
                orderBy: { createdAt: "desc" },
            },
        }
    });

    if (!plan) return notFound();

    const getIcon = (type: string) => {
        switch (type) {
            case "POST": return <ImageIcon className="h-4 w-4" />;
            case "VIDEO": return <Video className="h-4 w-4" />;
            case "ARTICLE": return <AlignLeft className="h-4 w-4" />;
            case "POLL": return <HelpCircle className="h-4 w-4" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Action Plan Review</h1>
                    <p className="text-muted-foreground font-medium">Month: {plan.month}</p>
                </div>
                <div className="print:hidden">
                    <Button onClick={() => window.print()} variant="secondary" className="font-bold rounded-full border border-primary/20">
                        <Printer className="mr-2 h-4 w-4" /> Export PDF
                    </Button>
                </div>
            </div>

            <PlanApprovalHeader planId={plan.id} status={plan.status} canApprove={true} />

            <div className="grid gap-6">
                {(plan as any).items.map((item: any) => (
                    <div key={item.id} className="p-6 border rounded-xl bg-card flex flex-col gap-4">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-md text-primary hidden md:block">
                                    {getIcon(item.type)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <Badge variant="outline">{item.type}</Badge>
                                        <Badge variant={item.status === 'APPROVED' ? 'default' : item.status === 'NEEDS_EDIT' ? 'destructive' : 'secondary'}>
                                            {item.status}
                                        </Badge>
                                        <span className="text-sm font-medium">{item.platform}</span>
                                        {item.clientComment && item.feedbackResolved && (
                                            <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">Resolved</Badge>
                                        )}
                                    </div>

                                    {/* Content Preview */}
                                    <div className="mt-4 space-y-4 text-sm text-foreground/90">
                                        {item.imageUrl && (
                                            <div className="mt-3 rounded-lg overflow-hidden border border-primary/10 max-w-xs shadow-sm">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={item.imageUrl} alt="Post visual" className="w-full h-auto object-cover max-h-48 hover:scale-105 transition-transform duration-500" />
                                            </div>
                                        )}
                                        {item.videoUrl && (
                                            <div className="mt-3 rounded-lg overflow-hidden border border-primary/10 max-w-xs shadow-sm bg-black">
                                                <video src={item.videoUrl} controls className="w-full h-auto max-h-48 object-contain" />
                                            </div>
                                        )}
                                        {item.captionAr && <div><strong className="block text-muted-foreground mb-1">Arabic Caption:</strong> {item.captionAr}</div>}
                                        {item.captionEn && <div><strong className="block text-muted-foreground mb-1">English Caption:</strong> {item.captionEn}</div>}
                                        {item.articleTitle && <div><strong className="block text-muted-foreground mb-1">Article Title:</strong> {item.articleTitle}</div>}
                                        {item.articleContent && <div><strong className="block text-muted-foreground mb-1">Content/Link:</strong> {item.articleContent}</div>}
                                        {item.pollQuestion && (
                                            <div className="p-4 bg-muted/50 rounded-md">
                                                <strong>{item.pollQuestion}</strong>
                                                <ul className="mt-2 list-disc list-inside text-muted-foreground">
                                                    <li>{item.pollOptionA}</li>
                                                    <li>{item.pollOptionB}</li>
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                    {item.clientComment && (
                                        <div className={`mt-4 p-3 rounded-lg text-xs border ${item.feedbackResolved ? 'bg-muted/30 border-muted text-muted-foreground' : 'bg-orange-50 border-orange-100 text-orange-900 font-medium'}`}>
                                            <span className="font-bold flex items-center gap-1 mb-1">
                                                <MessageCircle className="h-3 w-3" />
                                                Your Feedback:
                                            </span>
                                            {item.clientComment}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <ClientApprovalActions item={item} />
                        </div>
                    </div>
                ))}

                {(plan as any).items.length === 0 && (
                    <div className="py-12 border border-dashed rounded-lg text-center bg-card/50">
                        <p className="text-muted-foreground">No items are pending your review.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
