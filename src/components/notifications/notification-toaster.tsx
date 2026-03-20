"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, ExternalLink } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { markAsRead } from "@/app/actions/notification";

type NotifItem = {
    id: string;
    title: string;
    message: string;
    link: string | null;
    createdAt: string;
};

const POLL_INTERVAL = 18000; // 18s

// ── Web Audio chime (no file needed) ─────────────────────────────────────────
function playChime() {
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const notes = [880, 1108.73];
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = "sine";
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.18);
            gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + i * 0.18 + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.7);
            osc.start(ctx.currentTime + i * 0.18);
            osc.stop(ctx.currentTime + i * 0.18 + 0.7);
        });
    } catch {}
}

// ── Individual Toast ──────────────────────────────────────────────────────────
function NotifToast({ notif, onDismiss }: { notif: NotifItem; onDismiss: (id: string) => void }) {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        timerRef.current = setTimeout(() => onDismiss(notif.id), 6000);
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [notif.id, onDismiss]);

    const handleDismiss = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        onDismiss(notif.id);
        markAsRead(notif.id).catch(() => {});
    };

    const content = (
        <motion.div
            layout
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97, transition: { duration: 0.15 } }}
            transition={{ type: "spring", damping: 24, stiffness: 280 }}
            className={cn(
                "relative flex items-start gap-3 w-80 max-w-[92vw]",
                "bg-card border border-border",
                "rounded-xl p-4 shadow-lg",
                "cursor-pointer overflow-hidden group"
            )}
            onClick={handleDismiss}
        >
            {/* Progress bar */}
            <motion.div
                className="absolute bottom-0 left-0 h-[2px] bg-primary/50 rounded-full"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 6, ease: "linear" }}
            />

            {/* Icon */}
            <div className="shrink-0 mt-0.5 flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                <Bell className="h-4 w-4 text-primary" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground leading-tight">{notif.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{notif.message}</p>
                {notif.link && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-primary font-medium mt-1.5">
                        <ExternalLink className="h-2.5 w-2.5" />
                        View
                    </span>
                )}
            </div>

            {/* Close */}
            <button
                onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
                className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
            >
                <X className="h-3.5 w-3.5" />
            </button>
        </motion.div>
    );

    if (notif.link) {
        return (
            <Link href={notif.link} onClick={handleDismiss}>
                {content}
            </Link>
        );
    }

    return content;
}

// ── Main Toaster ──────────────────────────────────────────────────────────────
export function NotificationToaster() {
    const [queue, setQueue] = useState<NotifItem[]>([]);
    const sinceRef = useRef<string>(new Date().toISOString());
    const seenIds  = useRef<Set<string>>(new Set());

    const dismiss = useCallback((id: string) => {
        setQueue(q => q.filter(n => n.id !== id));
    }, []);

    useEffect(() => {
        const poll = async () => {
            try {
                const res = await fetch(`/api/notifications/poll?since=${encodeURIComponent(sinceRef.current)}`);
                if (!res.ok) return;
                const items: NotifItem[] = await res.json();
                const fresh = items.filter(n => !seenIds.current.has(n.id));
                if (fresh.length === 0) return;

                fresh.forEach(n => seenIds.current.add(n.id));
                sinceRef.current = fresh[fresh.length - 1].createdAt;

                setQueue(q => [...q, ...fresh].slice(-3));
                playChime();
            } catch {}
        };

        const warmup = setTimeout(() => {
            poll();
            const interval = setInterval(poll, POLL_INTERVAL);
            return () => clearInterval(interval);
        }, 3000);

        return () => clearTimeout(warmup);
    }, []);

    return (
        <div className="fixed bottom-20 md:bottom-6 right-4 z-[200] flex flex-col gap-2 items-end pointer-events-none">
            <AnimatePresence mode="popLayout">
                {queue.map(n => (
                    <div key={n.id} className="pointer-events-auto">
                        <NotifToast notif={n} onDismiss={dismiss} />
                    </div>
                ))}
            </AnimatePresence>
        </div>
    );
}
