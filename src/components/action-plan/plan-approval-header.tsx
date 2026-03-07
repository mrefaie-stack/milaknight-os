"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { approveActionPlan } from "@/app/actions/approval";
import { toast } from "sonner";
import {
    CheckCircle2,
    AlertCircle,
    Loader2
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

export function PlanApprovalHeader({ planId, status, canApprove = false }: { planId: string, status: string, canApprove?: boolean }) {
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);

    if (status === "APPROVED") {
        return (
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-3xl flex items-center justify-between mb-8 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-500 rounded-2xl text-white shadow-lg shadow-emerald-200">
                        <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="font-black text-xl text-emerald-900 tracking-tight">Plan Approved & Active</h3>
                        <p className="font-medium text-emerald-700/80 text-sm">This plan has been approved. The team is now executing these items.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (status === "DRAFT") return null;

    return (
        <div className="bg-primary/5 border border-primary/10 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 mb-8 group hover:bg-primary/10 transition-all duration-300">
            <div className="flex items-center gap-4 text-center md:text-left">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary group-hover:scale-110 transition-transform">
                    <AlertCircle className="h-6 w-6" />
                </div>
                <div>
                    <h3 className="font-black text-xl tracking-tight">Plan {status === 'REVISION_REQUESTED' ? 'Requires Attention' : 'Pending Review'}</h3>
                    <p className="text-muted-foreground font-medium">
                        {status === 'REVISION_REQUESTED'
                            ? "Client has requested changes. Please review the feedback below."
                            : "This plan is waiting for client approval before execution begins."}
                    </p>
                </div>
            </div>

            {canApprove && (
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <button className="relative inline-flex h-12 overflow-hidden rounded-full p-[2px] focus:outline-none group/btn shadow-xl shadow-primary/20">
                            <span data-html2canvas-ignore="true" className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#F97316_0%,#EA580C_50%,#F97316_100%)]" />
                            <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-8 py-1 text-sm font-black text-white backdrop-blur-3xl group-hover/btn:bg-slate-900 transition-colors uppercase tracking-widest">
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                                Approve Entire Plan
                            </span>
                        </button>
                    </DialogTrigger>
                    <DialogContent className="rounded-3xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black">Confirm Approval</DialogTitle>
                            <DialogDescription className="text-lg font-medium">
                                By approving this plan, you agree to all content items and schedules listed. This will notify your Account Manager to begin execution.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-2">
                            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-full font-bold">Cancel</Button>
                            <Button
                                disabled={isLoading}
                                onClick={async () => {
                                    setIsLoading(true);
                                    try {
                                        await approveActionPlan(planId);
                                        toast.success("Plan approved successfully! 🎉");
                                        setOpen(false);
                                    } catch (e) {
                                        toast.error("Failed to approve plan");
                                    } finally {
                                        setIsLoading(false);
                                    }
                                }}
                                className="rounded-full bg-primary font-black uppercase tracking-widest text-white"
                            >
                                {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                Yes, Approve Everything
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
