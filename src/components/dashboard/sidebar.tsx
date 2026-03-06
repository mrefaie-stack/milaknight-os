"use client";

import { getUnreadNotificationCount } from "@/app/actions/notification";
import Link from "next/link";
import { UserNav } from "@/components/dashboard/user-nav";
import { LayoutDashboard, Users, FolderKanban, BarChart3, MessageSquare, ShieldCheck, Trash2, Bell, Search } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useEffect, useState } from "react";

export function DashboardSidebar({ role, user }: { role: string, user: any }) {
    const { t, isRtl } = useLanguage();
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

    return (
        <aside className="w-64 bg-card/40 backdrop-blur-xl border-r border-white/5 hidden md:flex flex-col h-full relative z-20">
            <div className="p-8 pb-4 flex flex-col items-center justify-center gap-4">
                <div className="flex items-center justify-between w-full">
                    <div className={`font-black text-2xl tracking-tighter premium-gradient-text`}>
                        MILAKNIGHT
                    </div>
                </div>
                <div className="flex items-center gap-2 w-full">
                    <div className="h-1 w-8 bg-primary rounded-full" />
                    <LanguageToggle />
                    <ThemeToggle />
                </div>

                <button
                    onClick={() => {
                        const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true });
                        document.dispatchEvent(event);
                    }}
                    className="w-full mt-4 flex items-center justify-between px-4 py-3 rounded-2xl bg-white/5 border border-white/5 text-muted-foreground hover:bg-white/10 transition-all group"
                >
                    <div className="flex items-center gap-2">
                        <Search className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{t("common.search")}</span>
                    </div>
                    <span className="text-[10px] font-black opacity-30 group-hover:opacity-100 transition-opacity">⌘K</span>
                </button>
            </div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
                <div className={`text-[10px] font-black text-primary/40 uppercase tracking-[0.2em] mb-4 mt-2 px-4 ${isRtl ? 'text-right' : 'text-left'}`}>
                    {t("sidebar.menu")}
                </div>
                {links.map((link) => {
                    const Icon = link.icon;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-black transition-all duration-300 hover:bg-primary/10 hover:text-primary text-foreground/60 group relative overflow-hidden uppercase tracking-tight ${isRtl ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}
                        >
                            <div className={`flex items-center gap-3 relative z-10 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                                <Icon className="h-4 w-4 transition-transform group-hover:scale-110 group-hover:rotate-3" />
                                {link.label}
                            </div>
                            {link.label === t("common.notifications") && unreadCount > 0 && (
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-black text-primary-foreground group-hover:scale-110 transition-transform">
                                    {unreadCount > 9 ? "9+" : unreadCount}
                                </span>
                            )}
                            {/* Hover highlight line */}
                            <div className={`absolute top-0 bottom-0 w-1 bg-primary opacity-0 group-hover:opacity-100 transition-opacity ${isRtl ? 'right-0' : 'left-0'}`} />
                        </Link>
                    )
                })}
            </nav>
            <div className={`p-6 border-t border-white/5 bg-white/5`}>
                <UserNav user={user} />
            </div>
        </aside>
    );
}
