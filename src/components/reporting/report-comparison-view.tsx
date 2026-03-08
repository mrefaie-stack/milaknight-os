"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GitCompare, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/language-context";
import { ExportPdfButton } from "@/components/action-plan/export-pdf-button";
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

// ─── Smart Insight Engine ────────────────────────────────────────────────────
function generateInsight(
    values: number[],
    metric: string,
    isRtl: boolean,
    unit = "",
    higherIsBetter = true
): { text: string; trend: "up" | "down" | "flat" } {
    if (values.length < 2) {
        return { text: isRtl ? "بيانات غير كافية للمقارنة." : "Not enough data to compare.", trend: "flat" };
    }

    const first = values[0];
    const last = values[values.length - 1];
    const prevLast = values[values.length - 2];

    const totalChange = first > 0 ? ((last - first) / first) * 100 : 0;
    const monthChange = prevLast > 0 ? ((last - prevLast) / prevLast) * 100 : 0;

    const trend = last > prevLast ? "up" : last < prevLast ? "down" : "flat";
    const isGood = higherIsBetter ? trend === "up" : trend === "down";
    const isBad = higherIsBetter ? trend === "down" : trend === "up";

    const lastMonth = isRtl ? `آخر شهر` : "last month";
    const fmt = (n: number) => {
        if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
        if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
        return Math.round(n).toLocaleString();
    };

    if (isRtl) {
        if (trend === "flat") return { text: `${metric} ثابت هذا الشهر مقارنة بالشهر السابق عند ${fmt(last)}${unit}.`, trend };
        const direction = trend === "up" ? "ارتفع" : "انخفض";
        const sentiment = isGood ? "📈 نتيجة إيجابية" : isBad ? "📉 يحتاج مراجعة" : "";
        const why = isGood
            ? "وهو مؤشر جيد على نمو الخطة."
            : "مما يستدعي مراجعة الاستراتيجية لهذا الشهر.";
        const totalNote = Math.abs(totalChange) > 5
            ? ` بشكل عام، تغير بنسبة ${totalChange > 0 ? '+' : ''}${totalChange.toFixed(0)}% منذ بداية الفترة.`
            : '';
        return {
            text: `${sentiment} ${metric} ${direction} بنسبة ${Math.abs(monthChange).toFixed(0)}% مقارنة بالشهر السابق (${fmt(prevLast)}${unit} ← ${fmt(last)}${unit})، ${why}${totalNote}`,
            trend
        };
    } else {
        if (trend === "flat") return { text: `${metric} remained flat this month at ${fmt(last)}${unit}.`, trend };
        const direction = trend === "up" ? "increased" : "decreased";
        const sentiment = isGood ? "✅ Positive signal." : isBad ? "⚠️ Needs attention." : "";
        const why = isGood
            ? "This indicates strong campaign momentum."
            : "Consider reviewing the strategy for improvements.";
        const totalNote = Math.abs(totalChange) > 5
            ? ` Overall, a ${totalChange > 0 ? '+' : ''}${totalChange.toFixed(0)}% change since the start of the period.`
            : '';
        return {
            text: `${sentiment} ${metric} ${direction} by ${Math.abs(monthChange).toFixed(0)}% compared to last month (${fmt(prevLast)}${unit} → ${fmt(last)}${unit}). ${why}${totalNote}`,
            trend
        };
    }
}

