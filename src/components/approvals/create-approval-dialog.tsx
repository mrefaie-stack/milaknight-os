"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/language-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createApprovalRequest, getClientsForApproval } from "@/app/actions/approvals";
import { toast } from "sonner";
import { Link2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientOption {
    id: string;
    name: string;
    logoUrl: string | null;
    mmId: string | null;
}

export function CreateApprovalDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
    const { isRtl } = useLanguage();
    const router = useRouter();

    const [clients, setClients] = useState<ClientOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [clickupLink, setClickupLink] = useState("");
    const [clientId, setClientId] = useState("");

    // Load clients once on mount, not every time dialog opens
    useEffect(() => {
        getClientsForApproval().then(setClients);
    }, []);

    const selectedClient = clients.find((c) => c.id === clientId);
    const selectedClientHasNoMM = selectedClient && !selectedClient.mmId;
    const isValid = title.trim().length > 0 && clickupLink.trim().length > 0 && clientId.length > 0 && !selectedClientHasNoMM;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!isValid) return;
        setLoading(true);
        try {
            await createApprovalRequest({ title, description, clickupLink, clientId });
            toast.success(isRtl ? "تم إرسال الطلب ✅" : "Request submitted ✅");
            setTitle("");
            setDescription("");
            setClickupLink("");
            setClientId("");
            onClose();
            router.refresh();
        } catch {
            toast.error(isRtl ? "حدث خطأ، حاول مرة أخرى" : "Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="glass-card border border-white/10 rounded-3xl max-w-lg" dir={isRtl ? "rtl" : "ltr"}>
                <DialogHeader>
                    <DialogTitle className="text-xl font-black tracking-tight">
                        {isRtl ? "طلب موافقة جديد" : "New Approval Request"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 mt-2">
                    {/* Title */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                            {isRtl ? "العنوان *" : "Title *"}
                        </Label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={isRtl ? "عنوان الطلب" : "Request title"}
                            className="bg-white/5 border-white/10 rounded-xl"
                            required
                            dir={isRtl ? "rtl" : "ltr"}
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                            {isRtl ? "الوصف" : "Description"}
                        </Label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={isRtl ? "وصف تفصيلي (اختياري)" : "Detailed description (optional)"}
                            className="bg-white/5 border-white/10 rounded-xl resize-none h-24"
                            dir={isRtl ? "rtl" : "ltr"}
                        />
                    </div>

                    {/* Client */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                            {isRtl ? "العميل *" : "Client *"}
                        </Label>
                        <Select value={clientId} onValueChange={setClientId} required>
                            <SelectTrigger className={cn("bg-white/5 border-white/10 rounded-xl", selectedClientHasNoMM && "border-rose-500/40")}>
                                <SelectValue placeholder={isRtl ? "اختر العميل" : "Select client"} />
                            </SelectTrigger>
                            <SelectContent className="glass-card border border-white/10 rounded-2xl">
                                {clients.map((c) => (
                                    <SelectItem key={c.id} value={c.id} className="rounded-xl">
                                        <span>{c.name}</span>
                                        {!c.mmId && (
                                            <span className="ml-2 text-[9px] text-orange-400 font-black">NO MM</span>
                                        )}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {selectedClientHasNoMM && (
                            <p className={cn("text-[10px] text-rose-400 font-black flex items-center gap-1 mt-1", isRtl ? "flex-row-reverse" : "")}>
                                <AlertCircle className="h-3 w-3 shrink-0" />
                                {isRtl ? "هذا العميل ليس لديه مدير تسويق — لا يمكن إرسال الطلب" : "This client has no Marketing Manager assigned"}
                            </p>
                        )}
                    </div>

                    {/* ClickUp Link — required */}
                    <div className="space-y-1.5">
                        <Label className={cn("text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5", isRtl ? "flex-row-reverse" : "")}>
                            <Link2 className="h-3 w-3" />
                            {isRtl ? "رابط ClickUp Task *" : "ClickUp Task Link *"}
                        </Label>
                        <Input
                            value={clickupLink}
                            onChange={(e) => setClickupLink(e.target.value)}
                            placeholder="https://app.clickup.com/t/..."
                            className={cn(
                                "bg-white/5 border-white/10 rounded-xl font-mono text-sm",
                                !clickupLink && "border-orange-500/30"
                            )}
                            required
                            dir="ltr"
                        />
                        {!clickupLink && (
                            <p className={cn("text-[10px] text-orange-400 font-black flex items-center gap-1", isRtl ? "flex-row-reverse" : "")}>
                                <AlertCircle className="h-3 w-3 shrink-0" />
                                {isRtl ? "رابط ClickUp Task إلزامي" : "ClickUp Task link is required"}
                            </p>
                        )}
                    </div>

                    <div className={cn("flex gap-3 pt-2", isRtl ? "flex-row-reverse" : "")}>
                        <Button
                            type="submit"
                            disabled={loading || !isValid}
                            className="flex-1 h-11 bg-violet-600 hover:bg-violet-700 text-white font-black uppercase tracking-wider rounded-xl"
                        >
                            {loading
                                ? (isRtl ? "جاري الإرسال..." : "Sending...")
                                : (isRtl ? "إرسال الطلب" : "Submit Request")}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="h-11 rounded-xl font-black"
                        >
                            {isRtl ? "إلغاء" : "Cancel"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
