"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users2, Crown, MessageSquare, Search } from "lucide-react";
import Link from "next/link";
import { EditTeamMemberDialog } from "./edit-am-dialog";
import { TeamDeleteButton } from "./team-delete-button";
import { ClientLoadLabel, MessageButtonLabel } from "./admin-team-ui";

const ROLE_COLORS: Record<string, { color: string; bg: string; avatar: string }> = {
    ADMIN:             { color: "text-purple-400",  bg: "bg-purple-400/10 border-purple-400/20",  avatar: "from-purple-500/30 to-purple-700/10" },
    AM:                { color: "text-blue-400",    bg: "bg-blue-400/10 border-blue-400/20",      avatar: "from-blue-500/30 to-blue-700/10" },
    ACCOUNT_MANAGER:   { color: "text-blue-400",    bg: "bg-blue-400/10 border-blue-400/20",      avatar: "from-blue-500/30 to-blue-700/10" },
    MARKETING_MANAGER: { color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20",avatar: "from-emerald-500/30 to-emerald-700/10" },
    MODERATOR:         { color: "text-orange-400",  bg: "bg-orange-400/10 border-orange-400/20",  avatar: "from-orange-500/30 to-orange-700/10" },
    HR_MANAGER:        { color: "text-rose-400",    bg: "bg-rose-400/10 border-rose-400/20",      avatar: "from-rose-500/30 to-rose-700/10" },
    CONTENT_TEAM:      { color: "text-violet-400",  bg: "bg-violet-400/10 border-violet-400/20",  avatar: "from-violet-500/30 to-violet-700/10" },
    CONTENT_LEADER:    { color: "text-violet-300",  bg: "bg-violet-500/10 border-violet-500/30",  avatar: "from-violet-600/30 to-violet-800/10" },
    ART_TEAM:          { color: "text-pink-400",    bg: "bg-pink-400/10 border-pink-400/20",      avatar: "from-pink-500/30 to-pink-700/10" },
    ART_LEADER:        { color: "text-pink-300",    bg: "bg-pink-500/10 border-pink-500/30",      avatar: "from-pink-600/30 to-pink-800/10" },
    SEO_TEAM:          { color: "text-cyan-400",    bg: "bg-cyan-400/10 border-cyan-400/20",      avatar: "from-cyan-500/30 to-cyan-700/10" },
    SEO_LEAD:          { color: "text-cyan-300",    bg: "bg-cyan-500/10 border-cyan-500/30",      avatar: "from-cyan-600/30 to-cyan-800/10" },
};

const ROLE_NAMES_AR: Record<string, string> = {
    ADMIN: "مسؤول النظام", ACCOUNT_MANAGER: "مدير حساب", AM: "مدير حساب",
    MARKETING_MANAGER: "مدير تسويق", MODERATOR: "ناشر", HR_MANAGER: "مدير الموارد البشرية",
    CONTENT_TEAM: "كونتنت تيم", CONTENT_LEADER: "كونتنت ليدر",
    ART_TEAM: "آرت تيم", ART_LEADER: "آرت ليدر",
    SEO_TEAM: "سيو تيم", SEO_LEAD: "سيو ليد",
};

const ROLE_NAMES_EN: Record<string, string> = {
    ADMIN: "Admin", ACCOUNT_MANAGER: "Account Manager", AM: "Account Manager",
    MARKETING_MANAGER: "Marketing Manager", MODERATOR: "Moderator", HR_MANAGER: "HR Manager",
    CONTENT_TEAM: "Content Team", CONTENT_LEADER: "Content Leader",
    ART_TEAM: "Art Team", ART_LEADER: "Art Leader",
    SEO_TEAM: "SEO Team", SEO_LEAD: "SEO Lead",
};

const FILTER_GROUPS = [
    { id: "all",     labelEn: "All",           labelAr: "الكل",             roles: [] as string[] },
    { id: "am",      labelEn: "Account Mgmt",  labelAr: "إدارة الحسابات",  roles: ["AM", "ACCOUNT_MANAGER"] },
    { id: "mm",      labelEn: "Marketing",     labelAr: "التسويق",          roles: ["MARKETING_MANAGER"] },
    { id: "hr",      labelEn: "HR",            labelAr: "الموارد البشرية",  roles: ["HR_MANAGER"] },
    { id: "mod",     labelEn: "Moderators",    labelAr: "الناشرون",         roles: ["MODERATOR"] },
    { id: "content", labelEn: "Content",       labelAr: "الكونتنت",         roles: ["CONTENT_TEAM", "CONTENT_LEADER"] },
    { id: "art",     labelEn: "Art",           labelAr: "الآرت",            roles: ["ART_TEAM", "ART_LEADER"] },
    { id: "seo",     labelEn: "SEO",           labelAr: "السيو",            roles: ["SEO_TEAM", "SEO_LEAD"] },
];

type Member = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    _count: { clients: number; mmClients: number };
};

type Props = {
    members: Member[];
    isAdmin: boolean;
};

