"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserNav } from "@/components/dashboard/user-nav";
import {
    LayoutDashboard, Users, FolderKanban, BarChart3,
    MessageSquare, ShieldCheck, Trash2, Bell, Search,
    ChevronLeft, ChevronRight, Sparkles, Plus, CalendarDays, Link2, Activity, CheckSquare, Layers, Newspaper, TrendingUp, Target
} from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useEffect, useState } from "react";
import { getUnreadNotificationCount } from "@/app/actions/notification";
import { getClickupOverdueCount } from "@/app/actions/clickup";
import { cn } from "@/lib/utils";
import { MeetingRequestModal } from "./meeting-request-modal";
import { Button } from "../ui/button";

const ROLE_LABELS: Record<string, { ar: string; en: string }> = {
    ADMIN: { ar: "مسؤول النظام", en: "Administrator" },
    AM: { ar: "مدير حساب", en: "Account Manager" },
    MARKETING_MANAGER: { ar: "مدير تسويق", en: "Marketing Manager" },
    CLIENT: { ar: "عميل", en: "Client" },
    MODERATOR: { ar: "ناشر محتوى", en: "Moderator" },
    CONTENT_TEAM: { ar: "كونتنت تيم", en: "Content Team" },
    CONTENT_LEADER: { ar: "كونتنت ليدر", en: "Content Leader" },
    ART_TEAM: { ar: "آرت تيم", en: "Art Team" },
    ART_LEADER: { ar: "آرت ليدر", en: "Art Leader" },
    SEO_TEAM: { ar: "سيو تيم", en: "SEO Team" },
    SEO_LEAD: { ar: "سيو ليد", en: "SEO Lead" },
    HR_MANAGER: { ar: "مدير الموارد البشرية", en: "HR Manager" },
};

