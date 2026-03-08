"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

export function ClientBriefDialog({ brief }: { brief: string | null }) {
    const { isRtl } = useLanguage();
    if (!brief) return null;

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="secondary" className="font-bold rounded-full">
                    <Info className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                    {isRtl ? "عرض الموجز" : "View Brief"}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto" dir={isRtl ? "rtl" : "ltr"}>
                <DialogHeader className={isRtl ? "text-right" : ""}>
                    <DialogTitle>{isRtl ? "موجز العميل" : "Client Brief"}</DialogTitle>
                    <DialogDescription>
                        {isRtl
                            ? "النظرة العامة الاستراتيجية، والأهداف، وأسلوب التواصل لهذه العلامة التجارية."
                            : "Strategic overview, goals, and tone of voice for this brand."}
                    </DialogDescription>
                </DialogHeader>
                <div className={`py-4 whitespace-pre-wrap text-sm leading-relaxed border-t border-border mt-2 pt-6 ${isRtl ? 'text-right' : 'text-left'}`}>
                    {brief}
                </div>
            </DialogContent>
        </Dialog>
    );
}
