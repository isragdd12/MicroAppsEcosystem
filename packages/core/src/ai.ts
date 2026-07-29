export interface AiMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AiOptions {
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AskAiConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  getAccessToken: () => string | null;
}

export async function askAi(
  config: AskAiConfig,
  messages: AiMessage[],
  options: AiOptions = {},
): Promise<string> {
  const token = config.getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: config.supabaseAnonKey,
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${config.supabaseUrl}/functions/v1/ai-proxy`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ messages, ...options }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI proxy error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as { content: string };
  return data.content;
}
