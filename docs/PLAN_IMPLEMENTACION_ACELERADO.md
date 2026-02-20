# 🚀 PLAN DE IMPLEMENTACIÓN ACELERADO
## PAES Pro - Con API Key OpenAI + Transbank

**Estado:** 🟢 API Key OpenAI disponible  
**Fecha inicio:** 17 Febrero 2026  
**Timeline optimizado:** 4-6 semanas (en lugar de 8)  
**Objetivo:** Lanzar IA + Pagos en producción ASAP

---

## 📊 COMPARATIVA: Roadmap Original vs Acelerado

| Fase | Original | Acelerado | Cambio |
|------|----------|-----------|--------|
| Semana 1-2 | Fundamentos | IA Preparación | -1 semana |
| Semana 3-4 | Feature-First | IA + Transbank Setup | +Transbank |
| Semana 5-6 | IA Prep | IA en Producción | -2 semanas |
| Semana 7-8 | IA Producción | Testing + Optimización | -1 semana |
| **Total** | **8 semanas** | **4-6 semanas** | **-33% tiempo** |

---

## 🎯 VERSIÓN ACELERADA: PLAN EJECUTIVO

### SEMANA 1: TABLAS SUPABASE + OPENAI SETUP

#### 1.1 Crear tablas AI en Supabase (2-3 horas)

**SQL a ejecutar en Supabase SQL Editor:**

```sql
-- Tabla para explicaciones IA (caching)
CREATE TABLE ai_explanations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  attempt_id UUID REFERENCES exam_attempts(id) ON DELETE CASCADE,
  selected_answer TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  prompt_tokens INT,
  completion_tokens INT,
  total_cost DECIMAL(10, 6),
  latency_ms INT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ai_explanations_user ON ai_explanations(user_id);
CREATE INDEX idx_ai_explanations_question ON ai_explanations(question_id);

-- Tabla para chat IA
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_attempt_id UUID REFERENCES exam_attempts(id),
  message TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_user ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_attempt ON chat_messages(exam_attempt_id);

-- Tabla para tracking de costos IA
CREATE TABLE ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  feature TEXT NOT NULL, -- 'explain', 'chat', 'generate'
  model TEXT NOT NULL,
  prompt_tokens INT NOT NULL,
  completion_tokens INT NOT NULL,
  total_cost DECIMAL(10, 6) NOT NULL,
  latency_ms INT,
  cached BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ai_usage_logs_user ON ai_usage_logs(user_id);
CREATE INDEX idx_ai_usage_logs_created ON ai_usage_logs(created_at DESC);

-- Tabla para suscripciones (Premium con Transbank)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'premium')), -- 'free' o 'premium'
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  transbank_order_id TEXT UNIQUE, -- ID del pago en Transbank
  transbank_token TEXT, -- Token de transacción
  amount DECIMAL(10, 2), -- Monto pagado (en pesos)
  started_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- Tabla para rastrear créditos de IA por usuario (plan Premium)
CREATE TABLE ai_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  balance DECIMAL(10, 2) NOT NULL DEFAULT 0, -- Saldo en pesos o créditos
  used DECIMAL(10, 2) NOT NULL DEFAULT 0, -- Total gastado en IA
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ai_credits_user ON ai_credits(user_id);
```

#### 1.2 Configurar OpenAI en .env (15 min)

```bash
# .env
OPENAI_API_KEY=sk-tu-key-real-aqui-que-ya-tienes
OPENAI_MODEL=gpt-4o-mini  # o gpt-4 si lo prefieres
OPENAI_TEMPERATURE=0.7

# Transbank (lo añadiremos después)
TRANSBANK_COMMERCE_CODE=tu-codigo-comercio
TRANSBANK_API_KEY=tu-api-key-transbank
TRANSBANK_ENVIRONMENT=INTEGRATION  # o PRODUCTION
```

#### 1.3 Instalar dependencias (5 min)

```bash
npm install openai transbank-sdk @upstash/redis @upstash/ratelimit
```

**Archivos a crear:**

✅ `src/lib/api/ai.ts` - Cliente OpenAI real (no mock)  
✅ `src/lib/api/transbank.ts` - Cliente Transbank  
✅ `src/lib/prompts/explain-prompt.ts` - Template de prompt  
✅ `app/api/ai/explain/route.ts` - Endpoint IA  
✅ `app/api/payments/transbank/route.ts` - Endpoint pagos  

