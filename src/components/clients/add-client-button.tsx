"use client";

import { useState } from "react";
import { createClient } from "@/app/actions/client";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/language-context";
import { translateText } from "@/app/actions/translate";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PLATFORMS = [
    "Facebook", "Instagram", "TikTok", "Snapchat", "LinkedIn", "Google Ads", "YouTube", "SEO", "Email Marketing"
];

const PACKAGES = ["BASIC", "PREMIUM", "ENTERPRISE", "CUSTOM"];

export function AddClientButton({ ams }: { ams: any[] }) {
    const { isRtl } = useLanguage();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
    const [translating, setTranslating] = useState<string | null>(null);

    const [briefAr, setBriefAr] = useState("");
    const [briefEn, setBriefEn] = useState("");
    const [delivAr, setDelivAr] = useState("");
    const [delivEn, setDelivEn] = useState("");

    async function handleAutoTranslate(source: string, targetType: 'brief' | 'deliv', targetLang: 'ar' | 'en') {
        if (!source.trim()) {
            toast.error(isRtl ? "يرجى إدخال نص أولاً" : "Please enter text first");
            return;
        }

        const id = `${targetType}-${targetLang}`;
        setTranslating(id);

        try {
            // Simplified logic: If AR to EN or EN to AR, we call translate action
            // In reality, this is where AI magic happens. 
            const result = await translateText(source, targetLang);

            if (targetType === 'brief') {
                if (targetLang === 'ar') setBriefAr(result);
                else setBriefEn(result);
            } else {
                if (targetLang === 'ar') setDelivAr(result);
                else setDelivEn(result);
            }

            toast.success(isRtl ? "تمت الترجمة بنجاح!" : "Translated successfully!");
        } catch (error) {
            toast.error(isRtl ? "فشلت الترجمة" : "Translation failed");
        } finally {
            setTranslating(null);
        }
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        formData.append("activeServices", selectedPlatforms.join(","));

        // Explicitly append state-managed fields to ensure they are sent
        formData.set("briefAr", briefAr);
        formData.set("briefEn", briefEn);
        formData.set("deliverablesAr", delivAr);
        formData.set("deliverablesEn", delivEn);

        try {
            await createClient(formData);
            toast.success(isRtl ? "تمت إضافة العميل بنجاح!" : "Client added successfully!");
            setOpen(false);
        } catch (error: any) {
            toast.error(isRtl ? (error.message || "فشل إضافة العميل") : (error.message || "Failed to add client"));
        } finally {
            setLoading(false);
        }
    }

    const togglePlatform = (id: string) => {
        setSelectedPlatforms(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="font-bold">
                    <Plus className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                    {isRtl ? "إضافة عميل جديد" : "Add New Client"}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" dir={isRtl ? "rtl" : "ltr"}>
                <form onSubmit={handleSubmit}>
                    <DialogHeader className={isRtl ? "text-right" : ""}>
                        <DialogTitle>{isRtl ? "إنشاء ملف عميل" : "Create Client Profile"}</DialogTitle>
                        <DialogDescription>
                            {isRtl
                                ? "أنشئ حساب عميل جديدًا، اختر الباقة، وعيّن مدير الحساب."
                                : "Set up a new client account, choose their package, and assign an AM."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">{isRtl ? "اسم الشركة / العميل" : "Business Name"}</Label>
                                <Input id="name" name="name" placeholder={isRtl ? "وكالة ميلانايت" : "MilaKnight Agency"} required className={isRtl ? "text-right" : ""} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="industry">{isRtl ? "المجال / الصناعة" : "Industry"}</Label>
                                <Input id="industry" name="industry" placeholder={isRtl ? "التجارة الإلكترونية" : "E-commerce"} className={isRtl ? "text-right" : ""} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">{isRtl ? "بريد تسجيل الدخول" : "Client Login Email"}</Label>
                                <Input id="email" name="email" type="email" placeholder="client@company.com" required className={isRtl ? "text-right" : ""} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">{isRtl ? "كلمة مرور الدخول" : "Login Password"}</Label>
                                <Input id="password" name="password" type="password" required className={isRtl ? "text-right" : ""} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="amId">{isRtl ? "تعيين مدير الحساب" : "Assign Account Manager"}</Label>
                                <Select name="amId">
                                    <SelectTrigger>
                                        <SelectValue placeholder={isRtl ? "اختر مدير حساب..." : "Select AM..."} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ams.map((am) => (
                                            <SelectItem key={am.id} value={am.id}>
                                                {am.firstName} {am.lastName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="package">{isRtl ? "باقة العميل" : "Client Package"}</Label>
                                <Select name="package" defaultValue="BASIC">
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PACKAGES.map((pkg) => (
                                            <SelectItem key={pkg} value={pkg}>{pkg}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                {isRtl ? "المنصات النشطة (تحدد هيكل التقرير)" : "Active Platforms (Determines Report Structure)"}
                            </Label>
                            <div className={`pt-1 grid grid-cols-2 gap-2 ${isRtl ? 'text-right' : ''}`}>
                                {PLATFORMS.map((platform) => (
                                    <div key={platform} className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                        <Checkbox
                                            id={platform}
                                            checked={selectedPlatforms.includes(platform)}
                                            onCheckedChange={() => togglePlatform(platform)}
                                        />
                                        <label htmlFor={platform} className="text-sm font-medium leading-none cursor-pointer">
                                            {platform}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Brief and Deliverables (Bilingual Tabs) */}
                        <div className="space-y-4 border-t pt-4">
                            <h4 className={`text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                {isRtl ? "موجز العميل والمخرجات" : "Client Brief & Deliverables"}
                            </h4>

                            <Tabs defaultValue="ar" className="w-full">
                                <TabsList className="grid w-full grid-cols-2 rounded-xl">
                                    <TabsTrigger value="ar" className="font-bold">العربية</TabsTrigger>
                                    <TabsTrigger value="en" className="font-bold">English</TabsTrigger>
                                </TabsList>

                                <TabsContent value="ar" className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <div className={`flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                                            <Label htmlFor="briefAr">{isRtl ? "موجز العميل" : "Client Brief (Arabic)"}</Label>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="text-[10px] h-6 px-2 gap-1"
                                                onClick={() => handleAutoTranslate(briefEn, 'brief', 'ar')}
                                                disabled={!!translating}
                                            >
                                                {translating === 'brief-ar' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                                                {isRtl ? "ترجمة من الإنجليزي" : "Translate from English"}
                                            </Button>
                                        </div>
                                        <Textarea
                                            id="briefAr"
                                            name="briefAr"
                                            value={briefAr}
                                            onChange={(e) => setBriefAr(e.target.value)}
                                            className="min-h-[100px] text-right"
                                            placeholder="اشرح أهداف العميل وهويته التجارية باللغة العربية..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className={`flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                                            <Label htmlFor="deliverablesAr">{isRtl ? "المخرجات الشهرية" : "Monthly Deliverables (Arabic)"}</Label>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="text-[10px] h-6 px-2 gap-1"
                                                onClick={() => handleAutoTranslate(delivEn, 'deliv', 'ar')}
                                                disabled={!!translating}
                                            >
                                                {translating === 'deliv-ar' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                                                {isRtl ? "ترجمة من الإنجليزي" : "Translate from English"}
                                            </Button>
                                        </div>
                                        <Textarea
                                            id="deliverablesAr"
                                            name="deliverablesAr"
                                            value={delivAr}
                                            onChange={(e) => setDelivAr(e.target.value)}
                                            className="min-h-[120px] text-right"
                                            placeholder="٣٠ منشور سوشيال ميديا\nسيو..."
                                        />
                                    </div>
                                </TabsContent>

                                <TabsContent value="en" className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="briefEn">Client Brief (English)</Label>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="text-[10px] h-6 px-2 gap-1"
                                                onClick={() => handleAutoTranslate(briefAr, 'brief', 'en')}
                                                disabled={!!translating}
                                            >
                                                {translating === 'brief-en' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                                                Translate from Arabic
                                            </Button>
                                        </div>
                                        <Textarea
                                            id="briefEn"
                                            name="briefEn"
                                            value={briefEn}
                                            onChange={(e) => setBriefEn(e.target.value)}
                                            className="min-h-[100px]"
                                            placeholder="Explain the client's goals and brand identity in English..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="deliverablesEn">Monthly Deliverables (English)</Label>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="text-[10px] h-6 px-2 gap-1"
                                                onClick={() => handleAutoTranslate(delivAr, 'deliv', 'en')}
                                                disabled={!!translating}
                                            >
                                                {translating === 'deliv-en' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                                                Translate from Arabic
                                            </Button>
                                        </div>
                                        <Textarea
                                            id="deliverablesEn"
                                            name="deliverablesEn"
                                            value={delivEn}
                                            onChange={(e) => setDelivEn(e.target.value)}
                                            className="min-h-[120px]"
                                            placeholder="30 Social Media Posts\nSEO..."
                                        />
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>

                        {/* Social Links */}
                        <div className="space-y-4 border-t pt-4">
                            <h4 className={`text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                {isRtl ? "روابط وسائل التواصل" : "Social Media Links"}
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { id: "website", label: isRtl ? "رابط الموقع" : "Website URL", ph: "https://..." },
                                    { id: "facebook", label: "Facebook URL", ph: "https://facebook.com/..." },
                                    { id: "instagram", label: "Instagram URL", ph: "https://instagram.com/..." },
                                    { id: "linkedin", label: "LinkedIn URL", ph: "https://linkedin.com/in/..." },
                                    { id: "tiktok", label: "TikTok URL", ph: "https://tiktok.com/@..." },
                                    { id: "twitter", label: "Twitter / X URL", ph: "https://x.com/..." },
                                    { id: "snapchat", label: "Snapchat URL", ph: "https://snapchat.com/add/..." },
                                    { id: "youtube", label: "YouTube URL", ph: "https://youtube.com/..." },
                                ].map(({ id, label, ph }) => (
                                    <div key={id} className="space-y-2">
                                        <Label htmlFor={id} className={isRtl ? "text-right block" : ""}>{label}</Label>
                                        <Input id={id} name={id} placeholder={ph} className={isRtl ? "text-right" : ""} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter className={isRtl ? "flex-row-reverse" : ""}>
                        <Button type="submit" disabled={loading} className="w-full font-bold">
                            {loading
                                ? <><Loader2 className={`h-4 w-4 animate-spin ${isRtl ? 'ml-2' : 'mr-2'}`} />{isRtl ? "جاري الإنشاء..." : "Initializing..."}</>
                                : (isRtl ? "تسجيل العميل وإنشاء الحساب" : "Register Client & Create Workspace")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
