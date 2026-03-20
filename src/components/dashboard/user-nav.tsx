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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { signOut } from "next-auth/react";
import { LogOut, User as UserIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function UserNav({
    user,
    isRtl,
    compact = false,
}: {
    user: any;
    isRtl?: boolean;
    compact?: boolean;
}) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const initials = user?.name
        ? user.name.split(" ").slice(0, 2).map((n: string) => n[0]).join("").toUpperCase()
        : "U";

    if (!mounted) {
        return <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />;
    }

    const trigger = compact ? (
        <button className="flex items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar className="h-7 w-7">
                <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                    {initials}
                </AvatarFallback>
            </Avatar>
        </button>
    ) : (
        <Button
            variant="ghost"
            className={cn(
                "relative h-9 w-full justify-start gap-2.5 px-2 hover:bg-muted",
                isRtl ? "flex-row-reverse text-right" : "",
            )}
        >
            <Avatar className="h-7 w-7 shrink-0">
                <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                    {initials}
                </AvatarFallback>
            </Avatar>
            <div className={cn(
                "flex flex-col flex-1 overflow-hidden min-w-0",
                isRtl ? "text-right items-end" : "text-left items-start",
            )}>
                <span className="text-[13px] font-medium leading-none truncate w-full">
                    {user.name || (isRtl ? "مستخدم" : "User")}
                </span>
                <span className="text-[11px] text-muted-foreground leading-none truncate w-full mt-0.5">
                    {user.email}
                </span>
            </div>
        </Button>
    );

    const dropdown = (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                {trigger}
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-56"
                align={isRtl ? "start" : "end"}
                side={compact ? (isRtl ? "left" : "right") : "top"}
                sideOffset={8}
                forceMount
            >
                <DropdownMenuLabel className="font-normal py-2">
                    <div className={cn("flex flex-col gap-0.5", isRtl ? "text-right" : "")}>
                        <p className="text-sm font-semibold leading-none">{user.name}</p>
                        <p className="text-xs text-muted-foreground leading-none mt-0.5">
                            {user.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className={cn(isRtl ? "flex-row-reverse" : "")}>
                    <UserIcon className="h-4 w-4" />
                    <span>{isRtl ? "الملف الشخصي" : "Profile"}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                    variant="destructive"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className={cn(isRtl ? "flex-row-reverse" : "")}
                >
                    <LogOut className="h-4 w-4" />
                    <span>{isRtl ? "تسجيل الخروج" : "Log out"}</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );

    /* In compact mode, wrap in tooltip so the user knows who this is */
    if (compact) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <span>{dropdown}</span>
                </TooltipTrigger>
                <TooltipContent side={isRtl ? "left" : "right"} sideOffset={8}>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-muted-foreground text-[11px]">{user.email}</p>
                </TooltipContent>
            </Tooltip>
        );
    }

    return dropdown;
}
