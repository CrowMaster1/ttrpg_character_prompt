// Direct HTTP API client for Ollama (no Node.js dependencies)

export interface OllamaModel {
  name: string;
  size: string;
  modified: string;
}

export interface OllamaConfig {
  host: string;
  models: OllamaModel[];
  selectedModel: string;
}

// Default config
const DEFAULT_HOST = 'http://localhost:11434';

// Ollama uses standard paths for model storage:
// - Linux/Mac: ~/.ollama/models
// - Windows: C:\Users\<user>\.ollama\models
// Models are downloaded via API and Ollama manages the storage location automatically

/**
 * Check if Ollama is running and accessible
 * Returns connection status instead of throwing errors
 */
export async function checkOllamaConnection(host: string = DEFAULT_HOST): Promise<{
  isConnected: boolean;
  error?: string;
}> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(`${host}/api/tags`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      return { isConnected: true };
    }
    return {
      isConnected: false,
      error: `Ollama responded with HTTP ${response.status}`,
    };
  } catch (error: unknown) {
    // Network errors indicate Ollama isn't running
    const message = error instanceof Error ? error.message : '';
    const name = error instanceof Error ? error.name : '';

    if (name === 'AbortError') {
      return {
        isConnected: false,
        error: 'Connection timeout - Ollama may not be running',
      };
    }
    if (message.includes('fetch')) {
      return {
        isConnected: false,
        error: 'Cannot connect to Ollama - Please start Ollama Desktop or run "ollama serve"',
      };
    }
    return {
      isConnected: false,
      error: message || 'Unknown connection error',
    };
  }
}

// Load config from localStorage
export function loadOllamaConfig(): OllamaConfig {
  try {
    const saved = localStorage.getItem('ollama_config');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Failed to load Ollama config:', error);
  }
  return {
    host: DEFAULT_HOST,
    models: [],
    selectedModel: '',
  };
}

// Save config to localStorage
export function saveOllamaConfig(config: OllamaConfig) {
  try {
    localStorage.setItem('ollama_config', JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save Ollama config:', error);
  }
}

// List available models
export async function listModels(host: string = DEFAULT_HOST): Promise<OllamaModel[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${host}/api/tags`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Ollama returned HTTP ${response.status}`);
    }
    const data = await response.json();
    return data.models.map((model: { name: string; size: number; modified_at: string }) => ({
      name: model.name,
      size: formatBytes(model.size),
      modified: new Date(model.modified_at).toLocaleDateString(),
    }));
  } catch (error: unknown) {
    console.warn('Ollama connection failed:', error);
    const message = error instanceof Error ? error.message : '';
    const name = error instanceof Error ? error.name : '';

    // User-friendly error messages
    if (name === 'AbortError') {
      throw new Error('⚠️ Connection timeout - Is Ollama running?\n\nStart Ollama Desktop or run "ollama serve" in terminal');
    }
    if (message.includes('fetch') || message.includes('Failed to fetch')) {
      throw new Error('⚠️ Cannot connect to Ollama\n\nPlease start Ollama:\n• Windows/Mac: Open Ollama Desktop app\n• Linux: Run "ollama serve" in terminal');
    }
    throw new Error(`⚠️ Ollama error: ${message}`);
  }
}

