import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { KeywordExplorer } from "@/components/seo/keyword-explorer";

export const metadata = {
    title: "Keyword Explorer | Milaknight OS",
};

export default async function KeywordExplorerPage() {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== "SEO_LEAD" && session.user.role !== "ADMIN")) {
        redirect("/login");
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            <KeywordExplorer />
        </div>
    );
}
