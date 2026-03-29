"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, ShieldCheck, CheckCircle2, AlertTriangle, XCircle, Globe, Activity } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AuditResult {
    rawMetrics: any;
    audit: {
        healthScore: number;
        summary: string;
        checks: { name: string; status: 'pass' | 'warning' | 'fail'; message: string; recommendation: string }[];
    }
}

export function TechnicalAuditor() {
    const { t, isRtl } = useLanguage();
    const [url, setUrl] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<AuditResult | null>(null);
    const [errorMsg, setErrorMsg] = useState("");

    const handleAnalyze = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) return;
        
        setIsAnalyzing(true);
        setResult(null);
        setErrorMsg("");

        try {
            const response = await fetch('/api/seo/technical-audit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.details || err.error || "Analysis Failed");
            }

            const data = await response.json();
            setResult(data);
        } catch (error: any) {
            console.error("Audit Failed", error);
            setErrorMsg(error.message);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent flex items-center gap-2">
                    <ShieldCheck className="h-6 w-6 text-emerald-500" />
                    {isRtl ? "المدقق التقني السريع" : "Technical SEO Auditor"}
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    {isRtl 
                        ? "يفحص صحة الصفحة البرمجية ويقدم تقريراً تفصيلياً بالأخطاء التي تعيق التصدر." 
                        : "Checks technical page health and provides a detailed report on ranking-blocking issues."}
                </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <form onSubmit={handleAnalyze} className="flex flex-col gap-4">
                    <div className="relative">
                        <Globe className={`absolute top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground ${isRtl ? 'right-4' : 'left-4'}`} />
                        <Input 
                            className={`h-14 bg-background px-12 text-lg rounded-xl shadow-sm`}
                            placeholder="https://example.com/page"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            type="url"
                            required
                        />
                    </div>
                    <Button type="submit" size="lg" className="h-14 rounded-xl text-base font-medium bg-emerald-600 hover:bg-emerald-700 w-full" disabled={isAnalyzing}>
                        {isAnalyzing ? <Loader2 className="h-5 w-5 animate-spin mx-2" /> : <Search className={isRtl ? "ml-2 h-5 w-5" : "mr-2 h-5 w-5"} />}
                        {isRtl ? "فحص تقني شامل" : "Run Technical Audit"}
                    </Button>
                </form>
                {errorMsg && <p className="text-destructive font-medium mt-4 text-center">{errorMsg}</p>}
            </div>

            <AnimatePresence mode="wait">
                {result && !isAnalyzing && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Health Score Banner */}
                        <div className="bg-card border border-border rounded-xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
                            <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted-foreground/20" />
                                    <circle 
                                        cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" 
                                        strokeDasharray="283" 
                                        strokeDashoffset={283 - (283 * result.audit.healthScore) / 100}
                                        className={`${result.audit.healthScore >= 80 ? 'text-emerald-500' : result.audit.healthScore >= 50 ? 'text-amber-500' : 'text-red-500'} transition-all duration-1000 ease-out`} 
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-bold">{result.audit.healthScore}</span>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none">Score</span>
                                </div>
                            </div>
                            <div className="flex-1 text-center md:text-start space-y-2">
                                <h2 className="text-xl font-bold">{isRtl ? "حالة الصفحة التقنية" : "Technical Page Health"}</h2>
                                <p className="text-muted-foreground leading-relaxed">{result.audit.summary}</p>
                            </div>
                        </div>

                        {/* Audit Checklist */}
                        <div className="bg-card border border-border rounded-xl overflow-hidden">
                            <div className="p-4 bg-muted/30 border-b border-border font-semibold flex items-center gap-2">
                                <Activity className="h-5 w-5 text-emerald-500" />
                                {isRtl ? "تفاصيل الفحص التقني" : "Technical Audit Details"}
                            </div>
                            <div className="divide-y divide-border/50">
                                {result.audit.checks.map((check, idx) => (
                                    <div key={idx} className="p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center hover:bg-muted/10 transition-colors">
                                        <div className="shrink-0 mt-1 sm:mt-0">
                                            {check.status === 'pass' ? <CheckCircle2 className="h-6 w-6 text-emerald-500" /> :
                                             check.status === 'warning' ? <AlertTriangle className="h-6 w-6 text-amber-500" /> :
                                             <XCircle className="h-6 w-6 text-red-500" />}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <h4 className="font-semibold text-lg">{check.name}</h4>
                                            <p className="text-muted-foreground">{check.message}</p>
                                        </div>
                                        {check.status !== 'pass' && check.recommendation && (
                                            <div className="w-full sm:w-1/3 bg-muted p-3 rounded-md border border-border text-sm">
                                                <strong className="block text-xs uppercase tracking-wider mb-1 text-foreground/70">{isRtl ? "توصية الإصلاح:" : "Fix:"}</strong>
                                                <span className={`${check.status === 'fail' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>{check.recommendation}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
