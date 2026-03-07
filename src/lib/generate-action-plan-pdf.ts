/**
 * Action Plan PDF generator — ALL data included.
 * - Embeds images from URLs where possible
 * - Shows captions (both Arabic and English as text)
 * - Shows video links
 * - Shows AM comments + client comments
 * - Shows poll questions + options
 * - Shows article title + content
 */

const PRIMARY: [number, number, number] = [100, 60, 180];
const DARK: [number, number, number] = [20, 20, 35];
const LIGHT_GRAY: [number, number, number] = [245, 245, 252];
const MID_GRAY: [number, number, number] = [140, 140, 155];
const WHITE: [number, number, number] = [255, 255, 255];
const EMERALD: [number, number, number] = [16, 185, 129];
const ORANGE: [number, number, number] = [249, 115, 22];
const BLUE: [number, number, number] = [59, 130, 246];
const RED: [number, number, number] = [239, 68, 68];
const PURPLE: [number, number, number] = [168, 85, 247];

const STATUS_COLORS: Record<string, [number, number, number]> = {
    APPROVED: EMERALD,
    DRAFT: MID_GRAY,
    PUBLISHED: BLUE,
    NEEDS_EDIT: RED,
    REVISION_REQUESTED: ORANGE,
    PENDING: [251, 191, 36],
};

const TYPE_LABELS: Record<string, string> = {
    POST: "Social Post",
    VIDEO: "Video / Reel",
    POLL: "Interactive Poll",
    ARTICLE: "SEO Article",
};

/**
 * Attempt to fetch an image URL and return it as a base64 data URL.
 * Returns null if the fetch fails (e.g. CORS issue).
 */
async function fetchImageAsBase64(url: string): Promise<{ data: string; format: string } | null> {
    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const blob = await res.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
                const dataUrl = reader.result as string;
                // format: jpeg/png/webp etc
                const format = blob.type.split("/")[1]?.toUpperCase() || "JPEG";
                resolve({ data: dataUrl, format });
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch {
        return null;
    }
}

