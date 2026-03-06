"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, GitCompare } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/language-context";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';

export function ReportComparisonView({ reports, role }: { reports: any[], role: string }) {
    const { t, isRtl } = useLanguage();
    const router = useRouter();

    // Sort reports chronologically
    const sortedReports = [...reports].sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
    const clientName = reports[0]?.client?.name || "Client";

    // Prepare chart data. Each report is a data point on the X axis (Month).
    const chartData = sortedReports.map(report => {
        let metrics = report.metrics;
        if (typeof metrics === 'string') {
            try {
                metrics = JSON.parse(metrics);
            } catch (e) {
                metrics = {};
            }
        }

        // Aggregate across platforms for simplicity in comparison
        let totalReach = 0;
        let totalEngagement = 0;
        let totalImpressions = 0;

        // Iterate through requested platforms (lowercase as stored in Prisma)
        const platforms = ['facebook', 'instagram', 'linkedin', 'tiktok', 'snapchat', 'youtube', 'google'];
        platforms.forEach(p => {
            const pData = metrics.platforms?.[p];
            if (pData) {
                // Reach = organicReach + paidReach
                totalReach += (Number(pData.organicReach) || 0) + (Number(pData.paidReach) || 0);
                totalEngagement += Number(pData.engagement) || 0;
                totalImpressions += Number(pData.impressions) || 0;
            }
        });

        // Add SEO and Email if they exist
        const totalTraffic = Number(metrics.seo?.score || 0); // Using score as placeholder for traffic if traffic not present
        const emailOpenRate = Number(metrics.emailMarketing?.openRate || 0);

        return {
            month: new Date(report.month + "-01").toLocaleDateString('default', { month: 'short', year: 'numeric' }),
            Reach: totalReach,
            Engagement: totalEngagement,
            Impressions: totalImpressions,
            Traffic: totalTraffic,
            "Open Rate": emailOpenRate
        };
    });

    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    return (
        <div className="space-y-8 print-container max-w-6xl mx-auto" dir={isRtl ? "rtl" : "ltr"}>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-3xl bg-card border-none glass-card relative overflow-hidden print:hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <GitCompare className="h-48 w-48 -mr-16 -mt-16" />
                </div>
                <div className="relative z-10 flex flex-col gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="w-fit hover:bg-white/5 -ml-4"
                    >
                        <ArrowLeft className={`h-4 w-4 mr-2 ${isRtl ? 'rotate-180 ml-2 mr-0' : ''}`} /> {t("common.back")}
                    </Button>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs font-black uppercase tracking-widest">
                                {isRtl ? "تحليل المقارنة" : "Comparison Analysis"}
                            </Badge>
                            <Badge variant="secondary" className="text-xs font-black uppercase">
                                {reports.length} {isRtl ? "شهور" : "Months"}
                            </Badge>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter premium-gradient-text uppercase">
                            {isRtl ? "اتجاه الأداء" : "Performance Trend"}
                        </h1>
                        <p className="text-xl text-muted-foreground font-medium mt-2">
                            {clientName}
                        </p>
                    </div>
                </div>
            </div>

            {/* Print Header */}
            <div className="hidden print:block mb-8 text-center">
                <h1 className="text-4xl font-black mb-2 uppercase">Performance Comparison</h1>
                <h2 className="text-2xl text-muted-foreground">{clientName}</h2>
                <p className="text-sm mt-2 font-bold text-gray-500">
                    Comparing {sortedReports[0].month} to {sortedReports[sortedReports.length - 1].month}
                </p>
            </div>

            {/* Charts Grid */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Total Reach Trend */}
                <Card className="glass-card border-none md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-xl font-black">Total Brand Reach Over Time</CardTitle>
                        <CardDescription>Aggregated reach across all social platforms</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.5} />
                                    <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatNumber} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: '12px', fontWeight: 'bold' }}
                                        itemStyle={{ color: 'var(--color-foreground)' }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px', fontWeight: 'bold' }} />
                                    <Line type="monotone" dataKey="Reach" stroke="var(--color-primary)" strokeWidth={4} activeDot={{ r: 8 }} />
                                    <Line type="monotone" dataKey="Impressions" stroke="var(--color-chart-2)" strokeWidth={4} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Engagement Trend */}
                <Card className="glass-card border-none">
                    <CardHeader>
                        <CardTitle className="text-xl font-black">Engagement Trend</CardTitle>
                        <CardDescription>Total likes, comments, and shares</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.5} />
                                    <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatNumber} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: '12px', fontWeight: 'bold' }}
                                    />
                                    <Line type="monotone" dataKey="Engagement" stroke="var(--color-chart-3)" strokeWidth={4} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* SEO Traffic Trend */}
                <Card className="glass-card border-none">
                    <CardHeader>
                        <CardTitle className="text-xl font-black">Website Traffic (SEO)</CardTitle>
                        <CardDescription>Organic visitor growth over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.5} />
                                    <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatNumber} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: '12px', fontWeight: 'bold' }}
                                    />
                                    <Line type="monotone" dataKey="Traffic" stroke="var(--color-chart-5)" strokeWidth={4} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="text-center text-sm font-bold opacity-30 uppercase tracking-widest pt-12 pb-4">
                MilaKnight Creative Agency &copy; {new Date().getFullYear()}
            </div>
        </div>
    );
}
