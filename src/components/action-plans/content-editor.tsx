"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Languages } from "lucide-react";

export function ContentItemEditor({ item, onSave }: { item: any, onSave: (data: any) => void }) {
    const [data, setData] = useState(item);

    return (
        <Card className="border-none bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <p>{item.type === 'POST' ? 'Social Post' : item.type === 'VIDEO' ? 'Reels / Video' : 'Poll'}</p>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
                {/* Dual Language Captions - Premium Feature */}
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
                    <Button onClick={() => onSave(data)} size="sm">
                        <Save className="mr-2 h-4 w-4" /> Update Content
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
