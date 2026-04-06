"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Loader2, FileSearch, Play, CheckCircle2, XCircle, AlertCircle,
    Hash, AlignLeft, ListOrdered, Type, BookOpen, Tag, TrendingUp
} from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/* ─── Types ──────────────────────────────────────── */
interface CheckResult {
    wordCount: number;
    focusKeyword: {
        present: boolean;
        inTitle: boolean;
        inIntro: boolean;
        inSubheading: boolean;
        inConclusion: boolean;
        totalOccurrences: number;
        densityPercent: number;
    };
    lsiKeywords: {
        found: string[];
        missing: string[];
    };
    headingStructure: {
        hasH1: boolean;
        h2Count: number;
        h3Count: number;
        hasProperStructure: boolean;
    };
    wordCountCheck: {
        passed: boolean;
        meetsMinimum: boolean;
        meetsTarget: boolean;
    };
    overallScore: number;
    passed: boolean;
    summary: string;
}

/* ─── Score ring ─────────────────────────────────── */
function ScoreRing({ score, passed }: { score: number; passed: boolean }) {
    const radius = 36;
    const circ = 2 * Math.PI * radius;
    const offset = circ - (score / 100) * circ;
    const color = score >= 80 ? "#22c55e" : score >= 55 ? "#f59e0b" : "#ef4444";

    return (
        <div className="flex flex-col items-center gap-1">
            <svg width={96} height={96} viewBox="0 0 96 96">
                <circle cx={48} cy={48} r={radius} fill="none" stroke="currentColor" strokeWidth={7} className="text-muted/30" />
                <circle
                    cx={48} cy={48} r={radius} fill="none"
                    stroke={color} strokeWidth={7}
                    strokeDasharray={circ} strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform="rotate(-90 48 48)"
                    style={{ transition: "stroke-dashoffset 0.8s ease" }}
                />
                <text x={48} y={48} textAnchor="middle" dominantBaseline="central"
                    fontSize={18} fontWeight={700} fill={color}>
                    {score}
                </text>
            </svg>
            <Badge variant={passed ? "success" : "destructive"} className="text-[10px] px-2">
                {passed ? "✓ Passed" : "✗ Failed"}
            </Badge>
        </div>
    );
}

/* ─── Single check row ───────────────────────────── */
function CheckRow({
    label, labelAr, passed, detail, isRtl,
}: { label: string; labelAr: string; passed: boolean; detail?: string; isRtl: boolean }) {
    return (
        <div className={cn(
            "flex items-start gap-3 py-2.5 border-b border-border last:border-0",
            isRtl ? "flex-row-reverse text-right" : "",
        )}>
            {passed
                ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                : <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            }
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{isRtl ? labelAr : label}</p>
                {detail && <p className="text-xs text-muted-foreground mt-0.5">{detail}</p>}
            </div>
        </div>
    );
}

