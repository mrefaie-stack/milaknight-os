"use client";

import { useLanguage } from "@/contexts/language-context";
import {
    Layers,
    CheckCircle2,
    Calendar,
    Download,
    ChevronRight,
    LayoutGrid,
    CalendarDays
} from "lucide-react";
import { useState } from "react";
import { DownloadActionPlanButton } from "./download-action-plan-button";
import { ClientActionPlanView } from "./client-action-plan-view";

export function ModeratorActionPlanDetailView({ plan, items }: { plan: any; items: any[] }) {
    const { isRtl } = useLanguage();

    // Moderator ONLY sees strictly approved items for publishing
    const approvedItems = items.filter(i => i.status === "APPROVED");

    return (
        <div className="space-y-8">
            <div className={`p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div className="p-2 rounded-xl bg-emerald-500 text-white">
                    <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className={isRtl ? 'text-right' : 'text-left'}>
                    <p className="text-xs font-black uppercase tracking-widest text-emerald-600">
                        {isRtl ? "عرض الناشر - محتوى معتمد فقط" : "MODERATOR VIEW - APPROVED CONTENT ONLY"}
                    </p>
                    <p className="text-[10px] font-bold text-emerald-600/70">
                        {isRtl ? "أنت تشاهد فقط المنشورات التي اعتمدها العميل وجاهزة للنشر." : "You are only viewing posts approved by the client and ready for publishing."}
                    </p>
                </div>
            </div>

            {/* We can reuse the ClientActionPlanView by passing it the strictly filtered items */}
            {/* But we need to hide the approval actions. We'll handle that inside ClientActionPlanView by checking role or passing a prop */}
            <ClientActionPlanView plan={plan} items={approvedItems} isModerator={true} />
        </div>
    );
}
