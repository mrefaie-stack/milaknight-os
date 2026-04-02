"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Globe, Search, Loader2, ChevronDown, ChevronUp, Download,
    AlertCircle, AlertTriangle, Info, CheckCircle2, Zap,
    Shield, Code2, Link2, Image, FileText, BarChart3,
    Share2, Database, MapPin, RefreshCw
} from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SiteAnalysisResponse, SiteIssue, CategoryResult } from "@/app/api/seo/site-analysis/route";

// ─────────────────────────── helpers ────────────────────────────────────────

function scoreColor(score: number) {
    if (score >= 80) return { stroke: "#22c55e", text: "text-green-500", bg: "bg-green-500/10" };
    if (score >= 60) return { stroke: "#eab308", text: "text-yellow-500", bg: "bg-yellow-500/10" };
    if (score >= 40) return { stroke: "#f97316", text: "text-orange-500", bg: "bg-orange-500/10" };
    return { stroke: "#ef4444", text: "text-red-500", bg: "bg-red-500/10" };
}

function gradeColor(grade: string) {
    const map: Record<string, string> = { A: "text-green-500 border-green-500", B: "text-blue-500 border-blue-500", C: "text-yellow-500 border-yellow-500", D: "text-orange-500 border-orange-500", F: "text-red-500 border-red-500" };
    return map[grade] || "text-gray-500 border-gray-500";
}

