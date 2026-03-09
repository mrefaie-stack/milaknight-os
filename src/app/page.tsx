import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const role = session.user.role;

  if (role === "ADMIN") {
    redirect("/admin");
  } else if (role === "AM") {
    redirect("/am");
  } else if (role === "MODERATOR") {
    redirect("/moderator");
  } else if (role === "CLIENT") {
    redirect("/client");
  }

  redirect("/login");
}
