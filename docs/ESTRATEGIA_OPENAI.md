# 🤖 ESTRATEGIA DE INTEGRACIÓN OPENAI - PAES Pro

**Objetivo:** Implementar funcionalidades de IA para mejorar la experiencia de estudio  
**Estado:** Diseño y preparación (pendiente acceso API)  
**Prioridad:** Alta  

---

## 📋 1. CASOS DE USO PRIORIZADOS

### 🥇 Prioridad 1: Explicaciones Inteligentes

**Problema:** Las explicaciones actuales son estáticas y no se adaptan al error del estudiante.

**Solución IA:**
Generar explicaciones dinámicas basadas en:
- La respuesta incorrecta seleccionada
- El concepto específico que el estudiante no entendió
- El nivel de dificultad de la pregunta
- Historial de errores similares

**Impacto:**
- ✅ Mejora comprensión inmediata
- ✅ Aprendizaje más efectivo
- ✅ Reduce frustración del estudiante

**Complejidad:** Baja  
**Costo API:** ~$0.02 por explicación (GPT-4o-mini)

---

### 🥈 Prioridad 2: Generación de Preguntas

**Problema:** Crear preguntas manualmente es lento y costoso.

**Solución IA:**
Generar preguntas estilo PAES con:
- Enunciado claro
- 4 opciones (1 correcta + 3 distractores)
- Explicación detallada
- Validación de calidad (otro prompt de IA)

**Impacto:**
- ✅ Escala contenido rápidamente
- ✅ Variedad infinita de ejercicios
- ✅ Reduce costos de creación

**Complejidad:** Media  
**Costo API:** ~$0.05 por pregunta (GPT-4)

---

### 🥉 Prioridad 3: Tutor Virtual (Chatbot)

**Problema:** Estudiantes tienen dudas fuera de horario de tutores humanos.

**Solución IA:**
Chatbot especializado en PAES que:
- Responde dudas sobre temas específicos
- Sugiere recursos de estudio
- Explica paso a paso soluciones
- Mantiene contexto de conversación

**Impacto:**
- ✅ Soporte 24/7
- ✅ Escalable a miles de usuarios
- ✅ Reduce carga de tutores humanos

**Complejidad:** Alta  
**Costo API:** ~$0.10 por conversación (GPT-4o-mini)

---

### 📊 Prioridad 4: Análisis de Rendimiento con IA

**Problema:** Dashboard muestra datos básicos, pero no insights accionables.

**Solución IA:**
Análisis inteligente que:
- Identifica patrones de error
- Predice temas problemáticos
- Sugiere plan de estudio personalizado
- Estima puntaje PAES

**Impacto:**
- ✅ Estudiante sabe qué estudiar
- ✅ Optimiza tiempo de preparación
- ✅ Aumenta engagement

**Complejidad:** Alta  
**Costo API:** ~$0.15 por análisis (GPT-4)

---

## 🏗️ 2. ARQUITECTURA TÉCNICA

### Estructura de Archivos

```
app/api/ai/
├── explain/
│   └── route.ts              # POST - Explicar respuesta
├── generate/
│   └── route.ts              # POST - Generar preguntas
├── chat/
│   └── route.ts              # POST - Chatbot tutor
└── analyze/
    └── route.ts              # POST - Análisis rendimiento

src/lib/api/
├── ai.ts                     # Cliente OpenAI wrapper
└── openai-config.ts          # Configuración modelos

src/lib/prompts/
├── explain-prompt.ts         # Template explicaciones
├── generate-prompt.ts        # Template generación
├── tutor-prompt.ts           # Template tutor
└── analyze-prompt.ts         # Template análisis

src/types/
└── ai.ts                     # Tipos IA (ExplainRequest, GenerateRequest, etc)

components/exam/
├── ai-explanation.tsx        # Componente explicación IA
├── ai-chat-widget.tsx        # Widget chat flotante
└── ai-loading.tsx            # Loading states para IA
```

### Cliente OpenAI Base

