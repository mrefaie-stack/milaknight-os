"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ContentItemEditor } from "./content-editor";
import { updateContentItem } from "@/app/actions/content-item";
import { deleteContentItem, resolveActionPlanItem } from "@/app/actions/action-plan";
import { Image as ImageIcon, Video, AlignLeft, HelpCircle, Edit3, Trash2, CheckCircle2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/language-context";

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
        }
    };

    async function handleSave(data: any) {
        try {
            await updateContentItem(editingItem.id, data);
            toast.success("Content updated successfully!");
            setEditingItem(null);
        } catch (error: any) {
            toast.error(error.message || "Failed to update content");
        }
    }

    async function handleDelete(itemId: string) {
        if (!confirm(t("dashboard.delete_confirm"))) return;

        setIsDeleting(itemId);
        try {
            await deleteContentItem(itemId, planId);
            toast.success("Item deleted");
        } catch (error: any) {
            toast.error(error.message || "Failed to delete item");
        } finally {
            setIsDeleting(null);
        }
    }

    return (
        <div className="grid gap-4" dir={isRtl ? "rtl" : "ltr"}>
            {items.map((item) => (
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
                                    {item.captionAr || item.captionEn || item.articleTitle || item.pollQuestion || t("dashboard.no_content")}
                                </div>
                                {item.imageUrl && (
                                    <div className="mt-3 rounded-lg overflow-hidden border border-primary/10 max-w-[200px] shadow-sm">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={item.imageUrl} alt="Post visual" className="w-full h-auto object-cover max-h-48 hover:scale-105 transition-transform duration-500" />
                                    </div>
                                )}
                                {item.videoUrl && (
                                    <div className="mt-3 rounded-lg overflow-hidden border border-primary/10 max-w-[250px] shadow-sm bg-black">
                                        <video src={item.videoUrl} controls className="w-full h-auto max-h-48 object-contain" />
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
                                Account Manager Notes
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
