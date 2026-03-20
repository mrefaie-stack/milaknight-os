"use client";

import { useLanguage } from "@/contexts/language-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    BarChart3, FolderKanban, Globe, Building, ChevronRight, ChevronLeft,
    Facebook, Instagram, Linkedin, Youtube, CheckCircle2, Clock,
    AlertCircle, Plus, Edit, Send, Package, Users, ExternalLink, MessageSquare
} from "lucide-react";
import Link from "next/link";
import { ClientBriefDialog } from "@/components/clients/client-brief-dialog";
import { cn } from "@/lib/utils";

const SOCIAL_ICONS: Record<string, any> = {
    facebook: Facebook, instagram: Instagram, linkedin: Linkedin,
    youtube: Youtube,
    tiktok: () => <span style={{ fontWeight: 700, fontSize: "10px" }}>TT</span>,
    snapchat: () => <span style={{ fontWeight: 700, fontSize: "10px" }}>SC</span>,
    website: Globe,
};
const SOCIAL_COLORS: Record<string, string> = {
    facebook: "text-blue-500", instagram: "text-pink-500", linkedin: "text-blue-400",
    youtube: "text-red-500", tiktok: "text-foreground", snapchat: "text-yellow-500",
    website: "text-emerald-500",
};

const STATUS_META: Record<string, { color: string; variant: any; icon: any }> = {
    DRAFT:             { color: "text-muted-foreground", variant: "ghost",       icon: Clock },
    PENDING:           { color: "text-warning",          variant: "warning",     icon: Clock },
    APPROVED:          { color: "text-emerald-500",      variant: "success",     icon: CheckCircle2 },
    REVISION_REQUESTED:{ color: "text-destructive",      variant: "destructive", icon: AlertCircle },
    PUBLISHED:         { color: "text-blue-500",         variant: "info",        icon: CheckCircle2 },
    SENT:              { color: "text-emerald-500",      variant: "success",     icon: CheckCircle2 },
};

const STATUS_AR: Record<string, string> = {
    DRAFT: "مسودة", PENDING: "قيد المراجعة", APPROVED: "معتمد",
    REVISION_REQUESTED: "يحتاج تعديل", PUBLISHED: "منشور", SENT: "مُرسل",
};

interface Props {
    client: any;
    basePath: "admin" | "am";
    showNewButtons?: boolean;
}

