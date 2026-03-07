import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
    BarChart3, FolderKanban, Globe, Building, ChevronRight, Facebook,
    Instagram, Linkedin, Youtube, CheckCircle2, Clock, AlertCircle,
    Plus, Edit, Send, Package, MapPin, Languages, Users, ExternalLink,
    FileText, Twitter
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ClientBriefDialog } from "@/components/clients/client-brief-dialog";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const SOCIAL_ICONS: Record<string, any> = {
    facebook: Facebook,
    instagram: Instagram,
    linkedin: Linkedin,
    twitter: Twitter,
    youtube: Youtube,
    tiktok: ({ className }: any) => <span className={className} style={{ fontWeight: 900, fontSize: "10px" }}>TT</span>,
    snapchat: ({ className }: any) => <span className={className} style={{ fontWeight: 900, fontSize: "10px" }}>SC</span>,
    website: Globe,
};

const SOCIAL_COLORS: Record<string, string> = {
    facebook: "text-blue-500",
    instagram: "text-pink-500",
    linkedin: "text-blue-400",
    twitter: "text-sky-400",
    youtube: "text-red-500",
    tiktok: "text-foreground",
    snapchat: "text-yellow-500",
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

export default async function AMClientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    const client = await prisma.client.findUnique({
        where: { id },
        include: {
            reports: { orderBy: { createdAt: "desc" }, take: 20 },
            actionPlans: {
                orderBy: { createdAt: "desc" },
                take: 20,
                include: { items: { select: { status: true } } }
            },
            services: true,
            accountManager: { select: { id: true, firstName: true, lastName: true, email: true } },
        }
    });

    if (!client) return notFound();

    const c = client as any;

    const activeServices = c.activeServices ? c.activeServices.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
    const deliverables = c.deliverables ? c.deliverables.split("\n").filter(Boolean) : [];

    const socialLinks = [
        { key: "website", url: c.website },
        { key: "facebook", url: c.facebook },
        { key: "instagram", url: c.instagram },
        { key: "linkedin", url: c.linkedin },
        { key: "twitter", url: c.twitter },
        { key: "tiktok", url: c.tiktok },
        { key: "youtube", url: c.youtube },
        { key: "snapchat", url: c.snapchat },
    ].filter(s => s.url);

    // Stats
    const totalReports = c.reports.length;
    const totalPlans = c.actionPlans.length;
    const approvedPlans = c.actionPlans.filter((p: any) => p.status === "APPROVED").length;
    const pendingRevision = c.actionPlans.filter((p: any) => p.status === "REVISION_REQUESTED").length;

    const am = c.accountManager;

    return (
        <div className="space-y-8 max-w-5xl mx-auto">

            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Link href="/am/clients" className="hover:text-primary transition-colors">My Clients</Link>
                <ChevronRight className="h-4 w-4" />
                <span className="text-foreground">{client.name}</span>
            </div>

            {/* ── HERO HEADER ───────────────────────────────────────── */}
            <div className="p-6 rounded-3xl bg-card/50 backdrop-blur-sm border border-white/8 space-y-5">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex items-center gap-5">
                        {/* Logo / Avatar */}
                        <div className="h-20 w-20 shrink-0 bg-primary/10 rounded-3xl flex items-center justify-center border-2 border-primary/20 shadow-inner overflow-hidden">
                            {c.logoUrl
                                ? <img src={c.logoUrl} alt={c.name} className="w-full h-full object-cover" />
                                : <Building className="h-10 w-10 text-primary" />
                            }
                        </div>
                        <div className="space-y-1">
                            <h1 className="text-4xl font-black tracking-tight">{c.name}</h1>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-black">{c.package || "BASIC"}</Badge>
                                {c.industry && <span className="text-[10px] uppercase tracking-widest bg-muted px-2 py-0.5 rounded-full font-black">{c.industry}</span>}
                                {c.country && (
                                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                                        <MapPin className="h-3 w-3" />{c.country}
                                    </span>
                                )}
                                {c.languages && (
                                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                                        <Languages className="h-3 w-3" />{c.languages}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 shrink-0">
                        <ClientBriefDialog brief={client.brief} />
                        <Link href={`/messages?userId=${c.user?.id || ""}`}>
                            <Button variant="outline" className="font-bold rounded-full gap-2"><Send className="h-4 w-4" />Message Client</Button>
                        </Link>
                        <Link href={`/am/reports/create?clientId=${client.id}`}>
                            <Button className="font-bold rounded-full gap-2"><Plus className="h-4 w-4" />New Report</Button>
                        </Link>
                        <Link href={`/am/action-plans/create?clientId=${client.id}`}>
                            <Button variant="outline" className="font-bold rounded-full gap-2"><Plus className="h-4 w-4" />New Plan</Button>
                        </Link>
                    </div>
                </div>

                {/* Social Links */}
                {socialLinks.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 pt-2 border-t border-white/5">
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mr-2">Brand Presence:</span>
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

            {/* ── STATS ROW ─────────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Reports", value: totalReports, color: "text-blue-500" },
                    { label: "Action Plans", value: totalPlans, color: "text-primary" },
                    { label: "Plans Approved", value: approvedPlans, color: "text-emerald-500" },
                    { label: "Needs Revision", value: pendingRevision, color: "text-red-500" },
                ].map(stat => (
                    <div key={stat.label} className="p-4 rounded-2xl bg-card/40 border border-white/5 text-center">
                        <div className={`text-3xl font-black ${stat.color}`}>{stat.value}</div>
                        <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-0.5">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* ── DETAILS GRID ──────────────────────────────────────── */}
            <div className="grid gap-5 md:grid-cols-2">

                {/* Account Manager */}
                {am && (
                    <div className="p-5 rounded-2xl bg-card/40 border border-white/8 space-y-3">
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Account Manager</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-primary font-black text-sm">
                                {am.firstName?.[0]}{am.lastName?.[0]}
                            </div>
                            <div>
                                <p className="font-black">{am.firstName} {am.lastName}</p>
                                <p className="text-xs text-muted-foreground">{am.email}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Active Services */}
                {activeServices.length > 0 && (
                    <div className="p-5 rounded-2xl bg-card/40 border border-white/8 space-y-3">
                        <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-emerald-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Active Services</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {activeServices.map(svc => (
                                <span key={svc} className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs font-black">{svc}</span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Monthly Deliverables */}
                {deliverables.length > 0 && (
                    <div className="p-5 rounded-2xl bg-card/40 border border-white/8 space-y-3 md:col-span-2">
                        <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-blue-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Monthly Deliverables</span>
                        </div>
                        <ul className="space-y-1">
                            {deliverables.map((d, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm font-medium">
                                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
                                    {d}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* ── REPORTS & ACTION PLANS ────────────────────────────── */}
            <div className="grid gap-6 md:grid-cols-2">

                {/* Reports */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" />Reports</h2>
                        <Link href={`/am/reports/create?clientId=${client.id}`}>
                            <Button size="sm" variant="ghost" className="gap-1.5 font-black text-xs rounded-full"><Plus className="h-3.5 w-3.5" />New</Button>
                        </Link>
                    </div>
                    <div className="space-y-2">
                        {c.reports.map((report: any) => {
                            const sm = STATUS_META[report.status] || STATUS_META.DRAFT;
                            const StatusIcon = sm.icon;
                            return (
                                <div key={report.id} className="flex items-center gap-3 p-4 rounded-2xl bg-card/40 border border-white/8 hover:border-primary/20 transition-all group">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black group-hover:text-primary transition-colors">{report.month}</p>
                                        <div className={`flex items-center gap-1 text-[10px] font-black uppercase ${sm.color}`}>
                                            <StatusIcon className="h-3 w-3" />{report.status}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Link href={`/am/reports/${report.id}/edit`}>
                                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs font-black rounded-lg gap-1"><Edit className="h-3 w-3" />Edit</Button>
                                        </Link>
                                        <Link href={`/am/reports/${report.id}`}>
                                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs font-black rounded-lg gap-1 text-primary"><ExternalLink className="h-3 w-3" />View</Button>
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                        {c.reports.length === 0 && (
                            <div className="py-12 rounded-2xl border-2 border-dashed border-white/10 text-center">
                                <BarChart3 className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-20" />
                                <p className="text-sm text-muted-foreground">No reports yet</p>
                                <Link href={`/am/reports/create?clientId=${client.id}`} className="inline-block mt-3">
                                    <Button size="sm" className="rounded-full font-black gap-1"><Plus className="h-3.5 w-3.5" />Create First Report</Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Plans */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black flex items-center gap-2"><FolderKanban className="h-5 w-5 text-primary" />Action Plans</h2>
                        <Link href={`/am/action-plans/create?clientId=${client.id}`}>
                            <Button size="sm" variant="ghost" className="gap-1.5 font-black text-xs rounded-full"><Plus className="h-3.5 w-3.5" />New</Button>
                        </Link>
                    </div>
                    <div className="space-y-2">
                        {c.actionPlans.map((plan: any) => {
                            const sm = STATUS_META[plan.status] || STATUS_META.DRAFT;
                            const StatusIcon = sm.icon;
                            const items = (plan as any).items || [];
                            const approved = items.filter((i: any) => i.status === "APPROVED").length;
                            const total = items.length;
                            const pct = total > 0 ? Math.round((approved / total) * 100) : 0;
                            return (
                                <Link key={plan.id} href={`/am/action-plans/${plan.id}`} className="block group">
                                    <div className="p-4 rounded-2xl bg-card/40 border border-white/8 hover:border-primary/20 transition-all">
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p className="font-black group-hover:text-primary transition-colors">{plan.month}</p>
                                                <div className={`flex items-center gap-1 text-[10px] font-black uppercase ${sm.color}`}>
                                                    <StatusIcon className="h-3 w-3" />{plan.status}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-muted-foreground">{approved}/{total} approved</p>
                                                <p className="text-sm font-black text-primary">{pct}%</p>
                                            </div>
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
                        {c.actionPlans.length === 0 && (
                            <div className="py-12 rounded-2xl border-2 border-dashed border-white/10 text-center">
                                <FolderKanban className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-20" />
                                <p className="text-sm text-muted-foreground">No action plans yet</p>
                                <Link href={`/am/action-plans/create?clientId=${client.id}`} className="inline-block mt-3">
                                    <Button size="sm" className="rounded-full font-black gap-1"><Plus className="h-3.5 w-3.5" />Create First Plan</Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
