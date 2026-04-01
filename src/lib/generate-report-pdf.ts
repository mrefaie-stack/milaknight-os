/**
 * Data-driven PDF report generator using jsPDF — COMPLETE data coverage.
 * Every field shown on the website also appears here.
 * Arabic text is rendered via canvas (full RTL + ligature support).
 */
import { renderArabicTextImage, containsArabic } from "./pdf-arabic-helper";

const PLATFORM_NAMES: Record<string, string> = {
    facebook: "Facebook",
    instagram: "Instagram",
    tiktok: "TikTok",
    snapchat: "Snapchat",
    linkedin: "LinkedIn",
    google: "Google Ads",
    youtube: "YouTube",
    x: "X (Twitter)",
};

const P: [number, number, number] = [100, 60, 180];   // Primary (indigo)
const DARK: [number, number, number] = [20, 20, 30];
const LGRAY: [number, number, number] = [245, 245, 250];
const MGRAY: [number, number, number] = [140, 140, 155];
const WHITE: [number, number, number] = [255, 255, 255];
const EMERALD: [number, number, number] = [16, 185, 129];
const ORANGE: [number, number, number] = [249, 115, 22];
const BLUE: [number, number, number] = [59, 130, 246];
const PURPLE: [number, number, number] = [168, 85, 247];
const TEAL: [number, number, number] = [20, 184, 166];

async function renderTextBlock(
    doc: any,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    fontSize: number,
    color: [number, number, number],
    fontStyle: string = "normal"
): Promise<number> {
    // If text contains Arabic, render as image canvas
    if (containsArabic(text)) {
        const img = renderArabicTextImage(text, maxWidth, fontSize * 1.6, `rgb(${color[0]},${color[1]},${color[2]})`, "#f9f9fc");
        doc.addImage(img.dataUrl, "PNG", x, y, img.widthMm, img.heightMm);
        return img.heightMm;
    }
    // Otherwise render as normal PDF text
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", fontStyle);
    doc.setTextColor(color[0], color[1], color[2]);
    const lines: string[] = doc.splitTextToSize(text, maxWidth);
    let dy = 0;
    for (const line of lines) {
        doc.text(line, x, y + dy);
        dy += fontSize * 0.45;
    }
    return dy;
}

