"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Loader2, Download, Sparkles, Globe, Star, Zap,
    Brain, ShoppingCart, HelpCircle, AlertCircle,
    BarChart2, MapPin, Share2, ChevronDown, ChevronUp,
    ChevronsUpDown, Database,
} from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { KeywordIdeaResult } from "@/app/api/seo/keyword-ideas/route";

const COUNTRIES = [
    { code: "SA", ar: "السعودية", en: "Saudi Arabia", flag: "🇸🇦" },
    { code: "AE", ar: "الإمارات", en: "UAE", flag: "🇦🇪" },
    { code: "EG", ar: "مصر", en: "Egypt", flag: "🇪🇬" },
    { code: "KW", ar: "الكويت", en: "Kuwait", flag: "🇰🇼" },
    { code: "QA", ar: "قطر", en: "Qatar", flag: "🇶🇦" },
    { code: "BH", ar: "البحرين", en: "Bahrain", flag: "🇧🇭" },
    { code: "OM", ar: "عُمان", en: "Oman", flag: "🇴🇲" },
    { code: "JO", ar: "الأردن", en: "Jordan", flag: "🇯🇴" },
    { code: "LB", ar: "لبنان", en: "Lebanon", flag: "🇱🇧" },
    { code: "IQ", ar: "العراق", en: "Iraq", flag: "🇮🇶" },
    { code: "MA", ar: "المغرب", en: "Morocco", flag: "🇲🇦" },
    { code: "DZ", ar: "الجزائر", en: "Algeria", flag: "🇩🇿" },
    { code: "TN", ar: "تونس", en: "Tunisia", flag: "🇹🇳" },
    { code: "US", ar: "الولايات المتحدة", en: "United States", flag: "🇺🇸" },
    { code: "GB", ar: "المملكة المتحدة", en: "United Kingdom", flag: "🇬🇧" },
    { code: "GLOBAL", ar: "عالمي", en: "Global", flag: "🌍" },
];

const LANGUAGES = [
    { code: "ar", ar: "العربية", en: "Arabic" },
    { code: "en", ar: "الإنجليزية", en: "English" },
];

const CATEGORY_CONFIG: Record<string, {
    icon: React.ElementType;
    colorClass: string;
    bgClass: string;
    ar: string;
    en: string;
}> = {
    Problem:       { icon: AlertCircle,  colorClass: "text-red-500",    bgClass: "bg-red-500/10",     ar: "مشكلة",     en: "Problem" },
    Question:      { icon: HelpCircle,   colorClass: "text-blue-500",   bgClass: "bg-blue-500/10",    ar: "سؤال",      en: "Question" },
    Commercial:    { icon: ShoppingCart, colorClass: "text-emerald-500",bgClass: "bg-emerald-500/10", ar: "تجاري",     en: "Commercial" },
    Informational: { icon: Brain,        colorClass: "text-purple-500", bgClass: "bg-purple-500/10",  ar: "تعليمي",    en: "Informational" },
    Comparison:    { icon: BarChart2,    colorClass: "text-orange-500", bgClass: "bg-orange-500/10",  ar: "مقارنة",    en: "Comparison" },
    Local:         { icon: MapPin,       colorClass: "text-cyan-500",   bgClass: "bg-cyan-500/10",    ar: "محلي",      en: "Local" },
    Adjacent:      { icon: Share2,       colorClass: "text-slate-400",  bgClass: "bg-slate-500/10",   ar: "مجاور",     en: "Adjacent" },
};

type SortKey = "opportunityScore" | "volume" | "goldenScore" | "cpc";
type SortDir = "asc" | "desc";
type ViewMode = "all" | "gems";

interface ApiResponse {
    seedAnalysis: string;
    totalIdeas: number;
    hiddenGems: number;
    hasRealData: boolean;
    results: KeywordIdeaResult[];
}

