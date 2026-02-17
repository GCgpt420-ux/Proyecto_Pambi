import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateExplanation } from '@/src/lib/api/ai';
import { buildExplainPrompt } from '@/src/lib/prompts/explain-prompt';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Configurar rate limiting
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1d'), // 5 requests por día para usuarios gratis
  analytics: true,
});

export async function POST(request: NextRequest) {
  try {
    // 1. Validar autenticación
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Verificar rate limit (por ahora todos tienen límite de 5)
    // TODO: Verificar si es Premium para permitir ilimitado
    const { success, limit, reset, remaining, pending } = await ratelimit.limit(
      user.id
    );

    if (!success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. 5 explanations per day for free users.',
          limit,
          reset,
          remaining,
        },
        { status: 429 }
      );
    }

    // 3. Parsear body
    const body = await request.json();
    const { questionId, selectedAnswer, attemptId } = body;

    if (!questionId || !selectedAnswer) {
      return NextResponse.json(
        { error: 'Missing required fields: questionId, selectedAnswer' },
        { status: 400 }
      );
    }

    // 4. Buscar pregunta en Supabase
    const { data: question, error: dbError } = await supabase
      .from('questions')
      .select(
        `
        id,
        content,
        correct_answer,
        distractors,
        explanation,
        difficulty,
        topic_id,
        topics (
          id,
          name,
          subject_id,
          subjects (
            id,
            name
          )
        )
      `
      )
      .eq('id', questionId)
      .single();

    if (dbError || !question) {
      console.error('Question fetch error:', dbError);
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // 5. Extraer información necesaria
    const topics = question.topics as Array<{
      name: string;
      subjects: Array<{ name: string }>;
    }>;
    const topicName = topics?.[0]?.name || 'Unknown Topic';
    const subjectName = topics?.[0]?.subjects?.[0]?.name || 'Unknown Subject';

    // 6. Construir prompt
    const prompt = buildExplainPrompt({
      questionContent: question.content,
      selectedAnswer,
      correctAnswer: question.correct_answer,
      distractors: question.distractors || [],
      explanation: question.explanation || 'No explanation provided',
      topicName,
      subjectName,
      difficulty: question.difficulty as 'easy' | 'medium' | 'hard',
    });

    // 7. Llamar a OpenAI
    const { explanation, promptTokens, completionTokens, totalCost } =
      await generateExplanation(prompt);

    // 8. Guardar en BD para caché y analytics
    const { error: saveError } = await supabase
      .from('ai_explanations')
      .insert({
        user_id: user.id,
        question_id: questionId,
        attempt_id: attemptId || null,
        selected_answer: selectedAnswer,
        ai_response: explanation,
        model: 'gpt-4o-mini',
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_cost: totalCost,
      });

    if (saveError) {
      console.warn('Could not save explanation to DB:', saveError);
      // No fallar si no se puede guardar, el usuario obtiene su respuesta
    }

    // 9. Guardar log de uso
    await supabase.from('ai_usage_logs').insert({
      user_id: user.id,
      feature: 'explain',
      model: 'gpt-4o-mini',
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_cost: totalCost,
      cached: false,
    });

    // 10. Retornar respuesta
    return NextResponse.json({
      success: true,
      explanation,
      questionContent: question.content,
      correctAnswer: question.correct_answer,
      metadata: {
        model: 'gpt-4o-mini',
        promptTokens,
        completionTokens,
        totalCost,
        rateLimit: {
          limit,
          remaining,
          reset,
        },
      },
    });
  } catch (error) {
    console.error('AI Explain Error:', error);

    // Respuesta genérica sin exponer detalles internos
    return NextResponse.json(
      {
        error: 'Failed to generate explanation. Please try again later.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Para verificar que el endpoint está disponible
 */
export async function GET() {
  return NextResponse.json({
    message: 'AI Explain endpoint active',
    methods: ['POST'],
    documentation: '/docs/api/ai/explain',
  });
}
