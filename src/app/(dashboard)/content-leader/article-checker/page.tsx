import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ArticleSeoChecker } from "@/components/seo/article-seo-checker";

export default async function Page() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "CONTENT_LEADER") redirect("/login");
    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            <ArticleSeoChecker />
        </div>
    );
}