export async function generateActionPlanPdf(plan: any, items: any[]) {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 14;
    const contentW = pageW - margin * 2;
    let y = 0;

    // ─── HEADER ──────────────────────────────────────────────────────────────
    doc.setFillColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
    doc.rect(0, 0, pageW, 48, "F");
    doc.setTextColor(200, 180, 255);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("MILA KNIGHTS — CONTENT ACTION PLAN", margin, 14, { charSpace: 1 });
    doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
    doc.setFontSize(24);
    doc.text("ACTION PLAN", margin, 30);
    doc.setTextColor(200, 180, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const clientName = plan.client?.name || plan.clientName || "Client";
    doc.text(`${clientName} • ${plan.month}`, margin, 41);
    const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    doc.text(`Generated ${today}`, pageW - margin, 41, { align: "right" });
    y = 56;

    // ─── PLAN STATUS & OVERVIEW ───────────────────────────────────────────────
    const total = items.length;
    const approved = items.filter(i => i.status === "APPROVED").length;
    const pending = items.filter(i => i.status !== "APPROVED").length;

    const stats = [
        { label: "TOTAL ITEMS", value: String(total), color: PRIMARY },
        { label: "APPROVED", value: String(approved), color: EMERALD },
        { label: "PENDING REVIEW", value: String(pending), color: ORANGE },
        { label: "PLAN STATUS", value: plan.status || "DRAFT", color: STATUS_COLORS[plan.status] || MID_GRAY },
    ];
    const cardW = (contentW - 9) / 4;
    stats.forEach((stat, i) => {
        const x = margin + i * (cardW + 3);
        doc.setFillColor(LIGHT_GRAY[0], LIGHT_GRAY[1], LIGHT_GRAY[2]);
        doc.roundedRect(x, y, cardW, 20, 2, 2, "F");
        doc.setFillColor(stat.color[0], stat.color[1], stat.color[2]);
        doc.rect(x, y, 3, 20, "F");
        doc.setTextColor(MID_GRAY[0], MID_GRAY[1], MID_GRAY[2]);
        doc.setFontSize(5.5);
        doc.setFont("helvetica", "bold");
        doc.text(stat.label, x + 6, y + 7);
        doc.setTextColor(DARK[0], DARK[1], DARK[2]);
        doc.setFontSize(11);
        doc.text(stat.value, x + 6, y + 16);
    });
    y += 28;

    // ─── OVERVIEW TABLE ───────────────────────────────────────────────────────
    doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("CONTENT OVERVIEW", margin, y + 6);
    y += 11;

    const overviewBody = items.map((item) => {
        const platforms = (item.platform || "—").replace(/[^\x00-\x7F]/g, "");
        const date = item.scheduledDate ? new Date(item.scheduledDate).toLocaleDateString("en-GB") : "—";
        return [
            `${String(items.indexOf(item) + 1).padStart(2, "0")}`,
            TYPE_LABELS[item.type] || item.type,
            platforms,
            date,
            item.status || "DRAFT",
        ];
    });

    autoTable(doc, {
        startY: y,
        head: [["#", "Type", "Platform(s)", "Scheduled", "Status"]],
        body: overviewBody.length ? overviewBody : [["—", "No items yet", "", "", ""]],
        styles: { fontSize: 8.5, cellPadding: 3.5, textColor: [30, 30, 40], lineColor: [230, 230, 235], lineWidth: 0.3 },
        headStyles: { fillColor: PRIMARY, textColor: WHITE, fontStyle: "bold", fontSize: 8 },
        columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 30 }, 2: { cellWidth: 55 }, 3: { cellWidth: 28 } },
        alternateRowStyles: { fillColor: [248, 248, 253] },
        margin: { left: margin, right: margin },
        didParseCell: (data: any) => {
            if (data.section === "body" && data.column.index === 4) {
                const val = data.cell.raw;
                if (val === "APPROVED") { data.cell.styles.textColor = EMERALD; data.cell.styles.fontStyle = "bold"; }
                else if (val === "NEEDS_EDIT") { data.cell.styles.textColor = RED; data.cell.styles.fontStyle = "bold"; }
            }
        },
    });

    // @ts-ignore
    y = (doc as any).lastAutoTable.finalY + 10;

    // ─── EACH ITEM IN DETAIL ──────────────────────────────────────────────────
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    doc.text("DETAILED CONTENT ITEMS", margin, y + 6);
    y += 12;

    for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx];

        // Check page space (need at least 60mm for a full block)
        if (y + 60 > pageH - 18) {
            doc.addPage();
            y = 20;
        }

        const statusColor = STATUS_COLORS[item.status] || MID_GRAY;

        // Item title bar
        doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
        doc.rect(margin, y, contentW, 1.5, "F");
        y += 4;

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(DARK[0], DARK[1], DARK[2]);
        doc.text(`${String(idx + 1).padStart(2, "0")}. ${TYPE_LABELS[item.type] || item.type}`, margin, y + 5);

        // Status badge
        doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
        doc.roundedRect(pageW - margin - 36, y, 36, 8, 2, 2, "F");
        doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
        doc.setFontSize(6.5);
        doc.text(item.status || "DRAFT", pageW - margin - 18, y + 5.5, { align: "center" });
        y += 11;

        // Key data rows
        const rows: [string, string][] = [];

        if (item.platform) rows.push(["Platform(s)", item.platform]);
        if (item.scheduledDate) rows.push(["Scheduled Date", new Date(item.scheduledDate).toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })]);
        if (item.imageUrl) rows.push(["Image URL", item.imageUrl]);
        if (item.videoUrl) rows.push(["Video URL", item.videoUrl]);

        if (rows.length > 0) {
            autoTable(doc, {
                startY: y,
                body: rows,
                styles: { fontSize: 8.5, cellPadding: 3 },
                columnStyles: { 0: { fontStyle: "bold", fillColor: LIGHT_GRAY, cellWidth: 36, textColor: MID_GRAY } },
                margin: { left: margin + 3, right: margin },
                theme: "plain",
            });
            // @ts-ignore
            y = (doc as any).lastAutoTable.finalY + 2;
        }

        // Try to embed image from URL
        if (item.imageUrl) {
            const imgData = await fetchImageAsBase64(item.imageUrl);
            if (imgData) {
                if (y + 55 > pageH - 18) { doc.addPage(); y = 20; }
                const maxImgW = Math.min(contentW * 0.6, 100);
                try {
                    doc.addImage(imgData.data, imgData.format, margin + 3, y, maxImgW, 0);
                    // jsPDF calculates actual height — add roughly 55mm
                    y += 58;
                } catch {
                    // If image embed fails, skip silently
                }
            }
        }

        // Captions & Content
        const contentRows: [string, string][] = [];
        if (item.captionEn) contentRows.push(["Caption (English)", item.captionEn]);
        // Arabic: jsPDF can't render RTL correctly so we note it
        if (item.captionAr) {
            // Try to output as-is; characters will appear but reversed/disconnected
            contentRows.push(["Caption (Arabic)", item.captionAr]);
        }
        if (item.articleTitle) contentRows.push(["Article Title", item.articleTitle]);
        if (item.articleContent) contentRows.push(["Article Content / Link", item.articleContent]);
        if (item.pollQuestion) {
            contentRows.push(["Poll Question", item.pollQuestion]);
            if (item.pollOptionA) contentRows.push(["Option A", item.pollOptionA]);
            if (item.pollOptionB) contentRows.push(["Option B", item.pollOptionB]);
        }

        if (contentRows.length > 0) {
            if (y + 30 > pageH - 18) { doc.addPage(); y = 20; }
            autoTable(doc, {
                startY: y,
                body: contentRows,
                styles: { fontSize: 8.5, cellPadding: 3.5, overflow: "linebreak" },
                columnStyles: { 0: { fontStyle: "bold", fillColor: LIGHT_GRAY, cellWidth: 42, textColor: MID_GRAY }, 1: { textColor: DARK } },
                margin: { left: margin + 3, right: margin },
                theme: "plain",
            });
            // @ts-ignore
            y = (doc as any).lastAutoTable.finalY + 2;
        }

        // AM Comment
        if (item.amComment) {
            if (y + 20 > pageH - 18) { doc.addPage(); y = 20; }
            doc.setFillColor(PURPLE[0], PURPLE[1], PURPLE[2]);
            doc.rect(margin + 3, y, 3, 12, "F");
            doc.setFillColor(240, 235, 255);
            doc.roundedRect(margin + 6, y, contentW - 9, 12, 2, 2, "F");
            doc.setTextColor(100, 60, 180);
            doc.setFontSize(6.5);
            doc.setFont("helvetica", "bold");
            doc.text("ACCOUNT MANAGER NOTES", margin + 10, y + 4.5);
            doc.setFontSize(8.5);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(DARK[0], DARK[1], DARK[2]);
            const commentLines: string[] = doc.splitTextToSize(item.amComment, contentW - 14);
            doc.text(commentLines[0], margin + 10, y + 9);
            y += 14;
            if (commentLines.length > 1) {
                for (let l = 1; l < commentLines.length; l++) {
                    if (y + 6 > pageH - 18) { doc.addPage(); y = 20; }
                    doc.text(commentLines[l], margin + 10, y);
                    y += 5;
                }
            }
            y += 2;
        }

        // Client Comment
        if (item.clientComment) {
            if (y + 20 > pageH - 18) { doc.addPage(); y = 20; }
            doc.setFillColor(ORANGE[0], ORANGE[1], ORANGE[2]);
            doc.rect(margin + 3, y, 3, 12, "F");
            doc.setFillColor(255, 245, 235);
            doc.roundedRect(margin + 6, y, contentW - 9, 12, 2, 2, "F");
            doc.setTextColor(ORANGE[0], ORANGE[1], ORANGE[2]);
            doc.setFontSize(6.5);
            doc.setFont("helvetica", "bold");
            doc.text(`CLIENT FEEDBACK ${item.feedbackResolved ? "(RESOLVED)" : "(PENDING)"}`, margin + 10, y + 4.5);
            doc.setFontSize(8.5);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(DARK[0], DARK[1], DARK[2]);
            const fbLines: string[] = doc.splitTextToSize(item.clientComment, contentW - 14);
            doc.text(fbLines[0], margin + 10, y + 9);
            y += 14;
            if (fbLines.length > 1) {
                for (let l = 1; l < fbLines.length; l++) {
                    if (y + 6 > pageH - 18) { doc.addPage(); y = 20; }
                    doc.text(fbLines[l], margin + 10, y);
                    y += 5;
                }
            }
            y += 2;
        }

        y += 8; // space between items
    }

    // ─── FOOTER ──────────────────────────────────────────────────────────────
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFillColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
        doc.rect(0, pageH - 12, pageW, 12, "F");
        doc.setTextColor(200, 180, 255);
        doc.setFontSize(7);
        doc.text("MILA KNIGHTS — CONFIDENTIAL CONTENT PLAN", margin, pageH - 5);
        doc.text(`Page ${i} of ${totalPages}`, pageW - margin, pageH - 5, { align: "right" });
    }

    doc.save(`ActionPlan-${clientName}-${plan.month}.pdf`);
}
