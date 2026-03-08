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
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/language-context";

const PLATFORMS = [
    "Facebook", "Instagram", "TikTok", "Snapchat", "LinkedIn", "Google Ads", "YouTube", "SEO", "Email Marketing"
];

const PACKAGES = ["BASIC", "PREMIUM", "ENTERPRISE", "CUSTOM"];

export function AddClientButton({ ams }: { ams: any[] }) {
    const { isRtl } = useLanguage();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        formData.append("activeServices", selectedPlatforms.join(","));

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

                        {/* Brief and Deliverables */}
                        <div className="space-y-4 border-t pt-4">
                            <h4 className={`text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                {isRtl ? "موجز العميل والمخرجات" : "Client Brief & Deliverables"}
                            </h4>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="brief" className={isRtl ? "text-right block" : ""}>
                                        {isRtl ? "موجز العميل (السياق، الأهداف، أسلوب الصوت)" : "Client Brief (General context, objectives, tone of voice)"}
                                    </Label>
                                    <Textarea id="brief" name="brief" className={`min-h-[100px] ${isRtl ? 'text-right' : ''}`}
                                        placeholder={isRtl ? "اشرح أهداف العميل وهويته التجارية..." : "Explain the client's goals and brand identity..."} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="deliverables" className={isRtl ? "text-right block" : ""}>
                                        {isRtl ? "المخرجات الشهرية" : "Monthly Deliverables"}
                                    </Label>
                                    <Textarea id="deliverables" name="deliverables" className={`min-h-[120px] ${isRtl ? 'text-right' : ''}`}
                                        placeholder={isRtl ? "٣٠ منشور سوشيال ميديا\n٨ مشاريع تحرير فيديو\nسيو\nتطوير موقع" : "30 Social Media Posts\n8 Video Editing Projects\nSEO\nWebsite Revamp"} />
                                </div>
                            </div>
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
