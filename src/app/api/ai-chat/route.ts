import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClaudeToolsForRole, isToolAllowedForRole } from "@/lib/ai/tools";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import { executeTool } from "@/lib/ai/tool-executor";
import { anthropic, CLAUDE_SONNET } from "@/lib/ai/claude";
import type Anthropic from "@anthropic-ai/sdk";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages, conversationId } = await req.json();
  const userRole = session.user.role;
  const userId = session.user.id;
  const userName = session.user.name || "User";

  // Get or create conversation
  let convId = conversationId;
  if (!convId) {
    const conversation = await prisma.aiConversation.create({
      data: {
        userId,
        title: messages[0]?.content?.slice(0, 100) || "New conversation",
      },
    });
    convId = conversation.id;
  }

  // Save user message
  const lastUserMessage = messages[messages.length - 1];
  if (lastUserMessage?.role === "user") {
    await prisma.aiMessage.create({
      data: {
        conversationId: convId,
        role: "user",
        content:
          typeof lastUserMessage.content === "string"
            ? lastUserMessage.content
            : JSON.stringify(lastUserMessage.content),
      },
    });
  }

  // Convert to Claude message format
  const claudeMessages: Anthropic.MessageParam[] = messages
    .filter((m: any) => typeof m.content === "string" && m.content.trim() !== "")
    .map((m: any) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content as string,
    }));

  const tools = getClaudeToolsForRole(userRole);
  const systemPrompt = buildSystemPrompt({ name: userName, role: userRole, id: userId });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let fullResponse = "";
        let allToolCalls: Array<{ name: string; input: unknown }> = [];
        let currentMessages: Anthropic.MessageParam[] = [...claudeMessages];
        let continueLoop = true;

        while (continueLoop) {
          const response = await anthropic.messages.create({
            model: CLAUDE_SONNET,
            max_tokens: 8192,
            system: systemPrompt,
            messages: currentMessages,
            tools: tools.length > 0 ? tools : undefined,
          });

          continueLoop = false;

          const assistantContent: Anthropic.ContentBlock[] = response.content;
          const toolResults: Anthropic.ToolResultBlockParam[] = [];

          for (const block of assistantContent) {
            if (block.type === "text") {
              // Stream text in small chunks for real-time feel
              const text = block.text;
              fullResponse += text;

              // Split into ~40-char chunks
              const chunkSize = 40;
              for (let i = 0; i < text.length; i += chunkSize) {
                const chunk = text.slice(i, i + chunkSize);
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: "text", content: chunk })}\n\n`
                  )
                );
              }
            } else if (block.type === "tool_use") {
              const toolName = block.name;
              const toolInput = block.input as Record<string, unknown>;

              // Security check
              if (!isToolAllowedForRole(toolName, userRole)) {
                toolResults.push({
                  type: "tool_result",
                  tool_use_id: block.id,
                  content: JSON.stringify({ error: `Tool ${toolName} is not available for your role` }),
                });
                continueLoop = true;
                continue;
              }

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "tool_start", tool: toolName, input: toolInput })}\n\n`
                )
              );

              let rawResult: string;
              try {
                rawResult = await executeTool(toolName, toolInput, userRole, userId);
              } catch (e: any) {
                rawResult = JSON.stringify({ error: e.message || String(e) });
              }

              allToolCalls.push({ name: toolName, input: toolInput });

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "tool_end", tool: toolName })}\n\n`
                )
              );

              toolResults.push({
                type: "tool_result",
                tool_use_id: block.id,
                content: rawResult,
              });
              continueLoop = true;
            }
          }

          if (continueLoop && toolResults.length > 0) {
            currentMessages.push({ role: "assistant", content: assistantContent });
            currentMessages.push({ role: "user", content: toolResults });
          }
        }

        // Save assistant response
        await prisma.aiMessage.create({
          data: {
            conversationId: convId,
            role: "assistant",
            content: fullResponse || "Action completed via tools.",
            toolCalls: allToolCalls.length > 0 ? JSON.stringify(allToolCalls) : null,
          },
        });

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "done", conversationId: convId })}\n\n`
          )
        );
        controller.close();
      } catch (error: any) {
        console.error("AI stream error:", error);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", content: error?.message || "Unknown error" })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
