"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { generateActionPlanPdf } from "@/lib/generate-action-plan-pdf";
import { toast } from "sonner";

interface DownloadActionPlanButtonProps {
    plan: any;
    items: any[];
    className?: string;
}

export function DownloadActionPlanButton({ plan, items, className }: DownloadActionPlanButtonProps) {
    const [isDownloading, setIsDownloading] = useState(false);

    async function handleDownload() {
        setIsDownloading(true);
        try {
            await generateActionPlanPdf(plan, items);
        } catch (e) {
            toast.error("Failed to generate PDF");
            console.error(e);
        } finally {
            setIsDownloading(false);
        }
    }

    return (
        <Button
            onClick={handleDownload}
            disabled={isDownloading}
            variant="secondary"
            className={className || "font-bold rounded-full h-11 px-6 border border-primary/20"}
        >
            {isDownloading
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                : <><Download className="mr-2 h-4 w-4" /> Download PDF</>
            }
        </Button>
    );
}
