"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer, Loader2 } from "lucide-react";

export function ExportPdfButton({ className, targetId = "pdf-content", fileName = "Document" }: { className?: string, targetId?: string, fileName?: string }) {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleExport = async () => {
        setIsGenerating(true);
        try {
            // Dynamically import html2pdf to avoid SSR issues
            // @ts-ignore
            const html2pdf = (await import('html2pdf.js')).default;
            const element = document.getElementById(targetId);

            if (!element) {
                console.error(`Element with id ${targetId} not found.`);
                setIsGenerating(false);
                return;
            }

            // Options for pdf generation
            const opt: any = {
                margin: [10, 10, 10, 10], // top, left, bottom, right
                filename: `${fileName}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: false },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
            };

            await html2pdf().set(opt).from(element).save();
        } catch (error) {
            console.error("PDF Generation error:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Button
            onClick={handleExport}
            disabled={isGenerating}
            variant="secondary"
            className={className || "font-bold rounded-full h-11 px-6 border border-primary/20"}
        >
            {isGenerating ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
                </>
            ) : (
                <>
                    <Printer className="mr-2 h-4 w-4" /> Export PDF
                </>
            )}
        </Button>
    );
}
