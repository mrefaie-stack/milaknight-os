"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, MessageSquare, UserPlus, Send, LogOut, Volume2 } from "lucide-react";
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
const MEMBERS_POLL_MS = 2000;

export function RoomSession({ room, currentUserId, initialMembers, allTeamMembers, isRtl, onLeave }: Props) {
    const [members, setMembers] = useState<RoomMember[]>(initialMembers);
    const [micOn, setMicOn] = useState(false);
    const [micError, setMicError] = useState(false);
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

    const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());

    const handleInviteClick = async (userId: string) => {
        await handleInvite(userId);
        setInvitedIds(prev => new Set([...prev, userId]));
        setTimeout(() => setInvitedIds(prev => { const s = new Set(prev); s.delete(userId); return s; }), 3000);
    };

    return (
        <div className={cn(
            "flex flex-col rounded-3xl border overflow-hidden",
            "bg-card/85 backdrop-blur-2xl",
            room.activeBorder,
            `shadow-2xl ${room.glow}`
        )}>
            {/* Header */}
            <div className={cn("relative flex items-center gap-3 px-4 py-3.5 border-b border-white/8 overflow-hidden", room.bg)}>
                <div className="absolute inset-0 opacity-30 bg-gradient-to-r from-transparent via-white/2 to-transparent pointer-events-none" />
                <div className={cn("relative flex items-center justify-center w-9 h-9 rounded-xl bg-white/10 border border-white/10", room.color)}>
                    <Icon className="h-4 w-4" />
                    {/* live dot */}
                    <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400" />
                    </span>
                </div>
                <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-black", room.color)}>
                        {isRtl ? room.nameAr : room.nameEn}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70">
                        {members.length} {isRtl ? "في الغرفة" : members.length === 1 ? "person" : "people"}
                    </p>
                </div>
                <motion.button
                    whileTap={{ scale: 0.93 }}
                    onClick={handleLeave}
                    disabled={leaving}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-bold transition-colors border border-red-500/15"
                >
                    <LogOut className="h-3.5 w-3.5" />
                    {isRtl ? "خروج" : "Leave"}
                </motion.button>
            </div>

            {/* Members strip with animated presence */}
            <div className="flex items-center gap-1.5 px-3 py-2.5 border-b border-white/5 flex-wrap">
                <AnimatePresence mode="popLayout">
                    {members.map(m => (
                        <motion.div
                            key={m.userId}
                            initial={{ opacity: 0, scale: 0.7 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.7 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className={cn(
                                "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold border",
                                m.isCurrentUser
                                    ? "bg-primary/15 text-primary border-primary/30"
                                    : "bg-white/5 text-foreground/70 border-white/8"
                            )}
                        >
                            <div className={cn(
                                "w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black",
                                m.isCurrentUser ? "bg-primary text-primary-foreground" : "bg-white/20"
                            )}>
                                {m.name.charAt(0)}
                            </div>
                            {m.name.split(" ")[0]}
                            {m.isCurrentUser && (
                                <span className="text-[9px] opacity-50">({isRtl ? "أنت" : "you"})</span>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Voice controls */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/5">
                <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={async () => {
                        if (!micOn) {
                            try {
                                await navigator.mediaDevices.getUserMedia({ audio: true });
                                setMicError(false);
                                setMicOn(true);
                                // Unlock AudioContext on iOS/Safari
                                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                                ctx.resume().catch(() => {});
                                // Resume any peer audio blocked by browser autoplay policy
                                document.querySelectorAll<HTMLAudioElement>("audio[data-voicepeer]").forEach(el => {
                                    if (el.paused) el.play().catch(() => {});
                                });
                            } catch {
                                setMicError(true);
                            }
                        } else {
                            setMicOn(false);
                        }
                    }}
                    className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border",
                        micError
                            ? "bg-red-500/15 text-red-400 border-red-500/30"
                            : micOn
                            ? "bg-green-500/15 text-green-400 border-green-500/30 shadow-lg shadow-green-500/10"
                            : "bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10"
                    )}
                >
                    {micOn ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
                    {micError
                        ? (isRtl ? "لا يوجد إذن للمايك" : "Mic denied")
                        : micOn
                        ? (isRtl ? "مايك مفتوح" : "Mic On")
                        : (isRtl ? "مكتوم" : "Muted")}
                </motion.button>

                {/* Animated waveform when mic is live */}
                <AnimatePresence>
                    {micOn && (
                        <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            className="flex gap-[3px] items-end h-5 overflow-hidden"
                        >
                            {[3, 5, 8, 5, 6, 3, 7].map((h, i) => (
                                <motion.span
                                    key={i}
                                    className="w-[3px] rounded-full bg-green-400"
                                    animate={{ height: [h, h * 2.5, h] }}
                                    transition={{ duration: 0.6 + i * 0.07, repeat: Infinity, ease: "easeInOut", delay: i * 0.08 }}
                                    style={{ minHeight: 3 }}
                                />
                            ))}
                        </motion.span>
                    )}
                </AnimatePresence>

                {!micOn && (
                    <span className={cn("text-[10px] text-muted-foreground/40 flex items-center gap-1", isRtl ? "flex-row-reverse" : "")}>
                        <Volume2 className="h-3 w-3" />
                        {isRtl ? "صوت الآخرين نشط" : "Receiving audio"}
                    </span>
                )}

                <div className="ml-auto flex gap-1">
                    {(["chat", "invite"] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={cn(
                                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all",
                                tab === t ? "bg-primary/15 text-primary border border-primary/30" : "bg-white/5 text-muted-foreground hover:bg-white/10 border border-transparent"
                            )}
                        >
                            {t === "chat" ? <MessageSquare className="h-3 w-3" /> : <UserPlus className="h-3 w-3" />}
                            {t === "chat" ? (isRtl ? "شات" : "Chat") : (isRtl ? "دعوة" : "Invite")}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
                {tab === "chat" && (
                    <motion.div
                        key="chat"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18 }}
                        className="flex flex-col"
                    >
                        <div className="overflow-y-auto px-4 py-3 space-y-2 min-h-[180px] max-h-[260px] custom-scrollbar">
                            {messages.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-32 gap-2 opacity-40">
                                    <MessageSquare className="h-8 w-8 text-muted-foreground" />
                                    <p className="text-xs text-muted-foreground">
                                        {isRtl ? "لا رسائل بعد" : "No messages yet"}
                                    </p>
                                </div>
                            )}
                            <AnimatePresence initial={false}>
                                {messages.map(msg => (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10, scale: 0.96 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{ type: "spring", stiffness: 280, damping: 24 }}
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
                                            "px-3 py-2 rounded-2xl text-sm leading-relaxed",
                                            msg.isCurrentUser
                                                ? "bg-primary text-primary-foreground rounded-br-md"
                                                : "bg-white/8 text-foreground rounded-bl-md"
                                        )}>
                                            {msg.text}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            <div ref={chatBottomRef} />
                        </div>

                        <div className="flex items-center gap-2 px-3 py-2.5 border-t border-white/5">
                            <input
                                value={draft}
                                onChange={e => setDraft(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                                placeholder={isRtl ? "اكتب رسالة..." : "Type a message..."}
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/40 focus:bg-white/8 placeholder:text-muted-foreground/30 transition-colors"
                            />
                            <motion.button
                                whileTap={{ scale: 0.88 }}
                                onClick={sendMessage}
                                disabled={!draft.trim() || sending}
                                className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-primary-foreground disabled:opacity-30 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                            >
                                <Send className="h-4 w-4" />
                            </motion.button>
                        </div>
                    </motion.div>
                )}

                {tab === "invite" && (
                    <motion.div
                        key="invite"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18 }}
                        className="overflow-y-auto px-3 py-3 space-y-1 min-h-[180px] max-h-[280px] custom-scrollbar"
                    >
                        {notInRoom.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-32 gap-2 opacity-40">
                                <UserPlus className="h-8 w-8 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground">
                                    {isRtl ? "الكل هنا بالفعل!" : "Everyone's already here!"}
                                </p>
                            </div>
                        )}
                        {notInRoom.map((m, i) => (
                            <motion.div
                                key={m.userId}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors"
                            >
                                <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-xs font-black">
                                    {m.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold truncate">{m.name}</p>
                                    <p className="text-[10px] text-muted-foreground">{m.role.replace("_", " ")}</p>
                                </div>
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleInviteClick(m.userId)}
                                    className={cn(
                                        "flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                                        invitedIds.has(m.userId)
                                            ? "bg-green-500/15 text-green-400 border border-green-500/30"
                                            : "bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
                                    )}
                                >
                                    {invitedIds.has(m.userId) ? (
                                        <>{isRtl ? "تم الإرسال ✓" : "Sent ✓"}</>
                                    ) : (
                                        <><UserPlus className="h-3 w-3" />{isRtl ? "دعوة" : "Invite"}</>
                                    )}
                                </motion.button>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <VoiceCall
                roomId={room.id}
                currentUserId={currentUserId}
                members={members}
                enabled={micOn}
            />
        </div>
    );
}
