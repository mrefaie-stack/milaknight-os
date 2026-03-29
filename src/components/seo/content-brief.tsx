"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, FileText, Download, Copy, ListTree, Target, Sparkles, Wand2 } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SeoHistoryViewer } from "./seo-history-viewer";

interface ContentBrief {
    metaTitle: string;
    metaDescription: string;
    suggestedUrl: string;
    primaryKeyword: string;
    lsiKeywords: string[];
    wordCountTarget: number;
    outline: { type: string; text: string; notes: string }[];
    writerInstructions: string;
}

export function ContentBriefGenerator() {
    const { t, isRtl } = useLanguage();
    const [keyword, setKeyword] = useState("");
    const [audience, setAudience] = useState("");
    const [tone, setTone] = useState("Professional");
    
    const [isGenerating, setIsGenerating] = useState(false);
    const [brief, setBrief] = useState<ContentBrief | null>(null);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!keyword.trim()) return;
        
        setIsGenerating(true);
        setBrief(null);

        try {
            const response = await fetch('/api/seo/content-brief', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keyword, audience, tone: isRtl ? tone + ' (Arabic Language)' : tone })
            });

            if (!response.ok) throw new Error("Generation Failed");

            const data = await response.json();
            setBrief(data);
        } catch (error) {
            console.error("Brief generation failed", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = () => {
        if (!brief) return;
        let text = `Target Keyword: ${brief.primaryKeyword}\nWords: ~${brief.wordCountTarget}\n\n`;
        text += `Meta Title: ${brief.metaTitle}\nMeta Desc: ${brief.metaDescription}\nSlug: /${brief.suggestedUrl}\n\n`;
        text += `LSI Keywords: ${brief.lsiKeywords.join(', ')}\n\n`;
        text += `OUTLINE:\n`;
        brief.outline.forEach(item => {
            text += `${item.type}: ${item.text} (${item.notes})\n`;
        });
        text += `\nInstructions: ${brief.writerInstructions}`;
        
        navigator.clipboard.writeText(text);
        alert(isRtl ? "تم نسخ المحتوى!" : "Copied to clipboard!");
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-violet-500 to-indigo-500 bg-clip-text text-transparent flex items-center gap-2">
                        <FileText className="h-6 w-6 text-violet-500" />
                        {isRtl ? "مصمم خطط المحتوى" : "Content Brief Generator"}
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        {isRtl 
                            ? "قم بتوجيه الذكاء الاصطناعي لكتابة خطة محتوى شاملة وهيكل مقال متوافق تماماً مع قواعد الـ SEO." 
                            : "Direct AI to write a comprehensive content brief and SEO-optimized article outline."}
                    </p>
                </div>
                
                <SeoHistoryViewer 
                    toolName="CONTENT_BRIEF" 
                    onSelect={(data, input) => {
                        setBrief(data);
                        if (input) {
                            if (input.keyword) setKeyword(input.keyword);
                            if (input.audience) setAudience(input.audience);
                            if (input.tone) setTone(input.tone);
                        }
                    }} 
                />
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <form onSubmit={handleGenerate} className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2 col-span-1 md:col-span-1">
                            <Label htmlFor="keyword">{isRtl ? "الكلمة المفتاحية (Target Keyword)" : "Target Keyword"}</Label>
                            <Input 
                                id="keyword"
                                placeholder={isRtl ? "مثال: الاستثمار العقاري" : "e.g. real estate investing"}
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2 col-span-1 md:col-span-1">
                            <Label htmlFor="audience">{isRtl ? "الجمهور المستهدف (اختياري)" : "Target Audience"}</Label>
                            <Input 
                                id="audience"
                                placeholder={isRtl ? "مثال: الشباب والمستثمرين الجدد" : "e.g. young investors"}
                                value={audience}
                                onChange={(e) => setAudience(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2 col-span-1 md:col-span-1">
                            <Label htmlFor="tone">{isRtl ? "أسلوب الكتابة" : "Tone of Voice"}</Label>
                            <select 
                                id="tone"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={tone}
                                onChange={(e) => setTone(e.target.value)}
                            >
                                <option value="Professional">{isRtl ? "احترافي ورسمي" : "Professional"}</option>
                                <option value="Conversational">{isRtl ? "حوار وودي" : "Conversational"}</option>
                                <option value="Educational">{isRtl ? "تعليمي مبسط" : "Educational"}</option>
                                <option value="Persuasive">{isRtl ? "إقناعي ترويجي" : "Persuasive"}</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="flex justify-end mt-2">
                        <Button type="submit" className="bg-violet-600 hover:bg-violet-700 text-white w-full md:w-auto" disabled={isGenerating}>
                            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mx-8" /> : (
                                <>
                                    <Wand2 className={isRtl ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
                                    {isRtl ? "توليد خطة المحتوى" : "Generate Brief"}
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>

            <AnimatePresence mode="wait">
                {brief && !isGenerating && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Header Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-card border border-border p-4 rounded-xl flex flex-col items-center text-center gap-1">
                                <Target className="h-5 w-5 text-violet-500 mb-1" />
                                <span className="text-xs text-muted-foreground">{isRtl ? "الكلمة الأساسية" : "Primary Keyword"}</span>
                                <span className="font-semibold text-sm line-clamp-1">{brief.primaryKeyword}</span>
                            </div>
                            <div className="bg-card border border-border p-4 rounded-xl flex flex-col items-center text-center gap-1">
                                <FileText className="h-5 w-5 text-blue-500 mb-1" />
                                <span className="text-xs text-muted-foreground">{isRtl ? "الكلمات (تقريباً)" : "Word Count"}</span>
                                <span className="font-semibold text-sm">~{brief.wordCountTarget}</span>
                            </div>
                            <div className="bg-card border border-border p-4 rounded-xl flex flex-col items-center text-center gap-1">
                                <ListTree className="h-5 w-5 text-emerald-500 mb-1" />
                                <span className="text-xs text-muted-foreground">{isRtl ? "عدد العناوين" : "Headings"}</span>
                                <span className="font-semibold text-sm">{brief.outline?.length || 0}</span>
                            </div>
                            <div className="bg-card border border-border p-4 rounded-xl flex flex-col items-center justify-center gap-2">
                                <Button onClick={copyToClipboard} variant="secondary" size="sm" className="w-full">
                                    <Copy className={isRtl ? "ml-2 h-3 w-3" : "mr-2 h-3 w-3"} />
                                    {isRtl ? "نسخ للمحتوى" : "Copy for Writer"}
                                </Button>
                            </div>
                        </div>

                        {/* Meta Info */}
                        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                            <h3 className="font-semibold text-lg flex items-center border-b border-border pb-2 mb-4">
                                <Sparkles className="h-4 w-4 text-violet-500 mr-2" />
                                {isRtl ? "البيانات الوصفية الوصفية (Meta Data)" : "Meta Data Details"}
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">{isRtl ? "عنوان السيو (Meta Title)" : "Meta Title"}</Label>
                                    <div className="font-medium bg-muted p-3 rounded-md text-sm leading-relaxed border border-border/50">
                                        {brief.metaTitle}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground text-right">{brief.metaTitle.length} {isRtl ? "حرف" : "chars"}</div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">{isRtl ? "الرابط (Slug)" : "URL Slug"}</Label>
                                    <div className="font-mono text-blue-500 bg-muted p-3 rounded-md text-sm border border-border/50" dir="ltr">
                                        /{brief.suggestedUrl}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">{isRtl ? "وصف الميتا (Meta Description)" : "Meta Description"}</Label>
                                <div className="font-medium bg-muted p-3 rounded-md text-sm leading-relaxed border border-border/50">
                                    {brief.metaDescription}
                                </div>
                                <div className="text-[10px] text-muted-foreground text-right">{brief.metaDescription.length} {isRtl ? "حرف" : "chars"}</div>
                            </div>
                        </div>

                        {/* Outline */}
                        <div className="bg-card border border-border rounded-xl overflow-hidden">
                            <div className="p-4 bg-muted/30 border-b border-border font-semibold flex items-center justify-between">
                                <span>{isRtl ? "هيكل المقال المقترح" : "Suggested Outline"}</span>
                            </div>
                            <div className="p-4 space-y-4">
                                {brief.outline.map((item, idx) => (
                                    <div key={idx} className={item.type === 'H1' ? 'pl-0' : item.type === 'H2' ? (isRtl ? 'pr-6 border-r-2 border-violet-500' : 'pl-6 border-l-2 border-violet-500') : (isRtl ? 'pr-12' : 'pl-12')}>
                                        <div className="flex items-start gap-2">
                                            <span className="text-[10px] font-bold text-violet-500 bg-violet-500/10 px-1.5 py-0.5 rounded shrink-0 mt-0.5">{item.type}</span>
                                            <div>
                                                <h4 className="font-semibold">{item.text}</h4>
                                                <p className="text-sm text-muted-foreground mt-1 bg-muted/50 p-2 rounded">{item.notes}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* LSI & Instructions */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-card border border-border rounded-xl p-5">
                                <h4 className="font-semibold text-sm mb-3 text-emerald-600">{isRtl ? "كلمات LSI والكلمات الثانوية" : "LSI & Secondary Keywords"}</h4>
                                <div className="flex flex-wrap gap-2">
                                    {brief.lsiKeywords.map((lsi, i) => (
                                        <span key={i} className="px-2 py-1 bg-emerald-500/10 text-emerald-600 rounded text-xs font-medium border border-emerald-500/20">{lsi}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-card border border-border rounded-xl p-5">
                                <h4 className="font-semibold text-sm mb-3 text-blue-600">{isRtl ? "تعليمات كاتب المحتوى" : "Writer Instructions"}</h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {brief.writerInstructions}
                                </p>
                            </div>
                        </div>

                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