// Pull a model from Ollama
// Models are downloaded to Ollama's standard location:
// - Linux/Mac: ~/.ollama/models
// - Windows: C:\Users\<user>\.ollama\models
export async function pullModel(
  modelName: string,
  host: string = DEFAULT_HOST,
  onProgress?: (progress: string) => void
): Promise<void> {
  try {
    const response = await fetch(`${host}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: modelName, stream: true }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const part = JSON.parse(line) as { error?: string; status?: string; completed?: number; total?: number };
          if (part.error) {
            throw new Error(part.error);
          }
          if (part.status && onProgress) {
            const progress = part.completed && part.total
              ? `${((part.completed / part.total) * 100).toFixed(1)}%`
              : part.status;
            onProgress(progress);
          }
        } catch (e: unknown) {
          console.warn('Failed to parse progress line:', line, e);
        }
      }
    }
  } catch (error: unknown) {
    console.warn('Model download failed:', error);
    const message = error instanceof Error ? error.message : '';

    // User-friendly error messages
    if (message.includes('fetch') || message.includes('Failed to fetch')) {
      throw new Error(`⚠️ Cannot connect to Ollama to download "${modelName}"\n\nPlease start Ollama first`);
    }
    if (message.includes('not found')) {
      throw new Error(`⚠️ Model "${modelName}" not found\n\nCheck the model name and try again`);
    }
    throw new Error(`⚠️ Download failed: ${message}`);
  }
}

// Delete a model
export async function deleteModel(modelName: string, host: string = DEFAULT_HOST): Promise<void> {
  try {
    const response = await fetch(`${host}/api/delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: modelName }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as { error?: string };
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
  } catch (error: unknown) {
    console.warn('Model deletion failed:', error);
    const message = error instanceof Error ? error.message : '';

    // User-friendly error messages
    if (message.includes('fetch') || message.includes('Failed to fetch')) {
      throw new Error(`⚠️ Cannot connect to Ollama\n\nPlease start Ollama to delete models`);
    }
    throw new Error(`⚠️ Delete failed: ${message}`);
  }
}

// Model-specific guidance
const MODEL_GUIDANCE: Record<string, { tokenLimit: number; style: string; tips: string }> = {
  'FLUX': {
    tokenLimit: 256,
    style: 'Natural language sentences with semantic clustering',
    tips: 'Use complete sentences. Group related concepts together. Be descriptive but concise.',
  },
  'Pony': {
    tokenLimit: 77,
    style: 'Danbooru-style tags, comma-separated, order-based priority',
    tips: '⚠️ CRITICAL: NEVER use (word:1.2) weights for Pony! Order = priority. Most important tags first. Remove articles. Use underscores for multi-word.',
  },
  'SDXL': {
    tokenLimit: 77,
    style: 'Weighted keywords with (keyword:1.2) syntax',
    tips: 'Use weights 1.0-1.5 for emphasis. Important elements need higher weights.',
  },
  'Juggernaut': {
    tokenLimit: 77,
    style: 'SDXL-style weighted keywords',
    tips: 'Same as SDXL. Use (keyword:1.2) for emphasis. Keep concise.',
  },
  'SD1.5': {
    tokenLimit: 77,
    style: 'Simple comma-separated tags',
    tips: 'Clear, direct keywords. No special syntax needed.',
  },
  'Illustrious': {
    tokenLimit: 248,
    style: 'Booru tags with {curly brace} emphasis',
    tips: 'Use {keyword} for 1.05x emphasis, {{keyword}} for 1.1x. Order matters.',
  },
};

// Estimate token count (rough approximation: ~0.75 tokens per word)
function estimateTokens(text: string): number {
  return Math.ceil(text.split(/\s+/).length * 0.75);
}