export async function generateReportPdf(report: any, metrics: any) {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 14;
    const cW = pageW - margin * 2;
    let y = 0;

    const addPage = () => { doc.addPage(); y = 18; };
    const checkPage = (needed: number) => { if (y + needed > pageH - 16) addPage(); };

    // ─── HEADER ───────────────────────────────────────────────────────────────
    doc.setFillColor(P[0], P[1], P[2]);
    doc.rect(0, 0, pageW, 50, "F");

    doc.setTextColor(200, 180, 255);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("MILA KNIGHTS — PERFORMANCE INTELLIGENCE", margin, 14, { charSpace: 1 });

    doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
    doc.setFontSize(26);
    doc.text("EFFICIENCY REPORT", margin, 31);

    doc.setTextColor(200, 180, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`${report.client?.name || "Client"} • ${report.month}`, margin, 43);
    const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    doc.text(`Generated ${today}`, pageW - margin, 43, { align: "right" });

    y = 58;

    // ─── GLOBAL TOTALS ────────────────────────────────────────────────────────
    const campaigns = metrics.campaigns || [
        { id: "default", name: "Main", platforms: metrics.platforms || {}, linkedItems: [] }
    ];

    // Aggregated platforms mapping
    const aggregatedPlatforms: Record<string, any> = {};
    campaigns.forEach((camp: any) => {
        Object.entries(camp.platforms || {}).forEach(([platId, p]: [string, any]) => {
            if (!aggregatedPlatforms[platId]) {
                aggregatedPlatforms[platId] = { ...p };
            } else {
                const existing = aggregatedPlatforms[platId];
                aggregatedPlatforms[platId] = {
                    ...existing,
                    followers: (existing.followers || 0) + (Number(p.followers) || 0),
                    engagement: (existing.engagement || 0) + (Number(p.engagement) || 0),
                    impressions: (existing.impressions || 0) + (Number(p.impressions) || 0),
                    views: (existing.views || 0) + (Number(p.views) || 0),
                    spend: (existing.spend || 0) + (Number(p.spend) || 0),
                    conversions: (existing.conversions || 0) + (Number(p.conversions) || 0),
                    paidReach: (existing.paidReach || 0) + (Number(p.paidReach) || 0),
                    organicReach: (existing.organicReach || 0) + (Number(p.organicReach) || 0),
                    clicks: (existing.clicks || 0) + (Number(p.clicks) || 0),
                };
            }
        });
    });

    const activePlatforms = Object.keys(aggregatedPlatforms).filter((key) => {
        const p = aggregatedPlatforms[key];
        return Object.values(p).some((v: any) => Number(v) > 0);
    });

    const getPlatformSpend = (p: any) => Number(p.spend) || 0;
    const getPlatformResults = (p: any) =>
        Number(p.conversions) || Number(p.results) || Number(p.messages) || Number(p.leads) || 0;

    const totals = {
        impressions: activePlatforms.reduce((a, k) => a + (Number(aggregatedPlatforms[k].impressions) || 0), 0),
        engagement: activePlatforms.reduce((a, k) => a + (Number(aggregatedPlatforms[k].engagement) || 0), 0),
        followers: activePlatforms.reduce((a, k) => a + (Number(aggregatedPlatforms[k].followers) || 0), 0),
        views: activePlatforms.reduce((a, k) => a + (Number(aggregatedPlatforms[k].views) || 0), 0),
        spend: activePlatforms.reduce((a, k) => a + (getPlatformSpend(aggregatedPlatforms[k])), 0),
        paidReach: activePlatforms.reduce((a, k) => a + (Number(aggregatedPlatforms[k].paidReach) || 0), 0),
        conversions: activePlatforms.reduce((a, k) => a + (getPlatformResults(aggregatedPlatforms[k])), 0),
    };

    const cards = [
        { label: "IMPRESSIONS", value: totals.impressions.toLocaleString(), color: BLUE },
        { label: "ENGAGEMENTS", value: totals.engagement.toLocaleString(), color: EMERALD },
        { label: "NEW FOLLOWERS", value: totals.followers.toLocaleString(), color: PURPLE },
        { label: "PAID REACH", value: totals.paidReach.toLocaleString(), color: TEAL },
        { label: "VIDEO VIEWS", value: totals.views.toLocaleString(), color: ORANGE },
        { label: "CONVERSIONS", value: totals.conversions.toLocaleString(), color: [239, 68, 68] as [number, number, number] },
        { label: "AD INVESTMENT", value: `SAR ${totals.spend.toLocaleString()}`, color: ORANGE },
    ];

    // 4 + 3 layout
    const row1 = cards.slice(0, 4);
    const row2 = cards.slice(4);

    const drawCards = (row: typeof cards, startY: number, cols: number) => {
        const cw = (cW - (cols - 1) * 3) / cols;
        row.forEach((card, i) => {
            const x = margin + i * (cw + 3);
            doc.setFillColor(LGRAY[0], LGRAY[1], LGRAY[2]);
            doc.roundedRect(x, startY, cw, 20, 2.5, 2.5, "F");
            doc.setFillColor(card.color[0], card.color[1], card.color[2]);
            doc.rect(x, startY, 3, 20, "F");
            doc.setTextColor(MGRAY[0], MGRAY[1], MGRAY[2]);
            doc.setFontSize(5.5);
            doc.setFont("helvetica", "bold");
            doc.text(card.label, x + 6, startY + 7);
            doc.setTextColor(DARK[0], DARK[1], DARK[2]);
            doc.setFontSize(11.5);
            doc.text(card.value, x + 6, startY + 16);
        });
    };

    drawCards(row1, y, 4);
    y += 24;
    drawCards(row2, y, 3);
    y += 28;

    // ─── STRATEGIC SUMMARY ────────────────────────────────────────────────────
    const summaryEn = metrics.summaryEn || (!containsArabic(metrics.summary || "") ? metrics.summary : null);
    const summaryAr = metrics.summaryAr || (containsArabic(metrics.summary || "") ? metrics.summary : null);

    if (summaryEn || summaryAr) {
        checkPage(20);
        doc.setFillColor(LGRAY[0], LGRAY[1], LGRAY[2]);
        doc.roundedRect(margin, y, cW, 8, 2, 2, "F");
        doc.setFillColor(P[0], P[1], P[2]);
        doc.rect(margin, y, 4, 8, "F");
        doc.setTextColor(MGRAY[0], MGRAY[1], MGRAY[2]);
        doc.setFontSize(6);
        doc.setFont("helvetica", "bold");
        doc.text("STRATEGIC SUMMARY", margin + 8, y + 5.5);
        y += 12;

        // English summary
        if (summaryEn) {
            checkPage(12);
            const lines: string[] = doc.splitTextToSize(summaryEn, cW);
            doc.setTextColor(DARK[0], DARK[1], DARK[2]);
            doc.setFontSize(9);
            doc.setFont("helvetica", "italic");
            for (const line of lines) {
                checkPage(6);
                doc.text(line, margin, y);
                y += 5.5;
            }
            y += 4;
        }

        // Arabic summary (canvas-rendered for correct RTL + ligatures)
        if (summaryAr) {
            checkPage(15);
            const summaryImg = renderArabicTextImage(summaryAr, cW, 26, "#1a1a2e", "#f9f9fc");
            checkPage(summaryImg.heightMm + 4);
            doc.addImage(summaryImg.dataUrl, "PNG", margin, y, summaryImg.widthMm, summaryImg.heightMm);
            y += summaryImg.heightMm + 6;
        }
    }

    // ─── PLATFORM PERFORMANCE TABLE (FULL) ───────────────────────────────────
    checkPage(20);
    doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("PLATFORM PERFORMANCE BREAKDOWN", margin, y);
    y += 7;

    const fullTable = activePlatforms.map((key) => {
        const p = aggregatedPlatforms[key];
        return [
            PLATFORM_NAMES[key] || key,
            (p.impressions || 0).toLocaleString(),
            (p.engagement || 0).toLocaleString(),
            (p.followers || 0).toLocaleString(),
            (p.views || 0).toLocaleString(),
            (p.paidReach || 0).toLocaleString(),
            getPlatformResults(p).toLocaleString(),
            `SAR ${getPlatformSpend(p).toLocaleString()}`,
        ];
    });

    autoTable(doc, {
        startY: y,
        head: [["Platform", "Impressions", "Engagements", "Followers", "Views", "Paid Reach", "Results", "Ad Spend"]],
        body: fullTable.length ? fullTable : [["No active platforms", "", "", "", "", "", "", ""]],
        styles: { fontSize: 7.5, cellPadding: 3, textColor: [30, 30, 40], lineColor: [220, 220, 230], lineWidth: 0.25 },
        headStyles: { fillColor: P, textColor: WHITE, fontStyle: "bold", fontSize: 7 },
        alternateRowStyles: { fillColor: [248, 248, 253] },
        margin: { left: margin, right: margin },
    });

    y = (doc as any).lastAutoTable.finalY + 10;

    // ─── PER-PLATFORM DEEP DIVE ───────────────────────────────────────────────
    checkPage(20);
    doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("PER-PLATFORM DETAILED METRICS", margin, y);
    y += 7;

    for (const camp of campaigns) {
        const campActivePlats = Object.keys(camp.platforms || {}).filter(k =>
            Object.values(camp.platforms[k]).some((v: any) => Number(v) > 0) || (camp.linkedItems || []).some((li: any) => li.platform === k)
        );

        if (campActivePlats.length === 0) continue;

        checkPage(20);
        doc.setTextColor(P[0], P[1], P[2]);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(camp.name.toUpperCase(), margin, y);
        y += 8;

        for (const key of campActivePlats) {
            const p = camp.platforms[key];
            const name = PLATFORM_NAMES[key] || key;

            checkPage(50);

            // Platform sub-header
            doc.setFillColor(P[0], P[1], P[2]);
            doc.roundedRect(margin, y, cW, 8, 1.5, 1.5, "F");
            doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.text(`${camp.name} — ${name.toUpperCase()}`, margin + 4, y + 5.5);
            doc.setFontSize(6);
            doc.text("PERFORMANCE INSIGHTS", pageW - margin - 4, y + 5.5, { align: "right" });
            y += 11;

            // Build all metric rows for this platform
            const platformRows: [string, string][] = [];

            // Core metrics
            if (p.impressions) platformRows.push(["Impressions", p.impressions.toLocaleString()]);
            if (p.views) platformRows.push(["Video Views", p.views.toLocaleString()]);
            if (p.reach) platformRows.push(["Organic Reach", p.reach.toLocaleString()]);
            if (p.paidReach) platformRows.push(["Paid Reach", p.paidReach.toLocaleString()]);
            if (p.engagement) platformRows.push(["Engagements", p.engagement.toLocaleString()]);
            if (p.followers) platformRows.push(["New Followers", p.followers.toLocaleString()]);
            if (p.currentFollowers) platformRows.push(["Total Followers", p.currentFollowers.toLocaleString()]);
            if (p.likes) platformRows.push(["Likes", p.likes.toLocaleString()]);
            if (p.comments) platformRows.push(["Comments", p.comments.toLocaleString()]);
            if (p.shares) platformRows.push(["Shares", p.shares.toLocaleString()]);
            if (p.saves) platformRows.push(["Saves", p.saves.toLocaleString()]);
            if (p.reposts) platformRows.push(["Reposts", p.reposts.toLocaleString()]);
            if (p.bookmarks) platformRows.push(["Bookmarks", p.bookmarks.toLocaleString()]);
            if (p.replies) platformRows.push(["Replies", p.replies.toLocaleString()]);
            if (p.clicks) platformRows.push(["Link Clicks", p.clicks.toLocaleString()]);
            if (p.profileVisits) platformRows.push(["Profile Visits", p.profileVisits.toLocaleString()]);
            if (p.searches) platformRows.push(["Searches", p.searches.toLocaleString()]);
            if (p.watchTime) platformRows.push(["Watch Time", `${p.watchTime}s`]);
            if (p.cpc) platformRows.push(["CPC", `SAR ${p.cpc}`]);

            // Paid ads totals
            const platSpend = getPlatformSpend(p);
            const platResults = getPlatformResults(p);
            if (platSpend > 0) platformRows.push(["Ad Investment", `SAR ${platSpend.toLocaleString()}`]);
            if (platResults > 0) platformRows.push(["Results / Conversions", platResults.toLocaleString()]);

            // Calculated metrics
            const baseImpr = p.impressions || p.views || 0;
            const engRate = baseImpr > 0 ? ((p.engagement / baseImpr) * 100).toFixed(2) : "0.00";
            platformRows.push(["Engagement Rate", `${engRate}%`]);

            if (platResults > 0 && platSpend > 0) {
                const cpa = (platSpend / platResults).toFixed(2);
                platformRows.push(["Cost / Result", `SAR ${cpa}`]);
            }

            if (platformRows.length > 0) {
                const chunked: [string, string][][] = [];
                for (let i = 0; i < platformRows.length; i += 2) {
                    chunked.push(platformRows.slice(i, i + 2) as [string, string][]);
                }
                for (const chunk of chunked) {
                    checkPage(10);
                    chunk.forEach(([label, value], ci) => {
                        const bx = margin + ci * (cW / 2 + 1.5);
                        doc.setFillColor(LGRAY[0], LGRAY[1], LGRAY[2]);
                        doc.roundedRect(bx, y, cW / 2 - 1.5, 10, 1, 1, "F");
                        doc.setTextColor(MGRAY[0], MGRAY[1], MGRAY[2]);
                        doc.setFontSize(5.5);
                        doc.setFont("helvetica", "bold");
                        doc.text(label.toUpperCase(), bx + 3, y + 3.5);
                        doc.setTextColor(DARK[0], DARK[1], DARK[2]);
                        doc.setFontSize(8.5);
                        doc.text(value, bx + 3, y + 8);
                    });
                    y += 12;
                }
            }

            // ── Paid Campaigns breakdown ──────────────────────────────────────
            if (p.paidCampaigns?.length > 0) {
                checkPage(14);
                doc.setFillColor(255, 237, 213); // orange-100
                doc.roundedRect(margin, y, cW, 7, 1, 1, "F");
                doc.setTextColor(ORANGE[0], ORANGE[1], ORANGE[2]);
                doc.setFontSize(6.5);
                doc.setFont("helvetica", "bold");
                doc.text("PAID CAMPAIGN DETAILS", margin + 3, y + 4.5);
                y += 9;

                for (const pc of p.paidCampaigns) {
                    checkPage(14);
                    const pcRows: [string, string][] = [
                        ["Campaign", pc.name || "—"],
                        ["Objective", (pc.objective || "—").toLowerCase()],
                        ["Spend", `SAR ${(pc.spend || 0).toLocaleString()}`],
                        ["Reach", (pc.reach || 0).toLocaleString()],
                        ["Results", (pc.results || 0).toLocaleString()],
                    ].filter(([, v]) => v && v !== "—" && v !== "0") as [string, string][];

                    const pcChunked: [string, string][][] = [];
                    for (let i = 0; i < pcRows.length; i += 2) {
                        pcChunked.push(pcRows.slice(i, i + 2) as [string, string][]);
                    }
                    for (const chunk of pcChunked) {
                        checkPage(10);
                        chunk.forEach(([label, value], ci) => {
                            const bx = margin + ci * (cW / 2 + 1.5);
                            doc.setFillColor(255, 247, 237); // very light orange
                            doc.roundedRect(bx, y, cW / 2 - 1.5, 10, 1, 1, "F");
                            doc.setTextColor(MGRAY[0], MGRAY[1], MGRAY[2]);
                            doc.setFontSize(5.5);
                            doc.setFont("helvetica", "bold");
                            doc.text(label.toUpperCase(), bx + 3, y + 3.5);
                            doc.setTextColor(DARK[0], DARK[1], DARK[2]);
                            doc.setFontSize(8.5);
                            doc.text(value, bx + 3, y + 8);
                        });
                        y += 12;
                    }
                    y += 2;
                }
            }

            // ── Account Manager Note ──────────────────────────────────────────
            if (p.comment) {
                checkPage(20);
                doc.setFillColor(240, 237, 255); // light indigo background
                doc.roundedRect(margin, y, cW, 8, 1, 1, "F");
                doc.setTextColor(P[0], P[1], P[2]);
                doc.setFontSize(6);
                doc.setFont("helvetica", "bold");
                doc.text("ACCOUNT MANAGER NOTE", margin + 3, y + 5);
                y += 10;

                if (containsArabic(p.comment)) {
                    checkPage(15);
                    const commentImg = renderArabicTextImage(p.comment, cW, 22, "#141428", "#f9f9fc");
                    checkPage(commentImg.heightMm + 4);
                    doc.addImage(commentImg.dataUrl, "PNG", margin, y, commentImg.widthMm, commentImg.heightMm);
                    y += commentImg.heightMm + 4;
                } else {
                    const commentLines: string[] = doc.splitTextToSize(p.comment, cW - 6);
                    doc.setTextColor(DARK[0], DARK[1], DARK[2]);
                    doc.setFontSize(8);
                    doc.setFont("helvetica", "normal");
                    for (const line of commentLines) {
                        checkPage(6);
                        doc.text(line, margin + 3, y);
                        y += 5;
                    }
                    y += 4;
                }
            }

            y += 6;
        }
    }

    // ─── WEBSITE / SEO ────────────────────────────────────────────────────────
    const seo = metrics.seo || metrics.websiteSeo;
    if (seo && (seo.clicks > 0 || seo.impressions > 0 || seo.score > 0 || seo.speed)) {
        checkPage(30);
        doc.setTextColor(DARK[0], DARK[1], DARK[2]);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("SEARCH ENGINE OPTIMIZATION", margin, y);
        y += 7;

        const seoRows: [string, string][] = [];
        if (seo.score) seoRows.push(["Authority Score", `${seo.score}%`]);
        if (seo.impressions) seoRows.push(["Search Impressions", Number(seo.impressions).toLocaleString()]);
        if (seo.clicks) seoRows.push(["Search Clicks", Number(seo.clicks).toLocaleString()]);
        if (seo.speed) seoRows.push(["Page Speed", String(seo.speed)]);
        if (seo.rank) seoRows.push(["Keyword / Rank", seo.rank]);
        if (seo.visits) seoRows.push(["Website Visits", Number(seo.visits).toLocaleString()]);
        if (seo.bounce) seoRows.push(["Bounce Rate", `${seo.bounce}%`]);
        if (seo.notes) seoRows.push(["Technical Notes", seo.notes]);

        autoTable(doc, {
            startY: y,
            body: seoRows,
            styles: { fontSize: 9, cellPadding: 4, overflow: "linebreak" },
            columnStyles: { 0: { fontStyle: "bold", fillColor: LGRAY, cellWidth: 52, textColor: MGRAY } },
            margin: { left: margin, right: margin },
            theme: "plain",
        });

        y = (doc as any).lastAutoTable.finalY + 10;
    }

    // ─── EMAIL MARKETING ─────────────────────────────────────────────────────
    const emailCampaigns: any[] = metrics.emailCampaigns || (metrics.emailMarketing ? [metrics.emailMarketing] : []);
    const hasEmail = emailCampaigns.length > 0 && emailCampaigns.some((e: any) => (e.emailsSent || 0) > 0 || (e.openRate || 0) > 0);

    if (hasEmail) {
        checkPage(26);
        doc.setTextColor(DARK[0], DARK[1], DARK[2]);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("EMAIL MARKETING", margin, y);
        y += 7;

        // Totals
        const totalSent = emailCampaigns.reduce((s: number, c: any) => s + (Number(c.emailsSent) || 0), 0);
        const avgOpen = emailCampaigns.reduce((s: number, c: any) => s + (Number(c.openRate) || 0), 0) / emailCampaigns.length;
        const avgClick = emailCampaigns.reduce((s: number, c: any) => s + (Number(c.clickRate) || 0), 0) / emailCampaigns.length;

        const emSummary: [string, string][] = [
            ["Total Emails Sent", totalSent.toLocaleString()],
            ["Avg. Open Rate", `${avgOpen.toFixed(1)}%`],
            ["Avg. Click Rate", `${avgClick.toFixed(1)}%`],
        ];

        autoTable(doc, {
            startY: y,
            body: emSummary,
            styles: { fontSize: 9, cellPadding: 4 },
            columnStyles: { 0: { fontStyle: "bold", fillColor: LGRAY, cellWidth: 52, textColor: MGRAY } },
            margin: { left: margin, right: margin },
            theme: "plain",
        });
        y = (doc as any).lastAutoTable.finalY + 6;

        // Per-campaign breakdown
        if (emailCampaigns.length > 1) {
            for (const camp of emailCampaigns) {
                if (!camp.emailsSent && !camp.openRate) continue;
                checkPage(18);
                doc.setFillColor(255, 241, 242);
                doc.roundedRect(margin, y, cW, 7, 1, 1, "F");
                doc.setTextColor(185, 28, 28);
                doc.setFontSize(7);
                doc.setFont("helvetica", "bold");
                doc.text((camp.name || "Campaign").toUpperCase(), margin + 3, y + 4.5);
                y += 9;

                const campRows: [string, string][] = [];
                if (camp.emailsSent) campRows.push(["Sent", Number(camp.emailsSent).toLocaleString()]);
                if (camp.openRate) campRows.push(["Open Rate", `${camp.openRate}%`]);
                if (camp.clickRate) campRows.push(["Click Rate", `${camp.clickRate}%`]);
                if (camp.unsubscribes) campRows.push(["Unsubscribes", String(camp.unsubscribes)]);

                const campChunked: [string, string][][] = [];
                for (let i = 0; i < campRows.length; i += 2) {
                    campChunked.push(campRows.slice(i, i + 2) as [string, string][]);
                }
                for (const chunk of campChunked) {
                    checkPage(10);
                    chunk.forEach(([label, value], ci) => {
                        const bx = margin + ci * (cW / 2 + 1.5);
                        doc.setFillColor(255, 247, 247);
                        doc.roundedRect(bx, y, cW / 2 - 1.5, 10, 1, 1, "F");
                        doc.setTextColor(MGRAY[0], MGRAY[1], MGRAY[2]);
                        doc.setFontSize(5.5);
                        doc.setFont("helvetica", "bold");
                        doc.text(label.toUpperCase(), bx + 3, y + 3.5);
                        doc.setTextColor(DARK[0], DARK[1], DARK[2]);
                        doc.setFontSize(8.5);
                        doc.text(value, bx + 3, y + 8);
                    });
                    y += 12;
                }
                y += 4;
            }
        }

        y += 4;
    }

    // ─── WEBSITE PERFORMANCE ─────────────────────────────────────────────────
    const web = metrics.websitePerformance || metrics.website;
    if (web && Object.values(web).some((v: any) => Number(v) > 0)) {
        checkPage(26);
        doc.setTextColor(DARK[0], DARK[1], DARK[2]);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("WEBSITE PERFORMANCE", margin, y);
        y += 7;

        const webRows: [string, string][] = Object.entries(web)
            .filter(([, v]) => v != null && v !== "")
            .map(([k, v]) => [k.replace(/([A-Z])/g, " $1").toUpperCase(), String(v)]);

        autoTable(doc, {
            startY: y,
            body: webRows,
            styles: { fontSize: 9, cellPadding: 4 },
            columnStyles: { 0: { fontStyle: "bold", fillColor: LGRAY, cellWidth: 52, textColor: MGRAY } },
            margin: { left: margin, right: margin },
            theme: "plain",
        });

        y = (doc as any).lastAutoTable.finalY + 10;
    }

    // ─── FOOTER ───────────────────────────────────────────────────────────────
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFillColor(P[0], P[1], P[2]);
        doc.rect(0, pageH - 12, pageW, 12, "F");
        doc.setTextColor(200, 180, 255);
        doc.setFontSize(7);
        doc.text("MILA KNIGHTS — CONFIDENTIAL PERFORMANCE REPORT", margin, pageH - 5);
        doc.text(`Page ${i} of ${totalPages}`, pageW - margin, pageH - 5, { align: "right" });
    }

    doc.save(`Report-${report.client?.name || "Client"}-${report.month}.pdf`);
}
