"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Globe, Search, Loader2, ChevronDown, ChevronUp, Download,
    AlertCircle, AlertTriangle, Info, CheckCircle2, Zap,
    Shield, Code2, Link2, Image, FileText, BarChart3,
    Share2, Database, MapPin, RefreshCw, Copy, Check,
    TrendingUp, TrendingDown, Minus, Eye, Activity,
    Lock, Layers, Server, Wifi, FileCode, ListChecks,
    Filter, Users, Gauge, Sparkles, Target, LayoutDashboard
} from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
    SiteAnalysisResponse, SiteIssue, CategoryResult,
    QuickWin, SerpPreview, PerformanceSignals,
    SiteCompetitor, TargetKeyword,
    PageSpeedMetrics, KeywordDensityItem, StrategicSummary
} from "@/app/api/seo/site-analysis/route";

// ─────────────────────────── helpers ────────────────────────────────────────

function scoreColor(score: number) {
    if (score >= 80) return { stroke: "#22c55e", text: "text-green-500", bg: "bg-green-500/10" };
    if (score >= 60) return { stroke: "#eab308", text: "text-yellow-500", bg: "bg-yellow-500/10" };
    if (score >= 40) return { stroke: "#f97316", text: "text-orange-500", bg: "bg-orange-500/10" };
    return { stroke: "#ef4444", text: "text-red-500", bg: "bg-red-500/10" };
}

function gradeColor(grade: string) {
    const map: Record<string, string> = {
        A: "text-green-500 border-green-500 bg-green-500/10",
        B: "text-blue-500 border-blue-500 bg-blue-500/10",
        C: "text-yellow-500 border-yellow-500 bg-yellow-500/10",
        D: "text-orange-500 border-orange-500 bg-orange-500/10",
        F: "text-red-500 border-red-500 bg-red-500/10"
    };
    return map[grade] || "text-gray-500 border-gray-500 bg-gray-500/10";
}

function gradeLabel(grade: string) {
    const map: Record<string, string> = { A: "Excellent", B: "Good", C: "Average", D: "Poor", F: "Critical" };
    return map[grade] || "Unknown";
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
        "Crawlability":     Globe,
        "On-Page":          FileText,
        "Content":          BarChart3,
        "Technical":        Code2,
        "Links":            Link2,
        "Performance":      Activity,
        "Structured Data":  Database,
        "Social":           Share2,
        "Security":         Shield,
        "Internationalization": MapPin,
    };
    return map[name] || FileText;
}

function categoryScore(cat: CategoryResult) {
    const total = cat.errors + cat.warnings + cat.notices + cat.passed;
    if (total === 0) return 100;
    return Math.max(0, Math.round(100 - cat.errors * 5 - cat.warnings * 2 - cat.notices * 0.5));
}

// ─────────────────────────── Copy Button ────────────────────────────────────

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button
            onClick={copy}
            className="shrink-0 h-7 w-7 rounded-md flex items-center justify-center bg-muted/80 hover:bg-muted transition-colors"
            title="Copy code"
        >
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
        </button>
    );
}

// ─────────────────────────── Gauge SVG ──────────────────────────────────────