function InsightBanner({ insight, isRtl }: { insight: { text: string; trend: "up" | "down" | "flat" }, isRtl: boolean }) {
    const Icon = insight.trend === "up" ? TrendingUp : insight.trend === "down" ? TrendingDown : Minus;
    const colors = {
        up: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600",
        down: "bg-red-500/10 border-red-500/20 text-red-500",
        flat: "bg-muted/20 border-border text-muted-foreground"
    };
    return (
        <div className={`flex items-start gap-3 p-4 rounded-2xl border text-sm font-medium mt-4 ${colors[insight.trend]} ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}>
            <Icon className="h-4 w-4 mt-0.5 shrink-0" />
            <p className="leading-relaxed">{insight.text}</p>
        </div>
    );
}

export function ReportComparisonView({ reports, role }: { reports: any[], role: string }) {
    const { t, isRtl } = useLanguage();
    const router = useRouter();

    // Sort reports chronologically
    const sortedReports = [...reports].sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
    const clientName = reports[0]?.client?.name || "Client";

    // Prepare chart data
    const chartData = sortedReports.map(report => {
        let metrics = report.metrics;
        if (typeof metrics === 'string') {
            try { metrics = JSON.parse(metrics); } catch (e) { metrics = {}; }
        }

        let totalReach = 0, totalEngagement = 0, totalImpressions = 0, totalSpend = 0;
        const platforms = ['facebook', 'instagram', 'linkedin', 'tiktok', 'snapchat', 'youtube', 'google'];
        platforms.forEach(p => {
            const pData = metrics.platforms?.[p];
            if (pData) {
                totalReach += (Number(pData.organicReach) || 0) + (Number(pData.paidReach) || 0);
                totalEngagement += Number(pData.engagement) || 0;
                totalImpressions += Number(pData.impressions) || 0;
                totalSpend += Number(pData.spend) || 0;
            }
        });

        const seoScore = Number(metrics.seo?.score || 0);
        const emailOpenRate = Number(metrics.emailMarketing?.openRate || 0);

        return {
            month: (() => {
                try {
                    const d = new Date(report.month + "-01");
                    return d.toLocaleDateString(isRtl ? 'ar-EG' : 'en-GB', { month: 'short', year: 'numeric' });
                } catch { return report.month; }
            })(),
            monthRaw: report.month,
            Reach: totalReach,
            Engagement: totalEngagement,
            Impressions: totalImpressions,
            Score: seoScore,
            Spend: totalSpend,
            "Open Rate": emailOpenRate
        };
    });

    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    // Generate insights per metric
    const reachInsight = generateInsight(chartData.map(d => d.Reach), isRtl ? "الوصول" : "Reach", isRtl);
    const impressionsInsight = generateInsight(chartData.map(d => d.Impressions), isRtl ? "مرات الظهور" : "Impressions", isRtl);
    const engagementInsight = generateInsight(chartData.map(d => d.Engagement), isRtl ? "التفاعل" : "Engagement", isRtl);
    const seoInsight = generateInsight(chartData.map(d => d.Score), isRtl ? "سكور السيو" : "SEO Score", isRtl, "/100");
    const spendInsight = generateInsight(chartData.map(d => d.Spend), isRtl ? "الإنفاق الإعلاني" : "Ad Spend", isRtl, "$", false);

    // Overall summary
    const goodMetrics = [reachInsight, engagementInsight, seoInsight].filter(i => i.trend === "up").length;
    const badMetrics = [reachInsight, engagementInsight, seoInsight].filter(i => i.trend === "down").length;
    const overallTrend: "up" | "down" | "flat" = goodMetrics > badMetrics ? "up" : badMetrics > goodMetrics ? "down" : "flat";

    const overallText = isRtl
        ? overallTrend === "up"
            ? `📊 نظرة عامة: أداء ${clientName} في اتجاه إيجابي خلال هذه الفترة. ${goodMetrics} من المؤشرات الرئيسية تحسّنت. استمر في نفس النهج واحرص على الاتساق في المحتوى.`
            : overallTrend === "down"
                ? `📊 نظرة عامة: يظهر أداء ${clientName} بعض التراجع خلال هذه الفترة. ${badMetrics} مؤشرات تحتاج اهتمام. يُنصح بمراجعة الاستراتيجية وتنويع المحتوى.`
                : `📊 نظرة عامة: أداء ${clientName} مستقر خلال هذه الفترة. للانتقال لمرحلة النمو، حاول رفع وتيرة المحتوى وتنويع المنصات.`
        : overallTrend === "up"
            ? `📊 Overall, ${clientName} is showing positive growth trends this period. ${goodMetrics} key metrics improved. Maintain this momentum and keep content consistent.`
            : overallTrend === "down"
                ? `📊 Overall, ${clientName}'s performance shows some decline this period. ${badMetrics} metrics need attention. A strategy review and content diversification is recommended.`
                : `📊 Overall, ${clientName}'s performance is stable this period. To enter a growth phase, consider increasing content frequency and platform diversification.`;

    return (
        <div className="space-y-8 print-container max-w-6xl mx-auto" dir={isRtl ? "rtl" : "ltr"} id="pdf-content">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-3xl bg-card border-none glass-card relative overflow-hidden print:hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <GitCompare className="h-48 w-48 -mr-16 -mt-16" />
                </div>
                <div className="relative z-10 flex flex-col gap-4">
                    <Button variant="ghost" onClick={() => router.back()} className="w-fit hover:bg-white/5 -ml-4">
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
                        <p className="text-xl text-muted-foreground font-medium mt-2">{clientName}</p>
                    </div>
                </div>
                <div className="relative z-10 hidden md:block" data-html2canvas-ignore="true">
                    <ExportPdfButton fileName={`Comparison-${clientName}`} className="font-bold rounded-full h-11 px-6 border border-primary/20" />
                </div>
            </div>

            {/* ─── Overall Summary Banner ─────────────────── */}
            <div className={`p-6 rounded-3xl border flex items-start gap-4 ${isRtl ? 'flex-row-reverse text-right' : 'text-left'} ${overallTrend === 'up' ? 'bg-emerald-500/5 border-emerald-500/20' : overallTrend === 'down' ? 'bg-red-500/5 border-red-500/20' : 'bg-muted/20 border-border'}`}>
                <div className={`p-3 rounded-2xl shrink-0 ${overallTrend === 'up' ? 'bg-emerald-500/10' : overallTrend === 'down' ? 'bg-red-500/10' : 'bg-muted/20'}`}>
                    <BarChart3 className={`h-6 w-6 ${overallTrend === 'up' ? 'text-emerald-500' : overallTrend === 'down' ? 'text-red-500' : 'text-muted-foreground'}`} />
                </div>
                <div className="space-y-1">
                    <p className={`text-[11px] font-black uppercase tracking-widest ${overallTrend === 'up' ? 'text-emerald-500' : overallTrend === 'down' ? 'text-red-500' : 'text-muted-foreground'}`}>
                        {isRtl ? "ملخص الفترة الكاملة" : "Period Summary"}
                    </p>
                    <p className="text-base font-semibold leading-relaxed">{overallText}</p>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Total Reach + Impressions Trend */}
                <Card className="glass-card border-none md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-xl font-black">{isRtl ? "إجمالي الوصول ومرات الظهور" : "Total Brand Reach & Impressions"}</CardTitle>
                        <CardDescription>{isRtl ? "الوصول الإجمالي عبر كل المنصات" : "Aggregated reach across all social platforms"}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[380px] w-full" dir="ltr">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.5} />
                                    <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatNumber} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontWeight: 'bold', color: 'hsl(var(--foreground))' }}
                                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px', fontWeight: 'bold' }} />
                                    <Line type="monotone" dataKey="Reach" stroke="var(--color-primary)" strokeWidth={4} activeDot={{ r: 8 }} />
                                    <Line type="monotone" dataKey="Impressions" stroke="var(--color-chart-2)" strokeWidth={4} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <InsightBanner insight={reachInsight} isRtl={isRtl} />
                    </CardContent>
                </Card>

                {/* Engagement Trend */}
                <Card className="glass-card border-none">
                    <CardHeader>
                        <CardTitle className="text-xl font-black">{isRtl ? "التفاعل" : "Engagement Trend"}</CardTitle>
                        <CardDescription>{isRtl ? "مجموع اللايكات والتعليقات والمشاركات" : "Total likes, comments, and shares"}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[280px] w-full" dir="ltr">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.5} />
                                    <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatNumber} />
                                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontWeight: 'bold', color: 'hsl(var(--foreground))' }} />
                                    <Line type="monotone" dataKey="Engagement" stroke="var(--color-chart-3)" strokeWidth={4} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <InsightBanner insight={engagementInsight} isRtl={isRtl} />
                    </CardContent>
                </Card>

                {/* SEO Score Trend */}
                <Card className="glass-card border-none">
                    <CardHeader>
                        <CardTitle className="text-xl font-black">{isRtl ? "تقييم السيو (SEO)" : "Website Score (SEO)"}</CardTitle>
                        <CardDescription>{isRtl ? "صحة الموقع وقوة النطاق" : "Domain authority and health score"}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[280px] w-full" dir="ltr">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.5} />
                                    <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatNumber} />
                                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontWeight: 'bold', color: 'hsl(var(--foreground))' }} />
                                    <Line type="monotone" dataKey="Score" stroke="var(--color-chart-5)" strokeWidth={4} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <InsightBanner insight={seoInsight} isRtl={isRtl} />
                    </CardContent>
                </Card>

                {/* Ad Spend Trend */}
                <Card className="glass-card border-none md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-xl font-black">{isRtl ? "الإنفاق الإعلاني" : "Ad Spend Trend"}</CardTitle>
                        <CardDescription>{isRtl ? "الإجمالي الإعلاني عبر كل المنصات" : "Total investment across all platforms"}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[280px] w-full" dir="ltr">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.5} />
                                    <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${formatNumber(v)}`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontWeight: 'bold', color: 'hsl(var(--foreground))' }}
                                        formatter={(value: any) => [`$${Number(value).toLocaleString()}`, isRtl ? 'إجمالي الإنفاق' : 'Total Spend']}
                                    />
                                    <Line type="monotone" dataKey="Spend" stroke="#f97316" strokeWidth={4} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <InsightBanner insight={spendInsight} isRtl={isRtl} />
                    </CardContent>
                </Card>
            </div>

            <div className="text-center text-sm font-bold opacity-30 uppercase tracking-widest pt-12 pb-4">
                MilaKnight Creative Agency &copy; {new Date().getFullYear()}
            </div>
        </div>
    );
}
