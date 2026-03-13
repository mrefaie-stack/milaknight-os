"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layers, Loader2, AlertCircle } from "lucide-react";
import { getClickupAuthUrl } from "@/app/actions/clickup";
import { useSearchParams } from "next/navigation";

const ERROR_MESSAGES: Record<string, { ar: string; en: string }> = {
    denied: { ar: "تم رفض الإذن من ClickUp", en: "Authorization was denied by ClickUp" },
    token: { ar: "فشل الحصول على رمز الوصول، حاول مرة أخرى", en: "Failed to get access token, please try again" },
    team: { ar: "لم يتم العثور على workspace في حسابك", en: "No workspace found in your ClickUp account" },
};

export function ClickupConnect() {
    const { isRtl } = useLanguage();
    const searchParams = useSearchParams();
    const errorCode = searchParams.get("error");
    const errorMsg = errorCode ? ERROR_MESSAGES[errorCode] : null;
    const [loading, setLoading] = useState(false);

    async function handleConnect() {
        setLoading(true);
        const url = await getClickupAuthUrl();
        window.location.href = url;
    }

    return (
        <div
            className="flex items-center justify-center min-h-[60vh]"
            dir={isRtl ? "rtl" : "ltr"}
        >
            <Card className="w-full max-w-md bg-card/50 border-white/5">
                <CardContent className="p-8 space-y-6">
                    {/* Header */}
                    <div className="flex flex-col items-center gap-3 text-center">
                        <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
                            <Layers className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black premium-gradient-text">
                                {isRtl ? "ربط ClickUp" : "Connect ClickUp"}
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                {isRtl
                                    ? "اضغط لتسجيل الدخول عبر ClickUp مباشرةً"
                                    : "Click to authorize your ClickUp account"}
                            </p>
                        </div>
                    </div>

                    {/* Error message if OAuth failed */}
                    {errorMsg && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>{isRtl ? errorMsg.ar : errorMsg.en}</span>
                        </div>
                    )}

                    {/* OAuth Button */}
                    <Button
                        onClick={handleConnect}
                        disabled={loading}
                        className="w-full h-12 font-black uppercase tracking-widest text-sm"
                    >
                        {loading ? (
                            <Loader2 className={`h-4 w-4 animate-spin ${isRtl ? "ml-2" : "mr-2"}`} />
                        ) : (
                            <Layers className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
                        )}
                        {loading
                            ? (isRtl ? "جارٍ التوجيه..." : "Redirecting...")
                            : (isRtl ? "تسجيل الدخول عبر ClickUp" : "Login with ClickUp")}
                    </Button>

                    <p className="text-center text-[11px] text-muted-foreground">
                        {isRtl
                            ? "سيتم توجيهك لـ ClickUp للموافقة، ثم ترجع هنا تلقائياً"
                            : "You'll be redirected to ClickUp to authorize, then returned here automatically"}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
