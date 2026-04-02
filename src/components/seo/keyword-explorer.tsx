"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search, Loader2, Download, Filter, Star, Sparkles,
    Globe, ChevronUp, ChevronDown, ChevronsUpDown
} from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { SeoHistoryViewer } from "./seo-history-viewer";

interface KeywordIdea {
    keyword: string;
    volume: number;
    cpc: string;
    competition: string;
    goldenScore: number;
    intent?: string;
}

type SortKey = "volume" | "cpc" | "competition" | "goldenScore";
type SortDir = "asc" | "desc";

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
    { code: "LY", ar: "ليبيا", en: "Libya", flag: "🇱🇾" },
    { code: "SD", ar: "السودان", en: "Sudan", flag: "🇸🇩" },
    { code: "US", ar: "الولايات المتحدة", en: "United States", flag: "🇺🇸" },
    { code: "GB", ar: "المملكة المتحدة", en: "United Kingdom", flag: "🇬🇧" },
    { code: "GLOBAL", ar: "عالمي", en: "Global", flag: "🌍" },
];

const LANGUAGES = [
    { code: "ar", ar: "العربية", en: "Arabic" },
    { code: "en", ar: "الإنجليزية", en: "English" },
];

export function KeywordExplorer() {
    const { t, isRtl } = useLanguage();
    const [seed, setSeed] = useState("");
    const [country, setCountry] = useState("SA");
    const [language, setLanguage] = useState("ar");
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<KeywordIdea[] | null>(null);
    const [goldenOnly, setGoldenOnly] = useState(false);
    const [minVolume, setMinVolume] = useState(0);
    const [sortKey, setSortKey] = useState<SortKey>("goldenScore");
    const [sortDir, setSortDir] = useState<SortDir>("desc");

    const exportToExcel = () => {
        if (!results) return;
        const dataToExport = getDisplayed();
        const headers = ["Keyword", "Search Volume", "CPC", "Competition", "Golden Score"];
        const rows = dataToExport.map((kw: KeywordIdea) =>
            `"${kw.keyword}","${kw.volume}","${kw.cpc}","${kw.competition}","${kw.goldenScore}"`
        );
        const csvContent = [headers.join(","), ...rows].join("\n");
        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `keywords-${seed.substring(0, 20).replace(/\s/g, '-')}-${country}.csv`);
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
                body: JSON.stringify({ keyword: seed.trim(), country, language })
            });
            if (!response.ok) throw new Error("Failed");
            const data = await response.json();
            setResults(data);
        } catch (error) {
            console.error("Request Failed", error);
        } finally {
            setIsSearching(false);
        }
    };

    const isGolden = (kw: KeywordIdea) =>
        kw.competition.toLowerCase() === 'low' && kw.volume >= 500;

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir(d => d === "asc" ? "desc" : "asc");
        } else {
            setSortKey(key);
            setSortDir("desc");
        }
    };

    const compToNum = (c: string) => {
        const l = c.toLowerCase();
        if (l === 'low') return 1;
        if (l === 'medium') return 2;
        return 3;
    };

    const getDisplayed = () => {
        if (!results) return [];
        let list = results.filter(k => {
            if (goldenOnly && !isGolden(k)) return false;
            if (minVolume > 0 && k.volume < minVolume) return false;
            return true;
        });
        list = [...list].sort((a, b) => {
            let diff = 0;
            if (sortKey === "volume") diff = a.volume - b.volume;
            else if (sortKey === "cpc") diff = parseFloat(a.cpc) - parseFloat(b.cpc);
            else if (sortKey === "competition") diff = compToNum(a.competition) - compToNum(b.competition);
            else diff = a.goldenScore - b.goldenScore;
            return sortDir === "asc" ? diff : -diff;
        });
        return list;
    };

    const displayedResults = getDisplayed();

    const SortIcon = ({ col }: { col: SortKey }) => {
        if (sortKey !== col) return <ChevronsUpDown className="h-3 w-3 opacity-40" />;
        return sortDir === "desc"
            ? <ChevronDown className="h-3 w-3 text-amber-500" />
            : <ChevronUp className="h-3 w-3 text-amber-500" />;
    };

    const selectedCountry = COUNTRIES.find(c => c.code === country);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-amber-500 to-amber-700 bg-clip-text text-transparent flex items-center gap-2">
                        <Search className="h-6 w-6 text-amber-500" />
                        {isRtl ? "مستكشف الكلمات المفتاحية" : "Keyword Explorer"}
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        {isRtl
                            ? "ابحث بكلمة واحدة واحصل على أفضل الفرص من Google Ads مع بيانات دقيقة حسب الدولة."
                            : "Enter a keyword to discover opportunities from Google Ads with accurate country-specific data."}
                    </p>
                </div>
                <SeoHistoryViewer
                    toolName="KEYWORD_EXPLORER"
                    onSelect={(data, input) => {
                        setResults(data);
                        if (input?.keyword) setSeed(input.keyword);
                        if (input?.country) setCountry(input.country);
                    }}
                />
            </div>

            {/* Search Form */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
                <form onSubmit={handleSearch} className="space-y-4">
                    {/* Keyword Input */}
                    <div className="space-y-2">
                        <Label htmlFor="seed" className="font-semibold">
                            {isRtl ? "الكلمة المفتاحية" : "Seed Keyword"}
                        </Label>
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

                    {/* Country + Language + Search */}
                    <div className="flex flex-col sm:flex-row gap-3 items-end">
                        {/* Country Selector */}
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
                                    {COUNTRIES.map((c) => (
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

                        {/* Language Selector */}
                        <div className="flex-1 space-y-2">
                            <Label className="font-semibold">
                                {isRtl ? "اللغة" : "Language"}
                            </Label>
                            <Select value={language} onValueChange={setLanguage}>
                                <SelectTrigger className="h-11 bg-background">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {LANGUAGES.map((l) => (
                                        <SelectItem key={l.code} value={l.code}>
                                            {isRtl ? l.ar : l.en}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Min Volume */}
                        <div className="flex-1 space-y-2">
                            <Label className="font-semibold">
                                {isRtl ? "حد أدنى للبحث" : "Min Volume"}
                            </Label>
                            <Select
                                value={String(minVolume)}
                                onValueChange={(v) => setMinVolume(Number(v))}
                            >
                                <SelectTrigger className="h-11 bg-background">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">{isRtl ? "بدون حد أدنى" : "No minimum"}</SelectItem>
                                    <SelectItem value="100">100+</SelectItem>
                                    <SelectItem value="500">500+</SelectItem>
                                    <SelectItem value="1000">1,000+</SelectItem>
                                    <SelectItem value="5000">5,000+</SelectItem>
                                    <SelectItem value="10000">10,000+</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            type="submit"
                            size="lg"
                            className="h-11 rounded-lg bg-amber-600 hover:bg-amber-700 text-white whitespace-nowrap"
                            disabled={isSearching}
                        >
                            {isSearching ? (
                                <Loader2 className="h-5 w-5 animate-spin mx-6" />
                            ) : (
                                <>
                                    {isRtl ? "اكتشف الفرص" : "Discover Ideas"}
                                    <Sparkles className={`${isRtl ? "mr-2" : "ml-2"} h-4 w-4`} />
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>

            <AnimatePresence mode="wait">
                {results && !isSearching && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        {/* Toolbar */}
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
                                        {isRtl ? "الكلمات الذهبية فقط" : "Golden Only"}
                                    </Label>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 py-1.5 px-3 rounded-md">
                                    <span className="font-semibold text-foreground">{displayedResults.length}</span>
                                    {isRtl ? "كلمة" : "keywords"}
                                </div>
                                <Button onClick={exportToExcel} variant="outline" className="h-9 whitespace-nowrap">
                                    <Download className={`${isRtl ? "ml-2" : "mr-2"} h-4 w-4`} />
                                    {isRtl ? "تصدير CSV" : "Export CSV"}
                                </Button>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="rounded-xl border border-border bg-card overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left rtl:text-right">
                                    <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b border-border">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold">
                                                {isRtl ? "الكلمة المفتاحية" : "Keyword"}
                                            </th>
                                            <th className="px-6 py-4 font-semibold whitespace-nowrap">
                                                {isRtl ? "نية البحث" : "Intent"}
                                            </th>
                                            <th
                                                className="px-6 py-4 font-semibold whitespace-nowrap cursor-pointer hover:text-foreground"
                                                onClick={() => handleSort("volume")}
                                            >
                                                <span className="flex items-center gap-1">
                                                    {isRtl ? "حجم البحث" : "Volume"}
                                                    <SortIcon col="volume" />
                                                </span>
                                            </th>
                                            <th
                                                className="px-6 py-4 font-semibold whitespace-nowrap cursor-pointer hover:text-foreground"
                                                onClick={() => handleSort("competition")}
                                            >
                                                <span className="flex items-center gap-1">
                                                    {isRtl ? "المنافسة" : "Competition"}
                                                    <SortIcon col="competition" />
                                                </span>
                                            </th>
                                            <th
                                                className="px-6 py-4 font-semibold whitespace-nowrap cursor-pointer hover:text-foreground"
                                                onClick={() => handleSort("cpc")}
                                            >
                                                <span className="flex items-center gap-1">
                                                    {isRtl ? "سعر النقرة" : "CPC"}
                                                    <SortIcon col="cpc" />
                                                </span>
                                            </th>
                                            <th
                                                className="px-6 py-4 font-semibold whitespace-nowrap cursor-pointer hover:text-foreground"
                                                onClick={() => handleSort("goldenScore")}
                                            >
                                                <span className="flex items-center gap-1">
                                                    {isRtl ? "المؤشر الذهبي" : "Golden Score"}
                                                    <SortIcon col="goldenScore" />
                                                </span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {displayedResults.map((kw, idx) => {
                                            const golden = isGolden(kw);
                                            return (
                                                <tr key={idx} className={`hover:bg-muted/10 transition-colors ${golden ? 'bg-amber-500/5' : ''}`}>
                                                    <td className="px-6 py-4 font-medium text-[15px]">
                                                        <span className="flex items-center gap-2">
                                                            {golden && <Star className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />}
                                                            {kw.keyword}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {kw.intent && kw.intent !== "Unknown" && (
                                                            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap ${
                                                                kw.intent === "Transactional" ? "bg-emerald-500/10 text-emerald-600" :
                                                                kw.intent === "Commercial" ? "bg-blue-500/10 text-blue-600" :
                                                                kw.intent === "Navigational" ? "bg-purple-500/10 text-purple-600" :
                                                                "bg-slate-500/10 text-slate-500"
                                                            }`}>
                                                                {isRtl
                                                                    ? (kw.intent === "Transactional" ? "شراء" :
                                                                       kw.intent === "Commercial" ? "تجاري" :
                                                                       kw.intent === "Navigational" ? "تنقل" : "معلومات")
                                                                    : kw.intent}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="font-medium">{kw.volume.toLocaleString()}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase ${
                                                            kw.competition.toLowerCase() === 'high' ? 'bg-destructive/10 text-destructive' :
                                                            kw.competition.toLowerCase() === 'medium' ? 'bg-orange-500/10 text-orange-500' :
                                                            'bg-emerald-500/10 text-emerald-500'
                                                        }`}>
                                                            {isRtl
                                                                ? (kw.competition.toLowerCase() === 'high' ? 'عالية' : kw.competition.toLowerCase() === 'medium' ? 'متوسطة' : 'منخفضة')
                                                                : kw.competition}
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
                                                <td colSpan={6} className="px-6 py-12 text-center">
                                                    <div className="flex flex-col items-center justify-center opacity-40">
                                                        <Filter className="h-10 w-10 mb-3" />
                                                        <p className="text-lg font-medium">{isRtl ? "لا توجد نتائج" : "No results found"}</p>
                                                        <p className="text-sm mt-1">{isRtl ? "جرب تغيير الفلاتر أو كلمة مختلفة" : "Try changing filters or a different keyword"}</p>
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
