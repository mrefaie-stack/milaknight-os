import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { claudeGenerate } from "@/lib/ai/claude";
import { GoogleAdsAPI } from "@/lib/google-ads-api";
import { COUNTRY_GEO_IDS, LANGUAGE_IDS } from "@/app/api/seo/keyword-explorer/route";
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
    codeSnippet?: string;
    affectedCount?: number;
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
    effort: "easy" | "medium" | "hard";
    description: string;
    codeSnippet?: string;
}

export interface SerpPreview {
    title: string;
    description: string;
    displayUrl: string;
    breadcrumbs: string[];
}

export interface PerformanceSignals {
    compression: boolean;
    compressionType: string;
    caching: boolean;
    cacheControl: string;
    etag: boolean;
    serverHeader: string;
    blockingScripts: number;
    blockingStyles: number;
    totalScripts: number;
    totalStylesheets: number;
    inlineScripts: number;
    inlineStyles: number;
    htmlSizeKb: number;
}

export interface ContentQuality {
    wordCount: number;
    contentToCodeRatio: number;
    avgWordsPerSentence: number;
    readabilityLabel: string;
    paragraphCount: number;
    listCount: number;
}

export interface NicheKeyword {
    keyword: string;
    category: "Transactional" | "Informational" | "Commercial" | "Question" | "Local" | "Adjacent";
    volume: number;
    competition: string;
    cpc: string;
    opportunityScore: number;
    goldenScore: number;
    isHiddenGem: boolean;
    intent: string;
    source: "AI+Data" | "AI Only" | "Data Expanded";
}

export interface NicheIntelligence {
    niche: string;
    subNiche: string;
    targetAudience: string;
    detectedLanguage: string;
    mainTopics: string[];
    contentSummary: string;
    seedKeywords: string[];
    keywords: NicheKeyword[];
    hasRealData: boolean;
    totalKeywords: number;
    hiddenGems: number;
}

export interface SiteCompetitor {
    domain: string;
    overlapReason: string;
}

export interface TargetKeyword {
    keyword: string;
    intent: "Informational" | "Navigational" | "Commercial" | "Transactional";
    volume: string;
    difficulty: "Low" | "Medium" | "High";
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
    serpPreview: SerpPreview;
    performanceSignals: PerformanceSignals;
    contentQuality: ContentQuality;
    competitors: SiteCompetitor[];
    targetKeywords: TargetKeyword[];
}

