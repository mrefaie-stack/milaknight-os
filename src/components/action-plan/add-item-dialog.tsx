"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { addContentItem } from "@/app/actions/action-plan";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

export function AddItemDialog({ planId }: { planId: string }) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [type, setType] = useState("POST");

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        const formData = new FormData(event.currentTarget);
        const data = Object.fromEntries(formData.entries());
        data.type = type;

        try {
            await addContentItem(planId, data);
            toast.success("Item added successfully");
            setOpen(false);
            // reset form
            event.currentTarget.reset();
        } catch (error: any) {
            toast.error(error.message || "Failed to add item");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Item
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add Content Item</DialogTitle>
                    <DialogDescription>
                        Add a new post, video, poll, or article to this action plan.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Content Type</Label>
                        <Select value={type} onValueChange={setType} name="type">
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="POST">Social Media Post</SelectItem>
                                <SelectItem value="VIDEO">Video / Reel</SelectItem>
                                <SelectItem value="POLL">Interactive Poll</SelectItem>
                                <SelectItem value="ARTICLE">SEO Article</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="platform">Platform</Label>
                        <Input id="platform" name="platform" placeholder="e.g. Facebook, LinkedIn, Website" required />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="scheduledDate">Scheduled Date (Optional)</Label>
                        <Input id="scheduledDate" name="scheduledDate" type="date" />
                    </div>

                    {/* Dynamic Fields based on Type */}
                    {(type === "POST" || type === "VIDEO") && (
                        <div className="grid gap-2">
                            <Label>{type === "POST" ? "Image URL" : "Video URL"}</Label>
                            <Input name={type === "POST" ? "imageUrl" : "videoUrl"} placeholder="https://..." />
                        </div>
                    )}

                    {(type === "POST" || type === "VIDEO") && (
                        <>
                            <div className="grid gap-2">
                                <Label>Caption (Arabic)</Label>
                                <Input name="captionAr" placeholder="النص باللغة العربية" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Caption (English)</Label>
                                <Input name="captionEn" placeholder="Caption in English" />
                            </div>
                        </>
                    )}

                    {type === "POLL" && (
                        <>
                            <div className="grid gap-2">
                                <Label>Poll Question</Label>
                                <Input name="pollQuestion" placeholder="What's your favorite...?" required />
                            </div>
                            <div className="grid gap-2">
                                <Label>Option A</Label>
                                <Input name="pollOptionA" required />
                            </div>
                            <div className="grid gap-2">
                                <Label>Option B</Label>
                                <Input name="pollOptionB" required />
                            </div>
                        </>
                    )}

                    {type === "ARTICLE" && (
                        <>
                            <div className="grid gap-2">
                                <Label>Article Title</Label>
                                <Input name="articleTitle" placeholder="SEO optimized title" required />
                            </div>
                            <div className="grid gap-2">
                                {/* In a real app we'd use a Textarea component, but we'll use an Input for simplicity here or add a native textarea */}
                                <Label>Article Content Summary / Link</Label>
                                <textarea name="articleContent" className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" placeholder="Summary or Google Doc link..." required />
                            </div>
                        </>
                    )}

                    <DialogFooter className="mt-4">
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Item
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
