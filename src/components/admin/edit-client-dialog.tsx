"use client";

import { useState } from "react";
import { updateClient } from "@/app/actions/client";
import { updateUserCredentials } from "@/app/actions/user";
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
import { toast } from "sonner";
import { Edit, UserCog, Globe } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { Textarea } from "@/components/ui/textarea";

export function EditClientDialog({ client, accountManagers }: { client: any, accountManagers: any[] }) {
    const { t, isRtl } = useLanguage();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: client.name,
        industry: client.industry || "",
        amId: client.amId || "none",
        package: client.package || "BASIC",
        activeServices: client.activeServices || "",
        email: client.user?.email || "",
        password: "",
        brief: client.brief || "",
        deliverables: client.deliverables || "",
        facebook: client.facebook || "",
        instagram: client.instagram || "",
        linkedin: client.linkedin || "",
        tiktok: client.tiktok || "",
        twitter: client.twitter || "",
        snapchat: client.snapchat || "",
        youtube: client.youtube || "",
        website: client.website || "",
    });

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        try {
            // Update Client Profile
            await updateClient(client.id, {
                name: formData.name,
                industry: formData.industry,
                amId: formData.amId,
                package: formData.package,
                activeServices: formData.activeServices,
                brief: formData.brief,
                deliverables: formData.deliverables,
                facebook: formData.facebook,
                instagram: formData.instagram,
                linkedin: formData.linkedin,
                tiktok: formData.tiktok,
                twitter: formData.twitter,
                snapchat: formData.snapchat,
                youtube: formData.youtube,
                website: formData.website,
            });

            // Update User Credentials if needed
            if (client.user?.id) {
                await updateUserCredentials(client.user.id, {
                    email: formData.email,
                    password: formData.password,
                    firstName: formData.name, // Keep sync for simplicity
                });
            }

            toast.success(t("dashboard.update_success"));
            setOpen(false);
        } catch (error: any) {
            toast.error(isRtl ? (error.message || 'فشل تحديث بيانات العميل') : (error.message || 'Failed to update client'));
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1 font-bold text-primary">
                    <Edit className="h-3 w-3" /> {t("common.edit")}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto" dir={isRtl ? "rtl" : "ltr"}>
                <form onSubmit={onSubmit}>
                    <DialogHeader>
                        <DialogTitle className={isRtl ? "text-right" : ""}>{t("dashboard.edit_user")}</DialogTitle>
                        <DialogDescription className={isRtl ? "text-right" : ""}>
                            {t("dashboard.strategic_summary")}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        {/* Profile Section */}
                        <div className="space-y-4">
                            <h4 className={`text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <Edit className="h-4 w-4" /> {t("dashboard.client_profile")}
                            </h4>
                            <div className="grid gap-4 pl-4 border-l-2 border-primary/10">
                                <div className="grid gap-2">
                                    <Label htmlFor="name" className={isRtl ? 'text-right' : ''}>{t("dashboard.client_name")}</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        className={isRtl ? 'text-right' : ''}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="industry" className={isRtl ? 'text-right' : ''}>{t("dashboard.industry")}</Label>
                                    <Input
                                        id="industry"
                                        value={formData.industry}
                                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                        className={isRtl ? 'text-right' : ''}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Assignment & Package Section */}
                        <div className="space-y-4">
                            <h4 className={`text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <UserCog className="h-4 w-4" /> {t("dashboard.management_services")}
                            </h4>
                            <div className="grid gap-4 pl-4 border-l-2 border-primary/10">
                                <div className="grid gap-2">
                                    <Label htmlFor="amId" className={isRtl ? 'text-right' : ''}>{t("dashboard.account_manager")}</Label>
                                    <Select
                                        value={formData.amId}
                                        onValueChange={(val) => setFormData({ ...formData, amId: val })}
                                    >
                                        <SelectTrigger dir={isRtl ? 'rtl' : 'ltr'}>
                                            <SelectValue placeholder={isRtl ? 'اختر مدير حساب' : 'Select AM'} />
                                        </SelectTrigger>
                                        <SelectContent dir={isRtl ? 'rtl' : 'ltr'}>
                                            <SelectItem value="none">{t("dashboard.none")}</SelectItem>
                                            {accountManagers.map((am) => (
                                                <SelectItem key={am.id} value={am.id}>
                                                    {am.firstName} {am.lastName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="package" className={isRtl ? 'text-right' : ''}>{t("dashboard.service_package")}</Label>
                                    <Select
                                        value={formData.package}
                                        onValueChange={(val) => setFormData({ ...formData, package: val })}
                                    >
                                        <SelectTrigger dir={isRtl ? 'rtl' : 'ltr'}>
                                            <SelectValue placeholder="Select Package" />
                                        </SelectTrigger>
                                        <SelectContent dir={isRtl ? 'rtl' : 'ltr'}>
                                            <SelectItem value="BASIC">Basic</SelectItem>
                                            <SelectItem value="PREMIUM">Premium</SelectItem>
                                            <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="activeServices" className={isRtl ? 'text-right' : ''}>{t("dashboard.active_platforms")}</Label>
                                    <Input
                                        id="activeServices"
                                        value={formData.activeServices}
                                        onChange={(e) => setFormData({ ...formData, activeServices: e.target.value })}
                                        placeholder="Facebook, Instagram, Google"
                                        className={isRtl ? 'text-right' : ''}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Brief and Deliverables */}
                        <div className="space-y-4">
                            <h4 className={`text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <Edit className="h-4 w-4" /> {isRtl ? 'موجز العميل والمخرجات' : 'Client Brief & Deliverables'}
                            </h4>
                            <div className="grid gap-4 pl-4 border-l-2 border-primary/10">
                                <div className="space-y-2">
                                    <Label htmlFor="brief" className={isRtl ? 'text-right block' : ''}>{isRtl ? 'موجز العميل' : 'Client Brief'}</Label>
                                    <Textarea
                                        id="brief"
                                        className={`min-h-[100px] ${isRtl ? 'text-right' : ''}`}
                                        value={formData.brief}
                                        onChange={(e) => setFormData({ ...formData, brief: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="deliverables" className={isRtl ? 'text-right block' : ''}>{isRtl ? 'المخرجات الشهرية' : 'Monthly Deliverables'}</Label>
                                    <Textarea
                                        id="deliverables"
                                        className={`min-h-[120px] ${isRtl ? 'text-right' : ''}`}
                                        value={formData.deliverables}
                                        onChange={(e) => setFormData({ ...formData, deliverables: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Social Links */}
                        <div className="space-y-4">
                            <h4 className={`text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <Globe className="h-4 w-4" /> {isRtl ? 'روابط وسائل التواصل' : 'Social Media Links'}
                            </h4>
                            <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-primary/10">
                                <div className="space-y-2">
                                    <Label htmlFor="website" className={isRtl ? 'text-right block' : ''}>Website</Label>
                                    <Input id="website" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} className={isRtl ? 'text-right' : ''} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="facebook" className={isRtl ? 'text-right block' : ''}>Facebook</Label>
                                    <Input id="facebook" value={formData.facebook} onChange={(e) => setFormData({ ...formData, facebook: e.target.value })} className={isRtl ? 'text-right' : ''} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="instagram" className={isRtl ? 'text-right block' : ''}>Instagram</Label>
                                    <Input id="instagram" value={formData.instagram} onChange={(e) => setFormData({ ...formData, instagram: e.target.value })} className={isRtl ? 'text-right' : ''} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="linkedin" className={isRtl ? 'text-right block' : ''}>LinkedIn</Label>
                                    <Input id="linkedin" value={formData.linkedin} onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })} className={isRtl ? 'text-right' : ''} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tiktok" className={isRtl ? 'text-right block' : ''}>TikTok</Label>
                                    <Input id="tiktok" value={formData.tiktok} onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })} className={isRtl ? 'text-right' : ''} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="twitter" className={isRtl ? 'text-right block' : ''}>Twitter</Label>
                                    <Input id="twitter" value={formData.twitter} onChange={(e) => setFormData({ ...formData, twitter: e.target.value })} className={isRtl ? 'text-right' : ''} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="snapchat" className={isRtl ? 'text-right block' : ''}>Snapchat</Label>
                                    <Input id="snapchat" value={formData.snapchat} onChange={(e) => setFormData({ ...formData, snapchat: e.target.value })} className={isRtl ? 'text-right' : ''} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="youtube" className={isRtl ? 'text-right block' : ''}>YouTube</Label>
                                    <Input id="youtube" value={formData.youtube} onChange={(e) => setFormData({ ...formData, youtube: e.target.value })} className={isRtl ? 'text-right' : ''} />
                                </div>
                            </div>
                        </div>

                        {/* Credentials Section */}
                        <div className="space-y-4">
                            <h4 className={`text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <UserCog className="h-4 w-4" /> {t("dashboard.access_credentials")}
                            </h4>
                            <div className="grid gap-4 pl-4 border-l-2 border-primary/10">
                                <div className="grid gap-2">
                                    <Label htmlFor="email" className={isRtl ? 'text-right' : ''}>{t("dashboard.email_address")}</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                        className={isRtl ? 'text-right' : ''}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="password" className={isRtl ? 'text-right' : ''}>{t("dashboard.new_password")}</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder={t("dashboard.leave_blank")}
                                        className={isRtl ? 'text-right' : ''}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className={isRtl ? 'flex-row-reverse gap-2' : ''}>
                        <Button type="submit" disabled={loading} className="font-bold">
                            {loading ? t("dashboard.updating") : t("common.save")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
