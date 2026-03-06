"use client";

import { useState } from "react";
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
import { Facebook, Instagram, Video, Share2, Linkedin, Search, Youtube, BarChart3, Globe, Mail } from "lucide-react";

const PLATFORMS = [
    { id: "facebook", name: "Facebook", icon: Facebook },
    { id: "instagram", name: "Instagram", icon: Instagram },
    { id: "tiktok", name: "TikTok", icon: Video },
    { id: "snapchat", name: "Snapchat", icon: Share2 },
    { id: "linkedin", name: "LinkedIn", icon: Linkedin },
    { id: "google", name: "Google Ads", icon: Search },
    { id: "youtube", name: "YouTube", icon: Youtube },
];

export function ReportCreatorClient({ clients, initialData }: { clients: any[], initialData?: any }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const initialMetrics = initialData?.metrics ? (typeof initialData.metrics === 'string' ? JSON.parse(initialData.metrics) : initialData.metrics) : {
        platforms: {},
        emailMarketing: { emailsSent: 0, openRate: 0, clickRate: 0 },
        seo: { score: 0, rank: "", notes: "" },
        summary: ""
    };

    const [metrics, setMetrics] = useState(initialMetrics);

    const updatePlatformMetric = (platformId: string, field: string, value: string) => {
        const numValue = field === 'rank' || field === 'notes' ? value : (parseInt(value) || 0);
        setMetrics((prev: any) => ({
            ...prev,
            platforms: {
                ...prev.platforms,
                [platformId]: {
                    ...prev.platforms[platformId],
                    [field]: numValue
                }
            }
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

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        const clientId = formData.get("clientId") as string;
        const month = formData.get("month") as string;

        // Final calculations for totals
        const finalMetrics = {
            ...metrics,
            summary: formData.get("summary") as string,
            totals: { reach: 0, spend: 0, conversions: 0 }
        };

        PLATFORMS.forEach(p => {
            const platformData = finalMetrics.platforms[p.id] || {};
            finalMetrics.totals.reach += (Number(platformData.organicReach) || 0) + (Number(platformData.paidReach) || 0);
            finalMetrics.totals.spend += (Number(platformData.spend) || 0);
            finalMetrics.totals.conversions += (Number(platformData.conversions) || 0);
        });

        try {
            if (initialData) {
                await updateReport(initialData.id, finalMetrics);
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
        <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tight">Generate Report</h1>
                    <p className="text-muted-foreground font-medium">Build a detailed multi-platform performance review.</p>
                </div>
                <div className="flex gap-4">
                    <div className="w-48">
                        <Select name="clientId" defaultValue={initialData?.clientId} required disabled={!!initialData}>
                            <SelectTrigger className="bg-card">
                                <SelectValue placeholder="Select Client" />
                            </SelectTrigger>
                            <SelectContent>
                                {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <Input name="month" type="month" defaultValue={initialData?.month} className="w-40 bg-card" required disabled={!!initialData} />
                </div>
            </div>

            <Tabs defaultValue="facebook" className="w-full">
                <TabsList className="w-full justify-start h-auto p-1 bg-muted/50 backdrop-blur-sm overflow-x-auto border">
                    {PLATFORMS.map(p => (
                        <TabsTrigger key={p.id} value={p.id} className="gap-2 py-3 px-6 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                            <p.icon className="h-4 w-4" />
                            {p.name}
                        </TabsTrigger>
                    ))}
                    <TabsTrigger value="email" className="gap-2 py-3 px-6">
                        <Mail className="h-4 w-4" />
                        Email Marketing
                    </TabsTrigger>
                    <TabsTrigger value="seo" className="gap-2 py-3 px-6">
                        <Globe className="h-4 w-4" />
                        SEO & Summary
                    </TabsTrigger>
                </TabsList>

                {PLATFORMS.map(p => (
                    <TabsContent key={p.id} value={p.id} className="mt-6">
                        <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <p.icon className="h-5 w-5 text-primary" />
                                    {p.name} Metrics
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold uppercase text-muted-foreground">Detailed Metrics</h4>
                                    <div className="grid gap-4 grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>New Followers</Label>
                                            <Input
                                                type="number"
                                                value={metrics.platforms[p.id]?.followers || 0}
                                                onChange={(e) => updatePlatformMetric(p.id, 'followers', e.target.value)}
                                                placeholder="0"
                                                className="bg-background"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Total Engagement</Label>
                                            <Input
                                                type="number"
                                                value={metrics.platforms[p.id]?.engagement || 0}
                                                onChange={(e) => updatePlatformMetric(p.id, 'engagement', e.target.value)}
                                                placeholder="0"
                                                className="bg-background"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-4 grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Month Views</Label>
                                            <Input
                                                type="number"
                                                value={metrics.platforms[p.id]?.views || 0}
                                                onChange={(e) => updatePlatformMetric(p.id, 'views', e.target.value)}
                                                placeholder="0"
                                                className="bg-background"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Month Impressions</Label>
                                            <Input
                                                type="number"
                                                value={metrics.platforms[p.id]?.impressions || 0}
                                                onChange={(e) => updatePlatformMetric(p.id, 'impressions', e.target.value)}
                                                placeholder="0"
                                                className="bg-background"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold uppercase text-muted-foreground">Paid Advertising</h4>
                                    <div className="grid gap-4 grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Paid Reach</Label>
                                            <Input
                                                type="number"
                                                value={metrics.platforms[p.id]?.paidReach || 0}
                                                onChange={(e) => updatePlatformMetric(p.id, 'paidReach', e.target.value)}
                                                placeholder="0"
                                                className="bg-background"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Ads Spend ($)</Label>
                                            <Input
                                                type="number"
                                                value={metrics.platforms[p.id]?.spend || 0}
                                                onChange={(e) => updatePlatformMetric(p.id, 'spend', e.target.value)}
                                                placeholder="0"
                                                className="bg-background"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Conversions / Leads</Label>
                                        <Input
                                            type="number"
                                            value={metrics.platforms[p.id]?.conversions || 0}
                                            onChange={(e) => updatePlatformMetric(p.id, 'conversions', e.target.value)}
                                            placeholder="0"
                                            className="bg-background"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Organic Reach (Legacy)</Label>
                                        <Input
                                            type="number"
                                            value={metrics.platforms[p.id]?.organicReach || 0}
                                            onChange={(e) => updatePlatformMetric(p.id, 'organicReach', e.target.value)}
                                            placeholder="0"
                                            className="bg-background"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                ))}

                <TabsContent value="email" className="mt-6">
                    <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Mail className="h-5 w-5 text-primary" />
                                Email Marketing Metrics
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-6 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label>Emails Sent</Label>
                                <Input
                                    type="number"
                                    value={metrics.emailMarketing?.emailsSent || 0}
                                    onChange={(e) => updateEmailMetric('emailsSent', e.target.value)}
                                    placeholder="0"
                                    className="bg-background"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Open Rate (%)</Label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    value={metrics.emailMarketing?.openRate || 0}
                                    onChange={(e) => updateEmailMetric('openRate', e.target.value)}
                                    placeholder="0.0"
                                    className="bg-background"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Click Rate (%)</Label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    value={metrics.emailMarketing?.clickRate || 0}
                                    onChange={(e) => updateEmailMetric('clickRate', e.target.value)}
                                    placeholder="0.0"
                                    className="bg-background"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="seo" className="mt-6">
                    <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle>SEO Performance & Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>SEO Domain Score (0-100)</Label>
                                    <Input
                                        type="number"
                                        max="100"
                                        value={metrics.seo?.score || 0}
                                        onChange={(e) => updateSEOMetric('score', parseInt(e.target.value) || 0)}
                                        placeholder="85"
                                        className="bg-background"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Top Ranking Keyword / Status</Label>
                                    <Input
                                        value={metrics.seo?.rank || ""}
                                        onChange={(e) => updateSEOMetric('rank', e.target.value)}
                                        placeholder="Ranked #1 for 'Marketing Agency Dubai'"
                                        className="bg-background"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>SEO Technical Notes</Label>
                                <Input
                                    value={metrics.seo?.notes || ""}
                                    onChange={(e) => updateSEOMetric('notes', e.target.value)}
                                    placeholder="Improved page speed by 40%..."
                                    className="bg-background"
                                />
                            </div>
                            <div className="space-y-2 border-t pt-6">
                                <Label className="text-lg font-bold">Executive Summary (Visible to Client)</Label>
                                <textarea
                                    name="summary"
                                    rows={5}
                                    required
                                    value={metrics.summary || ""}
                                    onChange={(e) => setMetrics((prev: any) => ({ ...prev, summary: e.target.value }))}
                                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                                    placeholder="Summarize the month's wins and next steps..."
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" size="lg" disabled={loading} className="font-bold px-8">
                    {loading ? (initialData ? "Updating..." : "Generating...") : (initialData ? "Save Changes" : "Finalize & Send Report")}
                </Button>
            </div>
        </form>
    );
}