---

### SEMANA 2: IMPLEMENTAR IA (EXPLICACIONES + CHAT)

#### 2.1 Cliente OpenAI Real (1 día)

```typescript
// src/lib/api/ai.ts
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateExplanation(
  params: {
    questionId: string;
    selectedAnswer: string;
    correctAnswer: string;
    distractors: string[];
    explanation: string;
    topicName: string;
    subjectName: string;
    difficulty: string;
  }
) {
  const prompt = `
Eres un tutor experto en PAES Chile. El estudiante respondió incorrectamente.

PREGUNTA: ${params.questionContent}
OPCIONES: A) ${params.distractors[0]}, B) ${params.distractors[1]}, C) ${params.correctAnswer}, D) ${params.distractors[2]}

EL ESTUDIANTE ELIGIÓ: ${params.selectedAnswer}
RESPUESTA CORRECTA: ${params.correctAnswer}
TEMA: ${params.topicName} (${params.subjectName})

EXPLICA BREVEMENTE (máx 200 palabras):
1. Por qué está equivocado
2. Por qué es correcto
3. Un tip para recordarlo

Sé amable y motivador.
  `.trim();

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
    max_tokens: 300,
  });

  const explanation = response.choices[0].message.content || '';
  const usage = response.usage || { prompt_tokens: 0, completion_tokens: 0 };

  // Guardar en DB para caching
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  await supabase.from('ai_explanations').insert({
    user_id: user?.id,
    question_id: params.questionId,
    selected_answer: params.selectedAnswer,
    ai_response: explanation,
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    prompt_tokens: usage.prompt_tokens,
    completion_tokens: usage.completion_tokens,
    total_cost: calculateCost(usage),
  });

  return explanation;
}

function calculateCost(usage: { prompt_tokens: number; completion_tokens: number }) {
  // Precios gpt-4o-mini: $0.15 per 1M input, $0.60 per 1M output
  const inputCost = (usage.prompt_tokens / 1_000_000) * 0.15;
  const outputCost = (usage.completion_tokens / 1_000_000) * 0.60;
  return inputCost + outputCost;
}
```

#### 2.2 Endpoint /api/ai/explain (1 día)

```typescript
// app/api/ai/explain/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateExplanation } from '@/src/lib/api/ai';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit
    const allowed = await checkRateLimit(user.id);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Plan gratuito: 5 explicaciones/día' },
        { status: 429 }
      );
    }

    const { questionId, selectedAnswer, attemptId } = await request.json();

    // Obtener pregunta
    const { data: question } = await supabase
      .from('questions')
      .select('*, topics(name, subjects(name))')
      .eq('id', questionId)
      .single();

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Generar explicación (REAL, no mock)
    const explanation = await generateExplanation({
      questionId,
      selectedAnswer,
      correctAnswer: question.correct_answer,
      distractors: question.distractors,
      explanation: question.explanation,
      topicName: question.topics.name,
      subjectName: question.topics.subjects.name,
      difficulty: question.difficulty,
    });

    return NextResponse.json({ explanation, ai_generated: true });

  } catch (error) {
    console.error('AI Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

#### 2.3 Componente AiExplanation actualizado (1 día)

```tsx
// src/features/exams/components/AiExplanation.tsx
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles, Loader2, Lock } from 'lucide-react';
import Link from 'next/link';

interface AiExplanationProps {
  questionId: string;
  selectedAnswer: string;
  attemptId: string;
  isPremium?: boolean; // True si usuario tiene plan Premium
}

