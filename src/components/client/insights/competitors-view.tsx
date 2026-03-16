"use client";

import { useLanguage } from "@/contexts/language-context";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Target, ShieldCheck, AlertTriangle, Instagram, Linkedin } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { InsightHistory } from "./insight-history";

interface SocialMedia {
    instagram?: string | null;
    twitter?: string | null;
    linkedin?: string | null;
    tiktok?: string | null;
    estimatedFollowers?: string;
    activity?: "HIGH" | "MEDIUM" | "LOW";
}

interface CompetitorItem {
    name: string;
    descEn: string;
    descAr: string;
    strengths: string[];
    weaknesses: string[];
    socialMedia?: SocialMedia;
    socialPresence: "HIGH" | "MEDIUM" | "LOW";
    threat: "HIGH" | "MEDIUM" | "LOW";
}

interface HistoryEntry { id: string; items: CompetitorItem[]; createdAt: Date; }

const LEVEL: Record<string, string> = {
    HIGH: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    MEDIUM: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    LOW: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};
const T_AR: Record<string, string> = { HIGH: "تهديد عالٍ", MEDIUM: "تهديد متوسط", LOW: "تهديد منخفض" };
const T_EN: Record<string, string> = { HIGH: "High Threat", MEDIUM: "Medium Threat", LOW: "Low Threat" };
const S_AR: Record<string, string> = { HIGH: "حضور رقمي قوي", MEDIUM: "حضور رقمي متوسط", LOW: "حضور رقمي ضعيف" };
const S_EN: Record<string, string> = { HIGH: "Strong Social Presence", MEDIUM: "Moderate Presence", LOW: "Weak Presence" };
const A_AR: Record<string, string> = { HIGH: "نشاط عالٍ", MEDIUM: "نشاط متوسط", LOW: "نشاط منخفض" };
const A_EN: Record<string, string> = { HIGH: "High Activity", MEDIUM: "Moderate Activity", LOW: "Low Activity" };

function ok(v?: string | null) { return v && v !== "null" && v !== "undefined"; }

function XIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.732-8.835L1.254 2.25H8.08l4.26 5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    );
}

function TikTokIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V9.16a8.16 8.16 0 004.79 1.54V7.27a4.85 4.85 0 01-1.02-.58z" />
        </svg>
    );
}

