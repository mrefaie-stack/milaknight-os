import { getTeamMembers } from "@/app/actions/user";
import { AddTeamMemberDialog } from "@/components/admin/add-team-member";
import { AdminTeamHeader } from "@/components/admin/admin-team-ui";
import { TeamMembersGrid } from "@/components/admin/team-members-grid";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Users2, Briefcase, Megaphone, ShieldCheck, Palette, FileText, TrendingUp } from "lucide-react";

const STAT_GROUPS = [
    { key: "total",   labelEn: "Total",         labelAr: "الإجمالي",          roles: [] as string[], icon: Users2,      color: "text-primary",      bg: "bg-primary/5 border-primary/20" },
    { key: "am",      labelEn: "Account Mgmt",  labelAr: "إدارة الحسابات",   roles: ["AM", "ACCOUNT_MANAGER"], icon: Briefcase,   color: "text-blue-400",     bg: "bg-blue-500/5 border-blue-500/20" },
    { key: "mm",      labelEn: "Marketing",     labelAr: "التسويق",           roles: ["MARKETING_MANAGER"],     icon: Megaphone,   color: "text-emerald-400",  bg: "bg-emerald-500/5 border-emerald-500/20" },
    { key: "mod",     labelEn: "Moderators",    labelAr: "الناشرون",          roles: ["MODERATOR"],             icon: ShieldCheck, color: "text-orange-400",   bg: "bg-orange-500/5 border-orange-500/20" },
    { key: "content", labelEn: "Content",       labelAr: "الكونتنت",          roles: ["CONTENT_TEAM", "CONTENT_LEADER"], icon: FileText,   color: "text-violet-400",   bg: "bg-violet-500/5 border-violet-500/20" },
    { key: "art",     labelEn: "Art",           labelAr: "الآرت",             roles: ["ART_TEAM", "ART_LEADER"],          icon: Palette,    color: "text-pink-400",     bg: "bg-pink-500/5 border-pink-500/20" },
    { key: "seo",     labelEn: "SEO",           labelAr: "السيو",             roles: ["SEO_TEAM", "SEO_LEAD"],            icon: TrendingUp, color: "text-cyan-400",     bg: "bg-cyan-500/5 border-cyan-500/20" },
];

export default async function AdminTeamPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");
    if (session.user.role !== "ADMIN") redirect("/login");

    const team = await getTeamMembers();
    const totalClients = (team as any[]).reduce(
        (acc: number, m: any) => acc + (m._count?.clients || 0) + (m._count?.mmClients || 0), 0
    );

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <AdminTeamHeader memberCount={(team as any[]).length} totalClients={totalClients} />
                <AddTeamMemberDialog />
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                {STAT_GROUPS.map(s => {
                    const count = s.roles.length === 0
                        ? (team as any[]).length
                        : (team as any[]).filter((m: any) => s.roles.includes(m.role)).length;
                    const Icon = s.icon;
                    return (
                        <div key={s.key} className={`p-4 rounded-2xl border ${s.bg} flex flex-col gap-2`}>
                            <Icon className={`h-4 w-4 ${s.color} opacity-70`} />
                            <div className={`text-3xl font-black tracking-tighter ${s.color}`}>{count}</div>
                            <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60 leading-tight">
                                {s.labelEn}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Team Grid with Filters */}
            <TeamMembersGrid members={team as any[]} isAdmin={session.user.role === "ADMIN"} />
        </div>
    );
}
