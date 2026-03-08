"use client";

import { useState } from "react";
import { PlanApprovalHeader } from "@/components/action-plan/plan-approval-header";
import { ClientApprovalActions } from "@/components/action-plan/client-approval-actions";
import { DownloadActionPlanButton } from "@/components/action-plan/download-action-plan-button";
import {
    Image as ImageIcon,
    Video,
    AlignLeft,
    HelpCircle,
    MessageSquare,
    CalendarDays,
    CheckCircle2,
    Clock,
    AlertCircle,
    Megaphone,
    Layers,
    Mail,
    ExternalLink,
    Linkedin,
} from "lucide-react";

// ─── Section definitions ─────────────────────────────────────────────────────
// Order: Social Posts → Videos/Reels → LinkedIn → Polls → Blogs/Articles → Email Marketing
const SECTIONS = [
    {
        types: ["POST"],
        label: "منشورات السوشيال ميديا",
        labelEn: "Social Media Posts",
        icon: ImageIcon,
        color: "text-blue-500",
        accent: "from-blue-500/20 to-transparent",
        border: "border-blue-500/20",
    },
    {
        types: ["VIDEO"],
        label: "الريلز والفيديوهات",
        labelEn: "Videos & Reels",
        icon: Video,
        color: "text-purple-500",
        accent: "from-purple-500/20 to-transparent",
        border: "border-purple-500/20",
    },
    {
        types: ["LINKEDIN"],
        label: "لينكد إن",
        labelEn: "LinkedIn",
        icon: Linkedin,
        color: "text-sky-500",
        accent: "from-sky-500/20 to-transparent",
        border: "border-sky-500/20",
    },
    {
        types: ["POLL"],
        label: "تصويتات وستوريز",
        labelEn: "Polls & Stories",
        icon: HelpCircle,
        color: "text-orange-500",
        accent: "from-orange-500/20 to-transparent",
        border: "border-orange-500/20",
    },
    {
        types: ["ARTICLE"],
        label: "مقالات ومدونات",
        labelEn: "Blogs & Articles",
        icon: AlignLeft,
        color: "text-teal-500",
        accent: "from-teal-500/20 to-transparent",
        border: "border-teal-500/20",
    },
    {
        types: ["EMAIL"],
        label: "حملات البريد الإلكتروني",
        labelEn: "Email Marketing",
        icon: Mail,
        color: "text-rose-500",
        accent: "from-rose-500/20 to-transparent",
        border: "border-rose-500/20",
    },
    {
        types: ["AD"],
        label: "الإعلانات المدفوعة",
        labelEn: "Paid Ads",
        icon: Megaphone,
        color: "text-red-500",
        accent: "from-red-500/20 to-transparent",
        border: "border-red-500/20",
    },
];

const TYPE_META: Record<string, { label: string; icon: any; color: string; bg: string }> = {
    POST: { label: "Social Post", icon: ImageIcon, color: "text-blue-600", bg: "bg-blue-500/10" },
    VIDEO: { label: "Video / Reel", icon: Video, color: "text-purple-600", bg: "bg-purple-500/10" },
    LINKEDIN: { label: "LinkedIn", icon: Linkedin, color: "text-sky-600", bg: "bg-sky-500/10" },
    ARTICLE: { label: "Blog / Article", icon: AlignLeft, color: "text-teal-600", bg: "bg-teal-500/10" },
    POLL: { label: "Poll / Story", icon: HelpCircle, color: "text-orange-600", bg: "bg-orange-500/10" },
    EMAIL: { label: "Email Campaign", icon: Mail, color: "text-rose-600", bg: "bg-rose-500/10" },
    AD: { label: "Paid Ad", icon: Megaphone, color: "text-red-600", bg: "bg-red-500/10" },
};

