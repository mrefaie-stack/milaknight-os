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
import { Loader2, Plus, MessageSquare } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

const PLATFORMS = [
    "Facebook", "Instagram", "TikTok", "Snapchat", "LinkedIn", "YouTube", "Twitter"
];

export function AddItemDialog({ planId }: { planId: string }) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [type, setType] = useState("POST");
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (selectedPlatforms.length === 0 && type !== "EMAIL") {
            toast.error("Please select at least one target platform.");
            return;
        }

        setIsLoading(true);
        const formData = new FormData(event.currentTarget);
        const data = Object.fromEntries(formData.entries());
        data.type = type;
        data.platform = type === "EMAIL" ? "Email" : selectedPlatforms.join(', ');

        try {
            await addContentItem(planId, data);
            toast.success("Item added successfully");
            setOpen(false);
            // reset form
            event.currentTarget.reset();
            setSelectedPlatforms([]);
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
                                <SelectItem value="LINKEDIN">LinkedIn Post</SelectItem>
                                <SelectItem value="POLL">Interactive Poll</SelectItem>
                                <SelectItem value="ARTICLE">Blog / SEO Article</SelectItem>
                                <SelectItem value="EMAIL">Email Marketing</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Platform selector — hidden for EMAIL type */}
                    {type !== "EMAIL" && (
                        <div className="grid gap-3">
                            <Label>Platform</Label>
                            <div className="flex flex-wrap gap-3">
                                {PLATFORMS.map((plat) => {
                                    const isChecked = selectedPlatforms.includes(plat);
                                    return (
                                        <div key={plat} className="flex items-center space-x-1.5 bg-background border px-2 py-1 rounded-md">
                                            <Checkbox
                                                id={`add-plat-${plat}`}
                                                checked={isChecked}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        setSelectedPlatforms(prev => [...prev, plat]);
                                                    } else {
                                                        setSelectedPlatforms(prev => prev.filter(p => p !== plat));
                                                    }
                                                }}
                                            />
                                            <label htmlFor={`add-plat-${plat}`} className="text-xs font-semibold cursor-pointer">
                                                {plat}
                                            </label>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

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
                                <Label>Blog / Article Title</Label>
                                <Input name="articleTitle" placeholder="SEO optimized title" required />
                            </div>
                            <div className="grid gap-2">
                                <Label>Article Content / Link</Label>
                                <textarea name="articleContent" className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="Summary or Google Doc link..." required />
                            </div>
                        </>
                    )}

                    {type === "EMAIL" && (
                        <>
                            <div className="grid gap-2">
                                <Label>Email Subject Line</Label>
                                <Input name="emailSubject" placeholder="e.g. Exclusive Offer Just for You 🎁" required />
                            </div>
                            <div className="grid gap-2">
                                <Label>Email Description</Label>
                                <textarea name="captionEn" className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="Brief description of the email campaign goal..." />
                            </div>
                            <div className="grid gap-2">
                                <Label>Email Body / Content</Label>
                                <textarea name="emailBody" className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="Main email content, key messages, call-to-action..." required />
                            </div>
                            <div className="grid gap-2">
                                <Label>Base Design / Template URL (Optional)</Label>
                                <Input name="emailDesign" placeholder="https://... (Figma, design file, or reference URL)" />
                            </div>
                        </>
                    )}

                    {/* AM Comment section */}
                    <div className="grid gap-2 mt-2 border-t pt-4 border-border/40">
                        <Label className="flex items-center gap-2 text-primary font-bold">
                            <MessageSquare className="h-4 w-4" />
                            Account Manager Notes (Optional)
                        </Label>
                        <Textarea
                            name="amComment"
                            className="h-20 bg-primary/5 border-primary/20 placeholder:text-primary/40 focus-visible:ring-primary/30"
                            placeholder="Add your comments or instructions here... The client can see this."
                        />
                    </div>

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
