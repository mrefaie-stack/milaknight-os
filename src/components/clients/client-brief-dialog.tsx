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

export function ClientBriefDialog({ brief }: { brief: string | null }) {
    if (!brief) return null;

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="secondary" className="font-bold rounded-full">
                    <Info className="h-4 w-4 mr-2" /> View Brief
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Client Brief</DialogTitle>
                    <DialogDescription>
                        Strategic overview, goals, and tone of voice for this brand.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 whitespace-pre-wrap text-sm leading-relaxed border-t border-border mt-2 pt-6">
                    {brief}
                </div>
            </DialogContent>
        </Dialog>
    );
}
