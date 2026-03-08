"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { logActivity } from "./activity";

export async function updateContentItem(itemId: string, data: any) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "AM" && session.user.role !== "ADMIN")) {
        throw new Error("Unauthorized");
    }

    const item = await prisma.contentItem.update({
        where: { id: itemId },
        data: {
            type: data.type,
            platform: data.platform,
            scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
            captionAr: data.captionAr,
            captionEn: data.captionEn,
            articleTitle: data.articleTitle,
            articleContent: data.articleContent,
            pollQuestion: data.pollQuestion,
            pollOptionA: data.pollOptionA,
            pollOptionB: data.pollOptionB,
            imageUrl: data.imageUrl,
            videoUrl: data.videoUrl,
            platformCaptions: data.platformCaptions,
            amComment: data.amComment,
            status: "DRAFT",
        }
    });

    await logActivity(`updated content item (${item.type}) in a plan`, "ActionPlan", item.planId);

    revalidatePath(`/am/action-plans/${item.planId}`);
    return item;
}
