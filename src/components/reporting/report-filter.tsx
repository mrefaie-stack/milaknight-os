"use client";

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

export function ReportFilter({ onFilter }: { onFilter: (month: string | null, year: string | null) => void }) {
    const { isRtl } = useLanguage();
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
    const [selectedYear, setSelectedYear] = useState<string | null>(null);

    const months = [
        { ar: "يناير", en: "January", value: "01" },
        { ar: "فبراير", en: "February", value: "02" },
        { ar: "مارس", en: "March", value: "03" },
        { ar: "أبريل", en: "April", value: "04" },
        { ar: "مايو", en: "May", value: "05" },
        { ar: "يونيو", en: "June", value: "06" },
        { ar: "يوليو", en: "July", value: "07" },
        { ar: "أغسطس", en: "August", value: "08" },
        { ar: "سبتمبر", en: "September", value: "09" },
        { ar: "أكتوبر", en: "October", value: "10" },
        { ar: "نوفمبر", en: "November", value: "11" },
        { ar: "ديسمبر", en: "December", value: "12" },
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

    const handleFilter = (m: string | null, y: string | null) => {
        onFilter(m, y);
    };

    const clearFilters = () => {
        setSelectedMonth(null);
        setSelectedYear(null);
        onFilter(null, null);
    };

    return (
        <div className={`flex flex-wrap items-center gap-4 bg-card/30 p-4 rounded-2xl border backdrop-blur-sm ${isRtl ? 'flex-row-reverse' : ''}`}>
            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                {isRtl ? "فلتر الأرشيف" : "Filter Archive"}
            </span>

            <div className="w-40">
                <Select value={selectedMonth || ""} onValueChange={(v) => { setSelectedMonth(v); handleFilter(v, selectedYear); }}>
                    <SelectTrigger className="bg-background rounded-full border-none shadow-sm h-10 px-4">
                        <SelectValue placeholder={isRtl ? "كل الأشهر" : "All Months"} />
                    </SelectTrigger>
                    <SelectContent>
                        {months.map(m => (
                            <SelectItem key={m.value} value={m.value}>
                                {isRtl ? m.ar : m.en}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="w-32">
                <Select value={selectedYear || ""} onValueChange={(v) => { setSelectedYear(v); handleFilter(selectedMonth, v); }}>
                    <SelectTrigger className="bg-background rounded-full border-none shadow-sm h-10 px-4">
                        <SelectValue placeholder={isRtl ? "كل السنوات" : "All Years"} />
                    </SelectTrigger>
                    <SelectContent>
                        {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            {(selectedMonth || selectedYear) && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className={`text-muted-foreground hover:text-foreground font-bold flex items-center gap-1 px-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <X className="h-4 w-4" /> {isRtl ? "مسح" : "Clear"}
                </Button>
            )}
        </div>
    );
}
