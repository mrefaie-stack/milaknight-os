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
  } else if (role === "AM" || role === "ACCOUNT_MANAGER") {
    redirect("/am");
  } else if (role === "MODERATOR") {
    redirect("/moderator");
  } else if (role === "CLIENT") {
    redirect("/client");
  } else if (role === "MARKETING_MANAGER") {
    redirect("/admin");
  }

  redirect("/login");
}