// Clean prompt using Ollama with model-specific context
export async function cleanPrompt(
  prompt: string,
  ollamaModelName: string,
  host: string = DEFAULT_HOST,
  targetImageModel?: string,
  currentTokens?: number
): Promise<string> {
  try {
    const guidance = targetImageModel ? MODEL_GUIDANCE[targetImageModel] : null;
    const tokenCount = currentTokens || estimateTokens(prompt);

    // Build concise, focused instructions for small models
    const tokenWarning = guidance && tokenCount > guidance.tokenLimit
      ? `⚠️ OVER LIMIT - must reduce to ${guidance.tokenLimit} tokens!`
      : '';

    const ponyWarning = targetImageModel === 'Pony'
      ? '\n⚠️ NEVER use (word:1.2) weights for Pony! Order = priority.'
      : '';

    // Streamlined system prompt (140 tokens vs 320)
    const systemPrompt = `Clean this AI image prompt by:
1. Remove contradictions (young/old, weak/strong, ugly/beautiful)
2. Remove duplicates and redundant words
3. ${guidance ? `Fit ${guidance.tokenLimit} token limit` : 'Keep concise'} ${tokenWarning}
4. ${guidance ? `Format: ${guidance.style}` : 'Use clear keywords'}${ponyWarning}
5. Preserve core character and scene

Target model: ${targetImageModel || 'Unknown'}
${guidance ? `Style: ${guidance.style}` : ''}

<prompt>
${prompt}
</prompt>

Output ONLY the cleaned prompt between <output></output> tags:`;

    const response = await fetch(`${host}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: ollamaModelName,
        prompt: systemPrompt,
        stream: false,
        options: {
          temperature: 0.2, // Lower for more reliable output formatting
          top_p: 0.9,
          num_predict: 512, // Limit response length
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    let cleaned = data.response.trim();

    // Extract from XML tags if present (more reliable than "return only" directive)
    const outputMatch = cleaned.match(/<output>([\s\S]*?)<\/output>/);
    if (outputMatch) {
      cleaned = outputMatch[1].trim();
    } else {
      // Fallback: remove common LLM preambles
      cleaned = cleaned
        .replace(/^(here is|here's|the cleaned prompt is:?|optimized prompt:?)\s*/i, '')
        .replace(/^["']|["']$/g, '') // Remove surrounding quotes
        .trim();
    }

    return cleaned;
  } catch (error: unknown) {
    console.warn('Prompt cleaning failed:', error);
    const message = error instanceof Error ? error.message : '';

    // User-friendly error messages
    if (message.includes('fetch') || message.includes('Failed to fetch')) {
      throw new Error('⚠️ Cannot connect to Ollama\n\nPlease start Ollama Desktop or run "ollama serve"');
    }
    if (message.includes('model') && message.includes('not found')) {
      throw new Error(`⚠️ Model not found\n\nPlease download the model first using the Download section`);
    }
    if (message.includes('HTTP 4')) {
      throw new Error('⚠️ Invalid request to Ollama\n\nThe selected model may not be available');
    }
    throw new Error(`⚠️ AI optimization failed: ${message}`);
  }
}

// Suggest improvements using Ollama
export async function suggestImprovements(
  prompt: string,
  modelName: string,
  host: string = DEFAULT_HOST
): Promise<string[]> {
  try {
    const systemPrompt = `You are a creative prompt enhancement assistant. Analyze this AI image prompt and suggest 3-5 specific improvements to make it more vivid and detailed. Return ONLY a JSON array of suggestions, like: ["suggestion 1", "suggestion 2", "suggestion 3"]

Prompt to analyze:`;

    const response = await fetch(`${host}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelName,
        prompt: `${systemPrompt}\n\n${prompt}`,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    // Try to parse as JSON array
    try {
      const suggestions = JSON.parse(data.response);
      if (Array.isArray(suggestions)) {
        return suggestions;
      }
    } catch {
      // If not JSON, split by newlines
      return (data.response as string)
        .split('\n')
        .filter((line: string) => line.trim())
        .slice(0, 5);
    }

    return [];
  } catch (error: unknown) {
    console.warn('Suggestion generation failed:', error);
    const message = error instanceof Error ? error.message : '';

    // User-friendly error messages
    if (message.includes('fetch') || message.includes('Failed to fetch')) {
      throw new Error('⚠️ Cannot connect to Ollama\n\nPlease start Ollama to get AI suggestions');
    }
    if (message.includes('model') && message.includes('not found')) {
      throw new Error('⚠️ Model not found\n\nPlease download a model first');
    }
    throw new Error(`⚠️ Suggestion failed: ${message}`);
  }
}

// Helper: Format bytes to human readable
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// Popular models for quick selection (optimized for prompt cleaning)
// Smaller models (1B-3B) are preferred for faster response and lower resource usage
export const POPULAR_MODELS = [
  { name: 'qwen2.5:3b-instruct', description: '⭐ Best overall - Superior instruction following (3B)' },
  { name: 'llama3.2:3b-instruct', description: '⭐ Most reliable - Consistent output (3B)' },
  { name: 'llama3.2:1b-instruct', description: '⚡ Fastest - Lightweight and quick (1B)' },
  { name: 'qwen2.5:1.5b-instruct', description: 'Fast - Good balance (1.5B)' },
  { name: 'gemma2:2b-instruct', description: 'Efficient - Google Gemma 2 (2B)' },
  { name: 'phi3.5:3.8b-mini-instruct', description: 'Advanced - Microsoft Phi-3.5 (3.8B)' },
];