```typescript
// src/lib/api/ai.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateCompletion(
  prompt: string,
  options?: {
    model?: 'gpt-4o-mini' | 'gpt-4' | 'gpt-4-turbo';
    temperature?: number;
    maxTokens?: number;
  }
) {
  const response = await openai.chat.completions.create({
    model: options?.model || 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: options?.temperature || 0.7,
    max_tokens: options?.maxTokens || 500,
  });

  return response.choices[0].message.content;
}

export async function streamCompletion(
  prompt: string,
  onChunk: (text: string) => void
) {
  const stream = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    stream: true,
  });

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content || '';
    onChunk(text);
  }
}
```

---

## 📝 3. IMPLEMENTACIÓN POR PRIORIDAD

### 🥇 Fase 1: Explicaciones Inteligentes (Semana 1-2)

#### Endpoint API

```typescript
// app/api/ai/explain/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateCompletion } from '@/src/lib/api/ai';
import { buildExplainPrompt } from '@/src/lib/prompts/explain-prompt';

export async function POST(request: NextRequest) {
  try {
    // 1. Validar autenticación
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parsear body
    const body = await request.json();
    const { questionId, selectedAnswer, attemptId } = body;

    // 3. Obtener pregunta de Supabase
    const { data: question, error: dbError } = await supabase
      .from('questions')
      .select('*, topics(name, subjects(name))')
      .eq('id', questionId)
      .single();

    if (dbError || !question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // 4. Construir prompt
    const prompt = buildExplainPrompt({
      questionContent: question.content,
      selectedAnswer,
      correctAnswer: question.correct_answer,
      distractors: question.distractors,
      explanation: question.explanation,
      topicName: question.topics.name,
      subjectName: question.topics.subjects.name,
      difficulty: question.difficulty,
    });

    // 5. Llamar OpenAI
    const aiExplanation = await generateCompletion(prompt, {
      model: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 400,
    });

    // 6. Guardar en DB (opcional - para analytics)
    await supabase.from('ai_explanations').insert({
      user_id: user.id,
      question_id: questionId,
      attempt_id: attemptId,
      selected_answer: selectedAnswer,
      ai_response: aiExplanation,
      model: 'gpt-4o-mini',
    });

    // 7. Retornar respuesta
    return NextResponse.json({
      explanation: aiExplanation,
      questionContent: question.content,
      correctAnswer: question.correct_answer,
    });

  } catch (error) {
    console.error('AI Explain Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate explanation' },
      { status: 500 }
    );
  }
}
```

#### Template de Prompt

```typescript
// src/lib/prompts/explain-prompt.ts
interface ExplainPromptParams {
  questionContent: string;
  selectedAnswer: string;
  correctAnswer: string;
  distractors: string[];
  explanation: string;
  topicName: string;
  subjectName: string;
  difficulty: string;
}

export function buildExplainPrompt(params: ExplainPromptParams): string {
  return `
Eres un tutor experto en preparación para la prueba PAES de Chile.

**PREGUNTA:**
${params.questionContent}

**OPCIONES:**
A) ${params.distractors[0]}
B) ${params.distractors[1]}
C) ${params.correctAnswer}
D) ${params.distractors[2]}

**RESPUESTA DEL ESTUDIANTE:** ${params.selectedAnswer}
**RESPUESTA CORRECTA:** ${params.correctAnswer}
**TEMA:** ${params.topicName} (${params.subjectName})
**DIFICULTAD:** ${params.difficulty}

**EXPLICACIÓN BÁSICA:**
${params.explanation}

**TU TAREA:**
Genera una explicación personalizada considerando que el estudiante seleccionó "${params.selectedAnswer}" en lugar de "${params.correctAnswer}".

**FORMATO DE RESPUESTA (máximo 300 palabras):**

1. **Por qué tu respuesta es incorrecta:**
   [Explica el error conceptual específico]

2. **Por qué la respuesta correcta es "${params.correctAnswer}":**
   [Explica paso a paso el razonamiento]

3. **Cómo evitar este error:**
   [Tip específico para recordar el concepto]

**TONO:** Amable, educativo, motivador. Sin emojis.
`.trim();
}
```

#### Componente React

