"use client";

import { useEffect, useState } from "react";
import { differenceInDays, endOfMonth, setDate } from "date-fns";
import { Clock } from "lucide-react";

export function DeadlineTicker() {
    const [daysLeft, setDaysLeft] = useState(0);

    useEffect(() => {
        const today = new Date();
        const target = setDate(today, 28);

        // If today is past the 28th, target the 28th of next month
        let finalTarget = target;
        if (today.getDate() > 28) {
            finalTarget = setDate(new Date(today.getFullYear(), today.getMonth() + 1, 1), 28);
        }

        setDaysLeft(differenceInDays(finalTarget, today));
    }, []);

    return (
        <div className="flex items-center gap-3 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-600 dark:text-orange-400">
            <Clock className="h-4 w-4 animate-pulse" />
            <span className="text-sm font-bold tracking-tight">
                {daysLeft} days until Day 28 Deadline
            </span>
        </div>
    );
}
