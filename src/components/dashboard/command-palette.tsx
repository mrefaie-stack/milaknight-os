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
                <div className="relative w-full overflow-hidden rounded-3xl glass-card backdrop-blur-2xl border border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-200" dir={isRtl ? "rtl" : "ltr"}>
                    <Command className="w-full">
                        <div className="flex items-center border-b border-white/5 px-6 py-4">
                            <Search className={`h-5 w-5 text-primary/50 ${isRtl ? 'ml-3' : 'mr-3'}`} />
                            <Command.Input
                                placeholder={t("common.search")}
                                className="flex h-10 w-full rounded-md bg-transparent text-lg font-bold outline-none placeholder:text-muted-foreground/50 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest border border-white/5 px-2 py-1 rounded-md bg-white/5">ESC</span>
                            </div>
                        </div>
                        <Command.List className="max-h-[450px] overflow-y-auto overflow-x-hidden p-3 custom-scrollbar">
                            <Command.Empty className="py-14 text-center">
                                <div className="flex flex-col items-center gap-4 opacity-30">
                                    <Search className="h-10 w-10 text-muted-foreground" />
                                    <p className="text-sm font-black uppercase tracking-widest">{t("common.no_results") || "No Missions Found"}</p>
                                </div>
                            </Command.Empty>

                            <Command.Group heading={<span className="text-[10px] font-black uppercase tracking-widest text-primary/40 px-3 py-2 block">{t("sidebar.menu")}</span>}>
                                <Command.Item
                                    onSelect={() => runCommand(() => router.push("/notifications"))}
                                    className="flex items-center gap-3 px-3 py-4 rounded-2xl cursor-pointer hover:bg-primary/10 text-foreground/80 font-bold transition-all aria-selected:bg-primary/20 aria-selected:text-primary"
                                >
                                    <Bell className="h-5 w-5" />
                                    <span>{t("common.notifications")}</span>
                                </Command.Item>
                                <Command.Item
                                    onSelect={() => runCommand(() => router.push("/messages"))}
                                    className="flex items-center gap-3 px-3 py-4 rounded-2xl cursor-pointer hover:bg-primary/10 text-foreground/80 font-bold transition-all aria-selected:bg-primary/20 aria-selected:text-primary"
                                >
                                    <MessageSquare className="h-5 w-5" />
                                    <span>{t("common.messages")}</span>
                                </Command.Item>
                                <Command.Item
                                    onSelect={() => runCommand(() => router.push("/settings"))}
                                    className="flex items-center gap-3 px-3 py-4 rounded-2xl cursor-pointer hover:bg-primary/10 text-foreground/80 font-bold transition-all aria-selected:bg-primary/20 aria-selected:text-primary"
                                >
                                    <Settings className="h-5 w-5" />
                                    <span>{t("common.settings")}</span>
                                </Command.Item>
                            </Command.Group>

                            <div className="h-px bg-white/5 my-3" />

                            <Command.Group heading={<span className="text-[10px] font-black uppercase tracking-widest text-primary/40 px-3 py-2 block">Quick Actions</span>}>
                                <Command.Item
                                    onSelect={() => runCommand(() => setOpen(false))}
                                    className="flex items-center justify-between px-3 py-4 rounded-2xl cursor-pointer hover:bg-primary/10 text-foreground/80 font-bold transition-all aria-selected:bg-primary/20 aria-selected:text-primary"
                                >
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                                        <span>Mark Daily Tasks Resolved</span>
                                    </div>
                                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Action</span>
                                </Command.Item>
                            </Command.Group>
                        </Command.List>
                    </Command>
                </div>
            </DialogContent>
        </Dialog>
    );
}