```tsx
// components/exam/ai-explanation.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles, Loader2 } from 'lucide-react';

interface AiExplanationProps {
  questionId: string;
  selectedAnswer: string;
  attemptId: string;
}

export function AiExplanation({ 
  questionId, 
  selectedAnswer, 
  attemptId 
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

      if (!response.ok) {
        throw new Error('Failed to get explanation');
      }

      const data = await response.json();
      setExplanation(data.explanation);
    } catch (err) {
      setError('No pudimos generar la explicación. Intenta de nuevo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {!explanation && (
        <Button
          onClick={handleGetExplanation}
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generando explicación personalizada...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Obtener explicación con IA
            </>
          )}
        </Button>
      )}

      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <p className="text-red-700 text-sm">{error}</p>
        </Card>
      )}

      {explanation && (
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold text-lg">Explicación Personalizada</h3>
          </div>
          <div className="prose prose-sm max-w-none">
            {explanation.split('\n\n').map((paragraph, idx) => (
              <p key={idx} className="mb-3 text-gray-700">
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

#### Integración en QuestionCard

```tsx
// components/exam/question-card.tsx
import { AiExplanation } from './ai-explanation';

// Dentro del componente, después de mostrar la explicación estática:
{showExplanation && !isCorrect && (
  <div className="mt-4">
    <AiExplanation
      questionId={question.id}
      selectedAnswer={selectedOption}
      attemptId={attemptId}
    />
  </div>
)}
```

---

### 🥈 Fase 2: Generación de Preguntas (Semana 3-4)

```typescript
// app/api/ai/generate/route.ts
export async function POST(request: NextRequest) {
  // 1. Validar usuario admin (solo admins pueden generar)
  // 2. Parsear topicId, difficulty, count
  // 3. Obtener info del topic desde Supabase
  // 4. Construir prompt de generación
  // 5. Llamar OpenAI con GPT-4
  // 6. Validar calidad con segundo prompt
  // 7. Insertar en DB questions table
  // 8. Retornar IDs generados
}
```

**Prompt template:**
```typescript
export function buildGeneratePrompt(params: {
  topicName: string;
  subjectName: string;
  difficulty: string;
  count: number;
}): string {
  return `
Eres un creador experto de preguntas para la prueba PAES de Chile.

**TEMA:** ${params.topicName} (${params.subjectName})
**DIFICULTAD:** ${params.difficulty}
**CANTIDAD:** ${params.count} preguntas

**FORMATO DE CADA PREGUNTA (JSON):**
{
  "content": "Enunciado de la pregunta",
  "correct_answer": "Respuesta correcta completa",
  "distractors": ["Distractor 1", "Distractor 2", "Distractor 3"],
  "explanation": "Explicación detallada de por qué es correcta",
  "difficulty": "${params.difficulty}"
}

**REQUISITOS:**
- Estilo oficial PAES
- Distractores plausibles (no obvios)
- Sin errores ortográficos
- Conceptos del currículo chileno
- Explicaciones pedagógicas

**RETORNA JSON ARRAY:**
`;
}
```

---

### 🥉 Fase 3: Tutor Virtual (Semana 5-6)

```typescript
// app/api/ai/chat/route.ts
export async function POST(request: NextRequest) {
  // 1. Validar usuario
  // 2. Obtener historial del chat (últimos 10 mensajes)
  // 3. Añadir contexto del estudiante (temas en progreso, nivel)
  // 4. Construir prompt con system message + historial
  // 5. Llamar OpenAI con streaming
  // 6. Guardar mensaje en DB (chat_history table)
  // 7. Retornar stream
}
```

**System prompt:**
```typescript
export const TUTOR_SYSTEM_PROMPT = `
Eres un tutor virtual especializado en la preparación de la prueba PAES de Chile.

**TU ROL:**
- Ayudar a estudiantes a entender conceptos
- Responder dudas sobre temas específicos
- Sugerir recursos de estudio
- Motivar y alentar al estudiante

**REGLAS:**
- Respuestas cortas y claras (máximo 150 palabras)
- Usa ejemplos cuando sea necesario
- Si no sabes algo, admítelo
- No hagas la tarea por el estudiante, guíalo
- Tono amigable pero profesional

**TEMAS CUBIERTOS:**
- Matemática M1 y M2
- Lengua y Literatura
- Ciencias (Biología, Química, Física)
- Historia y Ciencias Sociales
`;
```

---

## 💰 4. ESTIMACIÓN DE COSTOS

### Modelos y Pricing (Feb 2024)

| Modelo | Input (1M tokens) | Output (1M tokens) |
|--------|-------------------|-------------------|
| GPT-4o-mini | $0.15 | $0.60 |
| GPT-4 | $30.00 | $60.00 |
| GPT-4-turbo | $10.00 | $30.00 |

### Costo por Feature

#### Explicaciones IA (GPT-4o-mini)
- **Prompt:** ~400 tokens
- **Respuesta:** ~300 tokens
- **Costo:** ~$0.0004 por explicación
- **Uso estimado:** 1000 explicaciones/día = **$0.40/día = $12/mes**

#### Generación de Preguntas (GPT-4)
- **Prompt:** ~500 tokens
- **Respuesta:** ~800 tokens (10 preguntas)
- **Costo:** ~$0.06 por batch
- **Uso estimado:** 100 preguntas/día = **$0.60/día = $18/mes**

#### Tutor Virtual (GPT-4o-mini)
- **Prompt:** ~600 tokens (con historial)
- **Respuesta:** ~200 tokens
- **Costo:** ~$0.0002 por mensaje
- **Uso estimado:** 5000 mensajes/día = **$1/día = $30/mes**

#### Análisis Rendimiento (GPT-4)
- **Prompt:** ~1000 tokens
- **Respuesta:** ~600 tokens
- **Costo:** ~$0.06 por análisis
- **Uso estimado:** 100 análisis/día = **$6/día = $180/mes**

### Total Estimado
- **MVP (Explicaciones + Tutor):** ~$42/mes (100 usuarios activos)
- **Completo (todas las features):** ~$240/mes (100 usuarios activos)
- **Escalado (1000 usuarios):** ~$2400/mes

---

## 🛡️ 5. SEGURIDAD Y LÍMITES

### Rate Limiting

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});

export const aiRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1h'), // 10 requests por hora por usuario
  analytics: true,
});

// Uso en API route:
const identifier = user.id;
const { success } = await aiRatelimit.limit(identifier);

if (!success) {
  return NextResponse.json(
    { error: 'Rate limit exceeded. Try again later.' },
    { status: 429 }
  );
}
```