const STATUS_META: Record<string, { label: string; icon: any; color: string; bg: string; border: string }> = {
    APPROVED: { label: "Approved", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    DRAFT: { label: "Draft", icon: Clock, color: "text-gray-500", bg: "bg-gray-500/10", border: "border-gray-500/20" },
    PENDING: { label: "Pending", icon: Clock, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
    NEEDS_EDIT: { label: "Needs Edit", icon: AlertCircle, color: "text-red-600", bg: "bg-red-500/10", border: "border-red-500/20" },
    PUBLISHED: { label: "Published", icon: CheckCircle2, color: "text-blue-600", bg: "bg-blue-500/10", border: "border-blue-500/20" },
};

const PLATFORM_COLORS = [
    "bg-blue-500", "bg-pink-500", "bg-black",
    "bg-yellow-400", "bg-blue-700", "bg-red-600", "bg-sky-500",
];

function PlatformPill({ name, idx }: { name: string; idx: number }) {
    const color = PLATFORM_COLORS[idx % PLATFORM_COLORS.length];
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black text-white ${color}`}>
            {name.trim()}
        </span>
    );
}

function ContentCard({ item }: { item: any }) {
    const type = TYPE_META[item.type] || TYPE_META.POST;
    const status = STATUS_META[item.status] || STATUS_META.PENDING;
    const TypeIcon = type.icon;
    const StatusIcon = status.icon;

    const platforms = (item.platform || "").split(/[,/]/).filter((p: string) => Boolean(p) && p.trim() !== "Email");
    const isEmail = item.type === "EMAIL";

    return (
        <div className="group relative flex flex-col rounded-2xl border border-white/10 bg-card/50 backdrop-blur-sm overflow-hidden shadow-md hover:shadow-xl hover:border-primary/20 hover:-translate-y-0.5 transition-all duration-300">

            {/* Email special header */}
            {isEmail && (
                <div className="p-4 bg-rose-500/10 border-b border-rose-500/10">
                    <div className="flex items-center gap-2 mb-1">
                        <Mail className="h-4 w-4 text-rose-500" />
                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Email Campaign</span>
                    </div>
                    <p className="font-black text-base leading-tight">{item.emailSubject || "—"}</p>
                </div>
            )}

            {/* Media Section (non-email) */}
            {!isEmail && (item.imageUrl || item.videoUrl) && (
                <div className="relative w-full aspect-video bg-black/30 overflow-hidden">
                    {item.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.imageUrl} alt="Content visual" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    )}
                    {item.videoUrl && !item.imageUrl && (
                        item.videoUrl.match(/\.(mp4|webm|ogg|mov)$/i) && !item.videoUrl.includes("drive.google.com") ? (
                            <video src={item.videoUrl} controls className="w-full h-full object-contain" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <a href={item.videoUrl} target="_blank" rel="noopener noreferrer"
                                    className="flex flex-col items-center gap-2 text-white/70 hover:text-white transition-colors">
                                    <div className="p-4 bg-white/10 rounded-full border border-white/20 backdrop-blur-sm">
                                        <Video className="h-8 w-8" />
                                    </div>
                                    <span className="text-xs font-bold">View Video</span>
                                </a>
                            </div>
                        )
                    )}
                    <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black ${type.bg} ${type.color} backdrop-blur-md border border-white/20`}>
                        <TypeIcon className="h-3 w-3" />
                        {type.label.toUpperCase()}
                    </div>
                    <div className={`absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black ${status.bg} ${status.color} border ${status.border} backdrop-blur-md`}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label.toUpperCase()}
                    </div>
                </div>
            )}

            {/* Card Body */}
            <div className="flex flex-col gap-3 p-5 flex-1">
                {/* Type + Status chips (no media cards or email) */}
                {!isEmail && !item.imageUrl && !item.videoUrl && (
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black ${type.bg} ${type.color}`}>
                            <TypeIcon className="h-3 w-3" /> {type.label.toUpperCase()}
                        </span>
                        <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black ${status.bg} ${status.color} border ${status.border}`}>
                            <StatusIcon className="h-3 w-3" /> {status.label.toUpperCase()}
                        </span>
                    </div>
                )}

                {/* Status chip for email */}
                {isEmail && (
                    <div className="flex items-center gap-2">
                        <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black ${status.bg} ${status.color} border ${status.border}`}>
                            <StatusIcon className="h-3 w-3" /> {status.label.toUpperCase()}
                        </span>
                    </div>
                )}

                {/* Platform pills */}
                {platforms.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {platforms.map((p: string, i: number) => <PlatformPill key={i} name={p} idx={i} />)}
                    </div>
                )}

                {/* Scheduled date */}
                {item.scheduledDate && (
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {new Date(item.scheduledDate).toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" })}
                        <span className="text-muted-foreground/40 mx-1">|</span>
                        {new Date(item.scheduledDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                    </div>
                )}

                {/* Per-Platform Captions */}
                {item.platformCaptions && (() => {
                    try {
                        const caps: Record<string, string> = JSON.parse(item.platformCaptions);
                        const entries = Object.entries(caps).filter(([, v]) => v?.trim());
                        if (entries.length === 0) return null;
                        return (
                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">كابشن لكل منصة</p>
                                {entries.map(([platform, caption]) => (
                                    <div key={platform} className="p-3 bg-muted/20 rounded-xl border border-muted/30">
                                        <p className="text-[10px] font-black text-primary mb-1">{platform}</p>
                                        <p className="text-foreground/80 text-sm whitespace-pre-wrap">{caption}</p>
                                    </div>
                                ))}
                            </div>
                        );
                    } catch { return null; }
                })()}

                {/* General Captions (fallback) */}
                <div className="space-y-2 text-sm leading-relaxed">
                    {!item.platformCaptions && item.captionAr && (
                        <div className="p-3 bg-muted/30 rounded-xl border border-muted/40" dir="rtl">
                            <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">الكابشن (عربي)</p>
                            <p className="text-foreground/80 text-sm">{item.captionAr}</p>
                        </div>
                    )}
                    {!item.platformCaptions && item.captionEn && (
                        <div className="p-3 bg-muted/30 rounded-xl border border-muted/40">
                            <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">{isEmail ? "Campaign Description" : "Caption (English)"}</p>
                            <p className="text-foreground/80 text-sm">{item.captionEn}</p>
                        </div>
                    )}

                    {/* Blog/Article */}
                    {item.articleTitle && (
                        <div className="p-3 bg-teal-500/5 rounded-xl border border-teal-500/10">
                            <p className="text-[10px] font-black uppercase text-teal-600 mb-1">Article Title</p>
                            <p className="font-bold">{item.articleTitle}</p>
                            {item.articleContent && <p className="text-muted-foreground text-xs mt-1">{item.articleContent}</p>}
                        </div>
                    )}

                    {/* Poll */}
                    {item.pollQuestion && (
                        <div className="p-4 bg-orange-500/5 rounded-xl border border-orange-500/10 space-y-2">
                            <p className="text-[10px] font-black uppercase text-orange-600 mb-2">Poll Question</p>
                            <p className="font-bold">{item.pollQuestion}</p>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                {[item.pollOptionA, item.pollOptionB].filter(Boolean).map((opt: string, i: number) => (
                                    <div key={i} className="px-3 py-2 bg-orange-500/10 rounded-lg text-sm font-medium text-center text-orange-700">
                                        {String.fromCharCode(65 + i)}. {opt}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Email body */}
                    {isEmail && item.emailBody && (
                        <div className="p-3 bg-rose-500/5 rounded-xl border border-rose-500/10">
                            <p className="text-[10px] font-black uppercase text-rose-600 mb-1">Email Body</p>
                            <p className="text-foreground/80 text-sm whitespace-pre-wrap">{item.emailBody}</p>
                        </div>
                    )}
                    {isEmail && item.emailDesign && (
                        <a href={item.emailDesign} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 p-3 bg-muted/20 rounded-xl border border-muted/30 hover:border-rose-500/30 transition-colors group/link">
                            <ExternalLink className="h-4 w-4 text-rose-500 shrink-0" />
                            <span className="text-sm font-bold text-rose-500 truncate">View Base Design / Template</span>
                        </a>
                    )}
                </div>

                {/* AM Notes */}
                {item.amComment && (
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 mt-auto">
                        <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="h-3.5 w-3.5 text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-wider text-primary">Account Manager Notes</span>
                        </div>
                        <p className="text-sm text-foreground/80 leading-relaxed">{item.amComment}</p>
                    </div>
                )}

                {/* Client Feedback */}
                {item.clientComment && (
                    <div className={`p-4 rounded-xl border ${item.feedbackResolved ? 'bg-muted/20 border-muted text-muted-foreground' : 'bg-orange-50 border-orange-200 text-orange-900'}`}>
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span className="text-[10px] font-black uppercase">Your Feedback {item.feedbackResolved ? "(Resolved ✓)" : ""}</span>
                        </div>
                        <p className="text-sm">{item.clientComment}</p>
                    </div>
                )}

                {/* Actions */}
                <div className="pt-2 border-t border-white/5 mt-2">
                    <ClientApprovalActions item={item} />
                </div>
            </div>
        </div>
    );
}

export function ClientActionPlanView({ plan, items }: { plan: any; items: any[] }) {
    const total = items.length;
    const approved = items.filter(i => i.status === "APPROVED").length;
    const pending = items.filter(i => i.status !== "APPROVED").length;

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Hero Header */}
            <div className="relative rounded-3xl overflow-hidden bg-card/40 backdrop-blur-xl border border-white/10 p-8 md:p-12 shadow-2xl">
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: "radial-gradient(circle at 20% 50%, #7c3aed 0%, transparent 50%), radial-gradient(circle at 80% 50%, #3b82f6 0%, transparent 50%)"
                }} />
                <div className="relative flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary/60">
                            <Layers className="h-3.5 w-3.5" />
                            خطة المحتوى الشهرية · Monthly Content Plan
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none">{plan.month}</h1>
                        <p className="text-muted-foreground font-medium">{total} بند محتوى مخطط لهذه الفترة · content items planned</p>
                        <div className="mt-4 space-y-1.5">
                            <div className="flex justify-between text-xs font-bold text-muted-foreground">
                                <span>{approved} معتمد · approved</span>
                                <span>{Math.round((approved / Math.max(total, 1)) * 100)}%</span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                                    style={{ width: `${(approved / Math.max(total, 1)) * 100}%` }} />
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <div className="text-center px-5 py-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                            <div className="text-2xl font-black text-emerald-600">{approved}</div>
                            <div className="text-[9px] font-black uppercase text-emerald-600/60">معتمد · Approved</div>
                        </div>
                        <div className="text-center px-5 py-3 bg-orange-500/10 rounded-2xl border border-orange-500/20">
                            <div className="text-2xl font-black text-orange-500">{pending}</div>
                            <div className="text-[9px] font-black uppercase text-orange-500/60">قيد المراجعة · Pending</div>
                        </div>
                        <DownloadActionPlanButton plan={plan} items={items} />
                    </div>
                </div>
            </div>

            {/* Approval Banner */}
            <PlanApprovalHeader planId={plan.id} status={plan.status} canApprove={true} />

            {/* Sectioned Items */}
            {items.length > 0 ? (
                <div className="space-y-12">
                    {SECTIONS.map(section => {
                        const sectionItems = items.filter(item => section.types.includes(item.type));
                        if (sectionItems.length === 0) return null;
                        const SectionIcon = section.icon;
                        return (
                            <div key={section.labelEn} className="space-y-5">
                                {/* Section Header */}
                                <div className={`flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r ${section.accent} border ${section.border}`}>
                                    <div className={`p-2 rounded-xl bg-white/5 border ${section.border}`}>
                                        <SectionIcon className={`h-5 w-5 ${section.color}`} />
                                    </div>
                                    <div>
                                        <h2 className={`text-xl font-black ${section.color}`}>{section.label}</h2>
                                        <p className="text-xs text-muted-foreground font-semibold opacity-70">{section.labelEn} · {sectionItems.length} {sectionItems.length === 1 ? "بند" : "بنود"}</p>
                                    </div>
                                    <div className="ml-auto">
                                        <span className={`text-xs font-black px-3 py-1 rounded-full bg-white/5 border ${section.border} ${section.color}`}>
                                            {sectionItems.filter(i => i.status === "APPROVED").length} / {sectionItems.length} معتمد
                                        </span>
                                    </div>
                                </div>
                                {/* Section Grid */}
                                <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                                    {sectionItems.map((item: any) => (
                                        <ContentCard key={item.id} item={item} />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="py-24 rounded-3xl border-2 border-dashed border-white/10 text-center">
                    <Layers className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                    <p className="text-muted-foreground font-semibold">No items available for review yet.</p>
                    <p className="text-sm text-muted-foreground opacity-60 mt-1">Your Account Manager will add content items soon.</p>
                </div>
            )}
        </div>
    );
}
