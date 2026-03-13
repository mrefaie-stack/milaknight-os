"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { addContentItem } from "@/app/actions/action-plan";
import { toast } from "sonner";
import { Loader2, Plus, MessageSquare } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/language-context";

const PLATFORMS = [
    "Facebook", "Instagram", "TikTok", "Snapchat", "LinkedIn", "YouTube", "Twitter"
];

export function AddItemDialog({ planId }: { planId: string }) {
    const { isRtl } = useLanguage();
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [type, setType] = useState("POST");
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
    // Per-platform captions: { Facebook: "...", Instagram: "..." }
    const [platformCaptions, setPlatformCaptions] = useState<Record<string, string>>({});

    function togglePlatform(plat: string, checked: boolean) {
        setSelectedPlatforms(prev =>
            checked ? [...prev, plat] : prev.filter(p => p !== plat)
        );
        if (!checked) {
            setPlatformCaptions(prev => {
                const next = { ...prev };
                delete next[plat];
                return next;
            });
        }
    }

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (selectedPlatforms.length === 0 && type !== "EMAIL") {
            toast.error(isRtl ? "يرجى اختيار منصة واحدة على الأقل." : "Please select at least one target platform.");
            return;
        }

        setIsLoading(true);
        const formData = new FormData(event.currentTarget);
        const data = Object.fromEntries(formData.entries()) as Record<string, any>;
        data.type = type;
        data.platform = type === "EMAIL" ? "Email" : selectedPlatforms.join(', ');
        // Attach per-platform captions as JSON
        if (Object.keys(platformCaptions).length > 0) {
            data.platformCaptions = JSON.stringify(platformCaptions);
        }

        try {
            await addContentItem(planId, data);
            toast.success(isRtl ? "تمت إضافة العنصر بنجاح" : "Item added successfully");
            setOpen(false);
            event.currentTarget.reset();
            setSelectedPlatforms([]);
            setPlatformCaptions({});
        } catch (error: any) {
            toast.error(isRtl ? (error.message || "فشل إضافة العنصر") : (error.message || "Failed to add item"));
        } finally {
            setIsLoading(false);
        }
    }

    const showCaptions = (type === "POST" || type === "VIDEO" || type === "LINKEDIN") && selectedPlatforms.length > 0;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />{isRtl ? 'إضافة عنصر' : 'Add Item'}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[560px] max-h-[92vh] overflow-y-auto">
                <DialogHeader className={isRtl ? 'text-right' : ''}>
                    <DialogTitle>{isRtl ? 'إضافة عنصر محتوى' : 'Add Content Item'}</DialogTitle>
                    <DialogDescription>
                        {isRtl ? 'أضف منشوراً أو فيديو أو تصويتاً أو مقالاً أو بريداً إلى هذه الخطة.' : 'Add a new post, video, poll, article or email to this action plan.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>{isRtl ? 'نوع المحتوى' : 'Content Type'}</Label>
                        <Select value={type} onValueChange={setType} name="type">
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="POST">{isRtl ? 'منشور سوشيال ميديا' : 'Social Media Post'}</SelectItem>
                                <SelectItem value="VIDEO">{isRtl ? 'فيديو / ريلز' : 'Video / Reel'}</SelectItem>
                                <SelectItem value="LINKEDIN">{isRtl ? 'منشور لينكد إن' : 'LinkedIn Post'}</SelectItem>
                                <SelectItem value="POLL">{isRtl ? 'تصويت تفاعلي' : 'Interactive Poll'}</SelectItem>
                                <SelectItem value="ARTICLE">{isRtl ? 'مقال / بلوج' : 'Blog / SEO Article'}</SelectItem>
                                <SelectItem value="EMAIL">{isRtl ? 'حملة بريد إلكتروني' : 'Email Marketing'}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Platform selector — hidden for EMAIL type */}
                    {type !== "EMAIL" && (
                        <div className="grid gap-3">
                            <Label>{isRtl ? 'المنصات' : 'Platforms'}</Label>
                            <div className="flex flex-wrap gap-3">
                                {PLATFORMS.map((plat) => {
                                    const isChecked = selectedPlatforms.includes(plat);
                                    return (
                                        <div key={plat} className="flex items-center space-x-1.5 bg-background border px-2 py-1 rounded-md">
                                            <Checkbox
                                                id={`add-plat-${plat}`}
                                                checked={isChecked}
                                                onCheckedChange={(checked) => togglePlatform(plat, !!checked)}
                                            />
                                            <label htmlFor={`add-plat-${plat}`} className="text-xs font-semibold cursor-pointer">
                                                {plat}
                                            </label>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="scheduledDate">{isRtl ? 'تاريخ النشر (اختياري)' : 'Scheduled Date (Optional)'}</Label>
                        <Input id="scheduledDate" name="scheduledDate" type="date" />
                    </div>

                    {/* Dynamic Fields based on Type */}
                    {(type === "POST" || type === "VIDEO") && (
                        <div className="grid gap-2">
                            <Label>{type === "POST" ? (isRtl ? 'رابط الصورة' : 'Image URL') : (isRtl ? 'رابط الفيديو' : 'Video URL')}</Label>
                            <Input name={type === "POST" ? "imageUrl" : "videoUrl"} placeholder="https://..." />
                        </div>
                    )}

                    {/* Per-Platform Captions */}
                    {showCaptions && (
                        <div className="grid gap-3 p-4 rounded-2xl border border-primary/10 bg-primary/5">
                            <Label className="text-primary font-black text-xs uppercase tracking-wider">
                                {isRtl ? 'كابشن لكل منصة' : 'Caption per Platform'}
                            </Label>
                            {selectedPlatforms.map(plat => (
                                <div key={plat} className="grid gap-1">
                                    <Label className="text-xs font-bold text-muted-foreground">{plat}</Label>
                                    <Textarea
                                        className="h-16 text-sm"
                                        placeholder={isRtl ? `كابشن لـ ${plat}...` : `Caption for ${plat}...`}
                                        value={platformCaptions[plat] || ""}
                                        onChange={e => setPlatformCaptions(prev => ({ ...prev, [plat]: e.target.value }))}
                                    />
                                </div>
                            ))}
                            {/* Keep old fields as fallback general captions */}
                            <div className="grid gap-1 opacity-60">
                                <Label className="text-xs font-bold text-muted-foreground">{isRtl ? 'كابشن عام (عربي)' : 'General Caption (AR)'}</Label>
                                <Input name="captionAr" placeholder="النص باللغة العربية (اختياري)" />
                            </div>
                            <div className="grid gap-1 opacity-60">
                                <Label className="text-xs font-bold text-muted-foreground">{isRtl ? 'كابشن عام (إنجليزي)' : 'General Caption (EN)'}</Label>
                                <Input name="captionEn" placeholder={isRtl ? 'كابشن بالإنجليزي (اختياري)' : 'General English caption (optional)'} />
                            </div>
                        </div>
                    )}

                    {/* Non-post caption fields if no platform selected yet */}
                    {(type === "POST" || type === "VIDEO") && selectedPlatforms.length === 0 && (
                        <>
                            <div className="grid gap-2">
                                <Label>{isRtl ? 'الكابشن (عربي)' : 'Caption (Arabic)'}</Label>
                                <Input name="captionAr" placeholder="النص باللغة العربية" />
                            </div>
                            <div className="grid gap-2">
                                <Label>{isRtl ? 'الكابشن (إنجليزي)' : 'Caption (English)'}</Label>
                                <Input name="captionEn" placeholder={isRtl ? 'الكابشن بالإنجليزي' : 'Caption in English'} />
                            </div>
                        </>
                    )}

                    {type === "POLL" && (
                        <>
                            <div className="grid gap-2">
                                <Label>{isRtl ? 'سؤال التصويت' : 'Poll Question'}</Label>
                                <Input name="pollQuestion" placeholder={isRtl ? 'ما هو...؟' : "What's your favorite...?"} required />
                            </div>
                            <div className="grid gap-2">
                                <Label>{isRtl ? 'الخيار أ' : 'Option A'}</Label>
                                <Input name="pollOptionA" required />
                            </div>
                            <div className="grid gap-2">
                                <Label>{isRtl ? 'الخيار ب' : 'Option B'}</Label>
                                <Input name="pollOptionB" required />
                            </div>
                        </>
                    )}

                    {type === "ARTICLE" && (
                        <>
                            <div className="grid gap-2">
                                <Label>{isRtl ? 'عنوان المقال / البلوج' : 'Blog / Article Title'}</Label>
                                <Input name="articleTitle" placeholder={isRtl ? 'عنوان محسّن لمحركات البحث' : 'SEO optimized title'} required />
                            </div>
                            <div className="grid gap-2">
                                <Label>{isRtl ? 'محتوى المقال / رابطه' : 'Article Content / Link'}</Label>
                                <textarea name="articleContent" className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="Summary or Google Doc link..." required />
                            </div>
                        </>
                    )}

                    {type === "EMAIL" && (
                        <>
                            <div className="grid gap-2">
                                <Label>{isRtl ? 'موضوع البريد الإلكتروني' : 'Email Subject Line'}</Label>
                                <Input name="emailSubject" placeholder={isRtl ? 'مثال: عرض حصري لك 🎁' : 'e.g. Exclusive Offer Just for You 🎁'} required />
                            </div>
                            <div className="grid gap-2">
                                <Label>{isRtl ? 'وصف الحملة' : 'Email Description'}</Label>
                                <textarea name="captionEn" className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder={isRtl ? 'وصف مختصر لهدف الحملة...' : 'Brief description of the email campaign goal...'} />
                            </div>
                            <div className="grid gap-2">
                                <Label>{isRtl ? 'محتوى البريد الإلكتروني' : 'Email Body / Content'}</Label>
                                <textarea name="emailBody" className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder={isRtl ? 'المحتوى الرئيسي والرسائل والدعوة للعمل...' : 'Main email content, key messages, call-to-action...'} required />
                            </div>
                            <div className="grid gap-2">
                                <Label>{isRtl ? 'رابط التصميم الأساسي (اختياري)' : 'Base Design / Template URL (Optional)'}</Label>
                                <Input name="emailDesign" placeholder="https://... (Figma, design file, or reference URL)" />
                            </div>
                        </>
                    )}

                    {/* AM Comment section */}
                    <div className="grid gap-2 mt-2 border-t pt-4 border-border/40">
                        <Label className={`flex items-center gap-2 text-primary font-bold ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <MessageSquare className="h-4 w-4" />
                            {isRtl ? 'ملاحظات مدير الحساب (اختياري)' : 'Account Manager Notes (Optional)'}
                        </Label>
                        <Textarea
                            name="amComment"
                            className="h-20 bg-primary/5 border-primary/20 placeholder:text-primary/40 focus-visible:ring-primary/30"
                            placeholder={isRtl ? "أضف ملاحظاتك أو تعليماتك هنا... العميل يستطيع رؤية هذا." : "Add your comments or instructions here... The client can see this."}
                        />
                    </div>

                    {/* ClickUp Task Link (optional) */}
                    <div className="grid gap-2 border-t pt-4 border-border/40">
                        <Label className={`flex items-center gap-2 text-muted-foreground text-xs font-bold uppercase tracking-widest ${isRtl ? 'flex-row-reverse' : ''}`}>
                            {isRtl ? 'رابط مهمة ClickUp (اختياري)' : 'ClickUp Task URL (Optional)'}
                        </Label>
                        <Input
                            name="clickupTaskUrl"
                            placeholder="https://app.clickup.com/t/..."
                            className="text-sm"
                            dir="ltr"
                        />
                    </div>

                    <DialogFooter className="mt-4">
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className={`h-4 w-4 animate-spin ${isRtl ? 'ml-2' : 'mr-2'}`} />}
                            {isRtl ? 'حفظ العنصر' : 'Save Item'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
