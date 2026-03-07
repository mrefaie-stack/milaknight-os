/**
 * Data-driven Action Plan PDF generator using jsPDF.
 * No HTML rendering — immune to CSS color parsing issues.
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

const STATUS_COLORS: Record<string, [number, number, number]> = {
    APPROVED: EMERALD,
    DRAFT: MID_GRAY,
    PUBLISHED: BLUE,
    NEEDS_EDIT: ORANGE,
    REVISION_REQUESTED: ORANGE,
    PENDING: [251, 191, 36],
};

const TYPE_LABELS: Record<string, string> = {
    POST: "Social Post",
    VIDEO: "Video / Reel",
    POLL: "Interactive Poll",
    ARTICLE: "SEO Article",
};

export async function generateActionPlanPdf(plan: any, items: any[]) {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 15;
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
    doc.setFont("helvetica", "bold");
    doc.text("ACTION PLAN", margin, 30);

    doc.setTextColor(200, 180, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const clientName = plan.client?.name || plan.clientName || "Client";
    doc.text(`${clientName} • ${plan.month}`, margin, 41);

    const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    doc.text(`Generated ${today}`, pageW - margin, 41, { align: "right" });

    y = 58;

    // ─── PLAN STATUS BADGE ───────────────────────────────────────────────────
    const statusColor = STATUS_COLORS[plan.status] || MID_GRAY;
    doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.roundedRect(margin, y, 36, 8, 2, 2, "F");
    doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text(plan.status || "DRAFT", margin + 18, y + 5.5, { align: "center" });

    // Stats row
    const total = items.length;
    const approved = items.filter(i => i.status === "APPROVED").length;
    const pending = items.filter(i => i.status === "PENDING" || i.status === "DRAFT").length;
    const needsEdit = items.filter(i => i.status === "NEEDS_EDIT").length;

    const stats = [
        { label: "TOTAL ITEMS", value: String(total), color: PRIMARY },
        { label: "APPROVED", value: String(approved), color: EMERALD },
        { label: "PENDING", value: String(pending), color: ORANGE },
        { label: "NEEDS EDIT", value: String(needsEdit), color: RED },
    ];

    const cardW = (contentW - 9) / 4;
    stats.forEach((stat, i) => {
        const x = margin + i * (cardW + 3);
        doc.setFillColor(LIGHT_GRAY[0], LIGHT_GRAY[1], LIGHT_GRAY[2]);
        doc.roundedRect(x, y + 14, cardW, 20, 2, 2, "F");
        doc.setFillColor(stat.color[0], stat.color[1], stat.color[2]);
        doc.rect(x, y + 14, 3, 20, "F");
        doc.setTextColor(MID_GRAY[0], MID_GRAY[1], MID_GRAY[2]);
        doc.setFontSize(5.5);
        doc.setFont("helvetica", "bold");
        doc.text(stat.label, x + 6, y + 21);
        doc.setTextColor(DARK[0], DARK[1], DARK[2]);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(stat.value, x + 6, y + 30);
    });

    y += 42;

    // ─── ITEMS TABLE ─────────────────────────────────────────────────────────
    doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("CONTENT ITEMS", margin, y + 6);
    y += 12;

    const tableBody = items.map((item) => {
        // Strip any Arabic and non-latin characters that jsPDF can't render,
        // or keep them and they'll be replaced with '?' — better to show English fields
        const platform = (item.platform || "—").replace(/[^\x00-\x7F]/g, "");
        const captionEn = (item.captionEn || item.captionAr || "—")
            .replace(/[^\x00-\x7F]/g, "?") // keep, but flag non-latin
            .substring(0, 60);
        const date = item.scheduledDate ? new Date(item.scheduledDate).toLocaleDateString("en-GB") : "—";
        return [
            TYPE_LABELS[item.type] || item.type,
            platform || "—",
            date,
            captionEn + (item.captionEn?.length > 60 ? "..." : ""),
            item.amComment ? "Yes" : "—",
            item.status || "DRAFT",
        ];
    });

    autoTable(doc, {
        startY: y,
        head: [["Type", "Platform", "Date", "Caption (EN)", "AM Note", "Status"]],
        body: tableBody.length ? tableBody : [["No items added yet", "", "", "", "", ""]],
        styles: {
            fontSize: 8,
            cellPadding: 3.5,
            textColor: [30, 30, 40],
            lineColor: [230, 230, 235],
            lineWidth: 0.3,
            overflow: "linebreak",
        },
        headStyles: {
            fillColor: PRIMARY,
            textColor: WHITE,
            fontStyle: "bold",
            fontSize: 7.5,
        },
        columnStyles: {
            0: { cellWidth: 24 },
            1: { cellWidth: 28 },
            2: { cellWidth: 22 },
            3: { cellWidth: 60 },
            4: { cellWidth: 16 },
            5: { cellWidth: 20 },
        },
        alternateRowStyles: { fillColor: [248, 248, 253] },
        margin: { left: margin, right: margin },
        // Color-code status column
        didParseCell: (data: any) => {
            if (data.section === "body" && data.column.index === 5) {
                const val = data.cell.raw;
                if (val === "APPROVED") {
                    data.cell.styles.textColor = EMERALD;
                    data.cell.styles.fontStyle = "bold";
                } else if (val === "NEEDS_EDIT") {
                    data.cell.styles.textColor = ORANGE;
                    data.cell.styles.fontStyle = "bold";
                } else if (val === "DRAFT") {
                    data.cell.styles.textColor = MID_GRAY;
                }
            }
        },
    });

    // @ts-ignore
    y = (doc as any).lastAutoTable.finalY + 12;

    // ─── AM COMMENTS SECTION ─────────────────────────────────────────────────
    const itemsWithComments = items.filter(i => i.amComment);
    if (itemsWithComments.length > 0) {
        if (y + 30 > pageH - 20) { doc.addPage(); y = 20; }

        doc.setTextColor(DARK[0], DARK[1], DARK[2]);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("ACCOUNT MANAGER NOTES", margin, y);
        y += 8;

        autoTable(doc, {
            startY: y,
            head: [["Item Type / Platform", "AM Comment"]],
            body: itemsWithComments.map(item => [
                `${TYPE_LABELS[item.type] || item.type} — ${item.platform || ""}`,
                (item.amComment || "").replace(/[^\x00-\x7F]/g, "?"),
            ]),
            styles: { fontSize: 8.5, cellPadding: 4 },
            headStyles: { fillColor: [60, 40, 120], textColor: WHITE, fontStyle: "bold", fontSize: 8 },
            columnStyles: { 0: { cellWidth: 55, fontStyle: "bold" } },
            margin: { left: margin, right: margin },
        });

        // @ts-ignore
        y = (doc as any).lastAutoTable.finalY + 10;
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
