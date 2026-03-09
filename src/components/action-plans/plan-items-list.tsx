"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ContentItemEditor } from "./content-editor";
import { updateContentItem } from "@/app/actions/content-item";
import { deleteContentItem, resolveActionPlanItem } from "@/app/actions/action-plan";
import { VideoPlayer } from "@/components/ui/video-player";
import {
    Image as ImageIcon,
    Video,
    AlignLeft,
    HelpCircle,
    Edit3,
    Trash2,
    CheckCircle2,
    MessageSquare,
    Mail,
    Linkedin,
    ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/language-context";

// Order: Social Posts → Videos/Reels → LinkedIn → Polls → Blogs/Articles → Email Marketing
const SECTIONS = [
    { types: ["POST"], labelKey: "POST", icon: ImageIcon, color: "text-blue-500", bg: "bg-blue-500/5", border: "border-blue-500/10" },
    { types: ["VIDEO"], labelKey: "VIDEO", icon: Video, color: "text-purple-500", bg: "bg-purple-500/5", border: "border-purple-500/10" },
    { types: ["LINKEDIN"], labelKey: "LINKEDIN", icon: Linkedin, color: "text-sky-500", bg: "bg-sky-500/5", border: "border-sky-500/10" },
    { types: ["POLL"], labelKey: "POLL", icon: HelpCircle, color: "text-orange-500", bg: "bg-orange-500/5", border: "border-orange-500/10" },
    { types: ["ARTICLE"], labelKey: "ARTICLE", icon: AlignLeft, color: "text-teal-500", bg: "bg-teal-500/5", border: "border-teal-500/10" },
    { types: ["EMAIL"], labelKey: "EMAIL", icon: Mail, color: "text-rose-500", bg: "bg-rose-500/5", border: "border-rose-500/10" },
    { types: ["AD"], labelKey: "AD", icon: HelpCircle, color: "text-red-500", bg: "bg-red-500/5", border: "border-red-500/10" },
];

export function PlanItemsList({ items, planId }: { items: any[], planId: string }) {
    const { t, isRtl } = useLanguage();
    const [editingItem, setEditingItem] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const getIcon = (type: string) => {
        switch (type) {
            case "POST": return <ImageIcon className="h-4 w-4" />;
            case "VIDEO": return <Video className="h-4 w-4" />;
            case "ARTICLE": return <AlignLeft className="h-4 w-4" />;
            case "POLL": return <HelpCircle className="h-4 w-4" />;
            case "LINKEDIN": return <Linkedin className="h-4 w-4" />;
            case "EMAIL": return <Mail className="h-4 w-4" />;
            default: return <HelpCircle className="h-4 w-4" />;
        }
    };

    async function handleSave(data: any) {
        try {
            await updateContentItem(editingItem.id, data);
            toast.success(isRtl ? "تم تحديث المحتوى بنجاح!" : "Content updated successfully!");
            setEditingItem(null);
        } catch (error: any) {
            toast.error(error.message || (isRtl ? "فشل تحديث المحتوى" : "Failed to update content"));
        }
    }

    async function handleDelete(itemId: string) {
        if (!confirm(t("dashboard.delete_confirm"))) return;

        setIsDeleting(itemId);
        try {
            await deleteContentItem(itemId, planId);
            toast.success(isRtl ? "تم حذف العنصر" : "Item deleted");
        } catch (error: any) {
            toast.error(error.message || (isRtl ? "فشل حذف العنصر" : "Failed to delete item"));
        } finally {
            setIsDeleting(null);
        }
    }

    return (
        <div className="space-y-12" dir={isRtl ? "rtl" : "ltr"}>
            {SECTIONS.map((section) => {
                const sectionItems = items.filter(item => section.types.includes(item.type));
                if (sectionItems.length === 0) return null;
                const SectionIcon = section.icon;

                return (
                    <div key={section.labelKey} className="space-y-4">
                        <div className={`flex items-center gap-3 p-3 rounded-xl border ${section.bg} ${section.border}`}>
                            <SectionIcon className={`h-5 w-5 ${section.color}`} />
                            <h2 className={`text-sm font-black uppercase tracking-widest ${section.color}`}>
                                {t(`dashboard.types.${section.labelKey}`)}
                                <span className="mx-2 text-muted-foreground opacity-30">/</span>
                                <span className="text-muted-foreground/60">{sectionItems.length}</span>
                            </h2>
                        </div>

                        <div className="grid gap-4">
                            {sectionItems.map((item) => (
                                <div key={item.id} className="p-4 border rounded-xl bg-card/50 backdrop-blur-sm shadow-sm flex flex-col gap-4 hover:bg-card transition-all duration-300 hover:shadow-md group border-primary/5 hover:border-primary/20">
                                    <div className={`flex flex-col md:flex-row gap-4 justify-between items-start md:items-center ${isRtl ? 'md:flex-row-reverse' : ''}`}>
                                        <div className={`flex items-center gap-4 flex-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                            <div className="p-3 bg-primary/5 rounded-xl text-primary hidden md:block group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                                {getIcon(item.type)}
                                            </div>
                                            <div className={`flex-1 min-w-0 ${isRtl ? 'text-right' : 'text-left'}`}>
                                                <div className={`flex items-center gap-2 mb-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                                    <Badge variant="outline" className="bg-background/50 text-[10px] font-black uppercase tracking-widest border-primary/10">{t(`dashboard.types.${item.type}`)}</Badge>
                                                    <Badge variant={item.status === 'DRAFT' ? 'secondary' : item.status === 'APPROVED' ? 'default' : 'destructive'} className="text-[10px] font-black uppercase shadow-sm">
                                                        {t(`common.status.${item.status}`)}
                                                    </Badge>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{item.platform}</span>
                                                    {item.clientComment && !item.feedbackResolved && (
                                                        <Badge variant="destructive" className="animate-pulse text-[10px] font-black uppercase">{t("dashboard.feedback_pending")}</Badge>
                                                    )}
                                                    {item.feedbackResolved && (
                                                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-black uppercase">{t("dashboard.resolved")}</Badge>
                                                    )}
                                                </div>
                                                <div className="text-sm font-medium text-foreground/80 whitespace-pre-wrap mt-2">
                                                    {item.type === 'EMAIL'
                                                        ? (item.emailSubject || item.emailBody || t("dashboard.no_content"))
                                                        : (item.platformCaptions
                                                            ? (Object.values(JSON.parse(item.platformCaptions)).filter(v => !!v).join('\n\n') || t("dashboard.no_content"))
                                                            : (item.captionAr || item.captionEn || item.articleTitle || item.pollQuestion || t("dashboard.no_content")))
                                                    }
                                                </div>
                                                {item.imageUrl && (
                                                    <div className="relative mt-3 rounded-lg overflow-hidden border border-primary/10 max-w-[300px] bg-black/40 group/img shadow-sm flex items-center justify-center min-h-[150px]">
                                                        {/* Blurred background */}
                                                        <img src={item.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover blur-lg opacity-30 scale-110" />
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img src={item.imageUrl} alt="Post visual" className="relative z-10 w-full h-auto object-contain max-h-64 hover:scale-105 transition-transform duration-500" />
                                                        <a
                                                            href={item.imageUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={`absolute bottom-2 ${isRtl ? 'left-2' : 'right-2'} p-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/20 text-white/80 hover:text-white hover:bg-black/80 transition-all opacity-0 group-hover/img:opacity-100 z-20 flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest`}
                                                        >
                                                            <ExternalLink className="h-2.5 w-2.5" />
                                                            {isRtl ? 'فتح' : 'Open'}
                                                        </a>
                                                    </div>
                                                )}
                                                {item.videoUrl && (
                                                    <div className="mt-3 max-w-sm">
                                                        <VideoPlayer url={item.videoUrl} isRtl={isRtl} />
                                                    </div>
                                                )}

                                                {/* Discussion Log (Consistency with Client View) */}
                                                {(item as any).comments && (item as any).comments.length > 0 && (
                                                    <div className="mt-6 pt-6 border-t border-primary/5 space-y-4">
                                                        <div className={`flex items-center gap-2 text-primary ${isRtl ? 'flex-row-reverse' : ''}`}>
                                                            <MessageSquare className="h-3.5 w-3.5" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest">{isRtl ? 'سجل النقاش' : 'Discussion Log'}</span>
                                                        </div>
                                                        <div className="space-y-3">
                                                            {(item as any).comments.map((c: any) => (
                                                                <div key={c.id} className={`flex flex-col gap-1 p-3 rounded-2xl border transition-all duration-300 ${c.user.role === 'CLIENT' ? 'bg-orange-50/50 border-orange-100/50' : 'bg-primary/5 border-primary/10'
                                                                    }`}>
                                                                    <div className={`flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                                                                        <span className="text-[10px] font-black text-foreground/70">{c.user.firstName} {c.user.lastName}</span>
                                                                        <span className="text-[9px] font-bold text-muted-foreground">
                                                                            {c.createdAt ? new Date(c.createdAt).toISOString().substring(0, 16).replace('T', ' ') : ""}
                                                                        </span>
                                                                    </div>
                                                                    <p className={`text-xs leading-relaxed ${isRtl ? 'text-right' : 'text-left'}`}>{c.text}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className={`flex gap-2 w-full md:w-auto mt-4 md:mt-0 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                            {item.clientComment && !item.feedbackResolved && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={async () => {
                                                        await resolveActionPlanItem(item.id, planId);
                                                        toast.success(t("dashboard.resolved"));
                                                    }}
                                                    className="font-bold border-emerald-500 text-emerald-600 hover:bg-emerald-50 shadow-sm"
                                                >
                                                    <CheckCircle2 className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} /> {t("dashboard.resolve")}
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="sm" onClick={() => setEditingItem(item)} className="font-bold hover:bg-primary/5">
                                                <Edit3 className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} /> {t("common.edit")}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(item.id)}
                                                disabled={isDeleting === item.id}
                                                className="font-bold text-destructive hover:bg-destructive/10"
                                            >
                                                <Trash2 className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                                                {isDeleting === item.id ? "..." : t("common.delete")}
                                            </Button>
                                        </div>
                                    </div>
                                    {item.amComment && (
                                        <div className={`p-4 rounded-xl text-sm border bg-primary/5 border-primary/20 text-foreground shadow-inner`}>
                                            <div className={`flex items-center gap-2 mb-1 font-black text-[10px] uppercase tracking-tighter text-primary ${isRtl ? 'flex-row-reverse text-right' : ''}`}>
                                                <MessageSquare className="h-3 w-3" />
                                                {isRtl ? 'ملاحظات مدير الحساب' : 'Account Manager Notes'}
                                            </div>
                                            <div className={isRtl ? 'text-right' : 'text-left'}>
                                                {item.amComment}
                                            </div>
                                        </div>
                                    )}
                                    {item.clientComment && (
                                        <div className={`p-4 rounded-xl text-sm border transition-all duration-300 ${item.feedbackResolved ? 'bg-muted/30 border-muted text-muted-foreground' : 'bg-orange-50 border-orange-100 text-orange-900 shadow-inner'}`}>
                                            <div className={`flex items-center gap-2 mb-1 font-black text-[10px] uppercase tracking-tighter ${isRtl ? 'flex-row-reverse text-right' : ''}`}>
                                                <MessageSquare className="h-3 w-3" />
                                                {t("dashboard.client_feedback")} {item.feedbackResolved && `(${t("dashboard.resolved")})`}
                                            </div>
                                            <div className={isRtl ? 'text-right' : 'text-left'}>
                                                {item.clientComment}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}

            <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border-none shadow-2xl bg-background/95 backdrop-blur-md">
                    <DialogHeader className={isRtl ? 'text-right' : 'text-left'}>
                        <DialogTitle className="text-2xl font-black">{t("common.edit")} {t(`dashboard.types.${editingItem?.type}`)} {editingItem?.platform}</DialogTitle>
                    </DialogHeader>
                    {editingItem && (
                        <ContentItemEditor
                            item={editingItem}
                            onSave={handleSave}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
