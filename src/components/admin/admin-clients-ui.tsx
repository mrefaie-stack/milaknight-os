"use client";
import { useLanguage } from "@/contexts/language-context";

export function AdminClientsHeader({ clientCount, pendingCount }: { clientCount: number; pendingCount: number }) {
    const { isRtl } = useLanguage();
    return (
        <div className={isRtl ? "text-right" : ""}>
            <p className="section-label text-muted-foreground mb-1">
                {isRtl ? "محفظة العملاء" : "Client Portfolio"}
            </p>
            <h1 className="text-2xl font-bold tracking-tight">
                {isRtl ? "العملاء" : "Clients"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
                {isRtl
                    ? `${clientCount} عميل نشط · ${pendingCount} بانتظار الموافقة`
                    : `${clientCount} active clients · ${pendingCount} pending approvals`}
            </p>
        </div>
    );
}
