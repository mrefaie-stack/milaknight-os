import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function countWords(text: string): number {
    return text.trim().split(/\s+/).filter(Boolean).length;
}

function countOccurrences(text: string, keyword: string): number {
    if (!keyword.trim()) return 0;
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "gi");
    return (text.match(regex) || []).length;
}

function headingPresent(text: string, heading: string): boolean {
    return text.toLowerCase().includes(heading.toLowerCase().trim());
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { content, focusKeyword, lsiKeywords, requiredHeadings } = await req.json();

        if (!content || !focusKeyword) {
            return NextResponse.json({ error: "Missing content or focus keyword" }, { status: 400 });
        }

        const lsiList: string[]     = Array.isArray(lsiKeywords)      ? lsiKeywords      : [];
        const headingList: string[] = Array.isArray(requiredHeadings)  ? requiredHeadings : [];

        // ── Word count ────────────────────────────────
        const wordCount      = countWords(content);
        const meetsMinimum   = wordCount >= 800;
        const meetsTarget    = wordCount >= 1000;

        // ── Focus keyword ─────────────────────────────
        const kwOccurrences  = countOccurrences(content, focusKeyword);
        const minRequired    = Math.max(7, Math.ceil(wordCount / 1000 * 7));
        const kwPassed       = kwOccurrences >= minRequired;
        const densityPercent = wordCount > 0 ? parseFloat(((kwOccurrences / wordCount) * 100).toFixed(2)) : 0;

        // ── LSI keywords ──────────────────────────────
        const lsiResults = lsiList.map(kw => {
            const occurrences = countOccurrences(content, kw);
            return { keyword: kw, occurrences, passed: occurrences >= 2 };
        });

        // ── Required headings ─────────────────────────
        const headingResults = headingList.map(h => ({
            heading: h,
            found: headingPresent(content, h),
        }));

        // ── Score ─────────────────────────────────────
        const checks: boolean[] = [
            kwPassed,
            meetsMinimum,
            ...lsiResults.map(l => l.passed),
            ...headingResults.map(h => h.found),
        ];
        const passedCount  = checks.filter(Boolean).length;
        const overallScore = Math.round((passedCount / checks.length) * 100);
        const passed       = kwPassed && meetsMinimum && lsiResults.every(l => l.passed) && headingResults.every(h => h.found);

        const result = {
            wordCount,
            focusKeyword: { keyword: focusKeyword, occurrences: kwOccurrences, minRequired, passed: kwPassed, densityPercent },
            lsiKeywords: lsiResults,
            requiredHeadings: headingResults,
            wordCountCheck: { wordCount, meetsMinimum, meetsTarget },
            overallScore,
            passed,
        };

        try {
            await (prisma as any).seoToolHistory.create({
                data: {
                    userId: (session.user as any).id,
                    toolName: "ARTICLE_SEO_CHECKER",
                    inputData: JSON.stringify({ focusKeyword, lsiKeywords, requiredHeadings, contentLength: content.length }),
                    resultData: JSON.stringify(result),
                },
            });
        } catch (historyErr) {
            console.error("Failed to save SEO history:", historyErr);
        }

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Article SEO Checker Error:", error);
        return NextResponse.json({ error: "Failed to run article SEO check", details: error.message }, { status: 500 });
    }
}
