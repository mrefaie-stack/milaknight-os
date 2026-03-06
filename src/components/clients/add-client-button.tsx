"use client";

import { useState } from "react";
import { createClient, getAccountManagers } from "@/app/actions/client";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";
import { toast } from "sonner";

const PLATFORMS = [
    "Facebook", "Instagram", "TikTok", "Snapchat", "LinkedIn", "Google Ads", "YouTube", "SEO", "Email Marketing"
];

const PACKAGES = ["BASIC", "PREMIUM", "ENTERPRISE", "CUSTOM"];

export function AddClientButton({ ams }: { ams: any[] }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        formData.append("activeServices", selectedPlatforms.join(","));

        try {
            await createClient(formData);
            toast.success("Client added successfully!");
            setOpen(false);
        } catch (error: any) {
            toast.error(error.message || "Failed to add client");
        } finally {
            setLoading(false);
        }
    }

    const togglePlatform = (id: string) => {
        setSelectedPlatforms(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="font-bold">
                    <Plus className="mr-2 h-4 w-4" /> Add New Client
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Create Client Profile</DialogTitle>
                        <DialogDescription>
                            Set up a new client account, choose their package, and assign an AM.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Business Name</Label>
                                <Input id="name" name="name" placeholder="MilaKnight Agency" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="industry">Industry</Label>
                                <Input id="industry" name="industry" placeholder="E-commerce" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Client Login Email</Label>
                                <Input id="email" name="email" type="email" placeholder="client@company.com" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Login Password</Label>
                                <Input id="password" name="password" type="password" required />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="amId">Assign Account Manager</Label>
                                <Select name="amId">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select AM..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ams.map((am) => (
                                            <SelectItem key={am.id} value={am.id}>
                                                {am.firstName} {am.lastName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="package">Client Package</Label>
                                <Select name="package" defaultValue="BASIC">
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PACKAGES.map((pkg) => (
                                            <SelectItem key={pkg} value={pkg}>{pkg}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Active Platforms (Determines Report Structure)</Label>
                            <div className="grid grid-cols-3 gap-3 pt-1">
                                {PLATFORMS.map((platform) => (
                                    <div key={platform} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={platform}
                                            checked={selectedPlatforms.includes(platform)}
                                            onCheckedChange={() => togglePlatform(platform)}
                                        />
                                        <label htmlFor={platform} className="text-sm font-medium leading-none cursor-pointer">
                                            {platform}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? "Initializing..." : "Register Client & Create Workspace"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
