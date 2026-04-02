import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { claudeGenerate } from "@/lib/ai/claude";
import * as cheerio from "cheerio";
import { prisma } from "@/lib/prisma";

export interface SiteIssue {
    id: string;
    category: string;
    severity: "error" | "warning" | "notice" | "pass";
    title: string;
    description: string;
    recommendation: string;
    detail?: string;
}

export interface CategoryResult {
    name: string;
    errors: number;
    warnings: number;
    notices: number;
    passed: number;
    issues: SiteIssue[];
}

export interface QuickWin {
    title: string;
    impact: "high" | "medium" | "low";
    description: string;
}

export interface SiteAnalysisResponse {
    url: string;
    analyzedAt: string;
    score: number;
    grade: string;
    summary: { errors: number; warnings: number; notices: number; passed: number; total: number };
    categories: CategoryResult[];
    quickWins: QuickWin[];
    rawMetrics: any;
}

const CATEGORY_NAMES = ["Crawlability", "On-Page", "Content", "Technical", "Structured Data", "Social", "Security"] as const;

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { url } = await req.json();
        if (!url?.startsWith("http")) return NextResponse.json({ error: "Valid URL required" }, { status: 400 });

        // ── 1. Fetch main page ──────────────────────────────────────────────
        let html = "";
        let responseHeaders: Record<string, string> = {};
        let finalUrl = url;
        try {
            const res = await fetch(url, {
                headers: { "User-Agent": "Mozilla/5.0 (compatible; MilaknightSEO/2.0; +https://os.mila-knight.com)" },
                redirect: "follow",
                signal: AbortSignal.timeout(15000),
            });
            html = await res.text();
            finalUrl = res.url;
            res.headers.forEach((v, k) => { responseHeaders[k.toLowerCase()] = v; });
        } catch (e: any) {
            return NextResponse.json({ error: "Failed to fetch URL: " + e.message }, { status: 400 });
        }

        const $ = cheerio.load(html);
        const urlObj = new URL(finalUrl);
        const baseHost = urlObj.hostname;

        // ── 2. Fetch robots.txt ─────────────────────────────────────────────
        let robotsTxt = "";
        let robotsExists = false;
        try {
            const r = await fetch(`${urlObj.protocol}//${baseHost}/robots.txt`, { signal: AbortSignal.timeout(5000) });
            if (r.ok) { robotsTxt = await r.text(); robotsExists = true; }
        } catch {}

        // ── 3. Fetch sitemap ────────────────────────────────────────────────
        let sitemapExists = false;
        let sitemapUrl = robotsTxt.match(/Sitemap:\s*(.+)/i)?.[1]?.trim() || `${urlObj.protocol}//${baseHost}/sitemap.xml`;
        try {
            const s = await fetch(sitemapUrl, { signal: AbortSignal.timeout(5000) });
            if (s.ok) {
                const sText = await s.text();
                sitemapExists = sText.includes("<urlset") || sText.includes("<sitemapindex");
            }
        } catch {}

        // ── 4. Extract all data ─────────────────────────────────────────────
        const title = $("title").text().trim();
        const metaDesc = $('meta[name="description"]').attr("content")?.trim() || "";
        const metaKeywords = $('meta[name="keywords"]').attr("content")?.trim() || "";

        const h1s: string[] = [];
        $("h1").each((_, el) => h1s.push($(el).text().trim()));
        const h2Count = $("h2").length;
        const h3Count = $("h3").length;
        const hasH3WithoutH2 = h3Count > 0 && h2Count === 0;

        let totalImages = 0, missingAlt = 0, emptyAlt = 0, lazyImages = 0;
        $("img").each((_, el) => {
            totalImages++;
            const alt = $(el).attr("alt");
            const loading = $(el).attr("loading");
            if (alt === undefined || alt === null) missingAlt++;
            else if (alt.trim() === "") emptyAlt++;
            if (loading === "lazy") lazyImages++;
        });

        let internalLinks = 0, externalLinks = 0;
        $("a[href]").each((_, el) => {
            const href = $(el).attr("href") || "";
            try {
                const linkUrl = new URL(href, finalUrl);
                if (linkUrl.hostname === baseHost) internalLinks++;
                else externalLinks++;
            } catch {}
        });

        const canonical = $('link[rel="canonical"]').attr("href") || "";
        const hasViewport = $('meta[name="viewport"]').length > 0;
        const viewportContent = $('meta[name="viewport"]').attr("content") || "";
        const mobileViewport = viewportContent.includes("width=device-width");
        const robotsMeta = $('meta[name="robots"]').attr("content") || "";
        const isNoIndex = robotsMeta.toLowerCase().includes("noindex");

        const htmlLang = $("html").attr("lang") || "";
        const htmlDir = $("html").attr("dir") || "";
        const hreflangTags: string[] = [];
        $('link[rel="alternate"][hreflang]').each((_, el) => {
            hreflangTags.push($(el).attr("hreflang") || "");
        });

        const ogTitle = $('meta[property="og:title"]').attr("content") || "";
        const ogDesc = $('meta[property="og:description"]').attr("content") || "";
        const ogImage = $('meta[property="og:image"]').attr("content") || "";
        const ogType = $('meta[property="og:type"]').attr("content") || "";
        const twitterCard = $('meta[name="twitter:card"]').attr("content") || "";
        const twitterImage = $('meta[name="twitter:image"]').attr("content") || "";

        const schemaTypes: string[] = [];
        $('script[type="application/ld+json"]').each((_, el) => {
            try {
                const json = JSON.parse($(el).html() || "{}");
                const entries = Array.isArray(json) ? json : [json];
                for (const entry of entries) {
                    const t = entry["@type"];
                    if (t) schemaTypes.push(Array.isArray(t) ? t.join(", ") : t);
                }
            } catch {}
        });

        const bodyText = $("body").text().replace(/\s+/g, " ").trim();
        const wordCount = bodyText.split(" ").filter(Boolean).length;
        const hasSSL = finalUrl.startsWith("https://");
        const htmlSizeKb = Math.round(html.length / 1024);
        const hasDoctype = html.trim().toLowerCase().startsWith("<!doctype");
        const hasCharset = $('meta[charset]').length > 0 || html.toLowerCase().includes("charset=utf-8");
        const hasFavicon = $('link[rel*="icon"]').length > 0;

        let mixedContentCount = 0;
        if (hasSSL) {
            $("img[src], script[src], link[href]").each((_, el) => {
                const src = $(el).attr("src") || $(el).attr("href") || "";
                if (src.startsWith("http://")) mixedContentCount++;
            });
        }

        let blockingScripts = 0;
        $("head script[src]").each((_, el) => {
            if (!$(el).attr("async") && !$(el).attr("defer")) blockingScripts++;
        });

        const urlLength = finalUrl.length;
        const urlHasUpperCase = /[A-Z]/.test(urlObj.pathname);
        const urlHasSpecialChars = /[^a-zA-Z0-9\-_\/.?=&#]/.test(urlObj.pathname);

        const isArabicContent = /[\u0600-\u06FF]/.test(bodyText.substring(0, 1000));
        const hasRtlDir = htmlDir === "rtl";
        const hasArHreflang = hreflangTags.some(h => h.startsWith("ar"));

        const hasXFrameOptions = !!responseHeaders["x-frame-options"];
        const hasXContentTypeOptions = !!responseHeaders["x-content-type-options"];
        const hasHSTS = !!responseHeaders["strict-transport-security"];
        const hasCSP = !!responseHeaders["content-security-policy"];

        const hasBreadcrumb = schemaTypes.some(t => t.toLowerCase().includes("breadcrumb"));
        const hasOrgSchema = schemaTypes.some(t => ["organization", "localbusiness", "website"].includes(t.toLowerCase()));

        // ── 5. Build all issues ─────────────────────────────────────────────
        const issues: SiteIssue[] = [];
        const add = (issue: SiteIssue) => issues.push(issue);

        // ─── CRAWLABILITY ───────────────────────────────────────────────────
        add({ id: "robots_txt", category: "Crawlability",
            severity: robotsExists ? "pass" : "warning",
            title: "Robots.txt File",
            description: robotsExists ? "robots.txt found and accessible" : `robots.txt not found at ${urlObj.protocol}//${baseHost}/robots.txt`,
            recommendation: robotsExists ? "" : "Create a robots.txt to guide crawlers. Ensure it doesn't block important pages.",
        });

        add({ id: "sitemap", category: "Crawlability",
            severity: sitemapExists ? "pass" : "error",
            title: "XML Sitemap",
            description: sitemapExists ? `XML sitemap found at ${sitemapUrl}` : "XML sitemap not found",
            recommendation: sitemapExists ? "" : "Create an XML sitemap and submit it to Google Search Console to help crawlers discover all pages.",
        });

        add({ id: "canonical", category: "Crawlability",
            severity: canonical ? "pass" : "warning",
            title: "Canonical Tag",
            description: canonical ? `Canonical: ${canonical}` : "No canonical tag found",
            recommendation: canonical ? "" : `Add <link rel="canonical" href="${finalUrl}"> to prevent duplicate content issues.`,
        });

        add({ id: "noindex_check", category: "Crawlability",
            severity: isNoIndex ? "error" : "pass",
            title: "Page Indexability",
            description: isNoIndex ? "noindex detected — search engines will NOT index this page!" : "Page is indexable",
            recommendation: isNoIndex ? "Remove noindex from robots meta tag if you want this page to appear in search results." : "",
        });

        add({ id: "url_length", category: "Crawlability",
            severity: urlLength > 115 ? "warning" : "pass",
            title: "URL Length",
            description: `URL is ${urlLength} characters${urlLength > 115 ? " — exceeds recommended 115 chars" : ""}`,
            recommendation: urlLength > 115 ? "Shorten the URL to under 115 characters. Use hyphens and remove stop words." : "",
        });

        add({ id: "url_structure", category: "Crawlability",
            severity: urlHasUpperCase || urlHasSpecialChars ? "warning" : "pass",
            title: "URL Structure",
            description: urlHasUpperCase ? "URL contains uppercase letters" : urlHasSpecialChars ? "URL contains special characters" : "Clean URL structure",
            recommendation: urlHasUpperCase || urlHasSpecialChars ? "Use lowercase letters and hyphens only. Avoid special characters and underscores." : "",
        });

        // ─── ON-PAGE ────────────────────────────────────────────────────────
        add({ id: "title_present", category: "On-Page",
            severity: title ? "pass" : "error",
            title: "Title Tag",
            description: title ? `"${title.substring(0, 70)}${title.length > 70 ? "..." : ""}" (${title.length} chars)` : "No title tag found!",
            recommendation: title ? "" : "Add a unique, descriptive title tag between 50-60 characters.",
        });

        add({ id: "title_length", category: "On-Page",
            severity: !title ? "error" : (title.length < 30 || title.length > 60) ? "warning" : "pass",
            title: "Title Tag Length",
            description: !title ? "Missing title" : `${title.length} chars — ${title.length < 30 ? "too short (min 30)" : title.length > 60 ? "too long (truncated in SERPs)" : "optimal"}`,
            recommendation: title.length > 0 && title.length < 30 ? "Expand title to 50-60 characters." : title.length > 60 ? "Trim title to 60 characters to prevent SERP truncation." : "",
        });

        add({ id: "meta_desc_present", category: "On-Page",
            severity: metaDesc ? "pass" : "error",
            title: "Meta Description",
            description: metaDesc ? `"${metaDesc.substring(0, 80)}${metaDesc.length > 80 ? "..." : ""}" (${metaDesc.length} chars)` : "No meta description found!",
            recommendation: metaDesc ? "" : "Add a compelling meta description (140-160 chars) with a clear call-to-action.",
        });

        add({ id: "meta_desc_length", category: "On-Page",
            severity: !metaDesc ? "error" : (metaDesc.length < 70 || metaDesc.length > 160) ? "warning" : "pass",
            title: "Meta Description Length",
            description: !metaDesc ? "Missing meta description" : `${metaDesc.length} chars — ${metaDesc.length < 70 ? "too short" : metaDesc.length > 160 ? "too long (may be truncated)" : "optimal"}`,
            recommendation: metaDesc.length > 0 && metaDesc.length < 70 ? "Expand to 140-160 characters for better CTR." : metaDesc.length > 160 ? "Trim to under 160 characters." : "",
        });

        add({ id: "h1_present", category: "On-Page",
            severity: h1s.length > 0 ? "pass" : "error",
            title: "H1 Heading",
            description: h1s.length > 0 ? `"${h1s[0]?.substring(0, 60)}${(h1s[0]?.length || 0) > 60 ? "..." : ""}"` : "No H1 heading found!",
            recommendation: h1s.length === 0 ? "Add one H1 heading with your primary keyword describing the page topic." : "",
        });

        add({ id: "h1_unique", category: "On-Page",
            severity: h1s.length > 1 ? "warning" : "pass",
            title: "Single H1 Tag",
            description: h1s.length > 1 ? `${h1s.length} H1 tags found — should be exactly one` : h1s.length === 1 ? "Exactly one H1 found ✓" : "No H1 found",
            recommendation: h1s.length > 1 ? "Use only one H1 per page. Convert extras to H2 or H3." : "",
        });

        add({ id: "h2_tags", category: "On-Page",
            severity: h2Count >= 2 ? "pass" : h2Count === 1 ? "notice" : "warning",
            title: "H2 Headings",
            description: `${h2Count} H2 heading(s) found${h2Count < 2 ? " — needs more structure" : ""}`,
            recommendation: h2Count < 2 ? "Add 2-5 H2 headings to structure content and include secondary keywords." : "",
        });

        add({ id: "heading_hierarchy", category: "On-Page",
            severity: hasH3WithoutH2 ? "warning" : "pass",
            title: "Heading Hierarchy",
            description: hasH3WithoutH2 ? "H3 tags used without any H2 — broken hierarchy" : "Heading hierarchy is properly structured",
            recommendation: hasH3WithoutH2 ? "Follow H1 → H2 → H3 order. Never skip heading levels." : "",
        });

        add({ id: "html_lang", category: "On-Page",
            severity: htmlLang ? "pass" : "error",
            title: "HTML Language Attribute",
            description: htmlLang ? `lang="${htmlLang}" on <html>` : "No lang attribute on <html> element",
            recommendation: htmlLang ? "" : `Add lang attribute: <html lang="${isArabicContent ? "ar" : "en"}">`,
        });

        add({ id: "hreflang", category: "On-Page",
            severity: hreflangTags.length > 0 ? "pass" : "notice",
            title: "Hreflang Tags",
            description: hreflangTags.length > 0 ? `${hreflangTags.length} hreflang tag(s): ${hreflangTags.slice(0, 4).join(", ")}` : "No hreflang tags found",
            recommendation: hreflangTags.length === 0 ? "Add hreflang tags if site serves multiple languages/regions." : "",
        });

        if (isArabicContent || htmlLang.startsWith("ar")) {
            add({ id: "arabic_rtl", category: "On-Page",
                severity: hasRtlDir ? "pass" : "warning",
                title: "Arabic RTL Direction",
                description: hasRtlDir ? 'dir="rtl" set correctly on <html>' : 'Arabic content detected but dir="rtl" missing',
                recommendation: !hasRtlDir ? 'Add dir="rtl" to your <html> tag for correct Arabic text rendering.' : "",
            });

            add({ id: "arabic_hreflang", category: "On-Page",
                severity: hasArHreflang ? "pass" : "notice",
                title: "Arabic Hreflang",
                description: hasArHreflang ? "Arabic hreflang tag found" : "No Arabic-specific hreflang tag",
                recommendation: !hasArHreflang ? 'Add <link rel="alternate" hreflang="ar" href="..."> for Arabic targeting.' : "",
            });
        }

        // ─── CONTENT ────────────────────────────────────────────────────────
        add({ id: "word_count", category: "Content",
            severity: wordCount >= 800 ? "pass" : wordCount >= 300 ? "warning" : "error",
            title: "Content Length",
            description: `${wordCount.toLocaleString()} words — ${wordCount < 300 ? "too thin (< 300)" : wordCount < 800 ? "below recommended 800+" : "good depth"}`,
            recommendation: wordCount < 300 ? "Add more content. Thin pages rarely rank. Minimum 300 words recommended." : wordCount < 800 ? "Aim for 800+ words for competitive search terms." : "",
        });

        add({ id: "images_alt_missing", category: "Content",
            severity: missingAlt > 0 ? "error" : "pass",
            title: "Missing Image Alt Text",
            description: missingAlt > 0 ? `${missingAlt}/${totalImages} images missing alt attribute` : totalImages === 0 ? "No images on page" : "All images have alt attributes ✓",
            recommendation: missingAlt > 0 ? "Add descriptive alt text to all images. Critical for accessibility and image search SEO." : "",
        });

        add({ id: "images_alt_empty", category: "Content",
            severity: emptyAlt > 3 ? "warning" : emptyAlt > 0 ? "notice" : "pass",
            title: "Empty Image Alt Text",
            description: emptyAlt > 0 ? `${emptyAlt} image(s) have empty alt=""` : "No images with empty alt",
            recommendation: emptyAlt > 0 ? 'Replace empty alt="" with descriptive text (unless purely decorative).' : "",
        });

        add({ id: "internal_links", category: "Content",
            severity: internalLinks >= 3 ? "pass" : internalLinks >= 1 ? "warning" : "error",
            title: "Internal Links",
            description: `${internalLinks} internal link(s)`,
            recommendation: internalLinks < 3 ? "Add 3-10 relevant internal links per page to improve crawlability and UX." : "",
        });

        add({ id: "external_links", category: "Content",
            severity: externalLinks >= 1 ? "pass" : "notice",
            title: "External (Outbound) Links",
            description: `${externalLinks} external link(s)`,
            recommendation: externalLinks === 0 ? "Link to authoritative external sources to improve content credibility." : "",
        });

        // ─── TECHNICAL ──────────────────────────────────────────────────────
        add({ id: "ssl", category: "Technical",
            severity: hasSSL ? "pass" : "error",
            title: "SSL / HTTPS",
            description: hasSSL ? "Served over HTTPS ✓" : "NOT using HTTPS!",
            recommendation: hasSSL ? "" : "Install SSL and redirect all HTTP to HTTPS. This is a confirmed Google ranking factor.",
        });

        add({ id: "viewport", category: "Technical",
            severity: hasViewport ? (mobileViewport ? "pass" : "warning") : "error",
            title: "Mobile Viewport",
            description: hasViewport ? `viewport: "${viewportContent}"` : "No viewport meta tag!",
            recommendation: !hasViewport ? 'Add <meta name="viewport" content="width=device-width, initial-scale=1">' : !mobileViewport ? "Include width=device-width in viewport content." : "",
        });

        add({ id: "charset", category: "Technical",
            severity: hasCharset ? "pass" : "warning",
            title: "Character Encoding",
            description: hasCharset ? "UTF-8 charset declared" : "No charset declaration",
            recommendation: !hasCharset ? 'Add <meta charset="UTF-8"> in <head> for correct text encoding.' : "",
        });

        add({ id: "doctype", category: "Technical",
            severity: hasDoctype ? "pass" : "warning",
            title: "HTML5 Doctype",
            description: hasDoctype ? "<!DOCTYPE html> present ✓" : "DOCTYPE declaration missing",
            recommendation: !hasDoctype ? "Add <!DOCTYPE html> as the very first line of your HTML." : "",
        });

        add({ id: "favicon", category: "Technical",
            severity: hasFavicon ? "pass" : "notice",
            title: "Favicon",
            description: hasFavicon ? "Favicon link tag found ✓" : "No favicon detected",
            recommendation: !hasFavicon ? "Add a favicon for better brand recognition in browser tabs and bookmarks." : "",
        });

        add({ id: "html_size", category: "Technical",
            severity: htmlSizeKb > 500 ? "error" : htmlSizeKb > 200 ? "warning" : "pass",
            title: "HTML Page Size",
            description: `${htmlSizeKb}KB${htmlSizeKb > 200 ? " — large file size" : " — acceptable"}`,
            recommendation: htmlSizeKb > 500 ? "Minify HTML, move inline JS/CSS to external files. Target < 100KB." : htmlSizeKb > 200 ? "Consider optimizing page size for faster load." : "",
        });

        add({ id: "blocking_scripts", category: "Technical",
            severity: blockingScripts > 3 ? "warning" : blockingScripts > 0 ? "notice" : "pass",
            title: "Render-Blocking Scripts",
            description: blockingScripts > 0 ? `${blockingScripts} script(s) in <head> without async/defer` : "No render-blocking scripts found",
            recommendation: blockingScripts > 0 ? "Add async or defer to non-critical scripts in <head> to unblock rendering." : "",
        });

        add({ id: "mixed_content", category: "Technical",
            severity: mixedContentCount > 0 ? "error" : "pass",
            title: "Mixed Content",
            description: mixedContentCount > 0 ? `${mixedContentCount} HTTP resource(s) on HTTPS page` : hasSSL ? "No mixed content ✓" : "N/A (not using HTTPS)",
            recommendation: mixedContentCount > 0 ? "Update all resource URLs to HTTPS. Mixed content triggers browser security warnings." : "",
        });

        add({ id: "lazy_loading", category: "Technical",
            severity: totalImages > 3 && lazyImages === 0 ? "notice" : "pass",
            title: "Image Lazy Loading",
            description: totalImages === 0 ? "No images on page" : lazyImages > 0 ? `${lazyImages}/${totalImages} images use lazy loading` : "No images use lazy loading",
            recommendation: totalImages > 3 && lazyImages === 0 ? 'Add loading="lazy" to below-the-fold images to improve page load performance.' : "",
        });

        // ─── STRUCTURED DATA ────────────────────────────────────────────────
        add({ id: "schema_present", category: "Structured Data",
            severity: schemaTypes.length > 0 ? "pass" : "warning",
            title: "JSON-LD Structured Data",
            description: schemaTypes.length > 0 ? `Found: ${schemaTypes.join(", ")}` : "No JSON-LD structured data found",
            recommendation: schemaTypes.length === 0 ? "Add JSON-LD structured data to enable rich results and help Google understand your content." : "",
        });

        add({ id: "schema_website", category: "Structured Data",
            severity: hasOrgSchema ? "pass" : "notice",
            title: "Organization / Website Schema",
            description: hasOrgSchema ? "Organization or Website schema ✓" : "No Organization/Website schema",
            recommendation: !hasOrgSchema ? "Add WebSite or Organization schema to establish brand identity in Search." : "",
        });

        add({ id: "breadcrumb_schema", category: "Structured Data",
            severity: hasBreadcrumb ? "pass" : "notice",
            title: "Breadcrumb Schema",
            description: hasBreadcrumb ? "BreadcrumbList schema ✓" : "No breadcrumb schema",
            recommendation: !hasBreadcrumb ? "Add BreadcrumbList schema to enable breadcrumb rich results in SERPs." : "",
        });

        add({ id: "schema_types_quality", category: "Structured Data",
            severity: schemaTypes.length >= 2 ? "pass" : schemaTypes.length === 1 ? "notice" : "warning",
            title: "Schema Coverage",
            description: schemaTypes.length >= 2 ? `${schemaTypes.length} schema types: well-covered` : schemaTypes.length === 1 ? "Only 1 schema type" : "No structured data schemas",
            recommendation: schemaTypes.length < 2 ? "Add more schema types relevant to your content (Article, Product, FAQ, Review, etc.)" : "",
        });

        // ─── SOCIAL ─────────────────────────────────────────────────────────
        add({ id: "og_title", category: "Social",
            severity: ogTitle ? "pass" : "warning",
            title: "Open Graph Title",
            description: ogTitle ? `og:title: "${ogTitle.substring(0, 60)}${ogTitle.length > 60 ? "..." : ""}"` : "og:title not set",
            recommendation: !ogTitle ? "Add og:title for proper social media sharing preview." : "",
        });

        add({ id: "og_description", category: "Social",
            severity: ogDesc ? "pass" : "warning",
            title: "Open Graph Description",
            description: ogDesc ? `og:description (${ogDesc.length} chars)` : "og:description not set",
            recommendation: !ogDesc ? "Add og:description for social media previews." : "",
        });

        add({ id: "og_image", category: "Social",
            severity: ogImage ? "pass" : "error",
            title: "Open Graph Image",
            description: ogImage ? "og:image present ✓" : "og:image not set!",
            recommendation: !ogImage ? "Add og:image (min 1200×630px). Without it, social shares show no image — killing click-through rates." : "",
        });

        add({ id: "og_type", category: "Social",
            severity: ogType ? "pass" : "notice",
            title: "Open Graph Type",
            description: ogType ? `og:type: "${ogType}"` : "og:type not set",
            recommendation: !ogType ? 'Set og:type to "website" or "article" for proper social categorization.' : "",
        });

        add({ id: "twitter_card", category: "Social",
            severity: twitterCard ? "pass" : "warning",
            title: "Twitter / X Card",
            description: twitterCard ? `twitter:card: "${twitterCard}"` : "No Twitter Card tags found",
            recommendation: !twitterCard ? 'Add <meta name="twitter:card" content="summary_large_image"> for rich Twitter previews.' : "",
        });

        add({ id: "twitter_image", category: "Social",
            severity: twitterImage ? "pass" : twitterCard ? "warning" : "notice",
            title: "Twitter Image",
            description: twitterImage ? "twitter:image present ✓" : "No twitter:image set",
            recommendation: !twitterImage && twitterCard ? "Add twitter:image to show a large image on Twitter/X shares." : "",
        });

        // ─── SECURITY ───────────────────────────────────────────────────────
        add({ id: "hsts", category: "Security",
            severity: hasSSL ? (hasHSTS ? "pass" : "warning") : "notice",
            title: "HSTS (Strict-Transport-Security)",
            description: hasHSTS ? "HSTS header present ✓" : hasSSL ? "HSTS header missing" : "N/A — not using HTTPS",
            recommendation: !hasHSTS && hasSSL ? "Add: Strict-Transport-Security: max-age=31536000; includeSubDomains to enforce HTTPS." : "",
        });

        add({ id: "x_frame_options", category: "Security",
            severity: hasXFrameOptions ? "pass" : "warning",
            title: "X-Frame-Options Header",
            description: hasXFrameOptions ? "X-Frame-Options present (clickjacking protection) ✓" : "X-Frame-Options header missing",
            recommendation: !hasXFrameOptions ? "Add X-Frame-Options: SAMEORIGIN to prevent clickjacking attacks." : "",
        });

        add({ id: "x_content_type", category: "Security",
            severity: hasXContentTypeOptions ? "pass" : "warning",
            title: "X-Content-Type-Options Header",
            description: hasXContentTypeOptions ? "X-Content-Type-Options: nosniff ✓" : "X-Content-Type-Options header missing",
            recommendation: !hasXContentTypeOptions ? "Add X-Content-Type-Options: nosniff to prevent MIME sniffing." : "",
        });

        add({ id: "csp", category: "Security",
            severity: hasCSP ? "pass" : "notice",
            title: "Content Security Policy",
            description: hasCSP ? "Content-Security-Policy header present ✓" : "No CSP header found",
            recommendation: !hasCSP ? "Add a Content Security Policy to prevent XSS attacks. Start with report-only mode." : "",
        });

        // ── 6. Score calculation ────────────────────────────────────────────
        const errors = issues.filter(i => i.severity === "error").length;
        const warnings = issues.filter(i => i.severity === "warning").length;
        const notices = issues.filter(i => i.severity === "notice").length;
        const passed = issues.filter(i => i.severity === "pass").length;
        const total = issues.length;

        const rawScore = 100 - errors * 5 - warnings * 2 - notices * 0.5;
        const score = Math.max(0, Math.min(100, Math.round(rawScore)));
        const grade = score >= 90 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : score >= 40 ? "D" : "F";

        // ── 7. Group by category ────────────────────────────────────────────
        const categories: CategoryResult[] = CATEGORY_NAMES.map(name => {
            const cat = issues.filter(i => i.category === name);
            return {
                name,
                errors: cat.filter(i => i.severity === "error").length,
                warnings: cat.filter(i => i.severity === "warning").length,
                notices: cat.filter(i => i.severity === "notice").length,
                passed: cat.filter(i => i.severity === "pass").length,
                issues: cat,
            };
        });

        // ── 8. AI Quick Wins ────────────────────────────────────────────────
        let quickWins: QuickWin[] = [];
        try {
            const failedIssues = issues
                .filter(i => i.severity === "error" || i.severity === "warning")
                .slice(0, 12);
            const issueSummary = failedIssues.map(i => `[${i.severity.toUpperCase()}] ${i.title}: ${i.description}`).join("\n");

            const prompt = `You are an elite SEO consultant. A site audit for ${finalUrl} found these issues:

${issueSummary}

Based on these issues, provide exactly 5 "Quick Wins" — the highest-impact fixes in priority order.
Return ONLY a valid JSON array, no markdown or explanation:
[
  {
    "title": "<short action title in ${htmlLang.startsWith("ar") ? "Arabic" : "English"}>",
    "impact": "high" | "medium" | "low",
    "description": "<one precise sentence: what to do + why it matters for SEO>"
  }
]`;

            const aiRaw = await claudeGenerate(prompt);
            const match = aiRaw.match(/\[[\s\S]*\]/);
            if (match) quickWins = JSON.parse(match[0]);
        } catch {}

        // ── 9. Build response ───────────────────────────────────────────────
        const rawMetrics = {
            title: { text: title, length: title.length },
            metaDesc: { text: metaDesc.substring(0, 200), length: metaDesc.length },
            metaKeywords: metaKeywords || null,
            headings: { h1: h1s.slice(0, 3), h2Count, h3Count },
            images: { total: totalImages, missingAlt, emptyAlt, lazyImages },
            links: { internal: internalLinks, external: externalLinks },
            wordCount,
            htmlSizeKb,
            ssl: hasSSL,
            canonical: canonical || null,
            robots: { exists: robotsExists, noindex: isNoIndex },
            sitemap: { exists: sitemapExists, url: sitemapUrl },
            htmlLang: htmlLang || null,
            hreflangTags,
            schemaTypes,
            og: { title: ogTitle, desc: ogDesc.substring(0, 200), image: ogImage, type: ogType },
            twitter: { card: twitterCard, image: twitterImage },
            security: { https: hasSSL, hsts: hasHSTS, xFrame: hasXFrameOptions, xContent: hasXContentTypeOptions, csp: hasCSP },
            performance: { blockingScripts, mixedContent: mixedContentCount },
        };

        const result: SiteAnalysisResponse = {
            url: finalUrl,
            analyzedAt: new Date().toISOString(),
            score,
            grade,
            summary: { errors, warnings, notices, passed, total },
            categories,
            quickWins,
            rawMetrics,
        };

        try {
            await prisma.seoToolHistory.create({
                data: {
                    userId: (session.user as any).id,
                    toolName: "SITE_ANALYSIS",
                    inputData: JSON.stringify({ url }),
                    resultData: JSON.stringify(result),
                },
            });
        } catch {}

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Site Analysis Error:", error);
        return NextResponse.json({ error: "Analysis failed", details: error.message }, { status: 500 });
    }
}
