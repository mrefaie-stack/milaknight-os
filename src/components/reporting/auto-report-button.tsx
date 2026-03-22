"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { generateAutoReport } from "@/app/actions/auto-report";
import { useLanguage } from "@/contexts/language-context";

interface Client {
    id: string;
    name: string;
}

interface AutoReportButtonProps {
    clients: Client[];
}

function getMonthOptions(): { value: string; label: string }[] {
    const options: { value: string; label: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
        options.push({ value, label });
    }
    return options;
}

export function AutoReportButton({ clients }: AutoReportButtonProps) {
    const { isRtl } = useLanguage();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [clientId, setClientId] = useState("");
    const [month, setMonth] = useState(() => {
        const now = new Date();
        // Default to last month
        const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    });

    const monthOptions = getMonthOptions();

    async function handleGenerate() {
        if (!clientId) {
            toast.error(isRtl ? "اختر العميل أولاً" : "Please select a client");
            return;
        }
        if (!month) {
            toast.error(isRtl ? "اختر الشهر أولاً" : "Please select a month");
            return;
        }

        setLoading(true);
        try {
            const { reportId } = await generateAutoReport(clientId, month);
            toast.success(isRtl ? "تم إنشاء التقرير التلقائي بنجاح" : "Auto report generated successfully");
            setOpen(false);
            router.push(`/am/reports/${reportId}/edit`);
        } catch (err: any) {
            if (err.message?.startsWith("DUPLICATE:")) {
                const existingId = err.message.split(":")[1];
                toast.error(
                    isRtl
                        ? "يوجد تقرير لهذا العميل في نفس الشهر"
                        : "A report already exists for this client this month",
                    {
                        action: {
                            label: isRtl ? "فتح التقرير" : "Open Report",
                            onClick: () => router.push(`/am/reports/${existingId}/edit`)
                        }
                    }
                );
            } else {
                toast.error(
                    isRtl
                        ? `فشل إنشاء التقرير: ${err.message}`
                        : `Failed to generate report: ${err.message}`
                );
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <Button
                variant="outline"
                onClick={() => setOpen(true)}
                className="gap-2 border-primary/30 text-primary hover:bg-primary/5"
            >
                <Sparkles className="h-4 w-4" />
                {isRtl ? "إنشاء تلقائي" : "Auto Generate"}
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md" dir={isRtl ? "rtl" : "ltr"}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            {isRtl ? "إنشاء تقرير تلقائي" : "Auto-Generate Report"}
                        </DialogTitle>
                        <DialogDescription>
                            {isRtl
                                ? "سيتم جلب البيانات تلقائياً من المنصات المتصلة وإنشاء تقرير مسودة جاهز للمراجعة."
                                : "Data will be automatically pulled from connected platforms and a draft report will be created for your review."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>{isRtl ? "العميل" : "Client"}</Label>
                            <Select value={clientId} onValueChange={setClientId}>
                                <SelectTrigger>
                                    <SelectValue placeholder={isRtl ? "اختر العميل" : "Select client"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {clients.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>{isRtl ? "الشهر" : "Month"}</Label>
                            <Select value={month} onValueChange={setMonth}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {monthOptions.map((m) => (
                                        <SelectItem key={m.value} value={m.value}>
                                            {m.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="rounded-lg bg-primary/5 border border-primary/10 p-3 text-xs text-muted-foreground space-y-1">
                            <p className="font-medium text-primary">
                                {isRtl ? "ما سيتم جلبه تلقائياً:" : "What will be auto-fetched:"}
                            </p>
                            <ul className={`space-y-0.5 ${isRtl ? "pr-3" : "pl-3"} list-disc`}>
                                <li>{isRtl ? "بيانات فيسبوك وإنستجرام (إذا متصلة)" : "Facebook & Instagram data (if connected)"}</li>
                                <li>{isRtl ? "ملخص AI باللغتين" : "Bilingual AI summary"}</li>
                                <li>{isRtl ? "درجة SEO من ملف العميل" : "SEO score from client profile"}</li>
                            </ul>
                            <p className="text-muted-foreground/70 pt-1">
                                {isRtl
                                    ? "المنصات غير المتصلة ستبقى فارغة للإدخال اليدوي."
                                    : "Unconnected platforms will be empty for manual input."}
                            </p>
                        </div>
                    </div>

                    <DialogFooter className={isRtl ? "flex-row-reverse" : ""}>
                        <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                            {isRtl ? "إلغاء" : "Cancel"}
                        </Button>
                        <Button onClick={handleGenerate} disabled={loading} className="gap-2">
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    {isRtl ? "جاري الإنشاء..." : "Generating..."}
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4" />
                                    {isRtl ? "إنشاء التقرير" : "Generate Report"}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
