import type {
  AiMessage,
  AiProvider,
  AiRequestOptions,
  AiResponse,
} from './types';

export interface EdgeFunctionAiProviderOptions {
  /** Base URL of the Supabase project, e.g. https://xxx.supabase.co */
  supabaseUrl: string;
  /** Supabase anon key — authorizes the request; RLS gates per-user limits on the server. */
  supabaseAnonKey: string;
  /** Function that returns the current access token, or null if signed out. */
  getAccessToken: () => string | null;
}

/**
 * Sends AI completion requests through the `ai-proxy` Supabase Edge Function.
 * The edge function holds the actual provider API key — the client never sees it.
 * Unauthenticated callers can make requests (rate-limited by the edge function);
 * authenticated callers get higher limits based on their subscription tier.
 */
export class EdgeFunctionAiProvider implements AiProvider {
  private readonly baseUrl: string;
  private readonly anonKey: string;
  private readonly getAccessToken: () => string | null;

  constructor(options: EdgeFunctionAiProviderOptions) {
    this.baseUrl = options.supabaseUrl;
    this.anonKey = options.supabaseAnonKey;
    this.getAccessToken = options.getAccessToken;
  }

  async complete(
    messages: AiMessage[],
    options: AiRequestOptions = {},
  ): Promise<AiResponse> {
    const accessToken = this.getAccessToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      apikey: this.anonKey,
    };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const res = await fetch(`${this.baseUrl}/functions/v1/ai-proxy`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ messages, ...options }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`AI proxy error ${res.status}: ${text}`);
    }

    return res.json() as Promise<AiResponse>;
  }
}
