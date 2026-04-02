"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KeywordExplorer } from "./keyword-explorer";
import { KeywordIdeas } from "./keyword-ideas";
import { useLanguage } from "@/contexts/language-context";
import { Search, Brain } from "lucide-react";

export function KeywordExplorerTabs() {
    const { isRtl } = useLanguage();

    return (
        <Tabs defaultValue="explorer" className="w-full">
            <TabsList className="mb-6 h-11 rounded-xl bg-muted/50 p-1">
                <TabsTrigger
                    value="explorer"
                    className="rounded-lg gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm"
                >
                    <Search className="h-4 w-4" />
                    {isRtl ? "مستكشف الكلمات" : "Keyword Explorer"}
                </TabsTrigger>
                <TabsTrigger
                    value="ideas"
                    className="rounded-lg gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm"
                >
                    <Brain className="h-4 w-4" />
                    {isRtl ? "أفكار الذكاء الاصطناعي" : "AI Keyword Ideas"}
                    <span className="bg-violet-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {isRtl ? "جديد" : "NEW"}
                    </span>
                </TabsTrigger>
            </TabsList>

            <TabsContent value="explorer">
                <KeywordExplorer />
            </TabsContent>

            <TabsContent value="ideas">
                <KeywordIdeas />
            </TabsContent>
        </Tabs>
    );
}
