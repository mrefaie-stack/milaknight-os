"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Tabs as TabsPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-[orientation=horizontal]:flex-col",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center text-muted-foreground group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col",
  {
    variants: {
      variant: {
        default:
          "bg-muted rounded-lg p-1 gap-0.5 group-data-[orientation=horizontal]/tabs:h-9",
        line:
          "bg-transparent border-b border-border rounded-none gap-0 group-data-[orientation=horizontal]/tabs:h-10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        /* base */
        "relative inline-flex flex-1 items-center justify-center gap-1.5 text-sm font-medium whitespace-nowrap",
        "transition-all duration-150 outline-none",
        "disabled:pointer-events-none disabled:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        /* group=default */
        "group-data-[variant=default]/tabs-list:rounded-md group-data-[variant=default]/tabs-list:px-3 group-data-[variant=default]/tabs-list:py-1",
        "group-data-[variant=default]/tabs-list:h-[calc(100%-2px)]",
        "group-data-[variant=default]/tabs-list:text-muted-foreground hover:text-foreground",
        "group-data-[variant=default]/tabs-list:data-[state=active]:bg-background",
        "group-data-[variant=default]/tabs-list:data-[state=active]:text-foreground",
        "group-data-[variant=default]/tabs-list:data-[state=active]:shadow-sm",
        /* group=line */
        "group-data-[variant=line]/tabs-list:px-3 group-data-[variant=line]/tabs-list:pb-2.5 group-data-[variant=line]/tabs-list:pt-2",
        "group-data-[variant=line]/tabs-list:text-muted-foreground hover:text-foreground",
        "group-data-[variant=line]/tabs-list:data-[state=active]:text-foreground",
        "group-data-[variant=line]/tabs-list:data-[state=active]:after:absolute",
        "group-data-[variant=line]/tabs-list:after:absolute group-data-[orientation=horizontal]/tabs:group-data-[variant=line]/tabs-list:after:bottom-0",
        "group-data-[variant=line]/tabs-list:after:inset-x-0 group-data-[variant=line]/tabs-list:after:h-0.5",
        "group-data-[variant=line]/tabs-list:after:rounded-t-full group-data-[variant=line]/tabs-list:after:bg-primary",
        "group-data-[variant=line]/tabs-list:after:opacity-0 group-data-[variant=line]/tabs-list:data-[state=active]:after:opacity-100",
        "group-data-[orientation=vertical]/tabs:group-data-[variant=default]/tabs-list:w-full group-data-[orientation=vertical]/tabs:group-data-[variant=default]/tabs-list:justify-start",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
