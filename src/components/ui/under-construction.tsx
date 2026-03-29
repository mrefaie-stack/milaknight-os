import { Hammer } from "lucide-react";

export function UnderConstruction({ title }: { title: string }) {
    return (
        <div className="flex flex-col items-center justify-center p-20 text-center bg-card rounded-xl border border-dashed border-border mt-10">
            <div className="h-16 w-16 bg-muted flex items-center justify-center rounded-full mb-6">
                <Hammer className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{title}</h2>
            <p className="text-muted-foreground max-w-sm">
                We are currently building this new tool for the SEO Suite. Please check back later!
            </p>
        </div>
    );
}
