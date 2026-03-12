'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, DollarSign, MousePointer2, Eye, Loader2, Facebook, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/language-context';

export function LiveMetrics() {
    const { isRtl } = useLanguage();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const res = await fetch('/api/dashboard/live/meta');
                const json = await res.json();
                if (!res.ok) throw new Error(json.error || 'Failed to fetch');
                setData(json);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="h-64 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-muted-foreground animate-pulse font-bold uppercase tracking-widest text-xs">
                    {isRtl ? "جاري جلب البيانات المباشرة..." : "Fetching Live Metrics..."}
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-12 border-2 border-dashed border-red-500/20 rounded-3xl bg-red-500/5 text-center space-y-4">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <div>
                    <h3 className="text-xl font-black text-red-500 capitalize">
                        {isRtl ? "فشل الاتصال" : "Connection Required"}
                    </h3>
                    <p className="text-muted-foreground max-w-md mx-auto mt-2">
                        {isRtl 
                            ? "يرجى التأكد من ربط حساب Meta الخاص بك من الإعدادات لعرض البيانات الحية." 
                            : "Please ensure your Meta account is connected in settings to view live advertising metrics."}
                    </p>
                </div>
            </div>
        );
    }

    const cards = [
        { label: isRtl ? "الإنفاق (اليوم)" : "Spend (Today)", value: `SAR ${data.metrics.spend}`, color: "text-orange-500", icon: <DollarSign className="w-4 h-4" /> },
        { label: isRtl ? "الظهور" : "Impressions", value: data.metrics.impressions.toLocaleString(), color: "text-primary", icon: <Eye className="w-4 h-4" /> },
        { label: isRtl ? "النقرات" : "Clicks", value: data.metrics.clicks.toLocaleString(), color: "text-emerald-500", icon: <MousePointer2 className="w-4 h-4" /> },
        { label: isRtl ? "تكلفة النقرة" : "Avg. CPC", value: `SAR ${data.metrics.cpc}`, color: "text-blue-500", icon: <BarChart className="w-4 h-4" /> },
    ];

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#1877F2]/10 rounded-lg">
                        <Facebook className="w-5 h-5 text-[#1877F2]" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black uppercase tracking-tight">{data.accountName}</h3>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Live Now</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 grid-cols-2 md:grid-cols-4">
                {cards.map((card, i) => (
                    <motion.div
                        key={card.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <Card className="glass-card border-none rounded-2xl overflow-hidden hover-lift bg-white/[0.02]">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 flex items-center gap-2">
                                    {card.icon}
                                    {card.label}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className={`text-3xl font-black tracking-tighter ${card.color}`}>
                                    {card.value}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <div className="p-6 bg-primary/5 border border-primary/10 rounded-2xl">
                <p className="text-xs font-medium text-muted-foreground italic">
                    {isRtl 
                        ? "* يتم تحديث هذه البيانات مباشرة من Meta Graph API كل ساعة لضمان الدقة."
                        : "* This data is fetched directly from Meta Graph API and refreshed hourly for precision."}
                </p>
            </div>
        </div>
    );
}
