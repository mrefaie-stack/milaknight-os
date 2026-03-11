"use client";

import { useState, useMemo, useEffect } from "react";
import { createReport, updateReport, generateReportSummary } from "@/app/actions/report";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/language-context";
import {
    Facebook,
    Instagram,
    Video,
    Share2,
    Linkedin,
    Search,
    Youtube,
    Globe,
    Mail,
    TrendingUp,
    Users,
    Eye,
    MousePointer2,
    DollarSign,
    Target,
    Zap,
    MessageSquare,
    Trash2,
    Link,
    X,
    Twitter,
    Save,
    BarChart3,
    Image as ImageIcon
} from "lucide-react";
import { getApprovedPosts } from "@/app/actions/action-plan";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const PLATFORMS = [
    { id: "facebook", name: "Facebook", icon: Facebook, color: "text-blue-600" },
    { id: "instagram", name: "Instagram", icon: Instagram, color: "text-pink-600" },
    { id: "tiktok", name: "TikTok", icon: Video, color: "text-slate-900" },
    { id: "snapchat", name: "Snapchat", icon: Share2, color: "text-yellow-500" },
    { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "text-blue-700" },
    { id: "x", name: "X (Twitter)", icon: Twitter, color: "text-slate-900" },
    { id: "google", name: "Google Ads", icon: Search, color: "text-red-500" },
    { id: "youtube", name: "YouTube", icon: Youtube, color: "text-red-600" },
];

const PLATFORM_METRICS: Record<string, { id: string, labelAr: string, labelEn: string, icon: any }[]> = {
    facebook: [
        { id: "impressions", labelAr: "المشاهدات", labelEn: "Views", icon: Eye },
        { id: "reach", labelAr: "الوصول", labelEn: "Viewers", icon: Users },
        { id: "engagement", labelAr: "التفاعلات", labelEn: "Content interactions", icon: MousePointer2 },
        { id: "clicks", labelAr: "النقرات على الرابط", labelEn: "Link clicks", icon: Target },
        { id: "profileVisits", labelAr: "الزيارات", labelEn: "Visits", icon: Target },
        { id: "followers", labelAr: "متابعون جدد", labelEn: "New followers", icon: Users },
    ],
    instagram: [
        { id: "views", labelAr: "المشاهدات", labelEn: "Views", icon: Eye },
        { id: "reach", labelAr: "الوصول", labelEn: "Reach", icon: Users },
        { id: "engagement", labelAr: "التفاعلات", labelEn: "Content interactions", icon: MousePointer2 },
        { id: "clicks", labelAr: "النقرات على الرابط", labelEn: "Link clicks", icon: Target },
        { id: "profileVisits", labelAr: "الزيارات", labelEn: "Visits", icon: Target },
        { id: "followers", labelAr: "متابعون جدد", labelEn: "New followers", icon: Users },
    ],
    linkedin: [
        { id: "impressions", labelAr: "الظهور", labelEn: "Impressions", icon: Eye },
        { id: "engagement", labelAr: "التفاعلات", labelEn: "Reactions", icon: MousePointer2 },
        { id: "comments", labelAr: "التعليقات", labelEn: "Comments", icon: MessageSquare },
        { id: "shares", labelAr: "إعادة النشر", labelEn: "Reposts", icon: Share2 },
        { id: "profileVisits", labelAr: "مشاهدات الصفحة", labelEn: "Page views", icon: Eye },
        { id: "followers", labelAr: "متابعون جدد", labelEn: "New followers", icon: Users },
        { id: "searches", labelAr: "عمليات البحث عن الصفحة", labelEn: "Page searches", icon: Search },
    ],
    tiktok: [
        { id: "views", labelAr: "مشاهدات الفيديو", labelEn: "Video views", icon: Video },
        { id: "profileVisits", labelAr: "مشاهدات الملف الشخصي", labelEn: "Profile views", icon: Eye },
        { id: "likes", labelAr: "الإعجابات", labelEn: "Likes", icon: Target },
        { id: "comments", labelAr: "التعليقات", labelEn: "Comments", icon: MessageSquare },
        { id: "shares", labelAr: "المشاركات", labelEn: "Shares", icon: Share2 },
        { id: "followers", labelAr: "متابعون جدد", labelEn: "New followers", icon: Users },
    ],
    snapchat: [
        { id: "followers", labelAr: "متابعون جدد", labelEn: "New followers", icon: Users },
        { id: "views", labelAr: "إجمالي المشاهدات", labelEn: "Total views", icon: Eye },
        { id: "profileVisits", labelAr: "مشاهدات الملف الشخصي", labelEn: "Profile views", icon: Eye },
    ],
    x: [
        { id: "impressions", labelAr: "الظهور", labelEn: "Impressions", icon: Eye },
        { id: "engagement", labelAr: "التفاعلات", labelEn: "Engagements", icon: MousePointer2 },
        { id: "profileVisits", labelAr: "زيارات الملف الشخصي", labelEn: "Profile visits", icon: Eye },
        { id: "replies", labelAr: "الردود", labelEn: "Replies", icon: MessageSquare },
        { id: "likes", labelAr: "الإعجابات", labelEn: "Likes", icon: Target },
        { id: "reposts", labelAr: "إعادة النشر", labelEn: "Reposts", icon: Share2 },
        { id: "bookmarks", labelAr: "العلامات المرجعية", labelEn: "Bookmarks", icon: Save },
        { id: "shares", labelAr: "المشاركات", labelEn: "Shares", icon: Share2 },
        { id: "currentFollowers", labelAr: "عدد المتابعين الحالي", labelEn: "Current follow number", icon: Users },
    ],
    google: [
        { id: "clicks", labelAr: "النقرات", labelEn: "Clicks", icon: MousePointer2 },
        { id: "impressions", labelAr: "الظهور", labelEn: "Impressions", icon: Eye },
        { id: "cpc", labelAr: "تكلفة النقرة", labelEn: "CPC", icon: DollarSign },
        { id: "conversions", labelAr: "التحويلات", labelEn: "Conversions", icon: Target },
    ],
    youtube: [
        { id: "views", labelAr: "المشاهدات", labelEn: "Views", icon: Video },
        { id: "watchTime", labelAr: "وقت المشاهدة", labelEn: "Watch Time", icon: Eye },
        { id: "engagement", labelAr: "التفاعلات", labelEn: "Engagement", icon: MousePointer2 },
        { id: "followers", labelAr: "مشتركون جدد", labelEn: "New Subscribers", icon: Users },
    ]
};


