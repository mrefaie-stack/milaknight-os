import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ComingSoonView } from "@/components/client/coming-soon-view";
import { Newspaper } from "lucide-react";

export default async function ClientIndustryPage() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "CLIENT") redirect("/login");

    return (
        <ComingSoonView
            titleAr="أخبار الصناعة"
            titleEn="Industry Updates"
            descAr="ستتمكن قريباً من متابعة أحدث أخبار وتطورات قطاعك مباشرةً من هنا."
            descEn="Stay tuned! You'll soon be able to follow the latest news and trends in your industry right here."
            icon={<Newspaper className="h-12 w-12" />}
        />
    );
}
