"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { updateMyPresence } from "@/app/actions/presence";

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

    return null;
}
