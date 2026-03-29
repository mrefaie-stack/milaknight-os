import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdvancedSEOAnalysis } from "@/components/seo/advanced-seo-analysis";

export default async function SeoTeamAnalysisPage() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SEO_TEAM") redirect("/login");
    
    return (
        <div className="container max-w-6xl mx-auto py-8 px-4">
            <AdvancedSEOAnalysis />
        </div>
    );
}
