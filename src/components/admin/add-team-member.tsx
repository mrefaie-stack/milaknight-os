"use client";

import { useState } from "react";
import { createTeamMember } from "@/app/actions/user";
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
import { UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/language-context";

export function AddTeamMemberDialog() {
    const { isRtl } = useLanguage();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        try {
            await createTeamMember(formData);
            toast.success(isRtl ? "تمت إضافة عضو الفريق بنجاح!" : "Team member added successfully!");
            setOpen(false);
        } catch (error: any) {
            toast.error(isRtl ? (error.message || "فشل إضافة عضو الفريق") : (error.message || "Failed to add team member"));
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="font-bold">
                    <UserPlus className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                    {isRtl ? "إضافة مدير حساب" : "Add Team Member"}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]" dir={isRtl ? "rtl" : "ltr"}>
                <form onSubmit={handleSubmit}>
                    <DialogHeader className={isRtl ? "text-right" : ""}>
                        <DialogTitle>{isRtl ? "إضافة مدير حساب" : "Add Account Manager"}</DialogTitle>
                        <DialogDescription>
                            {isRtl
                                ? "أنشئ حسابًا جديدًا لمدير حساب. سيتمكن من إدارة عملائه الخاصين."
                                : "Create a new account for an AM. They'll be able to manage their own clients."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">{isRtl ? "الاسم الأول" : "First Name"}</Label>
                                <Input id="firstName" name="firstName" placeholder={isRtl ? "أحمد" : "John"} required className={isRtl ? "text-right" : ""} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">{isRtl ? "الاسم الأخير" : "Last Name"}</Label>
                                <Input id="lastName" name="lastName" placeholder={isRtl ? "محمد" : "Doe"} required className={isRtl ? "text-right" : ""} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">{isRtl ? "البريد الإلكتروني" : "Email address"}</Label>
                            <Input id="email" name="email" type="email" placeholder="am@milaknight.com" required className={isRtl ? "text-right" : ""} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role">{isRtl ? "الرتبة" : "Role"}</Label>
                            <select name="role" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                                <option value="AM">{isRtl ? "مدير حساب" : "Account Manager"}</option>
                                <option value="MARKETING_MANAGER">{isRtl ? "مدير تسويق" : "Marketing Manager"}</option>
                                <option value="HR_MANAGER">{isRtl ? "مدير الموارد البشرية" : "HR Manager"}</option>
                                <option value="MODERATOR">{isRtl ? "موديريتور (ناشر)" : "Moderator"}</option>
                                <optgroup label={isRtl ? "تيم الكونتنت" : "Content"}>
                                    <option value="CONTENT_LEADER">{isRtl ? "كونتنت ليدر" : "Content Leader"}</option>
                                    <option value="CONTENT_TEAM">{isRtl ? "كونتنت تيم" : "Content Team"}</option>
                                </optgroup>
                                <optgroup label={isRtl ? "تيم الآرت" : "Art"}>
                                    <option value="ART_LEADER">{isRtl ? "آرت ليدر" : "Art Leader"}</option>
                                    <option value="ART_TEAM">{isRtl ? "آرت تيم" : "Art Team"}</option>
                                </optgroup>
                                <optgroup label={isRtl ? "تيم السيو" : "SEO"}>
                                    <option value="SEO_LEAD">{isRtl ? "سيو ليد" : "SEO Lead"}</option>
                                    <option value="SEO_TEAM">{isRtl ? "سيو تيم" : "SEO Team"}</option>
                                </optgroup>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">{isRtl ? "كلمة المرور الأولية" : "Initial Password"}</Label>
                            <Input id="password" name="password" type="password" required className={isRtl ? "text-right" : ""} />
                        </div>
                    </div>
                    <DialogFooter className={isRtl ? "flex-row-reverse gap-2" : ""}>
                        <Button type="submit" disabled={loading} className="font-bold">
                            {loading
                                ? <><Loader2 className={`h-4 w-4 animate-spin ${isRtl ? 'ml-2' : 'mr-2'}`} />{isRtl ? "جاري الإنشاء..." : "Creating..."}</>
                                : (isRtl ? "إنشاء الحساب" : "Create Account")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