### Moderación de Inputs

```typescript
// lib/api/ai.ts
export async function moderateContent(text: string): Promise<boolean> {
  const moderation = await openai.moderations.create({
    input: text,
  });

  const flagged = moderation.results[0].flagged;
  
  if (flagged) {
    console.warn('Content flagged by OpenAI moderation:', text);
  }

  return !flagged; // true si es seguro
}

// Uso en endpoint:
const isSafe = await moderateContent(userMessage);
if (!isSafe) {
  return NextResponse.json(
    { error: 'Message contains inappropriate content' },
    { status: 400 }
  );
}
```

### Caché de Respuestas

```typescript
// lib/cache.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({ /* config */ });

export async function getCachedAI(key: string): Promise<string | null> {
  return await redis.get(key);
}

export async function setCachedAI(
  key: string,
  value: string,
  ttl: number = 3600 // 1 hora
): Promise<void> {
  await redis.setex(key, ttl, value);
}

// Uso:
const cacheKey = `explain:${questionId}:${selectedAnswer}`;
const cached = await getCachedAI(cacheKey);

if (cached) {
  return NextResponse.json({ explanation: cached, cached: true });
}

// ... generar con OpenAI ...

await setCachedAI(cacheKey, aiExplanation);
```

---

## 📊 6. ANALYTICS Y MONITOREO

### Métricas a Trackear

```typescript
// Tabla: ai_usage_logs
interface AiUsageLog {
  id: string;
  user_id: string;
  feature: 'explain' | 'generate' | 'chat' | 'analyze';
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_cost: number;
  latency_ms: number;
  cached: boolean;
  created_at: Date;
}
```

### Dashboard de Costos

```typescript
// app/admin/ai-analytics/page.tsx
export default async function AiAnalyticsPage() {
  // Query Supabase para stats
  const { data: stats } = await supabase
    .from('ai_usage_logs')
    .select('feature, sum(total_cost), count(*)')
    .gte('created_at', '2024-02-01')
    .group('feature');

  return (
    <div>
      <h1>AI Analytics</h1>
      {/* Gráficos de costo por feature */}
      {/* Tabla de usuarios top consumers */}
      {/* Alertas si se supera budget */}
    </div>
  );
}
```