interface MetricFieldProps {
    label: string;
    icon: any;
    value: string | number;
    onChange: (val: string) => void;
    placeholder?: string;
    type?: string;
    prefix?: string;
    suffix?: string;
}

function MetricField({ label, icon: Icon, value, onChange, placeholder = "0", type = "number", prefix, suffix }: MetricFieldProps) {
    return (
        <div className="space-y-2 group">
            <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground group-focus-within:text-primary transition-colors">
                <Icon className="h-3 w-3" />
                {label}
            </Label>
            <div className="relative">
                {prefix && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium pointer-events-none">
                        {prefix}
                    </span>
                )}
                <Input
                    type={type}
                    value={value ?? ""}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={`bg-background/50 border-muted-foreground/10 focus:border-primary/30 focus:ring-primary/20 transition-all ${prefix ? 'pl-7' : ''} ${suffix ? 'pr-7' : ''}`}
                />
                {suffix && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold pointer-events-none">
                        {suffix}
                    </span>
                )}
            </div>
        </div>
    );
}

function CalcMetric({ label, value, suffix = "", prefix = "" }: { label: string, value: string | number, suffix?: string, prefix?: string }) {
    return (
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex flex-col justify-center">
            <span className="text-[10px] font-black uppercase text-primary/60 mb-1">{label}</span>
            <span className="text-xl font-black text-primary">
                {prefix}{value}{suffix}
            </span>
        </div>
    );
}

