"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserNav } from "@/components/dashboard/user-nav";
import {
    LayoutDashboard, Users, FolderKanban, BarChart3,
    MessageSquare, ShieldCheck, Trash2, Bell, Search,
    Sparkles, Plus, CalendarDays, Link2, Activity, CheckSquare,
    Layers, Newspaper, TrendingUp, Target,
    ChevronLeft, ChevronRight,
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
import {
    Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";

/* ─── Role Metadata ──────────────────────────────── */
const ROLE_LABELS: Record<string, { ar: string; en: string }> = {
    ADMIN:             { ar: "مسؤول النظام",           en: "Administrator"     },
    AM:                { ar: "مدير حساب",               en: "Account Manager"   },
    MARKETING_MANAGER: { ar: "مدير تسويق",              en: "Marketing Manager" },
    CLIENT:            { ar: "عميل",                    en: "Client"            },
    MODERATOR:         { ar: "ناشر محتوى",              en: "Moderator"         },
    CONTENT_TEAM:      { ar: "كونتنت تيم",              en: "Content Team"      },
    CONTENT_LEADER:    { ar: "كونتنت ليدر",             en: "Content Leader"    },
    ART_TEAM:          { ar: "آرت تيم",                 en: "Art Team"          },
    ART_LEADER:        { ar: "آرت ليدر",                en: "Art Leader"        },
    SEO_TEAM:          { ar: "سيو تيم",                 en: "SEO Team"          },
    SEO_LEAD:          { ar: "سيو ليد",                 en: "SEO Lead"          },
    HR_MANAGER:        { ar: "مدير الموارد البشرية",    en: "HR Manager"        },
};

const ROLE_COLORS: Record<string, string> = {
    ADMIN:             "bg-orange-500/10 text-orange-500 border-orange-500/20",
    AM:                "bg-blue-500/10 text-blue-500 border-blue-500/20",
    MARKETING_MANAGER: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    CLIENT:            "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    MODERATOR:         "bg-sky-500/10 text-sky-500 border-sky-500/20",
    CONTENT_TEAM:      "bg-violet-500/10 text-violet-500 border-violet-500/20",
    CONTENT_LEADER:    "bg-violet-500/10 text-violet-500 border-violet-500/20",
    ART_TEAM:          "bg-pink-500/10 text-pink-500 border-pink-500/20",
    ART_LEADER:        "bg-pink-500/10 text-pink-500 border-pink-500/20",
    SEO_TEAM:          "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
    SEO_LEAD:          "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
    HR_MANAGER:        "bg-rose-500/10 text-rose-500 border-rose-500/20",
};

/* ─── Link Definitions ───────────────────────────── */
type NavLink = { href: string; label: string; icon: React.ElementType };

export function DashboardSidebar({ role, user }: { role: string; user: any }) {
    const { t, isRtl } = useLanguage();
    const pathname = usePathname();
    const [unreadCount, setUnreadCount] = useState(0);
    const [clickupOverdueCount, setClickupOverdueCount] = useState(0);
    const [meetingModalOpen, setMeetingModalOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    /* Hydrate collapse state safely (after mount) */
    useEffect(() => {
        const stored = localStorage.getItem("sidebar-collapsed");
        if (stored === "true") setCollapsed(true);
    }, []);

    const toggleCollapsed = () => {
        const next = !collapsed;
        setCollapsed(next);
        localStorage.setItem("sidebar-collapsed", String(next));
    };

    useEffect(() => {
        getUnreadNotificationCount().then(setUnreadCount);
        if (role !== "CLIENT") {
            getClickupOverdueCount().then(setClickupOverdueCount).catch(() => {});
        }
    }, [role]);

    /* ── Nav Links ─────────────────────────────────── */
    const adminLinks: NavLink[] = [
        { href: "/admin",              label: t("common.overview"),                              icon: LayoutDashboard },
        { href: "/admin/clients",      label: t("common.clients"),                               icon: Users           },
        { href: "/admin/meetings",     label: isRtl ? "الاجتماعات" : "Meetings",                icon: CalendarDays    },
        { href: "/admin/services",     label: t("sidebar.services"),                             icon: Sparkles        },
        { href: "/admin/requests",     label: t("sidebar.service_requests"),                     icon: Sparkles        },
        { href: "/admin/team",         label: t("common.team"),                                  icon: ShieldCheck     },
        { href: "/admin/hr",           label: isRtl ? "الموارد البشرية" : "HR",                 icon: Users           },
        { href: "/am/action-plans",    label: t("sidebar.action_plans"),                         icon: FolderKanban    },
        { href: "/am/reports",         label: t("sidebar.reports"),                              icon: BarChart3       },
        { href: "/admin/deletions",    label: t("sidebar.deletions"),                            icon: Trash2          },
        { href: "/admin/connections",  label: isRtl ? "ربط المنصات" : "Connections",            icon: Link2           },
        { href: "/approvals",          label: isRtl ? "الموافقات" : "Approvals",                icon: CheckSquare     },
        { href: "/hr/leaves",          label: isRtl ? "إجازاتي" : "My Leaves",                  icon: CalendarDays    },
        { href: "/messages",           label: t("common.messages"),                              icon: MessageSquare   },
    ];

    const amLinks: NavLink[] = [
        { href: "/am",                 label: t("common.overview"),                              icon: LayoutDashboard },
        { href: "/am/clients",         label: t("sidebar.my_clients"),                           icon: Users           },
        { href: "/am/meetings",        label: isRtl ? "الاجتماعات" : "Meetings",                icon: CalendarDays    },
        { href: "/admin/requests",     label: t("sidebar.service_requests"),                     icon: Sparkles        },
        { href: "/am/action-plans",    label: t("sidebar.action_plans"),                         icon: FolderKanban    },
        { href: "/am/reports",         label: t("sidebar.reports"),                              icon: BarChart3       },
        { href: "/admin/connections",  label: isRtl ? "ربط المنصات" : "Connections",            icon: Link2           },
        { href: "/clickup",            label: isRtl ? "كليك أب" : "ClickUp",                    icon: Layers          },
        { href: "/approvals",          label: isRtl ? "الموافقات" : "Approvals",                icon: CheckSquare     },
        { href: "/messages",           label: t("common.messages"),                              icon: MessageSquare   },
    ];

    const clientLinks: NavLink[] = [
        { href: "/client",             label: t("common.overview"),                              icon: LayoutDashboard },
        { href: "/client/live",        label: isRtl ? "الاحصائيات الحية" : "Live Analytics",    icon: Activity        },
        { href: "/client/services",    label: t("sidebar.services"),                             icon: Sparkles        },
        { href: "/client/meetings",    label: isRtl ? "الاجتماعات" : "Meetings",                icon: CalendarDays    },
        { href: "/client/action-plans",label: t("sidebar.action_plans"),                         icon: FolderKanban    },
        { href: "/client/reports",     label: t("sidebar.performance"),                          icon: BarChart3       },
        { href: "/client/industry",    label: isRtl ? "رؤى السوق" : "Market Insights",          icon: Newspaper       },
        { href: "/client/trending",    label: isRtl ? "المواضيع الرائجة" : "Trending Topics",   icon: TrendingUp      },
        { href: "/client/competitors", label: isRtl ? "المنافسون" : "Competitors",              icon: Target          },
        { href: "/messages",           label: t("common.messages"),                              icon: MessageSquare   },
    ];

    const moderatorLinks: NavLink[] = [
        { href: "/moderator",              label: t("common.overview"),                          icon: LayoutDashboard },
        { href: "/moderator/clients",      label: t("common.clients"),                           icon: Users           },
        { href: "/moderator/action-plans", label: isRtl ? "خطط النشر" : "Publishing Plans",     icon: FolderKanban    },
        { href: "/admin/meetings",         label: isRtl ? "الاجتماعات" : "Meetings",            icon: CalendarDays    },
        { href: "/clickup",                label: isRtl ? "كليك أب" : "ClickUp",                icon: Layers          },
        { href: "/hr/leaves",              label: isRtl ? "إجازاتي" : "My Leaves",              icon: CalendarDays    },
        { href: "/messages",               label: t("common.messages"),                          icon: MessageSquare   },
    ];

    const mmLinks: NavLink[] = [
        { href: "/admin",           label: t("common.overview"),                                  icon: LayoutDashboard },
        { href: "/admin/clients",   label: t("common.clients"),                                   icon: Users           },
        { href: "/admin/meetings",  label: isRtl ? "الاجتماعات" : "Meetings",                    icon: CalendarDays    },
        { href: "/admin/approvals", label: isRtl ? "موافقات المحتوى" : "Content Approvals",       icon: CheckSquare     },
        { href: "/admin/hr",        label: isRtl ? "الموارد البشرية" : "HR",                     icon: Users           },
        { href: "/clickup",         label: isRtl ? "كليك أب" : "ClickUp",                        icon: Layers          },
        { href: "/am/action-plans", label: t("sidebar.action_plans"),                             icon: FolderKanban    },
        { href: "/am/reports",      label: t("sidebar.reports"),                                  icon: BarChart3       },
        { href: "/insights",        label: isRtl ? "استخبارات العملاء" : "Client Insights",       icon: Sparkles        },
        { href: "/approvals",       label: isRtl ? "الموافقات" : "Approvals",                    icon: CheckSquare     },
        { href: "/hr/leaves",       label: isRtl ? "إجازاتي" : "My Leaves",                      icon: CalendarDays    },
        { href: "/messages",        label: t("common.messages"),                                   icon: MessageSquare   },
    ];

    const hrManagerLinks: NavLink[] = [
        { href: "/hr-manager",           label: isRtl ? "لوحة الموارد البشرية" : "HR Dashboard", icon: LayoutDashboard },
        { href: "/hr-manager/employees", label: isRtl ? "دليل الموظفين" : "Employees",            icon: Users           },
        { href: "/hr-manager/leaves",    label: isRtl ? "طلبات الإجازات" : "Leave Requests",      icon: CalendarDays    },
        { href: "/admin/meetings",       label: isRtl ? "الاجتماعات" : "Meetings",                icon: CalendarDays    },
        { href: "/hr/leaves",            label: isRtl ? "إجازاتي" : "My Leaves",                  icon: CalendarDays    },
        { href: "/messages",             label: t("common.messages"),                               icon: MessageSquare   },
    ];

    const makeTeamLinks = (base: string): NavLink[] => [
        { href: `/${base}`,              label: t("common.overview"),                          icon: LayoutDashboard },
        { href: `/${base}/action-plans`, label: isRtl ? "خطط المحتوى" : "Content Plans",      icon: FolderKanban    },
        { href: "/admin/meetings",       label: isRtl ? "الاجتماعات" : "Meetings",            icon: CalendarDays    },
        { href: "/clickup",              label: isRtl ? "كليك أب" : "ClickUp",                icon: Layers          },
        { href: "/approvals",            label: isRtl ? "الموافقات" : "Approvals",            icon: CheckSquare     },
        { href: "/insights",             label: isRtl ? "استخبارات العملاء" : "Client Insights", icon: Sparkles      },
        { href: "/hr/leaves",            label: isRtl ? "إجازاتي" : "My Leaves",              icon: CalendarDays    },
        { href: "/messages",             label: t("common.messages"),                           icon: MessageSquare   },
    ];

    const makeLeaderLinks = (base: string): NavLink[] => [
        { href: `/${base}`,              label: t("common.overview"),                          icon: LayoutDashboard },
        { href: `/${base}/clients`,      label: t("common.clients"),                           icon: Users           },
        { href: `/${base}/action-plans`, label: isRtl ? "خطط المحتوى" : "Content Plans",      icon: FolderKanban    },
        { href: "/admin/meetings",       label: isRtl ? "الاجتماعات" : "Meetings",            icon: CalendarDays    },
        { href: "/clickup",              label: isRtl ? "كليك أب" : "ClickUp",                icon: Layers          },
        { href: "/approvals",            label: isRtl ? "الموافقات" : "Approvals",            icon: CheckSquare     },
        { href: "/insights",             label: isRtl ? "استخبارات العملاء" : "Client Insights", icon: Sparkles      },
        { href: "/hr/leaves",            label: isRtl ? "إجازاتي" : "My Leaves",              icon: CalendarDays    },
        { href: "/messages",             label: t("common.messages"),                           icon: MessageSquare   },
    ];

    const ROLE_LINKS: Record<string, NavLink[]> = {
        ART_TEAM:       makeTeamLinks("art-team"),
        ART_LEADER:     makeLeaderLinks("art-leader"),
        CONTENT_TEAM:   makeTeamLinks("content-team"),
        CONTENT_LEADER: makeLeaderLinks("content-leader"),
        SEO_TEAM:       makeTeamLinks("seo-team"),
        SEO_LEAD:       makeLeaderLinks("seo-lead"),
    };

    const links: NavLink[] =
        role === "ADMIN"             ? adminLinks
        : role === "MARKETING_MANAGER" ? mmLinks
        : role === "AM"              ? amLinks
        : role === "HR_MANAGER"      ? hrManagerLinks
        : role === "MODERATOR"       ? moderatorLinks
        : ROLE_LINKS[role]           ?? clientLinks;

    const EXACT_ROOTS = [
        "/admin", "/am", "/client", "/hr-manager",
        "/art-team", "/art-leader", "/content-team",
        "/content-leader", "/seo-team", "/seo-lead",
    ];
    const isActive = (href: string) => {
        if (EXACT_ROOTS.includes(href)) return pathname === href;
        return pathname.startsWith(href);
    };

    const roleMeta  = ROLE_LABELS[role] ?? ROLE_LABELS.CLIENT;
    const roleLabel = isRtl ? roleMeta.ar : roleMeta.en;
    const roleColor = ROLE_COLORS[role] ?? ROLE_COLORS.CLIENT;

    /* ─────────────────────────────────────────────── */
    return (
        <TooltipProvider delayDuration={200}>
            <aside
                data-slot="sidebar"
                className={cn(
                    "hidden md:flex flex-col h-full shrink-0 overflow-hidden z-20",
                    "bg-card border-border",
                    isRtl ? "border-l" : "border-r",
                    "transition-[width] duration-200 ease-in-out",
                    collapsed ? "w-16" : "w-[240px]",
                )}
            >
                {/* ── Header ── */}
                <div className={cn(
                    "shrink-0 border-b border-border flex flex-col",
                    collapsed ? "p-2 items-center gap-2" : "p-3 gap-2.5",
                )}>
                    {/* Logo row */}
                    <div className={cn(
                        "flex items-center",
                        collapsed
                            ? "justify-center"
                            : isRtl
                                ? "flex-row-reverse justify-between"
                                : "justify-between",
                    )}>
                        {collapsed ? (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="text-sm font-semibold select-none cursor-default">
                                        MK
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent side={isRtl ? "left" : "right"} sideOffset={8}>
                                    MILAKNIGHT
                                </TooltipContent>
                            </Tooltip>
                        ) : (
                            <>
                                <span className="text-[15px] font-semibold select-none">
                                    MILAKNIGHT
                                </span>
                                <div className="flex items-center gap-0.5">
                                    <LanguageToggle />
                                    <ThemeToggle />
                                </div>
                            </>
                        )}
                    </div>

                    {/* Role badge + bell */}
                    {collapsed ? (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link
                                    href="/notifications"
                                    className="relative flex items-center justify-center h-9 w-9 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                >
                                    <Bell className="h-4 w-4" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-0.5 -right-0.5 flex h-3.5 min-w-[14px] px-0.5 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
                                            {unreadCount > 9 ? "9+" : unreadCount}
                                        </span>
                                    )}
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent side={isRtl ? "left" : "right"} sideOffset={8}>
                                {isRtl ? "الإشعارات" : "Notifications"}
                                {unreadCount > 0 && ` (${unreadCount})`}
                            </TooltipContent>
                        </Tooltip>
                    ) : (
                        <div className={cn(
                            "flex items-center justify-between",
                            isRtl ? "flex-row-reverse" : "",
                        )}>
                            <span className={cn(
                                "text-[10px] font-semibold uppercase tracking-[0.06em] px-2 py-1 rounded-md border",
                                roleColor,
                            )}>
                                {roleLabel}
                            </span>
                            <Link
                                href="/notifications"
                                className="relative flex items-center justify-center h-7 w-7 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                            >
                                <Bell className="h-3.5 w-3.5" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 flex h-3.5 min-w-[14px] px-0.5 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
                                        {unreadCount > 9 ? "9+" : unreadCount}
                                    </span>
                                )}
                            </Link>
                        </div>
                    )}

                    {/* Client: meeting button */}
                    {role === "CLIENT" && !collapsed && (
                        <Button
                            size="sm"
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                            onClick={() => setMeetingModalOpen(true)}
                        >
                            <Plus className="h-3.5 w-3.5" />
                            {isRtl ? "طلب اجتماع" : "Request Meeting"}
                        </Button>
                    )}
                    {role === "CLIENT" && collapsed && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => setMeetingModalOpen(true)}
                                    className="flex items-center justify-center h-9 w-9 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side={isRtl ? "left" : "right"} sideOffset={8}>
                                {isRtl ? "طلب اجتماع" : "Request Meeting"}
                            </TooltipContent>
                        </Tooltip>
                    )}

                    {/* Search */}
                    {!collapsed ? (
                        <button
                            onClick={() => {
                                document.dispatchEvent(
                                    new KeyboardEvent("keydown", { key: "k", metaKey: true, ctrlKey: true, bubbles: true })
                                );
                            }}
                            className={cn(
                                "w-full flex items-center justify-between px-2.5 py-1.5 rounded-md",
                                "bg-muted/60 border border-border hover:bg-muted transition-colors",
                                "text-muted-foreground text-xs",
                                isRtl ? "flex-row-reverse" : "",
                            )}
                        >
                            <div className={cn("flex items-center gap-1.5", isRtl ? "flex-row-reverse" : "")}>
                                <Search className="h-3.5 w-3.5 shrink-0" />
                                <span className="font-medium">{t("common.search")}</span>
                            </div>
                            <kbd className="hidden sm:flex text-[9px] font-medium bg-background border border-border rounded px-1 py-0.5 text-muted-foreground/60">
                                ⌘K
                            </kbd>
                        </button>
                    ) : (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => {
                                        document.dispatchEvent(
                                            new KeyboardEvent("keydown", { key: "k", metaKey: true, ctrlKey: true, bubbles: true })
                                        );
                                    }}
                                    className="flex items-center justify-center h-9 w-9 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                >
                                    <Search className="h-4 w-4" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side={isRtl ? "left" : "right"} sideOffset={8}>
                                {t("common.search")}
                            </TooltipContent>
                        </Tooltip>
                    )}
                </div>

                {/* ── Navigation ── */}
                <nav className="flex-1 p-2 overflow-y-auto custom-scrollbar space-y-0.5">
                    {!collapsed && (
                        <p className={cn("section-label px-2 py-1.5 mb-0.5", isRtl ? "text-right" : "")}>
                            {t("sidebar.menu")}
                        </p>
                    )}

                    {links.map((link) => {
                        const Icon = link.icon;
                        const active = isActive(link.href);
                        const isClickup = link.href === "/clickup";
                        const showBadge = (link.href === "/notifications" && unreadCount > 0)
                            || (isClickup && clickupOverdueCount > 0);
                        const badgeCount = isClickup ? clickupOverdueCount : unreadCount;
                        const badgeDanger = isClickup && clickupOverdueCount > 0;

                        const itemEl = (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "relative flex items-center rounded-md transition-colors duration-150 outline-none",
                                    "focus-visible:ring-2 focus-visible:ring-ring",
                                    collapsed
                                        ? "h-9 w-9 justify-center mx-auto"
                                        : cn(
                                            "gap-2.5 px-2.5 py-2 w-full",
                                            isRtl ? "flex-row-reverse" : "",
                                        ),
                                    active
                                        ? "bg-primary/8 text-primary"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                )}
                            >
                                {/* Active indicator bar */}
                                {active && !collapsed && (
                                    <span className={cn(
                                        "absolute top-1.5 bottom-1.5 w-[3px] rounded-full bg-primary",
                                        isRtl ? "right-0" : "left-0",
                                    )} />
                                )}

                                <Icon className={cn(
                                    "h-4 w-4 shrink-0",
                                    active ? "text-primary" : "",
                                )} />

                                {!collapsed && (
                                    <>
                                        <span className="flex-1 truncate text-sm font-medium">{link.label}</span>
                                        {showBadge && (
                                            <span className={cn(
                                                "flex h-4 min-w-4 px-1 items-center justify-center rounded-full text-[9px] font-bold",
                                                badgeDanger
                                                    ? "bg-destructive/10 text-destructive"
                                                    : "bg-primary/10 text-primary",
                                            )}>
                                                {badgeCount > 9 ? "9+" : badgeCount}
                                            </span>
                                        )}
                                    </>
                                )}

                                {/* Collapsed dot badge */}
                                {collapsed && showBadge && (
                                    <span className={cn(
                                        "absolute top-1 right-1 h-2 w-2 rounded-full",
                                        badgeDanger ? "bg-destructive" : "bg-primary",
                                    )} />
                                )}
                            </Link>
                        );

                        if (collapsed) {
                            return (
                                <Tooltip key={link.href}>
                                    <TooltipTrigger asChild>{itemEl}</TooltipTrigger>
                                    <TooltipContent side={isRtl ? "left" : "right"} sideOffset={8} className="flex items-center gap-1.5">
                                        {link.label}
                                        {showBadge && (
                                            <span className={cn(
                                                "flex h-4 min-w-4 px-1 items-center justify-center rounded-full text-[9px] font-bold",
                                                badgeDanger ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground",
                                            )}>
                                                {badgeCount > 9 ? "9+" : badgeCount}
                                            </span>
                                        )}
                                    </TooltipContent>
                                </Tooltip>
                            );
                        }

                        return itemEl;
                    })}
                </nav>

                {/* ── Footer ── */}
                <div className={cn(
                    "shrink-0 border-t border-border p-2 flex flex-col gap-1",
                )}>
                    {/* Collapse toggle */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={toggleCollapsed}
                                className={cn(
                                    "flex items-center justify-center rounded-md h-7",
                                    "hover:bg-muted transition-colors text-muted-foreground hover:text-foreground",
                                    collapsed ? "w-9 mx-auto" : "w-full gap-2 px-2.5",
                                    !collapsed && isRtl ? "flex-row-reverse" : "",
                                )}
                            >
                                {collapsed
                                    ? (isRtl ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />)
                                    : (isRtl ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />)
                                }
                                {!collapsed && (
                                    <span className="text-xs font-medium">
                                        {isRtl ? "طي الشريط الجانبي" : "Collapse sidebar"}
                                    </span>
                                )}
                            </button>
                        </TooltipTrigger>
                        {collapsed && (
                            <TooltipContent side={isRtl ? "left" : "right"} sideOffset={8}>
                                {isRtl ? "توسيع الشريط الجانبي" : "Expand sidebar"}
                            </TooltipContent>
                        )}
                    </Tooltip>

                    {/* User nav */}
                    <UserNav user={user} isRtl={isRtl} compact={collapsed} />
                </div>
            </aside>

            {role === "CLIENT" && (
                <MeetingRequestModal open={meetingModalOpen} onOpenChange={setMeetingModalOpen} />
            )}
        </TooltipProvider>
    );
}
