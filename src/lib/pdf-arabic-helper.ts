/**
 * Arabic text rendering helper for jsPDF.
 *
 * jsPDF cannot natively render Arabic (RTL, ligatures, connected letters).
 * Solution: render Arabic text onto an HTML Canvas using the browser's text engine
 * (which handles Arabic perfectly), then export as a PNG image and embed in the PDF.
 *
 * The function returns { dataUrl, widthMm, heightMm } suitable for doc.addImage().
 */

export interface ArabicImageResult {
    dataUrl: string;
    widthMm: number;
    heightMm: number;
}

/**
 * Detects if a string contains Arabic Unicode characters.
 */
export function containsArabic(text: string): boolean {
    return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
}

/**
 * Renders any text (Arabic or mixed) onto a Canvas using the browser's text engine
 * and returns a PNG data URL and the physical dimensions (mm) for embedding in a PDF.
 *
 * @param text       The text to render (Arabic/English/mixed)
 * @param maxWidthMm Maximum width in PDF mm units (default: 180)
 * @param fontSize   Font size in pixels (canvas space)
 * @param textColor  CSS color string (default: '#1a1a1e')
 * @param bgColor    Background color (default: transparent → white for JPEG compat)
 */
export function renderArabicTextImage(
    text: string,
    maxWidthMm = 180,
    fontSize = 26,
    textColor = "#1a1a1e",
    bgColor = "#fafafa"
): ArabicImageResult {
    // 1. Constants for canvas-to-mm conversion
    //    PDF: 1mm ≈ 3.7795 px at 96dpi. We render at 2× scale for crispness.
    const DPI_SCALE = 2;
    const PX_PER_MM = 3.7795 * DPI_SCALE;
    const maxWidthPx = Math.round(maxWidthMm * PX_PER_MM);
    const padding = 6 * DPI_SCALE;
    const lineH = Math.round(fontSize * 1.55 * DPI_SCALE);

    // 2. Build canvas for measuring
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d")!;

    const fontStack = `${fontSize * DPI_SCALE}px "Cairo","Noto Sans Arabic","Segoe UI","Arial Unicode MS",Arial,sans-serif`;
    ctx.font = fontStack;

    // Decide direction
    const isRTL = containsArabic(text);
    ctx.direction = isRTL ? "rtl" : "ltr";
    ctx.textAlign = isRTL ? "right" : "left";

    // 3. Word-wrap
    const words = text.split(" ");
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
        const test = current ? `${current} ${word}` : word;
        if (ctx.measureText(test).width > maxWidthPx - padding * 2 && current) {
            lines.push(current);
            current = word;
        } else {
            current = test;
        }
    }
    if (current) lines.push(current);

    // 4. Draw
    const canvasH = lines.length * lineH + padding * 2;
    canvas.width = maxWidthPx;
    canvas.height = canvasH;

    // Re-apply after resize (canvas resets on resize)
    ctx.font = fontStack;
    ctx.direction = isRTL ? "rtl" : "ltr";
    ctx.textAlign = isRTL ? "right" : "left";

    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Text
    ctx.fillStyle = textColor;
    lines.forEach((line, i) => {
        const x = isRTL ? canvas.width - padding : padding;
        const baselineY = padding + i * lineH + fontSize * DPI_SCALE * 0.85;
        ctx.fillText(line, x, baselineY);
    });

    const dataUrl = canvas.toDataURL("image/png");
    const widthMm = maxWidthMm;
    const heightMm = canvasH / PX_PER_MM;

    return { dataUrl, widthMm, heightMm };
}
