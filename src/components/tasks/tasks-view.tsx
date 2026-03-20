"use client";

import { useLanguage } from "@/contexts/language-context";
import { TaskList } from "@/components/tasks/task-list";
import { AddTaskDialog } from "@/components/tasks/add-task-dialog";
import { ListTodo, CheckCircle2, Clock, AlertCircle, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";

export function TasksView({ tasks, clients, role }: { tasks: any[], clients: any[], role: string }) {
    const { isRtl } = useLanguage();

    const stats = {
        total: tasks.length,
        pending: tasks.filter(t => t.status === "PENDING").length,
        inProgress: tasks.filter(t => t.status === "IN_PROGRESS").length,
        needFix: tasks.filter(t => t.status === "NEED_FIX").length,
        completed: tasks.filter(t => t.status === "COMPLETED").length,
    };

    return (
        <div className="p-6 lg:p-10 space-y-10 max-w-7xl mx-auto" dir={isRtl ? "rtl" : "ltr"}>
            {/* Header */}
            <div className={`flex flex-col md:flex-row md:items-center justify-between gap-6 ${isRtl ? 'md:flex-row-reverse' : ''}`}>
                <div className={`space-y-2 ${isRtl ? 'text-right' : 'text-left'}`}>
                    <div className={`flex items-center gap-3 text-primary ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <ListTodo className="h-8 w-8" />
                        <h1 className="text-2xl font-bold tracking-tight">
                            {isRtl ? "المهام الداخلية" : "Internal Tasks"}
                        </h1>
                    </div>
                    <p className="text-muted-foreground font-bold">
                        {isRtl 
                            ? "إدارة المهام والطلبات بين فريق إدارة الحسابات وفريق التسويق." 
                            : "Manage tasks and requests between Account Management and Marketing team."}
                    </p>
                </div>
                
                {(role === "AM" || role === "ADMIN") && (
                    <AddTaskDialog clients={clients} />
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 bg-orange-500/5 border-orange-500/10 space-y-1">
                    <div className={`flex items-center gap-2 text-orange-500 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <Clock className="h-4 w-4" />
                        <span className="text-[10px] font-medium section-label">
                            {isRtl ? "قيد الانتظار" : "Pending"}
                        </span>
                    </div>
                    <div className={`text-2xl font-bold ${isRtl ? 'text-right' : ''}`}>{stats.pending}</div>
                </Card>

                <Card className="p-4 bg-blue-500/5 border-blue-500/10 space-y-1">
                    <div className={`flex items-center gap-2 text-blue-500 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <Activity className="h-4 w-4" />
                        <span className="text-[10px] font-medium section-label">
                            {isRtl ? "قيد التنفيذ" : "In Progress"}
                        </span>
                    </div>
                    <div className={`text-2xl font-bold ${isRtl ? 'text-right' : ''}`}>{stats.inProgress}</div>
                </Card>

                <Card className="p-4 bg-red-500/5 border-red-500/10 space-y-1">
                    <div className={`flex items-center gap-2 text-red-500 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-[10px] font-medium section-label">
                            {isRtl ? "تحتاج تعديل" : "Needs Fix"}
                        </span>
                    </div>
                    <div className={`text-2xl font-bold ${isRtl ? 'text-right' : ''}`}>{stats.needFix}</div>
                </Card>

                <Card className="p-4 bg-emerald-500/5 border-emerald-500/10 space-y-1">
                    <div className={`flex items-center gap-2 text-emerald-500 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-[10px] font-medium section-label">
                            {isRtl ? "مكتملة" : "Completed"}
                        </span>
                    </div>
                    <div className={`text-2xl font-bold ${isRtl ? 'text-right' : ''}`}>{stats.completed}</div>
                </Card>
            </div>

            {/* List */}
            <div className="space-y-6">
                <div className={`flex items-center gap-2 px-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <h2 className="text-sm font-medium section-label text-muted-foreground">
                        {isRtl ? "قائمة المهام" : "Tasks List"}
                    </h2>
                </div>
                <TaskList tasks={tasks} role={role} />
            </div>
        </div>
    );
}
