"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, Mic, MicOff, MessageSquare, UserPlus, Send, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { leaveRoom, inviteToRoom } from "@/app/actions/room";
import { VoiceCall } from "./voice-call";
import type { RoomMember } from "@/lib/rooms";
import type { RoomDef } from "@/lib/rooms";

type ChatMsg = {
    id: string;
    userId: string;
    userName: string;
    text: string;
    createdAt: string;
    isCurrentUser: boolean;
};

type TeamMember = { userId: string; name: string; role: string };

type Props = {
    room: RoomDef;
    currentUserId: string;
    initialMembers: RoomMember[];
    allTeamMembers: TeamMember[];
    isRtl: boolean;
    onLeave: () => void;
};

const CHAT_POLL_MS = 2000;
const MEMBERS_POLL_MS = 5000;

export function RoomSession({ room, currentUserId, initialMembers, allTeamMembers, isRtl, onLeave }: Props) {
    const [members, setMembers] = useState<RoomMember[]>(initialMembers);
    const [micOn, setMicOn] = useState(false);
    const [tab, setTab] = useState<"chat" | "invite">("chat");
    const [messages, setMessages] = useState<ChatMsg[]>([]);
    const [draft, setDraft] = useState("");
    const [sending, setSending] = useState(false);
    const [leaving, setLeaving] = useState(false);
    const chatBottomRef = useRef<HTMLDivElement>(null);
    const lastMsgRef = useRef<string | undefined>(undefined);
    const encRoom = encodeURIComponent(room.id);
    const Icon = room.icon;

    // ── Polls ──────────────────────────────────────────────────────────────────

    const fetchMembers = useCallback(async () => {
        try {
            const res = await fetch(`/api/rooms/${encRoom}/members`);
            if (res.ok) {
                const data = await res.json();
                setMembers(data);
            }
        } catch { /* ignore */ }
    }, [encRoom]);

    const fetchChat = useCallback(async () => {
        try {
            const url = lastMsgRef.current
                ? `/api/rooms/${encRoom}/chat?since=${encodeURIComponent(lastMsgRef.current)}`
                : `/api/rooms/${encRoom}/chat`;
            const res = await fetch(url);
            if (res.ok) {
                const data: ChatMsg[] = await res.json();
                if (data.length > 0) {
                    setMessages(prev => {
                        const newMsgs = data.filter(m => !prev.some(p => p.id === m.id));
                        if (newMsgs.length === 0) return prev;
                        lastMsgRef.current = newMsgs[newMsgs.length - 1].createdAt;
                        return [...prev, ...newMsgs];
                    });
                }
            }
        } catch { /* ignore */ }
    }, [encRoom]);

    useEffect(() => {
        fetchChat();
        const chatPoll = setInterval(fetchChat, CHAT_POLL_MS);
        const memberPoll = setInterval(fetchMembers, MEMBERS_POLL_MS);
        return () => {
            clearInterval(chatPoll);
            clearInterval(memberPoll);
        };
    }, [fetchChat, fetchMembers]);

    useEffect(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // ── Actions ────────────────────────────────────────────────────────────────

    const sendMessage = async () => {
        const text = draft.trim();
        if (!text || sending) return;
        setSending(true);
        setDraft("");
        try {
            const res = await fetch(`/api/rooms/${encRoom}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text }),
            });
            if (res.ok) {
                const msg: ChatMsg = await res.json();
                setMessages(prev => [...prev, msg]);
                lastMsgRef.current = msg.createdAt;
            }
        } catch { /* ignore */ } finally {
            setSending(false);
        }
    };

    const handleLeave = async () => {
        setLeaving(true);
        await leaveRoom();
        onLeave();
    };

    const handleInvite = async (userId: string) => {
        await inviteToRoom(userId, room.id);
    };

    const notInRoom = allTeamMembers.filter(m => !members.some(rm => rm.userId === m.userId));

    return (
        <div className={cn(
            "flex flex-col rounded-3xl border overflow-hidden",
            "bg-card/80 backdrop-blur-xl",
            room.activeBorder,
            `shadow-2xl ${room.glow}`
        )}>
            {/* Header */}
            <div className={cn("flex items-center gap-3 px-4 py-3 border-b border-white/8", room.bg)}>
                <div className={cn("flex items-center justify-center w-8 h-8 rounded-xl bg-white/8", room.color)}>
                    <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-black", room.color)}>
                        {isRtl ? room.nameAr : room.nameEn}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                        {members.length} {isRtl ? "شخص" : members.length === 1 ? "person" : "people"}
                    </p>
                </div>
                <button
                    onClick={handleLeave}
                    disabled={leaving}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-bold transition-colors"
                >
                    <LogOut className="h-3.5 w-3.5" />
                    {isRtl ? "خروج" : "Leave"}
                </button>
            </div>

            {/* Members strip */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 flex-wrap">
                {members.map(m => (
                    <div key={m.userId} className={cn(
                        "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold",
                        m.isCurrentUser ? "bg-primary/15 text-primary" : "bg-white/5 text-foreground/70"
                    )}>
                        <div className={cn(
                            "w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black",
                            m.isCurrentUser ? "bg-primary text-primary-foreground" : "bg-white/15"
                        )}>
                            {m.name.charAt(0)}
                        </div>
                        {m.name.split(" ")[0]}
                        {m.isCurrentUser && (
                            <span className="text-[9px] opacity-60">({isRtl ? "أنت" : "you"})</span>
                        )}
                    </div>
                ))}
            </div>

            {/* Voice controls */}
            <div className={cn("flex items-center gap-2 px-4 py-2.5 border-b border-white/5", room.bg, "bg-opacity-50")}>
                <button
                    onClick={() => setMicOn(v => !v)}
                    className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                        micOn
                            ? "bg-green-500/15 text-green-400 hover:bg-green-500/25 border border-green-500/30"
                            : "bg-white/5 text-muted-foreground hover:bg-white/10 border border-white/10"
                    )}
                >
                    {micOn ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
                    {micOn ? (isRtl ? "مفتوح" : "Live") : (isRtl ? "كتم" : "Muted")}
                </button>

                {micOn && (
                    <span className="flex gap-0.5 items-center">
                        {[...Array(4)].map((_, i) => (
                            <span
                                key={i}
                                className="w-0.5 rounded-full bg-green-400 animate-pulse"
                                style={{
                                    height: `${8 + (i % 3) * 4}px`,
                                    animationDelay: `${i * 0.15}s`,
                                }}
                            />
                        ))}
                    </span>
                )}

                <div className="ml-auto flex gap-1">
                    <button
                        onClick={() => setTab("chat")}
                        className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all",
                            tab === "chat" ? "bg-primary/15 text-primary border border-primary/30" : "bg-white/5 text-muted-foreground hover:bg-white/10"
                        )}
                    >
                        <MessageSquare className="h-3 w-3" />
                        {isRtl ? "الشات" : "Chat"}
                    </button>
                    <button
                        onClick={() => setTab("invite")}
                        className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all",
                            tab === "invite" ? "bg-primary/15 text-primary border border-primary/30" : "bg-white/5 text-muted-foreground hover:bg-white/10"
                        )}
                    >
                        <UserPlus className="h-3 w-3" />
                        {isRtl ? "دعوة" : "Invite"}
                    </button>
                </div>
            </div>

            {/* Chat tab */}
            {tab === "chat" && (
                <>
                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 min-h-[180px] max-h-[280px] custom-scrollbar">
                        {messages.length === 0 && (
                            <p className="text-center text-xs text-muted-foreground/40 mt-8">
                                {isRtl ? "لا رسائل بعد. ابدأ المحادثة!" : "No messages yet. Start the conversation!"}
                            </p>
                        )}
                        {messages.map(msg => (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex flex-col max-w-[80%]",
                                    msg.isCurrentUser ? "items-end ml-auto" : "items-start"
                                )}
                            >
                                {!msg.isCurrentUser && (
                                    <span className="text-[10px] text-muted-foreground font-bold mb-0.5 px-1">
                                        {msg.userName.split(" ")[0]}
                                    </span>
                                )}
                                <div className={cn(
                                    "px-3 py-2 rounded-2xl text-sm",
                                    msg.isCurrentUser
                                        ? "bg-primary text-primary-foreground rounded-br-sm"
                                        : "bg-white/8 text-foreground rounded-bl-sm"
                                )}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        <div ref={chatBottomRef} />
                    </div>

                    {/* Input */}
                    <div className="flex items-center gap-2 px-3 py-3 border-t border-white/5">
                        <input
                            value={draft}
                            onChange={e => setDraft(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                            placeholder={isRtl ? "اكتب رسالة..." : "Type a message..."}
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/40 placeholder:text-muted-foreground/40"
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!draft.trim() || sending}
                            className="flex items-center justify-center w-8 h-8 rounded-xl bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors"
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </div>
                </>
            )}

            {/* Invite tab */}
            {tab === "invite" && (
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5 min-h-[180px] max-h-[280px] custom-scrollbar">
                    {notInRoom.length === 0 && (
                        <p className="text-center text-xs text-muted-foreground/40 mt-8">
                            {isRtl ? "الكل موجود هنا بالفعل!" : "Everyone is already here!"}
                        </p>
                    )}
                    {notInRoom.map(m => (
                        <div key={m.userId} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors">
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-black">
                                {m.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold truncate">{m.name}</p>
                                <p className="text-[10px] text-muted-foreground">{m.role}</p>
                            </div>
                            <button
                                onClick={() => handleInvite(m.userId)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold transition-colors"
                            >
                                <UserPlus className="h-3 w-3" />
                                {isRtl ? "دعوة" : "Invite"}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* WebRTC voice (headless) */}
            <VoiceCall
                roomId={room.id}
                currentUserId={currentUserId}
                members={members}
                enabled={micOn}
            />
        </div>
    );
}
