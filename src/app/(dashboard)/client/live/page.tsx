"use client";

import { useLanguage } from "@/contexts/language-context";
import { LiveMetrics } from "@/components/dashboard/live-metrics";
import { Activity, Radio } from "lucide-react";

export default function ClientLiveAnalyticsPage() {
    const { isRtl } = useLanguage();

    return (
        <div className="space-y-8 p-6 lg:p-10 max-w-[1600px] mx-auto pb-32">
            <div className={`space-y-4 ${isRtl ? 'text-right' : 'text-left'}`}>
                <div className="inline-flex items-center justify-center p-3 sm:p-4 rounded-3xl bg-primary/10 text-primary mb-4 ring-1 ring-primary/20">
                    <Radio className="h-6 w-6 sm:h-8 sm:w-8 animate-pulse" />
                </div>
                <h1 className="text-3xl sm:text-5xl font-black tracking-tighter uppercase premium-gradient-text flex items-center justify-start gap-4" style={{ flexDirection: isRtl ? "row-reverse" : "row" }}>
                    {isRtl ? "الاحصائيات الحية" : "Live Analytics"}
                </h1>
                <p className="text-muted-foreground font-medium text-lg max-w-2xl opacity-80" style={{ margin: isRtl ? "0 0 0 auto" : "0 auto 0 0" }}>
                    {isRtl 
                        ? "نقدم لك تصوراً حياً ومباشراً لأداء العلامة التجارية والإعلانات عبر جميع المنصات المربوطة لتظل دائماً في قلب الحدث." 
                        : "A real-time overview of your brand performance and specific ad campaigns across all connected platforms."}
                </p>
            </div>

            <div className="pt-6 border-t border-white/5">
                <LiveMetrics />
            </div>
        </div>
    );
}
