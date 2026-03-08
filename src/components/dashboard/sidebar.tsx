"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserNav } from "@/components/dashboard/user-nav";
import {
    LayoutDashboard, Users, FolderKanban, BarChart3,
    MessageSquare, ShieldCheck, Trash2, Bell, Search,
    ChevronLeft, ChevronRight
} from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useEffect, useState } from "react";
import { getUnreadNotificationCount } from "@/app/actions/notification";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<string, { ar: string; en: string }> = {
    ADMIN: { ar: "مسؤول النظام", en: "Administrator" },
    AM: { ar: "مدير حساب", en: "Account Manager" },
    CLIENT: { ar: "عميل", en: "Client" },
};

export function DashboardSidebar({ role, user }: { role: string; user: any }) {
    const { t, isRtl } = useLanguage();
    const pathname = usePathname();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        getUnreadNotificationCount().then(setUnreadCount);
    }, []);

    const adminLinks = [
        { href: "/admin", label: t("common.overview"), icon: LayoutDashboard },
        { href: "/admin/clients", label: t("common.clients"), icon: Users },
        { href: "/admin/team", label: t("common.team"), icon: ShieldCheck },
        { href: "/admin/deletions", label: t("sidebar.deletions"), icon: Trash2 },
        { href: "/messages", label: t("common.messages"), icon: MessageSquare },
        { href: "/notifications", label: t("common.notifications"), icon: Bell },
    ];

    const amLinks = [
        { href: "/am", label: t("common.overview"), icon: LayoutDashboard },
        { href: "/am/clients", label: t("sidebar.my_clients"), icon: Users },
        { href: "/am/action-plans", label: t("sidebar.action_plans"), icon: FolderKanban },
        { href: "/am/reports", label: t("sidebar.reports"), icon: BarChart3 },
        { href: "/messages", label: t("common.messages"), icon: MessageSquare },
        { href: "/notifications", label: t("common.notifications"), icon: Bell },
    ];

    const clientLinks = [
        { href: "/client", label: t("common.overview"), icon: LayoutDashboard },
        { href: "/client/action-plans", label: t("sidebar.action_plans"), icon: FolderKanban },
        { href: "/client/reports", label: t("sidebar.performance"), icon: BarChart3 },
        { href: "/messages", label: t("common.messages"), icon: MessageSquare },
        { href: "/notifications", label: t("common.notifications"), icon: Bell },
    ];

    const links = role === "ADMIN" ? adminLinks : role === "AM" ? amLinks : clientLinks;

    const isActive = (href: string) => {
        if (href === "/admin" || href === "/am" || href === "/client") {
            return pathname === href;
        }
        return pathname.startsWith(href);
    };

    const roleMeta = ROLE_LABELS[role] || ROLE_LABELS.CLIENT;
    const roleLabel = isRtl ? roleMeta.ar : roleMeta.en;
    const roleColor = role === "ADMIN" ? "text-orange-400" : role === "AM" ? "text-blue-400" : "text-emerald-400";

    // In RTL: sidebar is on the right, icon appears first (rightmost), then text
    const ChevronIcon = isRtl ? ChevronLeft : ChevronRight;

    return (
        <aside className={cn(
            "w-64 bg-card/50 backdrop-blur-xl border-white/5 hidden md:flex flex-col h-full relative z-20",
            isRtl ? "border-l" : "border-r"
        )}>
            {/* Logo & Controls */}
            <div className="p-6 pb-4 space-y-4">
                <div className={cn("flex items-center justify-between", isRtl ? "flex-row-reverse" : "")}>
                    <div className="font-black text-xl tracking-tighter premium-gradient-text">MILAKNIGHT</div>
                    <div className="flex items-center gap-1">
                        <LanguageToggle />
                        <ThemeToggle />
                    </div>
                </div>

                {/* Role badge */}
                <div className={cn(
                    "text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full bg-white/5 border border-white/10 w-fit",
                    roleColor,
                    isRtl ? "self-end ml-auto" : ""
                )}>
                    {roleLabel}
                </div>

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
                        <Search className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{t("common.search")}</span>
                    </div>
                    <span className="text-[10px] font-black opacity-30 group-hover:opacity-60 transition-opacity bg-white/10 px-1.5 py-0.5 rounded">⌘K</span>
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar py-2">
                <div className={cn(
                    "text-[9px] font-black text-primary/40 uppercase tracking-[0.25em] mb-3 px-3",
                    isRtl ? "text-right" : "text-left"
                )}>
                    {t("sidebar.menu")}
                </div>

                {links.map((link) => {
                    const Icon = link.icon;
                    const active = isActive(link.href);
                    const isNotifications = link.label === t("common.notifications");

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "flex items-center justify-between px-4 py-3 rounded-2xl text-[11px] font-black transition-all duration-200 group relative overflow-hidden uppercase tracking-tight",
                                // RTL: flip entire row so icon is on the right side
                                isRtl ? "flex-row-reverse" : "flex-row",
                                active
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                                    : "text-foreground/50 hover:bg-white/8 hover:text-foreground/90"
                            )}
                        >
                            {/* Active indicator bar — right side in RTL, left side in LTR */}
                            {!active && (
                                <div className={cn(
                                    "absolute top-0 bottom-0 w-0.5 bg-primary opacity-0 group-hover:opacity-100 transition-opacity",
                                    isRtl ? "right-0" : "left-0"
                                )} />
                            )}

                            {/* Icon + Label — icon always adjacent to the edge in RTL */}
                            <div className={cn("flex items-center gap-3 relative z-10", isRtl ? "flex-row-reverse" : "flex-row")}>
                                <Icon className={cn(
                                    "h-4 w-4 transition-all duration-200 shrink-0",
                                    active ? "scale-110" : "group-hover:scale-110"
                                )} />
                                <span>{link.label}</span>
                            </div>

                            {/* Notification badge / chevron */}
                            <div className={cn("flex items-center gap-1.5 relative z-10", isRtl ? "flex-row-reverse" : "")}>
                                {isNotifications && unreadCount > 0 && (
                                    <span className={cn(
                                        "flex h-5 min-w-5 px-1 items-center justify-center rounded-full text-[9px] font-black",
                                        active ? "bg-white text-primary" : "bg-primary text-primary-foreground"
                                    )}>
                                        {unreadCount > 9 ? "9+" : unreadCount}
                                    </span>
                                )}
                                {!isNotifications && !active && (
                                    <ChevronIcon className={cn(
                                        "h-3 w-3 opacity-0 group-hover:opacity-40 transition-all",
                                        isRtl ? "translate-x-1 group-hover:translate-x-0" : "-translate-x-1 group-hover:translate-x-0"
                                    )} />
                                )}
                            </div>
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
