"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Languages, MessageSquare } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const PLATFORMS = [
    "Facebook", "Instagram", "TikTok", "Snapchat", "LinkedIn", "YouTube", "Twitter"
];

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export function ContentItemEditor({ item, onSave }: { item: any, onSave: (data: any) => void }) {
    const [data, setData] = useState({
        ...item,
        scheduledDate: item.scheduledDate ? new Date(item.scheduledDate).toISOString().split('T')[0] : '',
        platformCaptions: item.platformCaptions || '{}'
    });

    const platformCaptionsObj = (() => {
        try {
            return JSON.parse(data.platformCaptions);
        } catch {
            return {};
        }
    })();

    function updatePlatformCaption(plat: string, text: string) {
        const next = { ...platformCaptionsObj, [plat]: text };
        setData({ ...data, platformCaptions: JSON.stringify(next) });
    }

    return (
        <Card className="border-none bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 w-full">
                    <Select value={data.type} onValueChange={(val) => setData({ ...data, type: val })}>
                        <SelectTrigger className="w-[200px] h-8 text-[10px] font-black uppercase tracking-widest bg-transparent">
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
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-2">
                {/* Basic Info */}
                <div className="grid gap-4 md:grid-cols-2">
                    {data.type !== 'EMAIL' && (
                        <div className="space-y-3">
                            <Label>Platforms</Label>
                            <div className="flex flex-wrap gap-3 pt-1">
                                {PLATFORMS.map((plat) => {
                                    const selected = data.platform ? data.platform.split(/[,/]/).map((s: string) => s.trim()) : [];
                                    const isChecked = selected.includes(plat);
                                    return (
                                        <div key={plat} className="flex items-center space-x-1.5 bg-background border px-2 py-1 rounded-md">
                                            <Checkbox
                                                id={`plat-${plat}`}
                                                checked={isChecked}
                                                onCheckedChange={(checked) => {
                                                    const newPlatforms = checked
                                                        ? [...selected, plat]
                                                        : selected.filter((p: string) => p !== plat);

                                                    const newData: any = { ...data, platform: newPlatforms.join(', ') };

                                                    // If unchecked, optionally remove the specific caption
                                                    if (!checked) {
                                                        const nextCaps = { ...platformCaptionsObj };
                                                        delete nextCaps[plat];
                                                        newData.platformCaptions = JSON.stringify(nextCaps);
                                                    }

                                                    setData(newData);
                                                }}
                                            />
                                            <label htmlFor={`plat-${plat}`} className="text-xs font-semibold cursor-pointer">
                                                {plat}
                                            </label>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label>Scheduled Date</Label>
                        <Input
                            type="date"
                            value={data.scheduledDate || ''}
                            onChange={(e) => setData({ ...data, scheduledDate: e.target.value })}
                        />
                    </div>
                </div>

                {/* Media Link */}
                {(item.type === 'POST' || item.type === 'VIDEO') && (
                    <div className="space-y-2">
                        <Label>{item.type === 'POST' ? 'Image URL' : 'Video URL'}</Label>
                        <Input
                            value={item.type === 'POST' ? (data.imageUrl || '') : (data.videoUrl || '')}
                            onChange={(e) => setData({
                                ...data,
                                [item.type === 'POST' ? 'imageUrl' : 'videoUrl']: e.target.value
                            })}
                            placeholder="https://..."
                        />
                    </div>
                )}

                {/* Poll Specifics */}
                {item.type === 'POLL' && (
                    <div className="space-y-4 border-l-2 border-orange-200 pl-4 py-2">
                        <div className="space-y-2">
                            <Label>Question</Label>
                            <Input
                                value={data.pollQuestion || ''}
                                onChange={(e) => setData({ ...data, pollQuestion: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Option A</Label>
                                <Input
                                    value={data.pollOptionA || ''}
                                    onChange={(e) => setData({ ...data, pollOptionA: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Option B</Label>
                                <Input
                                    value={data.pollOptionB || ''}
                                    onChange={(e) => setData({ ...data, pollOptionB: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Article Specifics */}
                {data.type === 'ARTICLE' && (
                    <div className="space-y-4 border-l-2 border-primary/20 pl-4 py-2">
                        <div className="space-y-2">
                            <Label>Blog / Article Title</Label>
                            <Input
                                value={data.articleTitle || ''}
                                onChange={(e) => setData({ ...data, articleTitle: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Content Summary / Link</Label>
                            <Textarea
                                className="h-32"
                                value={data.articleContent || ''}
                                onChange={(e) => setData({ ...data, articleContent: e.target.value })}
                            />
                        </div>
                    </div>
                )}

                {/* Email Specifics */}
                {data.type === 'EMAIL' && (
                    <div className="space-y-4 border-l-2 border-rose-200 pl-4 py-2">
                        <div className="space-y-2">
                            <Label>Email Subject Line</Label>
                            <Input
                                value={data.emailSubject || ''}
                                onChange={(e) => setData({ ...data, emailSubject: e.target.value })}
                                placeholder="e.g. Exclusive Offer Just for You 🎁"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Email Body / Content</Label>
                            <Textarea
                                className="h-48"
                                value={data.emailBody || ''}
                                onChange={(e) => setData({ ...data, emailBody: e.target.value })}
                                placeholder="Main email content..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Base Design / Template URL</Label>
                            <Input
                                value={data.emailDesign || ''}
                                onChange={(e) => setData({ ...data, emailDesign: e.target.value })}
                                placeholder="https://..."
                            />
                        </div>
                    </div>
                )}

                {/* Per-Platform Captions */}
                {data.type !== 'EMAIL' && data.type !== 'ARTICLE' && data.type !== 'POLL' && (
                    <div className="grid gap-4 p-4 rounded-2xl border border-primary/10 bg-primary/5">
                        <Label className="text-primary font-black text-xs uppercase tracking-wider flex items-center gap-2">
                            <Languages className="h-3.5 w-3.5" />
                            Per-Platform Captions
                        </Label>
                        <div className="grid gap-4 md:grid-cols-2">
                            {data.platform?.split(/[,/]/).map((p: string) => p.trim()).filter(Boolean).map((plat: string) => (
                                <div key={plat} className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground">{plat}</Label>
                                    <Textarea
                                        className="h-24 text-sm bg-background/50"
                                        placeholder={`Write caption for ${plat}...`}
                                        value={platformCaptionsObj[plat] || ""}
                                        onChange={(e) => updatePlatformCaption(plat, e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>
                        {(!data.platform || data.platform.length === 0) && (
                            <p className="text-[10px] text-muted-foreground italic">Select platforms to add specific captions.</p>
                        )}
                    </div>
                )}

                {/* Dual Language Captions (Fallback/General) */}
                <div className="grid gap-4 md:grid-cols-2 opacity-60">
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-[10px] font-black uppercase">
                            <Languages className="h-3 w-3 text-orange-500" />
                            General Arabic Caption (Fallback)
                        </Label>
                        <Textarea
                            dir="rtl"
                            className="h-24 text-right text-xs bg-background/50"
                            placeholder="اكتب المحتوى العربي هنا..."
                            value={data.captionAr || ''}
                            onChange={(e) => setData({ ...data, captionAr: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-[10px] font-black uppercase">
                            <Languages className="h-3 w-3 text-blue-500" />
                            {data.type === 'EMAIL' ? 'Campaign Description / Goal' : 'General English Caption (Fallback)'}
                        </Label>
                        <Textarea
                            className="h-24 text-xs bg-background/50"
                            placeholder={data.type === 'EMAIL' ? "Campaign goal..." : "Write English caption here..."}
                            value={data.captionEn || ''}
                            onChange={(e) => setData({ ...data, captionEn: e.target.value })}
                        />
                    </div>
                </div>

                {/* AM Comment section */}
                <div className="space-y-2 mt-2 border-t pt-4 border-border/40">
                    <Label className="flex items-center gap-2 text-primary font-bold">
                        <MessageSquare className="h-4 w-4" />
                        Account Manager Notes
                    </Label>
                    <Textarea
                        className="h-24 bg-primary/5 border-primary/20 placeholder:text-primary/40 focus-visible:ring-primary/30"
                        placeholder="Add your comments or instructions here. The client will be able to see this..."
                        value={data.amComment || ''}
                        onChange={(e) => setData({ ...data, amComment: e.target.value })}
                    />
                </div>

                <div className="flex justify-end pt-2">
                    <Button onClick={() => onSave(data)} size="sm" className="font-bold">
                        <Save className="mr-2 h-4 w-4" /> Update Content
                    </Button>
                </div>
            </CardContent>
        </Card >
    );
}
