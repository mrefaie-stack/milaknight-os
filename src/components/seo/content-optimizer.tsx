"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Activity, Play, CheckCircle2, TrendingUp, TrendingDown, Target } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface OptimizerResult {
    seoScore: number;
    densityState: "Perfect" | "Low" | "Stuffed";
    wordCount: number;
    positiveHighlights: string[];
    improvementAreas: string[];
}

export function ContentOptimizer() {
    const { t, isRtl } = useLanguage();
    const [keyword, setKeyword] = useState("");
    const [content, setContent] = useState("");
  
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<OptimizerResult | null>(null);

    const handleAnalyze = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!keyword.trim() || !content.trim()) return;
        
        setIsAnalyzing(true);
        setResult(null);

        try {
            const response = await fetch('/api/seo/content-optimizer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keyword: keyword.trim(), contentText: content.trim() })
            });

            if (!response.ok) throw new Error("Optimization Failed");

            const data = await response.json();
            setResult(data);
        } catch (error) {
            console.error("Optimization failed", error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
                    <Activity className="h-6 w-6 text-blue-500" />
                    {isRtl ? "مُقيّم ومحسن المحتوى" : "AI Content Optimizer"}
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    {isRtl 
                        ? "انسخ مقالك هنا قبل النشر وافحص توافقه مع الكلمة المستهدفة (Keyword Density and Readability)." 
                        : "Paste your article before publishing to check its alignment with the target keyword."}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Editor Block */}
                <div className="bg-card border border-border rounded-xl shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-border bg-muted/20">
                        <Input 
                            placeholder={isRtl ? "الكلمة المفتاحية المستهدفة (Focus Keyword)" : "Focus Keyword"}
                            className="bg-background text-lg font-semibold border-none shadow-none focus-visible:ring-1"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                        />
                    </div>
                    <Textarea
                        placeholder={isRtl ? "الصق المحتوى أو المقال هنا للتقييم الفوري..." : "Paste your content or article here for instant evaluation..."}
                        className="flex-1 min-h-[400px] xl:min-h-[500px] border-none resize-none rounded-none focus-visible:ring-0 p-6 leading-relaxed bg-background/50"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />
                    <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between">
                        <div className="text-xs text-muted-foreground font-medium flex gap-4">
                            <span>{content.trim().split(/\s+/).filter(w=>w).length} {isRtl ? "كلمة مقروءة" : "words"}</span>
                            <span>{content.length} {isRtl ? "حرف" : "chars"}</span>
                        </div>
                        <Button 
                            onClick={handleAnalyze} 
                            disabled={isAnalyzing || !content || !keyword}
                            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]"
                        >
                            {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                                <>
                                    <Play className={isRtl ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
                                    {isRtl ? "تحليل وحساب السكور" : "Analyze SEO Score"}
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Results Block */}
                <div className="bg-card border border-border rounded-xl shadow-sm p-6 overflow-y-auto">
                    <AnimatePresence mode="wait">
                        {!result && !isAnalyzing ? (
                            <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 py-20"
                            >
                                <Target className="h-16 w-16 mb-4" />
                                <h3 className="text-xl font-medium">{isRtl ? "في انتظار المحتوى للتحليل" : "Waiting for content..."}</h3>
                            </motion.div>
                        ) : isAnalyzing ? (
                            <motion.div 
                                key="loading"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="h-full flex flex-col items-center justify-center text-blue-500 py-20 space-y-4"
                            >
                                <Loader2 className="h-12 w-12 animate-spin" />
                                <p className="font-medium animate-pulse">{isRtl ? "الذكاء الاصطناعي يقرأ ويحلل الكثافة..." : "AI is reading and calculating density..."}</p>
                            </motion.div>
                        ) : result ? (
                            <motion.div 
                                key="results"
                                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                className="space-y-8"
                            >
                                {/* Score Circle */}
                                <div className="flex flex-col items-center justify-center p-6 border border-border rounded-2xl bg-muted/10 relative overflow-hidden">
                                     <div className={`absolute top-0 w-full h-1 ${result.seoScore >= 80 ? 'bg-emerald-500' : result.seoScore >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} />
                                     <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">{isRtl ? "سكور توافق السيو" : "SEO Content Score"}</h2>
                                     <div className="flex items-end gap-1">
                                        <span className={`text-6xl font-black ${result.seoScore >= 80 ? 'text-emerald-500' : result.seoScore >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                                            {result.seoScore}
                                        </span>
                                        <span className="text-xl font-bold text-muted-foreground mb-1.5">/100</span>
                                     </div>
                                     <div className="mt-4 flex gap-4 text-sm font-medium">
                                        <span className="flex items-center gap-1.5">
                                            {isRtl ? "الكثافة:" : "Density:"} 
                                            <span className={`${result.densityState === 'Perfect' ? 'text-emerald-500' : 'text-red-500'}`}>{result.densityState}</span>
                                        </span>
                                     </div>
                                </div>

                                {/* Good Points */}
                                <div className="space-y-3">
                                    <h3 className="font-bold flex items-center gap-2 text-emerald-600">
                                        <TrendingUp className="h-5 w-5" /> 
                                        {isRtl ? "تم تنفيذه بنجاح" : "What looks good"}
                                    </h3>
                                    <div className="space-y-2">
                                        {result.positiveHighlights.map((hl, i) => (
                                            <div key={i} className="flex items-start gap-2 text-sm bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/10">
                                                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                                                <span className="text-foreground/90 leading-relaxed">{hl}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Fix Points */}
                                <div className="space-y-3">
                                    <h3 className="font-bold flex items-center gap-2 text-amber-600">
                                        <TrendingDown className="h-5 w-5" /> 
                                        {isRtl ? "نقاط تحتاج إصلاح ومراجعة" : "Areas to Improve"}
                                    </h3>
                                    <div className="space-y-2">
                                        {result.improvementAreas.map((hl, i) => (
                                            <div key={i} className="flex items-start gap-2 text-sm bg-amber-500/5 p-3 rounded-lg border border-amber-500/20">
                                                <Target className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                                                <span className="text-foreground/90 leading-relaxed">{hl}</span>
                                            </div>
                                        ))}
                                        {result.improvementAreas.length === 0 && (
                                            <div className="text-emerald-600 text-sm font-medium">{isRtl ? "لا يوجد أي أخطاء، مقال ممتاز!" : "No errors found, perfect article!"}</div>
                                        )}
                                    </div>
                                </div>

                            </motion.div>
                        ) : null}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
