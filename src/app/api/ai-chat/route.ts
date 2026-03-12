import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { getToolsForRole, isToolAllowedForRole } from "@/lib/ai/tools";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import { executeTool } from "@/lib/ai/tool-executor";

const anthropic = new Anthropic();

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
        content: lastUserMessage.content,
      },
    });
  }

  // Build Claude messages from conversation history
  const claudeMessages: Anthropic.MessageParam[] = messages.map(
    (m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })
  );

  const tools = getToolsForRole(userRole);
  const systemPrompt = buildSystemPrompt({
    name: userName,
    role: userRole,
    id: userId,
  });

  // Create a readable stream for SSE
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        let fullResponse = "";
        let allToolCalls: Array<{ name: string; input: unknown }> = [];

        // Process with tool use loop
        let currentMessages = [...claudeMessages];
        let continueLoop = true;

        while (continueLoop) {
          const response = await anthropic.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 4096,
            system: systemPrompt,
            messages: currentMessages,
            tools: tools.length > 0 ? tools : undefined,
          });

          // Add assistant message to history immediately
          currentMessages.push({
            role: "assistant",
            content: response.content,
          });

          const toolResultBlocks: Anthropic.ToolResultBlockParam[] = [];
          continueLoop = false;

          for (const block of response.content) {
            if (block.type === "text") {
              fullResponse += block.text;
              // Send text chunk
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "text", content: block.text })}\n\n`
                )
              );
            } else if (block.type === "tool_use") {
              const toolName = block.name;
              const toolInput = block.input as Record<string, unknown>;

              // Security check
              if (!isToolAllowedForRole(toolName, userRole)) {
                toolResultBlocks.push({
                  type: "tool_result",
                  tool_use_id: block.id,
                  content: JSON.stringify({
                    error: `Tool ${toolName} is not available for your role`,
                  }),
                  is_error: true,
                });
                continueLoop = true;
                continue;
              }

              // Notify client about tool execution
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "tool_start",
                    tool: toolName,
                    input: toolInput,
                  })}\n\n`
                )
              );

              // Execute tool
              const result = await executeTool(
                toolName,
                toolInput,
                userRole,
                userId
              );

              allToolCalls.push({ name: toolName, input: toolInput });

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "tool_end",
                    tool: toolName,
                  })}\n\n`
                )
              );

              toolResultBlocks.push({
                type: "tool_result",
                tool_use_id: block.id,
                content: result,
              });
              continueLoop = true;
            }
          }

          if (toolResultBlocks.length > 0) {
            currentMessages.push({
              role: "user",
              content: toolResultBlocks,
            });
          }

          // Check stop reason
          if (response.stop_reason === "end_turn") {
            continueLoop = false;
          }
        }

        // Save assistant response
        await prisma.aiMessage.create({
          data: {
            conversationId: convId,
            role: "assistant",
            content: fullResponse,
            toolCalls:
              allToolCalls.length > 0
                ? JSON.stringify(allToolCalls)
                : null,
          },
        });

        // Send conversation ID and done signal
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "done", conversationId: convId })}\n\n`
          )
        );
        controller.close();
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", content: message })}\n\n`
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
