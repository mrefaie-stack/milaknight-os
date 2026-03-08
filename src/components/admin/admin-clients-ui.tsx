"use client";
import { useLanguage } from "@/contexts/language-context";

export function AdminClientsHeader({ clientCount, pendingCount }: { clientCount: number; pendingCount: number }) {
    const { isRtl } = useLanguage();
    return (
        <div className={isRtl ? "text-right" : ""}>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-primary/40 mb-1">
                {isRtl ? "محفظة العملاء" : "Client Portfolio"}
            </p>
            <h1 className="text-5xl font-black tracking-tighter premium-gradient-text uppercase">
                {isRtl ? "العملاء" : "Clients"}
            </h1>
            <p className="text-muted-foreground font-medium mt-1">
                {isRtl
                    ? `${clientCount} عميل نشط · ${pendingCount} بانتظار الموافقة`
                    : `${clientCount} active clients · ${pendingCount} pending approvals`}
            </p>
        </div>
    );
}
