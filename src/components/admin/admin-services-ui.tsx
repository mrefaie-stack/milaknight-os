"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Plus, Edit3, Trash2, Zap, LayoutGrid, Type, AlignLeft } from "lucide-react";
import { toast } from "sonner";
import { createGlobalService, updateGlobalService, deleteGlobalService } from "@/app/actions/global-service";

export function AdminServicesUI({ services }: { services: any[] }) {
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingService, setEditingService] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        try {
            await createGlobalService(formData);
            toast.success("Service created successfully");
            setIsAddOpen(false);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const data = {
            nameAr: formData.get("nameAr"),
            nameEn: formData.get("nameEn"),
            descriptionAr: formData.get("descriptionAr"),
            descriptionEn: formData.get("descriptionEn"),
            icon: formData.get("icon") || "Zap",
        };
        try {
            await updateGlobalService(editingService.id, data);
            toast.success("Service updated successfully");
            setEditingService(null);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure? This will remove the service from all clients.")) return;
        try {
            await deleteGlobalService(id);
            toast.success("Service deleted");
        } catch (error: any) {
            toast.error(error.message);
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-card/30 p-8 rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl">
                <div>
                    <h1 className="text-4xl font-black tracking-tight">Global Services</h1>
                    <p className="text-muted-foreground font-medium mt-1 text-lg">Manage the catalog of services you offer to clients.</p>
                </div>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="h-12 px-6 rounded-full font-bold shadow-lg shadow-primary/20">
                            <Plus className="mr-2 h-4 w-4" /> Add New Service
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl bg-card/95 backdrop-blur-xl border-white/10">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black">Create Global Service</DialogTitle>
                            <DialogDescription className="font-medium">Define a new service for the catalog.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAdd} className="space-y-6 mt-4">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-xs font-black uppercase text-muted-foreground"><Type className="h-3 w-3" /> Name (Arabic)</Label>
                                    <Input name="nameAr" required className="bg-background/50 border-white/5 h-11" placeholder="مثلاً: إدارة السوشيال ميديا" dir="rtl" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-xs font-black uppercase text-muted-foreground"><Type className="h-3 w-3" /> Name (English)</Label>
                                    <Input name="nameEn" required className="bg-background/50 border-white/5 h-11" placeholder="e.g. Social Media Management" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-xs font-black uppercase text-muted-foreground"><AlignLeft className="h-3 w-3" /> Description (Arabic)</Label>
                                <textarea name="descriptionAr" className="flex min-h-[100px] w-full rounded-xl border border-white/5 bg-background/50 px-4 py-3 text-sm font-medium shadow-inner outline-none focus:ring-1 focus:ring-primary transition-all" dir="rtl" />
                            </div>

                            <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-xs font-black uppercase text-muted-foreground"><AlignLeft className="h-3 w-3" /> Description (English)</Label>
                                <textarea name="descriptionEn" className="flex min-h-[100px] w-full rounded-xl border border-white/5 bg-background/50 px-4 py-3 text-sm font-medium shadow-inner outline-none focus:ring-1 focus:ring-primary transition-all" />
                            </div>

                            <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-xs font-black uppercase text-muted-foreground"><Zap className="h-3 w-3" /> Icon Identifier (Lucide)</Label>
                                <Input name="icon" defaultValue="Zap" className="bg-background/50 border-white/5 h-11" />
                            </div>

                            <DialogFooter>
                                <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl font-bold">
                                    {loading ? "Creating..." : "Save Service"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((service) => (
                    <Card key={service.id} className="group overflow-hidden border-white/5 bg-card/50 backdrop-blur-md hover:bg-card/80 transition-all duration-300">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="p-3 bg-primary/10 rounded-2xl text-primary group-hover:scale-110 transition-transform">
                                <LayoutGrid className="h-6 w-6" />
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" onClick={() => setEditingService(service)}>
                                    <Edit3 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 text-destructive" onClick={() => handleDelete(service.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <CardTitle className="text-xl font-black">{service.nameEn}</CardTitle>
                            <CardTitle className="text-lg font-bold text-muted-foreground" dir="rtl">{service.nameAr}</CardTitle>
                            <CardDescription className="line-clamp-3 mt-4 text-sm font-medium italic">
                                {service.descriptionEn}
                            </CardDescription>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Edit Dialog */}
            <Dialog open={!!editingService} onOpenChange={(open) => !open && setEditingService(null)}>
                <DialogContent className="max-w-2xl bg-card/95 backdrop-blur-xl border-white/10">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black">Edit Global Service</DialogTitle>
                    </DialogHeader>
                    {editingService && (
                        <form onSubmit={handleUpdate} className="space-y-6 mt-4">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-xs font-black uppercase text-muted-foreground">Name (Arabic)</Label>
                                    <Input name="nameAr" defaultValue={editingService.nameAr} required className="bg-background/50 border-white/5 h-11" dir="rtl" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-xs font-black uppercase text-muted-foreground">Name (English)</Label>
                                    <Input name="nameEn" defaultValue={editingService.nameEn} required className="bg-background/50 border-white/5 h-11" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-xs font-black uppercase text-muted-foreground">Description (Arabic)</Label>
                                <textarea name="descriptionAr" defaultValue={editingService.descriptionAr} className="flex min-h-[100px] w-full rounded-xl border border-white/5 bg-background/50 px-4 py-3 text-sm font-medium shadow-inner outline-none focus:ring-1 focus:ring-primary transition-all" dir="rtl" />
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-xs font-black uppercase text-muted-foreground">Description (English)</Label>
                                <textarea name="descriptionEn" defaultValue={editingService.descriptionEn} className="flex min-h-[100px] w-full rounded-xl border border-white/5 bg-background/50 px-4 py-3 text-sm font-medium shadow-inner outline-none focus:ring-1 focus:ring-primary transition-all" />
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-xs font-black uppercase text-muted-foreground">Icon</Label>
                                <Input name="icon" defaultValue={editingService.icon} className="bg-background/50 border-white/5 h-11" />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl font-bold">
                                    {loading ? "Optimizing..." : "Update Service"}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
