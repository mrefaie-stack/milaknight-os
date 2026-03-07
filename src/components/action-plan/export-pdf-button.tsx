"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer, Loader2 } from "lucide-react";

/**
 * Recursively strips problematic CSS from all elements in the cloned document
 * before html2canvas tries to parse them. This removes gradients and modern
 * color functions that html2canvas (oklab/oklch) cannot handle.
 */
function sanitizeCloneForPdf(doc: Document) {
    const allElements = doc.querySelectorAll("*");
    allElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        const style = window.getComputedStyle(el);

        // Strip gradient backgrounds (they use oklab interpolation in Tailwind v4)
        const bg = style.backgroundImage;
        if (bg && (bg.includes("gradient") || bg.includes("oklab") || bg.includes("oklch"))) {
            htmlEl.style.backgroundImage = "none";
        }

        // Strip backdrop-filter (can cause issues)
        if (style.backdropFilter && style.backdropFilter !== "none") {
            htmlEl.style.backdropFilter = "none";
        }

        // Also strip any inline color that might have oklab
        const bgColor = style.backgroundColor;
        if (bgColor && (bgColor.includes("oklab") || bgColor.includes("oklch"))) {
            htmlEl.style.backgroundColor = "transparent";
        }

        const color = style.color;
        if (color && (color.includes("oklab") || color.includes("oklch"))) {
            htmlEl.style.color = "#111";
        }
    });

    // Also hide decorative elements we've flagged
    const ignored = doc.querySelectorAll("[data-html2canvas-ignore]");
    ignored.forEach((el) => {
        (el as HTMLElement).style.display = "none";
    });

    // Hide mesh background
    const meshBgs = doc.querySelectorAll(".mesh-background");
    meshBgs.forEach((el) => {
        (el as HTMLElement).style.display = "none";
    });
}

export function ExportPdfButton({ className, targetId = "pdf-content", fileName = "Document" }: { className?: string, targetId?: string, fileName?: string }) {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleExport = async () => {
        setIsGenerating(true);
        try {
            // @ts-ignore
            const html2pdf = (await import('html2pdf.js')).default;
            const element = document.getElementById(targetId);

            if (!element) {
                console.error(`Element with id ${targetId} not found.`);
                setIsGenerating(false);
                return;
            }

            const opt: any = {
                margin: [10, 10, 10, 10],
                filename: `${fileName}.pdf`,
                image: { type: 'jpeg', quality: 0.95 },
                html2canvas: {
                    scale: 1.5,
                    useCORS: true,
                    logging: false,
                    allowTaint: true,
                    foreignObjectRendering: false,
                    onclone: (clonedDoc: Document) => {
                        // Sanitize the clone before rendering to avoid oklab/oklch crash
                        sanitizeCloneForPdf(clonedDoc);
                    }
                },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak: { mode: ['css', 'legacy'] }
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
