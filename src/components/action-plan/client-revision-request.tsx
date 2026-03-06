"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { submitActionPlanFeedback } from "@/app/actions/action-plan";
import { MessageSquarePlus } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

export function ClientRevisionRequest({ planId, currentComment }: { planId: string, currentComment?: string | null }) {
    const [comment, setComment] = useState(currentComment || "");
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleConfirm() {
        if (!comment.trim()) {
            toast.error("Please enter your feedback/revisions.");
            return;
        }

        setLoading(true);
        try {
            await submitActionPlanFeedback(planId, comment);
            toast.success("Revision request sent to your account manager.");
            setIsOpen(false);
        } catch (error: any) {
            toast.error(error.message || "Failed to send request.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 font-bold border-orange-500 text-orange-600 hover:bg-orange-50">
                    <MessageSquarePlus className="h-4 w-4" />
                    Request Revisions
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Request Plan Revisions</DialogTitle>
                    <DialogDescription>
                        Explain what changes you would like to see in this month's action plan.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <Textarea
                        placeholder="e.g. Please change the caption for the second post, and add more red to the graphics..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={5}
                        className="resize-none"
                    />
                </div>
                <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={loading}
                        className="bg-orange-600 hover:bg-orange-700 font-bold"
                    >
                        {loading ? "Sending..." : "Submit Request"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
