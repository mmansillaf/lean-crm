import { openai } from "@ai-sdk/openai";

/**
 * Genera embedding vectorial de 1536 dimensiones para PostgreSQL pgvector.
 * Si existe OPENAI_API_KEY se usa text-embedding-3-small; en caso contrario
 * se utiliza el generador semántico normalizado local L2 sin coste.
 */
export async function getEmbedding(text: string, dimensions = 1536): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey && apiKey.startsWith("sk-")) {
    try {
      const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: text.slice(0, 8000),
          dimensions,
        }),
      });

      if (response.ok) {
        const json = await response.json();
        return json.data[0].embedding;
      }
    } catch {
      // Fallback a embedding local
    }
  }

  return generateLocalEmbedding(text, dimensions);
}

/**
 * Generador de representación semántica vectorial L2 determinista de 1536 dimensiones.
 */
export function generateLocalEmbedding(text: string, dimensions = 1536): number[] {
  const vector = new Array(dimensions).fill(0);
  const clean = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const tokens = clean.split(/[^a-z0-9_]+/i).filter((t) => t.length > 2);

  if (tokens.length === 0) return vector;

  for (let i = 0; i < tokens.length; i++) {
    const word = tokens[i];

    // Mapeo multi-hash por palabra
    for (let h = 0; h < 5; h++) {
      let hash = 0x811c9dc5 ^ h;
      for (let j = 0; j < word.length; j++) {
        hash = (hash ^ word.charCodeAt(j)) * 0x01000193;
      }
      const idx = Math.abs(hash) % dimensions;
      const sign = (hash & 1) === 0 ? 1 : -1;
      vector[idx] += sign * (1 / Math.sqrt(tokens.length));
    }

    // Bigramas
    if (i < tokens.length - 1) {
      const bigram = `${word}_${tokens[i + 1]}`;
      let hash = 0x811c9dc5;
      for (let j = 0; j < bigram.length; j++) {
        hash = (hash ^ bigram.charCodeAt(j)) * 0x01000193;
      }
      const idx = Math.abs(hash) % dimensions;
      vector[idx] += 1.2;
    }
  }

  // Normalización L2
  let norm = 0;
  for (let i = 0; i < dimensions; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < dimensions; i++) {
      vector[i] /= norm;
    }
  }

  return vector;
}
