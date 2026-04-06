"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Loader2, FileSearch, Play, CheckCircle2, XCircle, AlertCircle,
    Hash, AlignLeft, BookOpen, Tag, TrendingUp, Type, X, Plus
} from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SeoHistoryViewer } from "./seo-history-viewer";

/* ─── Types ──────────────────────────────────────── */
interface LsiResult   { keyword: string; occurrences: number; passed: boolean }
interface HeadingResult { heading: string; found: boolean }

interface CheckResult {
    wordCount: number;
    focusKeyword: {
        keyword: string;
        occurrences: number;
        minRequired: number;
        passed: boolean;
        densityPercent: number;
    };
    lsiKeywords: LsiResult[];
    requiredHeadings: HeadingResult[];
    wordCountCheck: {
        wordCount: number;
        meetsMinimum: boolean;
        meetsTarget: boolean;
    };
    overallScore: number;
    passed: boolean;
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
                <circle cx={48} cy={48} r={radius} fill="none" stroke={color} strokeWidth={7}
                    strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                    transform="rotate(-90 48 48)" style={{ transition: "stroke-dashoffset 0.8s ease" }} />
                <text x={48} y={48} textAnchor="middle" dominantBaseline="central"
                    fontSize={18} fontWeight={700} fill={color}>{score}</text>
            </svg>
            <Badge variant={passed ? "success" : "destructive"} className="text-[10px] px-2">
                {passed ? "✓ Passed" : "✗ Failed"}
            </Badge>
        </div>
    );
}

