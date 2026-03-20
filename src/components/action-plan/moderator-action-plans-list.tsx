"use client";

import { useLanguage } from "@/contexts/language-context";
import { Layers, Search, Filter, ChevronRight, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function ModeratorActionPlansList({ plans }: { plans: any[] }) {
    const { isRtl } = useLanguage();
    const [search, setSearch] = useState("");

    const filteredPlans = plans.filter(p =>
        p.month.toLowerCase().includes(search.toLowerCase()) ||
        p.client?.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-5 max-w-5xl mx-auto">
            <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4", isRtl ? "sm:flex-row-reverse text-right" : "")}>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {isRtl ? "خطط المحتوى" : "Content Plans"}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {isRtl ? "المحتوى المعتمد والجاهز للتنفيذ" : "Approved content ready for execution"}
                    </p>
                    {filteredPlans.length > 0 && plans.length > filteredPlans.length && (
                        <div className={cn("mt-2 flex items-center gap-2 text-xs text-primary", isRtl ? "flex-row-reverse" : "")}>
                            <Filter className="h-3 w-3" />
                            {isRtl ? `عرض خطط: ${filteredPlans[0].client?.name}` : `Viewing plans for: ${filteredPlans[0].client?.name}`}
                            <Link href="/moderator/action-plans" className="underline opacity-60 hover:opacity-100 transition-opacity">
                                {isRtl ? "(إلغاء الفلتر)" : "(clear filter)"}
                            </Link>
                        </div>
                    )}
                </div>

                <div className="relative w-full sm:w-auto">
                    <Search className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50", isRtl ? "right-3" : "left-3")} />
                    <input
                        type="text"
                        placeholder={isRtl ? "بحث بالخطة أو العميل..." : "Search plans or clients..."}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className={cn(
                            "h-9 w-full sm:w-64 bg-background border border-border rounded-lg text-sm",
                            "focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/15",
                            "placeholder:text-muted-foreground/50",
                            isRtl ? "pr-10 pl-3 text-right" : "pl-10 pr-3",
                        )}
                    />
                </div>
            </div>

            <div className="space-y-2">
                {filteredPlans.length > 0 ? (
                    filteredPlans.map((plan) => (
                        <Link
                            key={plan.id}
                            href={`/moderator/action-plans/${plan.id}`}
                            className={cn(
                                "group flex items-center justify-between p-4 rounded-lg border border-border bg-card",
                                "hover:border-emerald-500/30 hover:bg-muted/30 transition-colors duration-150",
                                isRtl ? "flex-row-reverse" : "",
                            )}
                        >
                            <div className={cn("flex items-center gap-3", isRtl ? "flex-row-reverse" : "")}>
                                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                                    <Layers className="h-5 w-5 text-emerald-500" />
                                </div>
                                <div className={isRtl ? "text-right" : ""}>
                                    <h3 className="text-sm font-semibold">{plan.month}</h3>
                                    <div className={cn("flex items-center gap-2 text-xs text-muted-foreground mt-0.5", isRtl ? "flex-row-reverse" : "")}>
                                        <span>{plan.client?.name}</span>
                                        <span>·</span>
                                        <Badge variant={plan.status === "SCHEDULED" ? "success" : "info"} className="text-[10px]">
                                            {plan.status === "SCHEDULED" ? (isRtl ? "مجدول" : "Scheduled") : (isRtl ? "معتمد" : "Approved")}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <div className={cn("flex items-center gap-4", isRtl ? "flex-row-reverse" : "")}>
                                <div className="hidden sm:block text-center">
                                    <div className="text-sm font-semibold">{plan.items?.length || 0}</div>
                                    <div className="section-label text-[9px] text-muted-foreground">{isRtl ? "عنصر" : "Items"}</div>
                                </div>
                                <ChevronRight className={cn(
                                    "h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors",
                                    isRtl ? "rotate-180" : "",
                                )} />
                            </div>
                        </Link>
                    ))
                ) : (
                    <div className="py-16 text-center rounded-lg border border-dashed border-border">
                        <Layers className="h-9 w-9 mx-auto mb-3 text-muted-foreground/30" />
                        <p className="text-sm text-muted-foreground">{isRtl ? "لا توجد نتائج مطابقة لبحثك" : "No plans matching your search"}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
