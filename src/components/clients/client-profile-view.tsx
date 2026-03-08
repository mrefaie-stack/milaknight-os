"use client";

import { useLanguage } from "@/contexts/language-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    BarChart3, FolderKanban, Globe, Building, ChevronRight, ChevronLeft,
    Facebook, Instagram, Linkedin, Youtube, CheckCircle2, Clock,
    AlertCircle, Plus, Edit, Send, Package, Users, ExternalLink, MessageSquare
} from "lucide-react";
import Link from "next/link";
import { ClientBriefDialog } from "@/components/clients/client-brief-dialog";

const SOCIAL_ICONS: Record<string, any> = {
    facebook: Facebook, instagram: Instagram, linkedin: Linkedin,
    youtube: Youtube,
    tiktok: () => <span style={{ fontWeight: 900, fontSize: "10px" }}>TT</span>,
    snapchat: () => <span style={{ fontWeight: 900, fontSize: "10px" }}>SC</span>,
    website: Globe,
};
const SOCIAL_COLORS: Record<string, string> = {
    facebook: "text-blue-500", instagram: "text-pink-500", linkedin: "text-blue-400",
    youtube: "text-red-500", tiktok: "text-foreground", snapchat: "text-yellow-500",
    website: "text-emerald-500",
};

const STATUS_META: Record<string, { color: string; icon: any }> = {
    DRAFT: { color: "text-gray-400", icon: Clock },
    PENDING: { color: "text-orange-500", icon: Clock },
    APPROVED: { color: "text-emerald-500", icon: CheckCircle2 },
    REVISION_REQUESTED: { color: "text-red-500", icon: AlertCircle },
    PUBLISHED: { color: "text-blue-500", icon: CheckCircle2 },
    SENT: { color: "text-emerald-500", icon: CheckCircle2 },
};

