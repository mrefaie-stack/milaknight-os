"use client";

import { useLanguage } from "@/contexts/language-context";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface ComingSoonViewProps {
    titleAr: string;
    titleEn: string;
    descAr: string;
    descEn: string;
    icon?: React.ReactNode;
}

export function ComingSoonView({ titleAr, titleEn, descAr, descEn, icon }: ComingSoonViewProps) {
    const { isRtl } = useLanguage();

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-8 px-4" dir={isRtl ? "rtl" : "ltr"}>
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative"
            >
                <div className="w-28 h-28 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    {icon || <Sparkles className="h-12 w-12" />}
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-black">
                    !
                </div>
            </motion.div>

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="space-y-3 max-w-md"
            >
                <h1 className="text-5xl font-black tracking-tighter premium-gradient-text uppercase">
                    {isRtl ? titleAr : titleEn}
                </h1>
                <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-5 py-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-widest text-primary">
                        {isRtl ? "قريباً" : "Coming Soon"}
                    </span>
                </div>
                <p className="text-muted-foreground font-medium text-lg opacity-70 mt-4">
                    {isRtl ? descAr : descEn}
                </p>
            </motion.div>
        </div>
    );
}
