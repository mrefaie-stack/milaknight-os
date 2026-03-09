"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import { PlanApprovalHeader } from "@/components/action-plan/plan-approval-header";
import { ClientApprovalActions } from "@/components/action-plan/client-approval-actions";
import { DownloadActionPlanButton } from "@/components/action-plan/download-action-plan-button";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { VideoPlayer } from "@/components/ui/video-player";
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
    Download,
    X,
    LayoutGrid,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

// ─── Section definitions ─────────────────────────────────────────────────────
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

const TYPE_META_BI: Record<string, { ar: string; en: string; icon: any; color: string; bg: string }> = {
    POST: { ar: "منشور سوشيال", en: "Social Post", icon: ImageIcon, color: "text-blue-600", bg: "bg-blue-500/10" },
    VIDEO: { ar: "فيديو / ريلز", en: "Video / Reel", icon: Video, color: "text-purple-600", bg: "bg-purple-500/10" },
    LINKEDIN: { ar: "لينكد إن", en: "LinkedIn", icon: Linkedin, color: "text-sky-600", bg: "bg-sky-500/10" },
    ARTICLE: { ar: "مقال", en: "Blog / Article", icon: AlignLeft, color: "text-teal-600", bg: "bg-teal-500/10" },
    POLL: { ar: "تصويت / ستوري", en: "Poll / Story", icon: HelpCircle, color: "text-orange-600", bg: "bg-orange-500/10" },
    EMAIL: { ar: "حملة بريدية", en: "Email Campaign", icon: Mail, color: "text-rose-600", bg: "bg-rose-500/10" },
    AD: { ar: "إعلان مدفوع", en: "Paid Ad", icon: Megaphone, color: "text-red-600", bg: "bg-red-500/10" },
};