const STATUS_AR: Record<string, string> = {
    DRAFT: "مسودة",
    PENDING: "قيد المراجعة",
    APPROVED: "معتمد",
    REVISION_REQUESTED: "يحتاج تعديل",
    PUBLISHED: "منشور",
    SENT: "مُرسل",
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

    // Choose bilingual data based on current language, fallback to legacy fields
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
        { key: "website", url: client.website },
        { key: "facebook", url: client.facebook },
        { key: "instagram", url: client.instagram },
        { key: "linkedin", url: client.linkedin },
        { key: "youtube", url: client.youtube },
        { key: "tiktok", url: client.tiktok },
        { key: "snapchat", url: client.snapchat },
    ].filter(s => s.url);

    const totalReports = client.reports?.length || 0;
    const totalPlans = client.actionPlans?.length || 0;
    const approvedPlans = client.actionPlans?.filter((p: any) => p.status === "APPROVED").length || 0;
    const pendingRevision = client.actionPlans?.filter((p: any) => p.status === "REVISION_REQUESTED").length || 0;

    const am = client.accountManager;
    const dir = isRtl ? "rtl" : "ltr";
    const ChevronIcon = isRtl ? ChevronLeft : ChevronRight;

    const statusLabel = (status: string) => isRtl ? (STATUS_AR[status] || status) : status;

    return (
        <div className="space-y-8 max-w-5xl mx-auto" dir={dir}>

            {/* Breadcrumb */}
            <div className={`flex items-center gap-2 text-sm font-medium text-muted-foreground ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Link href={`/${basePath}/clients`} className="hover:text-primary transition-colors">
                    {isRtl ? "عملائي" : "My Clients"}
                </Link>
                <ChevronIcon className="h-4 w-4" />
                <span className="text-foreground">{client.name}</span>
            </div>

            {/* Hero Header */}
            <div className="p-6 rounded-3xl bg-card/50 backdrop-blur-sm border border-white/8 space-y-5">
                <div className={`flex flex-col md:flex-row md:items-start justify-between gap-4 ${isRtl ? 'md:flex-row-reverse' : ''}`}>
                    <div className={`flex items-center gap-5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <div className="h-20 w-20 shrink-0 bg-primary/10 rounded-3xl flex items-center justify-center border-2 border-primary/20 shadow-inner overflow-hidden">
                            {client.logoUrl
                                ? <img src={client.logoUrl} alt={client.name} className="w-full h-full object-cover" />
                                : <Building className="h-10 w-10 text-primary" />}
                        </div>
                        <div className={`space-y-1 ${isRtl ? 'text-right' : ''}`}>
                            <h1 className="text-4xl font-black tracking-tight">{client.name}</h1>
                            <div className={`flex flex-wrap items-center gap-2 mt-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-black">
                                    {client.package || "BASIC"}
                                </Badge>
                                {client.industry && (
                                    <span className="text-[10px] uppercase tracking-widest bg-muted px-2 py-0.5 rounded-full font-black">
                                        {client.industry}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className={`flex flex-wrap gap-2 shrink-0 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <ClientBriefDialog brief={displayBrief} />
                        {client.userId && (
                            <Link href={`/messages?userId=${client.userId}`}>
                                <Button variant="outline" className={`font-bold rounded-full gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                    <MessageSquare className="h-4 w-4" />
                                    {isRtl ? "مراسلة العميل" : "Message Client"}
                                </Button>
                            </Link>
                        )}
                        {showNewButtons && (
                            <>
                                <Link href={`/am/reports/create?clientId=${client.id}`}>
                                    <Button className={`font-bold rounded-full gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                        <Plus className="h-4 w-4" />
                                        {isRtl ? "تقرير جديد" : "New Report"}
                                    </Button>
                                </Link>
                                <Link href={`/am/action-plans/create?clientId=${client.id}`}>
                                    <Button variant="outline" className={`font-bold rounded-full gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                        <Plus className="h-4 w-4" />
                                        {isRtl ? "خطة جديدة" : "New Plan"}
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {/* Social Links Ribbon */}
                {socialLinks.length > 0 && (
                    <div className={`flex flex-wrap items-center gap-1 pt-2 border-t border-white/5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mx-2">
                            {isRtl ? ":الحضور الرقمي" : "Brand Presence:"}
                        </span>
                        {socialLinks.map(({ key, url }) => {
                            const Icon = SOCIAL_ICONS[key];
                            const color = SOCIAL_COLORS[key] || "text-muted-foreground";
                            return (
                                <a key={key} href={url!} target="_blank" rel="noopener noreferrer"
                                    className={`p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all hover:scale-105 ${color}`}>
                                    {Icon && <Icon className="h-4 w-4" />}
                                </a>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { ar: "إجمالي التقارير", en: "Total Reports", value: totalReports, color: "text-blue-500" },
                    { ar: "خطط المحتوى", en: "Action Plans", value: totalPlans, color: "text-primary" },
                    { ar: "خطط معتمدة", en: "Plans Approved", value: approvedPlans, color: "text-emerald-500" },
                    { ar: "تحتاج تعديل", en: "Needs Revision", value: pendingRevision, color: "text-red-500" },
                ].map(stat => (
                    <div key={stat.en} className="p-4 rounded-2xl bg-card/40 border border-white/5 text-center">
                        <div className={`text-3xl font-black ${stat.color}`}>{stat.value}</div>
                        <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-0.5">
                            {isRtl ? stat.ar : stat.en}
                        </div>
                    </div>
                ))}
            </div>

            {/* Details Grid */}
            <div className="grid gap-5 md:grid-cols-2">
                {/* Account Manager */}
                {am && (
                    <div className="p-5 rounded-2xl bg-card/40 border border-white/8 space-y-3">
                        <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <Users className="h-4 w-4 text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                                {isRtl ? "مدير الحساب" : "Account Manager"}
                            </span>
                        </div>
                        <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-primary font-black text-sm shrink-0">
                                {am.firstName?.[0]}{am.lastName?.[0]}
                            </div>
                            <div className={isRtl ? 'text-right' : ''}>
                                <p className="font-black">{am.firstName} {am.lastName}</p>
                                <p className="text-xs text-muted-foreground">{am.email}</p>
                            </div>
                        </div>
                    </div>
                )}
                {!am && (
                    <div className="p-5 rounded-2xl bg-card/40 border border-white/8">
                        <p className={`text-muted-foreground italic text-sm ${isRtl ? 'text-right' : ''}`}>
                            {isRtl ? "لم يُعيَّن مدير حساب بعد." : "No AM assigned yet."}
                        </p>
                    </div>
                )}

                {/* Active Services */}
                {(client.services?.length > 0 || activeServices.length > 0) && (
                    <div className="p-5 rounded-2xl bg-card/40 border border-white/8 space-y-3">
                        <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <Globe className="h-4 w-4 text-emerald-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
                                {isRtl ? "الخدمات النشطة" : "Active Services"}
                            </span>
                        </div>
                        <div className={`flex flex-wrap gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                            {/* Priority for logical services */}
                            {client.services && client.services.map((svc: any) => {
                                const gs = svc.globalService;
                                if (!gs) return null;
                                return (
                                    <Badge key={svc.id} variant="secondary" className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-xs font-black flex items-center gap-2">
                                        {/* Dynamic Icon placeholder or lucide mapping */}
                                        {isRtl ? gs.nameAr : gs.nameEn}
                                    </Badge>
                                );
                            })}

                            {/* Fallback for legacy services not yet migrated */}
                            {!client.services?.length && activeServices.map((svc: string) => (
                                <span key={svc} className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs font-black">{svc}</span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Monthly Deliverables */}
                {deliverables.length > 0 && (
                    <div className="p-5 rounded-2xl bg-card/40 border border-white/8 space-y-3 md:col-span-2">
                        <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <Package className="h-4 w-4 text-blue-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">
                                {isRtl ? "المخرجات الشهرية" : "Monthly Deliverables"}
                            </span>
                        </div>
                        <ul className="space-y-1">
                            {deliverables.map((d: string, i: number) => (
                                <li key={i} className={`flex items-start gap-2 text-sm font-medium ${isRtl ? 'flex-row-reverse' : ''}`}>
                                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
                                    {d}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Reports & Action Plans */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Reports */}
                <div className="space-y-3">
                    <div className={`flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <h2 className={`text-xl font-black flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <BarChart3 className="h-5 w-5 text-primary" />
                            {isRtl ? "تقارير الأداء" : "Reports"}
                        </h2>
                        {showNewButtons && (
                            <Link href={`/am/reports/create?clientId=${client.id}`}>
                                <Button size="sm" variant="ghost" className={`gap-1.5 font-black text-xs rounded-full ${isRtl ? 'flex-row-reverse' : ''}`}>
                                    <Plus className="h-3.5 w-3.5" /> {isRtl ? "جديد" : "New"}
                                </Button>
                            </Link>
                        )}
                        {!showNewButtons && (
                            <Link href={`/${basePath}/clients/${client.id}/reports`} className="text-xs font-bold text-primary hover:underline">
                                {isRtl ? "عرض الكل" : "View All"}
                            </Link>
                        )}
                    </div>
                    <div className="space-y-2">
                        {(client.reports || []).map((report: any) => {
                            const sm = STATUS_META[report.status] || STATUS_META.DRAFT;
                            const StatusIcon = sm.icon;
                            const reportHref = showNewButtons ? `/am/reports/${report.id}` : `/${basePath}/clients/${client.id}/reports`;
                            return (
                                <div key={report.id} className={`flex items-center gap-3 p-4 rounded-2xl bg-card/40 border border-white/8 hover:border-primary/20 transition-all group ${isRtl ? 'flex-row-reverse' : ''}`}>
                                    <div className={`flex-1 min-w-0 ${isRtl ? 'text-right' : ''}`}>
                                        <p className="font-black group-hover:text-primary transition-colors">{report.month}</p>
                                        <div className={`flex items-center gap-1 text-[10px] font-black uppercase ${sm.color} ${isRtl ? 'flex-row-reverse' : ''}`}>
                                            <StatusIcon className="h-3 w-3" />{statusLabel(report.status)}
                                        </div>
                                    </div>
                                    {showNewButtons && (
                                        <div className={`flex items-center gap-2 shrink-0 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                            <Link href={`/am/reports/${report.id}/edit`}>
                                                <Button size="sm" variant="ghost" className={`h-7 px-2 text-xs font-black rounded-lg gap-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                                    <Edit className="h-3 w-3" />{isRtl ? "تعديل" : "Edit"}
                                                </Button>
                                            </Link>
                                            <Link href={`/am/reports/${report.id}`}>
                                                <Button size="sm" variant="ghost" className={`h-7 px-2 text-xs font-black rounded-lg gap-1 text-primary ${isRtl ? 'flex-row-reverse' : ''}`}>
                                                    <ExternalLink className="h-3 w-3" />{isRtl ? "عرض" : "View"}
                                                </Button>
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {(client.reports || []).length === 0 && (
                            <div className="py-12 rounded-2xl border-2 border-dashed border-white/10 text-center">
                                <BarChart3 className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-20" />
                                <p className="text-sm text-muted-foreground">
                                    {isRtl ? "لا توجد تقارير بعد" : "No reports yet"}
                                </p>
                                {showNewButtons && (
                                    <Link href={`/am/reports/create?clientId=${client.id}`} className="inline-block mt-3">
                                        <Button size="sm" className={`rounded-full font-black gap-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
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
                    <div className={`flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <h2 className={`text-xl font-black flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <FolderKanban className="h-5 w-5 text-primary" />
                            {isRtl ? "خطط المحتوى" : "Action Plans"}
                        </h2>
                        {showNewButtons && (
                            <Link href={`/am/action-plans/create?clientId=${client.id}`}>
                                <Button size="sm" variant="ghost" className={`gap-1.5 font-black text-xs rounded-full ${isRtl ? 'flex-row-reverse' : ''}`}>
                                    <Plus className="h-3.5 w-3.5" /> {isRtl ? "جديدة" : "New"}
                                </Button>
                            </Link>
                        )}
                        {!showNewButtons && (
                            <Link href={`/${basePath}/clients/${client.id}/action-plans`} className="text-xs font-bold text-primary hover:underline">
                                {isRtl ? "عرض الكل" : "View All"}
                            </Link>
                        )}
                    </div>
                    <div className="space-y-2">
                        {(client.actionPlans || []).map((plan: any) => {
                            const sm = STATUS_META[plan.status] || STATUS_META.DRAFT;
                            const StatusIcon = sm.icon;
                            const items = plan.items || [];
                            const approved = items.filter((i: any) => i.status === "APPROVED").length;
                            const total = items.length;
                            const pct = total > 0 ? Math.round((approved / total) * 100) : 0;
                            return (
                                <Link key={plan.id} href={showNewButtons ? `/am/action-plans/${plan.id}` : `/${basePath}/clients/${plan.id}`} className="block group">
                                    <div className="p-4 rounded-2xl bg-card/40 border border-white/8 hover:border-primary/20 transition-all">
                                        <div className={`flex items-center justify-between mb-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                            <div className={isRtl ? 'text-right' : ''}>
                                                <p className="font-black group-hover:text-primary transition-colors">{plan.month}</p>
                                                <div className={`flex items-center gap-1 text-[10px] font-black uppercase ${sm.color} ${isRtl ? 'flex-row-reverse' : ''}`}>
                                                    <StatusIcon className="h-3 w-3" />{statusLabel(plan.status)}
                                                </div>
                                            </div>
                                            {total > 0 && (
                                                <div className={isRtl ? 'text-left' : 'text-right'}>
                                                    <p className="text-[10px] font-black text-muted-foreground">
                                                        {isRtl ? `${approved}/${total} معتمد` : `${approved}/${total} approved`}
                                                    </p>
                                                    <p className="text-sm font-black text-primary">{pct}%</p>
                                                </div>
                                            )}
                                        </div>
                                        {total > 0 && (
                                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full transition-all ${pct === 100 ? "bg-emerald-500" : "bg-primary"}`} style={{ width: `${pct}%` }} />
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            );
                        })}
                        {(client.actionPlans || []).length === 0 && (
                            <div className="py-12 rounded-2xl border-2 border-dashed border-white/10 text-center">
                                <FolderKanban className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-20" />
                                <p className="text-sm text-muted-foreground">
                                    {isRtl ? "لا توجد خطط محتوى بعد" : "No action plans yet"}
                                </p>
                                {showNewButtons && (
                                    <Link href={`/am/action-plans/create?clientId=${client.id}`} className="inline-block mt-3">
                                        <Button size="sm" className={`rounded-full font-black gap-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
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
