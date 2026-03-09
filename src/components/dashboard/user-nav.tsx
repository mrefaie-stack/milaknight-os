"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "next-auth/react";
import { LogOut, User as UserIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function UserNav({ user, isRtl, compact = false }: { user: any; isRtl?: boolean; compact?: boolean }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const initials = user?.name
        ? user.name.split(" ").map((n: string) => n[0]).join("")
        : "U";

    if (!mounted) {
        return <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className={cn(
                        "relative h-10 w-full justify-start gap-4 px-2 hover:bg-accent",
                        isRtl ? "flex-row-reverse text-right" : ""
                    )}
                >
                    <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    {!compact && (
                        <div className={cn("flex flex-col space-y-1 flex-1 overflow-hidden", isRtl ? "text-right" : "text-left")}>
                            <p className="text-sm font-medium leading-none truncate">{user.name || (isRtl ? "مستخدم" : "User")}</p>
                            <p className="text-xs text-muted-foreground leading-none truncate">
                                {user.email}
                            </p>
                        </div>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align={isRtl ? "start" : "end"} forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className={cn("flex flex-col space-y-1", isRtl ? "text-right" : "")}>
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className={cn(isRtl ? "flex-row-reverse" : "")}>
                    <UserIcon className={cn("h-4 w-4", isRtl ? "ml-2" : "mr-2")} />
                    <span>{isRtl ? "الملف الشخصي" : "Profile"}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className={cn(isRtl ? "flex-row-reverse" : "")}
                >
                    <LogOut className={cn("h-4 w-4", isRtl ? "ml-2" : "mr-2")} />
                    <span>{isRtl ? "تسجيل الخروج" : "Log out"}</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
