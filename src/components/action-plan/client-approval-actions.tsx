"use client";

import { useState } from "react";
import { approveActionPlan, approveContentItem, unapproveContentItem } from "@/app/actions/action-plan";
import { submitActionPlanFeedback } from "@/app/actions/action-plan";
import { toast } from "sonner";
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Check, MessageSquare, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";

export function ClientApprovalActions({ item }: { item: any }) {
    const { isRtl, t } = useLanguage();
    const [isLoading, setIsLoading] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [feedback, setFeedback] = useState("");

    async function handleApprove() {
        setIsLoading(true);
        try {
            await approveContentItem(item.id, item.planId);
            toast.success(isRtl ? "تم اعتماد المنشور" : "Post approved");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleUnapprove() {
        if (!confirm(isRtl ? "هل أنت متأكد من إلغاء الاعتماد؟ سيعود المنشور لحالة قيد المراجعة." : "Are you sure you want to unapprove? This post will return to pending status.")) return;
        setIsLoading(true);
        try {
            await unapproveContentItem(item.id, item.planId);
            toast.success(isRtl ? "تم إلغاء الاعتماد" : "Unapproved successfully");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleReject() {
        if (!feedback.trim()) return;
        setIsRejecting(true);
        try {
            await submitActionPlanFeedback(item.planId, [{ itemId: item.id, comment: feedback }]);
            toast.success(isRtl ? "تم إرسال ملاحظاتك" : "Feedback submitted");
            setEditOpen(false);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsRejecting(false);
        }
    }

    if (item.status === 'APPROVED') {
        return (
            <div className={`w-full flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-2 text-emerald-600 ${isRtl ? 'flex-row-reverse text-right' : ''}`}>
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-xs font-medium">{isRtl ? "معتمد من قبلك" : "Approved by you"}</span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleUnapprove}
                    disabled={isLoading}
                    className="text-[10px] font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                >
                    {isRtl ? "إلغاء الاعتماد" : "UNAPPROVE"}
                </Button>
            </div>
        );
    }

    return (
        <div className={`flex items-center gap-2 w-full ${isRtl ? 'flex-row-reverse' : ''}`}>
            <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-10"
                onClick={handleApprove}
                disabled={isLoading}
            >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {isRtl ? "اعتماد" : "Approve"}
            </Button>
            <Button
                variant="outline"
                className="flex-1 font-semibold h-10 border-primary/20"
                onClick={() => setEditOpen(true)}
                disabled={isLoading}
            >
                <MessageSquare className="h-4 w-4" />
                {isRtl ? "تعديل" : "Revision"}
            </Button>

            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className={isRtl ? 'text-right' : 'text-left'}>
                    <DialogHeader>
                        <DialogTitle className="text-[15px] font-semibold">
                            {isRtl ? "طلب تعديلات" : "Request Revisions"}
                        </DialogTitle>
                        <DialogDescription>
                            {isRtl ? "يرجى كتابة ملاحظاتك على هذا المنشور ليقوم مدير الحساب بتعديله." : "Please provide your feedback for this post."}
                        </DialogDescription>
                    </DialogHeader>
                    <Textarea
                        placeholder={isRtl ? "اكتب ملاحظاتك هنا..." : "Type your feedback here..."}
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        className="min-h-[120px] rounded-xl border-primary/10 bg-primary/5 italic"
                    />
                    <DialogFooter className="gap-2">
                        <Button variant="ghost" onClick={() => setEditOpen(false)}>{t("common.cancel")}</Button>
                        <Button
                            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold"
                            onClick={handleReject}
                            disabled={isRejecting || !feedback.trim()}
                        >
                            {isRejecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                            {isRtl ? "إرسال الملاحظات" : "Submit Feedback"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

