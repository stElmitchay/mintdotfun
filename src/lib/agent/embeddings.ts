import { embed } from "ai";
import { google } from "@ai-sdk/google";

// ============================================================
// Text Embedding via Google text-embedding-004 (768 dims)
// ============================================================

/** Generate a 768-dim embedding, L2-normalized for pgvector cosine similarity. */
export async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: google.textEmbeddingModel("text-embedding-004"),
    value: text,
  });

  // L2 normalize
  const norm = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
  if (norm === 0) return embedding;
  return embedding.map((v) => v / norm);
}
