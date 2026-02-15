/**
 * Phase 6: AI Enhancement Layer (Optional)
 * Uses Ollama to rephrase and optimize prompts.
 * Always falls back to hard-coded version if AI is unavailable or fails.
 */

import type { Model } from '../../types';
import { TOKEN_LIMITS } from './types';
import { estimateTokens } from './tokenBudget';

const AI_TIMEOUT_MS = 5000;
const OLLAMA_BASE_URL = 'http://localhost:11434';

/** System prompts per model type */
const SYSTEM_PROMPTS: Record<string, string> = {
  'FLUX': `You are a prompt optimization expert for FLUX image generation.
Rewrite the following character description as a single flowing paragraph. Rules:
- Keep ALL physical descriptors (muscle, age, skin, etc.)
- Keep ALL equipment mentions
- Improve sentence flow and readability
- Do NOT add new concepts not present in the input
- Do NOT remove any stat-derived keywords
- Keep total under 200 words
- Do NOT use markdown formatting
- Output ONLY the rewritten prompt, nothing else`,

  'TAG': `You are a Danbooru tag optimization expert. Given the following
comma-separated tags, optimize them:
- Remove redundant tags that overlap in meaning
- Replace multi-word tags with equivalent single-word tags
- Ensure the most important visual concepts are first
- Do NOT add new tags not implied by the input
- Output ONLY the optimized tag list, nothing else`,

  'SDXL': `You are an SDXL prompt optimization expert. Given the following
weighted prompt, optimize the weights:
- Critical character features: weight 1.08-1.12
- Supporting details: weight 1.0 (no parentheses)
- Remove weights below 1.05 (not worth the token cost)
- Never set any weight above 1.15
- Output ONLY the optimized prompt, nothing else`,
};

/**
 * Check if Ollama is available at the expected endpoint.
 */
async function isOllamaAvailable(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Send a prompt to Ollama for enhancement.
 */
async function queryOllama(
  prompt: string,
  systemPrompt: string,
  ollamaModel: string = 'llama3.2'
): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: ollamaModel,
        prompt,
        system: systemPrompt,
        stream: false,
        options: {
          temperature: 0.3,
          num_predict: 256,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = await response.json();
    return data.response?.trim() || null;
  } catch {
    return null;
  }
}

/**
 * Validate AI output against original prompt.
 * Ensures the AI hasn't hallucinated or lost critical keywords.
 */
function validateAIOutput(
  aiOutput: string,
  originalPrompt: string,
  model: Model,
  statKeywords: string[]
): { valid: boolean; reason?: string } {
  // Check 1: Not empty
  if (!aiOutput || aiOutput.trim().length < 10) {
    return { valid: false, reason: 'AI output too short' };
  }

  // Check 2: Contains critical stat keywords (at least 60% must be present)
  const lowerAI = aiOutput.toLowerCase();
  const presentCount = statKeywords.filter(
    kw => lowerAI.includes(kw.toLowerCase())
  ).length;
  const ratio = statKeywords.length > 0 ? presentCount / statKeywords.length : 1;
  if (ratio < 0.6) {
    return {
      valid: false,
      reason: `Only ${Math.round(ratio * 100)}% of stat keywords preserved`,
    };
  }

  // Check 3: Token limit
  const tokens = estimateTokens(aiOutput);
  const limit = TOKEN_LIMITS[model];
  if (tokens > limit * 1.1) {
    return {
      valid: false,
      reason: `Token count ${tokens} exceeds limit ${limit}`,
    };
  }

  // Check 4: Not significantly longer than original (possible hallucination)
  if (aiOutput.length > originalPrompt.length * 1.5) {
    return {
      valid: false,
      reason: 'AI output significantly longer than original (possible hallucination)',
    };
  }

  return { valid: true };
}

/**
 * Enhance a prompt using Ollama AI.
 * Returns null if AI is unavailable, times out, or produces invalid output.
 */
export async function enhancePrompt(
  prompt: string,
  model: Model,
  statKeywords: string[],
  ollamaModel?: string
): Promise<string | null> {
  // Check availability first
  const available = await isOllamaAvailable();
  if (!available) return null;

  // Select appropriate system prompt
  let systemPrompt: string;
  if (model === 'FLUX') {
    systemPrompt = SYSTEM_PROMPTS['FLUX'];
  } else if (model === 'SDXL' || model === 'Juggernaut') {
    systemPrompt = SYSTEM_PROMPTS['SDXL'];
  } else {
    systemPrompt = SYSTEM_PROMPTS['TAG'];
  }

  // Add token limit instruction
  const limit = TOKEN_LIMITS[model];
  systemPrompt += `\n- Keep total under ${limit} tokens (~0.75 tokens per word)`;

  // Query Ollama
  const aiOutput = await queryOllama(prompt, systemPrompt, ollamaModel);
  if (!aiOutput) return null;

  // Validate output
  const validation = validateAIOutput(aiOutput, prompt, model, statKeywords);
  if (!validation.valid) {
    console.warn(`AI enhancement rejected: ${validation.reason}`);
    return null;
  }

  return aiOutput;
}
