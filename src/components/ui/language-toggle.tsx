"use client";

import { useLanguage } from "@/contexts/language-context";
import { Button } from "./button";
import { Globe } from "lucide-react";

export function LanguageToggle() {
    const { language, setLanguage, isRtl } = useLanguage();

    const toggleLanguage = () => {
        setLanguage(language === 'ar' ? 'en' : 'ar');
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest hover:bg-primary/10 transition-all rounded-full border border-white/5 px-4 h-8"
        >
            <Globe className="h-3 w-3 text-primary animate-pulse" />
            <span className="opacity-70 group-hover:opacity-100">{language === 'ar' ? 'English' : 'عربي'}</span>
        </Button>
    );
}
