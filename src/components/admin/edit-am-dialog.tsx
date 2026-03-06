"use client";

import { useState } from "react";
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
import { toast } from "sonner";
import { Edit } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

export function EditTeamMemberDialog({ member }: { member: any }) {
    const { t, isRtl } = useLanguage();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        password: "",
    });

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        try {
            await updateUserCredentials(member.id, formData);
            toast.success(t("dashboard.update_success"));
            setOpen(false);
        } catch (error: any) {
            toast.error(error.message || "Failed to update team member");
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
            <DialogContent className="sm:max-w-[425px]" dir={isRtl ? "rtl" : "ltr"}>
                <form onSubmit={onSubmit}>
                    <DialogHeader>
                        <DialogTitle className={isRtl ? "text-right" : ""}>{t("dashboard.edit_user")}</DialogTitle>
                        <DialogDescription className={isRtl ? "text-right" : ""}>
                            {t("dashboard.strategic_summary")}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="firstName" className={isRtl ? "text-right" : ""}>{t("dashboard.first_name")}</Label>
                                <Input
                                    id="firstName"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    required
                                    className={isRtl ? "text-right" : ""}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="lastName" className={isRtl ? "text-right" : ""}>{t("dashboard.last_name")}</Label>
                                <Input
                                    id="lastName"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    required
                                    className={isRtl ? "text-right" : ""}
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email" className={isRtl ? "text-right" : ""}>{t("dashboard.email_address")}</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                className={isRtl ? "text-right" : ""}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password" className={isRtl ? "text-right" : ""}>{t("dashboard.new_password")}</Label>
                            <Input
                                id="password"
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder={t("dashboard.leave_blank")}
                                className={isRtl ? "text-right" : ""}
                            />
                        </div>
                    </div>
                    <DialogFooter className={isRtl ? "flex-row-reverse gap-2" : ""}>
                        <Button type="submit" disabled={loading} className="font-bold">
                            {loading ? t("dashboard.updating") : t("common.save")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
