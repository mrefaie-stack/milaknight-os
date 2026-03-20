"use client";
import { useLanguage } from "@/contexts/language-context";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function AdminTeamHeader({ memberCount, totalClients }: { memberCount: number; totalClients: number }) {
    const { isRtl } = useLanguage();
    return (
        <div className={cn("flex flex-col md:flex-row md:items-end justify-between gap-4", isRtl ? "md:flex-row-reverse text-right" : "")}>
            <div>
                <p className="section-label text-muted-foreground mb-1">
                    {isRtl ? "فريق الوكالة" : "Agency Team"}
                </p>
                <h1 className="text-2xl font-bold tracking-tight">
                    {isRtl ? "الفريق" : "Team"}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
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
        ADMIN: "مسؤول النظام", ACCOUNT_MANAGER: "مدير حساب", AM: "مدير حساب",
        MARKETING_MANAGER: "مدير تسويق", MODERATOR: "موديريتور (ناشر)", HR_MANAGER: "مدير الموارد البشرية",
        CLIENT: "عميل", CONTENT_TEAM: "كونتنت تيم", CONTENT_LEADER: "كونتنت ليدر",
        ART_TEAM: "آرت تيم", ART_LEADER: "آرت ليدر", SEO_TEAM: "سيو تيم", SEO_LEAD: "سيو ليد",
    };
    const ROLE_META_EN: Record<string, string> = {
        ADMIN: "Admin", ACCOUNT_MANAGER: "Account Manager", AM: "Account Manager",
        MARKETING_MANAGER: "Marketing Manager", MODERATOR: "Moderator", HR_MANAGER: "HR Manager",
        CLIENT: "Client", CONTENT_TEAM: "Content Team", CONTENT_LEADER: "Content Leader",
        ART_TEAM: "Art Team", ART_LEADER: "Art Leader", SEO_TEAM: "SEO Team", SEO_LEAD: "SEO Lead",
    };
    return <>{isRtl ? (ROLE_META_AR[role] || role) : (ROLE_META_EN[role] || role)}</>;
}

export function ClientLoadLabel({ load, isHeavy }: { load: number; isHeavy: boolean }) {
    const { isRtl } = useLanguage();
    return (
        <div className="flex justify-between text-xs">
            <span className="section-label text-muted-foreground">
                {isRtl ? "حجم العملاء" : "Client Load"}
            </span>
            <span className={isHeavy ? "text-orange-500 font-medium" : "text-emerald-500 font-medium"}>
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
        { ar: "إجمالي الأعضاء",    en: "Total Members",       value: totalMembers,    className: "" },
        { ar: "مديرو الحسابات",    en: "Account Managers",    value: amsCount,        className: "text-blue-500" },
        { ar: "مديرو التسويق",     en: "Marketing Managers",  value: mmCount,         className: "text-emerald-500" },
        { ar: "المشرفون",           en: "Moderators",          value: moderatorsCount, className: "text-orange-500" },
        { ar: "المسؤولون",          en: "Admins",              value: adminsCount,     className: "text-violet-500" },
        { ar: "العملاء المُسنّدون", en: "Clients Covered",    value: totalClients,    className: "text-emerald-500" },
    ];
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stats.map(s => (
                <Card key={s.en}>
                    <CardHeader className="pb-1 pt-4">
                        <p className={cn("section-label text-[10px] text-muted-foreground", isRtl ? "text-right" : "")}>
                            {isRtl ? s.ar : s.en}
                        </p>
                    </CardHeader>
                    <CardContent className="pt-0 pb-4">
                        <div className={cn("text-2xl font-bold tracking-tight", s.className, isRtl ? "text-right" : "")}>
                            {s.value}
                        </div>
                    </CardContent>
                </Card>
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
        <p className="text-sm text-muted-foreground">
            {isRtl ? "لا يوجد أعضاء في الفريق بعد. ادعُ أول مدير حساب من الأعلى." : "No team members yet. Invite your first AM above."}
        </p>
    );
}