---

## ✅ 7. CHECKLIST DE IMPLEMENTACIÓN

### Preparación Previa (Antes de tener API key)
- [x] Diseñar arquitectura de endpoints
- [x] Crear prompts templates
- [x] Definir interfaces TypeScript
- [ ] Crear tablas Supabase necesarias:
  ```sql
  -- Explicaciones IA
  CREATE TABLE ai_explanations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    question_id UUID REFERENCES questions(id),
    attempt_id UUID REFERENCES exam_attempts(id),
    selected_answer TEXT,
    ai_response TEXT,
    model TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  );

  -- Chat history
  CREATE TABLE chat_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    message TEXT,
    role TEXT, -- 'user' | 'assistant'
    created_at TIMESTAMP DEFAULT NOW()
  );

  -- AI usage logs
  CREATE TABLE ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    feature TEXT,
    model TEXT,
    prompt_tokens INT,
    completion_tokens INT,
    total_cost DECIMAL,
    latency_ms INT,
    cached BOOLEAN,
    created_at TIMESTAMP DEFAULT NOW()
  );
  ```
- [ ] Decidir herramienta de rate limiting (Upstash Redis?)
- [ ] Diseñar componentes UI para IA

### Implementación Fase 1 (Con API key)
- [ ] Configurar variables de entorno:
  ```env
  OPENAI_API_KEY=sk-...
  OPENAI_ORG_ID=org-...
  UPSTASH_REDIS_URL=...
  UPSTASH_REDIS_TOKEN=...
  ```
- [ ] Instalar dependencias:
  ```bash
  npm install openai @upstash/redis @upstash/ratelimit
  ```
- [ ] Crear `src/lib/api/ai.ts` con cliente base
- [ ] Implementar `/api/ai/explain/route.ts`
- [ ] Crear componente `AiExplanation`
- [ ] Integrar en `QuestionCard`
- [ ] Testing manual
- [ ] Deploy y monitoreo

### Implementación Fase 2
- [ ] Endpoint `/api/ai/generate/route.ts`
- [ ] Admin panel para generar preguntas
- [ ] Validación de calidad con segundo prompt
- [ ] Testing con 10 preguntas

### Implementación Fase 3
- [ ] Endpoint `/api/ai/chat/route.ts` con streaming
- [ ] Componente `AiChatWidget` flotante
- [ ] Persistencia de historial chat
- [ ] Testing conversaciones

---

## 🚀 8. QUICK START (Cuando tengas API key)

```bash
# 1. Instalar dependencias
npm install openai @upstash/redis @upstash/ratelimit

# 2. Configurar .env
echo "OPENAI_API_KEY=sk-tu-key-aqui" >> .env

# 3. Correr migrations (crear tablas)
psql -h DB_HOST -U postgres -d postgres -f migrations/create_ai_tables.sql

# 4. Test endpoint
curl -X POST http://localhost:3000/api/ai/explain \
  -H "Content-Type: application/json" \
  -d '{
    "questionId": "uuid-aqui",
    "selectedAnswer": "B",
    "attemptId": "uuid-aqui"
  }'

# 5. Ver respuesta IA en componente
# Navegar a cualquier ensayo y responder mal una pregunta
```

---

## 📞 9. PREGUNTAS PARA EL EQUIPO

Antes de implementar, resolver:

1. **Budget mensual:** ¿Cuánto estamos dispuestos a gastar en OpenAI?
2. **Rate limits:** ¿Cuántas requests IA por usuario/día?
3. **Caché:** ¿Usar Redis o simplemente Supabase?
4. **Monitoreo:** ¿LangSmith, Helicone, o custom?
5. **Fallback:** ¿Qué mostramos si OpenAI falla?
6. **Testing:** ¿Necesitamos API key de testing separada?

---

**Estado:** Listo para implementar cuando tengas acceso a OpenAI API  
**Tiempo estimado Fase 1:** 1-2 semanas  
**ROI esperado:** +30% engagement, +25% tiempo en plataforma
