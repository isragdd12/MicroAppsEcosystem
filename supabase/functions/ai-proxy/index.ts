import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Anthropic from 'npm:@anthropic-ai/sdk';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as RequestBody;
    const {
      messages,
      model = 'claude-haiku-4-5-20251001',
      maxTokens = 1024,
      temperature = 0.7,
      systemPrompt,
    } = body;

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'AI not configured' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const anthropic = new Anthropic({ apiKey });

    const nonSystemMessages = messages.filter((m) => m.role !== 'system');
    const systemFromMessages = messages.find(
      (m) => m.role === 'system',
    )?.content;
    const resolvedSystem = systemPrompt ?? systemFromMessages;

    const response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      ...(resolvedSystem && { system: resolvedSystem }),
      messages: nonSystemMessages as Anthropic.MessageParam[],
    });

    const content = response.content[0];
    const text = content.type === 'text' ? content.text : '';

    return new Response(
      JSON.stringify({
        content: text,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
