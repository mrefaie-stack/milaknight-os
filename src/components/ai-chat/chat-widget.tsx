"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, X, Send, Plus, Loader2, Trash2, MessageSquare, ChevronRight, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getConversations, getConversationMessages, deleteConversation } from "@/app/actions/ai-chat";
import { useLanguage } from "@/contexts/language-context";

type Message = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: string | null;
};

type Conversation = {
  id: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type ToolEvent = {
  tool: string;
  status: "running" | "done";
};

export function AiChatWidget({ user }: { user: { name: string; role: string; id: string } }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeTool, setActiveTool] = useState<ToolEvent | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const { isRtl } = useLanguage();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeTool, scrollToBottom]);

  // Load conversations when history is opened
  useEffect(() => {
    if (showHistory) {
      getConversations().then(setConversations).catch(console.error);
    }
  }, [showHistory]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  const handleNewChat = () => {
    setMessages([]);
    setConversationId(null);
    setShowHistory(false);
    setActiveTool(null);
  };

  const handleLoadConversation = async (convId: string) => {
    try {
      const msgs = await getConversationMessages(convId);
      setMessages(
        msgs.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
          toolCalls: m.toolCalls,
        }))
      );
      setConversationId(convId);
      setShowHistory(false);
    } catch {
      console.error("Failed to load conversation");
    }
  };

  const handleDeleteConversation = async (convId: string) => {
    try {
      await deleteConversation(convId);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (conversationId === convId) {
        handleNewChat();
      }
    } catch {
      console.error("Failed to delete conversation");
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = { role: "user", content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    setActiveTool(null);

    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          conversationId,
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let assistantContent = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);

          try {
            const event = JSON.parse(data);

            if (event.type === "text") {
              assistantContent += event.content;
              setMessages((prev) => {
                const updated = [...prev];
                const lastMsg = updated[updated.length - 1];
                if (lastMsg?.role === "assistant") {
                  lastMsg.content = assistantContent;
                } else {
                  updated.push({ role: "assistant", content: assistantContent });
                }
                return [...updated];
              });
            } else if (event.type === "tool_start") {
              setActiveTool({ tool: event.tool, status: "running" });
            } else if (event.type === "tool_end") {
              setActiveTool({ tool: event.tool, status: "done" });
            } else if (event.type === "done") {
              if (event.conversationId) {
                setConversationId(event.conversationId);
              }
              setActiveTool(null);
            } else if (event.type === "error") {
              assistantContent += `\n\nError: ${event.content}`;
              setMessages((prev) => {
                const updated = [...prev];
                const lastMsg = updated[updated.length - 1];
                if (lastMsg?.role === "assistant") {
                  lastMsg.content = assistantContent;
                } else {
                  updated.push({ role: "assistant", content: assistantContent });
                }
                return [...updated];
              });
            }
          } catch {
            // skip unparseable lines
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
      setActiveTool(null);
    }
  };

  const toolNameMap: Record<string, string> = {
    get_clients: "Fetching clients",
    get_action_plans: "Fetching action plans",
    get_reports: "Fetching reports",
    get_report_by_id: "Loading report",
    get_notifications: "Loading notifications",
    get_team_members: "Loading team",
    get_recent_activities: "Loading activities",
    get_meeting_requests: "Loading meetings",
    query_analytics: "Analyzing data",
    create_action_plan: "Creating action plan",
    add_content_item: "Adding content",
    submit_plan_for_approval: "Submitting plan",
    approve_action_plan: "Approving plan",
    approve_content_item: "Approving item",
    schedule_action_plan: "Scheduling plan",
    publish_report: "Publishing report",
    send_notification: "Sending notification",
    request_meeting: "Requesting meeting",
  };

  return (
    <>
      {/* Floating Button and Welcome Bubble */}
      <motion.div
        className={cn(
          "fixed bottom-20 md:bottom-6 z-[55] flex flex-col gap-3",
          isRtl ? "left-6 items-start" : "right-6 items-end"
        )}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: "spring" }}
      >
        <AnimatePresence>
          {showWelcome && !isOpen && (
            <motion.div
              initial={{ opacity: 0, x: isRtl ? -20 : 20, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: isRtl ? -20 : 20, scale: 0.8 }}
              className="relative group"
            >
              <div 
                className={cn(
                  "bg-primary text-primary-foreground px-4 py-3 rounded-xl shadow-lg cursor-pointer hover:bg-primary/95 transition-colors max-w-[200px]",
                  isRtl ? "rounded-bl-none text-right" : "rounded-br-none text-right"
                )}
                onClick={() => {
                  setIsOpen(true);
                  setShowWelcome(false);
                }}
              >
                <p className="text-sm font-medium leading-relaxed">
                  أنا مساعدك الذكي، كيف يمكنني مساعدتك اليوم؟
                </p>
              </div>
              <Button
                variant="secondary"
                size="icon-xs"
                className={cn(
                  "absolute -top-2 size-5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity",
                  isRtl ? "-right-2" : "-left-2"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowWelcome(false);
                }}
              >
                <X className="size-3" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) setShowWelcome(false);
          }}
          size="icon-lg"
          className={cn(
            "rounded-full shadow-lg size-14 transition-all",
            isOpen
              ? "bg-muted text-muted-foreground hover:bg-muted/80"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          {isOpen ? <X className="size-6" /> : <Bot className="size-6" />}
        </Button>
      </motion.div>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "fixed bottom-36 md:bottom-24 z-[55] flex flex-col rounded-xl border border-border bg-card shadow-lg overflow-hidden",
              "inset-x-3 h-[70vh] sm:inset-x-auto sm:h-[550px] sm:max-h-[70vh] sm:w-[400px]",
              isRtl ? "sm:left-6" : "sm:right-6"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center size-8 rounded-full bg-primary/10">
                  <Bot className="size-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">MilaKnight AI</h3>
                  <p className="text-[10px] text-muted-foreground">{user.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setShowHistory(!showHistory)}
                  title="History"
                >
                  <MessageSquare className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleNewChat}
                  title="New chat"
                >
                  <Plus className="size-3.5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden relative">
              {/* History Panel */}
              <AnimatePresence>
                {showHistory && (
                  <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "-100%" }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 z-10 bg-background overflow-auto"
                  >
                    <div className="p-3 space-y-1">
                      <p className="text-xs font-medium text-muted-foreground px-2 mb-2">
                        Conversations
                      </p>
                      {conversations.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-8">
                          No conversations yet
                        </p>
                      )}
                      {conversations.map((conv) => (
                        <div
                          key={conv.id}
                          className={cn(
                            "flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer hover:bg-muted/50 group",
                            conversationId === conv.id && "bg-muted"
                          )}
                          onClick={() => handleLoadConversation(conv.id)}
                        >
                          <ChevronRight className="size-3 text-muted-foreground shrink-0" />
                          <span className="text-xs truncate flex-1">
                            {conv.title || "Untitled"}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="opacity-0 group-hover:opacity-100 shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteConversation(conv.id);
                            }}
                          >
                            <Trash2 className="size-3 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Messages */}
              <div className="h-full overflow-auto px-4 py-3 space-y-3 custom-scrollbar">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                    <div className="flex items-center justify-center size-16 rounded-full bg-primary/10">
                      <Bot className="size-8 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">MilaKnight AI</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-[250px]">
                        Ask me anything about your clients, reports, action plans, or performance metrics.
                      </p>
                    </div>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted rounded-bl-md"
                      )}
                    >
                      <div className="whitespace-pre-wrap break-words">
                        {msg.content}
                      </div>
                      {msg.toolCalls && (
                        <div className="mt-2 pt-2 border-t border-current/10">
                          <div className="flex items-center gap-1 text-[10px] opacity-60">
                            <Wrench className="size-3" />
                            <span>
                              {JSON.parse(msg.toolCalls)
                                .map((t: { name: string }) => toolNameMap[t.name] || t.name)
                                .join(", ")}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Tool execution indicator */}
                {activeTool && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 bg-muted/60 rounded-xl px-3 py-2 text-xs text-muted-foreground">
                      <Loader2 className="size-3 animate-spin" />
                      <span>{toolNameMap[activeTool.tool] || activeTool.tool}...</span>
                    </div>
                  </div>
                )}

                {/* Loading indicator */}
                {isLoading && !activeTool && messages[messages.length - 1]?.role === "user" && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-xl rounded-bl-md px-4 py-3">
                      <div className="flex gap-1.5">
                        <span className="size-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="size-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="size-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input */}
            <div className="border-t p-3 bg-muted/20">
              <div className="flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Ask MilaKnight AI..."
                  rows={1}
                  className="flex-1 resize-none bg-background rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 placeholder:text-muted-foreground/60"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="rounded-xl shrink-0"
                >
                  {isLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