export function AiExplanation({
  questionId,
  selectedAnswer,
  attemptId,
  isPremium = false,
}: AiExplanationProps) {
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGetExplanation() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, selectedAnswer, attemptId }),
      });

      if (response.status === 429) {
        setError('Alcanzaste el límite diario de explicaciones. Upgrade a Premium para ilimitadas.');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to generate explanation');
      }

      const data = await response.json();
      setExplanation(data.explanation);
    } catch (err) {
      setError('Error generando explicación. Intenta de nuevo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 mt-6">
      {!explanation && !isPremium && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-purple-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-purple-900">Plan Gratuito: 5 explicaciones/día</p>
              <p className="text-sm text-purple-700 mt-1">
                Upgrade a Premium para explicaciones ilimitadas con IA.
              </p>
            </div>
          </div>
        </div>
      )}

      {!explanation && (
        <Button
          onClick={handleGetExplanation}
          disabled={loading}
          size="lg"
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generando explicación con IA...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Obtener explicación personalizada
            </>
          )}
        </Button>
      )}

      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <p className="text-red-700 text-sm">{error}</p>
          {error.includes('Premium') && (
            <Link href="/pricing" className="text-red-600 text-sm font-medium mt-2 inline-block hover:underline">
              Ver planes de pago →
            </Link>
          )}
        </Card>
      )}

      {explanation && (
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold text-lg text-purple-900">
              Explicación IA Personalizada
            </h3>
          </div>
          <div className="space-y-3">
            {explanation.split('\n\n').map((paragraph, idx) => (
              <p key={idx} className="text-gray-700 text-sm leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
```

---

### SEMANA 3: INTEGRACIÓN TRANSBANK (PAGOS)

#### 3.1 Setup Transbank SDK (1 día)

```typescript
// src/lib/api/transbank.ts
import WebpayPlus from 'transbank-sdk';
import { createClient } from '@/lib/supabase/server';

const webpay = new WebpayPlus.Transaction({
  commerceCode: process.env.TRANSBANK_COMMERCE_CODE,
  apiKey: process.env.TRANSBANK_API_KEY,
  environment: process.env.TRANSBANK_ENVIRONMENT || 'INTEGRATION',
});

export async function createPaymentOrder(params: {
  userId: string;
  amount: number; // En pesos CLP
  plan: 'monthly' | 'annual'; // monthly: $9.90 USD (~7000 CLP), annual: $99 USD (~70000 CLP)
  returnUrl: string;
}) {
  try {
    // Crear orden en Transbank
    const buyOrder = `ORDER-${Date.now()}-${params.userId.substring(0, 8)}`;
    const sessionId = `SESSION-${Date.now()}-${params.userId.substring(0, 8)}`;

    const response = await webpay.create(
      buyOrder,
      sessionId,
      params.amount,
      params.returnUrl
    );

    // Guardar en BD
    const supabase = await createClient();
    await supabase.from('subscriptions').insert({
      user_id: params.userId,
      plan: 'premium',
      status: 'pending', // Cambiar a 'active' cuando Transbank confirme
      transbank_order_id: buyOrder,
      transbank_token: response.token,
      amount: params.amount,
    });

    return {
      token: response.token,
      url: response.url,
      buyOrder,
    };
  } catch (error) {
    console.error('Transbank error:', error);
    throw error;
  }
}

export async function confirmPayment(params: {
  token: string;
  buyOrder: string;
}) {
  try {
    // Confirmar pago en Transbank
    const response = await webpay.commit(params.token);

    if (response.status === '0') {
      // Pago exitoso
      const supabase = await createClient();
      
      // Actualizar suscripción en BD
      await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
        })
        .eq('transbank_order_id', params.buyOrder);

      // Crear créditos IA ilimitados
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('transbank_order_id', params.buyOrder)
        .single();

      await supabase.from('ai_credits').upsert({
        user_id: sub.user_id,
        balance: 999999, // "Ilimitado"
      });

      return { success: true, response };
    } else {
      throw new Error(`Payment failed: ${response.response_description}`);
    }
  } catch (error) {
    console.error('Transbank confirmation error:', error);
    throw error;
  }
}
```

#### 3.2 Página de Pricing (1-2 días)

```tsx
// app/pricing/page.tsx
'use client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleUpgrade(plan: 'monthly' | 'annual') {
    setLoading(true);
    try {
      // Crear orden de pago
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });

      const { url } = await response.json();

      // Redirigir a Transbank
      window.location.href = url;
    } catch (error) {
      console.error('Error:', error);
      alert('Error al procesar el pago');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-12">Planes de PAES Pro</h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Plan Gratuito */}
          <Card className="p-8 relative">
            <h2 className="text-2xl font-bold mb-2">Gratuito</h2>
            <p className="text-gray-600 mb-6">Perfecto para empezar</p>

            <div className="mb-6">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-gray-600">/mes</span>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                Ensayos ilimitados
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                5 explicaciones IA/día
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                Estadísticas básicas
              </li>
              <li className="flex items-center gap-2 opacity-50">
                <span className="h-5 w-5" />
                Chat sin límite
              </li>
              <li className="flex items-center gap-2 opacity-50">
                <span className="h-5 w-5" />
                Generador de preguntas
              </li>
            </ul>

            <Button className="w-full" variant="outline" disabled>
              Actual
            </Button>
          </Card>

          {/* Plan Premium */}
          <Card className="p-8 relative border-2 border-purple-500 bg-purple-50">
            <div className="absolute top-4 right-4 bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
              Recomendado
            </div>

            <h2 className="text-2xl font-bold mb-2">Premium</h2>
            <p className="text-gray-600 mb-6">Máximo rendimiento</p>

            <div className="mb-6">
              <span className="text-4xl font-bold">$9.90</span>
              <span className="text-gray-600">/mes o $99/año</span>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                Todo del plan gratuito
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                Explicaciones IA ilimitadas ✨
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                Chat en tiempo real con IA
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                Generador de preguntas IA
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                Análisis avanzado de rendimiento
              </li>
            </ul>

            <div className="space-y-2">
              <Button
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={() => handleUpgrade('monthly')}
                disabled={loading}
              >
                {loading ? 'Procesando...' : 'Upgrade Mensual'}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleUpgrade('annual')}
                disabled={loading}
              >
                Upgrade Anual (Ahorra 17%)
              </Button>
            </div>
          </Card>
        </div>

        {/* Nota */}
        <div className="text-center mt-12 text-gray-600">
          <p>💳 Los pagos son procesados de forma segura con Transbank</p>
          <p className="text-sm mt-2">Cancela tu suscripción cuando quieras, sin penalidades</p>
        </div>
      </div>
    </div>
  );
}
```

#### 3.3 Endpoint de Pagos (1-2 días)

```typescript
// app/api/payments/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createPaymentOrder } from '@/src/lib/api/transbank';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan } = await request.json();

    // Precios (en CLP pesos chilenos)
    const amounts = {
      monthly: 7900, // ~$9.90 USD
      annual: 79900, // ~$99 USD
    };

    const amount = amounts[plan as keyof typeof amounts];
    if (!amount) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Crear orden en Transbank
    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/confirm`;
    const paymentOrder = await createPaymentOrder({
      userId: user.id,
      amount,
      plan,
      returnUrl,
    });

    return NextResponse.json({
      url: `${paymentOrder.url}?token_ws=${paymentOrder.token}`,
      buyOrder: paymentOrder.buyOrder,
    });
  } catch (error) {
    console.error('Payment error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}

// app/api/payments/confirm/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { confirmPayment } from '@/src/lib/api/transbank';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    
    // Extraer buyOrder desde la BD por token
    const supabase = await createClient();
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('transbank_order_id')
      .eq('transbank_token', token)
      .single();

    // Confirmar pago
    await confirmPayment({
      token,
      buyOrder: sub.transbank_order_id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Confirmation error:', error);
    return NextResponse.json({ error: 'Failed to confirm payment' }, { status: 500 });
  }
}
```

