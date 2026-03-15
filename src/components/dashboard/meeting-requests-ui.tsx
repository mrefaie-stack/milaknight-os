"use client";

import { useEffect, useState, useCallback } from "react";
import { signIn } from "next-auth/react";
import { useLanguage } from "@/contexts/language-context";
import { updateMeetingStatus, scheduleMeeting } from "@/app/actions/meeting";
import { createTeamMeeting } from "@/app/actions/team-meeting";
import { toast } from "sonner";
import {
    CalendarDays, Clock, CheckCircle2, XCircle, Users, MessageSquare,
    Search, Video, ExternalLink, RefreshCw, CalendarCheck, Plus,
    X, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { color: string; icon: any; labelAr: string; labelEn: string }> = {
    PENDING:   { color: "text-orange-500 bg-orange-500/10 border-orange-500/20",   icon: Clock,         labelAr: "قيد الانتظار", labelEn: "Pending" },
    SCHEDULED: { color: "text-blue-500 bg-blue-500/10 border-blue-500/20",         icon: CalendarCheck, labelAr: "مجدول",        labelEn: "Scheduled" },
    COMPLETED: { color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle2, labelAr: "مكتمل",        labelEn: "Completed" },
    CANCELLED: { color: "text-red-500 bg-red-500/10 border-red-500/20",            icon: XCircle,       labelAr: "ملغي",         labelEn: "Cancelled" },
};

const ROLE_LABELS: Record<string, string> = {
    ADMIN: "Admin", AM: "Account Manager", MARKETING_MANAGER: "Marketing Manager",
    MODERATOR: "Moderator", CONTENT_TEAM: "Content Team", CONTENT_LEADER: "Content Leader",
    ART_TEAM: "Art Team", ART_LEADER: "Art Leader", SEO_TEAM: "SEO Team",
    SEO_LEAD: "SEO Lead", HR_MANAGER: "HR Manager",
};

type CalendarEvent = {
    id: string; title: string; start: string; end: string;
    meetLink: string | null; attendees: string[];
};

type StaffUser = { id: string; firstName: string; lastName: string; email: string; role: string };

type TeamMeeting = {
    id: string; title: string; description?: string | null;
    scheduledAt: string; meetLink?: string | null;
    organizer: { id: string; firstName: string; lastName: string; role: string };
    attendees: { user: { id: string; firstName: string; lastName: string; role: string } }[];
};

function formatEventTime(start: string, end: string) {
    const s = new Date(start);
    const e = new Date(end);
    const now = new Date();
    const isToday = s.toDateString() === now.toDateString();
    const isTomorrow = new Date(now.getTime() + 86400000).toDateString() === s.toDateString();
    const dayLabel = isToday ? "Today" : isTomorrow ? "Tomorrow"
        : s.toLocaleDateString("en", { weekday: "long", month: "short", day: "numeric" });
    return `${dayLabel} · ${s.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – ${e.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function isNow(start: string, end: string) {
    const now = Date.now();
    return new Date(start).getTime() <= now && now <= new Date(end).getTime();
}

// ── Schedule Client Meeting Modal ──────────────────────────────────────────────
function ScheduleModal({ meetingId, onClose, onScheduled }: {
    meetingId: string; onClose: () => void;
    onScheduled: (id: string, scheduledAt: string, meetLink: string | null) => void;
}) {
    const [value, setValue] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const d = new Date();
        d.setHours(d.getHours() + 1, 0, 0, 0);
        setValue(d.toISOString().slice(0, 16));
    }, []);

    async function submit() {
        if (!value) return;
        setLoading(true);
        try {
            await scheduleMeeting(meetingId, new Date(value).toISOString());
            onScheduled(meetingId, value, null);
            toast.success("Meeting scheduled — Google Meet link created if you're connected to Google");
            onClose();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onClose}>
            <div className="w-full max-w-sm bg-card border border-white/10 rounded-3xl p-6 space-y-5 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div>
                    <h2 className="text-lg font-black">Schedule Meeting</h2>
                    <p className="text-xs text-muted-foreground mt-1">Set date & time — Google Meet link will be auto-generated</p>
                </div>
                <input
                    type="datetime-local"
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-sm font-medium focus:outline-none focus:border-primary/50"
                />
                <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button className="flex-1 rounded-xl font-black" onClick={submit} disabled={loading || !value}>
                        {loading ? "Scheduling..." : "Schedule"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ── Create Team Meeting Modal ──────────────────────────────────────────────────
function CreateTeamMeetingModal({ staffUsers, currentUserId, onClose, onCreated }: {
    staffUsers: StaffUser[]; currentUserId: string;
    onClose: () => void; onCreated: (meeting: TeamMeeting) => void;
}) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [scheduledAt, setScheduledAt] = useState(() => {
        const d = new Date();
        d.setHours(d.getHours() + 1, 0, 0, 0);
        return d.toISOString().slice(0, 16);
    });
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [showParticipants, setShowParticipants] = useState(true);

    const others = staffUsers.filter(u => u.id !== currentUserId);
    const filtered = others.filter(u => {
        const name = `${u.firstName} ${u.lastName}`.toLowerCase();
        return name.includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    });

    function toggleUser(id: string) {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }

    async function submit() {
        if (!title.trim() || selectedIds.size === 0) {
            toast.error("Add a title and at least one participant");
            return;
        }
        setLoading(true);
        try {
            const meeting = await createTeamMeeting({
                title: title.trim(),
                description: description.trim() || undefined,
                scheduledAt: new Date(scheduledAt).toISOString(),
                attendeeIds: Array.from(selectedIds),
            });
            toast.success("Meeting created! Notifications sent to participants.");
            onCreated(meeting as any);
            onClose();
        } catch (e: any) {
            toast.error(e.message || "Failed to create meeting");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onClose}>
            <div
                className="w-full max-w-lg bg-card border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 pb-4 border-b border-white/8 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-black">New Team Meeting</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Google Meet link auto-generated · Notifications sent to all participants
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 transition-colors">
                        <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                    {/* Title */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Meeting Title *</label>
                        <Input
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="e.g. Weekly Sync, Project Kickoff..."
                            className="rounded-xl bg-white/5 border-white/10 h-11"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Agenda, topics to discuss..."
                            rows={2}
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm resize-none focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground/40"
                        />
                    </div>

                    {/* Date & Time */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date & Time *</label>
                        <input
                            type="datetime-local"
                            value={scheduledAt}
                            onChange={e => setScheduledAt(e.target.value)}
                            className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-sm font-medium focus:outline-none focus:border-primary/50"
                        />
                    </div>

                    {/* Participants */}
                    <div className="space-y-2">
                        <button
                            className="flex items-center justify-between w-full"
                            onClick={() => setShowParticipants(p => !p)}
                        >
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground cursor-pointer">
                                Participants * {selectedIds.size > 0 && <span className="text-primary ml-1">({selectedIds.size} selected)</span>}
                            </label>
                            {showParticipants ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                        </button>

                        {showParticipants && (
                            <div className="space-y-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                                    <Input
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        placeholder="Search team members..."
                                        className="pl-9 rounded-xl bg-white/5 border-white/10 h-9 text-xs"
                                    />
                                </div>
                                <div className="max-h-44 overflow-y-auto space-y-1 rounded-xl border border-white/8 p-1">
                                    {filtered.length === 0 ? (
                                        <p className="text-xs text-muted-foreground text-center py-4">No team members found</p>
                                    ) : filtered.map(u => {
                                        const selected = selectedIds.has(u.id);
                                        return (
                                            <button
                                                key={u.id}
                                                onClick={() => toggleUser(u.id)}
                                                className={cn(
                                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                                                    selected ? "bg-primary/15 border border-primary/20" : "hover:bg-white/5"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors",
                                                    selected ? "bg-primary border-primary" : "border-white/20"
                                                )}>
                                                    {selected && <CheckCircle2 className="h-2.5 w-2.5 text-white fill-white" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-black truncate">{u.firstName} {u.lastName}</p>
                                                    <p className="text-[10px] text-muted-foreground">{ROLE_LABELS[u.role] || u.role}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 pt-4 border-t border-white/8 flex gap-3">
                    <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button
                        className="flex-1 rounded-xl font-black"
                        onClick={submit}
                        disabled={loading || !title.trim() || selectedIds.size === 0}
                    >
                        {loading ? "Creating..." : "Create Meeting"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function MeetingRequestsUI({
    requests: initialRequests,
    teamMeetings: initialTeamMeetings = [],
    staffUsers = [],
    userRole,
    currentUserId = "",
    hasGoogleToken,
}: {
    requests: any[];
    teamMeetings?: any[];
    staffUsers?: StaffUser[];
    userRole: string;
    currentUserId?: string;
    hasGoogleToken?: boolean;
}) {
    const { isRtl } = useLanguage();
    const [requests, setRequests] = useState(initialRequests);
    const [teamMeetings, setTeamMeetings] = useState(initialTeamMeetings);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("ALL");
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [scheduleId, setScheduleId] = useState<string | null>(null);
    const [showCreateMeeting, setShowCreateMeeting] = useState(false);

    const [calEvents, setCalEvents] = useState<CalendarEvent[]>([]);
    const [calConnected, setCalConnected] = useState(hasGoogleToken ?? false);
    const [calLoading, setCalLoading] = useState(hasGoogleToken ?? false);

    const isAdminOrAM = ["ADMIN", "AM", "MARKETING_MANAGER"].includes(userRole);
    const isStaff = userRole !== "CLIENT";

    const fetchCalendar = useCallback(async () => {
        try {
            const res = await fetch("/api/google/calendar");
            if (!res.ok) return;
            const data = await res.json();
            setCalConnected(data.connected);
            setCalEvents(data.events || []);
        } catch {} finally {
            setCalLoading(false);
        }
    }, []);

    useEffect(() => {
        if (hasGoogleToken) {
            fetchCalendar();
            const t = setInterval(fetchCalendar, 5 * 60 * 1000);
            return () => clearInterval(t);
        }
    }, [hasGoogleToken, fetchCalendar]);

    const filteredRequests = requests.filter(req => {
        const matchesSearch =
            (req.client?.name || "").toLowerCase().includes(search.toLowerCase()) ||
            (req.reason || "").toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === "ALL" || req.status === filter;
        return matchesSearch && matchesFilter;
    });

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        setIsLoading(id);
        try {
            await updateMeetingStatus(id, newStatus);
            setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
            toast.success(isRtl ? "تم تحديث الحالة" : "Status updated");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(null);
        }
    };

    const now = new Date();
    const upcomingTeamMeetings = teamMeetings.filter(m => new Date(m.scheduledAt) >= now)
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    const pastTeamMeetings = teamMeetings.filter(m => new Date(m.scheduledAt) < now)
        .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

    return (
        <div className="space-y-10">

            {/* ── Section: Team Meetings (all staff) ── */}
            {isStaff && (
                <section className="space-y-5">
                    <div className={cn("flex items-center justify-between", isRtl ? "flex-row-reverse" : "")}>
                        <div className={cn("flex items-center gap-2", isRtl ? "flex-row-reverse" : "")}>
                            <Users className="h-4 w-4 text-primary/60" />
                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/40">
                                {isRtl ? "اجتماعات الفريق" : "Team Meetings"}
                            </p>
                        </div>
                        <Button
                            size="sm"
                            className="rounded-xl font-black text-[11px] gap-1.5 h-9"
                            onClick={() => setShowCreateMeeting(true)}
                        >
                            <Plus className="h-3.5 w-3.5" />
                            {isRtl ? "اجتماع جديد" : "New Meeting"}
                        </Button>
                    </div>

                    {upcomingTeamMeetings.length === 0 && pastTeamMeetings.length === 0 ? (
                        <div className="py-14 rounded-3xl border-2 border-dashed border-white/10 text-center">
                            <CalendarDays className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-20" />
                            <p className="text-muted-foreground font-semibold text-sm mb-3">
                                {isRtl ? "لا توجد اجتماعات فريق بعد." : "No team meetings yet."}
                            </p>
                            <Button size="sm" className="rounded-xl font-black text-[11px] gap-1.5" onClick={() => setShowCreateMeeting(true)}>
                                <Plus className="h-3.5 w-3.5" />
                                {isRtl ? "أنشئ اجتماعاً" : "Create one"}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {upcomingTeamMeetings.length > 0 && (
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500/60">
                                        {isRtl ? "القادمة" : "Upcoming"}
                                    </p>
                                    {upcomingTeamMeetings.map(meeting => (
                                        <TeamMeetingCard key={meeting.id} meeting={meeting} currentUserId={currentUserId} isRtl={isRtl} />
                                    ))}
                                </div>
                            )}
                            {pastTeamMeetings.length > 0 && (
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">
                                        {isRtl ? "السابقة" : "Past"}
                                    </p>
                                    {pastTeamMeetings.slice(0, 5).map(meeting => (
                                        <TeamMeetingCard key={meeting.id} meeting={meeting} currentUserId={currentUserId} isRtl={isRtl} past />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </section>
            )}

            {/* ── Section: Client Meeting Requests (admin/AM only) ── */}
            {isAdminOrAM && (
                <section className="space-y-5">
                    <div className={cn("flex items-center gap-2", isRtl ? "flex-row-reverse" : "")}>
                        <MessageSquare className="h-4 w-4 text-primary/60" />
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/40">
                            {isRtl ? "طلبات اجتماعات العملاء" : "Client Meeting Requests"}
                        </p>
                    </div>

                    <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-4", isRtl ? "md:flex-row-reverse" : "")}>
                        <div className="relative flex-1 max-w-md">
                            <Search className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground", isRtl ? "right-3" : "left-3")} />
                            <Input
                                placeholder={isRtl ? "البحث..." : "Search requests..."}
                                className={cn("rounded-2xl border-white/10 bg-white/5", isRtl ? "pr-9" : "pl-9")}
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                            {["ALL", "PENDING", "SCHEDULED", "COMPLETED", "CANCELLED"].map(s => (
                                <Button
                                    key={s}
                                    variant={filter === s ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setFilter(s)}
                                    className="rounded-xl font-black uppercase tracking-widest text-[10px] h-9 shrink-0"
                                >
                                    {s === "ALL" ? (isRtl ? "الكل" : "ALL") : (isRtl ? STATUS_CONFIG[s]?.labelAr : STATUS_CONFIG[s]?.labelEn) || s}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {filteredRequests.length > 0 ? (
                        <div className="grid gap-4">
                            {filteredRequests.map(req => {
                                const status = STATUS_CONFIG[req.status] || STATUS_CONFIG.PENDING;
                                const StatusIcon = status.icon;
                                return (
                                    <Card key={req.id} className="overflow-hidden bg-card/40 backdrop-blur-xl border-white/10 hover:border-primary/20 transition-all rounded-3xl">
                                        <CardContent className="p-0">
                                            <div className={cn("flex flex-col md:flex-row md:items-center p-6 gap-6", isRtl ? "md:flex-row-reverse" : "")}>
                                                <div className={cn("flex items-center gap-3 min-w-[180px]", isRtl ? "flex-row-reverse text-right" : "")}>
                                                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                                                        {req.client?.logoUrl
                                                            ? <img src={req.client.logoUrl} alt="" className="h-8 w-8 object-contain" />
                                                            : <Users className="h-6 w-6 text-primary" />
                                                        }
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-sm uppercase tracking-tight">{req.client?.name}</p>
                                                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Client</p>
                                                    </div>
                                                </div>

                                                <div className={cn("flex-1 space-y-2", isRtl ? "text-right" : "text-left")}>
                                                    <div className={cn("flex items-center gap-2", isRtl ? "flex-row-reverse" : "")}>
                                                        <MessageSquare className="h-4 w-4 text-primary opacity-60" />
                                                        <h3 className="font-bold text-base leading-tight">{req.reason}</h3>
                                                    </div>
                                                    <div className={cn("flex flex-wrap items-center gap-3 text-xs text-muted-foreground", isRtl ? "flex-row-reverse" : "")}>
                                                        <span className={cn("flex items-center gap-1.5", isRtl ? "flex-row-reverse" : "")}>
                                                            <Users className="h-3.5 w-3.5" />
                                                            {req.teams}
                                                        </span>
                                                        <span className={cn("flex items-center gap-1.5", isRtl ? "flex-row-reverse" : "")}>
                                                            <CalendarDays className="h-3.5 w-3.5" />
                                                            {req.scheduledAt
                                                                ? new Date(req.scheduledAt).toLocaleString(isRtl ? "ar-EG" : "en-US", { dateStyle: "medium", timeStyle: "short" })
                                                                : new Date(req.createdAt).toLocaleDateString(isRtl ? "ar-EG" : "en-US", { day: "numeric", month: "short", year: "numeric" })
                                                            }
                                                        </span>
                                                    </div>
                                                    {req.meetLink && (
                                                        <a href={req.meetLink} target="_blank" rel="noopener noreferrer"
                                                            className={cn("inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors", isRtl ? "flex-row-reverse" : "")}>
                                                            <Video className="h-3.5 w-3.5" />
                                                            Google Meet
                                                            <ExternalLink className="h-3 w-3" />
                                                        </a>
                                                    )}
                                                </div>

                                                <div className={cn("flex flex-col md:items-end gap-3 min-w-[150px]", isRtl ? "md:items-start" : "")}>
                                                    <Badge className={cn("rounded-lg py-1 px-3 border font-black text-[10px] uppercase tracking-widest", status.color)}>
                                                        <StatusIcon className={cn("h-3 w-3", isRtl ? "ml-1.5" : "mr-1.5")} />
                                                        {isRtl ? status.labelAr : status.labelEn}
                                                    </Badge>

                                                    {req.status === "PENDING" && (
                                                        <div className="flex gap-2">
                                                            <Button size="sm" variant="ghost"
                                                                className="text-blue-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-xl text-[10px] font-black"
                                                                onClick={() => setScheduleId(req.id)} disabled={isLoading === req.id}>
                                                                {isRtl ? "جدولة" : "SCHEDULE"}
                                                            </Button>
                                                            <Button size="sm" variant="ghost"
                                                                className="text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-xl text-[10px] font-black"
                                                                onClick={() => handleStatusUpdate(req.id, "CANCELLED")} disabled={isLoading === req.id}>
                                                                {isRtl ? "إلغاء" : "CANCEL"}
                                                            </Button>
                                                        </div>
                                                    )}
                                                    {req.status === "SCHEDULED" && (
                                                        <div className="flex gap-2">
                                                            <Button size="sm" variant="ghost"
                                                                className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10 rounded-xl text-[10px] font-black"
                                                                onClick={() => handleStatusUpdate(req.id, "COMPLETED")} disabled={isLoading === req.id}>
                                                                {isRtl ? "إتمام" : "DONE"}
                                                            </Button>
                                                            <Button size="sm" variant="ghost"
                                                                className="text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-xl text-[10px] font-black"
                                                                onClick={() => handleStatusUpdate(req.id, "CANCELLED")} disabled={isLoading === req.id}>
                                                                {isRtl ? "إلغاء" : "CANCEL"}
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-20 rounded-3xl border-2 border-dashed border-white/10 text-center">
                            <CalendarDays className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-20" />
                            <p className="text-muted-foreground font-semibold text-sm">
                                {isRtl ? "لا توجد طلبات اجتماعات." : "No meeting requests found."}
                            </p>
                        </div>
                    )}
                </section>
            )}

            {/* Client view — their requests */}
            {userRole === "CLIENT" && (
                <section className="space-y-5">
                    <div className={cn("flex items-center gap-2", isRtl ? "flex-row-reverse" : "")}>
                        <MessageSquare className="h-4 w-4 text-primary/60" />
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/40">
                            {isRtl ? "طلبات الاجتماعات" : "My Meeting Requests"}
                        </p>
                    </div>
                    {filteredRequests.length > 0 ? (
                        <div className="grid gap-4">
                            {filteredRequests.map(req => {
                                const status = STATUS_CONFIG[req.status] || STATUS_CONFIG.PENDING;
                                const StatusIcon = status.icon;
                                return (
                                    <Card key={req.id} className="overflow-hidden bg-card/40 backdrop-blur-xl border-white/10 hover:border-primary/20 transition-all rounded-3xl">
                                        <CardContent className="p-6">
                                            <div className={cn("flex flex-col md:flex-row md:items-center gap-4", isRtl ? "md:flex-row-reverse" : "")}>
                                                <div className="flex-1 space-y-2">
                                                    <h3 className="font-bold text-base">{req.reason}</h3>
                                                    <p className="text-xs text-muted-foreground">{req.teams}</p>
                                                    {req.scheduledAt && (
                                                        <p className="text-xs text-blue-400 font-bold">
                                                            {new Date(req.scheduledAt).toLocaleString(isRtl ? "ar-EG" : "en-US", { dateStyle: "medium", timeStyle: "short" })}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className={cn("flex flex-col items-end gap-3", isRtl ? "items-start" : "")}>
                                                    <Badge className={cn("rounded-lg py-1 px-3 border font-black text-[10px] uppercase tracking-widest", status.color)}>
                                                        <StatusIcon className={cn("h-3 w-3", isRtl ? "ml-1.5" : "mr-1.5")} />
                                                        {isRtl ? status.labelAr : status.labelEn}
                                                    </Badge>
                                                    {req.status === "SCHEDULED" && req.meetLink && (
                                                        <a href={req.meetLink} target="_blank" rel="noopener noreferrer"
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 text-[11px] font-black transition-colors">
                                                            <Video className="h-3.5 w-3.5" />
                                                            Join Meet
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-20 rounded-3xl border-2 border-dashed border-white/10 text-center">
                            <CalendarDays className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-20" />
                            <p className="text-muted-foreground font-semibold text-sm">
                                {isRtl ? "لا توجد طلبات اجتماعات." : "No meeting requests yet."}
                            </p>
                        </div>
                    )}
                </section>
            )}

            {/* ── Section: Google Calendar ── */}
            {isStaff && (
                <section className="space-y-5">
                    <div className={cn("flex items-center justify-between", isRtl ? "flex-row-reverse" : "")}>
                        <div className={cn("flex items-center gap-2", isRtl ? "flex-row-reverse" : "")}>
                            <svg className="h-4 w-4" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/40">
                                {isRtl ? "جوجل كالندر — الأسبوع القادم" : "Google Calendar — Next 7 Days"}
                            </p>
                        </div>
                        {calConnected && (
                            <button onClick={fetchCalendar} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors" title="Refresh">
                                <RefreshCw className="h-3.5 w-3.5 text-muted-foreground/40" />
                            </button>
                        )}
                    </div>

                    {!calConnected ? (
                        <div className="rounded-2xl border border-white/8 bg-white/3 p-8 flex flex-col items-center gap-4 text-center">
                            <p className="text-sm font-black">{isRtl ? "ربط جوجل كالندر" : "Connect Google Calendar"}</p>
                            <p className="text-xs text-muted-foreground">{isRtl ? "سجّل دخول بجوجل لتشاهد الاجتماعات وتنشئ ميتينجز بـ Meet" : "Sign in with Google to see your calendar and auto-generate Meet links"}</p>
                            <button
                                onClick={() => signIn("google", { callbackUrl: window.location.href })}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black text-sm font-bold hover:bg-white/90 transition-colors"
                            >
                                <svg className="h-4 w-4" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                {isRtl ? "الدخول بجوجل" : "Sign in with Google"}
                            </button>
                        </div>
                    ) : calLoading ? (
                        <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-16 rounded-2xl bg-white/3 animate-pulse" />)}</div>
                    ) : calEvents.length === 0 ? (
                        <div className="rounded-2xl border border-white/8 bg-white/3 p-8 text-center">
                            <CalendarDays className="h-7 w-7 text-muted-foreground/20 mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground font-medium">
                                {isRtl ? "لا توجد أحداث في الأسبوع القادم" : "No events in the next 7 days"}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {calEvents.map(event => {
                                const live = isNow(event.start, event.end);
                                return (
                                    <div key={event.id} className={cn(
                                        "rounded-2xl border p-4 flex items-center gap-4 transition-all",
                                        isRtl ? "flex-row-reverse" : "",
                                        live ? "border-emerald-500/30 bg-emerald-500/5" : "border-white/8 bg-white/3 hover:bg-white/5"
                                    )}>
                                        <div className={cn("shrink-0 w-10 h-10 rounded-xl flex items-center justify-center", live ? "bg-emerald-500/20" : "bg-white/5")}>
                                            <Video className={cn("h-4 w-4", live ? "text-emerald-400" : "text-muted-foreground/40")} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className={cn("flex items-center gap-2", isRtl ? "flex-row-reverse" : "")}>
                                                {live && <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full">Live</span>}
                                                <p className="text-sm font-black truncate">{event.title}</p>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-0.5">{formatEventTime(event.start, event.end)}</p>
                                        </div>
                                        {event.meetLink && (
                                            <a href={event.meetLink} target="_blank" rel="noopener noreferrer"
                                                className={cn("shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all",
                                                    live ? "bg-emerald-500 text-white hover:bg-emerald-400" : "bg-white/8 hover:bg-white/15 border border-white/10")}>
                                                <ExternalLink className="h-3 w-3" />
                                                Join
                                            </a>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            )}

            {/* Modals */}
            {scheduleId && (
                <ScheduleModal
                    meetingId={scheduleId}
                    onClose={() => setScheduleId(null)}
                    onScheduled={(id, scheduledAt) => {
                        setRequests(prev => prev.map(r => r.id === id ? { ...r, status: "SCHEDULED", scheduledAt } : r));
                    }}
                />
            )}
            {showCreateMeeting && (
                <CreateTeamMeetingModal
                    staffUsers={staffUsers}
                    currentUserId={currentUserId}
                    onClose={() => setShowCreateMeeting(false)}
                    onCreated={(meeting) => setTeamMeetings(prev => [...prev, meeting])}
                />
            )}
        </div>
    );
}

// ── Team Meeting Card ──────────────────────────────────────────────────────────
function TeamMeetingCard({ meeting, currentUserId, isRtl, past }: {
    meeting: TeamMeeting; currentUserId: string; isRtl: boolean; past?: boolean;
}) {
    const date = new Date(meeting.scheduledAt);
    const isOrganizer = meeting.organizer.id === currentUserId;
    const allPeople = [meeting.organizer, ...meeting.attendees.map(a => a.user)];
    const displayPeople = allPeople.slice(0, 4);
    const extra = allPeople.length - 4;

    return (
        <div className={cn(
            "rounded-2xl border p-4 flex flex-col md:flex-row md:items-center gap-4 transition-all",
            isRtl ? "md:flex-row-reverse" : "",
            past ? "opacity-50 border-white/5 bg-white/2" : "border-white/10 bg-white/3 hover:bg-white/5 hover:border-primary/20"
        )}>
            {/* Date block */}
            <div className={cn("shrink-0 w-14 h-14 rounded-2xl flex flex-col items-center justify-center border",
                past ? "bg-white/3 border-white/8" : "bg-primary/10 border-primary/20")}>
                <span className="text-[10px] font-black uppercase text-muted-foreground">
                    {date.toLocaleDateString("en", { month: "short" })}
                </span>
                <span className={cn("text-xl font-black leading-none", past ? "" : "text-primary")}>
                    {date.getDate()}
                </span>
            </div>

            {/* Info */}
            <div className={cn("flex-1 min-w-0", isRtl ? "text-right" : "")}>
                <div className={cn("flex items-center gap-2 flex-wrap", isRtl ? "flex-row-reverse" : "")}>
                    <h3 className="text-sm font-black truncate">{meeting.title}</h3>
                    {isOrganizer && (
                        <span className="text-[9px] font-black uppercase tracking-widest bg-primary/15 text-primary px-2 py-0.5 rounded-full">
                            {isRtl ? "منظّم" : "Organizer"}
                        </span>
                    )}
                </div>
                {meeting.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{meeting.description}</p>
                )}
                <div className={cn("flex items-center gap-3 mt-1.5 flex-wrap", isRtl ? "flex-row-reverse" : "")}>
                    <span className="text-[11px] text-muted-foreground">
                        {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <div className={cn("flex items-center gap-1", isRtl ? "flex-row-reverse" : "")}>
                        {displayPeople.map((p, i) => (
                            <div key={p.id} title={`${p.firstName} ${p.lastName}`}
                                className="w-5 h-5 rounded-full bg-white/10 border border-background flex items-center justify-center text-[8px] font-black -ml-1 first:ml-0"
                                style={{ zIndex: 10 - i }}>
                                {p.firstName[0]}{p.lastName[0]}
                            </div>
                        ))}
                        {extra > 0 && (
                            <span className="text-[10px] text-muted-foreground ml-1">+{extra}</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Meet link */}
            {meeting.meetLink && (
                <a href={meeting.meetLink} target="_blank" rel="noopener noreferrer"
                    className={cn(
                        "shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all",
                        past ? "bg-white/5 border border-white/8 text-muted-foreground" : "bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 border border-blue-500/20"
                    )}>
                    <Video className="h-3.5 w-3.5" />
                    {isRtl ? "انضمام" : "Join"}
                </a>
            )}
        </div>
    );
}
