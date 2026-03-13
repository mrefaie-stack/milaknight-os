"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/language-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Layers, ExternalLink, Loader2, Key } from "lucide-react";
import { toast } from "sonner";
import { connectClickup } from "@/app/actions/clickup";

export function ClickupConnect() {
    const { isRtl } = useLanguage();
    const router = useRouter();
    const [token, setToken] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleConnect() {
        if (!token.trim()) return;
        setLoading(true);
        try {
            await connectClickup(token.trim());
            toast.success(isRtl ? "تم ربط ClickUp بنجاح!" : "ClickUp connected successfully!");
            router.refresh();
        } catch (err: any) {
            toast.error(err.message || (isRtl ? "فشل الربط، تأكد من الـ Token" : "Connection failed. Check your token."));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div
            className="flex items-center justify-center min-h-[60vh]"
            dir={isRtl ? "rtl" : "ltr"}
        >
            <Card className="w-full max-w-md bg-card/50 border-white/5">
                <CardContent className="p-8 space-y-6">
                    {/* Header */}
                    <div className={`flex flex-col items-center gap-3 text-center`}>
                        <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
                            <Layers className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black premium-gradient-text">
                                {isRtl ? "ربط ClickUp" : "Connect ClickUp"}
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                {isRtl
                                    ? "أدخل الـ Personal API Token الخاص بك من ClickUp"
                                    : "Enter your ClickUp personal API token"}
                            </p>
                        </div>
                    </div>

                    {/* Token Input */}
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <Key className="h-3.5 w-3.5" />
                            {isRtl ? "API Token" : "API Token"}
                        </label>
                        <Input
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            placeholder="pk_..."
                            className="bg-white/5 border-white/10 font-mono text-sm"
                            dir="ltr"
                            onKeyDown={(e) => e.key === "Enter" && handleConnect()}
                        />
                    </div>

                    {/* Connect Button */}
                    <Button
                        onClick={handleConnect}
                        disabled={!token.trim() || loading}
                        className="w-full h-11 font-black uppercase tracking-widest"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <Layers className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
                        )}
                        {isRtl ? "ربط الحساب" : "Connect Account"}
                    </Button>

                    {/* Help link */}
                    <div className="text-center">
                        <a
                            href="https://app.clickup.com/settings/apps"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                        >
                            {isRtl ? "احصل على الـ Token من هنا" : "Get your token from ClickUp Settings"}
                            <ExternalLink className="h-3 w-3" />
                        </a>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
