"use client";

import { useEffect, useState } from "react";
import { differenceInDays, setDate } from "date-fns";
import { Clock } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

export function DeadlineTicker() {
    const { isRtl } = useLanguage();
    const [daysLeft, setDaysLeft] = useState(0);

    useEffect(() => {
        const today = new Date();
        const target = setDate(today, 28);
        let finalTarget = target;
        if (today.getDate() > 28) {
            finalTarget = setDate(new Date(today.getFullYear(), today.getMonth() + 1, 1), 28);
        }
        setDaysLeft(differenceInDays(finalTarget, today));
    }, []);

    return (
        <div className={`flex items-center gap-3 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-600 dark:text-orange-400 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <Clock className="h-4 w-4 animate-pulse shrink-0" />
            <span className="text-sm font-bold tracking-tight">
                {isRtl
                    ? `${daysLeft} يوم حتى موعد تسليم ٢٨`
                    : `${daysLeft} days until Day 28 Deadline`}
            </span>
        </div>
    );
}
