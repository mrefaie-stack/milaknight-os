import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/* Strip HTML tags to get plain text */
function stripHtml(html: string): string {
    return html
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n")
        .replace(/<\/div>/gi, "\n")
        .replace(/<\/li>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
}

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

interface DetectedHeading { text: string; level: number }

function extractHeadings(content: string): DetectedHeading[] {
    const headings: DetectedHeading[] = [];

    // HTML tags: <h1>...</h1> — works for Word paste
    const htmlRegex = /<h([1-6])[^>]*>([\s\S]*?)<\/h[1-6]>/gi;
    let match;
    while ((match = htmlRegex.exec(content)) !== null) {
        const text = match[2].replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
        if (text) headings.push({ level: parseInt(match[1]), text });
    }

    // Markdown: # H1 ## H2 — fallback for plain text
    if (headings.length === 0) {
        const mdRegex = /^(#{1,6})\s+(.+)$/gm;
        while ((match = mdRegex.exec(content)) !== null) {
            headings.push({ level: match[1].length, text: match[2].trim() });
        }
    }

    return headings;
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { content, focusKeyword, lsiKeywords, requiredHeadings } = await req.json();

        if (!content || !focusKeyword) {
            return NextResponse.json({ error: "Missing content or focus keyword" }, { status: 400 });
        }

        const lsiList: string[]     = Array.isArray(lsiKeywords)     ? lsiKeywords     : [];
        const headingList: string[] = Array.isArray(requiredHeadings) ? requiredHeadings : [];

        // Plain text for word count + keyword matching
        const plainText = stripHtml(content);

        // ── Word count ────────────────────────────────
        const wordCount    = countWords(plainText);
        const meetsMinimum = wordCount >= 800;
        const meetsTarget  = wordCount >= 1000;

        // ── Focus keyword ─────────────────────────────
        const kwOccurrences  = countOccurrences(plainText, focusKeyword);
        const minRequired    = Math.max(7, Math.ceil(wordCount / 1000 * 7));
        const kwPassed       = kwOccurrences >= minRequired;
        const densityPercent = wordCount > 0 ? parseFloat(((kwOccurrences / wordCount) * 100).toFixed(2)) : 0;

        // ── LSI keywords ──────────────────────────────
        const lsiResults = lsiList.map(kw => {
            const occurrences = countOccurrences(plainText, kw);
            return { keyword: kw, occurrences, passed: occurrences >= 2 };
        });

        // ── Required headings ─────────────────────────
        const headingResults = headingList.map(h => ({
            heading: h,
            found: headingPresent(plainText, h),
        }));

        // ── Detected headings from content ────────────
        const allDetected = extractHeadings(content);
        const extraHeadings = allDetected.filter(dh =>
            !headingList.some(req =>
                dh.text.toLowerCase().includes(req.toLowerCase().trim()) ||
                req.toLowerCase().trim().includes(dh.text.toLowerCase())
            )
        );

        // ── Score ─────────────────────────────────────
        const checks: boolean[] = [
            kwPassed,
            meetsMinimum,
            ...lsiResults.map(l => l.passed),
            ...headingResults.map(h => h.found),
        ];
        const passedCount  = checks.filter(Boolean).length;
        const overallScore = Math.round((passedCount / checks.length) * 100);
        const passed       = kwPassed && meetsMinimum
            && lsiResults.every(l => l.passed)
            && headingResults.every(h => h.found);

        const result = {
            wordCount,
            focusKeyword: { keyword: focusKeyword, occurrences: kwOccurrences, minRequired, passed: kwPassed, densityPercent },
            lsiKeywords: lsiResults,
            requiredHeadings: headingResults,
            allDetectedHeadings: allDetected,
            extraHeadings,
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
