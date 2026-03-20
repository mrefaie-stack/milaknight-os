"use client";

import { useLanguage } from "@/contexts/language-context";
import { Users, Search, ExternalLink, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export function ModeratorClientsUI({ clients }: { clients: any[] }) {
    const { isRtl } = useLanguage();
    const [search, setSearch] = useState("");

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.industry?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                        <Users className="h-8 w-8 text-primary" />
                        {isRtl ? "قائمة العملاء" : "Clients List"}
                    </h1>
                    <p className="text-muted-foreground font-medium">
                        {isRtl ? "عرض جميع العملاء لمتابعة خطط النشر." : "View all clients to monitor publishing plans."}
                    </p>
                </div>

                <div className="relative w-full md:w-72">
                    <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRtl ? 'right-3' : 'left-3'}`} />
                    <Input
                        placeholder={isRtl ? "بحث عن عميل..." : "Search clients..."}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className={`pl-10 rounded-xl bg-card border-border ${isRtl ? 'pr-10 pl-3' : 'pl-10'}`}
                    />
                </div>
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {filteredClients.map((client) => (
                    <div key={client.id} className="group relative p-6 rounded-xl bg-card/40 border border-border hover:border-primary/20 transition-all">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-semibold text-xl`}>
                                {client.name[0]}
                            </div>
                            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-semibold text-emerald-600 uppercase">
                                <ShieldCheck className="h-3 w-3" />
                                {client.package}
                            </div>
                        </div>

                        <div className="space-y-1 mb-6">
                            <h3 className="text-lg font-semibold tracking-tight">{client.name}</h3>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{client.industry || "—"}</p>
                        </div>

                        <div className="flex gap-2">
                            <Link
                                href={`/moderator/action-plans?clientId=${client.id}`}
                                className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-muted/30 border border-border text-[11px] font-medium section-label hover:bg-muted/50 transition-all"
                            >
                                {isRtl ? "خطط النشر" : "Publishing Plans"}
                            </Link>
                        </div>
                    </div>
                ))}

                {filteredClients.length === 0 && (
                    <div className="col-span-full py-20 text-center border-2 border-dashed border-border rounded-xl">
                        <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                        <p className="text-muted-foreground font-medium">{isRtl ? "لا توجد نتائج للبحث" : "No clients found matching your search"}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
