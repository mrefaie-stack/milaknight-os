"use client";

import { useEffect, useState } from "react";
import { UserNav } from "@/components/dashboard/user-nav";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
    LayoutDashboard, Users, FolderKanban, BarChart3,
    MessageSquare, ShieldCheck, Trash2, Bell, Sparkles, MoreHorizontal, X, Plus, Calendar,
    CheckSquare, Layers, Building2
} from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getUnreadNotificationCount } from "@/app/actions/notification";
import { cn } from "@/lib/utils";
import { MeetingRequestModal } from "@/components/dashboard/meeting-request-modal";
import { Button } from "@/components/ui/button";

export function MobileHeader({ role, user }: { role: string, user: any }) {
    const { t, isRtl } = useLanguage();
    const [isMoreOpen, setIsMoreOpen] = useState(false);
    const pathname = usePathname();
    const [unreadCount, setUnreadCount] = useState(0);
    const [meetingModalOpen, setMeetingModalOpen] = useState(false);

    useEffect(() => {
        getUnreadNotificationCount().then(setUnreadCount);
    }, []);

    useEffect(() => {
        setIsMoreOpen(false);
    }, [pathname]);

    // Primary nav (max 4 tabs shown in bottom bar)
    const adminPrimary = [
        { href: "/admin", label: t("common.overview"), icon: LayoutDashboard },
        { href: "/admin/clients", label: t("common.clients"), icon: Users },
        { href: "/messages", label: t("common.messages"), icon: MessageSquare },
    ];
    const adminMore = [
        { href: "/admin/team", label: t("common.team"), icon: ShieldCheck },
        { href: "/admin/requests", label: t("sidebar.service_requests"), icon: Sparkles },
        { href: "/admin/meetings", label: isRtl ? "الاجتماعات" : "Meetings", icon: Calendar },
        { href: "/office", label: isRtl ? "المكتب الافتراضي" : "Virtual Office", icon: Building2 },
        { href: "/admin/deletions", label: t("sidebar.deletions"), icon: Trash2 },
    ];

    const amPrimary = [
        { href: "/am", label: t("common.overview"), icon: LayoutDashboard },
        { href: "/am/clients", label: t("sidebar.my_clients"), icon: Users },
        { href: "/am/action-plans", label: t("sidebar.action_plans"), icon: FolderKanban },
        { href: "/am/reports", label: t("sidebar.reports"), icon: BarChart3 },
    ];
    const amMore = [
        { href: "/am/meetings", label: isRtl ? "الاجتماعات" : "Meetings", icon: Calendar },
        { href: "/office", label: isRtl ? "المكتب الافتراضي" : "Virtual Office", icon: Building2 },
        { href: "/messages", label: t("common.messages"), icon: MessageSquare },
    ];

    const clientPrimary = [
        { href: "/client", label: t("common.overview"), icon: LayoutDashboard },
        { href: "/client/action-plans", label: t("sidebar.action_plans"), icon: FolderKanban },
        { href: "/client/reports", label: t("sidebar.performance"), icon: BarChart3 },
    ];
    const clientMore = [
        { href: "/client/meetings", label: isRtl ? "الاجتماعات" : "Meetings", icon: Calendar },
        { href: "/messages", label: t("common.messages"), icon: MessageSquare },
    ];

    const moderatorPrimary = [
        { href: "/moderator", label: t("common.overview"), icon: LayoutDashboard },
        { href: "/moderator/clients", label: t("common.clients"), icon: Users },
        { href: "/moderator/action-plans", label: isRtl ? "خطط النشر" : "Publishing", icon: FolderKanban },
        { href: "/messages", label: t("common.messages"), icon: MessageSquare },
    ];

    const mmPrimary = [
        { href: "/admin", label: t("common.overview"), icon: LayoutDashboard },
        { href: "/admin/clients", label: t("common.clients"), icon: Users },
        { href: "/admin/approvals", label: isRtl ? "الموافقات" : "Approvals", icon: CheckSquare },
        { href: "/messages", label: t("common.messages"), icon: MessageSquare },
    ];
    const mmMore = [
        { href: "/am/action-plans", label: t("sidebar.action_plans"), icon: FolderKanban },
        { href: "/am/reports", label: t("sidebar.reports"), icon: BarChart3 },
        { href: "/admin/meetings", label: isRtl ? "الاجتماعات" : "Meetings", icon: Calendar },
        { href: "/clickup", label: isRtl ? "كليك أب" : "ClickUp", icon: Layers },
    ];

    const LEADER_ROLES = ["CONTENT_LEADER", "ART_LEADER", "SEO_LEAD"];
    const TEAM_ROLES = ["CONTENT_TEAM", "ART_TEAM", "SEO_TEAM"];
    const isTeamRole = LEADER_ROLES.includes(role) || TEAM_ROLES.includes(role) || role === "MODERATOR";
    const primaryLinks = role === "ADMIN" ? adminPrimary
        : role === "AM" ? amPrimary
        : role === "MARKETING_MANAGER" ? mmPrimary
        : isTeamRole ? moderatorPrimary
        : clientPrimary;
    const moreLinks = role === "ADMIN" ? adminMore
        : role === "AM" ? amMore
        : role === "MARKETING_MANAGER" ? mmMore
        : isTeamRole ? [
            { href: "/clickup", label: isRtl ? "كليك أب" : "ClickUp", icon: Layers },
            { href: "/hr/leaves", label: isRtl ? "إجازاتي" : "My Leaves", icon: Calendar },
            { href: "/office", label: isRtl ? "المكتب الافتراضي" : "Virtual Office", icon: Building2 },
        ]
        : clientMore;

    const isActive = (href: string) => {
        if (href === "/admin" || href === "/am" || href === "/client") return pathname === href;
        return pathname.startsWith(href);
    };

    return (
        <>
            {/* Top bar — visible on mobile only */}
            <header className={cn(
                "h-14 border-b border-border bg-background/60 backdrop-blur-xl flex items-center justify-between px-4 md:hidden relative z-50 shrink-0",
            )}>
                <div className="flex-1 flex items-center justify-start">
                    <UserNav user={user} isRtl={isRtl} compact={true} />
                </div>

                {/* Center: Logo */}
                <div className="font-black text-lg tracking-tighter premium-gradient-text absolute left-1/2 -translate-x-1/2 pointer-events-none">
                    MILAKNIGHT
                </div>

                {/* Right: Bell */}
                <div className="flex-1 flex items-center justify-end">
                    <Link href="/notifications" className="relative p-2 text-muted-foreground hover:text-primary transition-colors">
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 flex h-3.5 min-w-[14px] px-0.5 items-center justify-center rounded-full bg-primary text-[7px] font-black text-primary-foreground border-2 border-background">
                                {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                        )}
                    </Link>
                </div>
            </header>

            {/* Client FAB for Request Meeting */}
            {role === "CLIENT" && (
                <button
                    onClick={() => setMeetingModalOpen(true)}
                    className={cn(
                        "fixed bottom-20 z-[60] flex items-center justify-center h-14 w-14 rounded-full bg-emerald-600 text-white shadow-2xl shadow-emerald-500/40 border border-emerald-500/20 active:scale-90 transition-transform",
                        isRtl ? "left-4" : "right-4"
                    )}
                >
                    <Calendar className="h-6 w-6" />
                </button>
            )}

            {role === "CLIENT" && <MeetingRequestModal open={meetingModalOpen} onOpenChange={setMeetingModalOpen} />}

            {/* "More" drawer overlay */}
            {isMoreOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
                    onClick={() => setIsMoreOpen(false)}
                >
                    <div
                        className="absolute bottom-16 left-2 right-2 bg-card border border-white/10 rounded-2xl p-2 shadow-2xl overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Settings & Config */}
                        <div className="p-3 border-b border-white/5 bg-white/5 mb-2">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/50">
                                    {isRtl ? "الإعدادات" : "Settings"}
                                </span>
                                <button onClick={() => setIsMoreOpen(false)} className="text-muted-foreground hover:text-foreground">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <div className="flex-1 p-2 rounded-xl bg-background/50 border border-white/5 flex items-center justify-between">
                                    <span className="text-xs font-bold text-muted-foreground">{isRtl ? "المظهر" : "Theme"}</span>
                                    <ThemeToggle />
                                </div>
                                <div className="flex-1 p-2 rounded-xl bg-background/50 border border-white/5 flex items-center justify-between">
                                    <span className="text-xs font-bold text-muted-foreground">{isRtl ? "اللغة" : "Language"}</span>
                                    <LanguageToggle />
                                </div>
                            </div>
                        </div>

                        {moreLinks.length > 0 && (
                            <div className="px-3 py-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/50 block mb-2">
                                    {isRtl ? "المزيد" : "More"}
                                </span>
                            </div>
                        )}
                        {moreLinks.map((link) => {
                            const Icon = link.icon;
                            const active = isActive(link.href);
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                                        isRtl ? "flex-row-reverse" : "",
                                        active ? "bg-primary text-primary-foreground" : "hover:bg-white/5 text-foreground/70"
                                    )}
                                >
                                    <Icon className="h-5 w-5 shrink-0" />
                                    <span>{link.label}</span>
                                    {link.href === "/notifications" && unreadCount > 0 && (
                                        <span className="ml-auto flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-primary text-[9px] font-black text-primary-foreground">
                                            {unreadCount > 9 ? "9+" : unreadCount}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Bottom Tab Bar — visible on mobile only */}
            <nav className={cn(
                "fixed bottom-0 left-0 right-0 h-16 z-50 md:hidden",
                "bg-background/80 backdrop-blur-2xl border-t border-white/8",
                "flex items-stretch",
                isRtl ? "flex-row-reverse" : ""
            )}>
                {primaryLinks.map((link) => {
                    const Icon = link.icon;
                    const active = isActive(link.href);
                    const isNotifications = link.href === "/notifications";

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "flex-1 flex flex-col items-center justify-center gap-0.5 text-[9px] font-black uppercase tracking-widest transition-all duration-200 relative",
                                active
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {active && (
                                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-b-full" />
                            )}
                            <div className={cn(
                                "relative flex items-center justify-center w-9 h-9 rounded-2xl transition-all",
                                active ? "bg-primary/10" : ""
                            )}>
                                <Icon className={cn("h-5 w-5 transition-transform", active ? "scale-110" : "")} />
                                {isNotifications && unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-0.5 items-center justify-center rounded-full bg-primary text-[8px] font-black text-primary-foreground">
                                        {unreadCount > 9 ? "9+" : unreadCount}
                                    </span>
                                )}
                            </div>
                            <span className="leading-none">{link.label}</span>
                        </Link>
                    );
                })}

                {/* More button — always shown for settings */}
                <button
                    onClick={() => setIsMoreOpen(!isMoreOpen)}
                    className={cn(
                        "flex-1 flex flex-col items-center justify-center gap-0.5 text-[9px] font-black uppercase tracking-widest transition-all duration-200",
                        isMoreOpen ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <div className={cn(
                        "flex items-center justify-center w-9 h-9 rounded-2xl transition-all",
                        isMoreOpen ? "bg-primary/10" : ""
                    )}>
                        <MoreHorizontal className="h-5 w-5" />
                    </div>
                    <span className="leading-none">{isRtl ? "المزيد" : "More"}</span>
                </button>
            </nav>
        </>
    );
}
