"use client";

import { useLanguage } from "@/contexts/language-context";

export function MessagesHeader() {
    const { isRtl } = useLanguage();
    return (
        <div className={isRtl ? "text-right" : "text-left"}>
            <h1 className="text-3xl font-bold tracking-tight">
                {isRtl ? "الرسائل" : "Messages"}
            </h1>
            <p className="text-muted-foreground">
                {isRtl ? "التواصل الداخلي بين الإدارة والفريق." : "Internal communication between Admin and Team."}
            </p>
        </div>
    );
}
