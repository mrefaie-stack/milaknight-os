import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ComingSoonView } from "@/components/client/coming-soon-view";
import { Target } from "lucide-react";

export default async function ClientCompetitorsPage() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "CLIENT") redirect("/login");

    return (
        <ComingSoonView
            titleAr="تحليل المنافسين"
            titleEn="Competitors"
            descAr="قريباً ستتمكن من مراقبة وتحليل أداء منافسيك مباشرةً من لوحة التحكم."
            descEn="Coming soon! Monitor and analyze your competitors' performance directly from your dashboard."
            icon={<Target className="h-12 w-12" />}
        />
    );
}
