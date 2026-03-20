"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Calendar, Users2, MessageSquare } from "lucide-react";
import { requestMeeting } from "@/app/actions/meeting";

const TEAMS = [
    { id: "CONTENT", labelAr: "فريق المحتوى", labelEn: "Content Team" },
    { id: "MEDIA_BUYERS", labelAr: "فريق الميديا باينج", labelEn: "Media Buyers" },
    { id: "DESIGNERS", labelAr: "المصممين", labelEn: "Designers" },
    { id: "OTHER", labelAr: "سبب آخر", labelEn: "Other Reason" },
];

export function MeetingRequestModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const { isRtl, t } = useLanguage();
    const [isLoading, setIsLoading] = useState(false);
    const [reason, setReason] = useState("");
    const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

    const toggleTeam = (teamId: string) => {
        setSelectedTeams(prev => prev.includes(teamId) ? prev.filter(id => id !== teamId) : [...prev, teamId]);
    };

    async function handleSubmit() {
        if (!reason.trim()) {
            toast.error(isRtl ? "يرجى كتابة سبب الاجتماع" : "Please enter meeting reason");
            return;
        }
        if (selectedTeams.length === 0) {
            toast.error(isRtl ? "يرجى اختيار فريق واحد على الأقل" : "Please select at least one team");
            return;
        }

        setIsLoading(true);
        try {
            await requestMeeting({ reason, teams: selectedTeams });
            toast.success(isRtl ? "تم إرسال طلب الاجتماع بنجاح" : "Meeting request sent successfully");
            onOpenChange(false);
            setReason("");
            setSelectedTeams([]);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`sm:max-w-md ${isRtl ? 'text-right' : 'text-left'}`}>
                <DialogHeader>
                    <div className={`flex items-center gap-2 mb-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <Calendar className="h-4 w-4" />
                        </div>
                        <DialogTitle className="text-[15px] font-semibold">
                            {isRtl ? "طلب اجتماع" : "Request Meeting"}
                        </DialogTitle>
                    </div>
                    <DialogDescription className="font-medium">
                        {isRtl
                            ? "أخبرنا بسبب الاجتماع والفرق التي تود تواجدها وسنقوم بالتنسيق معك."
                            : "Let us know why you want a meeting and which teams should attend."}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-3">
                        <Label className="section-label text-muted-foreground flex items-center gap-2">
                            <Users2 className="h-3 w-3" /> {isRtl ? 'الفرق المطلوبة' : 'Required Teams'}
                        </Label>
                        <div className="grid grid-cols-2 gap-3">
                            {TEAMS.map((team) => (
                                <div
                                    key={team.id}
                                    onClick={() => toggleTeam(team.id)}
                                    className={`flex items-center gap-2 p-3 rounded-md border transition-colors cursor-pointer ${selectedTeams.includes(team.id)
                                            ? 'bg-primary/10 border-primary'
                                            : 'border-border hover:border-primary/30 hover:bg-muted'
                                        } ${isRtl ? 'flex-row-reverse' : ''}`}
                                >
                                    <Checkbox
                                        id={team.id}
                                        checked={selectedTeams.includes(team.id)}
                                        onCheckedChange={() => toggleTeam(team.id)}
                                        className="rounded-full"
                                    />
                                    <span className="text-xs font-medium leading-none">{isRtl ? team.labelAr : team.labelEn}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label className="section-label text-muted-foreground flex items-center gap-2">
                            <MessageSquare className="h-3 w-3" /> {isRtl ? 'سبب الاجتماع / التفاصيل' : 'Reason / Details'}
                        </Label>
                        <Textarea
                            placeholder={isRtl ? "كيف يمكننا مساعدتك في هذا الاجتماع؟" : "How can we help you in this meeting?"}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        className="w-full gap-2"
                        onClick={handleSubmit}
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Calendar className="h-4 w-4 mr-2" />}
                        {isRtl ? "إرسال الطلب الآن" : "Send Request Now"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

