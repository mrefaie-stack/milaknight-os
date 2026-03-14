import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const role = session.user.role?.toUpperCase();

  if (role === "ADMIN") {
    redirect("/admin");
  } else if (role === "MARKETING_MANAGER") {
    redirect("/admin");
  } else if (role === "AM" || role === "ACCOUNT_MANAGER") {
    redirect("/am");
  } else if (role === "CLIENT") {
    redirect("/client");
  } else if (role === "HR_MANAGER") {
    redirect("/hr-manager");
  } else if (role === "MODERATOR") {
    redirect("/moderator");
  } else if (role === "ART_TEAM") {
    redirect("/art-team");
  } else if (role === "ART_LEADER") {
    redirect("/art-leader");
  } else if (role === "CONTENT_TEAM") {
    redirect("/content-team");
  } else if (role === "CONTENT_LEADER") {
    redirect("/content-leader");
  } else if (role === "SEO_TEAM") {
    redirect("/seo-team");
  } else if (role === "SEO_LEAD") {
    redirect("/seo-lead");
  }

  // Fallback: unknown role → moderator (prevents redirect loops)
  redirect("/moderator");
}
