"use client";

import { useState, useEffect } from "react";
import { Clock, Loader2, ChevronDown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HistoryViewerProps {
    toolName: string;
    onSelect: (resultData: any, inputData?: any) => void;
}

export function SeoHistoryViewer({ toolName, onSelect }: HistoryViewerProps) {
    const { t, isRtl } = useLanguage();
    const [history, setHistory] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const fetchHistory = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/seo/history?toolName=${toolName}`);
            if (res.ok) {
                const data = await res.json();
                setHistory(data);
            }
        } catch (e) {
            console.error("Failed to fetch history");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpen = (open: boolean) => {
        setIsOpen(open);
        if (open && history.length === 0) {
            fetchHistory();
        }
    };

    const formatInputLabel = (inputData: any) => {
        if (!inputData) return "Unknown";
        if (inputData.keyword) return `"${inputData.keyword}"`;
        if (inputData.url) return inputData.url.replace(/^https?:\/\//, '').substring(0, 30);
        return "Previous Run";
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={handleOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {isRtl ? "سجل العمليات السابقة" : "History"}
                    <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isRtl ? "start" : "end"} className="w-64 max-h-[300px] overflow-y-auto">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {isRtl ? "عمليات البحث السابقة" : "Previous Runs"}
                </div>
                
                {isLoading ? (
                    <div className="p-4 flex justify-center">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                ) : history.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                        {isRtl ? "لا يوجد سجل حتى الآن" : "No history yet"}
                    </div>
                ) : (
                    history.map((record) => (
                        <DropdownMenuItem 
                            key={record.id}
                            className="flex flex-col items-start py-2 cursor-pointer gap-1"
                            onClick={() => onSelect(record.resultData, record.inputData)}
                        >
                            <span className="font-medium text-[13px] truncate w-full">
                                {formatInputLabel(record.inputData)}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                                {formatDistanceToNow(new Date(record.createdAt), { 
                                    addSuffix: true,
                                    locale: isRtl ? ar : enUS 
                                })}
                            </span>
                        </DropdownMenuItem>
                    ))
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
