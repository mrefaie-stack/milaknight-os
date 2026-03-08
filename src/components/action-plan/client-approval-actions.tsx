"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { approveItem, requestEdit } from "@/app/actions/approval";
import { toast } from "sonner";
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Check, MessageSquare } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

export function ClientApprovalActions({ item }: { item: any }) {
    const { isRtl } = useLanguage();
    const [isApproving, setIsApproving] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [editOpen, setEditOpen] = useState(false);

    if (item.status === "APPROVED") {
        return (
            <span className={`text-emerald-500 flex items-center text-sm font-medium ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Check className={`w-4 h-4 ${isRtl ? 'ml-1' : 'mr-1'}`} />
                {isRtl ? "معتمد" : "Approved"}
            </span>
        );
    }

    async function handleApprove() {
        setIsApproving(true);
        try {
            await approveItem(item.id);
            toast.success(isRtl ? "تمت الموافقة على العنصر" : "Item approved");
        } catch (e) {
            toast.error(isRtl ? "فشلت عملية الاعتماد" : "Failed to approve item");
        } finally {
            setIsApproving(false);
        }
    }

    async function handleRequestEdit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsRejecting(true);
        const formData = new FormData(event.currentTarget);
        const comment = formData.get("comment") as string;

        try {
            await requestEdit(item.id, comment);
            toast.success(isRtl ? "تم إرسال طلب التعديل" : "Edit requested successfully");
            setEditOpen(false);
        } catch (e) {
            toast.error(isRtl ? "فشل إرسال طلب التعديل" : "Failed to request edit");
        } finally {
            setIsRejecting(false);
        }
    }

    return (
        <div className={`flex flex-col gap-2 min-w-[140px] ${isRtl ? 'items-end' : ''}`}>
            <Button
                onClick={handleApprove}
                disabled={isApproving || isRejecting}
                className="bg-emerald-600 hover:bg-emerald-700 w-full"
            >
                {isApproving && <Loader2 className={`h-4 w-4 animate-spin ${isRtl ? 'ml-2' : 'mr-2'}`} />}
                {isRtl ? "اعتماد" : "Approve"}
            </Button>

            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="w-full text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground">
                        {isRtl ? "طلب تعديل" : "Request Edit"}
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]" dir={isRtl ? "rtl" : "ltr"}>
                    <DialogHeader className={isRtl ? 'text-right' : ''}>
                        <DialogTitle>{isRtl ? "طلب تعديل" : "Request an Edit"}</DialogTitle>
                        <DialogDescription>
                            {isRtl
                                ? "يرجى توضيح ما تريد تغييره. سيتم إرسال ملاحظتك إلى مدير حسابك."
                                : "Please provide details on what you'd like changed. This will be sent back to your Account Manager."}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleRequestEdit} className="grid gap-4 py-4">
                        <Textarea
                            name="comment"
                            placeholder={isRtl ? "مثال: يرجى تغيير النص إلى..." : "E.g., Please change the call to action to..."}
                            required
                            rows={4}
                        />
                        <DialogFooter className={isRtl ? 'flex-row-reverse' : ''}>
                            <Button type="submit" disabled={isRejecting}>
                                {isRejecting && <Loader2 className={`h-4 w-4 animate-spin ${isRtl ? 'ml-2' : 'mr-2'}`} />}
                                {isRtl ? "إرسال الملاحظة" : "Submit Feedback"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
