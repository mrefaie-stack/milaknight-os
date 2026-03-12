"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/language-context";
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
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2 } from "lucide-react";
import { createInternalTask } from "@/app/actions/task";
import { toast } from "sonner";

export function AddTaskDialog({ clients }: { clients: any[] }) {
    const { t, isRtl } = useLanguage();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        type: "NEW_TASK",
        clientId: "",
    });

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.clientId) {
            toast.error(isRtl ? "يرجى اختيار العميل" : "Please select a client");
            return;
        }

        setLoading(true);
        try {
            await createInternalTask(formData);
            toast.success(isRtl ? "تم إرسال المهمة بنجاح" : "Task sent successfully");
            setOpen(false);
            setFormData({ title: "", description: "", type: "NEW_TASK", clientId: "" });
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="font-black uppercase tracking-widest gap-2 rounded-2xl">
                    <Plus className="h-4 w-4" />
                    {isRtl ? "إضافة مهمة" : "Add Task"}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]" dir={isRtl ? "rtl" : "ltr"}>
                <form onSubmit={onSubmit}>
                    <DialogHeader>
                        <DialogTitle className={isRtl ? "text-right" : ""}>
                            {isRtl ? "إرسال مهمة جديدة للماركتينج مانجر" : "Send New Task to Marketing Manager"}
                        </DialogTitle>
                        <DialogDescription className={isRtl ? "text-right" : ""}>
                            {isRtl 
                                ? "اختر العميل ونوع المهمة، وسيتم إرسالها فوراً للمسؤول." 
                                : "Select client and task type. It will be sent to the assigned MM."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="client" className={isRtl ? "text-right" : ""}>{isRtl ? "العميل" : "Client"}</Label>
                            <Select 
                                value={formData.clientId} 
                                onValueChange={(val) => setFormData({ ...formData, clientId: val })}
                            >
                                <SelectTrigger className={isRtl ? "text-right" : ""}>
                                    <SelectValue placeholder={isRtl ? "اختر العميل" : "Select Client"} />
                                </SelectTrigger>
                                <SelectContent dir={isRtl ? "rtl" : "ltr"}>
                                    {clients.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="type" className={isRtl ? "text-right" : ""}>{isRtl ? "نوع المهمة" : "Task Type"}</Label>
                            <Select 
                                value={formData.type} 
                                onValueChange={(val) => setFormData({ ...formData, type: val })}
                            >
                                <SelectTrigger className={isRtl ? "text-right" : ""}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent dir={isRtl ? "rtl" : "ltr"}>
                                    <SelectItem value="NEW_TASK">{isRtl ? "تاسك جديدة" : "New Task"}</SelectItem>
                                    <SelectItem value="NEED_APPROVAL">{isRtl ? "طلب موافقة" : "Need Approval"}</SelectItem>
                                    <SelectItem value="ANNOUNCEMENT">{isRtl ? "خبر/تنبيه" : "Announcement"}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="title" className={isRtl ? "text-right" : ""}>{isRtl ? "عنوان المهمة" : "Task Title"}</Label>
                            <Input 
                                id="title" 
                                required 
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className={isRtl ? "text-right" : ""}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description" className={isRtl ? "text-right" : ""}>{isRtl ? "التفاصيل" : "Description"}</Label>
                            <Textarea 
                                id="description" 
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className={`min-h-[100px] ${isRtl ? "text-right" : ""}`}
                            />
                        </div>
                    </div>

                    <DialogFooter className={isRtl ? "flex-row-reverse gap-2" : ""}>
                        <Button type="submit" disabled={loading} className="font-black px-8">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (isRtl ? "إرسال" : "Send")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
