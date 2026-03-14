"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteTeamMember } from "@/app/actions/user";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/language-context";

export function TeamDeleteButton({ memberId, memberName }: { memberId: string, memberName: string }) {
    const { t, isRtl } = useLanguage();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handleDelete() {
        setLoading(true);
        try {
            await deleteTeamMember(memberId);
            toast.success(isRtl ? "تم حذف العضو بنجاح" : "Team member deleted successfully");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Failed to delete team member");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent dir={isRtl ? "rtl" : "ltr"}>
                <DialogHeader>
                    <DialogTitle className={isRtl ? "text-right" : ""}>
                        {isRtl ? "هل أنت متأكد من الحذف؟" : "Are you sure?"}
                    </DialogTitle>
                    <DialogDescription className={isRtl ? "text-right" : ""}>
                        {isRtl 
                            ? `سيتم حذف العضو "${memberName}" نهائياً. لا يمكن التراجع عن هذا الإجراء.`
                            : `This will permanently delete the member "${memberName}". This action cannot be undone.`}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className={isRtl ? "flex-row-reverse gap-2" : ""}>
                    <DialogClose asChild>
                        <Button variant="outline">{t("common.cancel")}</Button>
                    </DialogClose>
                    <Button 
                        variant="destructive"
                        onClick={(e) => {
                            e.preventDefault();
                            handleDelete();
                        }}
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (isRtl ? "حذف" : "Delete")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