export function ReportCreatorClient({ clients, initialData }: { clients: any[], initialData?: any }) {
    const { t, isRtl } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [scheduledSendAt, setScheduledSendAt] = useState(initialData?.scheduledSendAt ? new Date(initialData.scheduledSendAt).toISOString().split('T')[0] : "");
    const router = useRouter();

    const initialMetrics = (() => {
        const raw = initialData?.metrics
            ? (typeof initialData.metrics === 'string' ? JSON.parse(initialData.metrics) : initialData.metrics)
            : null;

        // If no raw data, return default
        if (!raw) {
            return {
                campaigns: [{ id: "main", name: isRtl ? "الحملة الرئيسية" : "Main Campaign", platforms: {}, linkedItems: [] }],
                emailMarketing: { emailsSent: 0, openRate: 0, clickRate: 0, unsubscribes: 0 },
                seo: { score: 0, rank: "", notes: "", speed: 0, mobile: 0 },
                summary: ""
            };
        }

        // Migrate old flat structure (raw.platforms existed instead of raw.campaigns)
        if (!raw.campaigns || !Array.isArray(raw.campaigns)) {
            return {
                campaigns: [{ id: "main", name: isRtl ? "الحملة الرئيسية" : "Main Campaign", platforms: raw.platforms || {}, linkedItems: [] }],
                emailMarketing: {
                    campaigns: [{ name: "", emailsSent: 0, openRate: 0, clickRate: 0, unsubscribes: 0 }],
                    ...((raw.emailMarketing && typeof raw.emailMarketing === 'object' && !Array.isArray(raw.emailMarketing?.campaigns))
                        ? { campaigns: [{ name: "", emailsSent: raw.emailMarketing.emailsSent || 0, openRate: raw.emailMarketing.openRate || 0, clickRate: raw.emailMarketing.clickRate || 0, unsubscribes: raw.emailMarketing.unsubscribes || 0 }] }
                        : {})
                },
                seo: raw.seo || { score: 0, rank: "", notes: "", speed: 0, mobile: 0 },
                summary: raw.summary || ""
            };
        }

        // Migrate old flat emailMarketing structure within valid campaigns data
        if (raw.emailMarketing && !Array.isArray(raw.emailMarketing.campaigns)) {
            raw.emailMarketing = {
                campaigns: [{ name: "", emailsSent: raw.emailMarketing.emailsSent || 0, openRate: raw.emailMarketing.openRate || 0, clickRate: raw.emailMarketing.clickRate || 0, unsubscribes: raw.emailMarketing.unsubscribes || 0 }]
            };
        }

        return raw;
    })();

    const [metrics, setMetrics] = useState(initialMetrics);
    const [selectedCampaignId, setSelectedCampaignId] = useState(initialMetrics.campaigns[0].id);
    const [activeSections, setActiveSections] = useState<string[]>(() => {
        if (initialData && initialData.metrics) {
            const raw = typeof initialData.metrics === 'string' ? JSON.parse(initialData.metrics) : initialData.metrics;
            const active: string[] = [];
            const camps = raw.campaigns || [{ platforms: raw.platforms || {} }];
            camps.forEach((c: any) => {
                Object.keys(c.platforms || {}).forEach((pid: string) => {
                    const plat = c.platforms[pid];
                    if (plat && (plat.impressions > 0 || plat.followers > 0 || plat.engagement > 0 || plat.views > 0 || plat.spend > 0) && !active.includes(pid)) {
                        active.push(pid);
                    }
                });
            });
            if (raw.emailMarketing?.campaigns?.length > 0 || raw.emailMarketing?.emailsSent > 0) active.push('email');
            if (raw.seo?.score > 0 || raw.seo?.clicks > 0 || raw.seo?.impressions > 0) active.push('seo');
            if (raw.summary && raw.summary.length > 0) active.push('summary');
            return active.length > 0 ? active : ["facebook", "instagram", "summary"];
        }
        return ["facebook", "instagram", "summary"];
    });

    const toggleSection = (id: string) => {
        setActiveSections((prev) =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };
    const [approvedPosts, setApprovedPosts] = useState<any[]>([]);
    const [isPostSelectorOpen, setIsPostSelectorOpen] = useState(false);
    const [selectedPlatformForLinking, setSelectedPlatformForLinking] = useState<string | null>(null);

    const activeCampaign = useMemo(() =>
        metrics.campaigns.find((c: any) => c.id === selectedCampaignId) || metrics.campaigns[0]
        , [metrics.campaigns, selectedCampaignId]);

    // Fetch approved posts when client changes
    const [currentClientId, setCurrentClientId] = useState(initialData?.clientId || "");

    useEffect(() => {
        async function loadPosts() {
            if (currentClientId) {
                try {
                    const posts = await getApprovedPosts(currentClientId);
                    setApprovedPosts(posts);
                } catch (err) {
                    console.error("Failed to fetch posts", err);
                }
            }
        }
        loadPosts();
    }, [currentClientId]);

    const addCampaign = () => {
        const id = Math.random().toString(36).substr(2, 9);
        setMetrics((prev: any) => ({
            ...prev,
            campaigns: [
                ...prev.campaigns,
                { id, name: isRtl ? "حملة جديدة" : "New Campaign", platforms: {}, linkedItems: [] }
            ]
        }));
        setSelectedCampaignId(id);
    };

    const deleteCampaign = (id: string) => {
        if (metrics.campaigns.length <= 1) return;
        setMetrics((prev: any) => ({
            ...prev,
            campaigns: prev.campaigns.filter((c: any) => c.id !== id)
        }));
        if (selectedCampaignId === id) {
            setSelectedCampaignId(metrics.campaigns[0].id);
        }
    };

    const updateCampaignName = (id: string, name: string) => {
        setMetrics((prev: any) => ({
            ...prev,
            campaigns: prev.campaigns.map((c: any) => c.id === id ? { ...c, name } : c)
        }));
    };

    const updatePlatformMetric = (platformId: string, field: string, value: any) => {
        const numFields = ['followers', 'engagement', 'views', 'impressions', 'paidReach', 'spend', 'conversions', 'organicReach', 'shares', 'watchTime', 'saves', 'profileVisits', 'cpc', 'ctr'];
        const val = numFields.includes(field) ? (parseFloat(value) || 0) : value;

        setMetrics((prev: any) => ({
            ...prev,
            campaigns: prev.campaigns.map((c: any) => c.id === selectedCampaignId ? {
                ...c,
                platforms: {
                    ...c.platforms,
                    [platformId]: {
                        ...(c.platforms[platformId] || {}),
                        [field]: val
                    }
                }
            } : c)
        }));
    };

    const linkPost = (post: any) => {
        setMetrics((prev: any) => ({
            ...prev,
            campaigns: prev.campaigns.map((c: any) => c.id === selectedCampaignId ? {
                ...c,
                linkedItems: [...(c.linkedItems || []), { ...post, platform: selectedPlatformForLinking }]
            } : c)
        }));
        setIsPostSelectorOpen(false);
    };

    const unlinkPost = (postId: string) => {
        setMetrics((prev: any) => ({
            ...prev,
            campaigns: prev.campaigns.map((c: any) => c.id === selectedCampaignId ? {
                ...c,
                linkedItems: c.linkedItems.filter((p: any) => p.id !== postId)
            } : c)
        }));
    };


    const addEmailCampaign = () => {
        setMetrics((prev: any) => ({
            ...prev,
            emailMarketing: {
                campaigns: [...(prev.emailMarketing?.campaigns || []), { name: "", emailsSent: 0, openRate: 0, clickRate: 0, unsubscribes: 0 }]
            }
        }));
    };

    const removeEmailCampaign = (index: number) => {
        setMetrics((prev: any) => ({
            ...prev,
            emailMarketing: {
                campaigns: (prev.emailMarketing?.campaigns || []).filter((_: any, i: number) => i !== index)
            }
        }));
    };

    const updateEmailCampaign = (index: number, field: string, value: string) => {
        const numFields = ['emailsSent', 'openRate', 'clickRate', 'unsubscribes'];
        const val = numFields.includes(field) ? (parseFloat(value) || 0) : value;
        setMetrics((prev: any) => ({
            ...prev,
            emailMarketing: {
                campaigns: (prev.emailMarketing?.campaigns || []).map((c: any, i: number) => i === index ? { ...c, [field]: val } : c)
            }
        }));
    };

    const updateSEOMetric = (field: string, value: string | number) => {
        setMetrics((prev: any) => ({
            ...prev,
            seo: {
                ...prev.seo,
                [field]: value
            }
        }));
    };

    // Auto-calculations for the UI
    const getPlatformCalcs = (platformId: string) => {
        const p = activeCampaign.platforms[platformId] || {};
        const engRate = p.impressions > 0 ? ((p.engagement / p.impressions) * 100).toFixed(2) : "0.00";

        // Use paidCampaigns if they exist to drive spend/results, otherwise use top-level metrics
        const totalSpend = p.paidCampaigns?.length > 0
            ? p.paidCampaigns.reduce((acc: number, c: any) => acc + (c.spend || 0), 0)
            : (p.spend || 0);

        const totalResults = p.paidCampaigns?.length > 0
            ? p.paidCampaigns.reduce((acc: number, c: any) => acc + (c.results || 0), 0)
            : (p.conversions || 0);

        const cpa = totalResults > 0 && totalSpend > 0 ? (totalSpend / totalResults).toFixed(2) : "0.00";
        const totalClicks = p.clicks || 0;
        const cpc = totalClicks > 0 ? (totalSpend / totalClicks).toFixed(2) : "0.00";

        return { engRate, cpa, cpc, totalSpend, totalResults };
    };

    const addPaidCampaign = (platformId: string) => {
        setMetrics((prev: any) => ({
            ...prev,
            campaigns: prev.campaigns.map((c: any) => c.id === selectedCampaignId ? {
                ...c,
                platforms: {
                    ...c.platforms,
                    [platformId]: {
                        ...(c.platforms[platformId] || {}),
                        paidCampaigns: [...((c.platforms[platformId] || {}).paidCampaigns || []), { name: "", objective: "AWARENESS", reach: 0, results: 0, spend: 0 }]
                    }
                }
            } : c)
        }));
    };

    const removePaidCampaign = (platformId: string, index: number) => {
        setMetrics((prev: any) => ({
            ...prev,
            campaigns: prev.campaigns.map((c: any) => c.id === selectedCampaignId ? {
                ...c,
                platforms: {
                    ...c.platforms,
                    [platformId]: {
                        ...c.platforms[platformId],
                        paidCampaigns: (c.platforms[platformId].paidCampaigns || []).filter((_: any, i: number) => i !== index)
                    }
                }
            } : c)
        }));
    };

    const updatePaidCampaign = (platformId: string, index: number, field: string, value: any) => {
        setMetrics((prev: any) => ({
            ...prev,
            campaigns: prev.campaigns.map((c: any) => c.id === selectedCampaignId ? {
                ...c,
                platforms: {
                    ...c.platforms,
                    [platformId]: {
                        ...c.platforms[platformId],
                        paidCampaigns: (c.platforms[platformId].paidCampaigns || []).map((camp: any, i: number) => {
                            if (i !== index) return camp;
                            const val = ['reach', 'results', 'spend'].includes(field) ? (parseFloat(value) || 0) : value;
                            return { ...camp, [field]: val };
                        })
                    }
                }
            } : c)
        }));
    };

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const clientId = formData.get("clientId") as string;
        const month = formData.get("month") as string;
        const scheduledSendAtStr = formData.get("scheduledSendAt") as string;
        const scheduledSendAt = scheduledSendAtStr ? new Date(scheduledSendAtStr) : undefined;

        // Calculate Global Totals across all campaigns
        const totals = { reach: 0, spend: 0, conversions: 0 };
        metrics.campaigns.forEach((camp: any) => {
            Object.values(camp.platforms || {}).forEach((p: any) => {
                totals.reach += (Number(p.organicReach) || 0) + (Number(p.paidReach) || 0);
                totals.spend += (Number(p.spend) || 0);
                totals.conversions += (Number(p.conversions) || 0);

                // Also add spend from individual paid campaigns if they override the top level
                if (p.paidCampaigns?.length > 0) {
                    const campaignSpend = p.paidCampaigns.reduce((acc: number, c: any) => acc + (Number(c.spend) || 0), 0);
                    // If campaign spend is higher than top-level spend, use campaign total
                    if (campaignSpend > (Number(p.spend) || 0)) {
                        totals.spend += (campaignSpend - (Number(p.spend) || 0));
                    }
                }
            });
        });

        const finalMetrics = {
            ...metrics,
            summary: formData.get("summary") as string,
            totals
        };

        try {
            const scheduledDate = scheduledSendAt ? new Date(scheduledSendAt) : undefined;
            if (initialData) {
                await updateReport(initialData.id, finalMetrics, month, clientId, scheduledDate);
                toast.success("Report updated successfully!");
                router.push(`/am/reports/${initialData.id}`);
            } else {
                const report = await createReport(clientId, month, finalMetrics, scheduledDate);
                toast.success("Report generated successfully!");
                router.push(`/am/reports/${report.id}`);
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to save report");
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-6xl mx-auto pb-24">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-card/30 p-4 md:p-8 rounded-2xl md:rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl">
                <div className={isRtl ? 'text-right' : ''}>
                    <h1 className="text-3xl md:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                        {isRtl ? 'إنشاء تقرير أداء' : 'Generate Report'}
                    </h1>
                    <p className="text-muted-foreground text-lg font-medium mt-2">
                        {isRtl ? 'قم ببناء مراجعة أداء احترافية لعميلك.' : 'Build a premium performance review for your client.'}
                    </p>
                </div>
                <div className={`flex flex-col sm:flex-row gap-3 w-full md:w-auto ${isRtl ? 'sm:flex-row-reverse' : ''}`}>
                    <div className="space-y-1">
                        <Label className={`text-[10px] font-black uppercase text-muted-foreground ${isRtl ? 'mr-1 text-right' : 'ml-1'}`}>
                            {isRtl ? 'العميل' : 'Client'}
                        </Label>
                        <Select name="clientId" defaultValue={initialData?.clientId} onValueChange={setCurrentClientId} required>
                            <SelectTrigger className="w-full sm:w-64 bg-background/50 border-white/5 h-12 text-base font-bold rounded-xl shadow-lg">
                                <SelectValue placeholder={isRtl ? 'اختر العميل' : 'Select Client'} />
                            </SelectTrigger>
                            <SelectContent>
                                {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label className={`text-[10px] font-black uppercase text-muted-foreground ${isRtl ? 'mr-1 text-right' : 'ml-1'}`}>
                            {isRtl ? 'شهر الأداء' : 'Performance Month'}
                        </Label>
                        <Input
                            name="month"
                            type="month"
                            defaultValue={initialData?.month}
                            className="w-full sm:w-48 bg-background/50 border-white/5 h-12 text-base font-bold rounded-xl shadow-lg"
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className={`text-[10px] font-black uppercase text-muted-foreground ${isRtl ? 'mr-1 text-right' : 'ml-1'}`}>
                            {isRtl ? 'جدولة النشر (اختياري)' : 'Schedule Publish (Optional)'}
                        </Label>
                        <Input
                            name="scheduledSendAt"
                            type="datetime-local"
                            defaultValue={initialData?.scheduledSendAt ? new Date(initialData.scheduledSendAt).toISOString().slice(0, 16) : undefined}
                            className="w-full sm:w-56 bg-background/50 border-white/5 h-12 text-sm font-bold rounded-xl shadow-lg"
                        />
                    </div>
                </div>
            </div>



            {/* ===== Section Toggle (Platform Configurator) ===== */}
            <div className="bg-card/30 p-6 md:p-8 rounded-2xl md:rounded-3xl border border-white/10 backdrop-blur-xl shadow-xl space-y-5 mb-12">
                <div className={isRtl ? 'text-right' : ''}>
                    <h3 className="text-xl font-black mb-1">{isRtl ? 'محتويات التقرير' : 'Report Contents'}</h3>
                    <p className="text-sm text-muted-foreground">{isRtl ? 'فعّل المنصات والأقسام التي تريد تضمينها في هذا التقرير.' : 'Toggle the platforms and sections you want to include in this report.'}</p>
                </div>
                <div className={`flex flex-wrap gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    {PLATFORMS.map(plat => {
                        const isActive = activeSections.includes(plat.id);
                        return (
                            <button
                                type="button"
                                key={plat.id}
                                onClick={() => toggleSection(plat.id)}
                                className={`flex items-center gap-2 py-2.5 px-5 rounded-2xl font-bold text-sm transition-all duration-300 border ${isActive ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-[1.02]' : 'bg-background/80 text-foreground/70 border-white/5 hover:bg-white/10 hover:scale-[1.02]'}`}
                            >
                                <plat.icon className={`h-4 w-4 ${isActive ? 'text-white' : plat.color}`} />
                                {plat.name}
                            </button>
                        );
                    })}
                    <div className="w-px h-10 bg-white/10 mx-1 hidden sm:block self-center" />
                    <button type="button" onClick={() => toggleSection('email')}
                        className={`flex items-center gap-2 py-2.5 px-5 rounded-2xl font-bold text-sm transition-all duration-300 border ${activeSections.includes('email') ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20 scale-[1.02]' : 'bg-background/80 text-foreground/70 border-white/5 hover:bg-white/10 hover:scale-[1.02]'}`}>
                        <Mail className={`h-4 w-4 ${activeSections.includes('email') ? 'text-white' : 'text-rose-400'}`} />
                        {isRtl ? 'الإيميل التسويقي' : 'Email Marketing'}
                    </button>
                    <button type="button" onClick={() => toggleSection('seo')}
                        className={`flex items-center gap-2 py-2.5 px-5 rounded-2xl font-bold text-sm transition-all duration-300 border ${activeSections.includes('seo') ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20 scale-[1.02]' : 'bg-background/80 text-foreground/70 border-white/5 hover:bg-white/10 hover:scale-[1.02]'}`}>
                        <Globe className={`h-4 w-4 ${activeSections.includes('seo') ? 'text-white' : 'text-emerald-400'}`} />
                        {isRtl ? 'الموقع و SEO' : 'Website & SEO'}
                    </button>
                    <button type="button" onClick={() => toggleSection('summary')}
                        className={`flex items-center gap-2 py-2.5 px-5 rounded-2xl font-bold text-sm transition-all duration-300 border ${activeSections.includes('summary') ? 'bg-purple-500 text-white border-purple-500 shadow-lg shadow-purple-500/20 scale-[1.02]' : 'bg-background/80 text-foreground/70 border-white/5 hover:bg-white/10 hover:scale-[1.02]'}`}>
                        <BarChart3 className={`h-4 w-4 ${activeSections.includes('summary') ? 'text-white' : 'text-purple-400'}`} />
                        {isRtl ? 'الملخص الاستراتيجي' : 'Strategic Summary'}
                    </button>
                </div>
            </div>

            {/* ===== Vertical Stacked Sections ===== */}
            <div className="space-y-16">

                {/* ---- Platform Sections ---- */}
                {PLATFORMS.map(p => activeSections.includes(p.id) && (
                    <div key={p.id} className="space-y-6">
                        {/* Section Header */}
                        <div className={`flex items-center gap-4 border-b-2 border-white/10 pb-5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 shadow-inner">
                                <p.icon className={`h-8 w-8 ${p.color}`} />
                            </div>
                            <div className={isRtl ? 'text-right' : ''}>
                                <h2 className="text-3xl font-black tracking-tight">{p.name}</h2>
                                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{isRtl ? 'أداء المنصة' : 'Platform Performance'}</p>
                            </div>
                        </div>

                        <div className="grid gap-6">
                            {/* Analytics Summary Bar */}
                            <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <CalcMetric label={isRtl ? 'معدل التفاعل التقديري' : "Est. Engagement Rate"} value={getPlatformCalcs(p.id).engRate} suffix="%" />
                                <CalcMetric label={isRtl ? 'متوسط تكلفة النتيجة' : "Avg. Cost per Result"} value={getPlatformCalcs(p.id).cpa} prefix="SAR " />
                                <CalcMetric label={isRtl ? 'الوصول في المنصة' : "Platform Reach"} value={(Number(activeCampaign.platforms[p.id]?.paidReach) || 0) + (Number(activeCampaign.platforms[p.id]?.organicReach) || 0)} />
                                <div className={`p-4 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                                    <div className={`flex flex-col ${isRtl ? 'text-right' : ''}`}>
                                        <span className="text-[10px] font-black uppercase text-primary/80 mb-1 leading-tight">{isRtl ? 'حالة البيانات' : 'Platform Status'}</span>
                                        <span className="text-sm font-black text-primary">{isRtl ? 'جاهزة' : 'DATA READY'}</span>
                                    </div>
                                    <Zap className="h-5 w-5 text-primary animate-pulse" />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-3 gap-6">
                                {/* Dynamic Metrics Panel */}
                                <Card className="border-white/10 bg-card/20 backdrop-blur-md shadow-lg overflow-hidden md:col-span-2">
                                    <CardHeader className="bg-primary/5 border-b border-white/5 py-4">
                                        <CardTitle className={`text-xs font-black uppercase tracking-[0.2em] text-primary/80 flex items-center gap-2 ${isRtl ? 'flex-row-reverse text-right' : ''}`}>
                                            <TrendingUp className="h-3 w-3" /> {isRtl ? 'مقاييس الأداء' : 'Performance Metrics'}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {(PLATFORM_METRICS[p.id] || []).map((metric) => (
                                            <MetricField
                                                key={metric.id}
                                                label={isRtl ? metric.labelAr : metric.labelEn}
                                                icon={metric.icon}
                                                value={activeCampaign.platforms[p.id]?.[metric.id]}
                                                onChange={(v) => updatePlatformMetric(p.id, metric.id, v)}
                                            />
                                        ))}
                                        {(p.id === 'tiktok' || p.id === 'youtube') && (
                                            <MetricField
                                                label={isRtl ? "وقت المشاهدة" : "Avg. Watch Time"}
                                                icon={Eye}
                                                value={activeCampaign.platforms[p.id]?.watchTime}
                                                onChange={(v) => updatePlatformMetric(p.id, 'watchTime', v)}
                                                suffix="s"
                                            />
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Paid Performance Panel */}
                                <Card className="border-white/10 bg-card/20 backdrop-blur-md shadow-lg overflow-hidden">
                                    <CardHeader className="bg-primary/5 border-b border-white/5 py-4">
                                        <CardTitle className={`text-xs font-black uppercase tracking-[0.2em] text-primary/80 flex items-center gap-2 ${isRtl ? 'flex-row-reverse text-right' : ''}`}>
                                            <DollarSign className="h-3 w-3" /> {isRtl ? 'الأداء الممول' : 'Paid Performance'}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-6">
                                        <div className="space-y-4">
                                            <div className={`flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                                                <Label className="text-[10px] font-black uppercase text-primary tracking-widest">{isRtl ? 'تفاصيل الحملات' : 'Campaign Details'}</Label>
                                                <Button type="button" variant="outline" size="sm"
                                                    className="h-7 text-[10px] font-bold rounded-lg border-primary/20 text-primary hover:bg-primary/10"
                                                    onClick={() => addPaidCampaign(p.id)}>
                                                    {isRtl ? '+ إضافة حملة' : '+ Add Campaign'}
                                                </Button>
                                            </div>
                                            <div className="space-y-4">
                                                {(activeCampaign.platforms[p.id]?.paidCampaigns || []).map((camp: any, idx: number) => (
                                                    <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3 relative group/camp">
                                                        <Button type="button" variant="ghost" size="icon"
                                                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-white opacity-0 group-hover/camp:opacity-100 transition-opacity"
                                                            onClick={() => removePaidCampaign(p.id, idx)}>
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                        <Input placeholder={isRtl ? "اسم الحملة" : "Campaign Name"} value={camp.name}
                                                            onChange={(e) => updatePaidCampaign(p.id, idx, 'name', e.target.value)}
                                                            className="h-8 text-xs font-bold bg-background/50 border-white/5" />
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="space-y-1">
                                                                <Label className="text-[9px] font-black uppercase text-muted-foreground/60 ml-1">{isRtl ? 'الهدف' : 'Objective'}</Label>
                                                                <Select value={camp.objective} onValueChange={(v) => updatePaidCampaign(p.id, idx, 'objective', v)}>
                                                                    <SelectTrigger className="h-9 text-[10px] font-bold bg-background/50 border-white/5 rounded-lg"><SelectValue placeholder="Objective" /></SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="AWARENESS">{isRtl ? 'وعي' : 'Awareness'}</SelectItem>
                                                                        <SelectItem value="REACH">{isRtl ? 'وصول' : 'Reach'}</SelectItem>
                                                                        <SelectItem value="TRAFFIC">{isRtl ? 'زيارة موقع' : 'Traffic'}</SelectItem>
                                                                        <SelectItem value="ENGAGEMENT">{isRtl ? 'تفاعل' : 'Engagement'}</SelectItem>
                                                                        <SelectItem value="MESSAGES">{isRtl ? 'رسايل' : 'Messages'}</SelectItem>
                                                                        <SelectItem value="LEADS">{isRtl ? 'ليدز' : 'Leads'}</SelectItem>
                                                                        <SelectItem value="CONVERSIONS">{isRtl ? 'تحويلات' : 'Conversions'}</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label className="text-[9px] font-black uppercase text-muted-foreground/60 ml-1">{isRtl ? 'الصرف (ريال)' : 'Spend (SAR)'}</Label>
                                                                <Input type="number" placeholder="0" value={camp.spend}
                                                                    onChange={(e) => updatePaidCampaign(p.id, idx, 'spend', e.target.value)}
                                                                    className="h-9 text-xs font-bold bg-background/50 border-white/5 rounded-lg" />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="space-y-1">
                                                                <Label className="text-[9px] font-black uppercase text-muted-foreground/60 ml-1">{isRtl ? 'الوصول' : 'Reach'}</Label>
                                                                <Input type="number" placeholder="0" value={camp.reach}
                                                                    onChange={(e) => updatePaidCampaign(p.id, idx, 'reach', e.target.value)}
                                                                    className="h-9 text-xs font-bold bg-background/50 border-white/5 rounded-lg" />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label className="text-[9px] font-black uppercase text-muted-foreground/60 ml-1">
                                                                    {camp.objective === 'MESSAGES' ? (isRtl ? 'المحادثات' : 'Messages') : camp.objective === 'LEADS' ? (isRtl ? 'ليدز' : 'Leads') : camp.objective === 'ENGAGEMENT' ? (isRtl ? 'التفاعلات' : 'Engagements') : (isRtl ? 'النتائج' : 'Results')}
                                                                </Label>
                                                                <Input type="number" placeholder="0" value={camp.results}
                                                                    onChange={(e) => updatePaidCampaign(p.id, idx, 'results', e.target.value)}
                                                                    className="h-9 text-xs font-bold bg-background/50 border-white/5 rounded-lg" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        {(p.id === 'google' || p.id === 'linkedin') && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <MetricField label="Clicks" icon={MousePointer2} value={activeCampaign.platforms[p.id]?.clicks} onChange={(v) => updatePlatformMetric(p.id, 'clicks', v)} />
                                                <MetricField label="CPC" icon={DollarSign} value={activeCampaign.platforms[p.id]?.cpc} onChange={(v) => updatePlatformMetric(p.id, 'cpc', v)} prefix="SAR " />
                                            </div>
                                        )}
                                        {/* Linked Posts */}
                                        <div className="space-y-3 pt-2">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-[10px] font-black uppercase text-primary/80 tracking-widest">{isRtl ? 'المنشورات المرتبطة' : 'Linked Posts'}</Label>
                                                <Button type="button" variant="ghost" size="sm" className="h-7 text-[10px] font-bold text-primary"
                                                    onClick={() => { setSelectedPlatformForLinking(p.id); setIsPostSelectorOpen(true); }}>
                                                    <Link className="h-3 w-3 mr-1" />
                                                    {isRtl ? 'ربط منشور' : 'Link Post'}
                                                </Button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                {(activeCampaign.linkedItems || []).filter((item: any) => item.platform === p.id).map((item: any) => (
                                                    <div key={item.id} className="relative group/post aspect-square rounded-xl overflow-hidden border border-white/10 bg-white/5">
                                                        {item.imageUrl ? (<img src={item.imageUrl} alt="" className="w-full h-full object-cover" />) : item.videoUrl ? (
                                                            <div className="w-full h-full bg-slate-900 flex items-center justify-center"><Video className="h-6 w-6 text-white/40" /></div>
                                                        ) : (<div className="w-full h-full p-2 text-[8px] overflow-hidden text-muted-foreground">{item.captionEn || item.captionAr}</div>)}
                                                        <Button type="button" variant="ghost" size="icon"
                                                            className="absolute top-1 right-1 h-6 w-6 rounded-full bg-destructive text-white opacity-0 group-hover/post:opacity-100 transition-opacity"
                                                            onClick={() => unlinkPost(item.id)}>
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Platform Note */}
                            <div className={`space-y-2 ${isRtl ? 'text-right' : ''}`}>
                                <Label className={`text-xs font-black uppercase tracking-wider text-muted-foreground ${isRtl ? 'mr-1 flex-row-reverse' : 'ml-1'} flex items-center gap-2`}>
                                    <MessageSquare className="h-3 w-3" /> {isRtl ? 'ملاحظة المنصة (اختياري)' : 'Platform Note (Optional)'}
                                </Label>
                                <textarea
                                    className={`flex w-full rounded-2xl border border-white/10 bg-background/50 p-4 text-sm font-medium shadow-inner focus:border-primary/50 focus:ring-primary/20 transition-all outline-none placeholder:text-muted-foreground/40 min-h-[80px] ${isRtl ? 'text-right' : ''}`}
                                    placeholder={isRtl ? `أضف رؤية أو تعليقاً على أداء ${p.name} هذا الشهر...` : `Add a specific insight or comment about ${p.name} performance this month...`}
                                    value={activeCampaign.platforms[p.id]?.comment || ""}
                                    onChange={e => updatePlatformMetric(p.id, 'comment', e.target.value)}
                                    dir={isRtl ? 'rtl' : 'ltr'}
                                />
                                <p className={`text-[10px] text-muted-foreground ${isRtl ? 'mr-1' : 'ml-1'}`}>{isRtl ? 'سيظهر هذا التعليق للعميل في التقرير.' : 'This comment will be visible to the client in their report.'}</p>
                            </div>
                        </div>
                    </div>
                ))}

                {/* ---- Email Marketing Section ---- */}
                {activeSections.includes('email') && (
                    <div className="space-y-6">
                        <div className={`flex items-center gap-4 border-b-2 border-rose-500/20 pb-5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <div className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20 shadow-inner">
                                <Mail className="h-8 w-8 text-rose-500" />
                            </div>
                            <div className={isRtl ? 'text-right' : ''}>
                                <h2 className="text-3xl font-black tracking-tight">{isRtl ? 'البريد الإلكتروني' : 'Email Marketing'}</h2>
                                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{isRtl ? 'أداء الحملات' : 'Campaign Performance'}</p>
                            </div>
                        </div>
                        <div className="space-y-6">
                            {(metrics.emailMarketing?.campaigns || []).map((camp: any, idx: number) => (
                                <div key={idx} className="relative group/ec bg-card/20 border border-white/10 rounded-2xl overflow-hidden shadow-lg">
                                    <div className="bg-rose-500/5 border-b border-white/5 p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Mail className="h-4 w-4 text-rose-400" />
                                            <Input placeholder={isRtl ? `اسم الحملة ${idx + 1}` : `Campaign ${idx + 1} Name`} value={camp.name}
                                                onChange={(e) => updateEmailCampaign(idx, 'name', e.target.value)}
                                                className="h-8 w-56 text-sm font-bold bg-transparent border-white/10 focus:border-rose-400/50" />
                                        </div>
                                        {(metrics.emailMarketing?.campaigns || []).length > 1 && (
                                            <Button type="button" variant="ghost" size="icon"
                                                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive"
                                                onClick={() => removeEmailCampaign(idx)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                    <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-5">
                                        <MetricField label={isRtl ? 'عدد الإيميلات' : 'Emails Sent'} icon={Mail} value={camp.emailsSent} onChange={(v) => updateEmailCampaign(idx, 'emailsSent', v)} />
                                        <MetricField label={isRtl ? 'معدل الفتح' : 'Open Rate'} icon={Eye} value={camp.openRate} onChange={(v) => updateEmailCampaign(idx, 'openRate', v)} suffix="%" />
                                        <MetricField label={isRtl ? 'معدل النقر' : 'Click Rate'} icon={MousePointer2} value={camp.clickRate} onChange={(v) => updateEmailCampaign(idx, 'clickRate', v)} suffix="%" />
                                        <MetricField label={isRtl ? 'إلغاء الاشتراك' : 'Unsubscribes'} icon={Users} value={camp.unsubscribes} onChange={(v) => updateEmailCampaign(idx, 'unsubscribes', v)} />
                                    </div>
                                </div>
                            ))}
                            <Button type="button" variant="outline"
                                className="w-full h-14 rounded-2xl border-dashed border-rose-400/40 text-rose-400 hover:bg-rose-500/5 font-bold text-base"
                                onClick={addEmailCampaign}>
                                <Mail className="h-4 w-4 mr-2" />
                                {isRtl ? '+ إضافة حملة إيميل جديدة' : '+ Add Email Campaign'}
                            </Button>
                        </div>
                    </div>
                )}

                {/* ---- Website & SEO Section ---- */}
                {activeSections.includes('seo') && (
                    <div className="space-y-6">
                        <div className={`flex items-center gap-4 border-b-2 border-emerald-500/20 pb-5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 shadow-inner">
                                <Globe className="h-8 w-8 text-emerald-500" />
                            </div>
                            <div className={isRtl ? 'text-right' : ''}>
                                <h2 className="text-3xl font-black tracking-tight">{isRtl ? 'الموقع و SEO' : 'Website & SEO'}</h2>
                                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{isRtl ? 'أداء الموقع' : 'Website Performance'}</p>
                            </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-8">
                            <Card className="border-white/10 bg-card/20 backdrop-blur-md shadow-lg">
                                <CardHeader className="bg-emerald-500/5 border-b border-white/5">
                                    <CardTitle className="text-emerald-400 flex items-center gap-2 text-sm font-black uppercase tracking-widest">
                                        <Globe className="h-4 w-4" /> {isRtl ? 'مقاييس الموقع و SEO' : 'Website & SEO Metrics'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 grid grid-cols-2 gap-6">
                                    <MetricField label="SEO Score" icon={Globe} value={metrics.seo?.score} onChange={(v) => updateSEOMetric('score', v)} suffix="/100" />
                                    <MetricField label={isRtl ? "النقرات" : "Clicks"} icon={MousePointer2} value={metrics.seo?.clicks} onChange={(v) => updateSEOMetric('clicks', v)} />
                                    <MetricField label={isRtl ? "الظهور" : "Impressions"} icon={Eye} value={metrics.seo?.impressions} onChange={(v) => updateSEOMetric('impressions', v)} />
                                    <MetricField label={isRtl ? "سرعة الصفحة" : "Page Speed"} icon={Zap} value={metrics.seo?.speed} onChange={(v) => updateSEOMetric('speed', v)} />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {/* ---- Executive Strategic Summary Section ---- */}
                {activeSections.includes('summary') && (
                    <div className="space-y-6">
                        <div className={`flex items-center gap-4 border-b-2 border-purple-500/20 pb-5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <div className="p-4 bg-purple-500/10 rounded-2xl border border-purple-500/20 shadow-inner">
                                <BarChart3 className="h-8 w-8 text-purple-500" />
                            </div>
                            <div className={isRtl ? 'text-right' : ''}>
                                <h2 className="text-3xl font-black tracking-tight">{isRtl ? 'الملخص الاستراتيجي التنفيذي' : 'Executive Strategic Summary'}</h2>
                                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{isRtl ? 'الرؤية والتوجه' : 'Vision & Direction'}</p>
                            </div>
                        </div>
                        <Card className="border-white/10 bg-card/30 backdrop-blur-md shadow-2xl">
                            <CardHeader className={`border-b border-white/5 flex flex-row items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <CardTitle className={`text-xl font-black flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                    <BarChart3 className="h-5 w-5 text-primary" /> {isRtl ? 'اكتب الملخص أو ولده بذكاء' : 'Write or AI Auto-generate'}
                                </CardTitle>
                                <Button
                                    type="button"
                                    onClick={async () => {
                                        setIsGeneratingSummary(true);
                                        try {
                                            const result = await generateReportSummary(metrics);
                                            setMetrics((prev: any) => ({ ...prev, summary: isRtl ? result.summaryAr : result.summaryEn }));
                                            toast.success(isRtl ? "تم توليد الملخص بنجاح" : "Summary generated successfully");
                                        } catch (err) {
                                            toast.error("Failed to generate summary");
                                        } finally {
                                            setIsGeneratingSummary(false);
                                        }
                                    }}
                                    disabled={isGeneratingSummary}
                                    className="h-10 px-6 rounded-xl bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 font-bold uppercase tracking-widest text-xs"
                                >
                                    {isGeneratingSummary ? <Zap className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                                    {isRtl ? "توليد بالذكاء الاصطناعي" : "AI Auto Generate"}
                                </Button>
                            </CardHeader>
                            <CardContent className="p-8">
                                <div className="space-y-4">
                                    <p className={`text-sm text-muted-foreground font-semibold ${isRtl ? 'text-right' : ''}`}>
                                        {isRtl ? 'هذا الملخص يظهر في أعلى التقرير وهو أول ما يقرأه العميل. احرص على أن يعكس الإنجازات الرئيسية والتوصيات الاستراتيجية بوضوح.' : 'This summary appears at the top of the report and is the first thing the client reads. Make sure it reflects key achievements and strategic recommendations.'}
                                    </p>
                                    <textarea
                                        name="summary"
                                        rows={10}
                                        required
                                        value={metrics.summary || ""}
                                        onChange={(e) => setMetrics((prev: any) => ({ ...prev, summary: e.target.value }))}
                                        className={`flex w-full rounded-2xl border-white/10 bg-background/50 p-6 text-base font-medium shadow-inner focus:border-primary/50 focus:ring-primary/20 transition-all outline-none leading-relaxed ${isRtl ? 'text-right' : ''}`}
                                        placeholder={isRtl ? "ملخص أداء هذا الشهر، النتائج الاستراتيجية للمنصات والموقع، وتوصيات الشهر القادم..." : "Summary of this month's performance, strategic results for platforms and website, and recommendations for next month..."}
                                        dir={isRtl ? 'rtl' : 'ltr'}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>




            {/* Bottom Actions */}
            <div className={`fixed bottom-0 left-0 right-0 p-6 bg-background/80 backdrop-blur-2xl border-t border-white/5 flex items-center justify-end gap-6 z-50 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                        {isRtl ? 'جدولة الإرسال' : 'Schedule Delivery'}
                    </Label>
                    <Input
                        type="date"
                        value={scheduledSendAt}
                        onChange={(e) => setScheduledSendAt(e.target.value)}
                        className="h-10 w-44 rounded-xl bg-background/50 border-white/10 text-xs font-bold"
                    />
                </div>
                <div className="h-8 w-px bg-white/10 hidden md:block" />
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => router.back()}
                    className="h-14 px-8 text-base font-bold rounded-2xl hover:bg-white/5"
                >
                    {isRtl ? 'إلغاء العمل' : 'Cancel Work'}
                </Button>
                <Button
                    type="submit"
                    disabled={loading}
                    className="h-14 px-12 text-lg font-black rounded-2xl bg-gradient-to-r from-primary to-purple-600 hover:shadow-2xl hover:shadow-primary/40 transition-all duration-300"
                >
                    {loading ? (
                        <span className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <Zap className="h-5 w-5 animate-spin" /> {initialData ? (isRtl ? "جاري التحديث..." : "Optimizing Database...") : (isRtl ? "جاري التوليد..." : "Engine Generating...")}
                        </span>
                    ) : (
                        <span className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <Save className="h-5 w-5" /> {initialData ? (isRtl ? "تطبيق التعديلات" : "Apply Refinements") : (isRtl ? "اعتماد وإرسال التقرير" : "Finalize & Broadcast Report")}
                        </span>
                    )}
                </Button>
            </div>
            {/* Post Selector Dialog */}
            <Dialog open={isPostSelectorOpen} onOpenChange={setIsPostSelectorOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-card border-white/10">
                    <DialogHeader>
                        <DialogTitle>{isRtl ? 'اختر منشوراً للربط' : 'Select Post to Link'}</DialogTitle>
                    </DialogHeader>
                    {approvedPosts.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground">
                            {isRtl ? 'لا توجد منشورات معتمدة لهذا العميل.' : 'No approved posts found for this client.'}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4">
                            {approvedPosts.filter(p => p.platform?.toLowerCase() === selectedPlatformForLinking?.toLowerCase()).map((post) => (
                                <div
                                    key={post.id}
                                    className="cursor-pointer group relative aspect-square rounded-xl overflow-hidden border border-white/5 hover:border-primary/50 transition-all"
                                    onClick={() => linkPost(post)}
                                >
                                    {post.imageUrl ? (
                                        <img src={post.imageUrl} alt="" className="w-full h-full object-cover" />
                                    ) : post.videoUrl ? (
                                        <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                                            <Video className="h-8 w-8 text-white/40" />
                                        </div>
                                    ) : (
                                        <div className="w-full h-full p-4 bg-white/5 text-[10px] text-muted-foreground line-clamp-6">
                                            {post.captionEn || post.captionAr}
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Link className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60 backdrop-blur-sm">
                                        <p className="text-[8px] text-white font-bold truncate">
                                            {post.scheduledDate ? new Date(post.scheduledDate).toISOString().split('T')[0] : ""}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </form >
    );
}

