import OpenAI from 'openai';

let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

interface CompletionOptions {
  model?: 'gpt-4o-mini' | 'gpt-4' | 'gpt-4-turbo';
  temperature?: number;
  maxTokens?: number;
}

/**
 * Generar una respuesta usando OpenAI
 * @param prompt - El prompt a enviar
 * @param options - Configuración del modelo
 * @returns La respuesta de texto de OpenAI
 */
export async function generateCompletion(
  prompt: string,
  options: CompletionOptions = {}
): Promise<string> {
  const {
    model = 'gpt-4o-mini',
    temperature = 0.7,
    maxTokens = 500,
  } = options;

  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: maxTokens,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in response');
    }

    return content;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw error;
  }
}

/**
 * Generar una respuesta con streaming
 * @param prompt - El prompt a enviar
 * @param onChunk - Callback cada vez que hay nuevo texto
 */
export async function streamCompletion(
  prompt: string,
  onChunk: (text: string) => void
): Promise<void> {
  try {
    const client = getOpenAIClient();
    const stream = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      stream: true,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || '';
      if (text) {
        onChunk(text);
      }
    }
  } catch (error) {
    console.error('OpenAI Streaming Error:', error);
    throw error;
  }
}

/**
 * Calcular el costo de una llamada basado en tokens
 * Precios actuales (Feb 2024): gpt-4o-mini = $0.15/$0.60 por 1M tokens
 */
export function calculateCost(
  promptTokens: number,
  completionTokens: number,
  model: string = 'gpt-4o-mini'
): number {
  const rates: Record<string, { input: number; output: number }> = {
    'gpt-4o-mini': { input: 0.15 / 1000000, output: 0.60 / 1000000 },
    'gpt-4': { input: 30 / 1000000, output: 60 / 1000000 },
    'gpt-4-turbo': { input: 10 / 1000000, output: 30 / 1000000 },
  };

  const rate = rates[model] || rates['gpt-4o-mini'];
  return (promptTokens * rate.input + completionTokens * rate.output);
}

/**
 * Verificar contenido inapropiado usando moderación de OpenAI
 */
export async function moderateContent(text: string): Promise<boolean> {
  try {
    const client = getOpenAIClient();
    const moderation = await client.moderations.create({
      input: text,
    });

    const flagged = moderation.results[0]?.flagged || false;

    if (flagged) {
      console.warn('Content flagged by OpenAI moderation');
    }

    return !flagged; // true si es seguro
  } catch (error) {
    console.error('Moderation Error:', error);
    // En caso de error, permitir (no bloquear por seguridad)
    return true;
  }
}

/**
 * Interface para respuestas de explicación
 */
export interface ExplainResponse {
  explanation: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalCost: number;
}

/**
 * Generar una explicación de una pregunta (wrapper específico)
 */
export async function generateExplanation(
  prompt: string
): Promise<ExplainResponse> {
  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 400,
    });

    const explanation = response.choices[0]?.message?.content || '';
    const promptTokens = response.usage?.prompt_tokens || 0;
    const completionTokens = response.usage?.completion_tokens || 0;

    return {
      explanation,
      model: 'gpt-4o-mini',
      promptTokens,
      completionTokens,
      totalCost: calculateCost(promptTokens, completionTokens, 'gpt-4o-mini'),
    };
  } catch (error) {
    console.error('Explanation Generation Error:', error);
    throw error;
  }
}
