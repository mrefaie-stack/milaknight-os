"use client";

import { useState, useMemo, useEffect } from "react";
import { createReport, updateReport } from "@/app/actions/report";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    Save,
    BarChart3,
    Trash2,
    Link,
    X,
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
    { id: "google", name: "Google Ads", icon: Search, color: "text-red-500" },
    { id: "youtube", name: "YouTube", icon: Youtube, color: "text-red-600" },
];

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
    const router = useRouter();

    const initialMetrics = initialData?.metrics ? (typeof initialData.metrics === 'string' ? JSON.parse(initialData.metrics) : initialData.metrics) : {
        campaigns: [
            { id: "main", name: isRtl ? "الحملة الرئيسية" : "Main Campaign", platforms: {}, linkedItems: [] }
        ],
        emailMarketing: { emailsSent: 0, openRate: 0, clickRate: 0, unsubscribes: 0 },
        seo: { score: 0, rank: "", notes: "", speed: 0, mobile: 0 },
        summary: ""
    };

    const [metrics, setMetrics] = useState(initialMetrics);
    const [selectedCampaignId, setSelectedCampaignId] = useState(initialMetrics.campaigns[0].id);
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


    const updateEmailMetric = (field: string, value: string) => {
        const numValue = parseFloat(value) || 0;
        setMetrics((prev: any) => ({
            ...prev,
            emailMarketing: {
                ...prev.emailMarketing,
                [field]: numValue
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
            if (initialData) {
                await updateReport(initialData.id, finalMetrics, month, clientId);
                toast.success("Report updated successfully!");
                router.push(`/am/reports/${initialData.id}`);
            } else {
                const report = await createReport(clientId, month, finalMetrics);
                toast.success("Report generated and sent to client!");
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
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-card/30 p-8 rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl">
                <div className={isRtl ? 'text-right' : ''}>
                    <h1 className="text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                        {isRtl ? 'إنشاء تقرير أداء' : 'Generate Report'}
                    </h1>
                    <p className="text-muted-foreground text-lg font-medium mt-2">
                        {isRtl ? 'قم ببناء مراجعة أداء احترافية لعميلك.' : 'Build a premium performance review for your client.'}
                    </p>
                </div>
                <div className={`flex flex-col sm:flex-row gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <div className="space-y-1">
                        <Label className={`text-[10px] font-black uppercase text-muted-foreground ${isRtl ? 'mr-1 text-right' : 'ml-1'}`}>
                            {isRtl ? 'العميل' : 'Client'}
                        </Label>
                        <Select name="clientId" defaultValue={initialData?.clientId} onValueChange={setCurrentClientId} required>
                            <SelectTrigger className="w-64 bg-background/50 border-white/5 h-12 text-base font-bold rounded-xl shadow-lg">
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
                            className="w-48 bg-background/50 border-white/5 h-12 text-base font-bold rounded-xl shadow-lg"
                            required
                        />
                    </div>
                </div>
            </div>

            {/* Campaign Management Bar */}
            <div className="bg-card/30 p-4 rounded-2xl border border-white/10 backdrop-blur-md shadow-xl flex flex-wrap items-center gap-4">
                <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                    {metrics.campaigns.map((camp: any) => (
                        <div key={camp.id} className="flex items-center gap-1 group/btn">
                            <Button
                                type="button"
                                variant={selectedCampaignId === camp.id ? "default" : "outline"}
                                className={`rounded-xl h-10 px-4 font-bold transition-all ${selectedCampaignId === camp.id ? 'scale-105 shadow-lg' : 'bg-background/40 border-white/5 opacity-70 hover:opacity-100'}`}
                                onClick={() => setSelectedCampaignId(camp.id)}
                            >
                                {camp.name}
                            </Button>
                            {metrics.campaigns.length > 1 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive opacity-0 group-hover/btn:opacity-100 transition-opacity"
                                    onClick={() => deleteCampaign(camp.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    ))}
                    <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl h-10 px-4 font-bold border-dashed border-primary/40 text-primary hover:bg-primary/5"
                        onClick={addCampaign}
                    >
                        {isRtl ? '+ إضافة حملة' : '+ Add Campaign'}
                    </Button>
                </div>

                {selectedCampaignId && (
                    <div className="flex items-center gap-2">
                        <Input
                            className="w-48 h-10 bg-background/50 border-white/5 rounded-xl text-sm font-bold"
                            value={activeCampaign.name}
                            onChange={(e) => updateCampaignName(selectedCampaignId, e.target.value)}
                            placeholder={isRtl ? "تعديل اسم الحملة" : "Rename Campaign"}
                        />
                    </div>
                )}
            </div>

            <Tabs defaultValue="facebook" className="w-full">
                <div className="bg-card/30 p-2 rounded-2xl border border-white/10 backdrop-blur-md mb-8 shadow-xl overflow-hidden">
                    <TabsList className="w-full justify-start h-auto bg-transparent gap-2 overflow-x-auto no-scrollbar pb-1">
                        {PLATFORMS.map(p => (
                            <TabsTrigger
                                key={p.id}
                                value={p.id}
                                className="group flex-shrink-0 gap-3 py-3 px-6 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
                            >
                                <p.icon className={`h-4 w-4 ${p.color} transition-colors group-data-[state=active]:text-white`} />
                                <span className="font-bold tracking-tight">{p.name}</span>
                            </TabsTrigger>
                        ))}
                        <TabsTrigger value="email" className="group flex-shrink-0 gap-3 py-3 px-6 rounded-xl data-[state=active]:bg-rose-500 data-[state=active]:text-white">
                            <Mail className="h-4 w-4 text-rose-400 transition-colors group-data-[state=active]:text-white" />
                            <span className="font-bold tracking-tight">{isRtl ? 'البريد' : 'Email'}</span>
                        </TabsTrigger>
                        <TabsTrigger value="seo" className="group flex-shrink-0 gap-3 py-3 px-6 rounded-xl data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
                            <Globe className="h-4 w-4 text-emerald-400 transition-colors group-data-[state=active]:text-white" />
                            <span className="font-bold tracking-tight">{isRtl ? 'SEO والملخص' : 'SEO & Summary'}</span>
                        </TabsTrigger>
                    </TabsList>
                </div>

                {PLATFORMS.map(p => (
                    <TabsContent key={p.id} value={p.id} className="mt-0 focus-visible:ring-0">
                        <div className="grid gap-6">
                            {/* Analytics Summary Bar */}
                            <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <CalcMetric label={isRtl ? 'معدل التفاعل التقديري' : "Est. Engagement Rate"} value={getPlatformCalcs(p.id).engRate} suffix="%" />
                                <CalcMetric label={isRtl ? 'متوسط تكلفة النتيجة' : "Avg. Cost per Result"} value={getPlatformCalcs(p.id).cpa} prefix="SAR " />
                                <CalcMetric label={isRtl ? 'الوصول في المنصة' : "Platform Reach"} value={(Number(metrics.platforms[p.id]?.paidReach) || 0) + (Number(metrics.platforms[p.id]?.organicReach) || 0)} />
                                <div className={`p-4 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                                    <div className={`flex flex-col ${isRtl ? 'text-right' : ''}`}>
                                        <span className="text-[10px] font-black uppercase text-primary/80 mb-1 leading-tight">
                                            {isRtl ? 'حالة البيانات' : 'Platform Status'}
                                        </span>
                                        <span className="text-sm font-black text-primary">
                                            {isRtl ? 'جاهزة' : 'DATA READY'}
                                        </span>
                                    </div>
                                    <Zap className="h-5 w-5 text-primary animate-pulse" />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-3 gap-6">
                                {/* Awareness & Growth */}
                                <Card className="border-white/10 bg-card/20 backdrop-blur-md shadow-lg overflow-hidden">
                                    <CardHeader className="bg-primary/5 border-b border-white/5 py-4">
                                        <CardTitle className={`text-xs font-black uppercase tracking-[0.2em] text-primary/80 flex items-center gap-2 ${isRtl ? 'flex-row-reverse text-right' : ''}`}>
                                            <TrendingUp className="h-3 w-3" /> {isRtl ? 'النمو والوعي' : 'Growth & Awareness'}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-5">
                                        <MetricField
                                            label="New Followers"
                                            icon={Users}
                                            value={metrics.platforms[p.id]?.followers}
                                            onChange={(v) => updatePlatformMetric(p.id, 'followers', v)}
                                        />
                                        <MetricField
                                            label="Impressions"
                                            icon={Eye}
                                            value={metrics.platforms[p.id]?.impressions}
                                            onChange={(v) => updatePlatformMetric(p.id, 'impressions', v)}
                                        />
                                        <MetricField
                                            label="Organic Reach"
                                            icon={Globe}
                                            value={metrics.platforms[p.id]?.organicReach}
                                            onChange={(v) => updatePlatformMetric(p.id, 'organicReach', v)}
                                        />
                                        {(p.id === 'instagram' || p.id === 'facebook') && (
                                            <MetricField
                                                label="Profile Visits"
                                                icon={Target}
                                                value={metrics.platforms[p.id]?.profileVisits}
                                                onChange={(v) => updatePlatformMetric(p.id, 'profileVisits', v)}
                                            />
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Engagement & Content */}
                                <Card className="border-white/10 bg-card/20 backdrop-blur-md shadow-lg overflow-hidden">
                                    <CardHeader className="bg-primary/5 border-b border-white/5 py-4">
                                        <CardTitle className={`text-xs font-black uppercase tracking-[0.2em] text-primary/80 flex items-center gap-2 ${isRtl ? 'flex-row-reverse text-right' : ''}`}>
                                            <MessageSquare className="h-3 w-3" /> {isRtl ? 'التفاعل والمحتوى' : 'Interaction & Content'}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-5">
                                        <MetricField
                                            label="Total Engagement"
                                            icon={MousePointer2}
                                            value={metrics.platforms[p.id]?.engagement}
                                            onChange={(v) => updatePlatformMetric(p.id, 'engagement', v)}
                                        />
                                        <MetricField
                                            label="Total Views"
                                            icon={Video}
                                            value={metrics.platforms[p.id]?.views}
                                            onChange={(v) => updatePlatformMetric(p.id, 'views', v)}
                                        />
                                        <MetricField
                                            label="Content Shares"
                                            icon={Share2}
                                            value={metrics.platforms[p.id]?.shares}
                                            onChange={(v) => updatePlatformMetric(p.id, 'shares', v)}
                                        />
                                        {(p.id === 'tiktok' || p.id === 'youtube') && (
                                            <MetricField
                                                label="Avg. Watch Time"
                                                icon={Eye}
                                                value={metrics.platforms[p.id]?.watchTime}
                                                onChange={(v) => updatePlatformMetric(p.id, 'watchTime', v)}
                                                suffix="s"
                                            />
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Conversion & Performance */}
                                <Card className="border-white/10 bg-card/20 backdrop-blur-md shadow-lg overflow-hidden">
                                    <CardHeader className="bg-primary/5 border-b border-white/5 py-4">
                                        <CardTitle className={`text-xs font-black uppercase tracking-[0.2em] text-primary/80 flex items-center gap-2 ${isRtl ? 'flex-row-reverse text-right' : ''}`}>
                                            <DollarSign className="h-3 w-3" /> {isRtl ? 'الأداء الممول' : 'Paid Performance'}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-6">
                                        {/* Campaign Manager */}
                                        <div className="space-y-4">
                                            <div className={`flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                                                <Label className="text-[10px] font-black uppercase text-primary tracking-widest">
                                                    {isRtl ? 'تفاصيل الحملات' : 'Campaign Details'}
                                                </Label>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 text-[10px] font-bold rounded-lg border-primary/20 text-primary hover:bg-primary/10"
                                                    onClick={() => addPaidCampaign(p.id)}
                                                >
                                                    {isRtl ? '+ إضافة حملة' : '+ Add Campaign'}
                                                </Button>
                                            </div>

                                            <div className="space-y-4">
                                                {(activeCampaign.platforms[p.id]?.paidCampaigns || []).map((camp: any, idx: number) => (
                                                    <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3 relative group/camp">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-white opacity-0 group-hover/camp:opacity-100 transition-opacity"
                                                            onClick={() => removePaidCampaign(p.id, idx)}
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>

                                                        <Input
                                                            placeholder={isRtl ? "اسم الحملة" : "Campaign Name"}
                                                            value={camp.name}
                                                            onChange={(e) => updatePaidCampaign(p.id, idx, 'name', e.target.value)}
                                                            className="h-8 text-xs font-bold bg-background/50 border-white/5"
                                                        />

                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="space-y-1">
                                                                <Label className="text-[9px] font-black uppercase text-muted-foreground/60 ml-1">
                                                                    {isRtl ? 'الهدف' : 'Objective'}
                                                                </Label>
                                                                <Select
                                                                    value={camp.objective}
                                                                    onValueChange={(v) => updatePaidCampaign(p.id, idx, 'objective', v)}
                                                                >
                                                                    <SelectTrigger className="h-9 text-[10px] font-bold bg-background/50 border-white/5 rounded-lg">
                                                                        <SelectValue placeholder="Objective" />
                                                                    </SelectTrigger>
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
                                                                <Label className="text-[9px] font-black uppercase text-muted-foreground/60 ml-1">
                                                                    {isRtl ? 'الصرف (ريال)' : 'Spend (SAR)'}
                                                                </Label>
                                                                <Input
                                                                    type="number"
                                                                    placeholder="0"
                                                                    value={camp.spend}
                                                                    onChange={(e) => updatePaidCampaign(p.id, idx, 'spend', e.target.value)}
                                                                    className="h-9 text-xs font-bold bg-background/50 border-white/5 rounded-lg"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="space-y-1">
                                                                <Label className="text-[9px] font-black uppercase text-muted-foreground/60 ml-1">
                                                                    {isRtl ? 'الوصول' : 'Reach'}
                                                                </Label>
                                                                <Input
                                                                    type="number"
                                                                    placeholder="0"
                                                                    value={camp.reach}
                                                                    onChange={(e) => updatePaidCampaign(p.id, idx, 'reach', e.target.value)}
                                                                    className="h-9 text-xs font-bold bg-background/50 border-white/5 rounded-lg"
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label className="text-[9px] font-black uppercase text-muted-foreground/60 ml-1">
                                                                    {
                                                                        camp.objective === 'MESSAGES' ? (isRtl ? 'المحادثات' : 'Messages') :
                                                                            camp.objective === 'LEADS' ? (isRtl ? 'ليدز' : 'Leads') :
                                                                                camp.objective === 'ENGAGEMENT' ? (isRtl ? 'التفاعلات' : 'Engagements') :
                                                                                    (isRtl ? 'النتائج' : 'Results')
                                                                    }
                                                                </Label>
                                                                <Input
                                                                    type="number"
                                                                    placeholder="0"
                                                                    value={camp.results}
                                                                    onChange={(e) => updatePaidCampaign(p.id, idx, 'results', e.target.value)}
                                                                    className="h-9 text-xs font-bold bg-background/50 border-white/5 rounded-lg"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {(p.id === 'google' || p.id === 'linkedin') && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <MetricField
                                                    label="Clicks"
                                                    icon={MousePointer2}
                                                    value={activeCampaign.platforms[p.id]?.clicks}
                                                    onChange={(v) => updatePlatformMetric(p.id, 'clicks', v)}
                                                />
                                                <MetricField
                                                    label="CPC"
                                                    icon={DollarSign}
                                                    value={activeCampaign.platforms[p.id]?.cpc}
                                                    onChange={(v) => updatePlatformMetric(p.id, 'cpc', v)}
                                                    prefix="SAR "
                                                />
                                            </div>
                                        )}

                                        {/* Linked Posts Section */}
                                        <div className="space-y-3 pt-2">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-[10px] font-black uppercase text-primary/80 tracking-widest">
                                                    {isRtl ? 'المنشورات المرتبطة' : 'Linked Posts'}
                                                </Label>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 text-[10px] font-bold text-primary"
                                                    onClick={() => {
                                                        setSelectedPlatformForLinking(p.id);
                                                        setIsPostSelectorOpen(true);
                                                    }}
                                                >
                                                    <Link className="h-3 w-3 mr-1" />
                                                    {isRtl ? 'ربط منشور' : 'Link Post'}
                                                </Button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                {(activeCampaign.linkedItems || []).filter((item: any) => item.platform === p.id).map((item: any) => (
                                                    <div key={item.id} className="relative group/post aspect-square rounded-xl overflow-hidden border border-white/10 bg-white/5">
                                                        {item.imageUrl ? (
                                                            <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                                                        ) : item.videoUrl ? (
                                                            <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                                                                <Video className="h-6 w-6 text-white/40" />
                                                            </div>
                                                        ) : (
                                                            <div className="w-full h-full p-2 text-[8px] overflow-hidden text-muted-foreground">
                                                                {item.captionEn || item.captionAr}
                                                            </div>
                                                        )}
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="absolute top-1 right-1 h-6 w-6 rounded-full bg-destructive text-white opacity-0 group-hover/post:opacity-100 transition-opacity"
                                                            onClick={() => unlinkPost(item.id)}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Optional Platform Comment */}
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
                                <p className={`text-[10px] text-muted-foreground ${isRtl ? 'mr-1' : 'ml-1'}`}>
                                    {isRtl ? 'سيظهر هذا التعليق للعميل في التقرير.' : 'This comment will be visible to the client in their report.'}
                                </p>
                            </div>
                        </div>
                    </TabsContent>
                ))}

                <TabsContent value="email" className="mt-0 focus-visible:ring-0">
                    <div className="grid md:grid-cols-2 gap-8">
                        <Card className="border-white/10 bg-card/20 backdrop-blur-md shadow-lg">
                            <CardHeader className="bg-rose-500/5 border-b border-white/5">
                                <CardTitle className="text-rose-400 flex items-center gap-2 text-sm font-black uppercase tracking-widest">
                                    <Mail className="h-4 w-4" /> Email Performance
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 grid gap-6 sm:grid-cols-2">
                                <MetricField
                                    label="Total Emails Sent"
                                    icon={Mail}
                                    value={metrics.emailMarketing?.emailsSent}
                                    onChange={(v) => updateEmailMetric('emailsSent', v)}
                                />
                                <MetricField
                                    label="Open Rate"
                                    icon={Eye}
                                    value={metrics.emailMarketing?.openRate}
                                    onChange={(v) => updateEmailMetric('openRate', v)}
                                    suffix="%"
                                />
                                <MetricField
                                    label="Click Rate"
                                    icon={MousePointer2}
                                    value={metrics.emailMarketing?.clickRate}
                                    onChange={(v) => updateEmailMetric('clickRate', v)}
                                    suffix="%"
                                />
                                <MetricField
                                    label="Unsubscribes"
                                    icon={Users}
                                    value={metrics.emailMarketing?.unsubscribes}
                                    onChange={(v) => updateEmailMetric('unsubscribes', v)}
                                />
                            </CardContent>
                        </Card>
                        <div className="p-8 bg-rose-500/10 border border-rose-500/20 rounded-3xl flex flex-col justify-center gap-4">
                            <h3 className="text-2xl font-black text-rose-500">Email Health</h3>
                            <p className="text-muted-foreground font-medium">Tracking these metrics ensures your broadcast strategy is reaching correctly focused audiences without triggering spam filters.</p>
                            <div className="h-1 bg-rose-500/20 rounded-full overflow-hidden">
                                <div className="h-full bg-rose-500 w-[75%]" />
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="seo" className="mt-0 focus-visible:ring-0">
                    <div className="grid gap-8">
                        <div className="grid md:grid-cols-3 gap-6">
                            <Card className="border-white/10 bg-card/20 backdrop-blur-md shadow-lg">
                                <CardHeader className="bg-emerald-500/5 border-b border-white/5">
                                    <CardTitle className="text-emerald-400 flex items-center gap-2 text-sm font-black uppercase tracking-widest">
                                        <TrendingUp className="h-4 w-4" /> Authority
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">
                                    <MetricField
                                        label="SEO Score"
                                        icon={Globe}
                                        value={metrics.seo?.score}
                                        onChange={(v) => updateSEOMetric('score', v)}
                                        suffix="/100"
                                    />
                                    <MetricField
                                        label="Primary Rank"
                                        icon={Target}
                                        value={metrics.seo?.rank}
                                        onChange={(v) => updateSEOMetric('rank', v)}
                                        type="text"
                                        placeholder="#1 Marketing"
                                    />
                                </CardContent>
                            </Card>

                            <Card className="border-white/10 bg-card/20 backdrop-blur-md shadow-lg">
                                <CardHeader className="bg-emerald-500/5 border-b border-white/5">
                                    <CardTitle className="text-emerald-400 flex items-center gap-2 text-sm font-black uppercase tracking-widest">
                                        <Zap className="h-4 w-4" /> Technical
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">
                                    <MetricField
                                        label="Page Speed"
                                        icon={Zap}
                                        value={metrics.seo?.speed}
                                        onChange={(v) => updateSEOMetric('speed', v)}
                                        suffix="%"
                                    />
                                    <MetricField
                                        label="Mobile Friendly"
                                        icon={Globe}
                                        value={metrics.seo?.mobile}
                                        onChange={(v) => updateSEOMetric('mobile', v)}
                                        suffix="%"
                                    />
                                </CardContent>
                            </Card>

                            <div className="space-y-4">
                                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Quick Note</Label>
                                <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                                    <p className="text-emerald-400 text-sm italic font-medium">"SEO is a compounding game. Month-over-month growth in domain authority directly translates to lower customer acquisition costs."</p>
                                </div>
                            </div>
                        </div>

                        <Card className="border-white/10 bg-card/30 backdrop-blur-md shadow-2xl">
                            <CardHeader className={`border-b border-white/5 ${isRtl ? 'text-right' : ''}`}>
                                <CardTitle className={`text-xl font-black flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                    <BarChart3 className="h-5 w-5 text-primary" /> {isRtl ? 'الملخص الاستراتيجي' : 'Executive Strategic Summary'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8">
                                <textarea
                                    name="summary"
                                    rows={8}
                                    required
                                    value={metrics.summary || ""}
                                    onChange={(e) => setMetrics((prev: any) => ({ ...prev, summary: e.target.value }))}
                                    className={`flex w-full rounded-2xl border-white/10 bg-background/50 p-6 text-base font-medium shadow-inner focus:border-primary/50 focus:ring-primary/20 transition-all outline-none ${isRtl ? 'text-right' : ''}`}
                                    placeholder={isRtl ? "ترجم البيانات إلى نتائج أعمال. ما هي الإنجازات الكبرى؟ وما الذي سنعمل عليه الشهر القادم؟" : "Translate the data into business results. What were the big wins? What are we optimizing next?"}
                                    dir={isRtl ? 'rtl' : 'ltr'}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Bottom Actions */}
            <div className={`fixed bottom-0 left-0 right-0 p-6 bg-background/80 backdrop-blur-2xl border-t border-white/5 flex justify-end gap-4 z-50 ${isRtl ? 'flex-row-reverse' : ''}`}>
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
                            {approvedPosts.filter(p => p.platform === selectedPlatformForLinking).map((post) => (
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