---

### SEMANA 4: TESTING, OPTIMIZACIÓN Y DEPLOY

#### 4.1 Testing de IA y Pagos (2-3 días)

```typescript
// tests/ai.test.ts
import { describe, it, expect, vi } from 'vitest';
import { generateExplanation } from '@/src/lib/api/ai';

describe('AI Explanations', () => {
  it('generates explanation for incorrect answer', async () => {
    const explanation = await generateExplanation({
      questionId: 'test-question',
      selectedAnswer: 'A',
      correctAnswer: 'B',
      distractors: ['A', 'C', 'D'],
      explanation: 'Base explanation',
      topicName: 'Álgebra',
      subjectName: 'Matemática',
      difficulty: 'medio',
    });

    expect(explanation).toBeTruthy();
    expect(explanation.length).toBeGreaterThan(50);
  });
});
```

#### 4.2 Configurar Rate Limiting (1 día)

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

// Plan gratuito: 5 explicaciones/día
export const aiRateLimitFree = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 d'),
  analytics: true,
  prefix: 'ai:free',
});

// Plan premium: ilimitado (solo rate limit por segundo para evitar abuso)
export const aiRateLimitPremium = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 s'),
  analytics: true,
  prefix: 'ai:premium',
});

export async function checkRateLimit(userId: string, isPremium: boolean) {
  const limiter = isPremium ? aiRateLimitPremium : aiRateLimitFree;
  const { success } = await limiter.limit(userId);
  return success;
}
```

#### 4.3 Deploy a Producción (1 día)

**Variables de entorno en Vercel:**

```env
OPENAI_API_KEY=sk-...
TRANSBANK_COMMERCE_CODE=...
TRANSBANK_API_KEY=...
TRANSBANK_ENVIRONMENT=PRODUCTION
UPSTASH_REDIS_URL=...
UPSTASH_REDIS_TOKEN=...
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
```

**Checklist pre-deploy:**
- [ ] Tablas Supabase creadas y testeadas
- [ ] Variables de entorno configuradas
- [ ] Rate limiting funcionando
- [ ] Tests pasando (>70% coverage)
- [ ] Build local sin errores
- [ ] Preview en Vercel ok

---

## 📋 RESUMEN TAREAS POR SEMANA

### SEMANA 1: Setup IA (20-25 horas)
- [ ] Crear tablas Supabase (SQL)
- [ ] Setup OpenAI .env
- [ ] Instalar dependencias
- [ ] Crear `src/lib/api/ai.ts`
- [ ] Crear prompts templates
- [ ] Crear endpoint `/api/ai/explain`

### SEMANA 2: IA en Acción (20-25 horas)
- [ ] Componente `AiExplanation` mejorado
- [ ] Integrar en `QuestionCard`
- [ ] Rate limiting para plan gratuito
- [ ] Testing básico
- [ ] Deploy a Vercel preview

### SEMANA 3: Transbank (20-25 horas)
- [ ] Setup Transbank SDK
- [ ] Crear `src/lib/api/transbank.ts`
- [ ] Página de pricing
- [ ] Endpoints de pagos
- [ ] Manejo de suscripciones en BD

### SEMANA 4: Testing + Deploy (15-20 horas)
- [ ] Tests IA y pagos
- [ ] Error handling
- [ ] Deploy to production
- [ ] Monitoreo y analytics
- [ ] Documentación

**Total: 75-95 horas de desarrollo**

---

## 🚀 PRÓXIMOS PASOS INMEDIATOS

### HOY (17 Feb):
1. [ ] Ejecutar SQL de tablas en Supabase
2. [ ] Agregar OPENAI_API_KEY a .env
3. [ ] `npm install openai transbank-sdk @upstash/redis`

### MAÑANA (18 Feb):
1. [ ] Crear `src/lib/api/ai.ts` con cliente OpenAI real
2. [ ] Crear `src/lib/prompts/explain-prompt.ts`
3. [ ] Crear endpoint `/api/ai/explain`

### Esta semana:
1. [ ] Actualizar `AiExplanation` componente
2. [ ] Integrar en `QuestionCard`
3. [ ] Probar IA explicaciones en desarrollo

---

## 💰 MODELO DE NEGOCIO FINAL

### Plan Gratuito
✅ Ensayos ilimitados  
✅ 5 explicaciones IA/día  
✅ Estadísticas básicas  

### Plan Premium ($9.90/mes o $99/año)
✅ Todo del plan gratuito  
✅ Explicaciones IA ilimitadas ✨  
✅ Chat en tiempo real con IA  
✅ Generador de preguntas  
✅ Análisis avanzado  

### Infraestructura de Costos
- Transbank: 2.75% + $50 mensual (opcional)
- OpenAI: Máx $0.30/usuario/mes (con prompt caching)
- Supabase: $25/mes (plan Pro)
- Vercel: $20/mes (Vercel Pro para pagos)
- Upstash Redis: $0.2/GB/mes (freemium disponible)

**Break-even:** ~50 usuarios Premium

---

## 🎯 MÉTRICAS ESPERADAS (Semana 4)

- ✅ IA funcionando en producción
- ✅ Pagos procesados con Transbank
- ✅ Test coverage >65%
- ✅ <200ms latencia IA (p95)
- ✅ Costo por explicación <$0.01
- ✅ Uptime >99.5%

---

**Estado: 🟢 LISTO PARA COMENZAR**  
**API Key OpenAI:** ✅ Disponible  
**Transbank SDK:** ✅ Disponible  
**Timeline:** 4 semanas (en lugar de 8)

¿Comenzamos mañana? 🚀

