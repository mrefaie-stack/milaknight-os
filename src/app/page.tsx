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
  } else if (
    role === "MODERATOR" ||
    role === "CONTENT_TEAM" ||
    role === "CONTENT_LEADER" ||
    role === "ART_TEAM" ||
    role === "ART_LEADER" ||
    role === "SEO_TEAM" ||
    role === "SEO_LEAD"
  ) {
    redirect("/moderator");
  }

  // Fallback: any unknown role goes to moderator view (not login, to avoid redirect loops)
  redirect("/moderator");
}