function severityConfig(severity: SiteIssue["severity"]) {
    const configs = {
        error:   { icon: AlertCircle,   color: "text-red-500",    bg: "bg-red-500/8",    border: "border-red-500/20",    badge: "bg-red-500/15 text-red-600",    label: "Error" },
        warning: { icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-500/8", border: "border-orange-500/20", badge: "bg-orange-500/15 text-orange-600", label: "Warning" },
        notice:  { icon: Info,          color: "text-blue-500",   bg: "bg-blue-500/8",   border: "border-blue-500/20",   badge: "bg-blue-500/15 text-blue-600",   label: "Notice" },
        pass:    { icon: CheckCircle2,  color: "text-green-500",  bg: "bg-green-500/8",  border: "border-green-500/20",  badge: "bg-green-500/15 text-green-600", label: "Passed" },
    };
    return configs[severity];
}

function categoryIcon(name: string) {
    const map: Record<string, any> = {
        "Crawlability": Globe,
        "On-Page": FileText,
        "Content": BarChart3,
        "Technical": Code2,
        "Structured Data": Database,
        "Social": Share2,
        "Security": Shield,
        "Links": Link2,
        "Images": Image,
        "Internationalization": MapPin,
    };
    return map[name] || FileText;
}

function categoryScore(cat: CategoryResult) {
    const score = Math.max(0, 100 - cat.errors * 5 - cat.warnings * 2 - cat.notices * 0.5);
    return Math.round(score);
}

// ─────────────────────────── Gauge SVG ──────────────────────────────────────

function ScoreGauge({ score, grade }: { score: number; grade: string }) {
    const radius = 58;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - score / 100);
    const colors = scoreColor(score);

    return (
        <div className="relative flex items-center justify-center">
            <svg width="160" height="160" className="transform -rotate-90">
                <circle cx="80" cy="80" r={radius} fill="none" stroke="currentColor" strokeWidth="10" className="text-muted/30" />
                <circle
                    cx="80" cy="80" r={radius} fill="none"
                    stroke={colors.stroke} strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-black ${colors.text}`}>{score}</span>
                <span className="text-xs text-muted-foreground font-medium">/ 100</span>
            </div>
        </div>
    );
}

// ─────────────────────────── Issue row ──────────────────────────────────────

function IssueRow({ issue }: { issue: SiteIssue }) {
    const [open, setOpen] = useState(false);
    const cfg = severityConfig(issue.severity);
    const Icon = cfg.icon;
    if (issue.severity === "pass") return (
        <div className={`flex items-center gap-3 px-4 py-2.5 rounded-lg ${cfg.bg} border ${cfg.border}`}>
            <Icon className={`h-4 w-4 shrink-0 ${cfg.color}`} />
            <span className="text-sm font-medium flex-1">{issue.title}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.badge}`}>Passed</span>
        </div>
    );
    return (
        <div className={`rounded-lg border ${cfg.border} overflow-hidden`}>
            <button
                onClick={() => setOpen(o => !o)}
                className={`w-full flex items-center gap-3 px-4 py-3 ${cfg.bg} hover:brightness-95 transition-all text-left`}
            >
                <Icon className={`h-4 w-4 shrink-0 ${cfg.color}`} />
                <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold">{issue.title}</span>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{issue.description}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${cfg.badge}`}>{cfg.label}</span>
                {open ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 py-3 border-t border-border/50 space-y-2">
                            <div>
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Issue</span>
                                <p className="text-sm mt-1">{issue.description}</p>
                            </div>
                            {issue.recommendation && (
                                <div>
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">How to Fix</span>
                                    <p className="text-sm mt-1 text-emerald-600 dark:text-emerald-400">{issue.recommendation}</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─────────────────────────── Category Card ──────────────────────────────────

function CategoryCard({ cat, defaultOpen = false }: { cat: CategoryResult; defaultOpen?: boolean }) {
    const [open, setOpen] = useState(defaultOpen);
    const Icon = categoryIcon(cat.name);
    const catScore = categoryScore(cat);
    const colors = scoreColor(catScore);
    const hasIssues = cat.errors + cat.warnings + cat.notices > 0;

    const sortedIssues = [...cat.issues].sort((a, b) => {
        const order = { error: 0, warning: 1, notice: 2, pass: 3 };
        return order[a.severity] - order[b.severity];
    });

    return (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors text-left"
            >
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${colors.bg}`}>
                    <Icon className={`h-5 w-5 ${colors.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold">{cat.name}</span>
                        {hasIssues && (
                            <div className="flex gap-1">
                                {cat.errors > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-600 font-bold">{cat.errors} err</span>}
                                {cat.warnings > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-500/15 text-orange-600 font-bold">{cat.warnings} warn</span>}
                                {cat.notices > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-600 font-bold">{cat.notices} notice</span>}
                            </div>
                        )}
                        {!hasIssues && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-600 font-bold">All Passed</span>}
                    </div>
                    <div className="mt-1.5 h-1.5 bg-muted rounded-full overflow-hidden w-48">
                        <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${catScore}%`, background: colors.stroke }}
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-lg font-black ${colors.text}`}>{catScore}</span>
                    {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 space-y-2 border-t border-border/50 pt-3">
                            {sortedIssues.map(issue => <IssueRow key={issue.id} issue={issue} />)}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─────────────────────────── Loading steps ──────────────────────────────────

const STEPS = [
    { label: "Fetching page HTML...", threshold: 20 },
    { label: "Crawling robots.txt & sitemap...", threshold: 40 },
    { label: "Auditing on-page SEO...", threshold: 55 },
    { label: "Checking technical factors...", threshold: 70 },
    { label: "Analyzing structured data & social...", threshold: 82 },
    { label: "Generating AI Quick Wins...", threshold: 95 },
];

// ─────────────────────────── Export helpers ──────────────────────────────────

function exportCSV(data: SiteAnalysisResponse) {
    const rows = [["Category", "Check", "Severity", "Description", "Recommendation"]];
    for (const cat of data.categories) {
        for (const issue of cat.issues) {
            rows.push([cat.name, issue.title, issue.severity, issue.description, issue.recommendation]);
        }
    }
    const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `site-audit-${new URL(data.url).hostname}.csv`;
    link.click();
}

// ─────────────────────────── Main Component ─────────────────────────────────

export function SiteAnalysis() {
    const { isRtl } = useLanguage();
    const [url, setUrl] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [stepIdx, setStepIdx] = useState(0);
    const [result, setResult] = useState<SiteAnalysisResponse | null>(null);
    const [error, setError] = useState("");
    const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const startProgress = () => {
        setProgress(5);
        setStepIdx(0);
        let p = 5;
        let s = 0;
        progressRef.current = setInterval(() => {
            p = Math.min(p + Math.random() * 4 + 1, 93);
            s = STEPS.findIndex(step => p < step.threshold);
            if (s === -1) s = STEPS.length - 1;
            setProgress(Math.round(p));
            setStepIdx(s);
        }, 600);
    };

    const stopProgress = () => {
        if (progressRef.current) clearInterval(progressRef.current);
        setProgress(100);
    };

    const handleAnalyze = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!url.trim()) return;
        setError("");
        setResult(null);
        setIsAnalyzing(true);
        startProgress();

        try {
            const res = await fetch("/api/seo/site-analysis", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: url.trim().startsWith("http") ? url.trim() : "https://" + url.trim() }),
            });
            stopProgress();
            if (!res.ok) {
                const err = await res.json();
                setError(err.error || "Analysis failed");
                setIsAnalyzing(false);
                return;
            }
            const data: SiteAnalysisResponse = await res.json();
            setTimeout(() => { setIsAnalyzing(false); setResult(data); }, 400);
        } catch {
            stopProgress();
            setError("Failed to connect. Please try again.");
            setIsAnalyzing(false);
        }
    };

    const reset = () => { setResult(null); setUrl(""); setError(""); setProgress(0); };

    // ── Loading State ───────────────────────────────────────────────────────
    if (isAnalyzing) return (
        <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-border bg-card p-12 flex flex-col items-center justify-center min-h-[500px] gap-8"
        >
            <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                <div className="relative h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Globe className="h-10 w-10 text-primary animate-pulse" />
                </div>
            </div>

            <div className="w-full max-w-md text-center space-y-1">
                <h3 className="text-xl font-bold">{isRtl ? "جاري تحليل الموقع..." : "Analyzing Website..."}</h3>
                <p className="text-sm text-muted-foreground">{url}</p>
            </div>

            <div className="w-full max-w-md space-y-3">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{STEPS[stepIdx]?.label}</span>
                    <span className="font-semibold text-primary">{progress}%</span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
                        initial={{ width: "0%" }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
                <div className="grid grid-cols-1 gap-1.5 mt-2">
                    {STEPS.map((step, i) => (
                        <div key={i} className={`flex items-center gap-2 text-xs transition-all ${i < stepIdx ? "text-muted-foreground" : i === stepIdx ? "text-foreground font-medium" : "text-muted-foreground/40"}`}>
                            {i < stepIdx ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                            ) : i === stepIdx ? (
                                <Loader2 className="h-3.5 w-3.5 text-primary shrink-0 animate-spin" />
                            ) : (
                                <div className="h-3.5 w-3.5 rounded-full border border-current/30 shrink-0" />
                            )}
                            {step.label}
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );

    // ── Input State ─────────────────────────────────────────────────────────
    if (!result) return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-10 flex flex-col items-center justify-center min-h-[450px] gap-8"
        >
            <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-10 w-10 text-primary" />
            </div>

            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">{isRtl ? "تحليل SEO شامل للموقع" : "Comprehensive SEO Site Audit"}</h2>
                <p className="text-sm text-muted-foreground max-w-md">
                    {isRtl
                        ? "أكثر من 50 فحص SEO يشمل: الزحف، الصفحة، المحتوى، البيانات البنيوية، الأمان والمزيد"
                        : "50+ SEO checks covering crawlability, on-page, content, structured data, social, security & more"}
                </p>
            </div>

            <form onSubmit={handleAnalyze} className="w-full max-w-lg space-y-3">
                <div className="relative">
                    <Globe className={`absolute top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground ${isRtl ? "right-4" : "left-4"}`} />
                    <Input
                        className={`h-14 text-base rounded-xl shadow-sm ${isRtl ? "pr-12 pl-4" : "pl-12 pr-4"}`}
                        placeholder="https://example.com"
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                        required
                    />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" size="lg" className="w-full h-14 rounded-xl text-base font-semibold">
                    <Search className={`h-5 w-5 ${isRtl ? "ml-2" : "mr-2"}`} />
                    {isRtl ? "ابدأ التحليل الشامل" : "Start Full SEO Audit"}
                </Button>
            </form>

            <div className="flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
                {["50+ Checks", "Real-time Scoring", "AI Quick Wins", "Security Headers", "Arabic SEO"].map(t => (
                    <span key={t} className="px-3 py-1.5 rounded-full bg-muted/60 font-medium">{t}</span>
                ))}
            </div>
        </motion.div>
    );

    // ── Results State ────────────────────────────────────────────────────────
    const { score, grade, summary, categories, quickWins, rawMetrics } = result;
    const colors = scoreColor(score);
    const gColors = gradeColor(grade);

    const sortedCategories = [...categories].sort((a, b) => {
        const aScore = categoryScore(a), bScore = categoryScore(b);
        return aScore - bScore;
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* ── Top Hero ─────────────────────────────────────────────────── */}
            <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    {/* Score gauge */}
                    <div className="flex items-center gap-6 shrink-0">
                        <ScoreGauge score={score} grade={grade} />
                        <div>
                            <div className={`text-6xl font-black border-2 rounded-2xl w-20 h-20 flex items-center justify-center ${gColors}`}>
                                {grade}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 text-center">
                                {grade === "A" ? "Excellent" : grade === "B" ? "Good" : grade === "C" ? "Average" : grade === "D" ? "Poor" : "Critical"}
                            </p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex-1">
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div>
                                <h3 className="font-bold text-lg truncate max-w-xs">{new URL(result.url).hostname}</h3>
                                <p className="text-xs text-muted-foreground">Analyzed {new Date(result.analyzedAt).toLocaleString()}</p>
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <Button variant="outline" size="sm" onClick={() => exportCSV(result)} className="gap-1.5 h-8">
                                    <Download className="h-3.5 w-3.5" />
                                    CSV
                                </Button>
                                <Button variant="outline" size="sm" onClick={reset} className="gap-1.5 h-8">
                                    <RefreshCw className="h-3.5 w-3.5" />
                                    {isRtl ? "جديد" : "New"}
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-3">
                            <div className="rounded-xl bg-red-500/8 border border-red-500/20 p-3 text-center">
                                <div className="text-2xl font-black text-red-500">{summary.errors}</div>
                                <div className="text-xs text-muted-foreground font-medium mt-0.5">Errors</div>
                            </div>
                            <div className="rounded-xl bg-orange-500/8 border border-orange-500/20 p-3 text-center">
                                <div className="text-2xl font-black text-orange-500">{summary.warnings}</div>
                                <div className="text-xs text-muted-foreground font-medium mt-0.5">Warnings</div>
                            </div>
                            <div className="rounded-xl bg-blue-500/8 border border-blue-500/20 p-3 text-center">
                                <div className="text-2xl font-black text-blue-500">{summary.notices}</div>
                                <div className="text-xs text-muted-foreground font-medium mt-0.5">Notices</div>
                            </div>
                            <div className="rounded-xl bg-green-500/8 border border-green-500/20 p-3 text-center">
                                <div className="text-2xl font-black text-green-500">{summary.passed}</div>
                                <div className="text-xs text-muted-foreground font-medium mt-0.5">Passed</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Score bar breakdown by category */}
                <div className="mt-5 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                    {categories.map(cat => {
                        const cs = categoryScore(cat);
                        const cc = scoreColor(cs);
                        const CatIcon = categoryIcon(cat.name);
                        return (
                            <div key={cat.name} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/30">
                                <CatIcon className={`h-4 w-4 ${cc.text}`} />
                                <span className={`text-lg font-black ${cc.text}`}>{cs}</span>
                                <span className="text-[9px] text-muted-foreground text-center leading-tight">{cat.name}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── AI Quick Wins ─────────────────────────────────────────────── */}
            {quickWins.length > 0 && (
                <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/5 to-purple-500/5 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-8 w-8 rounded-lg bg-violet-500/15 flex items-center justify-center">
                            <Zap className="h-4 w-4 text-violet-500" />
                        </div>
                        <div>
                            <h3 className="font-bold">{isRtl ? "أسرع الإصلاحات أثراً" : "AI Quick Wins"}</h3>
                            <p className="text-xs text-muted-foreground">{isRtl ? "أهم 5 إجراءات لتحسين SEO فوراً" : "Top 5 highest-impact fixes to boost your SEO score"}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {quickWins.slice(0, 6).map((win, idx) => {
                            const impactColor = win.impact === "high" ? "text-red-500 bg-red-500/10" : win.impact === "medium" ? "text-orange-500 bg-orange-500/10" : "text-blue-500 bg-blue-500/10";
                            return (
                                <div key={idx} className="rounded-xl bg-card border border-border p-4 space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black text-violet-500 bg-violet-500/10 rounded-full h-5 w-5 flex items-center justify-center">{idx + 1}</span>
                                            <span className="font-semibold text-sm">{win.title}</span>
                                        </div>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${impactColor}`}>
                                            {win.impact?.toUpperCase()}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">{win.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Category Accordion ────────────────────────────────────────── */}
            <div className="space-y-3">
                <h3 className="font-bold text-lg">{isRtl ? "تفاصيل التدقيق" : "Audit Details"}</h3>
                {sortedCategories.map((cat, idx) => (
                    <CategoryCard key={cat.name} cat={cat} defaultOpen={idx === 0 && (cat.errors > 0 || cat.warnings > 0)} />
                ))}
            </div>

            {/* ── Raw Metrics ───────────────────────────────────────────────── */}
            <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    {isRtl ? "البيانات الخام" : "Raw Metrics"}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {[
                        { label: "Word Count", value: rawMetrics.wordCount?.toLocaleString() },
                        { label: "HTML Size", value: `${rawMetrics.htmlSizeKb}KB` },
                        { label: "Internal Links", value: rawMetrics.links?.internal },
                        { label: "External Links", value: rawMetrics.links?.external },
                        { label: "Total Images", value: rawMetrics.images?.total },
                        { label: "Missing Alt", value: rawMetrics.images?.missingAlt },
                        { label: "Schema Types", value: rawMetrics.schemaTypes?.length || 0 },
                        { label: "Hreflang Tags", value: rawMetrics.hreflangTags?.length || 0 },
                        { label: "Blocking Scripts", value: rawMetrics.performance?.blockingScripts },
                        { label: "SSL", value: rawMetrics.ssl ? "Yes ✓" : "No ✗" },
                    ].map(m => (
                        <div key={m.label} className="rounded-xl bg-muted/40 p-3">
                            <div className="text-lg font-bold">{m.value ?? "—"}</div>
                            <div className="text-xs text-muted-foreground">{m.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-center">
                <Button variant="ghost" onClick={reset} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    {isRtl ? "تحليل موقع جديد" : "Analyze Another Website"}
                </Button>
            </div>
        </motion.div>
    );
}