export function DashboardSidebar({ role, user }: { role: string; user: any }) {
    const { t, isRtl } = useLanguage();
    const pathname = usePathname();
    const [unreadCount, setUnreadCount] = useState(0);
    const [clickupOverdueCount, setClickupOverdueCount] = useState(0);
    const [meetingModalOpen, setMeetingModalOpen] = useState(false);

    useEffect(() => {
        getUnreadNotificationCount().then(setUnreadCount);
        if (!["CLIENT"].includes(role)) {
            getClickupOverdueCount().then(setClickupOverdueCount).catch(() => {});
        }
    }, [role]);

    const adminLinks = [
        { href: "/admin", label: t("common.overview"), icon: LayoutDashboard },
        { href: "/admin/clients", label: t("common.clients"), icon: Users },
        { href: "/admin/meetings", label: isRtl ? "الاجتماعات" : "Meetings", icon: CalendarDays },
        { href: "/admin/services", label: t("sidebar.services"), icon: FolderKanban },
        { href: "/admin/requests", label: t("sidebar.service_requests"), icon: Sparkles },
        { href: "/admin/team", label: t("common.team"), icon: ShieldCheck },
        { href: "/admin/hr", label: isRtl ? "الموارد البشرية" : "HR", icon: Users },
        { href: "/am/action-plans", label: t("sidebar.action_plans"), icon: FolderKanban },
        { href: "/am/reports", label: t("sidebar.reports"), icon: BarChart3 },
        { href: "/admin/deletions", label: t("sidebar.deletions"), icon: Trash2 },
        { href: "/admin/connections", label: isRtl ? "ربط المنصات" : "Connections", icon: Link2 },
        { href: "/approvals", label: isRtl ? "الموافقات" : "Approvals", icon: CheckSquare },
        { href: "/hr/leaves", label: isRtl ? "إجازاتي" : "My Leaves", icon: CalendarDays },
        { href: "/messages", label: t("common.messages"), icon: MessageSquare },
    ];

    const amLinks = [
        { href: "/am",               label: t("common.overview"),                            icon: LayoutDashboard },
        { href: "/am/clients",       label: t("sidebar.my_clients"),                         icon: Users },
        { href: "/am/meetings",      label: isRtl ? "الاجتماعات" : "Meetings",              icon: CalendarDays },
        { href: "/admin/requests",   label: t("sidebar.service_requests"),                   icon: Sparkles },
        { href: "/am/action-plans",  label: t("sidebar.action_plans"),                       icon: FolderKanban },
        { href: "/am/reports",       label: t("sidebar.reports"),                            icon: BarChart3 },
        { href: "/admin/connections",label: isRtl ? "ربط المنصات" : "Connections",          icon: Link2 },
        { href: "/clickup",          label: isRtl ? "كليك أب" : "ClickUp",                 icon: Layers },
        { href: "/approvals",        label: isRtl ? "الموافقات" : "Approvals",              icon: CheckSquare },
        { href: "/messages",         label: t("common.messages"),                            icon: MessageSquare },
    ];

    const clientLinks = [
        { href: "/client", label: t("common.overview"), icon: LayoutDashboard },
        { href: "/client/live", label: isRtl ? "الاحصائيات الحية" : "Live Analytics", icon: Activity },
        { href: "/client/services", label: t("sidebar.services"), icon: Sparkles },
        { href: "/client/meetings", label: isRtl ? "الاجتماعات" : "Meetings", icon: CalendarDays },
        { href: "/client/action-plans", label: t("sidebar.action_plans"), icon: FolderKanban },
        { href: "/client/reports", label: t("sidebar.performance"), icon: BarChart3 },
        { href: "/client/industry", label: isRtl ? "رؤى السوق" : "Market Insights", icon: Newspaper },
        { href: "/client/trending", label: isRtl ? "المواضيع الرائجة" : "Trending Topics", icon: TrendingUp },
        { href: "/client/competitors", label: isRtl ? "المنافسون" : "Competitors", icon: Target },
        { href: "/messages", label: t("common.messages"), icon: MessageSquare },
    ];

    const moderatorLinks = [
        { href: "/moderator",              label: t("common.overview"),                            icon: LayoutDashboard },
        { href: "/moderator/clients",      label: t("common.clients"),                             icon: Users },
        { href: "/moderator/action-plans", label: isRtl ? "خطط النشر" : "Publishing Plans",       icon: FolderKanban },
        { href: "/clickup",                label: isRtl ? "كليك أب" : "ClickUp",                  icon: Layers },
        { href: "/hr/leaves",              label: isRtl ? "إجازاتي" : "My Leaves",                icon: CalendarDays },
        { href: "/messages",               label: t("common.messages"),                            icon: MessageSquare },
    ];

    const mmLinks = [
        { href: "/admin",           label: t("common.overview"),                            icon: LayoutDashboard },
        { href: "/admin/clients",   label: t("common.clients"),                             icon: Users },
        { href: "/admin/meetings",  label: isRtl ? "الاجتماعات" : "Meetings",              icon: CalendarDays },
        { href: "/admin/approvals", label: isRtl ? "موافقات المحتوى" : "Content Approvals",  icon: CheckSquare },
        { href: "/admin/hr",        label: isRtl ? "الموارد البشرية" : "HR",               icon: Users },
        { href: "/clickup",         label: isRtl ? "كليك أب" : "ClickUp",                 icon: Layers },
        { href: "/am/action-plans", label: t("sidebar.action_plans"),                       icon: FolderKanban },
        { href: "/am/reports",      label: t("sidebar.reports"),                            icon: BarChart3 },
        { href: "/approvals",       label: isRtl ? "الموافقات" : "Approvals",              icon: CheckSquare },
        { href: "/hr/leaves",       label: isRtl ? "إجازاتي" : "My Leaves",               icon: CalendarDays },
        { href: "/messages",        label: t("common.messages"),                            icon: MessageSquare },
    ];

    const hrManagerLinks = [
        { href: "/hr-manager",              label: isRtl ? "لوحة الموارد البشرية" : "HR Dashboard",    icon: LayoutDashboard },
        { href: "/hr-manager/employees",    label: isRtl ? "دليل الموظفين" : "Employees",              icon: Users },
        { href: "/hr-manager/leaves",       label: isRtl ? "طلبات الإجازات" : "Leave Requests",        icon: CalendarDays },
        { href: "/hr/leaves",               label: isRtl ? "إجازاتي" : "My Leaves",                    icon: CalendarDays },
        { href: "/messages",                label: t("common.messages"),                                 icon: MessageSquare },
    ];

    // Per-role dedicated sidebar links
    const makeTeamLinks = (base: string) => [
        { href: `/${base}`,              label: t("common.overview"),                          icon: LayoutDashboard },
        { href: `/${base}/action-plans`, label: isRtl ? "خطط المحتوى" : "Content Plans",      icon: FolderKanban },
        { href: "/clickup",              label: isRtl ? "كليك أب" : "ClickUp",                icon: Layers },
        { href: "/approvals",            label: isRtl ? "الموافقات" : "Approvals",            icon: CheckSquare },
        { href: "/hr/leaves",            label: isRtl ? "إجازاتي" : "My Leaves",              icon: CalendarDays },
        { href: "/messages",             label: t("common.messages"),                           icon: MessageSquare },
    ];
    const makeLeaderLinks = (base: string) => [
        { href: `/${base}`,              label: t("common.overview"),                          icon: LayoutDashboard },
        { href: `/${base}/clients`,      label: t("common.clients"),                           icon: Users },
        { href: `/${base}/action-plans`, label: isRtl ? "خطط المحتوى" : "Content Plans",      icon: FolderKanban },
        { href: "/clickup",              label: isRtl ? "كليك أب" : "ClickUp",                icon: Layers },
        { href: "/approvals",            label: isRtl ? "الموافقات" : "Approvals",            icon: CheckSquare },
        { href: "/hr/leaves",            label: isRtl ? "إجازاتي" : "My Leaves",              icon: CalendarDays },
        { href: "/messages",             label: t("common.messages"),                           icon: MessageSquare },
    ];

    const ROLE_LINKS: Record<string, typeof moderatorLinks> = {
        ART_TEAM:       makeTeamLinks("art-team"),
        ART_LEADER:     makeLeaderLinks("art-leader"),
        CONTENT_TEAM:   makeTeamLinks("content-team"),
        CONTENT_LEADER: makeLeaderLinks("content-leader"),
        SEO_TEAM:       makeTeamLinks("seo-team"),
        SEO_LEAD:       makeLeaderLinks("seo-lead"),
    };

    const links = role === "ADMIN" ? adminLinks
        : role === "MARKETING_MANAGER" ? mmLinks
        : role === "AM" ? amLinks
        : role === "HR_MANAGER" ? hrManagerLinks
        : role === "MODERATOR" ? moderatorLinks
        : ROLE_LINKS[role] ?? clientLinks;

    const EXACT_ROOTS = ["/admin", "/am", "/client", "/hr-manager",
        "/art-team", "/art-leader", "/content-team", "/content-leader", "/seo-team", "/seo-lead"];
    const isActive = (href: string) => {
        if (EXACT_ROOTS.includes(href)) return pathname === href;
        return pathname.startsWith(href);
    };

    const roleMeta = ROLE_LABELS[role] || ROLE_LABELS.CLIENT;
    const roleLabel = isRtl ? roleMeta.ar : roleMeta.en;
    const roleColor = role === "ADMIN" ? "text-orange-400"
        : (role === "AM" || role === "MARKETING_MANAGER") ? "text-blue-400"
        : role === "HR_MANAGER" ? "text-rose-400"
        : (role === "CONTENT_LEADER" || role === "ART_LEADER" || role === "SEO_LEAD") ? "text-purple-400"
        : (role === "CONTENT_TEAM" || role === "ART_TEAM" || role === "SEO_TEAM") ? "text-teal-400"
        : "text-emerald-400";

    return (
        <aside className={cn(
            "w-72 bg-card/50 backdrop-blur-xl border-white/5 hidden md:flex flex-col h-full relative z-20",
            isRtl ? "border-l" : "border-r"
        )}>
            {/* Logo & Controls */}
            <div className="p-6 pb-4 space-y-4">
                {/* Logo row — always: logo on the branding side, toggles on the other */}
                <div className={cn("flex items-center", isRtl ? "flex-row-reverse justify-between" : "justify-between")}>
                    <div className="font-black text-xl tracking-tighter premium-gradient-text">MILAKNIGHT</div>
                    <div className="flex items-center gap-1">
                        <LanguageToggle />
                        <ThemeToggle />
                    </div>
                </div>

                {/* Role badge & Global Bell */}
                <div className="flex items-center justify-between">
                    <div className={cn(
                        "text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full bg-white/5 border border-white/10 w-fit",
                        roleColor
                    )}>
                        {roleLabel}
                    </div>

                    <Link
                        href="/notifications"
                        className="relative p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/20 transition-all text-muted-foreground hover:text-primary"
                    >
                        <Bell className="h-4 w-4" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[8px] font-black text-primary-foreground">
                                {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                        )}
                    </Link>
                </div>

                {/* Client Meeting Global Button */}
                {role === "CLIENT" && (
                    <Button
                        className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest shadow-lg shadow-emerald-500/10 rounded-xl"
                        onClick={() => setMeetingModalOpen(true)}
                    >
                        <Plus className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                        {isRtl ? "طلب ميتينج" : "Request Meeting"}
                    </Button>
                )}

                {role === "CLIENT" && <MeetingRequestModal open={meetingModalOpen} onOpenChange={setMeetingModalOpen} />}

                {/* Search */}
                <button
                    onClick={() => {
                        const event = new KeyboardEvent("keydown", { key: "k", metaKey: true, ctrlKey: true });
                        document.dispatchEvent(event);
                    }}
                    className={cn(
                        "w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-muted-foreground hover:bg-white/10 hover:border-white/10 transition-all group",
                        isRtl ? "flex-row-reverse" : ""
                    )}
                >
                    <div className={cn("flex items-center gap-2", isRtl ? "flex-row-reverse" : "")}>
                        <Search className="h-3.5 w-3.5 shrink-0" />
                        <span className="text-[11px] font-black uppercase tracking-widest">{t("common.search")}</span>
                    </div>
                    <span className="text-[10px] font-black opacity-30 group-hover:opacity-60 transition-opacity bg-white/10 px-1.5 py-0.5 rounded">⌘K</span>
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto custom-scrollbar py-2">
                <div className={cn(
                    "text-[9px] font-black text-primary/40 uppercase tracking-[0.25em] mb-3 px-3 py-1",
                    isRtl ? "text-right" : "text-left"
                )}>
                    {t("sidebar.menu")}
                </div>

                {links.map((link) => {
                    const Icon = link.icon;
                    const active = isActive(link.href);
                    const isNotifications = link.label === t("common.notifications");
                    const isClickup = link.href === "/clickup";

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "relative flex items-center px-4 py-3 rounded-2xl text-[13px] font-bold transition-all duration-200 group overflow-hidden",
                                isRtl ? "flex-row-reverse" : "flex-row",
                                active
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                                    : "text-foreground/60 hover:bg-white/8 hover:text-foreground"
                            )}
                        >
                            {/* Active/hover indicator bar */}
                            {!active && (
                                <div className={cn(
                                    "absolute top-2 bottom-2 w-0.5 rounded-full bg-primary opacity-0 group-hover:opacity-60 transition-opacity",
                                    isRtl ? "right-1" : "left-1"
                                )} />
                            )}

                            {/* Icon */}
                            <Icon className={cn(
                                "h-[18px] w-[18px] shrink-0 transition-all duration-200",
                                active ? "scale-110" : "group-hover:scale-110",
                                isRtl ? "ml-3" : "mr-3"
                            )} />

                            {/* Label */}
                            <span className="flex-1 tracking-tight">{link.label}</span>

                            {/* Notification badge */}
                            {isNotifications && unreadCount > 0 && (
                                <span className={cn(
                                    "flex h-5 min-w-5 px-1 items-center justify-center rounded-full text-[9px] font-black",
                                    active ? "bg-white text-primary" : "bg-primary text-primary-foreground",
                                    isRtl ? "mr-1" : "ml-1"
                                )}>
                                    {unreadCount > 9 ? "9+" : unreadCount}
                                </span>
                            )}

                            {/* ClickUp overdue badge */}
                            {isClickup && clickupOverdueCount > 0 && (
                                <span className={cn(
                                    "flex h-5 min-w-5 px-1 items-center justify-center rounded-full text-[9px] font-black",
                                    active ? "bg-white text-red-500" : "bg-red-500 text-white",
                                    isRtl ? "mr-1" : "ml-1"
                                )}>
                                    {clickupOverdueCount > 9 ? "9+" : clickupOverdueCount}
                                </span>
                            )}

                            {/* Chevron for non-badge links */}
                            {!isNotifications && !(isClickup && clickupOverdueCount > 0) && !active && (
                                isRtl
                                    ? <ChevronLeft className="h-3.5 w-3.5 opacity-0 group-hover:opacity-40 transition-all ml-1" />
                                    : <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-40 transition-all mr-1" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User */}
            <div className="p-4 border-t border-white/5">
                <UserNav user={user} isRtl={isRtl} />
            </div>
        </aside>
    );
}
