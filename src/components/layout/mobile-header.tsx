"use client";

import { useEffect, useState, useRef } from "react";
import { UserNav } from "@/components/dashboard/user-nav";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
    LayoutDashboard, Users, FolderKanban, BarChart3,
    MessageSquare, ShieldCheck, Trash2, Bell, Sparkles,
    X, Calendar, CheckSquare, Layers, Building2, UserCog,
    Newspaper, TrendingUp, Target, Activity, MoreHorizontal,
    ChevronUp, Bot,
} from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getUnreadNotificationCount } from "@/app/actions/notification";
import { cn } from "@/lib/utils";
import { MeetingRequestModal } from "@/components/dashboard/meeting-request-modal";

type NavLink = { href: string; label: string; icon: React.ElementType };

export function MobileHeader({ role, user, mobileAiOpen, onAiToggle }: {
    role: string;
    user: any;
    mobileAiOpen?: boolean;
    onAiToggle?: () => void;
}) {
    const { t, isRtl } = useLanguage();
    const [isMoreOpen, setIsMoreOpen] = useState(false);
    const pathname = usePathname();
    const [unreadCount, setUnreadCount] = useState(0);
    const [meetingModalOpen, setMeetingModalOpen] = useState(false);
    const drawerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        getUnreadNotificationCount().then(setUnreadCount);
    }, []);

    useEffect(() => {
        setIsMoreOpen(false);
    }, [pathname]);

    /* ── Primary tabs (max 4) ───────────────────── */
    const adminPrimary: NavLink[] = [
        { href: "/admin",         label: t("common.overview"),  icon: LayoutDashboard },
        { href: "/admin/clients", label: t("common.clients"),   icon: Users           },
        { href: "/messages",      label: t("common.messages"),  icon: MessageSquare   },
    ];
    const adminMore: NavLink[] = [
        { href: "/admin/team",       label: t("common.team"),                                 icon: ShieldCheck },
        { href: "/admin/requests",   label: t("sidebar.service_requests"),                    icon: Sparkles    },
        { href: "/admin/meetings",   label: isRtl ? "الاجتماعات" : "Meetings",               icon: Calendar    },
        { href: "/office",           label: isRtl ? "المكتب الافتراضي" : "Virtual Office",   icon: Building2   },
        { href: "/admin/deletions",  label: t("sidebar.deletions"),                           icon: Trash2      },
    ];

    const amPrimary: NavLink[] = [
        { href: "/am",              label: t("common.overview"),      icon: LayoutDashboard },
        { href: "/am/clients",      label: t("sidebar.my_clients"),   icon: Users           },
        { href: "/am/action-plans", label: t("sidebar.action_plans"), icon: FolderKanban    },
        { href: "/am/reports",      label: t("sidebar.reports"),      icon: BarChart3       },
    ];
    const amMore: NavLink[] = [
        { href: "/am/meetings",  label: isRtl ? "الاجتماعات" : "Meetings",             icon: Calendar      },
        { href: "/office",       label: isRtl ? "المكتب الافتراضي" : "Virtual Office", icon: Building2     },
        { href: "/messages",     label: t("common.messages"),                            icon: MessageSquare },
    ];

    const clientPrimary: NavLink[] = [
        { href: "/client",              label: t("common.overview"),      icon: LayoutDashboard },
        { href: "/client/action-plans", label: t("sidebar.action_plans"), icon: FolderKanban    },
        { href: "/client/reports",      label: t("sidebar.performance"),  icon: BarChart3       },
        { href: "/client/live",         label: isRtl ? "احصائيات" : "Live", icon: Activity     },
    ];
    const clientMore: NavLink[] = [
        { href: "/client/services",    label: t("sidebar.services"),                           icon: Sparkles      },
        { href: "/client/meetings",    label: isRtl ? "الاجتماعات" : "Meetings",              icon: Calendar      },
        { href: "/client/industry",    label: isRtl ? "رؤى السوق" : "Market Insights",        icon: Newspaper     },
        { href: "/client/trending",    label: isRtl ? "المواضيع الرائجة" : "Trending Topics", icon: TrendingUp    },
        { href: "/client/competitors", label: isRtl ? "المنافسون" : "Competitors",            icon: Target        },
        { href: "/messages",           label: t("common.messages"),                             icon: MessageSquare },
    ];

    const moderatorPrimary: NavLink[] = [
        { href: "/moderator",              label: t("common.overview"),                icon: LayoutDashboard },
        { href: "/moderator/clients",      label: t("common.clients"),                 icon: Users           },
        { href: "/moderator/action-plans", label: isRtl ? "خطط النشر" : "Publishing", icon: FolderKanban    },
        { href: "/messages",               label: t("common.messages"),                icon: MessageSquare   },
    ];

    const mmPrimary: NavLink[] = [
        { href: "/admin",           label: t("common.overview"),                               icon: LayoutDashboard },
        { href: "/admin/clients",   label: t("common.clients"),                                icon: Users           },
        { href: "/admin/approvals", label: isRtl ? "موافقات المحتوى" : "Content Approvals",   icon: CheckSquare     },
        { href: "/messages",        label: t("common.messages"),                               icon: MessageSquare   },
    ];
    const mmMore: NavLink[] = [
        { href: "/approvals",       label: isRtl ? "الموافقات" : "Approvals",    icon: CheckSquare },
        { href: "/am/action-plans", label: t("sidebar.action_plans"),             icon: FolderKanban},
        { href: "/am/reports",      label: t("sidebar.reports"),                  icon: BarChart3   },
        { href: "/admin/meetings",  label: isRtl ? "الاجتماعات" : "Meetings",    icon: Calendar    },
        { href: "/clickup",         label: isRtl ? "كليك أب" : "ClickUp",        icon: Layers      },
    ];

    const hrManagerPrimary: NavLink[] = [
        { href: "/hr-manager",           label: isRtl ? "الرئيسية" : "HR Home",   icon: LayoutDashboard },
        { href: "/hr-manager/employees", label: isRtl ? "الموظفون" : "Employees", icon: Users           },
        { href: "/hr-manager/leaves",    label: isRtl ? "الإجازات" : "Leaves",    icon: Calendar        },
        { href: "/messages",             label: isRtl ? "الرسائل" : "Messages",    icon: MessageSquare   },
    ];
    const hrManagerMore: NavLink[] = [
        { href: "/office",    label: isRtl ? "المكتب الافتراضي" : "Virtual Office", icon: Building2 },
        { href: "/hr/leaves", label: isRtl ? "إجازاتي" : "My Leaves",              icon: UserCog   },
    ];

    const makeTeamPrimary = (base: string): NavLink[] => [
        { href: `/${base}`,              label: t("common.overview"),            icon: LayoutDashboard },
        { href: `/${base}/action-plans`, label: isRtl ? "خطط المحتوى" : "Plans", icon: FolderKanban   },
        { href: "/messages",             label: isRtl ? "الرسائل" : "Messages",  icon: MessageSquare   },
    ];
    const makeTeamMore = (): NavLink[] => [
        { href: "/approvals", label: isRtl ? "الموافقات" : "Approvals",             icon: CheckSquare },
        { href: "/clickup",   label: isRtl ? "كليك أب" : "ClickUp",                icon: Layers      },
        { href: "/hr/leaves", label: isRtl ? "إجازاتي" : "My Leaves",              icon: Calendar    },
        { href: "/office",    label: isRtl ? "المكتب الافتراضي" : "Virtual Office", icon: Building2   },
    ];
    const makeLeaderPrimary = (base: string): NavLink[] => [
        { href: `/${base}`,              label: t("common.overview"),              icon: LayoutDashboard },
        { href: `/${base}/clients`,      label: t("common.clients"),               icon: Users           },
        { href: `/${base}/action-plans`, label: isRtl ? "خطط المحتوى" : "Plans",  icon: FolderKanban    },
        { href: "/messages",             label: isRtl ? "الرسائل" : "Messages",   icon: MessageSquare   },
    ];

    const ROLE_PRIMARY: Record<string, NavLink[]> = {
        MODERATOR:       moderatorPrimary,
        ART_TEAM:        makeTeamPrimary("art-team"),
        ART_LEADER:      makeLeaderPrimary("art-leader"),
        CONTENT_TEAM:    makeTeamPrimary("content-team"),
        CONTENT_LEADER:  makeLeaderPrimary("content-leader"),
        SEO_TEAM:        makeTeamPrimary("seo-team"),
        SEO_LEAD:        makeLeaderPrimary("seo-lead"),
    };
    const ROLE_MORE: Record<string, NavLink[]> = {
        MODERATOR:       [
            { href: "/clickup",   label: isRtl ? "كليك أب" : "ClickUp",                icon: Layers    },
            { href: "/hr/leaves", label: isRtl ? "إجازاتي" : "My Leaves",              icon: Calendar  },
            { href: "/office",    label: isRtl ? "المكتب الافتراضي" : "Virtual Office", icon: Building2 },
        ],
        ART_TEAM:        makeTeamMore(),
        ART_LEADER:      makeTeamMore(),
        CONTENT_TEAM:    makeTeamMore(),
        CONTENT_LEADER:  makeTeamMore(),
        SEO_TEAM:        makeTeamMore(),
        SEO_LEAD:        makeTeamMore(),
    };

    const primaryLinks: NavLink[] =
        role === "ADMIN"             ? adminPrimary
        : role === "AM"              ? amPrimary
        : role === "MARKETING_MANAGER"? mmPrimary
        : role === "HR_MANAGER"      ? hrManagerPrimary
        : ROLE_PRIMARY[role]         ?? clientPrimary;

    const moreLinks: NavLink[] =
        role === "ADMIN"             ? adminMore
        : role === "AM"              ? amMore
        : role === "MARKETING_MANAGER"? mmMore
        : role === "HR_MANAGER"      ? hrManagerMore
        : ROLE_MORE[role]            ?? clientMore;

    const EXACT_ROOTS = [
        "/admin", "/am", "/client", "/hr-manager",
        "/art-team", "/art-leader", "/content-team",
        "/content-leader", "/seo-team", "/seo-lead",
    ];
    const isActive = (href: string) => {
        if (EXACT_ROOTS.includes(href)) return pathname === href;
        return pathname.startsWith(href);
    };

    /* ─────────────────────────────────────────────── */
    return (
        <>
            {/* ── Top bar ── */}
            <header
                data-mobile="true"
                className={cn(
                    "h-12 border-b border-border bg-card flex items-center justify-between px-4 md:hidden relative z-50 shrink-0",
                )}
            >
                {/* Left: user avatar */}
                <div className="flex items-center">
                    <UserNav user={user} isRtl={isRtl} compact={true} />
                </div>

                {/* Center: brand */}
                <span className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold pointer-events-none select-none">
                    MILAKNIGHT
                </span>

                {/* Right: bell */}
                <Link
                    href="/notifications"
                    className="relative flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                >
                    <Bell className="h-4.5 w-4.5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-3.5 min-w-[14px] px-0.5 items-center justify-center rounded-full bg-primary text-[7px] font-bold text-primary-foreground border-[1.5px] border-card">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </Link>
            </header>

            {/* ── Client FAB ── */}
            {role === "CLIENT" && (
                <button
                    onClick={() => setMeetingModalOpen(true)}
                    className={cn(
                        "fixed bottom-[72px] z-[60] flex items-center justify-center h-12 w-12 rounded-full",
                        "bg-emerald-600 text-white shadow-lg shadow-emerald-500/30",
                        "border border-emerald-500/20 active:scale-90 transition-transform md:hidden",
                        isRtl ? "left-4" : "right-4",
                    )}
                >
                    <Calendar className="h-5 w-5" />
                </button>
            )}
            {role === "CLIENT" && (
                <MeetingRequestModal open={meetingModalOpen} onOpenChange={setMeetingModalOpen} />
            )}

            {/* ── More drawer (slides up) ── */}
            {isMoreOpen && (
                <div
                    className="fixed inset-0 z-40 md:hidden"
                    onClick={() => setIsMoreOpen(false)}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/30" />

                    {/* Panel */}
                    <div
                        ref={drawerRef}
                        className={cn(
                            "absolute bottom-16 left-2 right-2 rounded-xl",
                            "bg-card border border-border shadow-[0_8px_40px_rgb(0_0_0/0.15)]",
                            "overflow-hidden",
                            "animate-in slide-in-from-bottom-3 fade-in-0 duration-200",
                        )}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Drawer header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5">
                                    <div className="p-1.5 rounded-md bg-muted">
                                        <ThemeToggle />
                                    </div>
                                    <div className="p-1.5 rounded-md bg-muted">
                                        <LanguageToggle />
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsMoreOpen(false)}
                                className="flex items-center justify-center h-7 w-7 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* More links */}
                        {moreLinks.length > 0 && (
                            <div className="p-2 space-y-0.5">
                                <p className="section-label px-3 py-1.5">
                                    {isRtl ? "المزيد" : "More"}
                                </p>
                                {moreLinks.map((link) => {
                                    const Icon = link.icon;
                                    const active = isActive(link.href);
                                    return (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                                isRtl ? "flex-row-reverse" : "",
                                                active
                                                    ? "bg-primary/8 text-primary"
                                                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                            )}
                                        >
                                            <Icon className="h-4 w-4 shrink-0" />
                                            <span>{link.label}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Bottom Tab Bar ── */}
            <nav
                data-mobile="true"
                className={cn(
                    "fixed bottom-0 left-0 right-0 z-50 h-16 md:hidden",
                    "bg-card border-t border-border",
                    "flex items-stretch",
                    "safe-area-inset-bottom",
                    isRtl ? "flex-row-reverse" : "",
                )}
            >
                {primaryLinks.map((link) => {
                    const Icon = link.icon;
                    const active = isActive(link.href);

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "flex-1 flex flex-col items-center justify-center gap-1 relative",
                                "transition-colors duration-150",
                                active ? "text-primary" : "text-muted-foreground",
                            )}
                        >
                            {/* Active pill indicator */}
                            {active && (
                                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-8 rounded-b-full bg-primary" />
                            )}

                            {/* Icon wrapper */}
                            <div className={cn(
                                "flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-150",
                                active ? "bg-primary/10" : "",
                            )}>
                                <Icon className={cn("h-[18px] w-[18px] transition-transform", active ? "scale-110" : "")} />
                            </div>

                            <span className={cn(
                                "text-[9px] font-semibold leading-none tracking-wide",
                                active ? "text-primary" : "text-muted-foreground",
                            )}>
                                {link.label}
                            </span>
                        </Link>
                    );
                })}

                {/* AI tab */}
                {onAiToggle && (
                    <button
                        onClick={() => { onAiToggle(); setIsMoreOpen(false); }}
                        className={cn(
                            "flex-1 flex flex-col items-center justify-center gap-1 relative transition-colors duration-150",
                            mobileAiOpen ? "text-primary" : "text-muted-foreground",
                        )}
                    >
                        {mobileAiOpen && (
                            <span className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-8 rounded-b-full bg-primary" />
                        )}
                        <div className={cn(
                            "flex items-center justify-center w-8 h-8 rounded-xl transition-all",
                            mobileAiOpen ? "bg-primary/10" : "",
                        )}>
                            <Bot className="h-[18px] w-[18px]" />
                        </div>
                        <span className={cn(
                            "text-[9px] font-semibold leading-none tracking-wide",
                            mobileAiOpen ? "text-primary" : "text-muted-foreground",
                        )}>
                            AI
                        </span>
                    </button>
                )}

                {/* More tab */}
                <button
                    onClick={() => setIsMoreOpen(!isMoreOpen)}
                    className={cn(
                        "flex-1 flex flex-col items-center justify-center gap-1 relative transition-colors duration-150",
                        isMoreOpen ? "text-primary" : "text-muted-foreground",
                    )}
                >
                    {isMoreOpen && (
                        <span className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-8 rounded-b-full bg-primary" />
                    )}
                    <div className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-xl transition-all",
                        isMoreOpen ? "bg-primary/10" : "",
                    )}>
                        {isMoreOpen
                            ? <ChevronUp className="h-[18px] w-[18px]" />
                            : <MoreHorizontal className="h-[18px] w-[18px]" />
                        }
                    </div>
                    <span className="text-[9px] font-semibold leading-none tracking-wide">
                        {isRtl ? "المزيد" : "More"}
                    </span>
                </button>
            </nav>
        </>
    );
}
