"use client";
import { useLanguage } from "@/contexts/language-context";

export function AdminTeamHeader({ memberCount, totalClients }: { memberCount: number; totalClients: number }) {
    const { isRtl } = useLanguage();
    return (
        <div className={`flex flex-col md:flex-row md:items-end justify-between gap-6 ${isRtl ? 'md:flex-row-reverse text-right' : ''}`}>
            <div>
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-primary/40 mb-1">
                    {isRtl ? "فريق الوكالة" : "Agency Team"}
                </p>
                <h1 className="text-3xl md:text-5xl font-black tracking-tighter premium-gradient-text uppercase">
                    {isRtl ? "الفريق" : "Team"}
                </h1>
                <p className="text-muted-foreground font-medium mt-1">
                    {isRtl
                        ? `${memberCount} أعضاء · ${totalClients} عميل مُسنّد إجمالاً`
                        : `${memberCount} members · ${totalClients} total assigned clients`}
                </p>
            </div>
        </div>
    );
}

export function TeamMemberRoleBadge({ role }: { role: string }) {
    const { isRtl } = useLanguage();
    const ROLE_META_AR: Record<string, string> = {
        ADMIN: "مسؤول النظام",
        ACCOUNT_MANAGER: "مدير حساب",
        AM: "مدير حساب",
        MARKETING_MANAGER: "مدير تسويق",
        MODERATOR: "موديريتور (ناشر)",
        CLIENT: "عميل",
    };
    const ROLE_META_EN: Record<string, string> = {
        ADMIN: "Admin",
        ACCOUNT_MANAGER: "Account Manager",
        AM: "Account Manager",
        MARKETING_MANAGER: "Marketing Manager",
        MODERATOR: "Moderator",
        CLIENT: "Client",
    };
    return <>{isRtl ? (ROLE_META_AR[role] || role) : (ROLE_META_EN[role] || role)}</>;
}

export function ClientLoadLabel({ load, isHeavy }: { load: number; isHeavy: boolean }) {
    const { isRtl } = useLanguage();
    return (
        <div className="flex justify-between text-xs font-black">
            <span className="text-muted-foreground opacity-60 uppercase tracking-wider">
                {isRtl ? "حجم العملاء" : "Client Load"}
            </span>
            <span className={isHeavy ? "text-orange-500" : "text-emerald-500"}>
                {isRtl ? `${load} عملاء` : `${load} Clients`}
            </span>
        </div>
    );
}

export function TeamStats({ totalMembers, amsCount, adminsCount, moderatorsCount, mmCount, totalClients }: {
    totalMembers: number; amsCount: number; adminsCount: number; moderatorsCount: number; mmCount: number; totalClients: number;
}) {
    const { isRtl } = useLanguage();
    const stats = [
        { ar: "إجمالي الأعضاء", en: "Total Members", value: totalMembers, color: "text-primary", bg: "bg-primary/5 border-primary/20" },
        { ar: "مديرو الحسابات", en: "Account Managers", value: amsCount, color: "text-blue-500", bg: "bg-blue-500/5 border-blue-500/20" },
        { ar: "مديرو التسويق", en: "Marketing Managers", value: mmCount, color: "text-emerald-500", bg: "bg-emerald-500/5 border-emerald-500/20" },
        { ar: "المشرفون", en: "Moderators", value: moderatorsCount, color: "text-orange-500", bg: "bg-orange-500/5 border-orange-500/20" },
        { ar: "المسؤولون", en: "Admins", value: adminsCount, color: "text-purple-500", bg: "bg-purple-500/5 border-purple-500/20" },
        { ar: "العملاء المُسنّدون", en: "Clients Covered", value: totalClients, color: "text-emerald-500", bg: "bg-emerald-500/5 border-emerald-500/20" },
    ];
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map(s => (
                <div key={s.en} className={`p-5 rounded-2xl border ${s.bg} ${isRtl ? 'text-right' : ''}`}>
                    <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60 mb-1">
                        {isRtl ? s.ar : s.en}
                    </div>
                    <div className={`text-4xl font-black tracking-tighter ${s.color}`}>{s.value}</div>
                </div>
            ))}
        </div>
    );
}

export function MessageButtonLabel() {
    const { isRtl } = useLanguage();
    return <>{isRtl ? "رسالة" : "Message"}</>;
}

export function NoTeamMembers() {
    const { isRtl } = useLanguage();
    return (
        <p className="text-muted-foreground italic font-bold">
            {isRtl ? "لا يوجد أعضاء في الفريق بعد. ادعُ أول مدير حساب من الأعلى." : "No team members yet. Invite your first AM above."}
        </p>
    );
}
