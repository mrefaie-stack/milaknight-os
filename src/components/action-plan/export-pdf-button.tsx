"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export function ExportPdfButton({ className }: { className?: string }) {
    return (
        <Button onClick={() => window.print()} variant="secondary" className={className || "font-bold rounded-full h-11 px-6 border border-primary/20"}>
            <Printer className="mr-2 h-4 w-4" /> Export PDF
        </Button>
    );
}