/* ─── Main Component ─────────────────────────────── */
export function ArticleSeoChecker() {
    const { isRtl } = useLanguage();
    const [content, setContent] = useState("");
    const [focusKeyword, setFocusKeyword] = useState("");
    const [lsiInput, setLsiInput] = useState("");
    const [isChecking, setIsChecking] = useState(false);
    const [result, setResult] = useState<CheckResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleCheck = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || !focusKeyword.trim()) return;

        setIsChecking(true);
        setResult(null);
        setError(null);

        const lsiKeywords = lsiInput
            .split(",")
            .map(k => k.trim())
            .filter(Boolean);

        try {
            const res = await fetch("/api/seo/article-checker", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: content.trim(), focusKeyword: focusKeyword.trim(), lsiKeywords }),
            });

            if (!res.ok) throw new Error("Check failed");
            const data = await res.json();
            setResult(data);
        } catch (err) {
            setError(isRtl ? "فشل التحليل، حاول مرة أخرى" : "Analysis failed, please try again.");
        } finally {
            setIsChecking(false);
        }
    };

    /* ── Distribution detail ── */
    const distributionDetail = (r: CheckResult) => {
        const places = [
            { key: "inTitle",      ar: "العنوان",   en: "Title/H1"    },
            { key: "inIntro",      ar: "المقدمة",   en: "Intro"       },
            { key: "inSubheading", ar: "العناوين الفرعية", en: "Subheadings" },
            { key: "inConclusion", ar: "الخاتمة",   en: "Conclusion"  },
        ] as const;
        const found = places.filter(p => r.focusKeyword[p.key]).map(p => isRtl ? p.ar : p.en);
        const missing = places.filter(p => !r.focusKeyword[p.key]).map(p => isRtl ? p.ar : p.en);
        const parts: string[] = [];
        if (found.length)   parts.push(`${isRtl ? "موجود في" : "Found in"}: ${found.join(", ")}`);
        if (missing.length) parts.push(`${isRtl ? "مفقود من" : "Missing from"}: ${missing.join(", ")}`);
        return parts.join(" · ") || undefined;
    };

    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <div className={cn("flex flex-col md:flex-row justify-between items-start md:items-center gap-4", isRtl ? "md:flex-row-reverse text-right" : "")}>
                <div>
                    <h1 className={cn(
                        "text-2xl font-bold tracking-tight bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent flex items-center gap-2",
                        isRtl ? "flex-row-reverse" : "",
                    )}>
                        <FileSearch className="h-6 w-6 text-cyan-500 shrink-0" />
                        {isRtl ? "مدقق SEO للمقالات" : "Article SEO Checker"}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {isRtl
                            ? "افحص مقالاتك قبل النشر — كيوورد، LSI، عناوين، وعدد كلمات"
                            : "Audit articles before publishing — keyword, LSI, headings, and word count"}
                    </p>
                </div>
            </div>

            {/* ── Form ── */}
            <form onSubmit={handleCheck} className="space-y-4">
                <div className={cn("grid md:grid-cols-2 gap-4", isRtl ? "text-right" : "")}>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium flex items-center gap-1.5">
                            <Hash className="h-3.5 w-3.5 text-cyan-500" />
                            {isRtl ? "الكيوورد الأساسي (Focus Keyword)" : "Focus Keyword"}
                        </label>
                        <Input
                            dir={isRtl ? "rtl" : "ltr"}
                            placeholder={isRtl ? "مثال: تسويق رقمي" : "e.g. digital marketing"}
                            value={focusKeyword}
                            onChange={e => setFocusKeyword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium flex items-center gap-1.5">
                            <Tag className="h-3.5 w-3.5 text-cyan-500" />
                            {isRtl ? "كيووردات LSI (مفصولة بفاصلة، اختياري)" : "LSI Keywords (comma-separated, optional)"}
                        </label>
                        <Input
                            dir={isRtl ? "rtl" : "ltr"}
                            placeholder={isRtl ? "مثال: سيو، محتوى، جوجل" : "e.g. SEO, content, Google"}
                            value={lsiInput}
                            onChange={e => setLsiInput(e.target.value)}
                        />
                    </div>
                </div>

                <div className={cn("space-y-1.5", isRtl ? "text-right" : "")}>
                    <label className="text-sm font-medium flex items-center gap-1.5">
                        <AlignLeft className="h-3.5 w-3.5 text-cyan-500" />
                        {isRtl ? "نص المقال" : "Article Content"}
                        <span className="text-xs text-muted-foreground font-normal ml-1">
                            {isRtl ? "(ادعم Markdown للعناوين)" : "(Markdown headings supported)"}
                        </span>
                    </label>
                    <Textarea
                        dir={isRtl ? "rtl" : "ltr"}
                        placeholder={isRtl
                            ? "الصق نص المقال هنا...\n\n# عنوان المقال\n## عنوان فرعي\n..."
                            : "Paste article text here...\n\n# Article Title\n## Sub Heading\n..."}
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        className="min-h-[220px] font-mono text-sm"
                        required
                    />
                    <p className={cn("text-xs text-muted-foreground", isRtl ? "text-right" : "")}>
                        {content.trim() ? (
                            <>
                                {isRtl ? "عدد الكلمات التقريبي: " : "Approx. word count: "}
                                <span className={cn(
                                    "font-semibold",
                                    content.trim().split(/\s+/).length >= 1000
                                        ? "text-emerald-500"
                                        : content.trim().split(/\s+/).length >= 800
                                            ? "text-amber-500"
                                            : "text-destructive",
                                )}>
                                    {content.trim().split(/\s+/).length}
                                </span>
                                {" "}/ {isRtl ? "الحد الأدنى 800، المستهدف 1000" : "min 800, target 1000"}
                            </>
                        ) : (
                            isRtl ? "الحد الأدنى 800 كلمة — المستهدف 1000 كلمة" : "Minimum 800 words — target 1000 words"
                        )}
                    </p>
                </div>

                <Button
                    type="submit"
                    disabled={isChecking || !content.trim() || !focusKeyword.trim()}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white gap-2"
                >
                    {isChecking
                        ? <><Loader2 className="h-4 w-4 animate-spin" />{isRtl ? "جاري التحليل..." : "Analyzing..."}</>
                        : <><Play className="h-4 w-4" />{isRtl ? "افحص المقال" : "Check Article"}</>
                    }
                </Button>
            </form>

            {/* ── Error ── */}
            {error && (
                <div className={cn("flex items-center gap-2 text-sm text-destructive", isRtl ? "flex-row-reverse" : "")}>
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                </div>
            )}

            {/* ── Results ── */}
            <AnimatePresence>
                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35 }}
                        className="space-y-4"
                    >
                        {/* Score + summary */}
                        <div className={cn(
                            "flex flex-col sm:flex-row items-center gap-6 p-5 rounded-xl border",
                            result.passed ? "border-emerald-500/30 bg-emerald-500/5" : "border-destructive/30 bg-destructive/5",
                            isRtl ? "sm:flex-row-reverse text-right" : "",
                        )}>
                            <ScoreRing score={result.overallScore} passed={result.passed} />
                            <div className="flex-1 space-y-1">
                                <p className="text-sm font-semibold">
                                    {isRtl ? "تقييم المقال" : "Article Assessment"}
                                </p>
                                <p className="text-sm text-muted-foreground leading-relaxed">{result.summary}</p>
                                <div className={cn("flex flex-wrap gap-3 pt-1 text-xs text-muted-foreground", isRtl ? "flex-row-reverse" : "")}>
                                    <span className="flex items-center gap-1">
                                        <BookOpen className="h-3.5 w-3.5" />
                                        {result.wordCount} {isRtl ? "كلمة" : "words"}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <TrendingUp className="h-3.5 w-3.5" />
                                        {isRtl ? "الكثافة" : "Density"}: {result.focusKeyword.densityPercent?.toFixed(1)}%
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Hash className="h-3.5 w-3.5" />
                                        {isRtl ? "تكرار الكيوورد" : "Keyword count"}: {result.focusKeyword.totalOccurrences}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Checks grid */}
                        <div className="grid md:grid-cols-2 gap-4">
                            {/* Focus keyword checks */}
                            <div className="rounded-xl border border-border p-4 space-y-0.5">
                                <p className={cn("text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2", isRtl ? "text-right" : "")}>
                                    {isRtl ? "الكيوورد الأساسي" : "Focus Keyword"}
                                </p>
                                <CheckRow
                                    label="Keyword present in article"
                                    labelAr="الكيوورد موجود في المقال"
                                    passed={result.focusKeyword.present}
                                    detail={result.focusKeyword.present
                                        ? `${result.focusKeyword.totalOccurrences} ${isRtl ? "مرة" : "times"} · ${result.focusKeyword.densityPercent?.toFixed(1)}%`
                                        : (isRtl ? "غير موجود على الإطلاق" : "Not found at all")}
                                    isRtl={isRtl}
                                />
                                <CheckRow
                                    label="Keyword in Title / H1"
                                    labelAr="الكيوورد في العنوان الرئيسي"
                                    passed={result.focusKeyword.inTitle}
                                    isRtl={isRtl}
                                />
                                <CheckRow
                                    label="Keyword in intro paragraph"
                                    labelAr="الكيوورد في مقدمة المقال"
                                    passed={result.focusKeyword.inIntro}
                                    isRtl={isRtl}
                                />
                                <CheckRow
                                    label="Keyword in a subheading"
                                    labelAr="الكيوورد في عنوان فرعي"
                                    passed={result.focusKeyword.inSubheading}
                                    isRtl={isRtl}
                                />
                                <CheckRow
                                    label="Keyword in conclusion"
                                    labelAr="الكيوورد في الخاتمة"
                                    passed={result.focusKeyword.inConclusion}
                                    detail={distributionDetail(result)}
                                    isRtl={isRtl}
                                />
                            </div>

                            {/* Heading structure + word count */}
                            <div className="space-y-4">
                                <div className="rounded-xl border border-border p-4 space-y-0.5">
                                    <p className={cn("text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2", isRtl ? "text-right" : "")}>
                                        {isRtl ? "هيكل العناوين" : "Heading Structure"}
                                    </p>
                                    <CheckRow
                                        label="Has H1 (main title)"
                                        labelAr="يحتوي على H1 (عنوان رئيسي)"
                                        passed={result.headingStructure.hasH1}
                                        isRtl={isRtl}
                                    />
                                    <CheckRow
                                        label="Has at least 2 H2 subheadings"
                                        labelAr="يحتوي على عنوانين H2 فرعيين على الأقل"
                                        passed={result.headingStructure.h2Count >= 2}
                                        detail={`H2: ${result.headingStructure.h2Count} · H3: ${result.headingStructure.h3Count}`}
                                        isRtl={isRtl}
                                    />
                                    <CheckRow
                                        label="Proper heading hierarchy"
                                        labelAr="تسلسل منطقي للعناوين"
                                        passed={result.headingStructure.hasProperStructure}
                                        isRtl={isRtl}
                                    />
                                </div>

                                <div className="rounded-xl border border-border p-4 space-y-0.5">
                                    <p className={cn("text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2", isRtl ? "text-right" : "")}>
                                        {isRtl ? "عدد الكلمات" : "Word Count"}
                                    </p>
                                    <CheckRow
                                        label="Meets minimum (800 words)"
                                        labelAr="يتجاوز الحد الأدنى (800 كلمة)"
                                        passed={result.wordCountCheck.meetsMinimum}
                                        detail={`${result.wordCount} ${isRtl ? "كلمة" : "words"}`}
                                        isRtl={isRtl}
                                    />
                                    <CheckRow
                                        label="Meets target (1000+ words)"
                                        labelAr="يبلغ المستهدف (1000+ كلمة)"
                                        passed={result.wordCountCheck.meetsTarget}
                                        isRtl={isRtl}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* LSI keywords */}
                        {(result.lsiKeywords.found.length > 0 || result.lsiKeywords.missing.length > 0) && (
                            <div className="rounded-xl border border-border p-4">
                                <p className={cn("text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3", isRtl ? "text-right" : "")}>
                                    {isRtl ? "كيووردات LSI" : "LSI Keywords"}
                                </p>
                                <div className={cn("flex flex-wrap gap-4", isRtl ? "flex-row-reverse" : "")}>
                                    {result.lsiKeywords.found.length > 0 && (
                                        <div className={isRtl ? "text-right" : ""}>
                                            <p className="text-xs text-emerald-500 font-medium mb-1.5 flex items-center gap-1">
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                {isRtl ? "موجودة" : "Found"}
                                            </p>
                                            <div className={cn("flex flex-wrap gap-1.5", isRtl ? "flex-row-reverse" : "")}>
                                                {result.lsiKeywords.found.map(k => (
                                                    <Badge key={k} variant="outline" className="text-xs border-emerald-500/30 text-emerald-600 bg-emerald-500/5">
                                                        {k}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {result.lsiKeywords.missing.length > 0 && (
                                        <div className={isRtl ? "text-right" : ""}>
                                            <p className="text-xs text-destructive font-medium mb-1.5 flex items-center gap-1">
                                                <XCircle className="h-3.5 w-3.5" />
                                                {isRtl ? "مفقودة" : "Missing"}
                                            </p>
                                            <div className={cn("flex flex-wrap gap-1.5", isRtl ? "flex-row-reverse" : "")}>
                                                {result.lsiKeywords.missing.map(k => (
                                                    <Badge key={k} variant="outline" className="text-xs border-destructive/30 text-destructive bg-destructive/5">
                                                        {k}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
