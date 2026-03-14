import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ComingSoonView } from "@/components/client/coming-soon-view";
import { TrendingUp } from "lucide-react";

export default async function ClientTrendingPage() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "CLIENT") redirect("/login");

    return (
        <ComingSoonView
            titleAr="المواضيع الرائجة"
            titleEn="Trending Topics"
            descAr="اكتشف قريباً المواضيع والكلمات المفتاحية الأكثر رواجاً في مجالك."
            descEn="Coming soon! Discover the hottest topics and keywords trending in your niche."
            icon={<TrendingUp className="h-12 w-12" />}
        />
    );
}
