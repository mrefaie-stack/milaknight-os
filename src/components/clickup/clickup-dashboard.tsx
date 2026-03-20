"use client";

import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/contexts/language-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Layers, ChevronRight, ChevronLeft, ChevronDown,
    AlertCircle, Clock, CheckCircle2, Circle, Loader2,
    ExternalLink, FolderOpen, ListTodo, Target, LogOut,
    RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
    getClickupSpaces,
    getClickupFolders,
    getClickupLists,
    getClickupFolderlessLists,
    getClickupTasks,
    getClickupGoals,
    disconnectClickup,
} from "@/app/actions/clickup";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterType = "all" | "overdue" | "in_progress";

interface Space { id: string; name: string; }
interface Folder { id: string; name: string; }
interface CUList { id: string; name: string; }
interface Task {
    id: string; name: string; url: string;
    status: { status: string; color: string; type: string };
    priority: { priority: string; color: string } | null;
    due_date: string | null;
    list: { id: string; name: string };
    space: { id: string };
}
interface Goal { id: string; name: string; percent_complete: number; due_date: string | null; }

// ─── Priority dot ─────────────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<string, string> = {
    urgent: "#f50000", high: "#ffcc00", normal: "#6bc7f6", low: "#d8d8d8",
};

function PriorityDot({ priority }: { priority: Task["priority"] }) {
    if (!priority) return <div className="w-2.5 h-2.5 rounded-full bg-muted/30" />;
    const color = PRIORITY_COLORS[priority.priority] || priority.color || "#d8d8d8";
    return <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} title={priority.priority} />;
}

function StatusBadge({ status }: { status: Task["status"] }) {
    const bg = status.color || "#4f46e5";
    return (
        <span
            className="inline-flex items-center px-2 py-0.5 rounded-full section-label text-white"
            style={{ backgroundColor: bg + "33", color: bg, border: `1px solid ${bg}55` }}
        >
            {status.status}
        </span>
    );
}

function formatDueDate(ts: string | null): string {
    if (!ts) return "";
    const d = new Date(Number(ts));
    const now = new Date();
    const isOverdue = d < now;
    const diff = Math.round((d.getTime() - now.getTime()) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    if (diff === -1) return "Yesterday";
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) + (isOverdue ? " ⚠" : "");
}

// ─── Space Tree ───────────────────────────────────────────────────────────────

