"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/language-context";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Users, Newspaper, TrendingUp, Target, Loader2 } from "lucide-react";
import { getTeamClientInsight, getTeamClientInsightHistory } from "@/app/actions/insights";
import { IndustryView } from "@/components/client/insights/industry-view";
import { TrendingView } from "@/components/client/insights/trending-view";
import { CompetitorsView } from "@/components/client/insights/competitors-view";

interface Client {
    id: string;
    name: string;
}

export function TeamInsightsView({ clients }: { clients: Client[] }) {
    const { isRtl, t } = useLanguage();
    const [selectedClientId, setSelectedClientId] = useState<string>("");
    const [activeTab, setActiveTab] = useState<string>("industry");
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<{
        industry: { items: any[]; createdAt: Date | null; history: any[] };
        trending: { items: any[]; createdAt: Date | null; history: any[] };
        competitors: { items: any[]; createdAt: Date | null; history: any[] };
    }>({
        industry: { items: [], createdAt: null, history: [] },
        trending: { items: [], createdAt: null, history: [] },
        competitors: { items: [], createdAt: null, history: [] },
    });

    const fetchAllInsights = async (clientId: string) => {
        if (!clientId) return;
        setLoading(true);
        try {
            const [
                ind, indHist,
                trd, trdHist,
                comp, compHist
            ] = await Promise.all([
                getTeamClientInsight(clientId, "INDUSTRY"),
                getTeamClientInsightHistory(clientId, "INDUSTRY"),
                getTeamClientInsight(clientId, "TRENDING"),
                getTeamClientInsightHistory(clientId, "TRENDING"),
                getTeamClientInsight(clientId, "COMPETITORS"),
                getTeamClientInsightHistory(clientId, "COMPETITORS"),
            ]);
            setData({
                industry: { items: ind.items, createdAt: ind.createdAt, history: indHist },
                trending: { items: trd.items, createdAt: trd.createdAt, history: trdHist },
                competitors: { items: comp.items, createdAt: comp.createdAt, history: compHist },
            });
        } catch (error) {
            console.error("Failed to fetch team insights:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedClientId) {
            fetchAllInsights(selectedClientId);
        }
    }, [selectedClientId]);

    const selectedClient = clients.find(c => c.id === selectedClientId);

    return (
        <div className="space-y-8 p-6 max-w-7xl mx-auto" dir={isRtl ? "rtl" : "ltr"}>
            {/* Header */}
            <div className={`flex flex-col md:flex-row md:items-center justify-between gap-6 ${isRtl ? 'text-right' : ''}`}>
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
                        <Sparkles className="h-7 w-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {isRtl ? "استخبارات العملاء" : "Client AI Insights"}
                        </h1>
                        <p className="text-sm text-muted-foreground font-medium opacity-70">
                            {isRtl ? "مراجعة جميع رؤى المنافسين والسوق لكل العملاء" : "Review all competitor and market insights across all clients"}
                        </p>
                    </div>
                </div>

                <div className="w-full md:w-80">
                    <div className="space-y-2">
                        <label className="section-label text-muted-foreground opacity-60">
                            {isRtl ? "اختر العميل" : "Select Client"}
                        </label>
                        <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                            <SelectTrigger className="h-12 bg-muted/30 border-border rounded-lg focus:ring-primary/20 transition-all">
                                <SelectValue placeholder={isRtl ? "ابحث عن عميل..." : "Search for a client..."} />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border rounded-lg">
                                {clients.map((client) => (
                                    <SelectItem key={client.id} value={client.id} className="rounded-xl focus:bg-primary/10">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-3.5 w-3.5 opacity-50" />
                                            <span className="font-bold">{client.name}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {!selectedClientId ? (
                <Card className="bg-card border-dashed border-border rounded-xl py-20">
                    <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center text-muted-foreground opacity-20">
                            <Users className="h-10 w-10" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-semibold tracking-tight">{isRtl ? "يرجى اختيار عميل أولاً" : "Please select a client first"}</h3>
                            <p className="text-sm text-muted-foreground font-medium">{isRtl ? "اختر عميلاً من القائمة أعلاه لعرض بيانات الذكاء الاصطناعي الخاصة به" : "Choose a client from the dropdown above to view their AI-generated insights"}</p>
                        </div>
                    </CardContent>
                </Card>
            ) : loading ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-4 text-muted-foreground">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <span className="section-label animate-pulse">
                        {isRtl ? "جاري تحميل البيانات..." : "Loading Data..."}
                    </span>
                </div>
            ) : (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8" dir={isRtl ? "rtl" : "ltr"}>
                    <TabsList className="bg-muted/30 border border-border p-1 rounded-lg h-14">
                        <TabsTrigger value="industry" className="rounded-lg font-medium text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-full px-6 gap-2">
                            <Newspaper className="h-4 w-4" />
                            {isRtl ? "رؤى السوق" : "Market Insights"}
                        </TabsTrigger>
                        <TabsTrigger value="trending" className="rounded-lg font-medium text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-full px-6 gap-2">
                            <TrendingUp className="h-4 w-4" />
                            {isRtl ? "المواضيع الرائجة" : "Trending Topics"}
                        </TabsTrigger>
                        <TabsTrigger value="competitors" className="rounded-lg font-medium text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-full px-6 gap-2">
                            <Target className="h-4 w-4" />
                            {isRtl ? "المنافسون" : "Competitors"}
                        </TabsTrigger>
                    </TabsList>

                    <div className="min-h-[400px]">
                        <TabsContent value="industry" className="mt-0 focus-visible:outline-none">
                            {data.industry.items.length > 0 ? (
                                <IndustryView 
                                    current={{ items: data.industry.items, createdAt: data.industry.createdAt || new Date() }}
                                    history={data.industry.history}
                                />
                            ) : (
                                <EmptyState type="INDUSTRY" isRtl={isRtl} />
                            )}
                        </TabsContent>
                        <TabsContent value="trending" className="mt-0 focus-visible:outline-none">
                            {data.trending.items.length > 0 ? (
                                <TrendingView 
                                    current={{ items: data.trending.items, createdAt: data.trending.createdAt || new Date() }}
                                    history={data.trending.history}
                                />
                            ) : (
                                <EmptyState type="TRENDING" isRtl={isRtl} />
                            )}
                        </TabsContent>
                        <TabsContent value="competitors" className="mt-0 focus-visible:outline-none">
                            {data.competitors.items.length > 0 ? (
                                <CompetitorsView 
                                    current={{ items: data.competitors.items, createdAt: data.competitors.createdAt || new Date() }}
                                    history={data.competitors.history}
                                />
                            ) : (
                                <EmptyState type="COMPETITORS" isRtl={isRtl} />
                            )}
                        </TabsContent>
                    </div>
                </Tabs>
            )}
        </div>
    );
}

function EmptyState({ type, isRtl }: { type: string; isRtl: boolean }) {
    return (
        <Card className="bg-card border border-border rounded-xl py-20">
            <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center text-muted-foreground opacity-20">
                    <Sparkles className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                    <h3 className="text-xl font-semibold tracking-tight">{isRtl ? "لا توجد بيانات حالياً" : "No data available yet"}</h3>
                    <p className="text-sm text-muted-foreground font-medium">
                        {isRtl 
                            ? "لم يتم توليد أي بيانات لهذا العميل بعد. سيقوم النظام المؤتمت بتجهيزها قريباً." 
                            : "No AI insights have been generated for this client yet. The automated system will process them soon."}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
