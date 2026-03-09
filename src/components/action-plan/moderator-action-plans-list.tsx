"use client";

import { useLanguage } from "@/contexts/language-context";
import {
    Layers,
    Search,
    Filter,
    ChevronRight,
    CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function ModeratorActionPlansList({ plans }: { plans: any[] }) {
    const { isRtl } = useLanguage();
    const [search, setSearch] = useState("");

    const filteredPlans = plans.filter(p =>
        p.month.toLowerCase().includes(search.toLowerCase()) ||
        p.client?.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 ${isRtl ? 'md:flex-row-reverse' : ''}`}>
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter">
                        {isRtl ? "خطط المحتوى" : "Content Plans"}
                    </h1>
                    <p className="text-muted-foreground font-medium">
                        {isRtl ? "المحتوى المعتمد والجاهز للتنفيذ" : "Approved content ready for execution"}
                    </p>
                    {filteredPlans.length > 0 && plans.length > filteredPlans.length && (
                        <div className={`mt-2 flex items-center gap-2 text-xs font-bold text-primary ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <Filter className="h-3 w-3" />
                            {isRtl ? `عرض خطط: ${filteredPlans[0].client?.name}` : `Viewing plans for: ${filteredPlans[0].client?.name}`}
                            <Link href="/moderator/action-plans" className="underline opacity-60 hover:opacity-100 transition-opacity">
                                {isRtl ? "(إلغاء الفلتر)" : "(clear filter)"}
                            </Link>
                        </div>
                    )}
                </div>

                <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <div className="relative max-w-xs">
                        <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRtl ? 'right-3' : 'left-3'}`} />
                        <input
                            type="text"
                            placeholder={isRtl ? "بحث بالخطة أو العميل..." : "Search plans or clients..."}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className={`h-11 w-full md:w-64 bg-card border border-white/10 rounded-2xl px-10 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${isRtl ? 'pr-10 text-right' : 'pl-10 text-left'}`}
                        />
                    </div>
                </div>
            </div>

            <div className="grid gap-4">
                {filteredPlans.length > 0 ? (
                    filteredPlans.map((plan) => (
                        <Link
                            key={plan.id}
                            href={`/moderator/action-plans/${plan.id}`}
                            className={`group flex items-center justify-between p-6 rounded-3xl bg-card border border-white/10 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all ${isRtl ? 'flex-row-reverse' : ''}`}
                        >
                            <div className={`flex items-center gap-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <div className={`h-16 w-16 rounded-2xl ${plan.status === 'SCHEDULED' ? 'bg-emerald-500/20 text-emerald-600' : 'bg-emerald-500/10 text-emerald-600'} flex items-center justify-center border border-emerald-500/20 shadow-inner`}>
                                    <Layers className="h-8 w-8" />
                                </div>
                                <div className={isRtl ? 'text-right' : 'text-left'}>
                                    <h3 className="font-black text-xl leading-none mb-1 group-hover:text-emerald-600 transition-colors">{plan.month}</h3>
                                    <div className={`flex items-center gap-2 text-sm text-muted-foreground font-bold ${isRtl ? 'flex-row-reverse' : ''}`}>
                                        <span>{plan.client?.name}</span>
                                        <span className="opacity-30">•</span>
                                        <span className={`flex items-center gap-1 ${plan.status === 'SCHEDULED' ? 'text-emerald-700' : 'text-emerald-600'}`}>
                                            <CheckCircle2 className="h-3 w-3" />
                                            {plan.status === 'SCHEDULED' ? (isRtl ? "تمت الجدولة" : "Scheduled") : (isRtl ? "معتمد" : "Approved")}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className={`flex items-center gap-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <div className="text-center px-4 hidden sm:block">
                                    <div className="text-2xl font-black">{plan.items?.length || 0}</div>
                                    <div className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">{isRtl ? "عنصر محتوى" : "ITEMS"}</div>
                                </div>
                                <div className="p-3 rounded-full bg-white/5 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-sm">
                                    {isRtl ? <ChevronRight className="h-6 w-6 rotate-180" /> : <ChevronRight className="h-6 w-6" />}
                                </div>
                            </div>
                        </Link>
                    ))
                ) : (
                    <div className="py-24 text-center rounded-3xl border-2 border-dashed border-white/5">
                        <Layers className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                        <p className="text-muted-foreground font-bold">{isRtl ? "لا توجد نتائج مطابقة لبحثك" : "No plans matching your search"}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
