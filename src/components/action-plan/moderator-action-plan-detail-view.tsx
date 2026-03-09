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
import { scheduleActionPlan } from "@/app/actions/action-plan";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ModeratorActionPlanDetailView({ plan, items }: { plan: any; items: any[] }) {
    const { isRtl } = useLanguage();
    const [isScheduling, setIsScheduling] = useState(false);
    const router = useRouter();

    // Moderator ONLY sees strictly approved items for publishing
    const approvedItems = items.filter(i => i.status === "APPROVED");

    const handleSchedule = async () => {
        setIsScheduling(true);
        try {
            const result = await scheduleActionPlan(plan.id);
            if (result.success) {
                toast.success(isRtl ? "تمت جدولة الخطة بنجاح" : "Plan scheduled successfully");
                router.refresh();
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsScheduling(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className={`p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 ${isRtl ? 'md:flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
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

                {/* Scheduling Action */}
                {plan.status === "APPROVED" && (
                    <Button
                        onClick={handleSchedule}
                        disabled={isScheduling}
                        className="rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 h-10 px-6"
                    >
                        <CalendarDays className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                        {isRtl ? "تأكيد جدولة الخطة بالكامل" : "CONFIRM FULL PLAN SCHEDULED"}
                    </Button>
                )}

                {plan.status === "SCHEDULED" && (
                    <div className={`flex items-center gap-2 px-4 py-2 bg-emerald-500/20 rounded-xl border border-emerald-500/30 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span className="text-[10px] font-black uppercase text-emerald-700 tracking-widest">
                            {isRtl ? "تمت الجدولة" : "SCHEDULED"}
                        </span>
                    </div>
                )}
            </div>

            {/* We can reuse the ClientActionPlanView by passing it the strictly filtered items */}
            {/* But we need to hide the approval actions. We'll handle that inside ClientActionPlanView by checking role or passing a prop */}
            <ClientActionPlanView plan={plan} items={approvedItems} isModerator={true} />
        </div>
    );
}
