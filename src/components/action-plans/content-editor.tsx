"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Languages } from "lucide-react";

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
        scheduledDate: item.scheduledDate ? new Date(item.scheduledDate).toISOString().split('T')[0] : ''
    });

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
                            <SelectItem value="POLL">Interactive Poll</SelectItem>
                            <SelectItem value="ARTICLE">SEO Article</SelectItem>
                        </SelectContent>
                    </Select>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-2">
                {/* Basic Info */}
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Platform</Label>
                        <Input
                            value={data.platform || ''}
                            onChange={(e) => setData({ ...data, platform: e.target.value })}
                            placeholder="e.g. Facebook, Instagram"
                        />
                    </div>
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
                {item.type === 'ARTICLE' && (
                    <div className="space-y-4 border-l-2 border-primary/20 pl-4 py-2">
                        <div className="space-y-2">
                            <Label>Article Title</Label>
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

                {/* Dual Language Captions */}
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Languages className="h-3 w-3 text-orange-500" />
                            Arabic Caption
                        </Label>
                        <Textarea
                            dir="rtl"
                            className="h-32 text-right"
                            placeholder="اكتب المحتوى العربي هنا..."
                            value={data.captionAr || ''}
                            onChange={(e) => setData({ ...data, captionAr: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Languages className="h-3 w-3 text-blue-500" />
                            English Caption
                        </Label>
                        <Textarea
                            className="h-32"
                            placeholder="Write English caption here..."
                            value={data.captionEn || ''}
                            onChange={(e) => setData({ ...data, captionEn: e.target.value })}
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <Button onClick={() => onSave(data)} size="sm" className="font-bold">
                        <Save className="mr-2 h-4 w-4" /> Update Content
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
