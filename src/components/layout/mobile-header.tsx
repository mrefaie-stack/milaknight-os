"use client";

import { useState, useEffect } from "react";
import { UserNav } from "@/components/dashboard/user-nav";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Menu, X, LayoutDashboard, Users, FolderKanban, BarChart3, MessageSquare, ShieldCheck, Trash2, Bell } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getUnreadNotificationCount } from "@/app/actions/notification";

export function MobileHeader({ role, user }: { role: string, user: any }) {
    const { t, isRtl } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        getUnreadNotificationCount().then(setUnreadCount);
    }, []);

    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

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
        <>
            <header className="h-16 border-b border-border bg-background/50 backdrop-blur-sm flex items-center justify-between px-6 md:hidden relative z-50">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 -ml-2 text-foreground/80 hover:text-primary transition-colors"
                >
                    {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>

                <div className="font-black text-xl tracking-tighter premium-gradient-text absolute left-1/2 -translate-x-1/2">
                    MILAKNIGHT
                </div>

                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <LanguageToggle />
                    {/* UserNav is handled below or we can render a minimal one */}
                    <div className="scale-90 origin-right">
                        <UserNav user={user} />
                    </div>
                </div>
            </header>

            {/* Mobile Navigation Drawer */}
            {isOpen && (
                <div className="fixed inset-0 top-16 z-40 bg-background/95 backdrop-blur-xl md:hidden overflow-y-auto">
                    <nav className="p-4 space-y-2 mt-4">
                        <div className={`text-xs font-black text-primary/40 uppercase tracking-[0.2em] mb-4 mt-2 px-4 ${isRtl ? 'text-right' : 'text-left'}`}>
                            {t("sidebar.menu")}
                        </div>
                        {links.map((link) => {
                            const Icon = link.icon;
                            const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`flex items-center justify-between px-4 py-4 rounded-xl text-base font-black transition-all ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-primary/5 text-foreground/80'} ${isRtl ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}
                                >
                                    <div className={`flex items-center gap-4 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <Icon className="h-5 w-5" />
                                        {link.label}
                                    </div>
                                    {link.label === t("common.notifications") && unreadCount > 0 && (
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-black text-primary-foreground">
                                            {unreadCount > 9 ? "9+" : unreadCount}
                                        </span>
                                    )}
                                </Link>
                            )
                        })}
                    </nav>
                </div>
            )}
        </>
    );
}
