"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Search, ArrowRight, Loader2, Globe, FileText, Target, BarChart3, ChevronRight, Download } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import html2pdf from "html2pdf.js";
import { getSeoHistory } from "@/app/actions/seo-history";
import { formatDistanceToNow } from "date-fns";
import { Clock, ExternalLink } from "lucide-react";

export function AdvancedSEOAnalysis() {
    const { t, isRtl } = useLanguage();
    const [url, setUrl] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [analysisResult, setAnalysisResult] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<"new" | "history">("new");
    const reportRef = useRef<HTMLDivElement>(null);

    // Fetch history on mount
    useEffect(() => {
        getSeoHistory().then(setHistory).catch(console.error);
    }, []);

    const exportToExcel = () => {
        if (!analysisResult?.keywords) return;
        const headers = ["Keyword", "Intent", "Search Volume", "Competition"];
        const rows = analysisResult.keywords.map((kw: any) => 
            `"${kw.keyword || kw.text}","${kw.intent}","${kw.volume}","${kw.competition}"`
        );
        const csvContent = [headers.join(","), ...rows].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `seo-keywords-${new URL(analysisResult.url).hostname}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToPDF = () => {
        if (!reportRef.current) return;
        const opt = {
            margin:       10,
            filename:     `seo-report-${new URL(analysisResult.url).hostname}.pdf`,
            image:        { type: 'jpeg' as const, quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
        };
        html2pdf().set(opt).from(reportRef.current).save();
    };    

    const handleAnalyze = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) return;
        
        setIsAnalyzing(true);
        setProgress(10);
        setAnalysisResult(null);
        
        // Progress animation simulation
        const interval = setInterval(() => {
            setProgress(p => {
                if (p >= 90) return 90; // Hold at 90 until complete
                return p + Math.floor(Math.random() * 15) + 5;
            });
        }, 800);

        try {
            const response = await fetch('/api/seo/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });
            
            clearInterval(interval);
            setProgress(100);
            
            if (!response.ok) {
                const err = await response.json();
                console.error("Analysis Failed:", err);
                setIsAnalyzing(false);
                return; // Consider showing a toast error here ideally
            }

            const data = await response.json();
            
            // Artificial delay to show 100% just briefly
            setTimeout(() => {
                setIsAnalyzing(false);
                setAnalysisResult(data);
                getSeoHistory().then(setHistory).catch(console.error); // refresh history
            }, 600);

        } catch (error) {
            clearInterval(interval);
            console.error("Request Failed", error);
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    {isRtl ? "أدوات السيو المتقدمة" : "Advanced SEO Analysis"}
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    {isRtl 
                        ? "تحليل شامل للموقع بالذكاء الاصطناعي وبناء استراتيجية بناءً على نية البحث الفعالة." 
                        : "Comprehensive AI-driven website analysis and semantic strategy generation."}
                </p>
            </div>

            <div className={`flex items-center gap-2 border-b border-border pb-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <button
                    onClick={() => setActiveTab("new")}
                    className={`px-4 py-2 font-medium text-sm rounded-lg transition-colors ${activeTab === 'new' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'}`}
                >
                    <div className="flex items-center gap-2">
                        <Search className="h-4 w-4" />
                        {isRtl ? "بحث جديد" : "New Analysis"}
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab("history")}
                    className={`px-4 py-2 font-medium text-sm rounded-lg transition-colors ${activeTab === 'history' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'}`}
                >
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {isRtl ? "سجل السجل" : "History"}
                    </div>
                </button>
            </div>

            {activeTab === "history" && !isAnalyzing && !analysisResult ? (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                    {history.length === 0 ? (
                        <div className="col-span-full py-16 text-center text-muted-foreground border rounded-xl border-dashed">
                            <Clock className="h-10 w-10 mx-auto opacity-20 mb-3" />
                            {isRtl ? "لا يوجد سجل بحث حتى الآن." : "No search history found."}
                        </div>
                    ) : (
                        history.map((hItem) => (
                            <div key={hItem.id} className="border border-border bg-card rounded-xl p-5 hover:border-primary/50 transition-colors flex flex-col gap-3">
                                <div>
                                    <div className="flex justify-between items-start gap-2 mb-1">
                                        <h3 className="font-semibold text-lg line-clamp-1" dir="ltr">{hItem.url}</h3>
                                        <span className="text-[10px] text-muted-foreground shrink-0">{formatDistanceToNow(new Date(hItem.createdAt), { addSuffix: true })}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2">{hItem.metaTitle || (isRtl ? "موقع جديد" : "New site")}</p>
                                </div>
                                
                                <div className="text-sm font-medium mt-auto border-t border-border pt-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground text-xs">{hItem.niche || 'General'}</span>
                                        <Button size="sm" variant="secondary" className="h-8 shadow-sm" onClick={() => {
                                            setAnalysisResult({
                                                url: hItem.url,
                                                meta: { title: hItem.metaTitle, description: hItem.metaDesc },
                                                niche: hItem.niche,
                                                audience: hItem.audience,
                                                keywords: JSON.parse(hItem.keywordsData || "[]")
                                            });
                                            setActiveTab("new");
                                        }}>
                                            {isRtl ? "عرض التحليل" : "View Result"} <ExternalLink className="h-3 w-3 ml-1.5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </motion.div>
            ) : (
            <AnimatePresence mode="wait">
                {!isAnalyzing && !analysisResult ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: -20 }}
                        className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-8 flex flex-col items-center justify-center min-h-[400px]"
                    >
                        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                            <Sparkles className="h-10 w-10 text-primary" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2">
                            {isRtl ? "أدخل رابط الموقع للتحليل" : "Enter Website URL for Analysis"}
                        </h2>
                        <p className="text-sm text-muted-foreground max-w-md text-center mb-8">
                            {isRtl 
                                ? "سيقوم النظام باستخراج المحتوى، تحديد النيش، وتحليل البيانات لبناء خطة سيو احترافية." 
                                : "The system will extract content, identify the niche, and analyze data to build a professional SEO plan."}
                        </p>

                        <form onSubmit={handleAnalyze} className="w-full max-w-lg flex flex-col gap-4">
                            <div className="relative">
                                <Globe className={`absolute top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground ${isRtl ? 'right-4' : 'left-4'}`} />
                                <Input 
                                    className={`h-14 bg-background px-12 text-lg rounded-xl shadow-sm`}
                                    placeholder="https://example.com"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    type="url"
                                    required
                                />
                            </div>
                            <Button type="submit" size="lg" className="h-14 rounded-xl text-base font-medium" onClick={handleAnalyze}>
                                <Search className={isRtl ? "ml-2 h-5 w-5" : "mr-2 h-5 w-5"} />
                                {isRtl ? "بدء التحليل الشامل" : "Start Comprehensive Analysis"}
                            </Button>
                        </form>
                    </motion.div>
                ) : isAnalyzing ? (
                    <motion.div 
                        key="loading"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-xl border border-border bg-card p-12 flex flex-col items-center justify-center min-h-[400px]"
                    >
                        <div className="relative mb-8">
                            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
                            <Loader2 className="h-16 w-16 text-primary animate-spin relative z-10" />
                        </div>
                        <h3 className="text-xl font-bold mb-4">
                            {isRtl ? "جاري تحليل الموقع..." : "Analyzing Website..."}
                        </h3>
                        
                        <div className="w-full max-w-md space-y-2">
                            <div className="flex justify-between text-sm text-muted-foreground mb-1">
                                <span>{isRtl ? "قراءة البيانات" : "Reading Data"}</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <motion.div 
                                    className="h-full bg-primary"
                                    initial={{ width: "0%" }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                        </div>

                        <div className="mt-8 flex flex-col gap-3 text-sm text-muted-foreground items-center">
                            <div className="flex items-center gap-2">
                                <CheckCircle progress={progress} threshold={20} />
                                <span>{isRtl ? "استخراج المحتوى من الرابط" : "Crawling website content"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle progress={progress} threshold={50} />
                                <span>{isRtl ? "تحليل النيش باستخدام Claude AI" : "Analyzing niche with Claude AI"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle progress={progress} threshold={80} />
                                <span>{isRtl ? "جلب بيانات جوجل وإعداد الاستراتيجية" : "Fetching Google data & building strategy"}</span>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="results"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                    >
                        {/* Wrapper for PDF Export */}
                        <div ref={reportRef} className="space-y-8 bg-background p-4 rounded-xl">
                            {/* URL Header */}
                            <div className="border-b pb-4 mb-4">
                                <h2 className="text-xl font-bold mb-1">{isRtl ? "تقرير تحليل:" : "Analysis Report:"} {analysisResult.url}</h2>
                                <p className="text-sm text-muted-foreground">{analysisResult.meta?.title}</p>
                            </div>

                            {/* Results Dashboard */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-primary font-medium mb-1">
                                    <Target className="h-5 w-5" />
                                    {isRtl ? "المجال والجمهور" : "Niche & Audience"}
                                </div>
                                <h3 className="text-xl font-bold">{analysisResult?.niche || "Unknown"}</h3>
                                <p className="text-sm text-muted-foreground">{analysisResult?.audience || "Audience not detected"}</p>
                            </div>
                            
                            <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-emerald-500 font-medium mb-1">
                                    <FileText className="h-5 w-5" />
                                    {isRtl ? "الكلمات المفتاحية" : "Keywords Found"}
                                </div>
                                <h3 className="text-xl font-bold">{analysisResult?.keywords?.length || 0}</h3>
                                <p className="text-sm text-muted-foreground">{isRtl ? "تم استخراجها وتصنيفها بنجاح" : "Successfully extracted & clustered"}</p>
                            </div>

                            <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-2 items-start justify-center" data-html2canvas-ignore>
                                <Button 
                                    onClick={exportToExcel}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20"
                                >
                                    <Download className={isRtl ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
                                    {isRtl ? "تصدير كـ Excel/CSV" : "Export to Excel/CSV"}
                                </Button>
                                <Button 
                                    onClick={exportToPDF}
                                    variant="outline"
                                    className="w-full"
                                >
                                    <FileText className={isRtl ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
                                    {isRtl ? "تصدير كـ PDF" : "Export to PDF"}
                                </Button>
                            </div>
                        </div>

                        {/* Keyword Table */}
                        <div className="rounded-xl border border-border bg-card overflow-hidden">
                            <div className="p-4 border-b border-border bg-muted/50 font-medium flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-primary" />
                                {isRtl ? "أهم الكلمات المفتاحية المقترحة" : "Top Suggested Keywords"}
                            </div>
                            <div className="p-0 overflow-x-auto">
                                <table className="w-full text-sm text-left rtl:text-right">
                                    <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
                                        <tr>
                                            <th className="px-6 py-4">{isRtl ? "الكلمة المفتاحية" : "Keyword"}</th>
                                            <th className="px-6 py-4">{isRtl ? "نية البحث" : "Intent"}</th>
                                            <th className="px-6 py-4">{isRtl ? "حجم البحث" : "Search Volume"}</th>
                                            <th className="px-6 py-4">{isRtl ? "المنافسة" : "Competition"}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {analysisResult?.keywords?.map((kw: any, idx: number) => (
                                            <tr key={idx} className="border-b border-border/50 hover:bg-muted/10">
                                                <td className="px-6 py-4 font-medium">{kw.keyword || kw.text}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                                        kw.intent === 'Informational' ? 'bg-emerald-500/10 text-emerald-500' :
                                                        kw.intent === 'Commercial' ? 'bg-blue-500/10 text-blue-500' :
                                                        kw.intent === 'Transactional' ? 'bg-purple-500/10 text-purple-500' :
                                                        'bg-orange-500/10 text-orange-500'
                                                    }`}>
                                                        {kw.intent}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">{kw.volume?.toLocaleString() || "N/A"}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`font-medium ${
                                                        kw.competition === 'High' ? 'text-red-500' :
                                                        kw.competition === 'Medium' ? 'text-yellow-500' : 'text-emerald-500'
                                                    }`}>
                                                        {kw.competition || "Medium"}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {(!analysisResult?.keywords || analysisResult.keywords.length === 0) && (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                                                    {isRtl ? "لم يتم العثور على كلمات مفتاحية" : "No keywords found"}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        </div> {/* End of PDF Wrapper */}

                        <div className="flex justify-center mt-6">
                            <Button variant="ghost" onClick={() => { setAnalysisResult(null); setUrl(""); }}>
                                <ChevronRight className={isRtl ? "ml-2 h-4 w-4 rotate-180" : "mr-2 h-4 w-4"} />
                                {isRtl ? "تحليل موقع جديد" : "Analyze New Website"}
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            )}
        </div>
    );
}

// Simple internal component to show step progress Checkmarks
function CheckCircle({ progress, threshold }: { progress: number, threshold: number }) {
    if (progress >= threshold) {
        return <div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center"><div className="h-2 w-2 bg-primary rounded-full"></div></div>;
    }
    return <div className="h-4 w-4 rounded-full border border-muted-foreground/30"></div>;
}

// Temporary icon to avoid importing CheckSquare if not available in this scope
function CheckSquare(props: any) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <polyline points="9 11 12 14 22 4"></polyline>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
        </svg>
    );
}
