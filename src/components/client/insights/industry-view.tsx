"use client";

import { useLanguage } from "@/contexts/language-context";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Lightbulb } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { InsightHistory } from "./insight-history";

interface IndustryItem {
    titleAr: string;
    titleEn: string;
    summaryAr: string;
    summaryEn: string;
    tag: string;
    impact: "HIGH" | "MEDIUM" | "LOW";
    emoji: string;
}

interface HistoryEntry { id: string; items: IndustryItem[]; createdAt: Date; }

const IMPACT_STYLES = {
    HIGH: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    MEDIUM: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    LOW: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};
const IMPACT_AR = { HIGH: "تأثير عالٍ", MEDIUM: "تأثير متوسط", LOW: "تأثير منخفض" };
const IMPACT_EN = { HIGH: "High Impact", MEDIUM: "Medium Impact", LOW: "Low Impact" };

function ItemsGrid({ items, isRtl }: { items: IndustryItem[]; isRtl: boolean }) {
    return (
        <div className="grid gap-5 md:grid-cols-2">
            {items.map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.35 }}>
                    <Card className="glass-card border-none rounded-3xl overflow-hidden group hover:bg-white/5 transition-all duration-300">
                        <CardContent className="p-6 space-y-4">
                            <div className={`flex items-start justify-between gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <span className="text-3xl">{item.emoji || "💡"}</span>
                                <div className={`flex gap-2 flex-wrap ${isRtl ? 'flex-row-reverse' : ''}`}>
                                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest rounded-full border-white/10 text-muted-foreground">
                                        {item.tag}
                                    </Badge>
                                    <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-widest rounded-full ${IMPACT_STYLES[item.impact] || IMPACT_STYLES.MEDIUM}`}>
                                        {isRtl ? IMPACT_AR[item.impact] : IMPACT_EN[item.impact]}
                                    </Badge>
                                </div>
                            </div>
                            <h3 className={`text-lg font-black leading-tight tracking-tight ${isRtl ? 'text-right' : ''}`}>
                                {isRtl ? item.titleAr : item.titleEn}
                            </h3>
                            <p className={`text-sm text-muted-foreground leading-relaxed font-medium opacity-70 ${isRtl ? 'text-right' : ''}`}>
                                {isRtl ? item.summaryAr : item.summaryEn}
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </div>
    );
}

export function IndustryView({
    current,
    history,
}: {
    current: { items: IndustryItem[]; createdAt: Date };
    history: HistoryEntry[];
}) {
    const { isRtl } = useLanguage();

    return (
        <div className="space-y-8 max-w-5xl mx-auto" dir={isRtl ? "rtl" : "ltr"}>
            {/* Header */}
            <div className={`flex flex-col md:flex-row md:items-end justify-between gap-4 ${isRtl ? 'text-right' : ''}`}>
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                        <Lightbulb className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter premium-gradient-text uppercase">
                            {isRtl ? "رؤى السوق" : "Market Insights"}
                        </h1>
                        <p className="text-sm text-muted-foreground font-medium opacity-70">
                            {isRtl ? "آخر المستجدات والتحليلات في قطاعك" : "Latest market updates tailored to your sector"}
                        </p>
                    </div>
                </div>
                <div className={`flex items-center gap-2 text-[11px] text-muted-foreground font-bold opacity-50 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <RefreshCw className="h-3 w-3" />
                    <span>
                        {isRtl ? "آخر تحديث" : "Updated"} {formatDistanceToNow(new Date(current.createdAt), { addSuffix: true })}
                        {" · "}
                        {isRtl ? "يتجدد كل 12 ساعة" : "Refreshes every 12h"}
                    </span>
                </div>
            </div>

            {/* Latest */}
            <ItemsGrid items={current.items} isRtl={isRtl} />

            {/* History */}
            <InsightHistory
                history={history}
                renderItems={(items) => <ItemsGrid items={items} isRtl={isRtl} />}
            />
        </div>
    );
}
