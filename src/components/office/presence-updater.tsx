"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { updateMyPresence } from "@/app/actions/presence";
import { leaveRoom } from "@/app/actions/room";

export function PresenceUpdater() {
    const pathname = usePathname();
    const pathnameRef = useRef(pathname);
    pathnameRef.current = pathname;

    // Update on every navigation
    useEffect(() => {
        updateMyPresence(pathname);
    }, [pathname]);

    // Heartbeat every 2 minutes to stay "online"
    useEffect(() => {
        const interval = setInterval(() => {
            updateMyPresence(pathnameRef.current);
        }, 2 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    // Leave room on page unload (best-effort via sendBeacon)
    useEffect(() => {
        const handleUnload = () => {
            // sendBeacon to a dedicated leave endpoint for reliability
            navigator.sendBeacon?.("/api/rooms/leave");
        };
        window.addEventListener("beforeunload", handleUnload);
        return () => window.removeEventListener("beforeunload", handleUnload);
    }, []);

    return null;
}
