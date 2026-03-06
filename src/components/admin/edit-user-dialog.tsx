"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateUserCredentials } from "@/app/actions/user";
import { useLanguage } from "@/contexts/language-context";

interface EditUserDialogProps {
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
    } | null;
    isOpen: boolean;
    onClose: () => void;
}

export function EditUserDialog({ user, isOpen, onClose }: EditUserDialogProps) {
    const { t, isRtl } = useLanguage();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: user?.email || "",
        password: "",
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
    });

    // Reset form when user changes
    useState(() => {
        if (user) {
            setFormData({
                email: user.email,
                password: "",
                firstName: user.firstName,
                lastName: user.lastName,
            });
        }
    });

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!user) return;

        setIsLoading(true);
        try {
            await updateUserCredentials(user.id, formData);
            toast.success(t("dashboard.update_success"));
            onClose();
        } catch (error: any) {
            toast.error(error.message || "Failed to update user");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]" dir={isRtl ? "rtl" : "ltr"}>
                <DialogHeader>
                    <DialogTitle className={isRtl ? "text-right" : "text-left"}>
                        {t("dashboard.edit_user")}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="firstName" className={isRtl ? "text-right block" : ""}>
                            {t("dashboard.first_name")}
                        </Label>
                        <Input
                            id="firstName"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            required
                            className={isRtl ? "text-right" : ""}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lastName" className={isRtl ? "text-right block" : ""}>
                            {t("dashboard.last_name")}
                        </Label>
                        <Input
                            id="lastName"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            required
                            className={isRtl ? "text-right" : ""}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email" className={isRtl ? "text-right block" : ""}>
                            {t("dashboard.email_address")}
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            className={isRtl ? "text-right" : ""}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password" className={isRtl ? "text-right block" : ""}>
                            {t("dashboard.new_password")}
                        </Label>
                        <Input
                            id="password"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder={t("dashboard.leave_blank")}
                            className={isRtl ? "text-right" : ""}
                        />
                    </div>
                    <div className="pt-4 flex gap-2">
                        <Button
                            type="submit"
                            className="flex-1 bg-primary font-bold"
                            disabled={isLoading}
                        >
                            {isLoading ? t("dashboard.updating") : t("common.save")}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1"
                        >
                            {t("common.cancel")}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
