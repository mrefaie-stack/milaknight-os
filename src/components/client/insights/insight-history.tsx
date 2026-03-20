"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, History } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface HistoryEntry {
    id: string;
    items: any[];
    createdAt: Date;
}

interface InsightHistoryProps {
    history: HistoryEntry[];
    renderItems: (items: any[]) => React.ReactNode;
}

export function InsightHistory({ history, renderItems }: InsightHistoryProps) {
    const { isRtl } = useLanguage();
    const [expandedId, setExpandedId] = useState<string | null>(null);

    if (!history || history.length === 0) return null;

    return (
        <div className="space-y-4 pt-8 border-t border-border" dir={isRtl ? "rtl" : "ltr"}>
            <div className={`flex items-center gap-2 text-muted-foreground opacity-50`}>
                <History className="h-4 w-4" />
                <span className="section-label">
                    {isRtl ? `السجل السابق (${history.length})` : `Previous Snapshots (${history.length})`}
                </span>
            </div>

            <div className="space-y-3">
                {history.map((entry) => (
                    <div key={entry.id} className="rounded-lg border border-border overflow-hidden">
                        {/* Collapsed header — always visible */}
                        <button
                            onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                            className={`w-full flex items-center justify-between px-5 py-4 bg-muted/30 hover:bg-muted/50 transition-all`}
                        >
                            <div className={`flex items-center gap-3`}>
                                <span className="section-label text-muted-foreground opacity-60">
                                    {format(new Date(entry.createdAt), "dd MMM yyyy · HH:mm")}
                                </span>
                                <span className="text-[10px] font-semibold text-muted-foreground opacity-40">
                                    ({formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })})
                                </span>
                            </div>
                            <motion.div
                                animate={{ rotate: expandedId === entry.id ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ChevronDown className="h-4 w-4 text-muted-foreground opacity-40" />
                            </motion.div>
                        </button>

                        {/* Expanded content */}
                        <div className="overflow-hidden">
                            <motion.div
                                initial={false}
                                animate={{ 
                                    height: expandedId === entry.id ? "auto" : 0,
                                    opacity: expandedId === entry.id ? 1 : 0,
                                }}
                                transition={{ 
                                    duration: 0.3, 
                                    ease: [0.04, 0.62, 0.23, 0.98] 
                                }}
                                className="overflow-hidden"
                            >
                                <div className="p-5 bg-muted/20 border-t border-border">
                                    {renderItems(entry.items)}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