function SpaceItem({
    space, selected, onSelectSpace, onSelectList, isRtl
}: {
    space: Space;
    selected: { spaceId?: string; listId?: string };
    onSelectSpace: (id: string) => void;
    onSelectList: (id: string, spaceId: string) => void;
    isRtl: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [folders, setFolders] = useState<(Folder & { lists?: CUList[] })[]>([]);
    const [flLists, setFlLists] = useState<CUList[]>([]);
    const [loading, setLoading] = useState(false);
    const [folderListsOpen, setFolderListsOpen] = useState<Record<string, boolean>>({});

    async function toggle() {
        if (!open && folders.length === 0) {
            setLoading(true);
            const [fols, fls] = await Promise.all([
                getClickupFolders(space.id),
                getClickupFolderlessLists(space.id),
            ]);
            // Load lists for each folder
            const foldersWithLists = await Promise.all(
                fols.map(async (f: Folder) => {
                    const lists = await getClickupLists(f.id);
                    return { ...f, lists };
                })
            );
            setFolders(foldersWithLists);
            setFlLists(fls);
            setLoading(false);
        }
        setOpen(!open);
    }

    const Chevron = isRtl ? ChevronLeft : ChevronRight;
    const isSpaceSelected = selected.spaceId === space.id && !selected.listId;

    return (
        <div>
            <button
                onClick={toggle}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${isSpaceSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted/30 text-foreground/70"}`}
            >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" /> : open ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <Chevron className="h-3.5 w-3.5 shrink-0" />}
                <FolderOpen className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate flex-1 text-left">{space.name}</span>
            </button>
            {/* All tasks in space */}
            {!isSpaceSelected && (
                <button
                    onClick={() => onSelectSpace(space.id)}
                    className="w-full flex items-center gap-2 px-3 py-1 rounded-xl text-xs text-muted-foreground hover:bg-muted/30 pl-9 mt-0.5"
                >
                    <ListTodo className="h-3 w-3 shrink-0" />
                    <span className="truncate">All tasks</span>
                </button>
            )}
            {open && (
                <div className="ml-4 mt-0.5 space-y-0.5 border-l border-border pl-2">
                    {/* Folderless lists */}
                    {flLists.map((list) => (
                        <button
                            key={list.id}
                            onClick={() => onSelectList(list.id, space.id)}
                            className={`w-full flex items-center gap-2 px-2 py-1 rounded-lg text-xs transition-all ${selected.listId === list.id ? "bg-primary/20 text-primary" : "hover:bg-muted/30 text-foreground/60"}`}
                        >
                            <ListTodo className="h-3 w-3 shrink-0" />
                            <span className="truncate">{list.name}</span>
                        </button>
                    ))}
                    {/* Folders */}
                    {folders.map((folder) => (
                        <div key={folder.id}>
                            <button
                                onClick={() => setFolderListsOpen(p => ({ ...p, [folder.id]: !p[folder.id] }))}
                                className="w-full flex items-center gap-2 px-2 py-1 rounded-lg text-xs hover:bg-muted/30 text-foreground/70"
                            >
                                {folderListsOpen[folder.id] ? <ChevronDown className="h-3 w-3 shrink-0" /> : <Chevron className="h-3 w-3 shrink-0" />}
                                <span className="truncate font-bold">{folder.name}</span>
                            </button>
                            {folderListsOpen[folder.id] && (
                                <div className="ml-3 space-y-0.5 border-l border-border pl-2">
                                    {(folder.lists || []).map((list) => (
                                        <button
                                            key={list.id}
                                            onClick={() => onSelectList(list.id, space.id)}
                                            className={`w-full flex items-center gap-2 px-2 py-1 rounded-lg text-xs transition-all ${selected.listId === list.id ? "bg-primary/20 text-primary" : "hover:bg-muted/30 text-foreground/60"}`}
                                        >
                                            <ListTodo className="h-3 w-3 shrink-0" />
                                            <span className="truncate">{list.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export function ClickupDashboard({ clickupUser, team }: { clickupUser: any; team: any }) {
    const { isRtl } = useLanguage();
    const router = useRouter();

    const [spaces, setSpaces] = useState<Space[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [goalsLoading, setGoalsLoading] = useState(false);
    const [filter, setFilter] = useState<FilterType>("all");
    const [selectedSpaceId, setSelectedSpaceId] = useState<string | undefined>();
    const [selectedListId, setSelectedListId] = useState<string | undefined>();
    const [page, setPage] = useState(0);
    const [lastPage, setLastPage] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [disconnecting, setDisconnecting] = useState(false);

    const fetchTasks = useCallback(async (p: number, spaceId?: string, listId?: string, f?: FilterType) => {
        setLoading(true);
        try {
            const result = await getClickupTasks({ spaceId, listId, page: p, filter: f || "all" });
            if (p === 0) {
                setTasks(result.tasks);
            } else {
                setTasks(prev => [...prev, ...result.tasks]);
            }
            setLastPage(result.last_page);
        } catch {
            toast.error("Failed to load tasks");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Load spaces
        getClickupSpaces().then(setSpaces);
        // Load initial tasks
        fetchTasks(0);
    }, [fetchTasks]);

    function handleSpaceSelect(spaceId: string) {
        setSelectedSpaceId(spaceId);
        setSelectedListId(undefined);
        setPage(0);
        fetchTasks(0, spaceId, undefined, filter);
    }

    function handleListSelect(listId: string, spaceId: string) {
        setSelectedSpaceId(spaceId);
        setSelectedListId(listId);
        setPage(0);
        fetchTasks(0, undefined, listId, filter);
    }

    function handleClearFilter() {
        setSelectedSpaceId(undefined);
        setSelectedListId(undefined);
        setPage(0);
        fetchTasks(0, undefined, undefined, filter);
    }

    function handleFilterChange(f: FilterType) {
        setFilter(f);
        setPage(0);
        fetchTasks(0, selectedSpaceId, selectedListId, f);
    }

    function handleLoadMore() {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchTasks(nextPage, selectedSpaceId, selectedListId, filter);
    }

    async function handleGoalsTab() {
        if (goals.length === 0) {
            setGoalsLoading(true);
            const g = await getClickupGoals();
            setGoals(g);
            setGoalsLoading(false);
        }
    }

    async function handleDisconnect() {
        setDisconnecting(true);
        try {
            await disconnectClickup();
            toast.success(isRtl ? "تم فصل الحساب" : "ClickUp disconnected");
            router.refresh();
        } catch {
            toast.error("Failed to disconnect");
            setDisconnecting(false);
        }
    }

    return (
        <div className="flex gap-0 h-full min-h-[70vh]" dir={isRtl ? "rtl" : "ltr"}>
            {/* ─── Left Space Tree ─────────────────────────────────────── */}
            <div className={`transition-all duration-300 ${sidebarOpen ? "w-64" : "w-0 overflow-hidden"} shrink-0`}>
                <div className="w-64 h-full bg-card/30 border-r border-border flex flex-col p-3 gap-2">
                    {/* User info */}
                    <div className="flex items-center gap-2 px-2 py-2 mb-1">
                        {clickupUser?.profilePicture ? (
                            <img src={clickupUser.profilePicture} alt="" className="w-7 h-7 rounded-full" />
                        ) : (
                            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                                {clickupUser?.username?.[0]?.toUpperCase() || "U"}
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate">{clickupUser?.username}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{team?.name}</p>
                        </div>
                    </div>

                    <div className="section-label text-primary/40 px-2 mb-1">
                        SPACES
                    </div>

                    {/* All tasks button */}
                    <button
                        onClick={handleClearFilter}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${!selectedSpaceId ? "bg-primary text-primary-foreground" : "hover:bg-muted/30 text-foreground/70"}`}
                    >
                        <ListTodo className="h-3.5 w-3.5 shrink-0" />
                        {isRtl ? "كل المهام" : "All Tasks"}
                    </button>

                    {/* Space list */}
                    <div className="flex-1 overflow-y-auto space-y-0.5 custom-scrollbar">
                        {spaces.map((space) => (
                            <SpaceItem
                                key={space.id}
                                space={space}
                                selected={{ spaceId: selectedSpaceId, listId: selectedListId }}
                                onSelectSpace={handleSpaceSelect}
                                onSelectList={handleListSelect}
                                isRtl={isRtl}
                            />
                        ))}
                    </div>

                    {/* Disconnect */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDisconnect}
                        disabled={disconnecting}
                        className="text-xs text-muted-foreground hover:text-destructive gap-2 w-full justify-start"
                    >
                        {disconnecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
                        {isRtl ? "فصل الحساب" : "Disconnect ClickUp"}
                    </Button>
                </div>
            </div>

            {/* ─── Main Content ─────────────────────────────────────────── */}
            <div className="flex-1 min-w-0 flex flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSidebarOpen(p => !p)}
                            className="p-2"
                        >
                            <Layers className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">ClickUp</h1>
                            <p className="text-xs text-muted-foreground">
                                {selectedListId ? "List view" : selectedSpaceId ? "Space view" : isRtl ? "كل مهامك" : "All your tasks"}
                            </p>
                        </div>
                    </div>
                    {/* Filter chips */}
                    <div className="flex items-center gap-2">
                        {(["all", "overdue", "in_progress"] as FilterType[]).map(f => (
                            <Button
                                key={f}
                                size="sm"
                                variant={filter === f ? "default" : "outline"}
                                onClick={() => handleFilterChange(f)}
                                className={`text-xs font-bold border-border ${filter === f ? "" : "text-muted-foreground"}`}
                            >
                                {f === "all" ? (isRtl ? "الكل" : "All") : f === "overdue" ? (isRtl ? "متأخرة" : "Overdue") : (isRtl ? "جارية" : "In Progress")}
                            </Button>
                        ))}
                        <Button variant="ghost" size="sm" onClick={() => fetchTasks(0, selectedSpaceId, selectedListId, filter)} className="p-2">
                            <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="tasks" onValueChange={(v) => v === "goals" && handleGoalsTab()}>
                    <TabsList className="bg-muted/30 border border-border">
                        <TabsTrigger value="tasks" className="font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <ListTodo className="h-3.5 w-3.5 mr-1.5" />
                            {isRtl ? "مهامي" : "My Tasks"}
                        </TabsTrigger>
                        <TabsTrigger value="goals" className="font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <Target className="h-3.5 w-3.5 mr-1.5" />
                            {isRtl ? "الأهداف" : "Goals"}
                        </TabsTrigger>
                    </TabsList>

                    {/* ─── Tasks Tab ─── */}
                    <TabsContent value="tasks" className="mt-4 space-y-2">
                        {loading && page === 0 ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : tasks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                                <CheckCircle2 className="h-16 w-16 opacity-10" />
                                <div>
                                    <p className="font-semibold text-lg">{isRtl ? "لا توجد مهام" : "No Tasks Found"}</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {isRtl ? "كل حاجة خلصت أو مفيش مهام في الفلتر دا" : "All clear or no tasks match this filter."}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {tasks.map((task) => {
                                    const dueStr = formatDueDate(task.due_date);
                                    const isOverdue = task.due_date && new Date(Number(task.due_date)) < new Date();
                                    return (
                                        <Card
                                            key={task.id}
                                            onClick={() => window.open(task.url, "_blank")}
                                            className="bg-card/40 border-border hover:border-primary/30 hover:bg-card/60 transition-all cursor-pointer group"
                                        >
                                            <CardContent className="p-4">
                                                <div className={`flex items-center gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
                                                    <PriorityDot priority={task.priority} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-sm truncate group-hover:text-primary transition-colors">
                                                            {task.name}
                                                        </p>
                                                        <div className={`flex items-center gap-2 mt-1 flex-wrap ${isRtl ? "flex-row-reverse" : ""}`}>
                                                            <StatusBadge status={task.status} />
                                                            <span className="text-[10px] text-muted-foreground">
                                                                {task.list?.name}
                                                            </span>
                                                            {dueStr && (
                                                                <span className={`text-[10px] font-bold ${isOverdue ? "text-red-400" : "text-muted-foreground"}`}>
                                                                    {isOverdue ? "⚠ " : ""}{dueStr}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}

                                {/* Load more */}
                                {!lastPage && (
                                    <div className="flex justify-center pt-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleLoadMore}
                                            disabled={loading}
                                            className="border-border text-xs font-bold"
                                        >
                                            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : null}
                                            {isRtl ? "تحميل المزيد" : "Load More"}
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </TabsContent>

                    {/* ─── Goals Tab ─── */}
                    <TabsContent value="goals" className="mt-4 space-y-3">
                        {goalsLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : goals.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                                <Target className="h-16 w-16 opacity-10" />
                                <div>
                                    <p className="font-semibold text-lg">{isRtl ? "لا توجد أهداف" : "No Goals Found"}</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {isRtl ? "أضف أهدافك من ClickUp" : "Create goals in ClickUp to see them here."}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            goals.map((goal: any) => (
                                <Card
                                    key={goal.id}
                                    onClick={() => window.open(`https://app.clickup.com/${team?.id}/goals/${goal.id}`, "_blank")}
                                    className="bg-card/40 border-border hover:border-primary/30 hover:bg-card/60 transition-all cursor-pointer group"
                                >
                                    <CardContent className="p-4 space-y-3">
                                        <div className={`flex items-start justify-between ${isRtl ? "flex-row-reverse" : ""}`}>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm group-hover:text-primary transition-colors">{goal.name}</p>
                                                {goal.due_date && (
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        Due: {new Date(Number(goal.due_date)).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right shrink-0 ml-4">
                                                <span className="text-xl font-semibold text-primary">{Math.round(goal.percent_complete)}%</span>
                                            </div>
                                        </div>
                                        {/* Progress bar */}
                                        <div className="w-full bg-muted/30 rounded-full h-1.5">
                                            <div
                                                className="h-1.5 rounded-full bg-primary transition-all"
                                                style={{ width: `${Math.round(goal.percent_complete)}%` }}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
