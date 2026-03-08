import { getTeamMembers } from "@/app/actions/user";
import { AddTeamMemberDialog } from "@/components/admin/add-team-member";
import { EditTeamMemberDialog } from "@/components/admin/edit-am-dialog";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Users2, BarChart2, Crown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const ROLE_META: Record<string, { label: string; color: string; bg: string }> = {
    ADMIN: { label: "Admin", color: "text-purple-500", bg: "bg-purple-500/10 border-purple-500/20" },
    ACCOUNT_MANAGER: { label: "Account Manager", color: "text-primary", bg: "bg-primary/10 border-primary/20" },
    CLIENT: { label: "Client", color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20" },
};

export default async function AdminTeamPage() {
    const team = await getTeamMembers();

    const totalClients = (team as any[]).reduce((acc: number, m: any) => acc + (m._count?.clients || 0), 0);
    const maxLoad = Math.max(...(team as any[]).map((m: any) => m._count?.clients || 0), 1);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-primary/40 mb-1">Agency Team</p>
                    <h1 className="text-5xl font-black tracking-tighter premium-gradient-text uppercase">Team</h1>
                    <p className="text-muted-foreground font-medium mt-1">
                        {(team as any[]).length} members · {totalClients} total assigned clients
                    </p>
                </div>
                <AddTeamMemberDialog />
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Members", value: (team as any[]).length, color: "text-primary", bg: "bg-primary/5 border-primary/20" },
                    { label: "Account Managers", value: (team as any[]).filter((m: any) => m.role === "ACCOUNT_MANAGER").length, color: "text-blue-500", bg: "bg-blue-500/5 border-blue-500/20" },
                    { label: "Admins", value: (team as any[]).filter((m: any) => m.role === "ADMIN").length, color: "text-purple-500", bg: "bg-purple-500/5 border-purple-500/20" },
                    { label: "Clients Covered", value: totalClients, color: "text-emerald-500", bg: "bg-emerald-500/5 border-emerald-500/20" },
                ].map(s => (
                    <div key={s.label} className={`p-5 rounded-2xl border ${s.bg}`}>
                        <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60 mb-1">{s.label}</div>
                        <div className={`text-4xl font-black tracking-tighter ${s.color}`}>{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Team Cards */}
            {(team as any[]).length > 0 ? (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                    {(team as any[]).map((member: any) => {
                        const roleMeta = ROLE_META[member.role] || ROLE_META.ACCOUNT_MANAGER;
                        const load = member._count?.clients || 0;
                        const loadPct = Math.min((load / maxLoad) * 100, 100);
                        const loadColor = loadPct > 70 ? "bg-orange-500" : loadPct > 40 ? "bg-emerald-500" : "bg-primary";
                        const initials = `${member.firstName?.charAt(0) || ''}${member.lastName?.charAt(0) || ''}`.toUpperCase();

                        return (
                            <div key={member.id} className="group flex flex-col rounded-3xl border border-white/8 bg-card/40 backdrop-blur-md p-6 gap-5 hover:border-primary/20 hover:shadow-xl transition-all duration-300">
                                {/* Avatar + Name */}
                                <div className="flex items-center gap-4">
                                    <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center font-black text-primary text-xl shrink-0">
                                        {initials || <Users2 className="h-6 w-6" />}
                                        {member.role === "ADMIN" && (
                                            <Crown className="absolute -top-1.5 -right-1.5 h-4 w-4 text-yellow-400 fill-yellow-400" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-black text-lg leading-tight tracking-tight">{member.firstName} {member.lastName}</h3>
                                        <p className="text-[11px] text-muted-foreground font-medium truncate">{member.email}</p>
                                    </div>
                                </div>

                                {/* Role Badge */}
                                <Badge className={`self-start text-[10px] font-black uppercase tracking-wider border ${roleMeta.bg} ${roleMeta.color}`}>
                                    {roleMeta.label}
                                </Badge>

                                {/* Client Load */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-black">
                                        <span className="text-muted-foreground opacity-60 uppercase tracking-wider">Client Load</span>
                                        <span className={loadColor === "bg-orange-500" ? "text-orange-500" : "text-emerald-500"}>
                                            {load} Clients
                                        </span>
                                    </div>
                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                        <div className={`h-full ${loadColor} rounded-full transition-all duration-700`} style={{ width: `${loadPct}%` }} />
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                                    <Link href={`/messages?userId=${member.id}`} className="flex-1">
                                        <Button variant="ghost" size="sm" className="w-full rounded-xl font-black text-xs h-9 hover:bg-primary/10 hover:text-primary">
                                            <MessageSquare className="h-3.5 w-3.5 mr-1.5" /> Message
                                        </Button>
                                    </Link>
                                    <EditTeamMemberDialog member={member} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="p-16 text-center rounded-3xl border border-dashed border-white/10 bg-card/20">
                    <Users2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                    <p className="text-muted-foreground italic font-bold">No team members yet. Invite your first AM above.</p>
                </div>
            )}
        </div>
    );
}