function ScoreGauge({ score }: { score: number }) {
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

// ─────────────────────────── Issue Row ──────────────────────────────────────

function IssueRow({ issue }: { issue: SiteIssue }) {
    const [open, setOpen] = useState(false);
    const cfg = severityConfig(issue.severity);
    const Icon = cfg.icon;

    if (issue.severity === "pass") return (
        <div className={`flex items-center gap-3 px-4 py-2.5 rounded-lg ${cfg.bg} border ${cfg.border}`}>
            <Icon className={`h-4 w-4 shrink-0 ${cfg.color}`} />
            <span className="text-sm font-medium flex-1">{issue.title}</span>
            {issue.affectedCount !== undefined && issue.affectedCount > 0 && (
                <span className="text-xs text-muted-foreground">{issue.affectedCount} affected</span>
            )}
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
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{issue.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {issue.affectedCount !== undefined && issue.affectedCount > 0 && (
                        <span className="text-xs text-muted-foreground hidden sm:inline">{issue.affectedCount}×</span>
                    )}
                    {issue.codeSnippet && <Code2 className="h-3.5 w-3.5 text-muted-foreground/60" />}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${cfg.badge}`}>{cfg.label}</span>
                    {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
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
                        <div className="px-4 py-3 border-t border-border/50 space-y-3">
                            <div>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Issue</span>
                                <p className="text-sm mt-1">{issue.description}</p>
                            </div>
                            {issue.recommendation && (
                                <div>
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">How to Fix</span>
                                    <p className="text-sm mt-1 text-emerald-600 dark:text-emerald-400">{issue.recommendation}</p>
                                </div>
                            )}
                            {issue.codeSnippet && (
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Code Fix</span>
                                        <CopyButton text={issue.codeSnippet} />
                                    </div>
                                    <pre className="text-xs bg-muted/60 rounded-lg p-3 overflow-x-auto border border-border/50 font-mono leading-relaxed whitespace-pre-wrap break-all">
                                        {issue.codeSnippet}
                                    </pre>
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

type FilterType = "all" | "error" | "warning" | "notice" | "pass";

function CategoryCard({ cat, filterSeverity, defaultOpen = false }: { cat: CategoryResult; filterSeverity: FilterType; defaultOpen?: boolean }) {
    const [open, setOpen] = useState(defaultOpen);
    const Icon = categoryIcon(cat.name);
    const catScore = categoryScore(cat);
    const colors = scoreColor(catScore);
    const hasIssues = cat.errors + cat.warnings + cat.notices > 0;

    const sortedIssues = [...cat.issues]
        .filter(i => filterSeverity === "all" || i.severity === filterSeverity)
        .sort((a, b) => {
            const order = { error: 0, warning: 1, notice: 2, pass: 3 };
            return order[a.severity] - order[b.severity];
        });

    if (filterSeverity !== "all" && sortedIssues.length === 0) return null;

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
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{cat.name}</span>
                        {hasIssues ? (
                            <div className="flex gap-1">
                                {cat.errors > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-600 font-bold">{cat.errors} err</span>}
                                {cat.warnings > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-500/15 text-orange-600 font-bold">{cat.warnings} warn</span>}
                                {cat.notices > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-600 font-bold">{cat.notices} notice</span>}
                            </div>
                        ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-600 font-bold">All Passed</span>
                        )}
                    </div>
                    <div className="mt-1.5 h-1.5 bg-muted rounded-full overflow-hidden w-48 max-w-full">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${catScore}%`, background: colors.stroke }} />
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
                            {sortedIssues.length > 0
                                ? sortedIssues.map(issue => <IssueRow key={issue.id} issue={issue} />)
                                : <p className="text-sm text-muted-foreground text-center py-2">No issues match current filter</p>
                            }
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─────────────────────────── SERP Preview ───────────────────────────────────

function SerpPreviewCard({ serp, url }: { serp: SerpPreview; url: string }) {
    const hostname = new URL(url).hostname;
    return (
        <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Eye className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                    <h3 className="font-bold text-sm">Google SERP Preview</h3>
                    <p className="text-xs text-muted-foreground">How your page appears in search results</p>
                </div>
            </div>
            <div className="bg-white dark:bg-zinc-950 rounded-xl border border-border/60 p-5 font-sans">
                {/* Site icon + domain row */}
                <div className="flex items-center gap-2 mb-1">
                    <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground overflow-hidden">
                        <Globe className="h-3 w-3" />
                    </div>
                    <div className="min-w-0">
                        <div className="text-xs text-gray-700 dark:text-gray-300 font-medium truncate">{hostname}</div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-500 truncate">{serp.displayUrl}</div>
                    </div>
                    <span className="ml-auto text-[10px] border border-gray-300 dark:border-gray-600 rounded px-1.5 py-0.5 text-gray-500">▾</span>
                </div>
                {/* Title */}
                <div className="text-[18px] leading-snug font-normal text-blue-700 dark:text-blue-400 hover:underline cursor-pointer mb-1 truncate">
                    {serp.title || <span className="text-red-500 italic">(No title tag)</span>}
                </div>
                {/* Description */}
                <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">
                    {serp.description || <span className="text-orange-500 italic">(No meta description — Google will auto-generate this from page content)</span>}
                </div>
            </div>
            {/* Length indicators */}
            <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                <div>
                    Title: <span className={serp.title.length > 60 ? "text-red-500 font-semibold" : serp.title.length < 30 ? "text-orange-500 font-semibold" : "text-green-500 font-semibold"}>
                        {serp.title.length}/60 chars
                    </span>
                </div>
                <div>
                    Desc: <span className={serp.description.length > 160 ? "text-red-500 font-semibold" : serp.description.length < 70 ? "text-orange-500 font-semibold" : "text-green-500 font-semibold"}>
                        {serp.description.length}/160 chars
                    </span>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────── Performance Signals ─────────────────────────────

function PerformancePanel({ perf }: { perf: PerformanceSignals }) {
    const signals = [
        { label: "Compression", value: perf.compression, detail: perf.compressionType !== "none" ? perf.compressionType : "disabled", good: perf.compression },
        { label: "Caching", value: perf.caching, detail: perf.caching ? "enabled" : "no Cache-Control", good: perf.caching },
        { label: "ETag", value: perf.etag, detail: perf.etag ? "enabled" : "missing", good: perf.etag },
        { label: "Server Hidden", value: perf.serverHeader === "hidden", detail: perf.serverHeader !== "hidden" ? perf.serverHeader.substring(0, 20) : "hidden ✓", good: perf.serverHeader === "hidden" },
    ];

    return (
        <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <Server className="h-4 w-4 text-violet-500" />
                </div>
                <div>
                    <h3 className="font-bold text-sm">Server & Performance Signals</h3>
                    <p className="text-xs text-muted-foreground">HTTP headers and resource analysis</p>
                </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {signals.map(s => (
                    <div key={s.label} className={`rounded-xl p-3 border ${s.good ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"}`}>
                        <div className={`text-xs font-bold mb-1 ${s.good ? "text-green-600" : "text-red-500"}`}>
                            {s.good ? "✓" : "✗"} {s.label}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{s.detail}</div>
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {[
                    { label: "HTML Size", value: `${perf.htmlSizeKb}KB`, warn: perf.htmlSizeKb > 200 },
                    { label: "Scripts", value: perf.totalScripts, warn: perf.totalScripts > 15 },
                    { label: "Blocking Scripts", value: perf.blockingScripts, warn: perf.blockingScripts > 0 },
                    { label: "Stylesheets", value: perf.totalStylesheets, warn: perf.totalStylesheets > 5 },
                    { label: "Inline Scripts", value: perf.inlineScripts, warn: perf.inlineScripts > 5 },
                    { label: "Inline Styles", value: perf.inlineStyles, warn: perf.inlineStyles > 10 },
                ].map(m => (
                    <div key={m.label} className="rounded-xl bg-muted/40 p-3 text-center">
                        <div className={`text-lg font-bold ${m.warn ? "text-orange-500" : "text-foreground"}`}>{m.value}</div>
                        <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{m.label}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─────────────────────────── Priority Matrix ─────────────────────────────────

function PriorityMatrix({ wins }: { wins: QuickWin[] }) {
    const impactOrder = { high: 0, medium: 1, low: 2 };
    const effortOrder = { easy: 0, medium: 1, hard: 2 };

    const impactColor = (v: string) => ({ high: "text-red-500 bg-red-500/10", medium: "text-orange-500 bg-orange-500/10", low: "text-blue-500 bg-blue-500/10" }[v] || "");
    const effortColor = (v: string) => ({ easy: "text-green-500 bg-green-500/10", medium: "text-yellow-500 bg-yellow-500/10", hard: "text-red-500 bg-red-500/10" }[v] || "");

    return (
        <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/5 to-purple-500/5 p-6">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-violet-500/15 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-violet-500" />
                </div>
                <div>
                    <h3 className="font-bold">AI Quick Wins</h3>
                    <p className="text-xs text-muted-foreground">Ranked by impact × effort — start from the top</p>
                </div>
            </div>
            <div className="space-y-3">
                {[...wins].sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact] || effortOrder[a.effort] - effortOrder[b.effort]).map((win, idx) => (
                    <div key={idx} className="rounded-xl bg-card border border-border p-4">
                        <div className="flex items-start gap-3">
                            <span className="text-xs font-black text-violet-500 bg-violet-500/10 rounded-full h-6 w-6 flex items-center justify-center shrink-0 mt-0.5">
                                {idx + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <span className="font-semibold text-sm">{win.title}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${impactColor(win.impact)}`}>
                                        {win.impact?.toUpperCase()} IMPACT
                                    </span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${effortColor(win.effort || "medium")}`}>
                                        {win.effort?.toUpperCase()} EFFORT
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">{win.description}</p>
                                {win.codeSnippet && win.codeSnippet !== "null" && (
                                    <div className="mt-2">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Quick Fix</span>
                                            <CopyButton text={win.codeSnippet} />
                                        </div>
                                        <pre className="text-[10px] bg-muted/60 rounded-lg p-2.5 overflow-x-auto border border-border/50 font-mono whitespace-pre-wrap break-all">
                                            {win.codeSnippet}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─────────────────────────── Market & Keyword Intelligence ───────────────────

function MarketIntelligencePanel({ competitors, keywords }: { competitors: SiteCompetitor[], keywords: TargetKeyword[] }) {
    const isRtl = document.documentElement.dir === "rtl";
    const intentColor = (intent: string) => {
        switch(intent.toLowerCase()) {
            case "informational": return "bg-blue-500/15 text-blue-600 dark:text-blue-400";
            case "transactional": return "bg-green-500/15 text-green-600 dark:text-green-400";
            case "commercial": return "bg-amber-500/15 text-amber-600 dark:text-amber-400";
            default: return "bg-purple-500/15 text-purple-600 dark:text-purple-400";
        }
    };
    const diffColor = (diff: string) => {
        switch(diff.toLowerCase()) {
            case "low": return "text-green-500";
            case "medium": return "text-amber-500";
            case "high": return "text-red-500";
            default: return "text-muted-foreground";
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-2 mb-4">
                    <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                        <Users className="h-4 w-4 text-orange-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">{isRtl ? "أبرز المنافسين" : "Top Organic Competitors"}</h3>
                        <p className="text-xs text-muted-foreground">{isRtl ? "المنافسين في نفس المجال" : "Direct niche competitors"}</p>
                    </div>
                </div>
                <div className="space-y-3">
                    {competitors?.length > 0 ? competitors.map((c, i) => (
                        <div key={i} className="flex flex-col gap-1 p-3 rounded-xl bg-muted/40 border border-border/50">
                            <div className="font-semibold text-sm text-primary underline underline-offset-2 decoration-primary/30 break-all">{c.domain}</div>
                            <div className="text-xs text-muted-foreground leading-relaxed">{c.overlapReason}</div>
                        </div>
                    )) : (
                        <p className="text-xs text-muted-foreground">No competitors found.</p>
                    )}
                </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-2 mb-4">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">{isRtl ? "الكلمات المفتاحية المستهدفة" : "Target SEO Keywords"}</h3>
                        <p className="text-xs text-muted-foreground">{isRtl ? "أهم فرص الكلمات لموقعك" : "High-value keyword opportunities"}</p>
                    </div>
                </div>
                <div className="space-y-2">
                    {keywords?.length > 0 ? keywords.map((kw, i) => (
                        <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/40 border border-border/50">
                            <div className="min-w-0 flex-1">
                                <div className="font-semibold text-sm truncate" title={kw.keyword}>{kw.keyword}</div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${intentColor(kw.intent)}`}>{kw.intent}</span>
                                    <span className="text-xs font-mono text-muted-foreground">{kw.volume || "N/A"} vol</span>
                                </div>
                            </div>
                            <div className="text-center shrink-0 px-2">
                                <div className={`text-xs font-bold capitalize ${diffColor(kw.difficulty)}`}>{kw.difficulty}</div>
                                <div className="text-[9px] text-muted-foreground uppercase opacity-70">Diff</div>
                            </div>
                        </div>
                    )) : (
                        <p className="text-xs text-muted-foreground">No keywords found.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─────────────────────── Strategic Summary Panel ────────────────────────────

function StrategicSummaryPanel({ summary }: { summary: StrategicSummary }) {
    return (
        <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/5 via-card to-card p-6 space-y-5">
            <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-violet-500/15 flex items-center justify-center shrink-0">
                    <Sparkles className="h-5 w-5 text-violet-500" />
                </div>
                <div>
                    <h3 className="font-bold text-sm">AI Strategic Analysis</h3>
                    <p className="text-xs text-muted-foreground">Full audit review by AI SEO consultant</p>
                </div>
            </div>

            <div className="space-y-1">
                <h2 className="text-lg font-black leading-tight">{summary.headline}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{summary.executiveSummary}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-xl bg-red-500/8 border border-red-500/20 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-red-500 shrink-0" />
                        <span className="text-xs font-bold text-red-500 uppercase tracking-wide">Top Priority</span>
                    </div>
                    <p className="text-xs leading-relaxed">{summary.topPriority}</p>
                </div>
                <div className="rounded-xl bg-blue-500/8 border border-blue-500/20 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-blue-500 shrink-0" />
                        <span className="text-xs font-bold text-blue-500 uppercase tracking-wide">Content Opportunities</span>
                    </div>
                    <p className="text-xs leading-relaxed">{summary.contentOpportunities}</p>
                </div>
                <div className="rounded-xl bg-amber-500/8 border border-amber-500/20 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Code2 className="h-4 w-4 text-amber-500 shrink-0" />
                        <span className="text-xs font-bold text-amber-500 uppercase tracking-wide">Technical Health</span>
                    </div>
                    <p className="text-xs leading-relaxed">{summary.technicalHealth}</p>
                </div>
            </div>

            {summary.actionPlan?.length > 0 && (
                <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Action Plan</p>
                    <ol className="space-y-1.5">
                        {summary.actionPlan.map((step, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-sm">
                                <span className="text-[10px] font-black text-violet-500 bg-violet-500/10 rounded-full h-5 w-5 flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                                <span className="text-muted-foreground leading-relaxed">{step}</span>
                            </li>
                        ))}
                    </ol>
                </div>
            )}
        </div>
    );
}

// ─────────────────────────── Core Web Vitals Panel ──────────────────────────

function cwvStatus(metric: string, value: number): { color: string; status: string } {
    const thresholds: Record<string, [number, number]> = {
        lcp:  [2500, 4000],
        fcp:  [1800, 3000],
        tbt:  [200,  600],
        si:   [3400, 5800],
        tti:  [3800, 7300],
    };
    const [good, poor] = thresholds[metric] || [0, 0];
    if (value <= good) return { color: "text-green-500", status: "Good" };
    if (value <= poor) return { color: "text-amber-500", status: "Needs Work" };
    return { color: "text-red-500", status: "Poor" };
}

function clsStatus(cls: number): { color: string; status: string } {
    if (cls <= 0.1) return { color: "text-green-500", status: "Good" };
    if (cls <= 0.25) return { color: "text-amber-500", status: "Needs Work" };
    return { color: "text-red-500", status: "Poor" };
}

function CoreWebVitalsPanel({ pageSpeed }: { pageSpeed: PageSpeedMetrics }) {
    const [tab, setTab] = useState<"mobile" | "desktop">("mobile");
    const data = tab === "mobile" ? pageSpeed.mobile : pageSpeed.desktop;
    const sc = data ? scoreColor(data.score) : null;

    return (
        <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                        <Gauge className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">Core Web Vitals</h3>
                        <p className="text-xs text-muted-foreground">Real data from Google PageSpeed Insights</p>
                    </div>
                </div>
                <div className="flex gap-1 bg-muted rounded-lg p-1">
                    {(["mobile", "desktop"] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all capitalize ${tab === t ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {!data ? (
                <p className="text-sm text-muted-foreground text-center py-4">PageSpeed data unavailable for this strategy</p>
            ) : (
                <>
                    <div className="flex items-center gap-4 mb-5">
                        <div className="relative h-20 w-20 shrink-0">
                            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                                <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/30" />
                                <circle cx="18" cy="18" r="15.9" fill="none" stroke={sc!.stroke} strokeWidth="3"
                                    strokeDasharray={`${data.score} ${100 - data.score}`} strokeLinecap="round" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className={`text-lg font-black ${sc!.text}`}>{data.score}</span>
                                <span className="text-[8px] text-muted-foreground font-medium">/ 100</span>
                            </div>
                        </div>
                        <div>
                            <div className={`text-3xl font-black border-2 rounded-xl px-3 py-1 inline-block ${gradeColor(data.grade)}`}>{data.grade}</div>
                            <p className="text-xs text-muted-foreground mt-1">Performance Score · {tab}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                            { key: "lcp",  name: "LCP",  value: `${(data.lcp / 1000).toFixed(2)}s`,  hint: "Largest Contentful Paint",  ...cwvStatus("lcp", data.lcp) },
                            { key: "fcp",  name: "FCP",  value: `${(data.fcp / 1000).toFixed(2)}s`,  hint: "First Contentful Paint",     ...cwvStatus("fcp", data.fcp) },
                            { key: "cls",  name: "CLS",  value: data.cls.toFixed(3),                  hint: "Cumulative Layout Shift",    ...clsStatus(data.cls) },
                            { key: "tbt",  name: "TBT",  value: `${data.tbt}ms`,                      hint: "Total Blocking Time",        ...cwvStatus("tbt", data.tbt) },
                            { key: "si",   name: "SI",   value: `${(data.si / 1000).toFixed(2)}s`,   hint: "Speed Index",                ...cwvStatus("si", data.si) },
                            { key: "tti",  name: "TTI",  value: `${(data.tti / 1000).toFixed(2)}s`,  hint: "Time to Interactive",        ...cwvStatus("tti", data.tti) },
                        ].map(m => (
                            <div key={m.key} className="rounded-xl bg-muted/40 p-3">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold">{m.name}</span>
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${m.color} bg-current/10`}>{m.status}</span>
                                </div>
                                <div className={`text-xl font-black ${m.color}`}>{m.value}</div>
                                <div className="text-[10px] text-muted-foreground mt-0.5">{m.hint}</div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

// ─────────────────────────── Keyword Density Panel ──────────────────────────

function KeywordDensityPanel({ keywords }: { keywords: KeywordDensityItem[] }) {
    const max = keywords[0]?.count || 1;
    return (
        <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-5">
                <div className="h-9 w-9 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0">
                    <LayoutDashboard className="h-5 w-5 text-cyan-500" />
                </div>
                <div>
                    <h3 className="font-bold text-sm">Keyword Density Analysis</h3>
                    <p className="text-xs text-muted-foreground">Top 20 words actually found in page content</p>
                </div>
            </div>
            <div className="space-y-2">
                {keywords.map((kw, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <span className="text-xs font-mono text-muted-foreground w-5 shrink-0">{i + 1}</span>
                        <span className="text-sm font-medium w-32 shrink-0 truncate">{kw.keyword}</span>
                        <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                            <div
                                className="h-full bg-cyan-500/70 rounded-full transition-all"
                                style={{ width: `${(kw.count / max) * 100}%` }}
                            />
                        </div>
                        <span className="text-xs text-muted-foreground w-8 text-right shrink-0">{kw.count}×</span>
                        <span className="text-xs font-semibold text-cyan-500 w-12 text-right shrink-0">{kw.density}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─────────────────────────── Loading steps ──────────────────────────────────

const STEPS = [
    { label: "Fetching page HTML & response headers...", threshold: 15 },
    { label: "Running Google PageSpeed Insights (real Core Web Vitals)...", threshold: 28 },
    { label: "Parsing robots.txt & sitemap XML...", threshold: 40 },
    { label: "Auditing On-Page & Content signals...", threshold: 52 },
    { label: "Checking Technical & Performance factors...", threshold: 63 },
    { label: "Analyzing Links, Security & Structured Data...", threshold: 73 },
    { label: "Generating AI Quick Wins & Market Intelligence...", threshold: 84 },
    { label: "Writing AI Strategic Analysis Report...", threshold: 96 },
];

// ─────────────────────────── Export helpers ──────────────────────────────────

function exportCSV(data: SiteAnalysisResponse) {
    const rows = [["Category", "Check", "Severity", "Description", "Recommendation", "Has Code Fix"]];
    for (const cat of data.categories) {
        for (const issue of cat.issues) {
            rows.push([cat.name, issue.title, issue.severity, issue.description, issue.recommendation, issue.codeSnippet ? "Yes" : "No"]);
        }
    }
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `site-audit-${new URL(data.url).hostname}-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
}

function exportPDF(data: SiteAnalysisResponse) {
    window.print();
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
    const [filterSeverity, setFilterSeverity] = useState<FilterType>("all");
    const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const startProgress = () => {
        setProgress(5);
        setStepIdx(0);
        let p = 5;
        let s = 0;
        progressRef.current = setInterval(() => {
            p = Math.min(p + Math.random() * 3 + 0.8, 93);
            s = STEPS.findIndex(step => p < step.threshold);
            if (s === -1) s = STEPS.length - 1;
            setProgress(Math.round(p));
            setStepIdx(s);
        }, 700);
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
        setFilterSeverity("all");
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

    const reset = () => { setResult(null); setUrl(""); setError(""); setProgress(0); setFilterSeverity("all"); };

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
                <h3 className="text-xl font-bold">{isRtl ? "جاري التحليل الشامل..." : "Running Full SEO Audit..."}</h3>
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
                <h2 className="text-2xl font-bold">{isRtl ? "تحليل SEO الأقوى على الإطلاق" : "The Most Comprehensive SEO Audit"}</h2>
                <p className="text-sm text-muted-foreground max-w-md">
                    {isRtl
                        ? "أكثر من 90 فحص: زحف كامل للروبوت وسايت ماب، صفحة، محتوى، روابط، أداء، بيانات بنيوية، سوشال، أمان"
                        : "90+ checks: full robots.txt & sitemap analysis, on-page, content, links, performance, structured data, social & security"}
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
                    {isRtl ? "ابدأ التحليل الشامل" : "Start Deep SEO Audit"}
                </Button>
            </form>

            <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
                {["90+ Checks", "Real Core Web Vitals", "AI Strategic Report", "Keyword Density", "Robots.txt Deep Parse", "Sitemap Analysis", "SERP Preview", "Code Snippets", "AI Quick Wins", "Security Audit", "Arabic SEO"].map(t => (
                    <span key={t} className="px-3 py-1.5 rounded-full bg-muted/60 font-medium">{t}</span>
                ))}
            </div>
        </motion.div>
    );

    // ── Results State ────────────────────────────────────────────────────────
    const { score, grade, summary, categories, quickWins, rawMetrics, serpPreview, performanceSignals, contentQuality } = result;
    const colors = scoreColor(score);
    const gColors = gradeColor(grade);

    const sortedCategories = [...categories].sort((a, b) => categoryScore(a) - categoryScore(b));

    // Filter bar counts
    const filterCounts = {
        all: summary.total,
        error: summary.errors,
        warning: summary.warnings,
        notice: summary.notices,
        pass: summary.passed,
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* ── Hero Score ────────────────────────────────────────────────── */}
            <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    {/* Score gauge */}
                    <div className="flex items-center gap-6 shrink-0">
                        <ScoreGauge score={score} />
                        <div className="text-center">
                            <div className={`text-5xl font-black border-2 rounded-2xl w-18 h-18 w-[72px] h-[72px] flex items-center justify-center ${gColors}`}>
                                {grade}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{gradeLabel(grade)}</p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex-1">
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div>
                                <h3 className="font-bold text-lg truncate max-w-xs">{new URL(result.url).hostname}</h3>
                                <p className="text-xs text-muted-foreground">
                                    {summary.total} checks · Analyzed {new Date(result.analyzedAt).toLocaleString()}
                                </p>
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <Button variant="outline" size="sm" onClick={() => exportCSV(result)} className="gap-1.5 h-8">
                                    <Download className="h-3.5 w-3.5" />CSV
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

                {/* Category mini-scores */}
                <div className="mt-5 grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
                    {categories.map(cat => {
                        const cs = categoryScore(cat);
                        const cc = scoreColor(cs);
                        const CatIcon = categoryIcon(cat.name);
                        return (
                            <div key={cat.name} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-default">
                                <CatIcon className={`h-4 w-4 ${cc.text}`} />
                                <span className={`text-lg font-black ${cc.text}`}>{cs}</span>
                                <span className="text-[9px] text-muted-foreground text-center leading-tight">{cat.name}</span>
                            </div>
                        );
                    })}
                </div>

                {/* Content quality inline */}
                {contentQuality && (
                    <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-3 md:grid-cols-6 gap-3">
                        {[
                            { label: "Word Count", value: contentQuality.wordCount.toLocaleString() },
                            { label: "Content Ratio", value: `${contentQuality.contentToCodeRatio}%` },
                            { label: "Readability", value: contentQuality.readabilityLabel },
                            { label: "Avg Sentence", value: `${contentQuality.avgWordsPerSentence} words` },
                            { label: "Paragraphs", value: contentQuality.paragraphCount },
                            { label: "Lists", value: contentQuality.listCount },
                        ].map(m => (
                            <div key={m.label} className="text-center">
                                <div className="text-sm font-bold">{m.value}</div>
                                <div className="text-[10px] text-muted-foreground">{m.label}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── SERP Preview ──────────────────────────────────────────────── */}
            {serpPreview && <SerpPreviewCard serp={serpPreview} url={result.url} />}

            {/* ── AI Strategic Summary ──────────────────────────────────────── */}
            {result.strategicSummary && <StrategicSummaryPanel summary={result.strategicSummary} />}

            {/* ── AI Quick Wins / Priority Matrix ────────────────────────────── */}
            {quickWins.length > 0 && <PriorityMatrix wins={quickWins} />}

            {/* ── Core Web Vitals (Real PageSpeed Insights) ─────────────────── */}
            {result.pageSpeed?.hasRealData && <CoreWebVitalsPanel pageSpeed={result.pageSpeed} />}

            {/* ── Performance Signals ────────────────────────────────────────── */}
            {performanceSignals && <PerformancePanel perf={performanceSignals} />}

            {/* ── Keyword Density ────────────────────────────────────────────── */}
            {result.keywordDensity?.length > 0 && <KeywordDensityPanel keywords={result.keywordDensity} />}

            {/* ── Market Intelligence ────────────────────────────────────────── */}
            {((result.competitors && result.competitors.length > 0) || (result.targetKeywords && result.targetKeywords.length > 0)) && (
                <MarketIntelligencePanel competitors={result.competitors} keywords={result.targetKeywords} />
            )}

            {/* ── Category Accordion ────────────────────────────────────────── */}
            <div className="space-y-3">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <h3 className="font-bold text-lg">{isRtl ? "تفاصيل التدقيق الكامل" : "Full Audit Details"}</h3>
                    <div className="flex items-center gap-1 flex-wrap">
                        <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                        {(["all", "error", "warning", "notice", "pass"] as FilterType[]).map(f => {
                            const colors: Record<FilterType, string> = {
                                all: "text-foreground border-border",
                                error: "text-red-500 border-red-500/40",
                                warning: "text-orange-500 border-orange-500/40",
                                notice: "text-blue-500 border-blue-500/40",
                                pass: "text-green-500 border-green-500/40",
                            };
                            return (
                                <button
                                    key={f}
                                    onClick={() => setFilterSeverity(f)}
                                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${filterSeverity === f ? `${colors[f]} bg-current/10` : "text-muted-foreground border-transparent hover:border-border"}`}
                                >
                                    {f.charAt(0).toUpperCase() + f.slice(1)}
                                    {filterCounts[f] > 0 && <span className="ml-1 opacity-70">({filterCounts[f]})</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {sortedCategories.map((cat, idx) => (
                    <CategoryCard
                        key={cat.name}
                        cat={cat}
                        filterSeverity={filterSeverity}
                        defaultOpen={idx === 0 && (cat.errors > 0 || cat.warnings > 0)}
                    />
                ))}
            </div>

            {/* ── Raw Metrics ───────────────────────────────────────────────── */}
            <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Database className="h-5 w-5 text-primary" />
                    {isRtl ? "البيانات التقنية الخام" : "Raw Technical Data"}
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
                        { label: "SSL", value: rawMetrics.ssl ? "Yes ✓" : "No ✗" },
                        { label: "Robots.txt", value: rawMetrics.robots?.exists ? `${rawMetrics.robots?.disallowCount} disallows` : "Missing" },
                        { label: "Sitemap URLs", value: rawMetrics.sitemap?.pageCount || (rawMetrics.sitemap?.exists ? "Index" : "Missing") },
                        { label: "Blocking Scripts", value: rawMetrics.performance?.blockingScripts },
                        { label: "Inline Scripts", value: rawMetrics.performance?.inlineScripts },
                        { label: "Response Time", value: `${rawMetrics.performance?.responseTimeMs || 0}ms` },
                        { label: "Paragraphs", value: contentQuality?.paragraphCount },
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