const CATEGORY_NAMES = [
    "Crawlability", "On-Page", "Content", "Technical",
    "Links", "Performance", "Structured Data", "Social", "Security"
] as const;

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
        let responseTime = 0;
        let statusCode = 200;

        try {
            const t0 = Date.now();
            const res = await fetch(url, {
                headers: { "User-Agent": "Mozilla/5.0 (compatible; MilaknightSEO/3.0; +https://os.mila-knight.com)" },
                redirect: "follow",
                signal: AbortSignal.timeout(15000),
            });
            responseTime = Date.now() - t0;
            html = await res.text();
            finalUrl = res.url;
            statusCode = res.status;
            res.headers.forEach((v, k) => { responseHeaders[k.toLowerCase()] = v; });
        } catch (e: any) {
            return NextResponse.json({ error: "Failed to fetch URL: " + e.message }, { status: 400 });
        }

        const $ = cheerio.load(html);
        const urlObj = new URL(finalUrl);
        const baseHost = urlObj.hostname;

        // ── 2. Fetch & fully parse robots.txt ──────────────────────────────
        let robotsTxt = "";
        let robotsExists = false;
        let robotsStatusCode = 0;
        let robotsSitemapUrls: string[] = [];
        let robotsDisallowedPaths: string[] = [];
        let robotsAllowedPaths: string[] = [];
        let robotsCrawlDelay = 0;
        let robotsBlocksGooglebot = false;
        let robotsBlocksAllBots = false;
        let robotsBlocksImportantPaths = false;
        let robotsHasMultipleAgents = false;
        let robotsUserAgents: string[] = [];

        try {
            const r = await fetch(`${urlObj.protocol}//${baseHost}/robots.txt`, {
                headers: { "User-Agent": "Mozilla/5.0 (compatible; MilaknightSEO/3.0)" },
                signal: AbortSignal.timeout(5000),
            });
            robotsStatusCode = r.status;
            if (r.ok) {
                robotsTxt = await r.text();
                robotsExists = true;

                // Parse robots.txt line by line
                let currentAgents: string[] = [];
                for (const rawLine of robotsTxt.split(/\r?\n/)) {
                    const line = rawLine.trim();
                    if (!line || line.startsWith("#")) continue;

                    const [directive, ...rest] = line.split(":").map(s => s.trim());
                    const value = rest.join(":").trim();
                    const d = directive.toLowerCase();

                    if (d === "user-agent") {
                        currentAgents.push(value);
                        if (!robotsUserAgents.includes(value)) robotsUserAgents.push(value);
                    } else if (d === "disallow") {
                        robotsDisallowedPaths.push(value);
                        // Check if it blocks everything
                        if (value === "/" && currentAgents.some(a => a === "*")) robotsBlocksAllBots = true;
                        if (value === "/" && currentAgents.some(a => a.toLowerCase().includes("googlebot"))) robotsBlocksGooglebot = true;
                        // Check important paths
                        const importantPaths = ["/css", "/js", "/images", "/img", "/static", "/assets"];
                        if (importantPaths.some(p => value.startsWith(p))) robotsBlocksImportantPaths = true;
                    } else if (d === "allow") {
                        robotsAllowedPaths.push(value);
                    } else if (d === "crawl-delay") {
                        robotsCrawlDelay = parseFloat(value) || 0;
                    } else if (d === "sitemap") {
                        if (value) robotsSitemapUrls.push(value);
                    }
                    // Track new user-agent block start
                    if (d === "user-agent") currentAgents = [value];
                }
                robotsHasMultipleAgents = robotsUserAgents.length > 1;
            }
        } catch {}

        // ── 3. Fetch & fully parse sitemap ──────────────────────────────────
        let sitemapExists = false;
        const sitemapUrlFromRobots = robotsSitemapUrls[0] || "";
        let sitemapUrl = sitemapUrlFromRobots || `${urlObj.protocol}//${baseHost}/sitemap.xml`;
        let sitemapPageCount = 0;
        let sitemapHasLastmod = false;
        let sitemapHasImages = false;
        let sitemapHasNews = false;
        let sitemapHasVideo = false;
        let sitemapIsSitemapIndex = false;
        let sitemapOldestLastmod = "";
        let sitemapNewestLastmod = "";
        let sitemapCurrentPageListed = false;
        let sitemapHasChangefreq = false;
        let sitemapHasPriority = false;

        try {
            const s = await fetch(sitemapUrl, {
                headers: { "User-Agent": "Mozilla/5.0 (compatible; MilaknightSEO/3.0)" },
                signal: AbortSignal.timeout(8000),
            });
            if (s.ok) {
                const sText = await s.text();
                sitemapExists = sText.includes("<urlset") || sText.includes("<sitemapindex");

                if (sitemapExists) {
                    sitemapIsSitemapIndex = sText.includes("<sitemapindex");
                    const urlMatches = sText.match(/<url>/gi);
                    sitemapPageCount = urlMatches ? urlMatches.length : 0;

                    sitemapHasLastmod = sText.includes("<lastmod>");
                    sitemapHasImages = sText.includes("image:image") || sText.includes("<image:");
                    sitemapHasNews = sText.includes("news:news") || sText.includes("<news:");
                    sitemapHasVideo = sText.includes("video:video") || sText.includes("<video:");
                    sitemapHasChangefreq = sText.includes("<changefreq>");
                    sitemapHasPriority = sText.includes("<priority>");

                    // Check if current URL is listed in sitemap
                    const normalizedFinal = finalUrl.replace(/\/$/, "");
                    sitemapCurrentPageListed = sText.includes(normalizedFinal) || sText.includes(normalizedFinal + "/");

                    // Extract lastmod dates for age analysis
                    const lastmodMatches = sText.match(/<lastmod>([^<]+)<\/lastmod>/g) || [];
                    const dates = lastmodMatches
                        .map(m => m.replace(/<\/?lastmod>/g, "").trim())
                        .sort();
                    if (dates.length > 0) {
                        sitemapOldestLastmod = dates[0];
                        sitemapNewestLastmod = dates[dates.length - 1];
                    }
                }
            }
        } catch {}

        // ── 4. Extract all data ─────────────────────────────────────────────
        const title = $("title").text().trim();
        const metaDesc = $('meta[name="description"]').attr("content")?.trim() || "";
        const metaKeywords = $('meta[name="keywords"]').attr("content")?.trim() || "";

        const h1s: string[] = [];
        $("h1").each((_, el) => h1s.push($(el).text().trim()));
        const h2s: string[] = [];
        $("h2").each((_, el) => h2s.push($(el).text().trim()));
        const h2Count = $("h2").length;
        const h3Count = $("h3").length;
        const h4Count = $("h4").length;
        const hasH3WithoutH2 = h3Count > 0 && h2Count === 0;

        let totalImages = 0, missingAlt = 0, emptyAlt = 0, lazyImages = 0, webpImages = 0;
        $("img").each((_, el) => {
            totalImages++;
            const alt = $(el).attr("alt");
            const loading = $(el).attr("loading");
            const src = $(el).attr("src") || "";
            if (alt === undefined || alt === null) missingAlt++;
            else if (alt.trim() === "") emptyAlt++;
            if (loading === "lazy") lazyImages++;
            if (src.includes(".webp") || $("picture source[type='image/webp']").length > 0) webpImages++;
        });

        let internalLinks = 0, externalLinks = 0, emptyAnchors = 0, nofollowLinks = 0, noopenerExternal = 0;
        $("a[href]").each((_, el) => {
            const href = $(el).attr("href") || "";
            const text = $(el).text().trim();
            const hasImg = $(el).find("img").length > 0;
            const hasAriaLabel = !!$(el).attr("aria-label");
            const rel = $(el).attr("rel") || "";
            const target = $(el).attr("target") || "";

            try {
                const linkUrl = new URL(href, finalUrl);
                if (linkUrl.hostname === baseHost) internalLinks++;
                else {
                    externalLinks++;
                    if (target === "_blank" && !rel.includes("noopener") && !rel.includes("noreferrer")) noopenerExternal++;
                }
            } catch {}

            if (!text && !hasImg && !hasAriaLabel) emptyAnchors++;
            if (rel.includes("nofollow")) nofollowLinks++;
        });

        const canonical = $('link[rel="canonical"]').attr("href") || "";
        const hasViewport = $('meta[name="viewport"]').length > 0;
        const viewportContent = $('meta[name="viewport"]').attr("content") || "";
        const mobileViewport = viewportContent.includes("width=device-width");
        const robotsMeta = $('meta[name="robots"]').attr("content") || "";
        const isNoIndex = robotsMeta.toLowerCase().includes("noindex");
        const isNoFollow = robotsMeta.toLowerCase().includes("nofollow");

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
        const ogUrl = $('meta[property="og:url"]').attr("content") || "";
        const ogSiteName = $('meta[property="og:site_name"]').attr("content") || "";
        const twitterCard = $('meta[name="twitter:card"]').attr("content") || "";
        const twitterImage = $('meta[name="twitter:image"]').attr("content") || "";
        const twitterTitle = $('meta[name="twitter:title"]').attr("content") || "";
        const twitterDesc = $('meta[name="twitter:description"]').attr("content") || "";
        const twitterSite = $('meta[name="twitter:site"]').attr("content") || "";

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
        const hasAppleTouchIcon = $('link[rel*="apple-touch-icon"]').length > 0;
        const themeColor = $('meta[name="theme-color"]').attr("content") || "";
        const hasThemeColor = !!themeColor;
        const hasPreconnect = $('link[rel="preconnect"]').length > 0;
        const hasDnsPrefetch = $('link[rel="dns-prefetch"]').length > 0;
        const ampLink = $('link[rel="amphtml"]').length > 0;
        const hasPaginationNext = $('link[rel="next"]').length > 0;
        const hasPaginationPrev = $('link[rel="prev"]').length > 0;

        let mixedContentCount = 0;
        if (hasSSL) {
            $("img[src], script[src], link[href]").each((_, el) => {
                const src = $(el).attr("src") || $(el).attr("href") || "";
                if (src.startsWith("http://")) mixedContentCount++;
            });
        }

        let blockingScripts = 0, totalScripts = 0, inlineScripts = 0;
        $("script").each((_, el) => {
            totalScripts++;
            if (!$(el).attr("src")) { inlineScripts++; return; }
        });
        $("head script[src]").each((_, el) => {
            if (!$(el).attr("async") && !$(el).attr("defer")) blockingScripts++;
        });

        let externalStylesheets = 0, blockingStyles = 0;
        $('link[rel="stylesheet"]').each((_, el) => {
            externalStylesheets++;
            if (!$(el).attr("media") || $(el).attr("media") === "all") blockingStyles++;
        });

        let inlineStyleCount = 0;
        $("[style]").each(() => inlineStyleCount++);

        let deprecatedTagCount = 0;
        ["font", "center", "strike", "big", "tt", "marquee", "blink", "frame", "frameset"].forEach(tag => {
            deprecatedTagCount += $(tag).length;
        });

        const contentToCodeRatio = Math.round((bodyText.length / Math.max(html.length, 1)) * 100);
        const paragraphCount = $("p").length;
        const listCount = $("ul, ol").length;
        const sentences = bodyText.split(/[.!?]+/).filter(s => s.trim().split(" ").length >= 5);
        const avgWordsPerSentence = sentences.length > 0 ? Math.round(wordCount / sentences.length) : 0;
        const readabilityLabel = avgWordsPerSentence <= 15 ? "Easy" : avgWordsPerSentence <= 25 ? "Moderate" : "Difficult";

        const urlLength = finalUrl.length;
        const urlHasUpperCase = /[A-Z]/.test(urlObj.pathname);
        const urlHasSpecialChars = /[^a-zA-Z0-9\-_\/.?=&#%]/.test(urlObj.pathname);
        const urlHasUnderscore = urlObj.pathname.includes("_");

        const isArabicContent = /[\u0600-\u06FF]/.test(bodyText.substring(0, 1000));
        const hasRtlDir = htmlDir === "rtl";
        const hasArHreflang = hreflangTags.some(h => h.startsWith("ar"));

        const hasXFrameOptions = !!responseHeaders["x-frame-options"];
        const hasXContentTypeOptions = !!responseHeaders["x-content-type-options"];
        const hasHSTS = !!responseHeaders["strict-transport-security"];
        const hasCSP = !!responseHeaders["content-security-policy"];
        const hasReferrerPolicy = !!responseHeaders["referrer-policy"];
        const hasPermissionsPolicy = !!(responseHeaders["permissions-policy"] || responseHeaders["feature-policy"]);
        const hasXXSSProtection = !!responseHeaders["x-xss-protection"];
        const serverHeader = responseHeaders["server"] || responseHeaders["x-powered-by"] || "";
        const exposesServer = serverHeader.length > 0;

        const contentEncoding = responseHeaders["content-encoding"] || "";
        const hasCompression = contentEncoding.includes("gzip") || contentEncoding.includes("br") || contentEncoding.includes("zstd");
        const compressionType = contentEncoding || "none";
        const cacheControl = responseHeaders["cache-control"] || "";
        const hasCache = cacheControl.length > 0;
        const hasEtag = !!responseHeaders["etag"];

        const hasBreadcrumb = schemaTypes.some(t => t.toLowerCase().includes("breadcrumb"));
        const hasOrgSchema = schemaTypes.some(t => ["organization", "localbusiness", "website"].includes(t.toLowerCase()));
        const hasFaqSchema = schemaTypes.some(t => t.toLowerCase().includes("faq"));
        const hasArticleSchema = schemaTypes.some(t => ["article", "newsarticle", "blogposting"].includes(t.toLowerCase()));
        const hasProductSchema = schemaTypes.some(t => t.toLowerCase().includes("product"));

        // ── 5. Build all issues ─────────────────────────────────────────────
        const issues: SiteIssue[] = [];
        const add = (issue: SiteIssue) => issues.push(issue);

        // ─── CRAWLABILITY ───────────────────────────────────────────────────
        add({ id: "robots_txt", category: "Crawlability",
            severity: robotsExists ? "pass" : "warning",
            title: "Robots.txt File",
            description: robotsExists
                ? `robots.txt found (${robotsDisallowedPaths.length} disallow rules, ${robotsUserAgents.length} user-agent(s))`
                : `robots.txt not found (HTTP ${robotsStatusCode || "unreachable"})`,
            recommendation: robotsExists ? "" : "Create a robots.txt file to guide search engine crawlers.",
            codeSnippet: !robotsExists ? `# robots.txt\nUser-agent: *\nAllow: /\n\nUser-agent: Googlebot\nAllow: /\n\nSitemap: https://${baseHost}/sitemap.xml` : undefined,
        });

        add({ id: "robots_blocks_all", category: "Crawlability",
            severity: robotsBlocksAllBots ? "error" : "pass",
            title: "Robots.txt — All Bots Disallowed",
            description: robotsBlocksAllBots
                ? "CRITICAL: robots.txt has 'Disallow: /' for User-agent: * — blocking ALL crawlers!"
                : robotsExists ? "robots.txt does not block all crawlers ✓" : "N/A — robots.txt missing",
            recommendation: robotsBlocksAllBots ? "Remove 'Disallow: /' from User-agent: * in robots.txt. This is blocking your entire site from being indexed." : "",
        });

        add({ id: "robots_blocks_googlebot", category: "Crawlability",
            severity: robotsBlocksGooglebot ? "error" : "pass",
            title: "Robots.txt — Googlebot Blocked",
            description: robotsBlocksGooglebot
                ? "CRITICAL: Googlebot is explicitly blocked in robots.txt!"
                : "Googlebot is not specifically blocked ✓",
            recommendation: robotsBlocksGooglebot ? "Remove the Googlebot Disallow rule immediately. Google cannot index your site." : "",
        });

        add({ id: "robots_blocks_assets", category: "Crawlability",
            severity: robotsBlocksImportantPaths ? "warning" : "pass",
            title: "Robots.txt — CSS/JS/Images Blocked",
            description: robotsBlocksImportantPaths
                ? `Static resources (CSS, JS, images) are blocked in robots.txt`
                : "Static resources are crawlable ✓",
            recommendation: robotsBlocksImportantPaths ? "Google needs to render your page CSS and JS for proper indexing. Unblock these in robots.txt." : "",
        });

        add({ id: "robots_crawl_delay", category: "Crawlability",
            severity: robotsCrawlDelay > 10 ? "warning" : robotsCrawlDelay > 0 ? "notice" : "pass",
            title: "Robots.txt — Crawl-Delay",
            description: robotsCrawlDelay > 0
                ? `Crawl-delay: ${robotsCrawlDelay}s set${robotsCrawlDelay > 10 ? " — very high, slowing down indexing" : ""}`
                : "No crawl-delay set (Google ignores it anyway) ✓",
            recommendation: robotsCrawlDelay > 10 ? "High crawl-delay significantly slows down indexing. Note: Googlebot ignores crawl-delay, but Bingbot and others respect it." : "",
        });

        add({ id: "robots_sitemap_listed", category: "Crawlability",
            severity: robotsSitemapUrls.length > 0 ? "pass" : robotsExists ? "warning" : "notice",
            title: "Robots.txt — Sitemap Declaration",
            description: robotsSitemapUrls.length > 0
                ? `Sitemap(s) declared: ${robotsSitemapUrls.slice(0, 2).join(", ")}`
                : robotsExists ? "No Sitemap directive in robots.txt" : "robots.txt missing",
            recommendation: robotsSitemapUrls.length === 0 && robotsExists ? "Add 'Sitemap: https://yourdomain.com/sitemap.xml' to your robots.txt file." : "",
            codeSnippet: robotsSitemapUrls.length === 0 && robotsExists ? `# Add to bottom of robots.txt\nSitemap: https://${baseHost}/sitemap.xml` : undefined,
        });

        add({ id: "sitemap", category: "Crawlability",
            severity: sitemapExists ? "pass" : "error",
            title: "XML Sitemap",
            description: sitemapExists
                ? `XML sitemap valid (${sitemapIsSitemapIndex ? "sitemap index" : sitemapPageCount + " URLs"}${sitemapHasImages ? ", +images" : ""}${sitemapHasNews ? ", +news" : ""})`
                : "XML sitemap not found at " + sitemapUrl,
            recommendation: sitemapExists ? "" : "Create an XML sitemap and submit it to Google Search Console.",
            codeSnippet: !sitemapExists ? `<!-- Basic sitemap.xml structure -->\n<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${finalUrl}</loc>\n    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n</urlset>` : undefined,
        });

        add({ id: "sitemap_current_page", category: "Crawlability",
            severity: sitemapExists ? (sitemapCurrentPageListed ? "pass" : "warning") : "notice",
            title: "Current Page in Sitemap",
            description: !sitemapExists ? "Sitemap not found" : sitemapCurrentPageListed
                ? "This page URL is listed in the sitemap ✓"
                : "This page is NOT listed in the sitemap",
            recommendation: sitemapExists && !sitemapCurrentPageListed ? "Add the current page URL to your sitemap. Pages missing from sitemaps may be crawled less frequently." : "",
        });

        add({ id: "sitemap_lastmod", category: "Crawlability",
            severity: sitemapExists ? (sitemapHasLastmod ? "pass" : "notice") : "notice",
            title: "Sitemap Lastmod Dates",
            description: !sitemapExists ? "N/A" : sitemapHasLastmod
                ? `lastmod present — newest: ${sitemapNewestLastmod || "unknown"}`
                : "No <lastmod> dates in sitemap",
            recommendation: sitemapExists && !sitemapHasLastmod ? "Add <lastmod> dates to sitemap entries. This helps Googlebot prioritize recently updated pages." : "",
        });

        add({ id: "sitemap_quality", category: "Crawlability",
            severity: sitemapExists ? (sitemapHasChangefreq && sitemapHasPriority ? "pass" : "notice") : "notice",
            title: "Sitemap Quality Signals",
            description: !sitemapExists ? "N/A" : `changefreq: ${sitemapHasChangefreq ? "✓" : "✗"} | priority: ${sitemapHasPriority ? "✓" : "✗"} | images: ${sitemapHasImages ? "✓" : "✗"}`,
            recommendation: sitemapExists && (!sitemapHasChangefreq || !sitemapHasPriority) ? "Add <changefreq> and <priority> to sitemap URLs to help search engines understand update frequency and importance." : "",
        });

        add({ id: "canonical", category: "Crawlability",
            severity: canonical ? "pass" : "warning",
            title: "Canonical Tag",
            description: canonical ? `Canonical: ${canonical}` : "No canonical tag found — duplicate content risk",
            recommendation: canonical ? "" : "Add a canonical tag to prevent duplicate content penalties.",
            codeSnippet: !canonical ? `<link rel="canonical" href="${finalUrl}" />` : undefined,
        });

        add({ id: "noindex_check", category: "Crawlability",
            severity: isNoIndex ? "error" : "pass",
            title: "Page Indexability",
            description: isNoIndex ? "noindex detected — this page is HIDDEN from Google!" : "Page is fully indexable",
            recommendation: isNoIndex ? "Remove noindex from the robots meta tag if this page should appear in search results." : "",
        });

        add({ id: "nofollow_page", category: "Crawlability",
            severity: isNoFollow ? "warning" : "pass",
            title: "Page-Level Nofollow",
            description: isNoFollow ? "nofollow in robots meta — all links on page are ignored by Google" : "Link equity flows normally from this page",
            recommendation: isNoFollow ? "Remove nofollow from robots meta unless you intentionally want to block link equity passing." : "",
        });

        add({ id: "url_length", category: "Crawlability",
            severity: urlLength > 115 ? "warning" : "pass",
            title: "URL Length",
            description: `URL is ${urlLength} characters${urlLength > 115 ? " — exceeds the 115-char recommendation" : ""}`,
            recommendation: urlLength > 115 ? "Shorten the URL. Use hyphens and remove stop words and unnecessary parameters." : "",
        });

        add({ id: "url_structure", category: "Crawlability",
            severity: urlHasUpperCase ? "warning" : urlHasSpecialChars ? "warning" : urlHasUnderscore ? "notice" : "pass",
            title: "URL Structure Quality",
            description: urlHasUpperCase ? "URL contains uppercase letters" : urlHasSpecialChars ? "URL contains special characters" : urlHasUnderscore ? "URL uses underscores (prefer hyphens)" : "URL is clean and SEO-friendly",
            recommendation: urlHasUpperCase ? "Use lowercase-only URLs. Uppercase causes duplicate content issues." : urlHasSpecialChars ? "Remove special characters. Use only letters, numbers and hyphens." : urlHasUnderscore ? "Replace underscores with hyphens — Google treats hyphens as word separators." : "",
        });

        add({ id: "ssl", category: "Crawlability",
            severity: hasSSL ? "pass" : "error",
            title: "HTTPS / SSL",
            description: hasSSL ? "Site is served over HTTPS (encrypted)" : "Site is NOT using HTTPS — confirmed Google ranking penalty!",
            recommendation: hasSSL ? "" : "Install an SSL certificate and redirect all HTTP traffic to HTTPS immediately.",
        });

        // ─── ON-PAGE ────────────────────────────────────────────────────────
        add({ id: "title_present", category: "On-Page",
            severity: title ? "pass" : "error",
            title: "Title Tag",
            description: title ? `"${title.substring(0, 70)}${title.length > 70 ? "..." : ""}" (${title.length} chars)` : "No <title> tag found!",
            recommendation: title ? "" : "Add a unique, descriptive title tag between 50-60 characters including your primary keyword.",
            codeSnippet: !title ? `<title>Primary Keyword - Brand Name | Page Purpose</title>` : undefined,
        });

        add({ id: "title_length", category: "On-Page",
            severity: !title ? "error" : (title.length < 30 || title.length > 60) ? "warning" : "pass",
            title: "Title Tag Length",
            description: !title ? "Missing title" : `${title.length} chars — ${title.length < 30 ? "too short (under 30)" : title.length > 60 ? "too long (will be truncated in Google)" : "optimal length ✓"}`,
            recommendation: title.length > 0 && title.length < 30 ? "Expand title to 50-60 characters. Include your primary keyword." : title.length > 60 ? "Trim title to under 60 characters. Google truncates anything longer." : "",
        });

        add({ id: "meta_desc_present", category: "On-Page",
            severity: metaDesc ? "pass" : "error",
            title: "Meta Description",
            description: metaDesc ? `"${metaDesc.substring(0, 100)}${metaDesc.length > 100 ? "..." : ""}" (${metaDesc.length} chars)` : "No meta description found!",
            recommendation: metaDesc ? "" : "Add a compelling meta description (140-160 chars) with a clear CTA. It directly impacts CTR.",
            codeSnippet: !metaDesc ? `<meta name="description" content="Your compelling description here. Include target keyword and clear call-to-action. (140-160 chars)" />` : undefined,
        });

        add({ id: "meta_desc_length", category: "On-Page",
            severity: !metaDesc ? "error" : (metaDesc.length < 70 || metaDesc.length > 160) ? "warning" : "pass",
            title: "Meta Description Length",
            description: !metaDesc ? "Missing meta description" : `${metaDesc.length} chars — ${metaDesc.length < 70 ? "too short (under 70)" : metaDesc.length > 160 ? "may be truncated in SERPs" : "optimal length ✓"}`,
            recommendation: metaDesc.length > 0 && metaDesc.length < 70 ? "Expand to 140-160 characters. Include keywords and a strong CTA." : metaDesc.length > 160 ? "Trim to under 160 characters to prevent truncation." : "",
        });

        add({ id: "h1_present", category: "On-Page",
            severity: h1s.length > 0 ? "pass" : "error",
            title: "H1 Heading",
            description: h1s.length > 0 ? `"${h1s[0]?.substring(0, 60)}${(h1s[0]?.length || 0) > 60 ? "..." : ""}"` : "No H1 heading found — critical SEO issue!",
            recommendation: h1s.length === 0 ? "Add exactly one H1 heading containing your primary keyword." : "",
            codeSnippet: h1s.length === 0 ? `<h1>Your Primary Keyword — Descriptive Page Title</h1>` : undefined,
        });

        add({ id: "h1_unique", category: "On-Page",
            severity: h1s.length > 1 ? "warning" : "pass",
            title: "Single H1 Rule",
            description: h1s.length > 1 ? `${h1s.length} H1 tags found — only one is allowed per page` : h1s.length === 1 ? "Exactly one H1 tag ✓" : "No H1 found",
            recommendation: h1s.length > 1 ? "Use only one H1. Convert additional H1s to H2 or H3." : "",
        });

        add({ id: "h2_tags", category: "On-Page",
            severity: h2Count >= 2 ? "pass" : h2Count === 1 ? "notice" : "warning",
            title: "H2 Headings",
            description: `${h2Count} H2 heading(s) found${h2Count < 2 ? " — needs better structure" : ""}`,
            recommendation: h2Count < 2 ? "Add 2-5 H2 headings to structure your content and include secondary keywords." : "",
        });

        add({ id: "heading_hierarchy", category: "On-Page",
            severity: hasH3WithoutH2 ? "warning" : "pass",
            title: "Heading Hierarchy",
            description: hasH3WithoutH2 ? "H3 tags present without H2 — broken hierarchy" : "Heading hierarchy is properly structured ✓",
            recommendation: hasH3WithoutH2 ? "Follow H1 → H2 → H3 order. Never skip heading levels." : "",
        });

        add({ id: "html_lang", category: "On-Page",
            severity: htmlLang ? "pass" : "error",
            title: "HTML Language Attribute",
            description: htmlLang ? `lang="${htmlLang}" set on <html>` : "No lang attribute on <html> element",
            recommendation: htmlLang ? "" : "Add lang attribute so search engines and screen readers know the page language.",
            codeSnippet: !htmlLang ? `<html lang="${isArabicContent ? "ar" : "en"}" ${isArabicContent ? 'dir="rtl"' : ""}>` : undefined,
        });

        add({ id: "hreflang", category: "On-Page",
            severity: hreflangTags.length > 0 ? "pass" : "notice",
            title: "Hreflang Tags",
            description: hreflangTags.length > 0 ? `${hreflangTags.length} hreflang tag(s): ${hreflangTags.slice(0, 5).join(", ")}` : "No hreflang tags — international targeting not configured",
            recommendation: hreflangTags.length === 0 ? "Add hreflang tags if the site serves multiple languages or regions." : "",
            codeSnippet: hreflangTags.length === 0 ? `<link rel="alternate" hreflang="en" href="https://${baseHost}/en/" />\n<link rel="alternate" hreflang="ar" href="https://${baseHost}/ar/" />\n<link rel="alternate" hreflang="x-default" href="https://${baseHost}/" />` : undefined,
        });

        if (isArabicContent || htmlLang.startsWith("ar")) {
            add({ id: "arabic_rtl", category: "On-Page",
                severity: hasRtlDir ? "pass" : "warning",
                title: "Arabic RTL Direction",
                description: hasRtlDir ? 'dir="rtl" correctly set on <html>' : 'Arabic content detected but dir="rtl" is missing',
                recommendation: !hasRtlDir ? 'Add dir="rtl" to your <html> tag for correct Arabic text rendering and RTL layout.' : "",
                codeSnippet: !hasRtlDir ? `<html lang="ar" dir="rtl">` : undefined,
            });

            add({ id: "arabic_hreflang", category: "On-Page",
                severity: hasArHreflang ? "pass" : "notice",
                title: "Arabic Hreflang",
                description: hasArHreflang ? "Arabic hreflang tag found ✓" : "No Arabic-specific hreflang tag",
                recommendation: !hasArHreflang ? "Add Arabic hreflang for proper targeting of Arabic-speaking markets (ar, ar-SA, ar-EG, etc.)" : "",
                codeSnippet: !hasArHreflang ? `<link rel="alternate" hreflang="ar" href="https://${baseHost}/" />\n<link rel="alternate" hreflang="ar-SA" href="https://${baseHost}/sa/" />` : undefined,
            });
        }

        add({ id: "meta_keywords", category: "On-Page",
            severity: metaKeywords ? "notice" : "pass",
            title: "Meta Keywords Tag",
            description: metaKeywords ? `meta keywords present: "${metaKeywords.substring(0, 80)}" — this tag is obsolete` : "No meta keywords tag (correct — it's obsolete)",
            recommendation: metaKeywords ? "Remove the meta keywords tag. Google ignores it, Bing may use it as a spam signal." : "",
        });

        // ─── CONTENT ────────────────────────────────────────────────────────
        add({ id: "word_count", category: "Content",
            severity: wordCount >= 800 ? "pass" : wordCount >= 300 ? "warning" : "error",
            title: "Content Depth",
            description: `${wordCount.toLocaleString()} words — ${wordCount < 300 ? "dangerously thin (< 300)" : wordCount < 800 ? "below recommended 800+" : wordCount >= 2000 ? "excellent depth" : "good depth"}`,
            recommendation: wordCount < 300 ? "Add substantial content. Thin pages almost never rank. Aim for 800+ words minimum." : wordCount < 800 ? "Expand content to 800+ words. Longer, in-depth content tends to rank higher." : "",
        });

        add({ id: "content_code_ratio", category: "Content",
            severity: contentToCodeRatio >= 15 ? "pass" : contentToCodeRatio >= 8 ? "warning" : "error",
            title: "Content-to-Code Ratio",
            description: `${contentToCodeRatio}% — ${contentToCodeRatio < 8 ? "too much code, too little content" : contentToCodeRatio < 15 ? "below optimal (aim for 15%+)" : "healthy ratio ✓"}`,
            recommendation: contentToCodeRatio < 15 ? "Reduce inline scripts/styles and increase visible content. High code bloat dilutes content signals." : "",
        });

        add({ id: "readability", category: "Content",
            severity: readabilityLabel === "Easy" ? "pass" : readabilityLabel === "Moderate" ? "notice" : "warning",
            title: "Readability Score",
            description: `${readabilityLabel} — avg. ${avgWordsPerSentence} words/sentence${readabilityLabel === "Difficult" ? " (too complex)" : ""}`,
            recommendation: readabilityLabel === "Difficult" ? "Break long sentences into shorter ones (aim for 15-20 words/sentence). Use simpler vocabulary." : "",
        });

        add({ id: "content_structure", category: "Content",
            severity: paragraphCount >= 3 && listCount >= 1 ? "pass" : paragraphCount >= 1 ? "notice" : "warning",
            title: "Content Structure",
            description: `${paragraphCount} paragraphs, ${listCount} list(s) — ${paragraphCount < 3 ? "needs more paragraph structure" : "structured content ✓"}`,
            recommendation: paragraphCount < 3 ? "Use more paragraphs, bullet lists and numbered lists to improve readability and structure." : "",
        });

        add({ id: "images_alt_missing", category: "Content",
            severity: missingAlt > 0 ? "error" : "pass",
            title: "Missing Image Alt Text",
            description: missingAlt > 0 ? `${missingAlt}/${totalImages} images are missing alt attribute` : totalImages === 0 ? "No images on page" : "All images have alt attributes ✓",
            recommendation: missingAlt > 0 ? "Add descriptive alt text to all images. Critical for accessibility and image search SEO." : "",
            codeSnippet: missingAlt > 0 ? `<!-- Before -->\n<img src="photo.jpg">\n\n<!-- After -->\n<img src="photo.jpg" alt="Descriptive text about the image" />` : undefined,
            affectedCount: missingAlt,
        });

        add({ id: "images_alt_empty", category: "Content",
            severity: emptyAlt > 3 ? "warning" : emptyAlt > 0 ? "notice" : "pass",
            title: "Empty Image Alt Text",
            description: emptyAlt > 0 ? `${emptyAlt} image(s) have empty alt=""` : "No images with empty alt",
            recommendation: emptyAlt > 0 ? 'Use descriptive alt text. Only use empty alt="" for purely decorative images.' : "",
            affectedCount: emptyAlt,
        });

        add({ id: "internal_links", category: "Content",
            severity: internalLinks >= 3 ? "pass" : internalLinks >= 1 ? "warning" : "error",
            title: "Internal Linking",
            description: `${internalLinks} internal link(s) found`,
            recommendation: internalLinks < 3 ? "Add 3-10 relevant internal links per page. Internal linking distributes PageRank and improves crawl depth." : "",
        });

        add({ id: "external_links", category: "Content",
            severity: externalLinks >= 1 ? "pass" : "notice",
            title: "External (Outbound) Links",
            description: `${externalLinks} external link(s) — ${externalLinks === 0 ? "no outbound links" : "good outbound linking ✓"}`,
            recommendation: externalLinks === 0 ? "Link to authoritative external sources (Wikipedia, studies, official sites) to improve content credibility." : "",
        });

        // ─── TECHNICAL ──────────────────────────────────────────────────────
        add({ id: "viewport", category: "Technical",
            severity: hasViewport ? (mobileViewport ? "pass" : "warning") : "error",
            title: "Mobile Viewport",
            description: hasViewport ? `viewport: "${viewportContent}"` : "No viewport meta tag — mobile users will see a broken layout!",
            recommendation: !hasViewport ? "Add the viewport meta tag. Without it, your site fails on mobile." : !mobileViewport ? "Include width=device-width in your viewport content." : "",
            codeSnippet: !hasViewport ? `<meta name="viewport" content="width=device-width, initial-scale=1.0" />` : undefined,
        });

        add({ id: "charset", category: "Technical",
            severity: hasCharset ? "pass" : "warning",
            title: "Character Encoding",
            description: hasCharset ? "UTF-8 charset declared ✓" : "No charset declaration",
            recommendation: !hasCharset ? "Add charset declaration to prevent text encoding issues." : "",
            codeSnippet: !hasCharset ? `<meta charset="UTF-8" />` : undefined,
        });

        add({ id: "doctype", category: "Technical",
            severity: hasDoctype ? "pass" : "warning",
            title: "HTML5 Doctype",
            description: hasDoctype ? "<!DOCTYPE html> present ✓" : "DOCTYPE declaration missing",
            recommendation: !hasDoctype ? "Add <!DOCTYPE html> as the very first line of your HTML document." : "",
            codeSnippet: !hasDoctype ? `<!DOCTYPE html>` : undefined,
        });

        add({ id: "favicon", category: "Technical",
            severity: hasFavicon ? "pass" : "notice",
            title: "Favicon",
            description: hasFavicon ? "Favicon link tag found ✓" : "No favicon detected",
            recommendation: !hasFavicon ? "Add a favicon for brand recognition in browser tabs, bookmarks, and mobile home screens." : "",
            codeSnippet: !hasFavicon ? `<link rel="icon" type="image/png" href="/favicon.png" sizes="32x32" />\n<link rel="icon" type="image/svg+xml" href="/favicon.svg" />` : undefined,
        });

        add({ id: "apple_touch_icon", category: "Technical",
            severity: hasAppleTouchIcon ? "pass" : "notice",
            title: "Apple Touch Icon",
            description: hasAppleTouchIcon ? "Apple touch icon found ✓" : "No apple-touch-icon set",
            recommendation: !hasAppleTouchIcon ? "Add an Apple touch icon (180×180px) for iOS home screen bookmarks." : "",
            codeSnippet: !hasAppleTouchIcon ? `<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />` : undefined,
        });

        add({ id: "theme_color", category: "Technical",
            severity: hasThemeColor ? "pass" : "notice",
            title: "Theme Color",
            description: hasThemeColor ? `theme-color: "${themeColor}" ✓` : "No theme-color meta tag",
            recommendation: !hasThemeColor ? "Add a theme-color meta tag to customize the browser UI color on mobile." : "",
            codeSnippet: !hasThemeColor ? `<meta name="theme-color" content="#your-brand-color" />` : undefined,
        });

        add({ id: "html_size", category: "Technical",
            severity: htmlSizeKb > 500 ? "error" : htmlSizeKb > 200 ? "warning" : "pass",
            title: "HTML Page Size",
            description: `${htmlSizeKb}KB${htmlSizeKb > 200 ? " — excessive file size" : " — acceptable"}`,
            recommendation: htmlSizeKb > 500 ? "Minify HTML, move inline JS/CSS to external files. Target < 100KB." : htmlSizeKb > 200 ? "Consider optimizing — aim for under 100KB for fast initial load." : "",
        });

        add({ id: "deprecated_tags", category: "Technical",
            severity: deprecatedTagCount > 0 ? "warning" : "pass",
            title: "Deprecated HTML Tags",
            description: deprecatedTagCount > 0 ? `${deprecatedTagCount} deprecated HTML tag(s) found (font, center, strike, etc.)` : "No deprecated HTML tags ✓",
            recommendation: deprecatedTagCount > 0 ? "Replace deprecated HTML tags with CSS. Using old tags hurts semantic quality." : "",
            affectedCount: deprecatedTagCount,
        });

        add({ id: "mixed_content", category: "Technical",
            severity: mixedContentCount > 0 ? "error" : "pass",
            title: "Mixed Content",
            description: mixedContentCount > 0 ? `${mixedContentCount} HTTP resource(s) loaded on an HTTPS page` : hasSSL ? "No mixed content ✓" : "N/A (not using HTTPS)",
            recommendation: mixedContentCount > 0 ? "Update all resource URLs from HTTP to HTTPS. Mixed content triggers browser security warnings." : "",
            affectedCount: mixedContentCount,
        });

        add({ id: "preconnect", category: "Technical",
            severity: hasPreconnect || hasDnsPrefetch ? "pass" : "notice",
            title: "Resource Hints (Preconnect)",
            description: hasPreconnect ? "preconnect hints found ✓" : hasDnsPrefetch ? "dns-prefetch hints found ✓" : "No preconnect or dns-prefetch hints",
            recommendation: !hasPreconnect && !hasDnsPrefetch ? "Add preconnect hints for third-party origins (fonts, analytics, CDNs) to reduce connection overhead." : "",
            codeSnippet: !hasPreconnect ? `<link rel="preconnect" href="https://fonts.googleapis.com" />\n<link rel="preconnect" href="https://www.google-analytics.com" />` : undefined,
        });

        // ─── LINKS ──────────────────────────────────────────────────────────
        add({ id: "empty_anchors", category: "Links",
            severity: emptyAnchors > 3 ? "warning" : emptyAnchors > 0 ? "notice" : "pass",
            title: "Empty Anchor Text",
            description: emptyAnchors > 0 ? `${emptyAnchors} link(s) have no anchor text (bad for accessibility & SEO)` : "All links have descriptive anchor text ✓",
            recommendation: emptyAnchors > 0 ? "Add meaningful anchor text to all links. 'Click here' and empty links waste link equity." : "",
            affectedCount: emptyAnchors,
        });

        add({ id: "noopener_external", category: "Links",
            severity: noopenerExternal > 0 ? "warning" : "pass",
            title: "External Links Security (noopener)",
            description: noopenerExternal > 0 ? `${noopenerExternal} external link(s) with target="_blank" missing rel="noopener"` : "All external links properly secured ✓",
            recommendation: noopenerExternal > 0 ? "Add rel=\"noopener noreferrer\" to all external links with target=\"_blank\" to prevent reverse tabnapping." : "",
            codeSnippet: noopenerExternal > 0 ? `<!-- Before -->\n<a href="https://external.com" target="_blank">Link</a>\n\n<!-- After -->\n<a href="https://external.com" target="_blank" rel="noopener noreferrer">Link</a>` : undefined,
            affectedCount: noopenerExternal,
        });

        add({ id: "nofollow_count", category: "Links",
            severity: nofollowLinks > internalLinks * 0.5 && nofollowLinks > 3 ? "warning" : "pass",
            title: "Nofollow Links",
            description: nofollowLinks > 0 ? `${nofollowLinks} link(s) with rel="nofollow"` : "No nofollow links on this page",
            recommendation: nofollowLinks > internalLinks * 0.5 ? "Too many nofollow internal links can wastefully block PageRank flow. Review your nofollow strategy." : "",
            affectedCount: nofollowLinks,
        });

        add({ id: "link_ratio", category: "Links",
            severity: externalLinks > internalLinks * 2 && externalLinks > 10 ? "warning" : "pass",
            title: "Internal vs External Link Ratio",
            description: `${internalLinks} internal / ${externalLinks} external links`,
            recommendation: externalLinks > internalLinks * 2 && externalLinks > 10 ? "You're linking out more than linking internally. Add more internal links to keep users on your site." : "",
        });

        add({ id: "lazy_loading", category: "Links",
            severity: totalImages > 3 && lazyImages === 0 ? "notice" : "pass",
            title: "Image Lazy Loading",
            description: totalImages === 0 ? "No images on page" : lazyImages > 0 ? `${lazyImages}/${totalImages} images use lazy loading ✓` : "No images use lazy loading",
            recommendation: totalImages > 3 && lazyImages === 0 ? "Add loading=\"lazy\" to below-the-fold images to defer loading and improve page speed." : "",
            codeSnippet: totalImages > 3 && lazyImages === 0 ? `<img src="image.jpg" alt="Description" loading="lazy" />` : undefined,
        });

        // ─── PERFORMANCE ────────────────────────────────────────────────────
        add({ id: "compression", category: "Performance",
            severity: hasCompression ? "pass" : "error",
            title: "Gzip / Brotli Compression",
            description: hasCompression ? `Compression enabled (${compressionType}) ✓` : "No compression detected — files sent uncompressed!",
            recommendation: !hasCompression ? "Enable Gzip or Brotli compression on your server. This reduces transfer size by 60-80%." : "",
            codeSnippet: !hasCompression ? `# Apache .htaccess\n<IfModule mod_deflate.c>\n  AddOutputFilterByType DEFLATE text/html text/css application/javascript\n</IfModule>\n\n# Nginx\ngzip on;\ngzip_types text/html text/css application/javascript;` : undefined,
        });

        add({ id: "caching", category: "Performance",
            severity: hasCache ? "pass" : "warning",
            title: "Browser Caching (Cache-Control)",
            description: hasCache ? `Cache-Control: ${cacheControl}` : "No Cache-Control header found — browsers won't cache this page!",
            recommendation: !hasCache ? "Add Cache-Control headers to enable browser caching and reduce repeat load times." : "",
            codeSnippet: !hasCache ? `# Apache .htaccess\n<IfModule mod_expires.c>\n  ExpiresActive On\n  ExpiresByType text/html "access plus 1 hour"\n  ExpiresByType text/css "access plus 1 year"\n  ExpiresByType application/javascript "access plus 1 year"\n</IfModule>` : undefined,
        });

        add({ id: "etag", category: "Performance",
            severity: hasEtag ? "pass" : "notice",
            title: "ETag Header",
            description: hasEtag ? "ETag header present (conditional request support) ✓" : "No ETag header",
            recommendation: !hasEtag ? "Configure ETags on your server to enable efficient conditional HTTP requests." : "",
        });

        add({ id: "blocking_scripts", category: "Performance",
            severity: blockingScripts > 3 ? "warning" : blockingScripts > 0 ? "notice" : "pass",
            title: "Render-Blocking Scripts",
            description: blockingScripts > 0 ? `${blockingScripts} script(s) in <head> without async/defer — blocking page render` : "No render-blocking scripts ✓",
            recommendation: blockingScripts > 0 ? "Add async or defer to non-critical scripts. Render-blocking scripts directly delay First Contentful Paint." : "",
            codeSnippet: blockingScripts > 0 ? `<!-- Non-critical scripts -->\n<script src="analytics.js" defer></script>\n<script src="widget.js" async></script>` : undefined,
            affectedCount: blockingScripts,
        });

        add({ id: "blocking_styles", category: "Performance",
            severity: blockingStyles > 5 ? "warning" : "pass",
            title: "Stylesheet Count",
            description: `${externalStylesheets} external stylesheet(s)${blockingStyles > 5 ? " — too many blocking render" : ""}`,
            recommendation: blockingStyles > 5 ? "Consolidate multiple CSS files into one to reduce HTTP requests and render-blocking." : "",
            affectedCount: externalStylesheets,
        });

        add({ id: "inline_scripts", category: "Performance",
            severity: inlineScripts > 10 ? "warning" : inlineScripts > 3 ? "notice" : "pass",
            title: "Inline Scripts",
            description: `${inlineScripts} inline <script> block(s)${inlineScripts > 3 ? " — consider externalizing" : ""}`,
            recommendation: inlineScripts > 10 ? "Move inline scripts to external files. Inline scripts block the HTML parser and can't be cached." : "",
            affectedCount: inlineScripts,
        });

        add({ id: "inline_styles", category: "Performance",
            severity: inlineStyleCount > 20 ? "warning" : inlineStyleCount > 5 ? "notice" : "pass",
            title: "Inline Styles",
            description: `${inlineStyleCount} element(s) with inline style attribute${inlineStyleCount > 5 ? " — should use CSS classes" : ""}`,
            recommendation: inlineStyleCount > 20 ? "Replace inline styles with CSS classes. Inline styles override the cascade and can't be cached." : "",
            affectedCount: inlineStyleCount,
        });

        add({ id: "response_time", category: "Performance",
            severity: responseTime < 1000 ? "pass" : responseTime < 3000 ? "warning" : "error",
            title: "Server Response Time",
            description: `${responseTime}ms TTFB${responseTime >= 3000 ? " — critically slow" : responseTime >= 1000 ? " — needs improvement" : " — fast ✓"}`,
            recommendation: responseTime >= 1000 ? "Reduce server response time. Use caching, CDN, optimize database queries, or upgrade hosting." : "",
        });

        // ─── STRUCTURED DATA ────────────────────────────────────────────────
        add({ id: "schema_present", category: "Structured Data",
            severity: schemaTypes.length > 0 ? "pass" : "warning",
            title: "JSON-LD Structured Data",
            description: schemaTypes.length > 0 ? `Found: ${schemaTypes.join(", ")}` : "No JSON-LD structured data — missing rich result eligibility!",
            recommendation: schemaTypes.length === 0 ? "Add JSON-LD structured data. It's required for rich results (star ratings, FAQs, breadcrumbs) in Google." : "",
            codeSnippet: schemaTypes.length === 0 ? `<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "WebSite",\n  "name": "Your Brand",\n  "url": "${finalUrl}"\n}\n</script>` : undefined,
        });

        add({ id: "schema_website", category: "Structured Data",
            severity: hasOrgSchema ? "pass" : "notice",
            title: "Organization / Website Schema",
            description: hasOrgSchema ? "Organization or Website schema found ✓" : "No Organization/Website schema",
            recommendation: !hasOrgSchema ? "Add WebSite or Organization schema to establish brand presence in Google Knowledge Graph." : "",
            codeSnippet: !hasOrgSchema ? `<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "Organization",\n  "name": "Your Brand Name",\n  "url": "${finalUrl}",\n  "logo": "${finalUrl}logo.png"\n}\n</script>` : undefined,
        });

        add({ id: "breadcrumb_schema", category: "Structured Data",
            severity: hasBreadcrumb ? "pass" : "notice",
            title: "Breadcrumb Schema",
            description: hasBreadcrumb ? "BreadcrumbList schema ✓" : "No breadcrumb structured data",
            recommendation: !hasBreadcrumb ? "Add BreadcrumbList schema to enable breadcrumb navigation in Google SERPs." : "",
        });

        add({ id: "faq_schema", category: "Structured Data",
            severity: hasFaqSchema ? "pass" : "notice",
            title: "FAQ Schema",
            description: hasFaqSchema ? "FAQPage schema found — eligible for FAQ rich results ✓" : "No FAQ schema detected",
            recommendation: !hasFaqSchema ? "If page has Q&A content, add FAQPage schema to unlock FAQ rich results and potentially 2× more SERP space." : "",
        });

        add({ id: "schema_coverage", category: "Structured Data",
            severity: schemaTypes.length >= 3 ? "pass" : schemaTypes.length >= 1 ? "notice" : "warning",
            title: "Schema Coverage",
            description: schemaTypes.length >= 3 ? `${schemaTypes.length} schema types: excellent coverage` : schemaTypes.length === 0 ? "No structured data" : `Only ${schemaTypes.length} schema type(s)`,
            recommendation: schemaTypes.length < 3 ? "Aim for 3+ schema types relevant to your content (Organization, WebPage, Article, BreadcrumbList, FAQ)." : "",
        });

        // ─── SOCIAL ─────────────────────────────────────────────────────────
        add({ id: "og_title", category: "Social",
            severity: ogTitle ? "pass" : "warning",
            title: "Open Graph Title (og:title)",
            description: ogTitle ? `og:title: "${ogTitle.substring(0, 60)}${ogTitle.length > 60 ? "..." : ""}"` : "og:title not set",
            recommendation: !ogTitle ? "Add og:title for proper social media sharing. Without it, platforms use the page title — which may get truncated." : "",
            codeSnippet: !ogTitle ? `<meta property="og:title" content="Your Page Title Here" />` : undefined,
        });

        add({ id: "og_description", category: "Social",
            severity: ogDesc ? "pass" : "warning",
            title: "Open Graph Description",
            description: ogDesc ? `og:description (${ogDesc.length} chars)` : "og:description not set",
            recommendation: !ogDesc ? "Add og:description for compelling social media previews." : "",
            codeSnippet: !ogDesc ? `<meta property="og:description" content="Compelling description for social sharing (max 200 chars)" />` : undefined,
        });

        add({ id: "og_image", category: "Social",
            severity: ogImage ? "pass" : "error",
            title: "Open Graph Image",
            description: ogImage ? "og:image present ✓" : "og:image MISSING — social shares will show no image, killing click-through rates!",
            recommendation: !ogImage ? "Add og:image (1200×630px minimum). Posts without images get 3× fewer clicks on social media." : "",
            codeSnippet: !ogImage ? `<meta property="og:image" content="https://${baseHost}/og-image.jpg" />\n<meta property="og:image:width" content="1200" />\n<meta property="og:image:height" content="630" />` : undefined,
        });

        add({ id: "og_url_sitename", category: "Social",
            severity: (ogUrl && ogSiteName) ? "pass" : ogUrl || ogSiteName ? "notice" : "notice",
            title: "OG URL & Site Name",
            description: `og:url: ${ogUrl ? "✓" : "✗"} | og:site_name: ${ogSiteName ? "✓" : "✗"}`,
            recommendation: (!ogUrl || !ogSiteName) ? "Add og:url and og:site_name for complete Open Graph implementation." : "",
            codeSnippet: (!ogUrl || !ogSiteName) ? `<meta property="og:url" content="${finalUrl}" />\n<meta property="og:site_name" content="Your Brand Name" />` : undefined,
        });

        add({ id: "twitter_card", category: "Social",
            severity: twitterCard ? "pass" : "warning",
            title: "Twitter / X Card",
            description: twitterCard ? `twitter:card: "${twitterCard}" ✓` : "No Twitter Card tags — shares will show plain text only",
            recommendation: !twitterCard ? "Add Twitter Card meta tags for rich previews on X (Twitter)." : "",
            codeSnippet: !twitterCard ? `<meta name="twitter:card" content="summary_large_image" />\n<meta name="twitter:title" content="Page Title" />\n<meta name="twitter:description" content="Description" />\n<meta name="twitter:image" content="https://${baseHost}/twitter-card.jpg" />` : undefined,
        });

        add({ id: "twitter_completeness", category: "Social",
            severity: (twitterImage && twitterTitle && twitterDesc) ? "pass" : twitterCard ? "warning" : "notice",
            title: "Twitter Card Completeness",
            description: `twitter:title: ${twitterTitle ? "✓" : "✗"} | twitter:description: ${twitterDesc ? "✓" : "✗"} | twitter:image: ${twitterImage ? "✓" : "✗"} | twitter:site: ${twitterSite ? "✓" : "✗"}`,
            recommendation: twitterCard && (!twitterImage || !twitterTitle || !twitterDesc) ? "Complete all Twitter Card tags for maximum engagement on X platform." : "",
        });

        // ─── SECURITY ───────────────────────────────────────────────────────
        add({ id: "hsts", category: "Security",
            severity: hasSSL ? (hasHSTS ? "pass" : "warning") : "notice",
            title: "HSTS (HTTP Strict Transport Security)",
            description: hasHSTS ? "HSTS header present ✓" : hasSSL ? "HSTS header missing — HTTPS not enforced at protocol level" : "N/A — site not on HTTPS",
            recommendation: !hasHSTS && hasSSL ? "Add HSTS to enforce HTTPS even if someone types http://. Prevents SSL-stripping attacks." : "",
            codeSnippet: !hasHSTS && hasSSL ? `# Response Header\nStrict-Transport-Security: max-age=31536000; includeSubDomains; preload` : undefined,
        });

        add({ id: "x_frame_options", category: "Security",
            severity: hasXFrameOptions ? "pass" : "warning",
            title: "X-Frame-Options (Clickjacking)",
            description: hasXFrameOptions ? "X-Frame-Options set — clickjacking protected ✓" : "X-Frame-Options missing — site can be embedded in iframes!",
            recommendation: !hasXFrameOptions ? "Add X-Frame-Options to prevent your page from being embedded in malicious iframes." : "",
            codeSnippet: !hasXFrameOptions ? `# Response Header\nX-Frame-Options: SAMEORIGIN` : undefined,
        });

        add({ id: "x_content_type", category: "Security",
            severity: hasXContentTypeOptions ? "pass" : "warning",
            title: "X-Content-Type-Options (MIME Sniffing)",
            description: hasXContentTypeOptions ? "X-Content-Type-Options: nosniff ✓" : "X-Content-Type-Options missing — MIME sniffing attacks possible",
            recommendation: !hasXContentTypeOptions ? "Add X-Content-Type-Options: nosniff to prevent browsers from sniffing content type." : "",
            codeSnippet: !hasXContentTypeOptions ? `# Response Header\nX-Content-Type-Options: nosniff` : undefined,
        });

        add({ id: "csp", category: "Security",
            severity: hasCSP ? "pass" : "notice",
            title: "Content Security Policy (CSP)",
            description: hasCSP ? "Content-Security-Policy header present ✓" : "No CSP header — XSS attacks not mitigated at header level",
            recommendation: !hasCSP ? "Add a CSP header to prevent XSS and injection attacks. Start with report-only mode." : "",
            codeSnippet: !hasCSP ? `# Response Header (start permissive, then restrict)\nContent-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'` : undefined,
        });

        add({ id: "referrer_policy", category: "Security",
            severity: hasReferrerPolicy ? "pass" : "notice",
            title: "Referrer-Policy",
            description: hasReferrerPolicy ? "Referrer-Policy header set ✓" : "No Referrer-Policy header",
            recommendation: !hasReferrerPolicy ? "Add Referrer-Policy to control what URL information is sent with requests." : "",
            codeSnippet: !hasReferrerPolicy ? `# Response Header\nReferrer-Policy: strict-origin-when-cross-origin` : undefined,
        });

        add({ id: "permissions_policy", category: "Security",
            severity: hasPermissionsPolicy ? "pass" : "notice",
            title: "Permissions Policy",
            description: hasPermissionsPolicy ? "Permissions-Policy header set ✓" : "No Permissions-Policy header",
            recommendation: !hasPermissionsPolicy ? "Add Permissions-Policy to restrict which browser features (camera, mic, location) can be used." : "",
            codeSnippet: !hasPermissionsPolicy ? `# Response Header\nPermissions-Policy: camera=(), microphone=(), geolocation=()` : undefined,
        });

        add({ id: "server_exposure", category: "Security",
            severity: exposesServer ? "warning" : "pass",
            title: "Server Software Disclosure",
            description: exposesServer ? `Server header exposes: "${serverHeader}" — reveals attack surface` : "Server identity properly hidden ✓",
            recommendation: exposesServer ? "Remove or obfuscate the Server and X-Powered-By headers to hide your tech stack from attackers." : "",
        });

        // ── 6. Score calculation ────────────────────────────────────────────
        const errors = issues.filter(i => i.severity === "error").length;
        const warnings = issues.filter(i => i.severity === "warning").length;
        const notices = issues.filter(i => i.severity === "notice").length;
        const passed = issues.filter(i => i.severity === "pass").length;
        const total = issues.length;

        const rawScore = 100 - errors * 4 - warnings * 1.5 - notices * 0.3;
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

        // ── 8. SERP Preview ─────────────────────────────────────────────────
        const serpTitle = title.substring(0, 60) + (title.length > 60 ? "..." : "");
        const serpDesc = metaDesc ? metaDesc.substring(0, 155) + (metaDesc.length > 155 ? "..." : "") : "";
        const pathParts = urlObj.pathname.split("/").filter(Boolean);
        const breadcrumbs = [baseHost, ...pathParts];
        const displayUrl = breadcrumbs.slice(0, 4).join(" › ");
        const serpPreview: SerpPreview = { title: serpTitle || "(No title tag)", description: serpDesc, displayUrl, breadcrumbs };

        // ── 9. AI Quick Wins ────────────────────────────────────────────────
        let quickWins: QuickWin[] = [];
        try {
            const failedIssues = issues
                .filter(i => i.severity === "error" || i.severity === "warning")
                .slice(0, 15);
            const issueSummary = failedIssues.map(i => `[${i.severity.toUpperCase()}] ${i.title}: ${i.description}`).join("\n");
            const lang = htmlLang.startsWith("ar") ? "Arabic" : "English";

            const prompt = `You are an elite SEO consultant with 15+ years of experience. A site audit for ${finalUrl} found these issues:\n\n${issueSummary}\n\nBased on these findings, provide exactly 6 "Quick Wins" — the highest-impact, most actionable fixes in priority order.\nReturn ONLY a valid JSON array, no markdown, no explanation, no code blocks:\n[\n  {\n    "title": "<short action title in ${lang}, max 6 words>",\n    "impact": "high" | "medium" | "low",\n    "effort": "easy" | "medium" | "hard",\n    "description": "<one precise, actionable sentence: exactly what to do + the specific SEO benefit>",\n    "codeSnippet": "<optional: the exact HTML/config code to fix it, or null>"\n  }\n]`;

            const aiRaw = await claudeGenerate(prompt);
            const match = aiRaw.match(/\[[\s\S]*\]/);
            if (match) quickWins = JSON.parse(match[0]);
        } catch {}

        // ── 9.5 AI Competitors & Keywords ───────────────────────────────────
        let competitors: SiteCompetitor[] = [];
        let targetKeywords: TargetKeyword[] = [];
        try {
            const lang = htmlLang.startsWith("ar") ? "Arabic" : "English";
            const prompt = `You are a world-class SEO strategist. 
I am providing you with the h1 tag, and a 1000 character sample of a website's text content.
URL: ${finalUrl}
H1: ${h1s[0] || ""}
Sample Content: ${bodyText.substring(0, 1000)}...

Task:
1. Identify 3 to 5 real, top organic competitors for this exact niche.
2. Identify exactly 8 high-value SEO target keywords for this site.
Return ONLY a valid JSON object in this format (NO markdown, NO text outside json):
{
  "competitors": [
    { "domain": "example.com", "overlapReason": "Short explanation in ${lang}" }
  ],
  "keywords": [
    { "keyword": "search term", "intent": "Informational" | "Navigational" | "Commercial" | "Transactional", "volume": "e.g., 5.4K", "difficulty": "Low" | "Medium" | "High" }
  ]
}`;
            const aiMarketRaw = await claudeGenerate(prompt);
            const match = aiMarketRaw.match(/\{[\s\S]*\}/);
            if (match) {
                const parsed = JSON.parse(match[0]);
                competitors = parsed.competitors || [];
                targetKeywords = parsed.keywords || [];
            }
        } catch(e) {
            console.error("Market Intelligence Error:", e);
        }

        // ── 10. Build response ──────────────────────────────────────────────
        const rawMetrics = {
            title: { text: title, length: title.length },
            metaDesc: { text: metaDesc.substring(0, 200), length: metaDesc.length },
            metaKeywords: metaKeywords || null,
            headings: { h1: h1s.slice(0, 3), h2s: h2s.slice(0, 5), h2Count, h3Count, h4Count },
            images: { total: totalImages, missingAlt, emptyAlt, lazyImages, webpImages },
            links: { internal: internalLinks, external: externalLinks, empty: emptyAnchors, nofollow: nofollowLinks },
            wordCount,
            htmlSizeKb,
            ssl: hasSSL,
            canonical: canonical || null,
            robots: {
                exists: robotsExists,
                statusCode: robotsStatusCode,
                noindex: isNoIndex,
                nofollow: isNoFollow,
                blocksAllBots: robotsBlocksAllBots,
                blocksGooglebot: robotsBlocksGooglebot,
                blocksAssets: robotsBlocksImportantPaths,
                crawlDelay: robotsCrawlDelay,
                disallowCount: robotsDisallowedPaths.length,
                allowCount: robotsAllowedPaths.length,
                userAgents: robotsUserAgents.slice(0, 10),
                sitemapUrls: robotsSitemapUrls,
            },
            sitemap: {
                exists: sitemapExists,
                url: sitemapUrl,
                pageCount: sitemapPageCount,
                isSitemapIndex: sitemapIsSitemapIndex,
                hasLastmod: sitemapHasLastmod,
                hasImages: sitemapHasImages,
                hasNews: sitemapHasNews,
                hasVideo: sitemapHasVideo,
                currentPageListed: sitemapCurrentPageListed,
                newestLastmod: sitemapNewestLastmod,
                oldestLastmod: sitemapOldestLastmod,
            },
            htmlLang: htmlLang || null,
            hreflangTags,
            schemaTypes,
            og: { title: ogTitle, desc: ogDesc.substring(0, 200), image: ogImage, type: ogType, url: ogUrl, siteName: ogSiteName },
            twitter: { card: twitterCard, image: twitterImage, title: twitterTitle, site: twitterSite },
            security: { https: hasSSL, hsts: hasHSTS, xFrame: hasXFrameOptions, xContent: hasXContentTypeOptions, csp: hasCSP, referrerPolicy: hasReferrerPolicy, permissionsPolicy: hasPermissionsPolicy },
            performance: { blockingScripts, blockingStyles, mixedContent: mixedContentCount, inlineScripts, inlineStyleCount, responseTimeMs: responseTime },
        };

        const performanceSignals: PerformanceSignals = {
            compression: hasCompression,
            compressionType,
            caching: hasCache,
            cacheControl,
            etag: hasEtag,
            serverHeader: serverHeader || "hidden",
            blockingScripts,
            blockingStyles,
            totalScripts,
            totalStylesheets: externalStylesheets,
            inlineScripts,
            inlineStyles: inlineStyleCount,
            htmlSizeKb,
        };

        const contentQuality: ContentQuality = {
            wordCount,
            contentToCodeRatio,
            avgWordsPerSentence,
            readabilityLabel,
            paragraphCount,
            listCount,
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
            serpPreview,
            performanceSignals,
            contentQuality,
            competitors,
            targetKeywords,
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