const STATUS_META_BI: Record<string, { ar: string; en: string; icon: any; color: string; bg: string; border: string }> = {
    APPROVED: { ar: "معتمد", en: "Approved", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    DRAFT: { ar: "مسودة", en: "Draft", icon: Clock, color: "text-gray-500", bg: "bg-gray-500/10", border: "border-gray-500/20" },
    PENDING: { ar: "قيد المراجعة", en: "Pending", icon: Clock, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
    NEEDS_EDIT: { ar: "يحتاج تعديل", en: "Needs Edit", icon: AlertCircle, color: "text-red-600", bg: "bg-red-500/10", border: "border-red-500/20" },
    PUBLISHED: { ar: "منشور", en: "Published", icon: CheckCircle2, color: "text-blue-600", bg: "bg-blue-500/10", border: "border-blue-500/20" },
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

function ContentCard({ item, isRtl, onImageClick, isModerator }: { item: any; isRtl: boolean; onImageClick?: (url: string) => void, isModerator?: boolean }) {
    const typeMeta = TYPE_META_BI[item.type] || TYPE_META_BI.POST;
    const statusMeta = STATUS_META_BI[item.status] || STATUS_META_BI.PENDING;
    const type = { ...typeMeta, label: isRtl ? typeMeta.ar : typeMeta.en };
    const status = { ...statusMeta, label: isRtl ? statusMeta.ar : statusMeta.en };
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
                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{isRtl ? 'حملة بريدية' : 'Email Campaign'}</span>
                    </div>
                    <p className="font-black text-base leading-tight">{item.emailSubject || "—"}</p>
                </div>
            )}

            {/* Media Section (non-email) */}
            {!isEmail && (item.imageUrl || item.videoUrl) && (
                <div className="relative w-full overflow-hidden group/media">
                    {item.imageUrl && (
                        <div
                            className="aspect-video cursor-zoom-in"
                            onClick={() => onImageClick?.(item.imageUrl!)}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.imageUrl} alt="Content visual" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        </div>
                    )}
                    {item.videoUrl && !item.imageUrl && (
                        <VideoPlayer url={item.videoUrl} isRtl={isRtl} />
                    )}
                    <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black ${type.bg} ${type.color} backdrop-blur-md border border-white/20 z-10`}>
                        <TypeIcon className="h-3 w-3" />
                        {type.label.toUpperCase()}
                    </div>
                    <div className={`absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black ${status.bg} ${status.color} border ${status.border} backdrop-blur-md z-10`}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label.toUpperCase()}
                    </div>
                </div>
            )}

            {/* Card Body */}
            <div className="flex flex-col gap-3 p-5 flex-1">
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

                {isEmail && (
                    <div className="flex items-center gap-2">
                        <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black ${status.bg} ${status.color} border ${status.border}`}>
                            <StatusIcon className="h-3 w-3" /> {status.label.toUpperCase()}
                        </span>
                    </div>
                )}

                {platforms.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {platforms.map((p: string, i: number) => <PlatformPill key={i} name={p} idx={i} />)}
                    </div>
                )}

                {item.scheduledDate && (
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {new Date(item.scheduledDate).toISOString().split('T')[0]}
                    </div>
                )}

                {item.platformCaptions && (() => {
                    try {
                        const caps: Record<string, string> = JSON.parse(item.platformCaptions);
                        const entries = Object.entries(caps).filter(([, v]) => v?.trim());
                        if (entries.length === 0) return null;

                        const PLATFORM_THEMES: Record<string, { bg: string, text: string, border: string, icon: any }> = {
                            Facebook: { bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/20', icon: ImageIcon },
                            Instagram: { bg: 'bg-pink-500/10', text: 'text-pink-600', border: 'border-pink-500/20', icon: ImageIcon },
                            TikTok: { bg: 'bg-slate-900/10', text: 'text-slate-900', border: 'border-slate-900/20', icon: Video },
                            LinkedIn: { bg: 'bg-sky-600/10', text: 'text-sky-700', border: 'border-sky-600/20', icon: Linkedin },
                            Snapchat: { bg: 'bg-yellow-400/10', text: 'text-yellow-600', border: 'border-yellow-400/20', icon: ImageIcon },
                            YouTube: { bg: 'bg-red-600/10', text: 'text-red-700', border: 'border-red-600/20', icon: Video },
                            Twitter: { bg: 'bg-sky-400/10', text: 'text-sky-500', border: 'border-sky-400/20', icon: ImageIcon },
                        };

                        return (
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                                    <Layers className="h-3 w-3" /> {isRtl ? 'كابشن لكل منصة' : 'Platform Specific Captions'}
                                </Label>
                                <div className="grid gap-3">
                                    {entries.map(([plat, caption]) => {
                                        const theme = PLATFORM_THEMES[plat] || { bg: 'bg-primary/5', text: 'text-primary', border: 'border-primary/10', icon: ImageIcon };
                                        const Icon = theme.icon;
                                        return (
                                            <div key={plat} className={`p-4 rounded-2xl border ${theme.bg} ${theme.border} transition-all duration-300 hover:shadow-sm`}>
                                                <div className={`flex items-center gap-2 mb-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                                    <div className={`p-1.5 rounded-lg bg-white/50 border ${theme.border}`}>
                                                        <Icon className={`h-3 w-3 ${theme.text}`} />
                                                    </div>
                                                    <span className={`text-[11px] font-black uppercase tracking-wider ${theme.text}`}>{plat}</span>
                                                </div>
                                                <p className={`text-sm leading-relaxed ${isRtl ? 'text-right' : 'text-left'} whitespace-pre-wrap font-medium text-foreground/90`}>
                                                    {caption}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    } catch { return null; }
                })()}

                <div className="space-y-2 text-sm leading-relaxed">
                    {!item.platformCaptions && item.captionAr && (
                        <div className="p-3 bg-muted/30 rounded-xl border border-muted/40" dir="rtl">
                            <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">الكابشن (عربي)</p>
                            <p className="text-foreground/80 text-sm">{item.captionAr}</p>
                        </div>
                    )}
                    {!item.platformCaptions && item.captionEn && (
                        <div className="p-3 bg-muted/30 rounded-xl border border-muted/40">
                            <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">{isEmail ? (isRtl ? 'وصف الحملة' : 'Campaign Description') : (isRtl ? 'الكابشن بالإنجليزي' : 'Caption (English)')}</p>
                            <p className="text-foreground/80 text-sm">{item.captionEn}</p>
                        </div>
                    )}
                    {item.articleTitle && (
                        <div className="p-3 bg-teal-500/5 rounded-xl border border-teal-500/10">
                            <p className="text-[10px] font-black uppercase text-teal-600 mb-1">{isRtl ? 'عنوان المقال' : 'Article Title'}</p>
                            <p className="font-bold">{item.articleTitle}</p>
                            {item.articleContent && <p className="text-muted-foreground text-xs mt-1">{item.articleContent}</p>}
                        </div>
                    )}
                    {item.pollQuestion && (
                        <div className="p-4 bg-orange-500/5 rounded-xl border border-orange-500/10 space-y-2">
                            <p className="text-[10px] font-black uppercase text-orange-600 mb-2">{isRtl ? 'سؤال التصويت' : 'Poll Question'}</p>
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
                    {isEmail && item.emailBody && (
                        <div className="p-3 bg-rose-500/5 rounded-xl border border-rose-500/10">
                            <p className="text-[10px] font-black uppercase text-rose-600 mb-1">{isRtl ? 'محتوى البريد' : 'Email Body'}</p>
                            <p className="text-foreground/80 text-sm whitespace-pre-wrap">{item.emailBody}</p>
                        </div>
                    )}
                    {isEmail && item.emailDesign && (
                        <a href={item.emailDesign} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 p-3 bg-muted/20 rounded-xl border border-muted/30 hover:border-rose-500/30 transition-colors group/link">
                            <ExternalLink className="h-4 w-4 text-rose-500 shrink-0" />
                            <span className="text-sm font-bold text-rose-500 truncate">{isRtl ? 'عرض التصميم الأساسي' : 'View Base Design / Template'}</span>
                        </a>
                    )}
                </div>

                {!isModerator && (
                    <div className="pt-2 border-t border-white/5 mt-auto">
                        <ClientApprovalActions item={item} />
                    </div>
                )}
            </div>
        </div>
    );
}

function CalendarView({ items, onImageClick, isRtl, isModerator }: { items: any[], onImageClick: (url: string) => void, isRtl: boolean, isModerator?: boolean }) {
    // Default to the first scheduled item's month, or current month if none
    const initialDate = (() => {
        const firstScheduled = items.find(i => i.scheduledDate);
        if (firstScheduled) return new Date(firstScheduled.scheduledDate);
        return new Date();
    })();

    const [currentDate, setCurrentDate] = useState(initialDate);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

    const getItemsForDate = (day: number) => {
        return items.filter(item => {
            if (!item.scheduledDate) return false;
            const d = new Date(item.scheduledDate);
            return d.getFullYear() === currentDate.getFullYear() &&
                d.getMonth() === currentDate.getMonth() &&
                d.getDate() === day;
        });
    };

    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    const handlePrevMonth = () => {
        setCurrentDate(prev => {
            const d = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
            return d;
        });
    };

    const handleNextMonth = () => {
        setCurrentDate(prev => {
            const d = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
            return d;
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            <div className={`flex items-center justify-between p-6 bg-card/40 backdrop-blur-xl border border-white/10 rounded-3xl ${isRtl ? 'flex-row-reverse' : ''}`}>
                <h2 className="text-2xl font-black uppercase tracking-tighter premium-gradient-text">{monthName}</h2>
                <div className={`flex gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <Button variant="ghost" size="icon" className="rounded-xl" onClick={handlePrevMonth}>
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button variant="secondary" size="sm" className="rounded-xl font-black" onClick={() => setCurrentDate(new Date())}>
                        TODAY
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-xl" onClick={handleNextMonth}>
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-2 md:gap-4">
                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                    <div key={day} className="text-center p-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">
                        {day}
                    </div>
                ))}
                {blanks.map(i => <div key={`blank-${i}`} className="aspect-square" />)}
                {days.map(day => {
                    const dayItems = getItemsForDate(day);
                    const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

                    return (
                        <div
                            key={day}
                            onClick={() => {
                                if (dayItems.length > 0) {
                                    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                                    setSelectedDate(d.toISOString().split('T')[0]);
                                }
                            }}
                            className={`aspect-square relative p-2 md:p-3 rounded-2xl border transition-all duration-300 group overflow-hidden
                                ${dayItems.length > 0 ? 'bg-primary/5 border-primary/20 cursor-pointer hover:bg-primary/10 hover:border-primary/40' : 'bg-white/5 border-white/5 opacity-30'}
                                ${isToday ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
                            `}
                        >
                            <span className={`text-sm md:text-base font-black ${isToday ? 'text-primary' : 'text-muted-foreground/80'} group-hover:text-primary transition-colors flex items-center justify-between`}>
                                {day}
                                {dayItems.length > 0 && <span className="text-[9px] opacity-40">({dayItems.length})</span>}
                            </span>

                            {/* Improved Cell Previews */}
                            <div className="mt-1 space-y-1 hidden md:block">
                                {dayItems.slice(0, 2).map((item, i) => {
                                    const meta = TYPE_META_BI[item.type] || TYPE_META_BI.POST;
                                    const TypeIcon = meta.icon;
                                    const title = item.articleTitle || item.emailSubject || (isRtl ? item.captionAr : item.captionEn) || "...";
                                    return (
                                        <div key={i} className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-lg bg-white/5 border border-white/5 group-hover:border-primary/20 transition-all">
                                            <TypeIcon className={`h-2.5 w-2.5 shrink-0 ${meta.color}`} />
                                            <span className="text-[8px] font-bold text-muted-foreground truncate opacity-80 group-hover:opacity-100">
                                                {title.slice(0, 12)}...
                                            </span>
                                        </div>
                                    );
                                })}
                                {dayItems.length > 2 && (
                                    <div className="text-[8px] font-black text-primary/60 px-1.5">
                                        +{dayItems.length - 2} {isRtl ? 'أكثر' : 'more'}
                                    </div>
                                )}
                            </div>

                            {/* Mobile dots if items exist */}
                            {dayItems.length > 0 && (
                                <div className="absolute bottom-2 right-2 flex gap-1 md:hidden">
                                    {dayItems.slice(0, 3).map((item, i) => {
                                        const typeColor = TYPE_META_BI[item.type]?.color || 'text-primary';
                                        return <div key={i} className={`h-1.5 w-1.5 rounded-full bg-current ${typeColor}`} />;
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <AnimatePresence>
                {selectedDate && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                            onClick={() => setSelectedDate(null)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-2xl max-h-[80vh] bg-card border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className={`p-6 border-b border-white/5 flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <h3 className="text-xl font-black uppercase tracking-tighter premium-gradient-text">
                                    {selectedDate}
                                </h3>
                                <Button variant="ghost" size="icon" onClick={() => setSelectedDate(null)} className="rounded-full">
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                            <div className="p-6 overflow-y-auto space-y-4">
                                {items.filter(item => {
                                    if (!item.scheduledDate) return false;
                                    const d = new Date(item.scheduledDate);
                                    return d.toISOString().split('T')[0] === selectedDate;
                                }).map(item => (
                                    <div key={item.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/20 transition-all">
                                        <ContentCard item={item} isRtl={isRtl} onImageClick={onImageClick} isModerator={isModerator} />
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export function ClientActionPlanView({ plan, items, isModerator }: { plan: any; items: any[]; isModerator?: boolean }) {
    const { isRtl, t } = useLanguage();
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'GRID' | 'CALENDAR'>('GRID');
    const total = items.length;
    const approved = items.filter(i => i.status === "APPROVED").length;
    const pending = items.filter(i => i.status !== "APPROVED").length;

    const handleDownload = async (url: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `milaknight-${plan.month}-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            window.open(url, '_blank');
        }
    };

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

            {!isModerator && <PlanApprovalHeader planId={plan.id} status={plan.status} canApprove={true} />}

            {/* View Toggle */}
            <div className="flex justify-center md:justify-end">
                <div className="inline-flex p-1 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                    <Button
                        variant={viewMode === 'GRID' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('GRID')}
                        className={`rounded-xl font-black uppercase tracking-widest text-[10px] h-9 px-4 transition-all ${viewMode === 'GRID' ? 'shadow-lg shadow-primary/20' : ''}`}
                    >
                        <LayoutGrid className={`h-3.5 w-3.5 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                        {isRtl ? "عرض الشبكة" : "GRID VIEW"}
                    </Button>
                    <Button
                        variant={viewMode === 'CALENDAR' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('CALENDAR')}
                        className={`rounded-xl font-black uppercase tracking-widest text-[10px] h-9 px-4 transition-all ${viewMode === 'CALENDAR' ? 'shadow-lg shadow-primary/20' : ''}`}
                    >
                        <CalendarDays className={`h-3.5 w-3.5 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                        {isRtl ? "عرض التقويم" : "CALENDAR VIEW"}
                    </Button>
                </div>
            </div>

            {viewMode === 'GRID' ? (
                items.length > 0 ? (
                    <div className="space-y-12">
                        {SECTIONS.map(section => {
                            const sectionItems = items.filter(item => section.types.includes(item.type));
                            if (sectionItems.length === 0) return null;
                            const SectionIcon = section.icon;
                            return (
                                <div key={section.labelEn} className="space-y-5">
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
                                    <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                                        {sectionItems.map((item: any) => (
                                            <ContentCard key={item.id} item={item} isRtl={isRtl} onImageClick={setSelectedImage} isModerator={isModerator} />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="py-24 rounded-3xl border-2 border-dashed border-white/10 text-center">
                        <Layers className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                        <p className="text-muted-foreground font-semibold">{isRtl ? 'لا توجد عناصر للمراجعة بعد.' : 'No items available for review yet.'}</p>
                        <p className="text-sm text-muted-foreground opacity-60 mt-1">{isRtl ? 'سيقوم مدير حسابك بإضافة عناصر المحتوى قريباً.' : 'Your Account Manager will add content items soon.'}</p>
                    </div>
                )
            ) : (
                <CalendarView items={items} onImageClick={setSelectedImage} isRtl={isRtl} isModerator={isModerator} />
            )}

            {/* Image Lightbox */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-10"
                        onClick={() => setSelectedImage(null)}
                    >
                        <motion.button
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all z-[110]"
                            onClick={() => setSelectedImage(null)}
                        >
                            <X className="h-6 w-6" />
                        </motion.button>

                        <div className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center gap-6" onClick={e => e.stopPropagation()}>
                            <motion.img
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                src={selectedImage}
                                alt="Full size preview"
                                className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
                            />
                            <div className="flex gap-4">
                                <Button
                                    size="lg"
                                    className="rounded-full font-black uppercase tracking-widest px-8 h-12 shadow-xl shadow-primary/20"
                                    onClick={() => handleDownload(selectedImage)}
                                >
                                    <Download className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                                    {isRtl ? 'تحميل الصورة' : 'Download Image'}
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="lg"
                                    className="rounded-full font-black uppercase tracking-widest px-8 h-12 bg-white/10 hover:bg-white/20 text-white"
                                    onClick={() => window.open(selectedImage, '_blank')}
                                >
                                    <ExternalLink className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                                    {isRtl ? 'فتح الرابط الأصلي' : 'Open Original Link'}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

