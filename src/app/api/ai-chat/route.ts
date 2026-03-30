import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getToolsForRole, isToolAllowedForRole } from "@/lib/ai/tools";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import { executeTool } from "@/lib/ai/tool-executor";
import { genAI } from "@/lib/ai/gemini";
import { Content, Part } from "@google/generative-ai";

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
        content: typeof lastUserMessage.content === 'string' ? lastUserMessage.content : JSON.stringify(lastUserMessage.content),
      },
    });
  }

  // Build Gemini messages from conversation history
  // Anthropic array history often contained raw strings, but we map it to Gemini Parts.
  const geminiMessages: Content[] = messages
    .filter((m: any) => typeof m.content === "string" && m.content.trim() !== "")
    .map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const tools = getToolsForRole(userRole);
  const systemPrompt = buildSystemPrompt({
    name: userName,
    role: userRole,
    id: userId,
  });

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: { role: "system", parts: [{ text: systemPrompt }] },
    tools: tools.length > 0 ? [{ functionDeclarations: tools }] : undefined,
  });

  // Create a readable stream for SSE
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        let fullResponse = "";
        let allToolCalls: Array<{ name: string; input: unknown }> = [];

        // Process with tool use loop
        let currentMessages = [...geminiMessages];
        let continueLoop = true;

        while (continueLoop) {
          const resultStream = await model.generateContentStream({
            contents: currentMessages,
          });

          continueLoop = false;
          let chunkTextBuffer = "";
          let assistantParts: Part[] = [];
          let currentToolResultParts: Part[] = [];

          for await (const chunk of resultStream.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
              fullResponse += chunkText;
              chunkTextBuffer += chunkText;
              // Send text chunk
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "text", content: chunkText })}\n\n`
                )
              );
            }

            const calls = chunk.functionCalls();
            if (calls && calls.length > 0) {
              for (const call of calls) {
                const toolName = call.name;
                const toolInput = call.args as Record<string, unknown>;

                assistantParts.push({ functionCall: call });

                // Security check
                if (!isToolAllowedForRole(toolName, userRole)) {
                  currentToolResultParts.push({
                    functionResponse: {
                      name: toolName,
                      response: { error: `Tool ${toolName} is not available for your role` },
                    },
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
                let rawResult;
                try {
                    rawResult = await executeTool(toolName, toolInput, userRole, userId);
                } catch(e: any) {
                    rawResult = JSON.stringify({ error: e.message || String(e) });
                }

                allToolCalls.push({ name: toolName, input: toolInput });

                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: "tool_end",
                      tool: toolName,
                    })}\n\n`
                  )
                );

                let parsedResult = {};
                try {
                    parsedResult = JSON.parse(rawResult);
                } catch {
                    parsedResult = { result: rawResult };
                }

                currentToolResultParts.push({
                  functionResponse: {
                    name: toolName,
                    response: parsedResult,
                  },
                });
                continueLoop = true;
              }
            }
          }

          if (chunkTextBuffer) {
              assistantParts.push({ text: chunkTextBuffer });
          }

          if (continueLoop && currentToolResultParts.length > 0) {
             currentMessages.push({ role: "model", parts: assistantParts });
             currentMessages.push({ role: "user", parts: currentToolResultParts });
          }
        }

        // Save assistant response
        await prisma.aiMessage.create({
          data: {
            conversationId: convId,
            role: "assistant",
            content: fullResponse || "Action completed via tools.",
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
      } catch (error: any) {
        console.error("AI stream error:", error);
        // Sometimes the SDK throws unhandled errors from safety filters
        const message = error?.message || "Unknown error";
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
