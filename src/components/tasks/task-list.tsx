"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
    Clock, CheckCircle2, AlertCircle, MessageSquare, 
    User, Building2, ChevronRight, MoreVertical 
} from "lucide-react";
import { updateTaskStatus, requestTaskFix } from "@/app/actions/task";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const STATUS_COLORS: Record<string, string> = {
    PENDING: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    IN_PROGRESS: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    COMPLETED: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    NEED_FIX: "bg-red-500/10 text-red-500 border-red-500/20",
};

const STATUS_LABELS: Record<string, { ar: string; en: string }> = {
    PENDING: { ar: "قيد الانتظار", en: "Pending" },
    IN_PROGRESS: { ar: "قيد التنفيذ", en: "In Progress" },
    COMPLETED: { ar: "مكتمل", en: "Completed" },
    NEED_FIX: { ar: "يحتاج تعديل", en: "Need Fix" },
};

const TYPE_LABELS: Record<string, { ar: string; en: string }> = {
    NEW_TASK: { ar: "تاسك جديدة", en: "New Task" },
    NEED_APPROVAL: { ar: "طلب موافقة", en: "Need Approval" },
    ANNOUNCEMENT: { ar: "خبر/تنبيه", en: "Announcement" },
};

export function TaskList({ tasks, role }: { tasks: any[], role: string }) {
    const { isRtl } = useLanguage();
    const [loading, setLoading] = useState<string | null>(null);
    const [fixDialogOpen, setFixDialogOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [fixComment, setFixComment] = useState("");

    const handleStatusUpdate = async (taskId: string, status: string) => {
        setLoading(taskId);
        try {
            await updateTaskStatus(taskId, status);
            toast.success(isRtl ? "تم تحديث الحالة" : "Status updated");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(null);
        }
    };

    const handleRequestFix = async () => {
        if (!fixComment.trim()) return;
        setLoading(selectedTask.id);
        try {
            await requestTaskFix(selectedTask.id, fixComment);
            toast.success(isRtl ? "تم إرسال طلب التعديل" : "Fix request sent");
            setFixDialogOpen(false);
            setFixComment("");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(null);
        }
    };

    if (tasks.length === 0) {
        return (
            <div className="text-center py-16 rounded-lg border border-dashed border-border">
                <p className="text-sm text-muted-foreground">
                    {isRtl ? "لا توجد مهام حالياً" : "No tasks found"}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {tasks.map((task) => (
                <Card key={task.id} className="p-4 hover:bg-muted/30 transition-colors group">
                    <div className={`flex flex-col md:flex-row gap-4 ${isRtl ? 'md:flex-row-reverse' : ''}`}>
                        {/* Status Icon */}
                        <div className="hidden md:flex flex-col items-center justify-center p-2.5 rounded-lg bg-muted shrink-0 h-fit">
                            {task.status === "COMPLETED" ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> :
                             task.status === "NEED_FIX" ? <AlertCircle className="h-5 w-5 text-destructive" /> :
                             <Clock className="h-5 w-5 text-orange-500" />}
                        </div>

                        <div className={`flex-1 space-y-2.5 ${isRtl ? 'text-right' : 'text-left'}`}>
                            {/* Header */}
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <div className={`flex items-center gap-2 flex-wrap ${isRtl ? 'flex-row-reverse' : ''}`}>
                                        <Badge className={`text-[10px] ${STATUS_COLORS[task.status]}`}>
                                            {isRtl ? STATUS_LABELS[task.status].ar : STATUS_LABELS[task.status].en}
                                        </Badge>
                                        <Badge variant="outline" className="text-[10px] opacity-60">
                                            {isRtl ? TYPE_LABELS[task.type].ar : TYPE_LABELS[task.type].en}
                                        </Badge>
                                    </div>
                                    <h3 className="text-sm font-semibold group-hover:text-primary transition-colors">
                                        {task.title}
                                    </h3>
                                </div>

                                {role === "MARKETING_MANAGER" && task.status !== "COMPLETED" && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align={isRtl ? "start" : "end"}>
                                            <DropdownMenuItem onClick={() => handleStatusUpdate(task.id, "IN_PROGRESS")}>
                                                {isRtl ? "بدء التنفيذ" : "Start Progress"}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleStatusUpdate(task.id, "COMPLETED")} className="text-emerald-500">
                                                {isRtl ? "تم الانتهاء" : "Mark Completed"}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => {
                                                setSelectedTask(task);
                                                setFixDialogOpen(true);
                                            }} className="text-red-500">
                                                {isRtl ? "يحتاج تعديل" : "Need Fix"}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>

                            {/* Description */}
                            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                                {task.description}
                            </p>

                            {/* Feedback if need fix */}
                            {task.status === "NEED_FIX" && task.feedback && (
                                <div className={`p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                    <MessageSquare className="h-4 w-4 shrink-0 mt-0.5" />
                                    <span>{task.feedback}</span>
                                </div>
                            )}

                            {/* Footer Info */}
                            <div className={`flex flex-wrap items-center gap-x-5 gap-y-1.5 pt-2 border-t border-border ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                    <Building2 className="h-3.5 w-3.5" />
                                    <span>{task.client.name}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                    <User className="h-3.5 w-3.5" />
                                    <span>{isRtl ? "من:" : "From:"} {task.sender.firstName}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground ml-auto">
                                    <span>{new Date(task.createdAt).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'short' })}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            ))}

            {/* Need Fix Dialog */}
            <Dialog open={fixDialogOpen} onOpenChange={setFixDialogOpen}>
                <DialogContent dir={isRtl ? "rtl" : "ltr"}>
                    <DialogHeader>
                        <DialogTitle className={isRtl ? "text-right" : ""}>
                            {isRtl ? "طلب تعديلات على المهمة" : "Request Task Edits"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea 
                            placeholder={isRtl ? "اكتب ملاحظات التعديل..." : "Write fix notes..."}
                            value={fixComment}
                            onChange={(e) => setFixComment(e.target.value)}
                            className={`min-h-[100px] ${isRtl ? 'text-right' : ''}`}
                        />
                    </div>
                    <DialogFooter className={isRtl ? "flex-row-reverse gap-2" : ""}>
                        <Button variant="ghost" onClick={() => setFixDialogOpen(false)}>{isRtl ? "إلغاء" : "Cancel"}</Button>
                        <Button variant="destructive" onClick={handleRequestFix} disabled={!fixComment.trim() || !!loading}>
                            {isRtl ? "إرسال الطلب" : "Send Request"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
