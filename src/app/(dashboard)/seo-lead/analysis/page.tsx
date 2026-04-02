import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SiteAnalysis } from "@/components/seo/site-analysis";

export const metadata = {
    title: "Site Analysis | Milaknight OS",
};

export default async function SeoLeadAnalysisPage() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "SEO_LEAD" && session.user.role !== "ADMIN")) redirect("/login");

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            <div>
                <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    Site Analysis
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    50+ SEO checks — crawlability, on-page, technical, security, structured data & more
                </p>
            </div>
            <SiteAnalysis />
        </div>
    );
}