export function TeamMembersGrid({ members, isAdmin }: Props) {
    const { isRtl } = useLanguage();
    const [activeFilter, setActiveFilter] = useState("all");
    const [search, setSearch] = useState("");

    const filtered = members.filter(m => {
        const group = FILTER_GROUPS.find(g => g.id === activeFilter);
        const matchesFilter = !group || group.roles.length === 0 || group.roles.includes(m.role);
        const q = search.toLowerCase();
        const matchesSearch = !q ||
            `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) ||
            m.email.toLowerCase().includes(q);
        return matchesFilter && matchesSearch;
    });

    const maxLoad = Math.max(...members.map(m => (m._count?.clients || 0) + (m._count?.mmClients || 0)), 1);

    return (
        <div className="space-y-6">
            {/* Filters + Search row */}
            <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", isRtl && "sm:flex-row-reverse")}>
                <div className="flex flex-wrap gap-2">
                    {FILTER_GROUPS.map(g => {
                        const count = g.roles.length === 0
                            ? members.length
                            : members.filter(m => g.roles.includes(m.role)).length;
                        if (g.id !== "all" && count === 0) return null;
                        return (
                            <button
                                key={g.id}
                                onClick={() => setActiveFilter(g.id)}
                                className={cn(
                                    "px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border",
                                    activeFilter === g.id
                                        ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                                        : "bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10"
                                )}
                            >
                                {isRtl ? g.labelAr : g.labelEn}
                                <span className={cn(
                                    "ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-black",
                                    activeFilter === g.id ? "bg-white/20" : "bg-white/8"
                                )}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
                <div className="relative">
                    <Search className={cn("absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 pointer-events-none", isRtl ? "right-3" : "left-3")} />
                    <Input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder={isRtl ? "ابحث بالاسم أو الإيميل..." : "Search name or email..."}
                        className={cn("h-9 w-full sm:w-60 bg-white/5 border-white/10 rounded-xl text-sm", isRtl ? "pr-9 text-right" : "pl-9")}
                    />
                </div>
            </div>

            {/* Grid */}
            {filtered.length > 0 ? (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                    <AnimatePresence mode="popLayout">
                        {filtered.map((member, i) => {
                            const rc = ROLE_COLORS[member.role] ?? ROLE_COLORS.AM;
                            const load = (member._count?.clients || 0) + (member._count?.mmClients || 0);
                            const loadPct = Math.min((load / maxLoad) * 100, 100);
                            const loadColor = loadPct > 70 ? "bg-orange-500" : loadPct > 40 ? "bg-emerald-500" : "bg-primary";
                            const initials = `${member.firstName?.charAt(0) ?? ""}${member.lastName?.charAt(0) ?? ""}`.toUpperCase();
                            const roleLabel = isRtl ? (ROLE_NAMES_AR[member.role] ?? member.role) : (ROLE_NAMES_EN[member.role] ?? member.role);
                            const showLoad = ["AM", "ACCOUNT_MANAGER", "MARKETING_MANAGER"].includes(member.role);

                            return (
                                <motion.div
                                    key={member.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.94, y: 8 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.94 }}
                                    transition={{ duration: 0.15, delay: i * 0.03 }}
                                    className="group flex flex-col rounded-3xl border border-white/8 bg-card/40 backdrop-blur-md p-6 gap-4 hover:border-primary/20 hover:shadow-xl transition-all duration-300"
                                >
                                    {/* Avatar + Name */}
                                    <div className={cn("flex items-center gap-4", isRtl && "flex-row-reverse")}>
                                        <div className={cn(
                                            "relative h-14 w-14 rounded-2xl bg-gradient-to-br flex items-center justify-center font-black text-xl shrink-0 border",
                                            rc.avatar,
                                            rc.bg.split(" ")[1] // border class
                                        )}>
                                            <span className={rc.color}>{initials || <Users2 className="h-6 w-6" />}</span>
                                            {member.role === "ADMIN" && (
                                                <Crown className="absolute -top-1.5 -right-1.5 h-4 w-4 text-yellow-400 fill-yellow-400" />
                                            )}
                                            {(member.role === "CONTENT_LEADER" || member.role === "ART_LEADER" || member.role === "SEO_LEAD") && (
                                                <span className="absolute -top-1.5 -right-1.5 text-xs">⭐</span>
                                            )}
                                        </div>
                                        <div className={cn("min-w-0", isRtl && "text-right")}>
                                            <h3 className="font-black text-lg leading-tight tracking-tight truncate">
                                                {member.firstName} {member.lastName}
                                            </h3>
                                            <p className="text-[11px] text-muted-foreground font-medium truncate">{member.email}</p>
                                        </div>
                                    </div>

                                    {/* Role Badge */}
                                    <Badge className={cn("self-start text-[10px] font-black uppercase tracking-wider border", rc.bg, rc.color)}>
                                        {roleLabel}
                                    </Badge>

                                    {/* Client Load (AM / MM only) */}
                                    {showLoad && (
                                        <div className="space-y-1.5">
                                            <ClientLoadLabel load={load} isHeavy={loadPct > 70} />
                                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${loadColor} rounded-full transition-all duration-700`}
                                                    style={{ width: `${loadPct}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className={cn("flex items-center gap-2 pt-3 border-t border-white/5 mt-auto", isRtl && "flex-row-reverse")}>
                                        <Link href={`/messages?userId=${member.id}`} className="flex-1">
                                            <Button variant="ghost" size="sm" className="w-full rounded-xl font-black text-xs h-9 hover:bg-primary/10 hover:text-primary">
                                                <MessageSquare className={cn("h-3.5 w-3.5", isRtl ? "ml-1.5" : "mr-1.5")} />
                                                <MessageButtonLabel />
                                            </Button>
                                        </Link>
                                        {isAdmin && (
                                            <>
                                                <EditTeamMemberDialog member={member} />
                                                <TeamDeleteButton memberId={member.id} memberName={`${member.firstName} ${member.lastName}`} />
                                            </>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="p-16 text-center rounded-3xl border border-dashed border-white/10 bg-card/20">
                    <Users2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                    <p className="text-muted-foreground italic font-bold">
                        {search
                            ? (isRtl ? "لا توجد نتائج للبحث." : "No results found.")
                            : (isRtl ? "لا يوجد أعضاء في هذا القسم." : "No members in this group.")}
                    </p>
                </div>
            )}
        </div>
    );
}
