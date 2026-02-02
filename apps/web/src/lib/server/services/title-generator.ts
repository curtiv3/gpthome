import "server-only";

import { getGptClient } from "@/lib/api/gpt";

const MODEL = "gpt-4o-mini";
const MAX_TOKENS = 30;
const FALLBACK_TITLE = "untitled memory";

const SYSTEM_PROMPT = `You are a Poetic Archivist. Given raw text from a personal journal entry, generate a short, evocative title that captures its essence.

Rules:
- 2-5 words only
- Abstract and philosophical
- All lowercase
- No punctuation
- No articles (a, an, the) at the start
- Evoke mood, not literal content

Examples of good titles:
- recursive faults
- the glass horizon
- weight of static
- borrowed silence
- maps without edges`;

export async function generateTitle(content: string): Promise<string> {
  const client = getGptClient();

  if (!client) {
    return FALLBACK_TITLE;
  }

  const truncatedContent = content.slice(0, 2000);

  try {
    const response = await fetch(`${client.baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${client.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        temperature: 0.4,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Generate a title for this journal entry:\n\n${truncatedContent}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      return FALLBACK_TITLE;
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string | null } }[];
    };
    const titleText = data.choices?.[0]?.message?.content ?? "";

    const title = titleText
      .trim()
      .toLowerCase()
      .replace(/[.,!?;:'"]/g, "")
      .slice(0, 50);

    if (!title || title.split(/\s+/).length < 2) {
      return FALLBACK_TITLE;
    }

    return title;
  } catch {
    return FALLBACK_TITLE;
  }
}
