import { getDeletionRequests, approveDeletionRequest, rejectDeletionRequest } from "@/app/actions/report";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Trash2, FileText, LayoutDashboard } from "lucide-react";
import { revalidatePath } from "next/cache";

export default async function DeletionsPage() {
    const requests = await getDeletionRequests();

    async function approve(id: string) {
        "use server";
        await approveDeletionRequest(id);
    }

    async function reject(id: string) {
        "use server";
        await rejectDeletionRequest(id);
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-4xl font-black tracking-tight">Deletion Requests</h1>
                <p className="text-muted-foreground font-medium text-lg">Review and approve deletion requests from Account Managers.</p>
            </div>

            <div className="grid gap-6">
                {(requests as any).map((request: any) => (
                    <Card key={request.id} className="border-none shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden border-l-4 border-l-orange-500">
                        <CardHeader className="flex flex-row items-center justify-between py-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-orange-500/10 rounded-2xl">
                                    {request.entityType === "Report" ? <FileText className="h-6 w-6 text-orange-600" /> : <LayoutDashboard className="h-6 w-6 text-orange-600" />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-xl font-black">Delete {request.entityType}</CardTitle>
                                        <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest bg-orange-500/5 text-orange-600 border-orange-200">Pending Approval</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground font-medium">
                                        Requested by <span className="text-foreground font-bold">{request.requestedBy.firstName} {request.requestedBy.lastName}</span> • {new Date(request.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <form action={approve.bind(null, request.id)}>
                                    <Button variant="default" size="sm" className="bg-emerald-600 hover:bg-emerald-700 font-bold px-4 rounded-full">
                                        <Check className="mr-2 h-4 w-4" /> Approve & Delete
                                    </Button>
                                </form>
                                <form action={reject.bind(null, request.id)}>
                                    <Button variant="outline" size="sm" className="font-bold px-4 rounded-full">
                                        <X className="mr-2 h-4 w-4" /> Reject Request
                                    </Button>
                                </form>
                            </div>
                        </CardHeader>
                        <CardContent className="bg-muted/30 py-4 px-6 border-t font-mono text-xs text-muted-foreground">
                            Entity ID: {request.entityId}
                        </CardContent>
                    </Card>
                ))}

                {requests.length === 0 && (
                    <div className="py-24 border-2 border-dashed rounded-3xl text-center bg-card/30 backdrop-blur-sm">
                        <div className="max-w-xs mx-auto space-y-4">
                            <div className="p-4 bg-muted rounded-full w-fit mx-auto">
                                <Trash2 className="h-8 w-8 text-muted-foreground opacity-20" />
                            </div>
                            <h3 className="text-xl font-bold opacity-50">No Pending Requests</h3>
                            <p className="text-muted-foreground">All is clear! There are no deletion requests awaiting your review.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
