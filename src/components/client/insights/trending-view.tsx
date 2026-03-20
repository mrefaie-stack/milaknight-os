"use client";

import { useLanguage } from "@/contexts/language-context";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { InsightHistory } from "./insight-history";

interface TrendingItem {
    topicEn: string;
    topicAr: string;
    hashtag: string;
    descEn: string;
    descAr: string;
    volume: string;
    growth: string;
    platform: string;
}

interface HistoryEntry { id: string; items: TrendingItem[]; createdAt: Date; }

const PLATFORM_STYLES: Record<string, string> = {
    Instagram: "bg-pink-500/10 text-pink-400 border-pink-500/20",
    TikTok: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    Twitter: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    LinkedIn: "bg-blue-600/10 text-blue-400 border-blue-600/20",
    YouTube: "bg-red-500/10 text-red-400 border-red-500/20",
    Facebook: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

function ItemsGrid({ items, isRtl, animated = true, isHistory = false }: { items: TrendingItem[]; isRtl: boolean; animated?: boolean; isHistory?: boolean }) {
    return (
        <div className="grid gap-4 md:grid-cols-2">
            {items.map((item, i) => {
                const MotionWrapper = animated ? motion.div : "div";
                return (
                    <MotionWrapper 
                        key={i} 
                        initial={animated ? { opacity: 0, y: 12 } : undefined} 
                        animate={animated ? { opacity: 1, y: 0 } : undefined} 
                        transition={animated ? { delay: i * 0.04, duration: 0.35 } : undefined}
                    >
                        <Card className={`${isHistory ? 'bg-muted/30 border border-border' : 'bg-card border border-border'} rounded-xl overflow-hidden group transition-all duration-300`}>
                            <CardContent className="p-6 space-y-3">
                                <div className={`flex items-start justify-between gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                    <span className="text-xl font-semibold text-primary tracking-tight">{item.hashtag}</span>
                                    <Badge variant="outline" className={`section-label rounded-full shrink-0 ${PLATFORM_STYLES[item.platform] || "bg-muted/30 text-muted-foreground border-border"}`}>
                                        {item.platform}
                                    </Badge>
                                </div>
                                <h3 className={`font-semibold text-base leading-tight ${isRtl ? 'text-right' : ''}`}>
                                    {isRtl ? item.topicAr : item.topicEn}
                                </h3>
                                <p className={`text-sm text-muted-foreground leading-relaxed font-medium opacity-70 ${isRtl ? 'text-right' : ''}`}>
                                    {isRtl ? item.descAr : item.descEn}
                                </p>
                                <div className={`flex items-center gap-3 pt-2 border-t border-border ${isRtl ? 'flex-row-reverse' : ''}`}>
                                    <div className={`flex flex-col ${isRtl ? 'items-end' : ''}`}>
                                        <span className="section-label text-muted-foreground opacity-50">{isRtl ? "الحجم" : "Volume"}</span>
                                        <span className="text-sm font-semibold text-primary">{item.volume}</span>
                                    </div>
                                    <div className="w-px h-6 bg-border" />
                                    <div className={`flex flex-col ${isRtl ? 'items-end' : ''}`}>
                                        <span className="section-label text-muted-foreground opacity-50">{isRtl ? "النمو" : "Growth"}</span>
                                        <span className="text-sm font-semibold text-emerald-400">{item.growth}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </MotionWrapper>
                );
            })}
        </div>
    );
}

export function TrendingView({
    current,
    history,
    animated = true,
}: {
    current: { items: TrendingItem[]; createdAt: Date };
    history: HistoryEntry[];
    animated?: boolean;
}) {
    const { isRtl } = useLanguage();

    return (
        <div className="space-y-8 max-w-5xl mx-auto" dir={isRtl ? "rtl" : "ltr"}>
            <div className={`flex flex-col md:flex-row md:items-end justify-between gap-4 ${isRtl ? 'text-right' : ''}`}>
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <TrendingUp className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {isRtl ? "المواضيع الرائجة" : "Trending Topics"}
                        </h1>
                        <p className="text-sm text-muted-foreground font-medium opacity-70">
                            {isRtl ? "هاشتاقات وكلمات مفتاحية مخصصة لعلامتك" : "Hashtags & keywords tailored to your brand"}
                        </p>
                    </div>
                </div>
                <div className={`flex items-center gap-2 text-[11px] text-muted-foreground font-bold opacity-50 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <RefreshCw className="h-3 w-3" />
                    <span>
                        {isRtl ? "آخر تحديث" : "Updated"} {formatDistanceToNow(new Date(current.createdAt), { addSuffix: true })}
                        {" · "}{isRtl ? "يتجدد كل 12 ساعة" : "Refreshes every 12h"}
                    </span>
                </div>
            </div>

            <ItemsGrid items={current.items} isRtl={isRtl} animated={animated} />

            <InsightHistory history={history} renderItems={(items) => <ItemsGrid items={items} isRtl={isRtl} animated={false} isHistory={true} />} />
        </div>
    );
}
