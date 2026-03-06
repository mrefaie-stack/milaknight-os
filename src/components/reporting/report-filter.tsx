"use client";

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function ReportFilter({ onFilter }: { onFilter: (month: string | null, year: string | null) => void }) {
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
    const [selectedYear, setSelectedYear] = useState<string | null>(null);

    const months = [
        { label: "January", value: "01" },
        { label: "February", value: "02" },
        { label: "March", value: "03" },
        { label: "April", value: "04" },
        { label: "May", value: "05" },
        { label: "June", value: "06" },
        { label: "July", value: "07" },
        { label: "August", value: "08" },
        { label: "September", value: "09" },
        { label: "October", value: "10" },
        { label: "November", value: "11" },
        { label: "December", value: "12" },
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
        <div className="flex flex-wrap items-center gap-4 bg-card/30 p-4 rounded-2xl border backdrop-blur-sm">
            <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-2">Filter Archive</span>
            </div>

            <div className="w-40">
                <Select value={selectedMonth || ""} onValueChange={(v) => { setSelectedMonth(v); handleFilter(v, selectedYear); }}>
                    <SelectTrigger className="bg-background rounded-full border-none shadow-sm h-10 px-4">
                        <SelectValue placeholder="All Months" />
                    </SelectTrigger>
                    <SelectContent>
                        {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            <div className="w-32">
                <Select value={selectedYear || ""} onValueChange={(v) => { setSelectedYear(v); handleFilter(selectedMonth, v); }}>
                    <SelectTrigger className="bg-background rounded-full border-none shadow-sm h-10 px-4">
                        <SelectValue placeholder="All Years" />
                    </SelectTrigger>
                    <SelectContent>
                        {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            {(selectedMonth || selectedYear) && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-foreground font-bold flex items-center gap-1 px-4">
                    <X className="h-4 w-4" /> Clear
                </Button>
            )}
        </div>
    );
}