// Loading steps for animated feedback
const LOADING_STEPS = [
    { ar: "🧠 الذكاء الاصطناعي يحلل الكلمة...", en: "🧠 AI is analyzing your keyword..." },
    { ar: "💡 توليد أفكار إبداعية من 7 زوايا...", en: "💡 Generating creative ideas from 7 angles..." },
    { ar: "📊 جلب البيانات الحقيقية من Google Ads...", en: "📊 Fetching real data from Google Ads..." },
    { ar: "⚡ حساب فرص الترتيب...", en: "⚡ Calculating ranking opportunities..." },
    { ar: "🏆 تحديد الفرص الذهبية المخفية...", en: "🏆 Identifying hidden golden opportunities..." },
];

export function KeywordIdeas() {
    const { isRtl } = useLanguage();
    const [seed, setSeed] = useState("");
    const [country, setCountry] = useState("SA");
    const [language, setLanguage] = useState("ar");
    const [isSearching, setIsSearching] = useState(false);
    const [loadingStep, setLoadingStep] = useState(0);
    const [data, setData] = useState<ApiResponse | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>("all");
    const [sortKey, setSortKey] = useState<SortKey>("opportunityScore");
    const [sortDir, setSortDir] = useState<SortDir>("desc");
    const [filterCategory, setFilterCategory] = useState<string>("all");
    const [expandedRationale, setExpandedRationale] = useState<Set<number>>(new Set());

    const selectedCountry = COUNTRIES.find(c => c.code === country);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!seed.trim()) return;

        setIsSearching(true);
        setData(null);
        setLoadingStep(0);
        setExpandedRationale(new Set());

        // Animate loading steps
        const stepInterval = setInterval(() => {
            setLoadingStep(s => Math.min(s + 1, LOADING_STEPS.length - 1));
        }, 2500);

        try {
            const res = await fetch("/api/seo/keyword-ideas", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ keyword: seed.trim(), country, language }),
            });
            if (!res.ok) throw new Error("Failed");
            const json = await res.json();
            setData(json);
            setViewMode(json.hiddenGems > 0 ? "gems" : "all");
        } catch (err) {
            console.error(err);
        } finally {
            clearInterval(stepInterval);
            setIsSearching(false);
        }
    };

    const handleSort = (key: SortKey) => {
        if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
        else { setSortKey(key); setSortDir("desc"); }
    };

    const getDisplayed = (): KeywordIdeaResult[] => {
        if (!data) return [];
        let list = data.results;
        if (viewMode === "gems") list = list.filter(r => r.isHiddenGem);
        if (filterCategory !== "all") list = list.filter(r => r.category === filterCategory);
        const compNum = (c: string) => ({ low: 1, medium: 2, high: 3 }[(c || "").toLowerCase()] ?? 2);
        return [...list].sort((a, b) => {
            let diff = 0;
            if (sortKey === "volume") diff = a.volume - b.volume;
            else if (sortKey === "cpc") diff = parseFloat(a.cpc) - parseFloat(b.cpc);
            else if (sortKey === "goldenScore") diff = a.goldenScore - b.goldenScore;
            else diff = a.opportunityScore - b.opportunityScore;
            return sortDir === "asc" ? diff : -diff;
        });
    };

    const exportCSV = () => {
        const rows = getDisplayed();
        if (!rows.length) return;
        const headers = ["Keyword", "Category", "Volume", "CPC", "Competition", "Golden Score", "Opportunity Score", "Hidden Gem", "Source", "Rationale"];
        const lines = rows.map(r =>
            `"${r.keyword}","${r.category}","${r.volume}","${r.cpc}","${r.competition}","${r.goldenScore}","${r.opportunityScore}","${r.isHiddenGem}","${r.source}","${r.rationale.replace(/"/g, "'")}"`
        );
        const csv = "\uFEFF" + [headers.join(","), ...lines].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `ai-keyword-ideas-${seed.slice(0, 20).replace(/\s/g, "-")}.csv`;
        a.click();
    };

    const SortIcon = ({ col }: { col: SortKey }) => {
        if (sortKey !== col) return <ChevronsUpDown className="h-3 w-3 opacity-40" />;
        return sortDir === "desc" ? <ChevronDown className="h-3 w-3 text-violet-500" /> : <ChevronUp className="h-3 w-3 text-violet-500" />;
    };

    const displayed = getDisplayed();
    const categories = data ? [...new Set(data.results.map(r => r.category))] : [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-violet-500 to-purple-700 bg-clip-text text-transparent flex items-center gap-2">
                    <Brain className="h-6 w-6 text-violet-500" />
                    {isRtl ? "مولّد أفكار الكلمات الذكي" : "AI Keyword Ideas Generator"}
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    {isRtl
                        ? "الذكاء الاصطناعي يحلل كلمتك من 7 زوايا مختلفة، ثم Google Ads يعطيك البيانات الحقيقية — النتيجة: فرص ذهبية لم يجدها أحد غيرك."
                        : "AI analyzes your keyword from 7 creative angles, then Google Ads validates with real data — uncovering hidden opportunities no one else sees."}
                </p>
            </div>

            {/* Search Form */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
                <form onSubmit={handleSearch} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="ai-seed" className="font-semibold">
                            {isRtl ? "الكلمة المفتاحية الأساسية" : "Seed Keyword"}
                        </Label>
                        <div className="relative">
                            <Brain className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRtl ? "right-3" : "left-3"}`} />
                            <Input
                                id="ai-seed"
                                className={`h-12 bg-background ${isRtl ? "pr-10" : "pl-10"} rounded-lg`}
                                placeholder={isRtl ? "مثال: تسويق رقمي" : "e.g. digital marketing"}
                                value={seed}
                                onChange={e => setSeed(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 items-end">
                        {/* Country */}
                        <div className="flex-1 space-y-2">
                            <Label className="font-semibold flex items-center gap-1.5">
                                <Globe className="h-4 w-4 text-muted-foreground" />
                                {isRtl ? "الدولة" : "Country"}
                            </Label>
                            <Select value={country} onValueChange={setCountry}>
                                <SelectTrigger className="h-11 bg-background">
                                    <SelectValue>
                                        <span className="flex items-center gap-2">
                                            <span>{selectedCountry?.flag}</span>
                                            <span>{isRtl ? selectedCountry?.ar : selectedCountry?.en}</span>
                                        </span>
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {COUNTRIES.map(c => (
                                        <SelectItem key={c.code} value={c.code}>
                                            <span className="flex items-center gap-2">
                                                <span>{c.flag}</span>
                                                <span>{isRtl ? c.ar : c.en}</span>
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Language */}
                        <div className="flex-1 space-y-2">
                            <Label className="font-semibold">{isRtl ? "اللغة" : "Language"}</Label>
                            <Select value={language} onValueChange={setLanguage}>
                                <SelectTrigger className="h-11 bg-background">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {LANGUAGES.map(l => (
                                        <SelectItem key={l.code} value={l.code}>
                                            {isRtl ? l.ar : l.en}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            type="submit"
                            size="lg"
                            className="h-11 rounded-lg bg-violet-600 hover:bg-violet-700 text-white whitespace-nowrap flex-shrink-0"
                            disabled={isSearching}
                        >
                            {isSearching ? (
                                <Loader2 className="h-5 w-5 animate-spin mx-4" />
                            ) : (
                                <>
                                    {isRtl ? "توليد الأفكار" : "Generate Ideas"}
                                    <Sparkles className={`${isRtl ? "mr-2" : "ml-2"} h-4 w-4`} />
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>

            {/* Loading State */}
            <AnimatePresence>
                {isSearching && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="bg-card border border-violet-500/20 rounded-xl p-8"
                    >
                        <div className="flex flex-col items-center gap-6">
                            {/* Animated brain icon */}
                            <div className="relative">
                                <div className="w-16 h-16 rounded-full bg-violet-500/10 flex items-center justify-center">
                                    <Brain className="h-8 w-8 text-violet-500 animate-pulse" />
                                </div>
                                <div className="absolute inset-0 rounded-full border-2 border-violet-500/30 animate-ping" />
                            </div>
                            {/* Step indicator */}
                            <div className="text-center space-y-2">
                                <p className="font-semibold text-foreground text-lg">
                                    {isRtl ? LOADING_STEPS[loadingStep].ar : LOADING_STEPS[loadingStep].en}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {isRtl ? "قد يستغرق هذا 10-20 ثانية..." : "This may take 10-20 seconds..."}
                                </p>
                            </div>
                            {/* Progress dots */}
                            <div className="flex gap-2">
                                {LOADING_STEPS.map((_, i) => (
                                    <div
                                        key={i}
                                        className={`h-2 rounded-full transition-all duration-500 ${
                                            i <= loadingStep
                                                ? "w-6 bg-violet-500"
                                                : "w-2 bg-muted"
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Results */}
            <AnimatePresence mode="wait">
                {data && !isSearching && (
                    <motion.div
                        key="results"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-5"
                    >
                        {/* Seed Analysis Card */}
                        {data.seedAnalysis && (
                            <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-4 flex gap-3">
                                <Brain className="h-5 w-5 text-violet-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-semibold text-violet-500 mb-1 uppercase tracking-wider">
                                        {isRtl ? "تحليل الذكاء الاصطناعي" : "AI Analysis"}
                                    </p>
                                    <p className="text-sm text-foreground/80 leading-relaxed">{data.seedAnalysis}</p>
                                </div>
                            </div>
                        )}

                        {/* Stats Row */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <StatCard
                                icon={<Sparkles className="h-5 w-5 text-violet-500" />}
                                label={isRtl ? "إجمالي الأفكار" : "Total Ideas"}
                                value={data.totalIdeas}
                                color="violet"
                            />
                            <StatCard
                                icon={<Zap className="h-5 w-5 text-amber-500" />}
                                label={isRtl ? "الفرص الذهبية المخفية" : "Hidden Gems"}
                                value={data.hiddenGems}
                                color="amber"
                                highlight={data.hiddenGems > 0}
                            />
                            <StatCard
                                icon={<Database className="h-5 w-5 text-emerald-500" />}
                                label={isRtl ? "مصدر البيانات" : "Data Source"}
                                value={data.hasRealData ? (isRtl ? "Google Ads" : "Google Ads") : (isRtl ? "AI فقط" : "AI Only")}
                                color={data.hasRealData ? "emerald" : "slate"}
                            />
                            <StatCard
                                icon={<BarChart2 className="h-5 w-5 text-blue-500" />}
                                label={isRtl ? "الفئات" : "Categories"}
                                value={categories.length}
                                color="blue"
                            />
                        </div>

                        {/* Toolbar */}
                        <div className="flex flex-wrap gap-3 items-center justify-between bg-card border border-border p-4 rounded-xl">
                            <div className="flex flex-wrap gap-2">
                                {/* View toggle */}
                                <div className="flex rounded-lg overflow-hidden border border-border">
                                    <button
                                        onClick={() => setViewMode("all")}
                                        className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                                            viewMode === "all"
                                                ? "bg-violet-600 text-white"
                                                : "bg-card text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        {isRtl ? "الكل" : "All"}
                                        <span className="ml-1 text-xs opacity-70">({data.results.length})</span>
                                    </button>
                                    <button
                                        onClick={() => setViewMode("gems")}
                                        className={`px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-1 ${
                                            viewMode === "gems"
                                                ? "bg-amber-500 text-white"
                                                : "bg-card text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        <Zap className="h-3 w-3" />
                                        {isRtl ? "الذهبية" : "Gems"}
                                        <span className="text-xs opacity-70">({data.hiddenGems})</span>
                                    </button>
                                </div>

                                {/* Category filter */}
                                <Select value={filterCategory} onValueChange={setFilterCategory}>
                                    <SelectTrigger className="h-8 w-auto min-w-[130px] text-sm bg-background border-border">
                                        <SelectValue placeholder={isRtl ? "كل الفئات" : "All Categories"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{isRtl ? "كل الفئات" : "All Categories"}</SelectItem>
                                        {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                                            <SelectItem key={key} value={key}>
                                                <span className="flex items-center gap-2">
                                                    <cfg.icon className={`h-3.5 w-3.5 ${cfg.colorClass}`} />
                                                    {isRtl ? cfg.ar : cfg.en}
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                    <span className="font-semibold text-foreground">{displayed.length}</span>
                                    {" "}{isRtl ? "كلمة" : "keywords"}
                                </span>
                                <Button onClick={exportCSV} variant="outline" size="sm" className="h-8">
                                    <Download className={`h-3.5 w-3.5 ${isRtl ? "ml-1.5" : "mr-1.5"}`} />
                                    {isRtl ? "تصدير" : "Export"}
                                </Button>
                            </div>
                        </div>

                        {/* Results Table */}
                        <div className="rounded-xl border border-border bg-card overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left rtl:text-right">
                                    <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b border-border">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold">{isRtl ? "الكلمة المفتاحية" : "Keyword"}</th>
                                            <th className="px-4 py-3 font-semibold whitespace-nowrap">{isRtl ? "الفئة" : "Category"}</th>
                                            <th className="px-4 py-3 font-semibold whitespace-nowrap cursor-pointer hover:text-foreground" onClick={() => handleSort("volume")}>
                                                <span className="flex items-center gap-1">{isRtl ? "البحث" : "Volume"}<SortIcon col="volume" /></span>
                                            </th>
                                            <th className="px-4 py-3 font-semibold whitespace-nowrap">{isRtl ? "المنافسة" : "Comp."}</th>
                                            <th className="px-4 py-3 font-semibold whitespace-nowrap cursor-pointer hover:text-foreground" onClick={() => handleSort("cpc")}>
                                                <span className="flex items-center gap-1">CPC<SortIcon col="cpc" /></span>
                                            </th>
                                            <th className="px-4 py-3 font-semibold whitespace-nowrap cursor-pointer hover:text-foreground" onClick={() => handleSort("opportunityScore")}>
                                                <span className="flex items-center gap-1">{isRtl ? "فرصة" : "Opp."}<SortIcon col="opportunityScore" /></span>
                                            </th>
                                            <th className="px-4 py-3 font-semibold whitespace-nowrap">{isRtl ? "المصدر" : "Source"}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {displayed.map((kw, idx) => {
                                            const cfg = CATEGORY_CONFIG[kw.category] ?? CATEGORY_CONFIG.Adjacent;
                                            const Icon = cfg.icon;
                                            const isExpanded = expandedRationale.has(idx);
                                            return (
                                                <motion.tr
                                                    key={idx}
                                                    initial={{ opacity: 0, y: 4 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.015 }}
                                                    className={`hover:bg-muted/10 transition-colors cursor-pointer ${kw.isHiddenGem ? "bg-amber-500/5" : ""}`}
                                                    onClick={() => setExpandedRationale(prev => {
                                                        const next = new Set(prev);
                                                        next.has(idx) ? next.delete(idx) : next.add(idx);
                                                        return next;
                                                    })}
                                                >
                                                    <td className="px-4 py-3">
                                                        <div className="space-y-0.5">
                                                            <div className="flex items-center gap-1.5 font-medium">
                                                                {kw.isHiddenGem && <Zap className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />}
                                                                {kw.keyword}
                                                            </div>
                                                            <AnimatePresence>
                                                                {isExpanded && (
                                                                    <motion.p
                                                                        initial={{ opacity: 0, height: 0 }}
                                                                        animate={{ opacity: 1, height: "auto" }}
                                                                        exit={{ opacity: 0, height: 0 }}
                                                                        className="text-xs text-muted-foreground leading-relaxed pt-0.5"
                                                                    >
                                                                        💡 {kw.rationale}
                                                                    </motion.p>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${cfg.bgClass} ${cfg.colorClass}`}>
                                                            <Icon className="h-3 w-3" />
                                                            {isRtl ? cfg.ar : cfg.en}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 font-medium">
                                                        {kw.volume.toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                                                            (kw.competition || "").toLowerCase() === "high" ? "bg-destructive/10 text-destructive" :
                                                            (kw.competition || "").toLowerCase() === "low"  ? "bg-emerald-500/10 text-emerald-500" :
                                                            "bg-orange-500/10 text-orange-500"
                                                        }`}>
                                                            {isRtl
                                                                ? ((kw.competition || "").toLowerCase() === "high" ? "عالية" : (kw.competition || "").toLowerCase() === "low" ? "منخفضة" : "متوسطة")
                                                                : (kw.competition || "Medium")}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-muted-foreground">${kw.cpc}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-14 h-1.5 bg-muted rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full transition-all ${kw.opportunityScore >= 70 ? "bg-violet-500" : kw.opportunityScore >= 40 ? "bg-blue-400" : "bg-muted-foreground/40"}`}
                                                                    style={{ width: `${kw.opportunityScore}%` }}
                                                                />
                                                            </div>
                                                            <span className={`text-xs font-bold ${kw.opportunityScore >= 70 ? "text-violet-500" : "text-muted-foreground"}`}>
                                                                {kw.opportunityScore}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                                            kw.source === "AI+Data" ? "bg-violet-500/10 text-violet-500" :
                                                            kw.source === "Data Expanded" ? "bg-emerald-500/10 text-emerald-500" :
                                                            "bg-slate-500/10 text-slate-400"
                                                        }`}>
                                                            {kw.source === "AI+Data" ? "AI+Data" :
                                                             kw.source === "Data Expanded" ? (isRtl ? "توسيع" : "Expanded") :
                                                             (isRtl ? "AI" : "AI")}
                                                        </span>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                        {displayed.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-12 text-center">
                                                    <div className="flex flex-col items-center opacity-40">
                                                        <Brain className="h-10 w-10 mb-3" />
                                                        <p className="font-medium">{isRtl ? "لا توجد نتائج" : "No results"}</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Category Summary Cards */}
                        {categories.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                    {isRtl ? "توزيع الأفكار حسب الفئة" : "Ideas by Category"}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
                                        const count = data.results.filter(r => r.category === key).length;
                                        if (count === 0) return null;
                                        const Icon = cfg.icon;
                                        return (
                                            <button
                                                key={key}
                                                onClick={() => setFilterCategory(filterCategory === key ? "all" : key)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                                    filterCategory === key
                                                        ? `${cfg.bgClass} ${cfg.colorClass} border-current`
                                                        : "bg-muted/40 text-muted-foreground border-border hover:border-current"
                                                }`}
                                            >
                                                <Icon className="h-3.5 w-3.5" />
                                                {isRtl ? cfg.ar : cfg.en}
                                                <span className="opacity-60">({count})</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function StatCard({
    icon, label, value, color, highlight = false
}: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    color: string;
    highlight?: boolean;
}) {
    return (
        <div className={`bg-card border rounded-xl p-4 ${highlight ? "border-amber-500/30 bg-amber-500/5" : "border-border"}`}>
            <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-muted-foreground">{label}</span></div>
            <p className={`text-2xl font-bold ${highlight ? "text-amber-500" : "text-foreground"}`}>{value}</p>
        </div>
    );
}
