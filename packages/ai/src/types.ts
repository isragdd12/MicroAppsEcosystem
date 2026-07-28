export interface AiMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AiRequestOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export interface AiResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
}

/**
 * Provider-agnostic interface for AI completions — see docs/AI_ARCHITECTURE.md.
 * All AI calls from app code go through this interface; the concrete implementation
 * (Claude via ai-proxy Edge Function) lives in the apps layer.
 */
export interface AiProvider {
  complete(
    messages: AiMessage[],
    options?: AiRequestOptions,
  ): Promise<AiResponse>;
}
