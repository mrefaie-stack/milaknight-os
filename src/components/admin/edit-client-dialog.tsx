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
import { Edit, UserCog } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

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
            toast.error(error.message || "Failed to update client");
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
                                            <SelectValue placeholder="Select AM" />
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
