"use client";

import { useState } from "react";
import { ReportFilter } from "./report-filter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { BarChart3, Settings, ExternalLink, Calendar, GitCompare, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function ReportListClient({
    initialReports,
    role
}: {
    initialReports: any[],
    role: "AM" | "CLIENT" | "ADMIN"
}) {
    const { t, isRtl } = useLanguage();
    const router = useRouter();
    const [reports, setReports] = useState(initialReports);
    const [filteredReports, setFilteredReports] = useState(initialReports);

    // Comparison state
    const [isCompareMode, setIsCompareMode] = useState(false);
    const [selectedReports, setSelectedReports] = useState<string[]>([]);

    const handleFilter = (month: string | null, year: string | null) => {
        let filtered = initialReports;

        if (month) {
            filtered = filtered.filter(r => r.month.split("-")[1] === month);
        }

        if (year) {
            filtered = filtered.filter(r => r.month.split("-")[0] === year);
        }

        setFilteredReports(filtered);
    };

    const toggleSelection = (report: any) => {
        if (!isCompareMode) return;

        // Ensure same client is selected
        if (selectedReports.length > 0) {
            const firstSelected = initialReports.find(r => r.id === selectedReports[0]);
            if (firstSelected && firstSelected.clientId !== report.clientId) {
                toast.error(t("common.compare_same_client_error") || "Can only compare reports for the same client.");
                return;
            }
        }

        setSelectedReports(prev =>
            prev.includes(report.id) ? prev.filter(id => id !== report.id) : [...prev, report.id]
        );
    };

    const handleCompare = () => {
        if (selectedReports.length < 2) {
            toast.error(t("common.select_more_reports") || "Please select at least 2 reports to compare.");
            return;
        }

        const idsParams = selectedReports.join(",");
        const basePath = role === 'CLIENT' ? '/client' : role === 'ADMIN' ? '/admin' : '/am';
        router.push(`${basePath}/reports/compare?ids=${idsParams}`);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/30 p-4 rounded-3xl border border-white/5 backdrop-blur-md relative z-20">
                <ReportFilter onFilter={handleFilter} />

                <div className="flex items-center gap-3">
                    <Button
                        variant={isCompareMode ? "default" : "outline"}
                        onClick={() => {
                            setIsCompareMode(!isCompareMode);
                            if (isCompareMode) setSelectedReports([]);
                        }}
                        className={`rounded-2xl transition-all ${isCompareMode ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' : ''}`}
                    >
                        <GitCompare className="mr-2 h-4 w-4" />
                        {isCompareMode ? (t("common.cancel") || "Cancel Compare") : (t("common.compare_reports") || "Compare Reports")}
                    </Button>

                    {isCompareMode && selectedReports.length > 0 && (
                        <Button
                            onClick={handleCompare}
                            className="rounded-2xl bg-indigo-500 hover:bg-indigo-600 outline outline-2 outline-offset-2 outline-indigo-500 text-white shadow-xl shadow-indigo-500/30 animate-in slide-in-from-right-4"
                        >
                            {t("common.compare") || "Compare"} ({selectedReports.length})
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredReports.map((report) => {
                    const isSelected = selectedReports.includes(report.id);

                    return (
                        <div
                            key={report.id}
                            onClick={() => isCompareMode && toggleSelection(report)}
                            className={`group relative p-6 border rounded-3xl bg-card/50 backdrop-blur-sm transition-all overflow-hidden ${isCompareMode ? 'cursor-pointer hover:border-primary/80' : 'hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5'} ${isSelected ? 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-500/5' : ''}`}
                        >
                            {isCompareMode && (
                                <div className="absolute top-4 right-4 z-20">
                                    <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-muted-foreground/30 group-hover:border-primary/50'}`}>
                                        {isSelected && <CheckCircle2 className="h-4 w-4" />}
                                    </div>
                                </div>
                            )}

                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                                <BarChart3 className="h-24 w-24 -mr-8 -mt-8" />
                            </div>

                            <div className="relative z-10 flex flex-col h-full pointer-events-none">
                                <div className="flex items-center gap-2 mb-2">
                                    <Calendar className="h-4 w-4 text-primary" />
                                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                                        {report.month}
                                    </span>
                                </div>

                                <h3 className="font-black text-2xl mb-1 truncate">{report.client.name}</h3>
                                <div className="flex gap-2 mb-6">
                                    <Badge variant="outline" className={`text-[10px] font-black uppercase ${report.status === 'SENT' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' : 'bg-orange-500/10 text-orange-600 border-orange-200'}`}>
                                        {report.status}
                                    </Badge>
                                </div>

                                <div className="mt-auto flex gap-2 pointer-events-auto">
                                    {!isCompareMode ? (
                                        <>
                                            <Link href={`/${role === 'CLIENT' ? 'client' : 'am'}/reports/${report.id}`} className="flex-1">
                                                <Button className="w-full font-bold rounded-2xl h-12 shadow-lg shadow-primary/10">
                                                    {isRtl ? 'عرض التقرير' : 'View Dashboard'}
                                                </Button>
                                            </Link>
                                            {role === 'AM' && (
                                                <Link href={`/am/reports/${report.id}/edit`}>
                                                    <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-2 hover:bg-primary/5 hover:text-primary transition-all">
                                                        <Settings className="h-5 w-5" />
                                                    </Button>
                                                </Link>
                                            )}
                                        </>
                                    ) : (
                                        <div className="h-12 flex items-center justify-center w-full rounded-2xl border border-dashed text-xs font-bold text-muted-foreground">
                                            {isSelected ? (isRtl ? 'تم الاختيار ✓' : 'Selected ✓') : (isRtl ? 'اضغط للاختيار' : 'Click to select')}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {filteredReports.length === 0 && (
                    <div className="col-span-full py-24 border-2 border-dashed rounded-3xl text-center bg-card/30 backdrop-blur-sm">
                        <div className="max-w-xs mx-auto space-y-4">
                            <div className="p-4 bg-muted rounded-full w-fit mx-auto">
                                <BarChart3 className="h-8 w-8 text-muted-foreground opacity-20" />
                            </div>
                            <h3 className="text-xl font-bold opacity-50">{isRtl ? 'لا توجد تقارير' : 'No Reports Found'}</h3>
                            <p className="text-muted-foreground">{isRtl ? 'عدّل الفلاتر أو أنشئ تقريراً جديداً.' : 'Adjust your filters or generate a new report to get started.'}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
