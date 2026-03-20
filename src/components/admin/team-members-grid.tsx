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

const ROLE_COLORS: Record<string, { color: string; bg: string }> = {
    ADMIN:             { color: "text-violet-500",  bg: "bg-violet-500/10" },
    AM:                { color: "text-blue-500",    bg: "bg-blue-500/10" },
    ACCOUNT_MANAGER:   { color: "text-blue-500",    bg: "bg-blue-500/10" },
    MARKETING_MANAGER: { color: "text-emerald-500", bg: "bg-emerald-500/10" },
    MODERATOR:         { color: "text-orange-500",  bg: "bg-orange-500/10" },
    HR_MANAGER:        { color: "text-rose-500",    bg: "bg-rose-500/10" },
    CONTENT_TEAM:      { color: "text-violet-500",  bg: "bg-violet-500/10" },
    CONTENT_LEADER:    { color: "text-violet-500",  bg: "bg-violet-500/10" },
    ART_TEAM:          { color: "text-pink-500",    bg: "bg-pink-500/10" },
    ART_LEADER:        { color: "text-pink-500",    bg: "bg-pink-500/10" },
    SEO_TEAM:          { color: "text-cyan-500",    bg: "bg-cyan-500/10" },
    SEO_LEAD:          { color: "text-cyan-500",    bg: "bg-cyan-500/10" },
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
        <div className="space-y-5">
            {/* Filters + Search row */}
            <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", isRtl && "sm:flex-row-reverse")}>
                <div className="flex flex-wrap gap-1.5">
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
                                    "px-3 py-1.5 rounded-md text-xs font-medium transition-colors border",
                                    activeFilter === g.id
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-background text-muted-foreground border-border hover:bg-muted",
                                )}
                            >
                                {isRtl ? g.labelAr : g.labelEn}
                                {" "}
                                <span className={cn(
                                    "px-1 py-0.5 rounded text-[9px]",
                                    activeFilter === g.id ? "bg-primary-foreground/20" : "bg-muted",
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
                        className={cn("h-9 w-full sm:w-56 text-sm", isRtl ? "pr-9 text-right" : "pl-9")}
                    />
                </div>
            </div>

            {/* Grid */}
            {filtered.length > 0 ? (
                <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                    <AnimatePresence mode="popLayout">
                        {filtered.map((member, i) => {
                            const rc = ROLE_COLORS[member.role] ?? ROLE_COLORS.AM;
                            const load     = (member._count?.clients || 0) + (member._count?.mmClients || 0);
                            const loadPct  = Math.min((load / maxLoad) * 100, 100);
                            const loadColor = loadPct > 70 ? "bg-orange-500" : loadPct > 40 ? "bg-emerald-500" : "bg-primary";
                            const initials  = `${member.firstName?.charAt(0) ?? ""}${member.lastName?.charAt(0) ?? ""}`.toUpperCase();
                            const roleLabel = isRtl ? (ROLE_NAMES_AR[member.role] ?? member.role) : (ROLE_NAMES_EN[member.role] ?? member.role);
                            const showLoad  = ["AM", "ACCOUNT_MANAGER", "MARKETING_MANAGER"].includes(member.role);

                            return (
                                <motion.div
                                    key={member.id}
                                    layout
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.15, delay: i * 0.02 }}
                                    className="flex flex-col rounded-lg border border-border bg-card p-4 gap-3 hover:bg-muted/30 transition-colors duration-150"
                                >
                                    {/* Avatar + Name */}
                                    <div className={cn("flex items-center gap-3", isRtl && "flex-row-reverse")}>
                                        <div className={cn(
                                            "relative h-10 w-10 rounded-lg flex items-center justify-center font-bold text-sm shrink-0",
                                            rc.bg,
                                        )}>
                                            <span className={rc.color}>{initials || <Users2 className="h-5 w-5" />}</span>
                                            {member.role === "ADMIN" && (
                                                <Crown className="absolute -top-1 -right-1 h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                                            )}
                                            {(member.role === "CONTENT_LEADER" || member.role === "ART_LEADER" || member.role === "SEO_LEAD") && (
                                                <span className="absolute -top-1 -right-1 text-[10px]">⭐</span>
                                            )}
                                        </div>
                                        <div className={cn("min-w-0 flex-1", isRtl && "text-right")}>
                                            <h3 className="text-sm font-semibold leading-tight truncate">
                                                {member.firstName} {member.lastName}
                                            </h3>
                                            <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                                        </div>
                                    </div>

                                    {/* Role Badge */}
                                    <Badge className={cn("self-start text-[10px]", rc.bg, rc.color)}>
                                        {roleLabel}
                                    </Badge>

                                    {/* Client Load (AM / MM only) */}
                                    {showLoad && (
                                        <div className="space-y-1.5">
                                            <ClientLoadLabel load={load} isHeavy={loadPct > 70} />
                                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className={cn("h-full rounded-full transition-all duration-500", loadColor)}
                                                    style={{ width: `${loadPct}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className={cn("flex items-center gap-2 pt-3 border-t border-border mt-auto", isRtl && "flex-row-reverse")}>
                                        <Link href={`/messages?userId=${member.id}`} className="flex-1">
                                            <Button variant="ghost" size="sm" className="w-full text-xs gap-1.5">
                                                <MessageSquare className="h-3.5 w-3.5" />
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
                <div className="p-12 text-center rounded-lg border border-dashed border-border">
                    <Users2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">
                        {search
                            ? (isRtl ? "لا توجد نتائج للبحث." : "No results found.")
                            : (isRtl ? "لا يوجد أعضاء في هذا القسم." : "No members in this group.")}
                    </p>
                </div>
            )}
        </div>
    );
}
