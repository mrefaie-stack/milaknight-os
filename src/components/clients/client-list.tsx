"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EditClientDialog } from "@/components/admin/edit-client-dialog";
import { ArrowRight, User2, BarChart2, Users2 } from "lucide-react";
import { useState } from "react";

const PACKAGE_COLORS: Record<string, string> = {
    STARTER: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    GROWTH: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    PREMIUM: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    ENTERPRISE: "bg-orange-500/10 text-orange-500 border-orange-500/20",
};

export function ClientList({ clients, accountManagers }: { clients: any[], accountManagers?: any[] }) {
    const [search, setSearch] = useState("");

    const filtered = clients.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.industry || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.accountManager?.firstName || "").toLowerCase().includes(search.toLowerCase())
    );

    if (clients.length === 0) {
        return (
            <div className="border border-dashed rounded-3xl p-16 text-center flex flex-col items-center justify-center space-y-3 bg-card/20">
                <div className="h-16 w-16 rounded-full bg-primary/5 flex items-center justify-center mb-2">
                    <Users2 className="h-8 w-8 text-primary opacity-30" />
                </div>
                <h3 className="font-black text-xl tracking-tight">No clients yet</h3>
                <p className="text-muted-foreground text-sm font-medium">Add your first client to get started.</p>
            </div>
        );
    }

    // Determine base path
    const isAdminPath = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
    const basePath = isAdminPath ? '/admin' : '/am';

    return (
        <div className="space-y-5">
            {/* Search bar */}
            <div className="relative">
                <input
                    type="text"
                    placeholder="Search by name, industry, or account manager..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full h-12 px-5 pr-12 rounded-2xl bg-card/50 border border-white/10 text-sm font-medium focus:outline-none focus:border-primary/40 placeholder:text-muted-foreground/50 backdrop-blur-sm"
                />
                <svg className="absolute right-4 top-3.5 h-5 w-5 text-muted-foreground opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>

            {/* Count */}
            <p className="text-xs font-black uppercase tracking-wider text-muted-foreground opacity-50">
                {filtered.length} {filtered.length === 1 ? 'Client' : 'Clients'}
            </p>

            {/* Cards Grid */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {filtered.map((client) => {
                    const latestReport = client.reports?.[0];
                    const latestPlan = client.actionPlans?.[0];
                    const pkgClass = PACKAGE_COLORS[client.package] || "bg-muted/20 text-muted-foreground border-border";

                    return (
                        <div
                            key={client.id}
                            className="group relative flex flex-col rounded-3xl border border-white/8 bg-card/40 backdrop-blur-md p-6 gap-4 hover:border-primary/20 hover:bg-card/60 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
                        >
                            {/* Top Row */}
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center font-black text-primary text-xl shrink-0">
                                        {client.name.substring(0, 1).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-lg leading-tight tracking-tight">{client.name}</h3>
                                        <p className="text-[11px] font-bold text-muted-foreground opacity-60 uppercase tracking-wider">{client.industry || "—"}</p>
                                    </div>
                                </div>
                                {client.package && (
                                    <Badge className={`text-[10px] font-black uppercase tracking-wider border ${pkgClass} shrink-0`}>
                                        {client.package}
                                    </Badge>
                                )}
                            </div>

                            {/* Stats Row */}
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="p-2 rounded-xl bg-white/5">
                                    <div className="text-[9px] font-black uppercase text-muted-foreground opacity-50 mb-0.5">AM</div>
                                    <div className="text-xs font-black truncate">{client.accountManager?.firstName || "—"}</div>
                                </div>
                                <div className="p-2 rounded-xl bg-white/5">
                                    <div className="text-[9px] font-black uppercase text-muted-foreground opacity-50 mb-0.5">Plan</div>
                                    <div className={`text-xs font-black ${latestPlan?.status === 'APPROVED' ? 'text-emerald-500' : 'text-orange-500'}`}>
                                        {latestPlan?.status || "—"}
                                    </div>
                                </div>
                                <div className="p-2 rounded-xl bg-white/5">
                                    <div className="text-[9px] font-black uppercase text-muted-foreground opacity-50 mb-0.5">Report</div>
                                    <div className={`text-xs font-black ${latestReport?.status === 'SENT' ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {latestReport?.status || "—"}
                                    </div>
                                </div>
                            </div>

                            {/* Services */}
                            {client.services?.length > 0 && (
                                <div className="flex gap-1.5 flex-wrap">
                                    {client.services.map((s: any) => (
                                        <Badge key={s.id} variant="secondary" className="text-[10px] rounded-full font-bold">{s.name}</Badge>
                                    ))}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-auto gap-2">
                                <Link href={`${basePath}/clients/${client.id}`} className="flex-1">
                                    <Button variant="ghost" size="sm" className="w-full rounded-xl font-black uppercase tracking-wide text-xs h-9 hover:bg-primary/10 hover:text-primary">
                                        View Profile <ArrowRight className="h-3 w-3 ml-1" />
                                    </Button>
                                </Link>
                                {accountManagers && (
                                    <EditClientDialog client={client} accountManagers={accountManagers} />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {filtered.length === 0 && search && (
                <div className="text-center py-12 text-muted-foreground font-bold opacity-50">
                    No results for "{search}"
                </div>
            )}
        </div>
    );
}
