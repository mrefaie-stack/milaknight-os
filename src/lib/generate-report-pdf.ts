/**
 * Data-driven PDF report generator using jsPDF — COMPLETE data coverage.
 * Every field shown on the website also appears here.
 */

const PLATFORM_NAMES: Record<string, string> = {
    facebook: "Facebook",
    instagram: "Instagram",
    tiktok: "TikTok",
    snapchat: "Snapchat",
    linkedin: "LinkedIn",
    google: "Google Ads",
    youtube: "YouTube",
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
    const activePlatforms = Object.keys(metrics.platforms || {}).filter((key) => {
        const p = metrics.platforms[key];
        return Object.values(p).some((v: any) => Number(v) > 0);
    });

    const totals = {
        impressions: activePlatforms.reduce((a, k) => a + (Number(metrics.platforms[k].impressions) || 0), 0),
        engagement: activePlatforms.reduce((a, k) => a + (Number(metrics.platforms[k].engagement) || 0), 0),
        followers: activePlatforms.reduce((a, k) => a + (Number(metrics.platforms[k].followers) || 0), 0),
        views: activePlatforms.reduce((a, k) => a + (Number(metrics.platforms[k].views) || 0), 0),
        spend: activePlatforms.reduce((a, k) => a + (Number(metrics.platforms[k].spend) || 0), 0),
        paidReach: activePlatforms.reduce((a, k) => a + (Number(metrics.platforms[k].paidReach) || 0), 0),
        conversions: activePlatforms.reduce((a, k) => a + (Number(metrics.platforms[k].conversions) || 0), 0),
    };

    const cards = [
        { label: "IMPRESSIONS", value: totals.impressions.toLocaleString(), color: BLUE },
        { label: "ENGAGEMENTS", value: totals.engagement.toLocaleString(), color: EMERALD },
        { label: "NEW FOLLOWERS", value: totals.followers.toLocaleString(), color: PURPLE },
        { label: "PAID REACH", value: totals.paidReach.toLocaleString(), color: TEAL },
        { label: "VIDEO VIEWS", value: totals.views.toLocaleString(), color: ORANGE },
        { label: "CONVERSIONS", value: totals.conversions.toLocaleString(), color: [239, 68, 68] as [number, number, number] },
        { label: "AD INVESTMENT", value: `$${totals.spend.toLocaleString()}`, color: ORANGE },
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
    if (metrics.summary) {
        checkPage(28);
        doc.setFillColor(LGRAY[0], LGRAY[1], LGRAY[2]);
        doc.roundedRect(margin, y, cW, 8, 2, 2, "F");
        doc.setFillColor(P[0], P[1], P[2]);
        doc.rect(margin, y, 4, 8, "F");
        doc.setTextColor(MGRAY[0], MGRAY[1], MGRAY[2]);
        doc.setFontSize(6);
        doc.setFont("helvetica", "bold");
        doc.text("STRATEGIC SUMMARY", margin + 8, y + 5.5);
        y += 10;

        const lines: string[] = doc.splitTextToSize(metrics.summary, cW);
        doc.setTextColor(DARK[0], DARK[1], DARK[2]);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        for (const line of lines) {
            checkPage(7);
            doc.text(line, margin, y);
            y += 5.5;
        }
        y += 6;
    }

    // ─── PLATFORM PERFORMANCE TABLE (FULL) ───────────────────────────────────
    checkPage(20);
    doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("PLATFORM PERFORMANCE BREAKDOWN", margin, y);
    y += 7;

    const fullTable = activePlatforms.map((key) => {
        const p = metrics.platforms[key];
        return [
            PLATFORM_NAMES[key] || key,
            (p.impressions || 0).toLocaleString(),
            (p.engagement || 0).toLocaleString(),
            (p.followers || 0).toLocaleString(),
            (p.views || 0).toLocaleString(),
            (p.paidReach || 0).toLocaleString(),
            (p.conversions || 0).toLocaleString(),
            `$${(p.spend || 0).toLocaleString()}`,
        ];
    });

    autoTable(doc, {
        startY: y,
        head: [["Platform", "Impressions", "Engagements", "Followers", "Views", "Paid Reach", "Conversions", "Ad Spend"]],
        body: fullTable.length ? fullTable : [["No active platforms", "", "", "", "", "", "", ""]],
        styles: { fontSize: 7.5, cellPadding: 3, textColor: [30, 30, 40], lineColor: [220, 220, 230], lineWidth: 0.25 },
        headStyles: { fillColor: P, textColor: WHITE, fontStyle: "bold", fontSize: 7 },
        alternateRowStyles: { fillColor: [248, 248, 253] },
        margin: { left: margin, right: margin },
    });

    // @ts-ignore
    y = (doc as any).lastAutoTable.finalY + 10;

    // ─── PER-PLATFORM DEEP DIVE ───────────────────────────────────────────────
    checkPage(20);
    doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("PER-PLATFORM DETAILED METRICS", margin, y);
    y += 7;

    for (const key of activePlatforms) {
        const p = metrics.platforms[key];
        const name = PLATFORM_NAMES[key] || key;

        checkPage(40);

        // Platform sub-header
        doc.setFillColor(P[0], P[1], P[2]);
        doc.roundedRect(margin, y, cW, 7, 1.5, 1.5, "F");
        doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text(name.toUpperCase(), margin + 4, y + 5);
        y += 9;

        // All fields for this platform
        const platformRows: [string, string][] = [];
        if (p.impressions) platformRows.push(["Impressions", p.impressions.toLocaleString()]);
        if (p.engagement) platformRows.push(["Engagements", p.engagement.toLocaleString()]);
        if (p.followers) platformRows.push(["New Followers", p.followers.toLocaleString()]);
        if (p.views) platformRows.push(["Video Views", p.views.toLocaleString()]);
        if (p.paidReach) platformRows.push(["Paid Reach", p.paidReach.toLocaleString()]);
        if (p.conversions) platformRows.push(["Conversions", p.conversions.toLocaleString()]);
        if (p.spend) platformRows.push(["Ad Spend", `$${p.spend.toLocaleString()}`]);
        if (p.reach) platformRows.push(["Organic Reach", p.reach.toLocaleString?.() || String(p.reach)]);
        if (p.ctr) platformRows.push(["CTR", `${p.ctr}%`]);
        if (p.cpm) platformRows.push(["CPM", `$${p.cpm}`]);
        if (p.costPerResult) platformRows.push(["Cost / Result", `$${p.costPerResult}`]);

        if (platformRows.length > 0) {
            // Render as two-column grid (two pairs per row)
            const chunked: [string, string][][] = [];
            for (let i = 0; i < platformRows.length; i += 2) {
                chunked.push(platformRows.slice(i, i + 2));
            }

            for (const chunk of chunked) {
                checkPage(8);
                const colW = (cW - 4) / 4;
                chunk.forEach(([label, value], ci) => {
                    const bx = margin + ci * (cW / 2 + 2);
                    doc.setFillColor(LGRAY[0], LGRAY[1], LGRAY[2]);
                    doc.rect(bx, y, cW / 2 - 2, 9, "F");
                    doc.setTextColor(MGRAY[0], MGRAY[1], MGRAY[2]);
                    doc.setFontSize(6);
                    doc.setFont("helvetica", "bold");
                    doc.text(label.toUpperCase(), bx + 3, y + 3.5);
                    doc.setTextColor(DARK[0], DARK[1], DARK[2]);
                    doc.setFontSize(9);
                    doc.text(value, bx + 3, y + 7.5);
                });
                y += 11;
            }
        } else {
            doc.setTextColor(MGRAY[0], MGRAY[1], MGRAY[2]);
            doc.setFontSize(8.5);
            doc.setFont("helvetica", "italic");
            doc.text("No detailed metrics for this platform.", margin + 2, y + 5);
            y += 9;
        }
        y += 4;
    }

    // ─── WEBSITE / SEO ────────────────────────────────────────────────────────
    const seo = metrics.seo || metrics.websiteSeo;
    if (seo && Object.values(seo).some((v: any) => v)) {
        checkPage(30);
        doc.setTextColor(DARK[0], DARK[1], DARK[2]);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("SEARCH ENGINE OPTIMIZATION", margin, y);
        y += 7;

        const seoRows: [string, string][] = [];
        if (seo.score) seoRows.push(["Authority Score", String(seo.score)]);
        if (seo.rank) seoRows.push(["Keyword / Rank", seo.rank]);
        if (seo.visits) seoRows.push(["Website Visits", String(seo.visits)]);
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

        // @ts-ignore
        y = (doc as any).lastAutoTable.finalY + 10;
    }

    // ─── EMAIL MARKETING ─────────────────────────────────────────────────────
    const em = metrics.emailMarketing;
    if (em && (em.emailsSent > 0 || em.openRate > 0)) {
        checkPage(26);
        doc.setTextColor(DARK[0], DARK[1], DARK[2]);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("EMAIL MARKETING", margin, y);
        y += 7;

        const emRows: [string, string][] = [];
        if (em.emailsSent) emRows.push(["Emails Sent", em.emailsSent.toLocaleString()]);
        if (em.openRate) emRows.push(["Open Rate", `${em.openRate}%`]);
        if (em.clickRate) emRows.push(["Click Rate", `${em.clickRate}%`]);
        if (em.unsubscribes) emRows.push(["Unsubscribes", String(em.unsubscribes)]);
        if (em.conversionRate) emRows.push(["Conversion Rate", `${em.conversionRate}%`]);

        autoTable(doc, {
            startY: y,
            body: emRows,
            styles: { fontSize: 9, cellPadding: 4 },
            columnStyles: { 0: { fontStyle: "bold", fillColor: LGRAY, cellWidth: 52, textColor: MGRAY } },
            margin: { left: margin, right: margin },
            theme: "plain",
        });

        // @ts-ignore
        y = (doc as any).lastAutoTable.finalY + 10;
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

        // @ts-ignore
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