function ItemsGrid({ items, isRtl, animated = true }: { items: CompetitorItem[]; isRtl: boolean; animated?: boolean }) {
    return (
        <div className="grid gap-6 md:grid-cols-2">
            {items.map((comp, i) => {
                const MotionWrapper = animated ? motion.div : "div";
                return (
                    <MotionWrapper 
                        key={i} 
                        initial={animated ? { opacity: 0, y: 16 } : undefined} 
                        animate={animated ? { opacity: 1, y: 0 } : undefined} 
                        transition={animated ? { delay: i * 0.07, duration: 0.4 } : undefined}
                        className="h-full"
                    >
                        <Card className="glass-card border-none rounded-3xl overflow-hidden h-full">
                            <CardContent className="p-6 space-y-5 flex flex-col h-full">
                                {/* Name */}
                                <div className={`flex items-start gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
                                    <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-lg text-primary shrink-0">
                                        {comp.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className={`flex-1 ${isRtl ? "text-right" : ""}`}>
                                        <h3 className="font-black text-xl leading-tight">{comp.name}</h3>
                                        <p className="text-xs text-muted-foreground font-medium opacity-60 mt-1 leading-relaxed">
                                            {isRtl ? comp.descAr : comp.descEn}
                                        </p>
                                    </div>
                                </div>

                                {/* Badges */}
                                <div className={`flex items-center gap-2 flex-wrap ${isRtl ? "flex-row-reverse" : ""}`}>
                                    <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-widest rounded-full gap-1 ${LEVEL[comp.threat] || LEVEL.MEDIUM}`}>
                                        <AlertTriangle className="h-2.5 w-2.5" />
                                        {isRtl ? T_AR[comp.threat] : T_EN[comp.threat]}
                                    </Badge>
                                    <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-widest rounded-full ${LEVEL[comp.socialPresence] || LEVEL.MEDIUM}`}>
                                        {isRtl ? S_AR[comp.socialPresence] : S_EN[comp.socialPresence]}
                                    </Badge>
                                </div>

                                {/* Social Media row */}
                                {comp.socialMedia && (
                                    <div className={`flex items-center gap-2 flex-wrap p-3 rounded-2xl bg-white/3 border border-white/5 ${isRtl ? "flex-row-reverse" : ""}`}>
                                        {ok(comp.socialMedia.instagram) && (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-black rounded-full px-2 py-0.5 bg-pink-500/10 text-pink-400">
                                                <Instagram className="h-2.5 w-2.5" />{comp.socialMedia.instagram}
                                            </span>
                                        )}
                                        {ok(comp.socialMedia.twitter) && (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-black rounded-full px-2 py-0.5 bg-sky-500/10 text-sky-400">
                                                <XIcon className="h-2.5 w-2.5" />{comp.socialMedia.twitter}
                                            </span>
                                        )}
                                        {ok(comp.socialMedia.tiktok) && (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-black rounded-full px-2 py-0.5 bg-purple-500/10 text-purple-400">
                                                <TikTokIcon className="h-2.5 w-2.5" />{comp.socialMedia.tiktok}
                                            </span>
                                        )}
                                        {ok(comp.socialMedia.linkedin) && (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-black rounded-full px-2 py-0.5 bg-blue-600/10 text-blue-400">
                                                <Linkedin className="h-2.5 w-2.5" />LinkedIn
                                            </span>
                                        )}
                                        {comp.socialMedia.estimatedFollowers && (
                                            <span className="text-[10px] font-black text-muted-foreground opacity-40 ms-auto">
                                                ~{comp.socialMedia.estimatedFollowers}
                                                {comp.socialMedia.activity && (
                                                    <span className={comp.socialMedia.activity === "HIGH" ? " text-emerald-400" : comp.socialMedia.activity === "MEDIUM" ? " text-orange-400" : " text-rose-400"}>
                                                        {" · "}{isRtl ? A_AR[comp.socialMedia.activity] : A_EN[comp.socialMedia.activity]}
                                                    </span>
                                                )}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Strengths / Weaknesses */}
                                <div className="flex-1 grid grid-cols-2 gap-4">
                                    <div className={`space-y-2 ${isRtl ? "text-right" : ""}`}>
                                        <div className={`flex items-center gap-1.5 text-emerald-400 ${isRtl ? "flex-row-reverse" : ""}`}>
                                            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">{isRtl ? "نقاط قوة" : "Strengths"}</span>
                                        </div>
                                        <ul className="space-y-1.5">
                                            {(comp.strengths || []).slice(0, 4).map((s, j) => (
                                                <li key={j} className={`text-xs text-muted-foreground font-medium opacity-70 flex items-start gap-1.5 ${isRtl ? "flex-row-reverse" : ""}`}>
                                                    <span className="text-emerald-400 shrink-0 mt-0.5">+</span>
                                                    <span>{s}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className={`space-y-2 ${isRtl ? "text-right" : ""}`}>
                                        <div className={`flex items-center gap-1.5 text-rose-400 ${isRtl ? "flex-row-reverse" : ""}`}>
                                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">{isRtl ? "نقاط ضعف" : "Weaknesses"}</span>
                                        </div>
                                        <ul className="space-y-1.5">
                                            {(comp.weaknesses || []).slice(0, 4).map((w, j) => (
                                                <li key={j} className={`text-xs text-muted-foreground font-medium opacity-70 flex items-start gap-1.5 ${isRtl ? "flex-row-reverse" : ""}`}>
                                                    <span className="text-rose-400 shrink-0 mt-0.5">−</span>
                                                    <span>{w}</span>
                                                </li>
                                            ))}
                                        </ul>
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

export function CompetitorsView({
    current,
    history,
    animated = true,
}: {
    current: { items: CompetitorItem[]; createdAt: Date };
    history: HistoryEntry[];
    animated?: boolean;
}) {
    const { isRtl } = useLanguage();
    return (
        <div className="space-y-8 max-w-5xl mx-auto" dir={isRtl ? "rtl" : "ltr"}>
            <div className={`flex flex-col md:flex-row md:items-end justify-between gap-4 ${isRtl ? "text-right" : ""}`}>
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                        <Target className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter premium-gradient-text uppercase">
                            {isRtl ? "تحليل المنافسين" : "Competitors"}
                        </h1>
                        <p className="text-sm text-muted-foreground font-medium opacity-70">
                            {isRtl ? "تحليل ذكي للمنافسين مع بياناتهم على السوشيال ميديا" : "AI-powered competitive analysis with social media data"}
                        </p>
                    </div>
                </div>
                <div className={`flex items-center gap-2 text-[11px] text-muted-foreground font-bold opacity-50 ${isRtl ? "flex-row-reverse" : ""}`}>
                    <RefreshCw className="h-3 w-3" />
                    <span>
                        {isRtl ? "آخر تحديث" : "Updated"} {formatDistanceToNow(new Date(current.createdAt), { addSuffix: true })}
                        {" · "}{isRtl ? "يتجدد كل 12 ساعة" : "Refreshes every 12h"}
                    </span>
                </div>
            </div>
            <ItemsGrid items={current.items} isRtl={isRtl} animated={animated} />
            <InsightHistory history={history} renderItems={(items) => <ItemsGrid items={items} isRtl={isRtl} animated={false} />} />
        </div>
    );
}
