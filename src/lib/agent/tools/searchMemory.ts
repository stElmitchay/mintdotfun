import { tool } from "ai";
import { z } from "zod";
import { searchMemories } from "../memory";
import type { AgentRow } from "@/lib/supabase";

// ============================================================
// Memory Search Tool — called by agent during chat
// ============================================================

const searchMemorySchema = z.object({
  query: z
    .string()
    .describe("What to search for in your memories"),
});

export function createSearchMemoryTool(agent: AgentRow) {
  return tool({
    description:
      "Search your memories for relevant past experiences, conversations, and knowledge. Use this to recall context about topics being discussed.",
    inputSchema: searchMemorySchema,
    execute: async (input) => {
      const results = await searchMemories({
        agentId: agent.id,
        query: input.query,
        limit: 5,
        threshold: 0.6,
      });

      return {
        memories: results.map((m) => ({
          content: m.content,
          type: m.type,
          relevance: m.similarity,
        })),
      };
    },
  });
}
