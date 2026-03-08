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

export function ChatInterface({ currentUser, recentChats: initialRecentChats, initialUserId }: { currentUser: any, recentChats: any[], initialUserId?: string }) {
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
                        // Add to temporary list if not already there, using functional update to avoid race/stale state
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
            const interval = setInterval(loadMessages, 3000); // Poll for new messages every 3s
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
        <div className="flex flex-1 h-full min-h-[500px] overflow-hidden">
            {/* User List */}
            <div className="w-80 border-r flex flex-col bg-muted/10 shrink-0">
                <div className="p-4 border-b bg-muted/20">
                    <h3 className="font-semibold">{isRtl ? 'المحادثات' : 'Recent Chats'}</h3>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {/* Unique recent chats */}
                    {Array.from(new Map(recentChats.map(u => [u.id, u])).values()).map((user) => (
                        <div
                            key={user.id}
                            onClick={() => setSelectedUser(user)}
                            className={`p-5 flex items-center gap-4 cursor-pointer transition-all duration-300 relative group ${selectedUser?.id === user.id ? 'bg-primary/10' : 'hover:bg-white/5'}`}
                        >
                            <Avatar className="h-12 w-12 border-2 border-transparent group-hover:border-primary/20 transition-all">
                                <AvatarFallback className="bg-primary/10 text-primary font-black">
                                    {user.firstName[0]}{user.lastName ? user.lastName[0] : ""}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 overflow-hidden">
                                <div className="font-black tracking-tight truncate text-sm">{user.firstName} {user.lastName || ""}</div>
                                <div className="text-[9px] text-muted-foreground uppercase font-black tracking-[0.1em] opacity-40">{user.role}</div>
                            </div>
                            {selectedUser?.id === user.id && (
                                <div className="absolute right-0 top-0 bottom-0 w-1 bg-primary" />
                            )}
                        </div>
                    ))}
                    {recentChats.length === 0 && (
                        <div className="p-12 text-center flex flex-col items-center gap-4 opacity-30">
                            <div className="h-1 w-12 bg-border rounded-full" />
                            <p className="text-[10px] font-black uppercase tracking-widest italic">{t("common.messages_empty") || "No conversations"}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-background relative h-full min-w-0">
                {selectedUser ? (
                    <>
                        <div className="p-4 border-b flex items-center gap-3 bg-card sticky top-0 z-10">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback><UserIcon className="h-4 w-4" /></AvatarFallback>
                            </Avatar>
                            <div className="font-semibold truncate">{selectedUser.firstName} {selectedUser.lastName || ""}</div>
                        </div>

                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-muted/5 pb-24">
                            {messages.map((msg) => {
                                const isMe = msg.senderId === currentUser.id;
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-2 text-sm ${isMe
                                            ? 'bg-primary text-primary-foreground rounded-tr-none'
                                            : 'bg-card border rounded-tl-none shadow-sm'
                                            }`}>
                                            <div className="whitespace-pre-wrap break-words">{msg.text}</div>
                                            <div className={`text-[10px] mt-1 opacity-70 ${isMe ? 'text-right' : ''}`}>
                                                {format(new Date(msg.createdAt), 'HH:mm')}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-card/80 backdrop-blur-md">
                            <form onSubmit={handleSend} className="flex gap-2 max-w-4xl mx-auto">
                                <Input
                                    placeholder={isRtl ? "اكتب رسالة..." : "Type a message..."}
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    className="flex-1 h-11"
                                    autoFocus
                                />
                                <Button type="submit" size="icon" className="h-11 w-11 shrink-0 rounded-full shadow-lg" disabled={loading}>
                                    <Send className="h-4 w-4" />
                                </Button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center bg-muted/5">
                        <div className="p-6 bg-muted/20 rounded-full mb-6">
                            <MessageSquare className="h-12 w-12 opacity-20" />
                        </div>
                        <h3 className="text-xl font-bold opacity-50 tracking-tight">{isRtl ? 'اختر محادثة' : 'Select a conversation'}</h3>
                        <p className="max-w-xs opacity-40 text-sm mt-2">{isRtl ? 'اختر شخصاً من القائمة لبدء المحادثة.' : 'Choose a team member from the list to start messaging.'}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
