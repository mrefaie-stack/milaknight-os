"use client";

import { useLanguage } from "@/contexts/language-context";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Target, ShieldCheck, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface CompetitorItem {
    name: string;
    descEn: string;
    descAr: string;
    strengths: string[];
    weaknesses: string[];
    socialPresence: "HIGH" | "MEDIUM" | "LOW";
    threat: "HIGH" | "MEDIUM" | "LOW";
}

const LEVEL_STYLES = {
    HIGH: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    MEDIUM: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    LOW: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const THREAT_LABELS_AR = { HIGH: "تهديد عالي", MEDIUM: "تهديد متوسط", LOW: "تهديد منخفض" };
const THREAT_LABELS_EN = { HIGH: "High Threat", MEDIUM: "Medium Threat", LOW: "Low Threat" };
const SOCIAL_LABELS_AR = { HIGH: "حضور قوي", MEDIUM: "حضور متوسط", LOW: "حضور ضعيف" };
const SOCIAL_LABELS_EN = { HIGH: "Strong Presence", MEDIUM: "Moderate Presence", LOW: "Weak Presence" };

export function CompetitorsView({ items, updatedAt }: { items: CompetitorItem[]; updatedAt: Date | null }) {
    const { isRtl } = useLanguage();

    return (
        <div className="space-y-8 max-w-5xl mx-auto" dir={isRtl ? "rtl" : "ltr"}>
            {/* Header */}
            <div className={`flex flex-col md:flex-row md:items-end justify-between gap-4 ${isRtl ? 'text-right' : ''}`}>
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                        <Target className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter premium-gradient-text uppercase">
                            {isRtl ? "تحليل المنافسين" : "Competitors"}
                        </h1>
                        <p className="text-sm text-muted-foreground font-medium opacity-70">
                            {isRtl ? "تحليل ذكي لمنافسيك في السوق" : "AI-powered competitive landscape analysis"}
                        </p>
                    </div>
                </div>
                {updatedAt && (
                    <div className={`flex items-center gap-2 text-[11px] text-muted-foreground font-bold opacity-50 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <RefreshCw className="h-3 w-3" />
                        <span>
                            {isRtl ? "آخر تحديث" : "Updated"} {formatDistanceToNow(new Date(updatedAt), { addSuffix: true })}
                            {" · "}
                            {isRtl ? "يتجدد كل 12 ساعة" : "Refreshes every 12h"}
                        </span>
                    </div>
                )}
            </div>

            {/* Grid */}
            <div className="grid gap-6 md:grid-cols-2">
                {items.map((comp, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07, duration: 0.4 }}
                    >
                        <Card className="glass-card border-none rounded-3xl overflow-hidden group hover:bg-white/5 transition-all duration-300 h-full">
                            <CardContent className="p-6 space-y-4 flex flex-col h-full">
                                {/* Header */}
                                <div className={`flex items-start justify-between gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                    <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-lg text-primary shrink-0">
                                        {comp.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className={`flex-1 ${isRtl ? 'text-right' : ''}`}>
                                        <h3 className="font-black text-xl leading-tight">{comp.name}</h3>
                                        <p className="text-xs text-muted-foreground font-medium opacity-60 mt-0.5">
                                            {isRtl ? comp.descAr : comp.descEn}
                                        </p>
                                    </div>
                                </div>

                                {/* Badges */}
                                <div className={`flex items-center gap-2 flex-wrap ${isRtl ? 'flex-row-reverse' : ''}`}>
                                    <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-widest rounded-full ${LEVEL_STYLES[comp.threat]}`}>
                                        <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                                        {isRtl ? THREAT_LABELS_AR[comp.threat] : THREAT_LABELS_EN[comp.threat]}
                                    </Badge>
                                    <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-widest rounded-full ${LEVEL_STYLES[comp.socialPresence]}`}>
                                        {isRtl ? SOCIAL_LABELS_AR[comp.socialPresence] : SOCIAL_LABELS_EN[comp.socialPresence]}
                                    </Badge>
                                </div>

                                <div className="flex-1 grid grid-cols-2 gap-4">
                                    {/* Strengths */}
                                    <div className={`space-y-2 ${isRtl ? 'text-right' : ''}`}>
                                        <div className={`flex items-center gap-1.5 text-emerald-400 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                            <ShieldCheck className="h-3.5 w-3.5" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">
                                                {isRtl ? "نقاط قوة" : "Strengths"}
                                            </span>
                                        </div>
                                        <ul className="space-y-1">
                                            {(comp.strengths || []).slice(0, 3).map((s, j) => (
                                                <li key={j} className="text-xs text-muted-foreground font-medium opacity-70 flex items-start gap-1.5">
                                                    <span className="text-emerald-400 shrink-0 mt-0.5">+</span>
                                                    {s}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Weaknesses */}
                                    <div className={`space-y-2 ${isRtl ? 'text-right' : ''}`}>
                                        <div className={`flex items-center gap-1.5 text-rose-400 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                            <AlertTriangle className="h-3.5 w-3.5" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">
                                                {isRtl ? "نقاط ضعف" : "Weaknesses"}
                                            </span>
                                        </div>
                                        <ul className="space-y-1">
                                            {(comp.weaknesses || []).slice(0, 3).map((w, j) => (
                                                <li key={j} className="text-xs text-muted-foreground font-medium opacity-70 flex items-start gap-1.5">
                                                    <span className="text-rose-400 shrink-0 mt-0.5">−</span>
                                                    {w}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
