import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY || "";

export const anthropic = new Anthropic({ apiKey });

// For SEO tools and simple generation tasks (fast + cheap)
export const CLAUDE_HAIKU = "claude-haiku-4-5-20251001";

// For AI chat with tool use (most capable)
export const CLAUDE_SONNET = "claude-sonnet-4-6";

/**
 * Simple text generation helper for SEO tools.
 * Uses max output tokens allowed by the model — no artificial limit.
 */
export async function claudeGenerate(prompt: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: CLAUDE_HAIKU,
    max_tokens: 8096,
    messages: [{ role: "user", content: prompt }],
  });

  const block = response.content[0];
  return block.type === "text" ? block.text : "";
}
