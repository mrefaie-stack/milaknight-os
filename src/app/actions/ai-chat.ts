"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getConversations() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  return prisma.aiConversation.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    take: 20,
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getConversationMessages(conversationId: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  // Verify ownership
  const conversation = await prisma.aiConversation.findUnique({
    where: { id: conversationId },
  });
  if (!conversation || conversation.userId !== session.user.id) {
    throw new Error("Unauthorized");
  }

  return prisma.aiMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      role: true,
      content: true,
      toolCalls: true,
      createdAt: true,
    },
  });
}

export async function deleteConversation(conversationId: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  const conversation = await prisma.aiConversation.findUnique({
    where: { id: conversationId },
  });
  if (!conversation || conversation.userId !== session.user.id) {
    throw new Error("Unauthorized");
  }

  await prisma.aiConversation.delete({
    where: { id: conversationId },
  });

  return { success: true };
}