export function ClientProfileView({ client, basePath, showNewButtons = false }: Props) {
    const { isRtl } = useLanguage();

    const activeServices = client.activeServices
        ? client.activeServices.split(",").map((s: string) => s.trim()).filter(Boolean)
        : [];

    const displayBrief = isRtl
        ? (client.briefAr || client.brief)
        : (client.briefEn || client.brief);

    const rawDeliverables = isRtl
        ? (client.deliverablesAr || client.deliverables)
        : (client.deliverablesEn || client.deliverables);

    const deliverables = rawDeliverables
        ? rawDeliverables.split("\n").filter(Boolean)
        : [];

    const socialLinks = [
        { key: "website",   url: client.website },
        { key: "facebook",  url: client.facebook },
        { key: "instagram", url: client.instagram },
        { key: "linkedin",  url: client.linkedin },
        { key: "youtube",   url: client.youtube },
        { key: "tiktok",    url: client.tiktok },
        { key: "snapchat",  url: client.snapchat },
    ].filter(s => s.url);

    const totalReports    = client.reports?.length || 0;
    const totalPlans      = client.actionPlans?.length || 0;
    const approvedPlans   = client.actionPlans?.filter((p: any) => p.status === "APPROVED").length || 0;
    const pendingRevision = client.actionPlans?.filter((p: any) => p.status === "REVISION_REQUESTED").length || 0;

    const am  = client.accountManager;
    const dir = isRtl ? "rtl" : "ltr";
    const ChevronIcon = isRtl ? ChevronLeft : ChevronRight;

    const statusLabel = (status: string) => isRtl ? (STATUS_AR[status] || status) : status;

    return (
        <div className="space-y-6 max-w-5xl mx-auto" dir={dir}>

            {/* Breadcrumb */}
            <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", isRtl ? "flex-row-reverse" : "")}>
                <Link href={`/${basePath}/clients`} className="hover:text-foreground transition-colors">
                    {isRtl ? "عملائي" : "My Clients"}
                </Link>
                <ChevronIcon className="h-3.5 w-3.5" />
                <span className="text-foreground font-medium">{client.name}</span>
            </div>

            {/* Hero Header */}
            <Card>
                <CardContent className="pt-5 space-y-4">
                    <div className={cn("flex flex-col sm:flex-row sm:items-start justify-between gap-4", isRtl ? "sm:flex-row-reverse" : "")}>
                        <div className={cn("flex items-center gap-4", isRtl ? "flex-row-reverse" : "")}>
                            <div className="h-14 w-14 shrink-0 bg-primary/10 rounded-xl flex items-center justify-center border border-border overflow-hidden">
                                {client.logoUrl
                                    ? <img src={client.logoUrl} alt={client.name} className="w-full h-full object-cover" />
                                    : <Building className="h-7 w-7 text-primary" />}
                            </div>
                            <div className={cn("space-y-1", isRtl ? "text-right" : "")}>
                                <h1 className="text-xl font-bold tracking-tight">{client.name}</h1>
                                <div className={cn("flex flex-wrap items-center gap-2", isRtl ? "flex-row-reverse" : "")}>
                                    <Badge variant="ghost" className="text-[10px]">
                                        {client.package || "BASIC"}
                                    </Badge>
                                    {client.industry && (
                                        <span className="text-xs text-muted-foreground">{client.industry}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className={cn("flex flex-wrap gap-2 shrink-0", isRtl ? "flex-row-reverse" : "")}>
                            <ClientBriefDialog brief={displayBrief} />
                            {client.userId && (
                                <Link href={`/messages?userId=${client.userId}`}>
                                    <Button variant="outline" size="sm" className={cn("gap-2", isRtl ? "flex-row-reverse" : "")}>
                                        <MessageSquare className="h-3.5 w-3.5" />
                                        {isRtl ? "مراسلة" : "Message"}
                                    </Button>
                                </Link>
                            )}
                            {showNewButtons && (
                                <>
                                    <Link href={`/am/reports/create?clientId=${client.id}`}>
                                        <Button size="sm" className={cn("gap-2", isRtl ? "flex-row-reverse" : "")}>
                                            <Plus className="h-3.5 w-3.5" />
                                            {isRtl ? "تقرير جديد" : "New Report"}
                                        </Button>
                                    </Link>
                                    <Link href={`/am/action-plans/create?clientId=${client.id}`}>
                                        <Button variant="outline" size="sm" className={cn("gap-2", isRtl ? "flex-row-reverse" : "")}>
                                            <Plus className="h-3.5 w-3.5" />
                                            {isRtl ? "خطة جديدة" : "New Plan"}
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Social Links */}
                    {socialLinks.length > 0 && (
                        <div className={cn("flex flex-wrap items-center gap-1.5 pt-3 border-t border-border", isRtl ? "flex-row-reverse" : "")}>
                            <span className="section-label text-muted-foreground mr-1">
                                {isRtl ? "الحضور الرقمي:" : "Brand Presence:"}
                            </span>
                            {socialLinks.map(({ key, url }) => {
                                const Icon = SOCIAL_ICONS[key];
                                const color = SOCIAL_COLORS[key] || "text-muted-foreground";
                                return (
                                    <a key={key} href={url!} target="_blank" rel="noopener noreferrer"
                                        className={cn("p-1.5 rounded-md bg-muted hover:bg-muted/80 border border-border transition-colors", color)}>
                                        {Icon && <Icon className="h-3.5 w-3.5" />}
                                    </a>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { ar: "إجمالي التقارير", en: "Total Reports",   value: totalReports,    className: "text-blue-500" },
                    { ar: "خطط المحتوى",    en: "Action Plans",     value: totalPlans,      className: "" },
                    { ar: "خطط معتمدة",     en: "Plans Approved",   value: approvedPlans,   className: "text-emerald-500" },
                    { ar: "تحتاج تعديل",    en: "Needs Revision",   value: pendingRevision, className: "text-destructive" },
                ].map(stat => (
                    <Card key={stat.en}>
                        <CardHeader className="pb-1 pt-4">
                            <p className="section-label text-[10px] text-muted-foreground">
                                {isRtl ? stat.ar : stat.en}
                            </p>
                        </CardHeader>
                        <CardContent className="pt-0 pb-4">
                            <div className={cn("text-2xl font-bold tracking-tight", stat.className)}>
                                {stat.value}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Details Grid */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Account Manager */}
                {am ? (
                    <Card>
                        <CardHeader className={cn("pb-3", isRtl ? "text-right" : "")}>
                            <CardTitle className={cn("flex items-center gap-2 text-xs text-primary", isRtl ? "flex-row-reverse" : "")}>
                                <Users className="h-3.5 w-3.5" />
                                {isRtl ? "مدير الحساب" : "Account Manager"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={cn("flex items-center gap-3", isRtl ? "flex-row-reverse" : "")}>
                                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                                    {am.firstName?.[0]}{am.lastName?.[0]}
                                </div>
                                <div className={isRtl ? "text-right" : ""}>
                                    <p className="text-sm font-medium">{am.firstName} {am.lastName}</p>
                                    <p className="text-xs text-muted-foreground">{am.email}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardContent className="pt-5">
                            <p className={cn("text-sm text-muted-foreground", isRtl ? "text-right" : "")}>
                                {isRtl ? "لم يُعيَّن مدير حساب بعد." : "No AM assigned yet."}
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Active Services */}
                {(client.services?.length > 0 || activeServices.length > 0) && (
                    <Card>
                        <CardHeader className={cn("pb-3", isRtl ? "text-right" : "")}>
                            <CardTitle className={cn("flex items-center gap-2 text-xs text-emerald-500", isRtl ? "flex-row-reverse" : "")}>
                                <Globe className="h-3.5 w-3.5" />
                                {isRtl ? "الخدمات النشطة" : "Active Services"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={cn("flex flex-wrap gap-1.5", isRtl ? "flex-row-reverse" : "")}>
                                {client.services?.map((svc: any) => {
                                    const gs = svc.globalService;
                                    if (!gs) return null;
                                    return (
                                        <Badge key={svc.id} variant="secondary" className="text-xs">
                                            {isRtl ? gs.nameAr : gs.nameEn}
                                        </Badge>
                                    );
                                })}
                                {!client.services?.length && activeServices.map((svc: string) => (
                                    <Badge key={svc} variant="secondary" className="text-xs">{svc}</Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Monthly Deliverables */}
                {deliverables.length > 0 && (
                    <Card className="md:col-span-2">
                        <CardHeader className={cn("pb-3", isRtl ? "text-right" : "")}>
                            <CardTitle className={cn("flex items-center gap-2 text-xs text-blue-500", isRtl ? "flex-row-reverse" : "")}>
                                <Package className="h-3.5 w-3.5" />
                                {isRtl ? "المخرجات الشهرية" : "Monthly Deliverables"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-1.5">
                                {deliverables.map((d: string, i: number) => (
                                    <li key={i} className={cn("flex items-start gap-2 text-sm", isRtl ? "flex-row-reverse" : "")}>
                                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
                                        {d}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Reports & Action Plans */}
            <div className="grid gap-5 md:grid-cols-2">
                {/* Reports */}
                <div className="space-y-3">
                    <div className={cn("flex items-center justify-between", isRtl ? "flex-row-reverse" : "")}>
                        <h2 className={cn("text-[15px] font-semibold flex items-center gap-2", isRtl ? "flex-row-reverse" : "")}>
                            <BarChart3 className="h-4 w-4 text-primary" />
                            {isRtl ? "تقارير الأداء" : "Reports"}
                        </h2>
                        {showNewButtons ? (
                            <Link href={`/am/reports/create?clientId=${client.id}`}>
                                <Button size="sm" variant="ghost" className={cn("gap-1.5 text-xs", isRtl ? "flex-row-reverse" : "")}>
                                    <Plus className="h-3.5 w-3.5" /> {isRtl ? "جديد" : "New"}
                                </Button>
                            </Link>
                        ) : (
                            <Link href={`/${basePath}/clients/${client.id}/reports`} className="text-xs text-primary hover:underline font-medium">
                                {isRtl ? "عرض الكل" : "View All"}
                            </Link>
                        )}
                    </div>
                    <div className="space-y-2">
                        {(client.reports || []).map((report: any) => {
                            const sm = STATUS_META[report.status] || STATUS_META.DRAFT;
                            const StatusIcon = sm.icon;
                            return (
                                <div key={report.id} className={cn(
                                    "flex items-center gap-3 p-3.5 rounded-lg border border-border hover:bg-muted/30 transition-colors",
                                    isRtl ? "flex-row-reverse" : "",
                                )}>
                                    <div className={cn("flex-1 min-w-0", isRtl ? "text-right" : "")}>
                                        <p className="text-sm font-medium">{report.month}</p>
                                        <Badge variant={sm.variant} className="text-[10px] gap-1 mt-0.5">
                                            <StatusIcon className="h-3 w-3" />{statusLabel(report.status)}
                                        </Badge>
                                    </div>
                                    {showNewButtons && (
                                        <div className={cn("flex items-center gap-1 shrink-0", isRtl ? "flex-row-reverse" : "")}>
                                            <Link href={`/am/reports/${report.id}/edit`}>
                                                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1">
                                                    <Edit className="h-3 w-3" />{isRtl ? "تعديل" : "Edit"}
                                                </Button>
                                            </Link>
                                            <Link href={`/am/reports/${report.id}`}>
                                                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1 text-primary">
                                                    <ExternalLink className="h-3 w-3" />{isRtl ? "عرض" : "View"}
                                                </Button>
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {(client.reports || []).length === 0 && (
                            <div className="py-10 rounded-lg border border-dashed border-border text-center">
                                <BarChart3 className="h-7 w-7 mx-auto mb-2 text-muted-foreground/30" />
                                <p className="text-sm text-muted-foreground">{isRtl ? "لا توجد تقارير بعد" : "No reports yet"}</p>
                                {showNewButtons && (
                                    <Link href={`/am/reports/create?clientId=${client.id}`} className="inline-block mt-3">
                                        <Button size="sm" className="gap-1">
                                            <Plus className="h-3.5 w-3.5" />{isRtl ? "إنشاء أول تقرير" : "Create First Report"}
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Plans */}
                <div className="space-y-3">
                    <div className={cn("flex items-center justify-between", isRtl ? "flex-row-reverse" : "")}>
                        <h2 className={cn("text-[15px] font-semibold flex items-center gap-2", isRtl ? "flex-row-reverse" : "")}>
                            <FolderKanban className="h-4 w-4 text-primary" />
                            {isRtl ? "خطط المحتوى" : "Action Plans"}
                        </h2>
                        {showNewButtons ? (
                            <Link href={`/am/action-plans/create?clientId=${client.id}`}>
                                <Button size="sm" variant="ghost" className={cn("gap-1.5 text-xs", isRtl ? "flex-row-reverse" : "")}>
                                    <Plus className="h-3.5 w-3.5" /> {isRtl ? "جديدة" : "New"}
                                </Button>
                            </Link>
                        ) : (
                            <Link href={`/${basePath}/clients/${client.id}/action-plans`} className="text-xs text-primary hover:underline font-medium">
                                {isRtl ? "عرض الكل" : "View All"}
                            </Link>
                        )}
                    </div>
                    <div className="space-y-2">
                        {(client.actionPlans || []).map((plan: any) => {
                            const sm    = STATUS_META[plan.status] || STATUS_META.DRAFT;
                            const StatusIcon = sm.icon;
                            const items    = plan.items || [];
                            const approved = items.filter((i: any) => i.status === "APPROVED").length;
                            const total    = items.length;
                            const pct      = total > 0 ? Math.round((approved / total) * 100) : 0;
                            return (
                                <Link key={plan.id} href={showNewButtons ? `/am/action-plans/${plan.id}` : `/${basePath}/clients/${plan.id}`} className="block group">
                                    <div className="p-3.5 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                                        <div className={cn("flex items-center justify-between mb-2", isRtl ? "flex-row-reverse" : "")}>
                                            <div className={isRtl ? "text-right" : ""}>
                                                <p className="text-sm font-medium">{plan.month}</p>
                                                <Badge variant={sm.variant} className="text-[10px] gap-1 mt-0.5">
                                                    <StatusIcon className="h-3 w-3" />{statusLabel(plan.status)}
                                                </Badge>
                                            </div>
                                            {total > 0 && (
                                                <div className={isRtl ? "text-left" : "text-right"}>
                                                    <p className="text-xs text-muted-foreground">
                                                        {isRtl ? `${approved}/${total} معتمد` : `${approved}/${total} approved`}
                                                    </p>
                                                    <p className="text-sm font-semibold text-primary">{pct}%</p>
                                                </div>
                                            )}
                                        </div>
                                        {total > 0 && (
                                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className={cn("h-full rounded-full transition-all", pct === 100 ? "bg-emerald-500" : "bg-primary")}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            );
                        })}
                        {(client.actionPlans || []).length === 0 && (
                            <div className="py-10 rounded-lg border border-dashed border-border text-center">
                                <FolderKanban className="h-7 w-7 mx-auto mb-2 text-muted-foreground/30" />
                                <p className="text-sm text-muted-foreground">{isRtl ? "لا توجد خطط محتوى بعد" : "No action plans yet"}</p>
                                {showNewButtons && (
                                    <Link href={`/am/action-plans/create?clientId=${client.id}`} className="inline-block mt-3">
                                        <Button size="sm" className="gap-1">
                                            <Plus className="h-3.5 w-3.5" />{isRtl ? "إنشاء أول خطة" : "Create First Plan"}
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
