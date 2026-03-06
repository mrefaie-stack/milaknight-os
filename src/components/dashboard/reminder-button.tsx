"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BellRing } from "lucide-react";
import { toast } from "sonner";
import { remindAMAboutReport, remindClientAboutPlan } from "@/app/actions/notification";

interface ReminderButtonProps {
    type: "AM" | "CLIENT";
    targetId: string;
    label: string;
    context?: string;
    variant?: "outline" | "ghost" | "default";
    size?: "default" | "sm" | "xs";
    className?: string;
}

export function ReminderButton({ type, targetId, label, context, variant = "outline", size = "sm", className }: ReminderButtonProps) {
    const [loading, setLoading] = useState(false);

    async function handleRemind() {
        setLoading(true);
        try {
            if (type === "AM") {
                await remindAMAboutReport(targetId, context || "unknown client");
                toast.success(`Reminder sent to Account Manager`);
            } else {
                // For client, we need a planId usually, but let's simplify for the general reminder
                await remindClientAboutPlan(targetId, "latest");
                toast.success(`Reminder sent to Client`);
            }
        } catch (error: any) {
            toast.error("Failed to send reminder");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Button
            variant={variant}
            size={size}
            onClick={handleRemind}
            disabled={loading}
            className={`font-bold flex items-center gap-2 ${className || ""}`}
        >
            <BellRing className={`h-3 w-3 ${loading ? 'animate-pulse' : ''}`} />
            {label}
        </Button>
    );
}
