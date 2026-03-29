"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, Download, Table, Key, Filter, Star, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SeoHistoryViewer } from "./seo-history-viewer";

interface KeywordIdea {
    keyword: string;
    volume: number;
    cpc: string;
    competition: string;
    goldenScore: number;
}

export function KeywordExplorer() {
    const { t, isRtl } = useLanguage();
    const [seed, setSeed] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<KeywordIdea[] | null>(null);
    const [goldenOnly, setGoldenOnly] = useState(false);

    const exportToExcel = () => {
        if (!results) return;
        const dataToExport = goldenOnly ? results.filter(k => isGolden(k)) : results;
        
        const headers = ["Keyword", "Search Volume", "CPC", "Competition", "Golden Score"];
        const rows = dataToExport.map((kw: KeywordIdea) => 
            `"${kw.keyword}","${kw.volume}","${kw.cpc}","${kw.competition}","${kw.goldenScore}"`
        );
        const csvContent = [headers.join(","), ...rows].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `keyword-ideas-${seed.substring(0,20).replace(/\s/g, '-')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!seed.trim()) return;
        
        setIsSearching(true);
        setResults(null);

        try {
            const response = await fetch('/api/seo/keyword-explorer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keyword: seed.trim() })
            });

            if (!response.ok) {
                console.error("Search failed");
                throw new Error("Failed");
            }

            const data = await response.json();
            setResults(data);
        } catch (error) {
            console.error("Request Failed", error);
        } finally {
            setIsSearching(false);
        }
    };

    const isGolden = (kw: KeywordIdea) => {
        return kw.competition.toLowerCase() === 'low' && kw.volume >= 500;
    };

    const displayedResults = results 
        ? goldenOnly ? results.filter(k => isGolden(k)) : results
        : [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-amber-500 to-amber-700 bg-clip-text text-transparent flex items-center gap-2">
                        <Key className="h-6 w-6 text-amber-500" />
                        {isRtl ? "مستكشف الكلمات المفتاحية" : "Keyword Explorer"}
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        {isRtl 
                            ? "اكتب كلمة بحث للعثور على مئات الفرص والكلمات الذهبية من Google Ads مباشرة." 
                            : "Enter a seed keyword to find hundreds of opportunities and golden keywords directly from Google Ads."}
                    </p>
                </div>

                <SeoHistoryViewer 
                    toolName="KEYWORD_EXPLORER" 
                    onSelect={(data, input) => {
                        setResults(data);
                        if (input && input.keyword) setSeed(input.keyword);
                    }} 
                />
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full space-y-2">
                        <Label htmlFor="seed" className="font-semibold">{isRtl ? "الكلمة المفتاحية (Seed Keyword)" : "Seed Keyword"}</Label>
                        <div className="relative">
                            <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRtl ? 'right-3' : 'left-3'}`} />
                            <Input 
                                id="seed"
                                className={`h-12 bg-background ${isRtl ? 'pr-10' : 'pl-10'} rounded-lg`}
                                placeholder={isRtl ? "مثال: تسويق عقاري" : "e.g. real estate marketing"}
                                value={seed}
                                onChange={(e) => setSeed(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <Button type="submit" size="lg" className="h-12 rounded-lg bg-amber-600 hover:bg-amber-700 text-white w-full md:w-auto" disabled={isSearching}>
                        {isSearching ? <Loader2 className="h-5 w-5 animate-spin mx-6" /> : (
                            <>
                                {isRtl ? "اكتشف الفرص" : "Discover Ideas"} 
                                <Sparkles className={isRtl ? "mr-2 h-4 w-4" : "ml-2 h-4 w-4"} />
                            </>
                        )}
                    </Button>
                </form>
            </div>

            <AnimatePresence mode="wait">
                {results && !isSearching && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        {/* Filters & Export Toolbar */}
                        <div className="flex flex-col sm:flex-row justify-between items-center bg-card border border-border p-4 rounded-xl gap-4">
                            <div className="flex items-center gap-3">
                                <div className={`flex items-center space-x-2 ${isRtl ? 'space-x-reverse' : ''}`}>
                                    <Switch 
                                        id="golden-mode" 
                                        checked={goldenOnly} 
                                        onCheckedChange={setGoldenOnly}
                                        className="data-[state=checked]:bg-amber-500"
                                    />
                                    <Label htmlFor="golden-mode" className="font-medium flex items-center gap-1.5 cursor-pointer">
                                        <Star className={`h-4 w-4 ${goldenOnly ? "text-amber-500 fill-amber-500" : "text-muted-foreground"}`} />
                                        {isRtl ? "الكلمات الذهبية فقط" : "Golden Keywords Only"}
                                    </Label>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 py-1.5 px-3 rounded-md">
                                <span className="font-semibold text-foreground">{displayedResults.length}</span> 
                                {isRtl ? "كلمة مقترحة" : "ideas found"}
                            </div>

                            <Button onClick={exportToExcel} variant="outline" className="h-9 whitespace-nowrap">
                                <Download className={isRtl ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
                                {isRtl ? "تصدير CSV" : "Export CSV"}
                            </Button>
                        </div>

                        {/* Keyword Table */}
                        <div className="rounded-xl border border-border bg-card overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left rtl:text-right">
                                    <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b border-border">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold">{isRtl ? "الكلمة المفتاحية" : "Keyword"}</th>
                                            <th className="px-6 py-4 font-semibold whitespace-nowrap">{isRtl ? "حجم البحث الشهري" : "Monthly Volume"}</th>
                                            <th className="px-6 py-4 font-semibold whitespace-nowrap">{isRtl ? "المنافسة" : "Competition"}</th>
                                            <th className="px-6 py-4 font-semibold whitespace-nowrap">{isRtl ? "سعر النقرة (CPC)" : "CPC"}</th>
                                            <th className="px-6 py-4 font-semibold whitespace-nowrap">{isRtl ? "المؤشر الذهبي" : "Golden Score"}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {displayedResults.map((kw, idx) => {
                                            const golden = isGolden(kw);
                                            return (
                                                <tr key={idx} className={`hover:bg-muted/10 transition-colors ${golden ? 'bg-amber-500/5' : ''}`}>
                                                    <td className="px-6 py-4 font-medium text-[15px] flex items-center gap-2">
                                                        {golden && <Star className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />}
                                                        {kw.keyword}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="font-medium">{kw.volume.toLocaleString()}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase ${
                                                            kw.competition.toLowerCase() === 'high' ? 'bg-destructive/10 text-destructive' :
                                                            kw.competition.toLowerCase() === 'medium' ? 'bg-orange-500/10 text-orange-500' : 'bg-emerald-500/10 text-emerald-500'
                                                        }`}>
                                                            {kw.competition}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-muted-foreground font-medium">
                                                        ${kw.cpc}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                                                <div 
                                                                    className={`h-full ${golden ? 'bg-amber-500' : 'bg-muted-foreground/30'}`} 
                                                                    style={{ width: `${Math.min((kw.goldenScore / 100) * 100, 100)}%` }}
                                                                />
                                                            </div>
                                                            <span className={`font-semibold text-xs ${golden ? 'text-amber-500' : 'text-muted-foreground'}`}>
                                                                {kw.goldenScore}
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {displayedResults.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center">
                                                    <div className="flex flex-col items-center justify-center opacity-40">
                                                        <Filter className="h-10 w-10 mb-3" />
                                                        <p className="text-lg font-medium">{isRtl ? "لم يتم العثور على كلمات ذهبية" : "No golden keywords found"}</p>
                                                        <p className="text-sm mt-1">{isRtl ? "حاول باستخدام فلتر آخر أو كلمة أخرى" : "Try toggling the filter or using a different seed"}</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
