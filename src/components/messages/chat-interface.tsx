"use client";

import { useState, useEffect, useRef } from "react";
import { getMessages, sendMessage } from "@/app/actions/chat";
import { getUser } from "@/app/actions/user";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, User as UserIcon, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/language-context";
import { cn } from "@/lib/utils";

export function ChatInterface({ currentUser, recentChats: initialRecentChats, initialUserId }: {
    currentUser: any;
    recentChats: any[];
    initialUserId?: string;
}) {
    const { t, isRtl } = useLanguage();
    const [recentChats, setRecentChats] = useState(initialRecentChats);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState("");
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function fetchInitialUser() {
            if (initialUserId) {
                const userInRecent = recentChats.find(u => u.id === initialUserId);
                if (userInRecent) {
                    setSelectedUser(userInRecent);
                } else {
                    const fetchedUser = await getUser(initialUserId);
                    if (fetchedUser) {
                        setSelectedUser(fetchedUser);
                        setRecentChats(prev => {
                            if (prev.some(u => u.id === fetchedUser.id)) return prev;
                            return [fetchedUser, ...prev];
                        });
                    }
                }
            }
        }
        fetchInitialUser();
    }, [initialUserId]);

    useEffect(() => {
        if (selectedUser) {
            loadMessages();
            const interval = setInterval(loadMessages, 3000);
            return () => clearInterval(interval);
        }
    }, [selectedUser]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    async function loadMessages() {
        if (!selectedUser) return;
        try {
            const data = await getMessages(selectedUser.id);
            setMessages(data);
        } catch (error) {
            console.error("Failed to load messages", error);
        }
    }

    async function handleSend(e?: React.FormEvent) {
        e?.preventDefault();
        if (!inputText.trim() || !selectedUser || loading) return;

        setLoading(true);
        const originalText = inputText;
        setInputText("");
        try {
            await sendMessage(selectedUser.id, originalText);
            loadMessages();
        } catch (error) {
            toast.error(isRtl ? "فشل إرسال الرسالة" : "Failed to send message");
            setInputText(originalText);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-1 h-full min-h-[500px] overflow-hidden rounded-lg border border-border">
            {/* User List */}
            <div className="w-72 border-r border-border flex flex-col bg-muted/20 shrink-0">
                <div className="px-4 py-3 border-b border-border">
                    <h3 className="text-sm font-semibold">{isRtl ? "المحادثات" : "Recent Chats"}</h3>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {Array.from(new Map(recentChats.map(u => [u.id, u])).values()).map((user) => (
                        <div
                            key={user.id}
                            onClick={() => setSelectedUser(user)}
                            className={cn(
                                "px-3 py-3 flex items-center gap-3 cursor-pointer transition-colors relative",
                                selectedUser?.id === user.id
                                    ? "bg-primary/8"
                                    : "hover:bg-muted/50",
                            )}
                        >
                            <Avatar className="h-8 w-8 shrink-0">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                                    {user.firstName[0]}{user.lastName ? user.lastName[0] : ""}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">{user.firstName} {user.lastName || ""}</div>
                                <div className="section-label text-[9px] text-muted-foreground">{user.role}</div>
                            </div>
                            {selectedUser?.id === user.id && (
                                <div className="absolute right-0 top-1 bottom-1 w-[3px] rounded-full bg-primary" />
                            )}
                        </div>
                    ))}
                    {recentChats.length === 0 && (
                        <div className="p-8 text-center">
                            <p className="text-xs text-muted-foreground">{t("common.messages_empty") || "No conversations"}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-background relative h-full min-w-0">
                {selectedUser ? (
                    <>
                        <div className="px-4 py-3 border-b border-border flex items-center gap-3 bg-card">
                            <Avatar className="h-7 w-7">
                                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                    {selectedUser.firstName[0]}{selectedUser.lastName?.[0] || ""}
                                </AvatarFallback>
                            </Avatar>
                            <div className="text-sm font-medium truncate">
                                {selectedUser.firstName} {selectedUser.lastName || ""}
                            </div>
                        </div>

                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/10 pb-20 custom-scrollbar">
                            {messages.map((msg) => {
                                const isMe = msg.senderId === currentUser.id;
                                return (
                                    <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                                        <div className={cn(
                                            "max-w-[80%] md:max-w-[65%] rounded-xl px-3.5 py-2.5 text-sm",
                                            isMe
                                                ? "bg-primary text-primary-foreground rounded-br-sm"
                                                : "bg-card border border-border rounded-bl-sm",
                                        )}>
                                            <div className="whitespace-pre-wrap break-words">{msg.text}</div>
                                            <div className={cn("text-[10px] mt-1 opacity-60", isMe ? "text-right" : "")}>
                                                {format(new Date(msg.createdAt), "HH:mm")}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-border bg-card">
                            <form onSubmit={handleSend} className="flex gap-2">
                                <Input
                                    placeholder={isRtl ? "اكتب رسالة..." : "Type a message..."}
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    className="flex-1"
                                    autoFocus
                                />
                                <Button type="submit" size="icon" className="shrink-0" disabled={loading}>
                                    <Send className="h-4 w-4" />
                                </Button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                        <div className="p-4 bg-muted rounded-full mb-4">
                            <MessageSquare className="h-8 w-8 opacity-30" />
                        </div>
                        <h3 className="text-sm font-medium">{isRtl ? "اختر محادثة" : "Select a conversation"}</h3>
                        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                            {isRtl ? "اختر شخصاً من القائمة لبدء المحادثة." : "Choose a team member from the list to start messaging."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
