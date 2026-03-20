"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
    Calculator,
    Calendar,
    CreditCard,
    Settings,
    Smile,
    User,
    Search,
    LayoutDashboard,
    Users,
    FileText,
    MessageSquare,
    Bell,
    Trash2,
    CheckCircle
} from "lucide-react";
import { Command } from "cmdk";
import { useLanguage } from "@/contexts/language-context";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";

export function CommandPalette() {
    const [open, setOpen] = React.useState(false);
    const router = useRouter();
    const { t, isRtl } = useLanguage();

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        }

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const runCommand = React.useCallback((command: () => void) => {
        setOpen(false);
        command();
    }, []);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-2xl">
                <div className="relative w-full overflow-hidden rounded-xl bg-card border border-border shadow-lg" dir={isRtl ? "rtl" : "ltr"}>
                    <Command className="w-full">
                        <div className="flex items-center border-b border-border px-4 py-3">
                            <Search className={`h-4 w-4 text-muted-foreground/60 ${isRtl ? 'ml-3' : 'mr-3'} shrink-0`} />
                            <Command.Input
                                placeholder={t("common.search")}
                                className="flex h-9 w-full rounded-md bg-transparent text-sm outline-none placeholder:text-muted-foreground/50 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            <div className="flex items-center gap-2">
                                <span className="section-label text-muted-foreground border border-border px-1.5 py-0.5 rounded text-[9px]">ESC</span>
                            </div>
                        </div>
                        <Command.List className="max-h-[400px] overflow-y-auto overflow-x-hidden p-2 custom-scrollbar">
                            <Command.Empty className="py-10 text-center">
                                <div className="flex flex-col items-center gap-3">
                                    <Search className="h-8 w-8 text-muted-foreground/30" />
                                    <p className="text-sm text-muted-foreground">{t("common.no_results") || "No results found"}</p>
                                </div>
                            </Command.Empty>

                            <Command.Group heading={<span className="section-label text-[10px] text-muted-foreground px-2 py-1.5 block">{t("sidebar.menu")}</span>}>
                                <Command.Item
                                    onSelect={() => runCommand(() => router.push("/notifications"))}
                                    className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-md cursor-pointer text-sm hover:bg-muted transition-colors aria-selected:bg-muted"
                                >
                                    <Bell className="h-4 w-4 text-muted-foreground" />
                                    <span>{t("common.notifications")}</span>
                                </Command.Item>
                                <Command.Item
                                    onSelect={() => runCommand(() => router.push("/messages"))}
                                    className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-md cursor-pointer text-sm hover:bg-muted transition-colors aria-selected:bg-muted"
                                >
                                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                    <span>{t("common.messages")}</span>
                                </Command.Item>
                                <Command.Item
                                    onSelect={() => runCommand(() => router.push("/settings"))}
                                    className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-md cursor-pointer text-sm hover:bg-muted transition-colors aria-selected:bg-muted"
                                >
                                    <Settings className="h-4 w-4 text-muted-foreground" />
                                    <span>{t("common.settings")}</span>
                                </Command.Item>
                            </Command.Group>

                            <div className="h-px bg-border my-1.5" />

                            <Command.Group heading={<span className="section-label text-[10px] text-muted-foreground px-2 py-1.5 block">Quick Actions</span>}>
                                <Command.Item
                                    onSelect={() => runCommand(() => setOpen(false))}
                                    className="flex items-center justify-between px-2.5 py-2.5 rounded-md cursor-pointer text-sm hover:bg-muted transition-colors aria-selected:bg-muted"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                                        <span>Mark Daily Tasks Resolved</span>
                                    </div>
                                    <span className="section-label text-[9px] text-muted-foreground">Action</span>
                                </Command.Item>
                            </Command.Group>
                        </Command.List>
                    </Command>
                </div>
            </DialogContent>
        </Dialog>
    );
}