/* ─── Tag input ──────────────────────────────────── */
function TagInput({
    label, labelAr, placeholder, placeholderAr, values, onChange, isRtl, icon: Icon,
}: {
    label: string; labelAr: string; placeholder: string; placeholderAr: string;
    values: string[]; onChange: (v: string[]) => void; isRtl: boolean;
    icon: React.ElementType;
}) {
    const [input, setInput] = useState("");

    const addItems = (raw: string) => {
        const items = raw.split(/\n/).map(s => s.trim()).filter(Boolean);
        const next = [...values];
        for (const item of items) {
            if (!next.includes(item)) next.push(item);
        }
        onChange(next);
    };

    const removeTag = (i: number) => onChange(values.filter((_, idx) => idx !== i));

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        const text = e.clipboardData.getData("text");
        if (text.includes("\n")) {
            e.preventDefault();
            addItems(text);
            setInput("");
        }
    };

    return (
        <div className={cn("space-y-1.5", isRtl ? "text-right" : "")}>
            <label className="text-sm font-medium flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5 text-cyan-500" />
                {isRtl ? labelAr : label}
            </label>
            <div className={cn("flex gap-2", isRtl ? "flex-row-reverse" : "")}>
                <Input
                    dir={isRtl ? "rtl" : "ltr"}
                    placeholder={isRtl ? placeholderAr : placeholder}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            addItems(input);
                            setInput("");
                        }
                    }}
                    onPaste={handlePaste}
                    className="flex-1"
                />
                <Button type="button" variant="outline" size="sm" onClick={() => { addItems(input); setInput(""); }} className="shrink-0 gap-1 px-3">
                    <Plus className="h-3.5 w-3.5" />
                    {isRtl ? "أضف" : "Add"}
                </Button>
            </div>
            {values.length > 0 && (
                <div className={cn("flex flex-wrap gap-1.5 pt-1", isRtl ? "flex-row-reverse" : "")}>
                    {values.map((v, i) => (
                        <span key={i} className={cn(
                            "inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md",
                            "bg-cyan-500/10 text-cyan-600 border border-cyan-500/20",
                            isRtl ? "flex-row-reverse" : "",
                        )}>
                            {v}
                            <button type="button" onClick={() => removeTag(i)} className="hover:text-destructive transition-colors">
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ─── Main Component ─────────────────────────────── */
export function ArticleSeoChecker() {
    const { isRtl } = useLanguage();
    const [content, setContent]               = useState("");
    const [focusKeyword, setFocusKeyword]     = useState("");
    const [lsiKeywords, setLsiKeywords]       = useState<string[]>([]);
    const [requiredHeadings, setRequiredHeadings] = useState<string[]>([]);
    const [isChecking, setIsChecking]         = useState(false);
    const [result, setResult]                 = useState<CheckResult | null>(null);
    const [error, setError]                   = useState<string | null>(null);

    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

    const handleCheck = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || !focusKeyword.trim()) return;
        setIsChecking(true);
        setResult(null);
        setError(null);
        try {
            const res = await fetch("/api/seo/article-checker", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: content.trim(),
                    focusKeyword: focusKeyword.trim(),
                    lsiKeywords,
                    requiredHeadings,
                }),
            });
            if (!res.ok) throw new Error("Check failed");
            setResult(await res.json());
        } catch {
            setError(isRtl ? "فشل التحليل، حاول مرة أخرى" : "Analysis failed, please try again.");
        } finally {
            setIsChecking(false);
        }
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
                <SeoHistoryViewer
                    toolName="ARTICLE_SEO_CHECKER"
                    onSelect={(resultData) => {
                        setResult(resultData);
                        setError(null);
                    }}
                />
            </div>

            {/* ── Form ── */}
            <form onSubmit={handleCheck} className="space-y-5">
                {/* Focus keyword */}
                <div className={cn("space-y-1.5", isRtl ? "text-right" : "")}>
                    <label className="text-sm font-medium flex items-center gap-1.5">
                        <Hash className="h-3.5 w-3.5 text-cyan-500" />
                        {isRtl ? "الكيوورد الأساسي (Focus Keyword)" : "Focus Keyword"}
                        <span className="text-xs text-muted-foreground font-normal">
                            {isRtl ? "— لازم يتكرر ≥ 7 مرات/1000 كلمة" : "— must appear ≥ 7× per 1000 words"}
                        </span>
                    </label>
                    <Input
                        dir={isRtl ? "rtl" : "ltr"}
                        placeholder={isRtl ? "مثال: تسويق رقمي" : "e.g. digital marketing"}
                        value={focusKeyword}
                        onChange={e => setFocusKeyword(e.target.value)}
                        required
                    />
                </div>

                {/* LSI keywords */}
                <TagInput
                    label="LSI Keywords"
                    labelAr="كيووردات LSI"
                    placeholder="Add keyword and press Enter"
                    placeholderAr="أضف كيوورد واضغط Enter"
                    values={lsiKeywords}
                    onChange={setLsiKeywords}
                    isRtl={isRtl}
                    icon={Tag}
                />
                {lsiKeywords.length > 0 && (
                    <p className={cn("text-xs text-muted-foreground -mt-3", isRtl ? "text-right" : "")}>
                        {isRtl ? "كل كيوورد LSI لازم يتكرر ≥ مرتين في المقال" : "Each LSI keyword must appear ≥ 2 times in the article"}
                    </p>
                )}

                {/* Required headings */}
                <TagInput
                    label="Required Headings"
                    labelAr="العناوين المطلوبة"
                    placeholder="Add heading and press Enter"
                    placeholderAr="أضف عنوان واضغط Enter"
                    values={requiredHeadings}
                    onChange={setRequiredHeadings}
                    isRtl={isRtl}
                    icon={Type}
                />
                {requiredHeadings.length > 0 && (
                    <p className={cn("text-xs text-muted-foreground -mt-3", isRtl ? "text-right" : "")}>
                        {isRtl ? "الشيك بس إن كل عنوان موجود في المقال بغض النظر عن نوعه" : "Checks that each heading text exists anywhere in the article"}
                    </p>
                )}

                {/* Article content */}
                <div className={cn("space-y-1.5", isRtl ? "text-right" : "")}>
                    <label className="text-sm font-medium flex items-center gap-1.5">
                        <AlignLeft className="h-3.5 w-3.5 text-cyan-500" />
                        {isRtl ? "نص المقال كاملاً" : "Full Article Content"}
                    </label>
                    <Textarea
                        dir={isRtl ? "rtl" : "ltr"}
                        placeholder={isRtl ? "الصق نص المقال كاملاً هنا..." : "Paste the full article text here..."}
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        className="min-h-[240px] font-mono text-sm"
                        required
                    />
                    <p className={cn("text-xs text-muted-foreground", isRtl ? "text-right" : "")}>
                        {wordCount > 0 ? (
                            <>
                                {isRtl ? "عدد الكلمات: " : "Word count: "}
                                <span className={cn(
                                    "font-semibold",
                                    wordCount >= 1000 ? "text-emerald-500" : wordCount >= 800 ? "text-amber-500" : "text-destructive",
                                )}>
                                    {wordCount}
                                </span>
                                {wordCount >= 1000
                                    ? (isRtl ? " ✓ يحقق المستهدف" : " ✓ meets target")
                                    : wordCount >= 800
                                        ? (isRtl ? " ✓ يحقق الحد الأدنى" : " ✓ meets minimum")
                                        : (isRtl ? ` — الحد الأدنى 800 (ناقص ${800 - wordCount})` : ` — need ${800 - wordCount} more`)
                                }
                                {focusKeyword && wordCount > 0 && (
                                    <> · {isRtl ? "المطلوب من الكيوورد: " : "Keyword needed: "}
                                        <span className="font-semibold text-cyan-500">
                                            ≥{Math.ceil(wordCount / 1000 * 7)}
                                        </span>
                                    </>
                                )}
                            </>
                        ) : (
                            isRtl ? "الحد الأدنى 800 كلمة — المستهدف 1000+ كلمة" : "Min 800 words — target 1000+"
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
                    <AlertCircle className="h-4 w-4 shrink-0" />{error}
                </div>
            )}

            {/* ── Results ── */}
            <AnimatePresence>
                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }} transition={{ duration: 0.35 }}
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
                                <p className="text-sm font-semibold">{isRtl ? "تقييم المقال" : "Article Assessment"}</p>
                                <div className={cn("flex flex-wrap gap-3 pt-1 text-xs text-muted-foreground", isRtl ? "flex-row-reverse" : "")}>
                                    <span className="flex items-center gap-1">
                                        <BookOpen className="h-3.5 w-3.5" />
                                        {result.wordCount} {isRtl ? "كلمة" : "words"}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <TrendingUp className="h-3.5 w-3.5" />
                                        {isRtl ? "كثافة" : "Density"}: {result.focusKeyword.densityPercent?.toFixed(1)}%
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Hash className="h-3.5 w-3.5" />
                                        {isRtl ? "تكرار الكيوورد" : "Keyword count"}: {result.focusKeyword.occurrences} / {isRtl ? "مطلوب" : "required"} {result.focusKeyword.minRequired}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            {/* Focus keyword */}
                            <div className="rounded-xl border border-border p-4">
                                <p className={cn("text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3", isRtl ? "text-right" : "")}>
                                    {isRtl ? "الكيوورد الأساسي" : "Focus Keyword"}
                                </p>
                                <div className={cn(
                                    "flex items-center gap-3 py-2.5",
                                    isRtl ? "flex-row-reverse text-right" : "",
                                )}>
                                    {result.focusKeyword.passed
                                        ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                        : <XCircle className="h-4 w-4 text-destructive shrink-0" />
                                    }
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">
                                            {isRtl ? "التكرار الكافي" : "Sufficient repetition"}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {isRtl
                                                ? `تكرر ${result.focusKeyword.occurrences} مرة — المطلوب ≥${result.focusKeyword.minRequired} (7 لكل 1000 كلمة)`
                                                : `${result.focusKeyword.occurrences} times — required ≥${result.focusKeyword.minRequired} (7 per 1000 words)`
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Word count */}
                            <div className="rounded-xl border border-border p-4">
                                <p className={cn("text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3", isRtl ? "text-right" : "")}>
                                    {isRtl ? "عدد الكلمات" : "Word Count"}
                                </p>
                                {[
                                    {
                                        label: isRtl ? "الحد الأدنى (800 كلمة)" : "Minimum (800 words)",
                                        passed: result.wordCountCheck.meetsMinimum,
                                        detail: `${result.wordCount} ${isRtl ? "كلمة" : "words"}`,
                                    },
                                    {
                                        label: isRtl ? "المستهدف (1000+ كلمة)" : "Target (1000+ words)",
                                        passed: result.wordCountCheck.meetsTarget,
                                        detail: undefined,
                                    },
                                ].map(row => (
                                    <div key={row.label} className={cn(
                                        "flex items-start gap-3 py-2 border-b border-border last:border-0",
                                        isRtl ? "flex-row-reverse text-right" : "",
                                    )}>
                                        {row.passed
                                            ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                            : <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                                        }
                                        <div>
                                            <p className="text-sm font-medium">{row.label}</p>
                                            {row.detail && <p className="text-xs text-muted-foreground mt-0.5">{row.detail}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* LSI keywords */}
                        {result.lsiKeywords && result.lsiKeywords.length > 0 && (
                            <div className="rounded-xl border border-border p-4">
                                <p className={cn("text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3", isRtl ? "text-right" : "")}>
                                    {isRtl ? "كيووردات LSI (مطلوب ≥ مرتين لكل كيوورد)" : "LSI Keywords (≥ 2 occurrences each)"}
                                </p>
                                <div className="space-y-1.5">
                                    {result.lsiKeywords.map((lsi) => (
                                        <div key={lsi.keyword} className={cn(
                                            "flex items-center gap-3 py-2 border-b border-border last:border-0",
                                            isRtl ? "flex-row-reverse text-right" : "",
                                        )}>
                                            {lsi.passed
                                                ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                                : <XCircle className="h-4 w-4 text-destructive shrink-0" />
                                            }
                                            <span className="flex-1 text-sm font-medium">{lsi.keyword}</span>
                                            <Badge
                                                variant={lsi.passed ? "outline" : "destructive"}
                                                className={cn(
                                                    "text-[10px] shrink-0",
                                                    lsi.passed ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/5" : "",
                                                )}
                                            >
                                                {lsi.occurrences}× {lsi.passed ? "✓" : `(${isRtl ? "ناقص" : "need"} ${2 - lsi.occurrences} ${isRtl ? "أكثر" : "more"})`}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Required headings */}
                        {result.requiredHeadings && result.requiredHeadings.length > 0 && (
                            <div className="rounded-xl border border-border p-4">
                                <p className={cn("text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3", isRtl ? "text-right" : "")}>
                                    {isRtl ? "العناوين المطلوبة" : "Required Headings"}
                                </p>
                                <div className="space-y-1.5">
                                    {result.requiredHeadings.map((h) => (
                                        <div key={h.heading} className={cn(
                                            "flex items-center gap-3 py-2 border-b border-border last:border-0",
                                            isRtl ? "flex-row-reverse text-right" : "",
                                        )}>
                                            {h.found
                                                ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                                : <XCircle className="h-4 w-4 text-destructive shrink-0" />
                                            }
                                            <span className="flex-1 text-sm font-medium">{h.heading}</span>
                                            <Badge
                                                variant={h.found ? "outline" : "destructive"}
                                                className={cn(
                                                    "text-[10px] shrink-0",
                                                    h.found ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/5" : "",
                                                )}
                                            >
                                                {h.found ? (isRtl ? "موجود ✓" : "Found ✓") : (isRtl ? "مفقود ✗" : "Missing ✗")}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
