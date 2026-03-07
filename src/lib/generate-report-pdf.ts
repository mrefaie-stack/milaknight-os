/**
 * Data-driven PDF report generator using jsPDF.
 * No HTML rendering - works entirely from raw data.
 * This approach is immune to CSS color parsing issues.
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

const PRIMARY_COLOR: [number, number, number] = [100, 60, 180]; // Indigo
const DARK_COLOR: [number, number, number] = [20, 20, 30];
const LIGHT_GRAY: [number, number, number] = [245, 245, 250];
const MID_GRAY: [number, number, number] = [140, 140, 155];
const WHITE: [number, number, number] = [255, 255, 255];
const EMERALD: [number, number, number] = [16, 185, 129];
const ORANGE: [number, number, number] = [249, 115, 22];
const BLUE: [number, number, number] = [59, 130, 246];
const PURPLE: [number, number, number] = [168, 85, 247];

function setColor(doc: any, rgb: [number, number, number]) {
    doc.setTextColor(rgb[0], rgb[1], rgb[2]);
}

function setFill(doc: any, rgb: [number, number, number]) {
    doc.setFillColor(rgb[0], rgb[1], rgb[2]);
}

function setDraw(doc: any, rgb: [number, number, number]) {
    doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
}

export async function generateReportPdf(report: any, metrics: any) {
    // Dynamic import to avoid SSR issues
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentW = pageW - margin * 2;
    let y = 0;

    // ─── HEADER BANNER ───────────────────────────────────────────────────────
    setFill(doc, PRIMARY_COLOR);
    doc.rect(0, 0, pageW, 48, "F");

    // Agency label
    setColor(doc, [200, 180, 255]);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("MILA KNIGHTS — PERFORMANCE INTELLIGENCE", margin, 14, { charSpace: 1 });

    // Big title
    setColor(doc, WHITE);
    doc.setFontSize(26);
    doc.setFont("helvetica", "bold");
    doc.text("EFFICIENCY REPORT", margin, 30);

    // Client + Month tag
    setColor(doc, [200, 180, 255]);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`${report.client?.name || "Client"} • ${report.month}`, margin, 41);

    // Generated date top right
    const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    doc.text(`Generated ${today}`, pageW - margin, 41, { align: "right" });

    y = 60;

    // ─── GLOBAL SUMMARY CARDS ────────────────────────────────────────────────
    const activePlatforms = Object.keys(metrics.platforms || {}).filter((key) => {
        const p = metrics.platforms[key];
        return (p.impressions || 0) > 0 || (p.followers || 0) > 0 || (p.engagement || 0) > 0;
    });

    const totals = {
        impressions: activePlatforms.reduce((a, k) => a + (Number(metrics.platforms[k].impressions) || 0), 0),
        engagement: activePlatforms.reduce((a, k) => a + (Number(metrics.platforms[k].engagement) || 0), 0),
        followers: activePlatforms.reduce((a, k) => a + (Number(metrics.platforms[k].followers) || 0), 0),
        spend: activePlatforms.reduce((a, k) => a + (Number(metrics.platforms[k].spend) || 0), 0),
    };

    const summaryCards = [
        { label: "IMPRESSIONS", value: totals.impressions.toLocaleString(), color: BLUE },
        { label: "ENGAGEMENTS", value: totals.engagement.toLocaleString(), color: EMERALD },
        { label: "NEW FOLLOWERS", value: totals.followers.toLocaleString(), color: PURPLE },
        { label: "AD INVESTMENT", value: `$${totals.spend.toLocaleString()}`, color: ORANGE },
    ];

    const cardW = (contentW - 9) / 4;
    summaryCards.forEach((card, i) => {
        const x = margin + i * (cardW + 3);
        setFill(doc, LIGHT_GRAY);
        doc.roundedRect(x, y, cardW, 24, 3, 3, "F");
        // Accent left bar
        setFill(doc, card.color);
        doc.rect(x, y, 3, 24, "F");
        // Label
        setColor(doc, MID_GRAY);
        doc.setFontSize(6);
        doc.setFont("helvetica", "bold");
        doc.text(card.label, x + 7, y + 8);
        // Value
        setColor(doc, DARK_COLOR);
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.text(card.value, x + 7, y + 19);
    });

    y += 34;

    // ─── STRATEGIC SUMMARY ───────────────────────────────────────────────────
    if (metrics.summary) {
        setFill(doc, LIGHT_GRAY);
        doc.roundedRect(margin, y, contentW, 20, 3, 3, "F");
        setFill(doc, PRIMARY_COLOR);
        doc.rect(margin, y, 4, 20, "F");
        setColor(doc, MID_GRAY);
        doc.setFontSize(6.5);
        doc.setFont("helvetica", "bold");
        doc.text("STRATEGIC SUMMARY", margin + 9, y + 7);
        setColor(doc, DARK_COLOR);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        const lines: string[] = doc.splitTextToSize(metrics.summary, contentW - 14);
        const summaryText = lines.slice(0, 2).join("\n");
        doc.text(summaryText, margin + 9, y + 14);
        y += 28;
    }

    // ─── PLATFORM TABLE ──────────────────────────────────────────────────────
    setColor(doc, DARK_COLOR);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("PLATFORM PERFORMANCE BREAKDOWN", margin, y + 6);
    y += 12;

    const tableBody = activePlatforms.map((key) => {
        const p = metrics.platforms[key];
        return [
            PLATFORM_NAMES[key] || key,
            (p.impressions || 0).toLocaleString(),
            (p.engagement || 0).toLocaleString(),
            (p.followers || 0).toLocaleString(),
            (p.views || 0).toLocaleString(),
            `$${(p.spend || 0).toLocaleString()}`,
        ];
    });

    autoTable(doc, {
        startY: y,
        head: [["Platform", "Impressions", "Engagements", "New Followers", "Views", "Ad Spend"]],
        body: tableBody,
        styles: {
            fontSize: 9,
            cellPadding: 4,
            textColor: [30, 30, 40],
            lineColor: [230, 230, 235],
            lineWidth: 0.3,
        },
        headStyles: {
            fillColor: PRIMARY_COLOR,
            textColor: WHITE,
            fontStyle: "bold",
            fontSize: 8,
        },
        alternateRowStyles: {
            fillColor: [248, 248, 253],
        },
        margin: { left: margin, right: margin },
    });

    // @ts-ignore
    y = (doc as any).lastAutoTable.finalY + 10;

    // ─── SEO SECTION ─────────────────────────────────────────────────────────
    if (metrics.seo) {
        if (y + 40 > pageH - 20) { doc.addPage(); y = 20; }

        setColor(doc, DARK_COLOR);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("SEARCH ENGINE OPTIMIZATION", margin, y);
        y += 8;

        const seoData = [
            ["Authority Score", String(metrics.seo?.score || 0)],
            ["Primary Keyword / Rank", metrics.seo?.rank || "N/A"],
            ["Technical Notes", metrics.seo?.notes || "—"],
        ];

        autoTable(doc, {
            startY: y,
            body: seoData,
            styles: { fontSize: 9, cellPadding: 4, textColor: [30, 30, 40] },
            columnStyles: {
                0: { fontStyle: "bold", fillColor: LIGHT_GRAY, cellWidth: 55 },
                1: { cellWidth: contentW - 55 },
            },
            margin: { left: margin, right: margin },
        });

        // @ts-ignore
        y = (doc as any).lastAutoTable.finalY + 10;
    }

    // ─── EMAIL MARKETING ─────────────────────────────────────────────────────
    if (metrics.emailMarketing?.emailsSent > 0) {
        if (y + 30 > pageH - 20) { doc.addPage(); y = 20; }

        setColor(doc, DARK_COLOR);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("EMAIL MARKETING", margin, y);
        y += 8;

        autoTable(doc, {
            startY: y,
            body: [
                ["Emails Sent", String(metrics.emailMarketing.emailsSent)],
                ["Open Rate", `${metrics.emailMarketing.openRate}%`],
                ["Click Rate", `${metrics.emailMarketing.clickRate}%`],
            ],
            styles: { fontSize: 9, cellPadding: 4 },
            columnStyles: { 0: { fontStyle: "bold", fillColor: LIGHT_GRAY, cellWidth: 55 } },
            margin: { left: margin, right: margin },
        });

        // @ts-ignore
        y = (doc as any).lastAutoTable.finalY + 10;
    }

    // ─── FOOTER ──────────────────────────────────────────────────────────────
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        setFill(doc, PRIMARY_COLOR);
        doc.rect(0, pageH - 12, pageW, 12, "F");
        setColor(doc, [200, 180, 255]);
        doc.setFontSize(7);
        doc.text("MILA KNIGHTS — CONFIDENTIAL PERFORMANCE REPORT", margin, pageH - 5);
        doc.text(`Page ${i} of ${totalPages}`, pageW - margin, pageH - 5, { align: "right" });
    }

    doc.save(`Report-${report.client?.name || "Client"}-${report.month}.pdf`);
}
