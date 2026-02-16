# 🎯 ROADMAP EJECUTIVO - PAES Pro (Próximas 8 Semanas)

**Objetivo:** Escalar la plataforma de MVP a producción con IA integrada  
**Periodo:** 8 semanas (Feb-Mar 2026)  
**Estado proyecto:** ✅ MVP funcional, presentación exitosa  

---

## 📅 SEMANA 1-2: FUNDAMENTOS Y OPTIMIZACIÓN

### 🎯 Objetivos
- Mejorar performance y UX del MVP actual
- Preparar infraestructura para IA
- Implementar testing básico

### 📋 Tareas

#### 1.1 Setup React Query (2-3 días)
**Por qué:** Eliminar re-fetches innecesarios, mejorar UX con cache

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

**Implementación:**
```tsx
// app/providers.tsx
'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minuto
      cacheTime: 5 * 60 * 1000, // 5 minutos
    },
  },
});

export function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

**Migrar queries críticas:**
- ✅ `useQuery` para lista de exams
- ✅ `useQuery` para subjects y topics
- ✅ `useMutation` para crear exam
- ✅ `useMutation` para guardar respuestas

**Resultado esperado:**
- 50% menos requests a Supabase
- Loading states consistentes
- Mejor experiencia de navegación

---

#### 1.2 Error Boundaries (1 día)
**Por qué:** UX robusto cuando algo falla

```tsx
// components/error-boundary.tsx
'use client';
import { Component, ReactNode } from 'react';

export class ErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error boundary caught:', error, errorInfo);
    // TODO: Enviar a Sentry cuando lo configuremos
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-6 text-center">
          <h2 className="text-xl font-bold text-red-600">
            Algo salió mal
          </h2>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Intentar de nuevo
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Usar en:**
- `app/protected/layout.tsx` (wrap todo el dashboard)
- `app/protected/ensayos/[exam_id]/page.tsx` (flujo crítico)

---

#### 1.3 Form Validation con Zod (1-2 días)
**Por qué:** Validación type-safe y mensajes claros

```bash
npm install react-hook-form zod @hookform/resolvers
```

**Ejemplo:**
```tsx
// app/auth/login/page.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    // ... login logic
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <p>{errors.email.message}</p>}
      {/* ... */}
    </form>
  );
}
```

**Aplicar a:**
- ✅ Login
- ✅ Sign up
- ✅ Forgot password
- ✅ Update password
- ✅ Create exam modal
- ✅ Update profile

---

#### 1.4 Vitest + Testing Library Setup (1 día)
**Por qué:** Confianza al hacer cambios

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './vitest.setup.ts',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

**Tests iniciales:**
```typescript
// components/ui/button.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from './button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    screen.getByText('Click').click();
    expect(handleClick).toHaveBeenCalledOnce();
  });
});
```

**Escribir tests para:**
- Componentes UI básicos (button, card, input)
- Login/SignUp forms
- QuestionCard (respuesta correcta/incorrecta)

---

### ✅ Entregables Semana 1-2
- [ ] React Query configurado y queries migradas
- [ ] Error boundaries en rutas críticas
- [ ] Validación con Zod en todos los forms
- [ ] Vitest setup con 15+ tests

**Criterio éxito:** Build pasa, cobertura >40%

---

## 📅 SEMANA 3-4: FEATURE-FIRST MIGRATION (FASE 2)

### 🎯 Objetivos
- Migrar componentes a estructura `src/features/`
- Crear Views layer
- Separar lógica de negocio de UI

### 📋 Tareas

#### 2.1 Crear Estructura de Features (1 día)

```bash
mkdir -p src/features/{auth,exams,courses,dashboard}
mkdir -p src/features/{auth,exams,courses,dashboard}/{components,hooks,api,types}
```

**Estructura final:**
```
src/features/
├── auth/
│   ├── components/
│   │   ├── LoginForm.tsx
│   │   ├── SignUpForm.tsx
│   │   └── ForgotPasswordForm.tsx
│   ├── hooks/
│   │   └── useAuth.ts
│   ├── api/
│   │   └── auth-service.ts
│   ├── types/
│   │   └── auth.types.ts
│   └── views/
│       ├── LoginView.tsx
│       ├── SignUpView.tsx
│       └── ForgotPasswordView.tsx
│
├── exams/
│   ├── components/
│   │   ├── QuestionCard.tsx
│   │   ├── ExamTimer.tsx
│   │   └── CreateExamModal.tsx
│   ├── hooks/
│   │   ├── useExamAttempt.ts
│   │   ├── useExamQuestions.ts
│   │   └── useSubmitExam.ts
│   ├── api/
│   │   └── exams-service.ts
│   └── views/
│       ├── ExamListView.tsx
│       ├── TakeExamView.tsx
│       └── ExamResultsView.tsx
│
├── courses/
│   ├── components/
│   │   ├── SubjectCard.tsx
│   │   └── TopicCard.tsx
│   ├── hooks/
│   │   └── useCourses.ts
│   ├── api/
│   │   └── courses-service.ts
│   └── views/
│       ├── CoursesListView.tsx
│       └── CourseDetailView.tsx
│
└── dashboard/
    ├── components/
    │   ├── ProgressChart.tsx
    │   ├── AttemptHistory.tsx
    │   └── QuickAccess.tsx
    ├── hooks/
    │   └── useDashboardStats.ts
    └── views/
        └── DashboardView.tsx
```

---

#### 2.2 Migrar Feature Auth (2 días)

**Paso 1: Mover componentes**
```bash
mv components/login-form.tsx src/features/auth/components/LoginForm.tsx
mv components/sign-up-form.tsx src/features/auth/components/SignUpForm.tsx
mv components/forgot-password-form.tsx src/features/auth/components/ForgotPasswordForm.tsx
mv components/update-password-form.tsx src/features/auth/components/UpdatePasswordForm.tsx
```

**Paso 2: Crear Views**
```tsx
// src/features/auth/views/LoginView.tsx
import { LoginForm } from '../components/LoginForm';

export function LoginView() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full">
        <h1 className="text-3xl font-bold mb-8">Iniciar Sesión</h1>
        <LoginForm />
      </div>
    </div>
  );
}
```

**Paso 3: Actualizar páginas app/**
```tsx
// app/auth/login/page.tsx
import { LoginView } from '@/src/features/auth/views/LoginView';

export default function LoginPage() {
  return <LoginView />;
}
```

**Repetir para:** sign-up, forgot-password, update-password

---

#### 2.3 Migrar Feature Exams (3 días)

**Componentes a migrar:**
- `QuestionCard` → `src/features/exams/components/QuestionCard.tsx`
- `ExamTimer` → `src/features/exams/components/ExamTimer.tsx`
- `CreateExamModal` → `src/features/exams/components/CreateExamModal.tsx`

**Crear hooks:**
```tsx
// src/features/exams/hooks/useExamAttempt.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as examsService from '../api/exams-service';

export function useExamAttempt(attemptId: string) {
  return useQuery({
    queryKey: ['exam-attempt', attemptId],
    queryFn: () => examsService.getExamAttempt(attemptId),
  });
}

export function useSaveAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: examsService.saveUserAnswer,
    onSuccess: (data, variables) => {
      // Invalidar cache del intento
      queryClient.invalidateQueries(['exam-attempt', variables.attemptId]);
    },
  });
}
```

**Crear Views:**
```tsx
// src/features/exams/views/TakeExamView.tsx
'use client';
import { useParams } from 'next/navigation';
import { useExamAttempt, useExamQuestions } from '../hooks';
import { QuestionCard } from '../components/QuestionCard';
import { ExamTimer } from '../components/ExamTimer';

export function TakeExamView() {
  const { exam_id } = useParams();
  const { data: attempt, isLoading } = useExamAttempt(exam_id);
  const { data: questions } = useExamQuestions(exam_id);

  if (isLoading) return <div>Cargando...</div>;

  return (
    <div>
      <ExamTimer endTime={attempt.endTime} />
      {questions?.map(q => (
        <QuestionCard key={q.id} question={q} attemptId={attempt.id} />
      ))}
    </div>
  );
}
```

**Actualizar páginas:**
```tsx
// app/protected/ensayos/[exam_id]/page.tsx
import { TakeExamView } from '@/src/features/exams/views/TakeExamView';

export default function TakeExamPage() {
  return <TakeExamView />;
}
```

---

#### 2.4 Migrar Features Courses y Dashboard (2 días)

Similar a exams, pero más simple. Seguir mismo patrón:
1. Mover componentes a `src/features/[feature]/components/`
2. Crear hooks en `src/features/[feature]/hooks/`
3. Crear Views en `src/features/[feature]/views/`
4. Actualizar imports en `app/**`

---

### ✅ Entregables Semana 3-4
- [ ] Estructura `src/features/` completa
- [ ] Feature auth migrado 100%
- [ ] Feature exams migrado 100%
- [ ] Feature courses migrado 80%
- [ ] Feature dashboard migrado 80%
- [ ] Todos los imports actualizados
- [ ] Build sin errores

**Criterio éxito:** `npm run build` exitoso, app funciona igual que antes

---

## 📅 SEMANA 5-6: PREPARACIÓN IA + TABLAS SUPABASE

### 🎯 Objetivos
- Crear tablas Supabase para features IA
- Implementar estructura de prompts
- Crear componentes UI para IA (sin API key aún)
- Preparar endpoints (mock responses)

### 📋 Tareas

#### 3.1 Crear Tablas Supabase (1 día)

```sql
-- migrations/003_ai_tables.sql

-- Tabla para explicaciones IA
CREATE TABLE ai_explanations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  attempt_id UUID REFERENCES exam_attempts(id) ON DELETE CASCADE,
  selected_answer TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  model TEXT NOT NULL, -- 'gpt-4o-mini', 'gpt-4', etc
  prompt_tokens INT,
  completion_tokens INT,
  total_cost DECIMAL(10, 6),
  latency_ms INT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ai_explanations_user ON ai_explanations(user_id);
CREATE INDEX idx_ai_explanations_question ON ai_explanations(question_id);

-- Tabla para chat history
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  metadata JSONB, -- { subjectId, topicId, etc }
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_user ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at DESC);

-- Tabla para AI usage logs
CREATE TABLE ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  feature TEXT NOT NULL, -- 'explain', 'generate', 'chat', 'analyze'
  model TEXT NOT NULL,
  prompt_tokens INT NOT NULL,
  completion_tokens INT NOT NULL,
  total_cost DECIMAL(10, 6) NOT NULL,
  latency_ms INT,
  cached BOOLEAN DEFAULT FALSE,
  error TEXT, -- Si hubo error
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ai_usage_logs_user ON ai_usage_logs(user_id);
CREATE INDEX idx_ai_usage_logs_feature ON ai_usage_logs(feature);
CREATE INDEX idx_ai_usage_logs_created ON ai_usage_logs(created_at DESC);

-- View para analytics
CREATE VIEW ai_cost_summary AS
SELECT
  DATE(created_at) as date,
  feature,
  COUNT(*) as total_requests,
  SUM(total_cost) as total_cost,
  AVG(latency_ms) as avg_latency_ms,
  SUM(CASE WHEN cached THEN 1 ELSE 0 END) as cached_requests
FROM ai_usage_logs
GROUP BY DATE(created_at), feature;
```

**Ejecutar:**
```bash
psql -h [SUPABASE_HOST] -U postgres -d postgres -f migrations/003_ai_tables.sql
```

---

#### 3.2 Estructura de Prompts (1 día)

```typescript
// src/lib/prompts/explain-prompt.ts
export interface ExplainPromptParams {
  questionContent: string;
  selectedAnswer: string;
  correctAnswer: string;
  distractors: string[];
  explanation: string;
  topicName: string;
  subjectName: string;
  difficulty: 'facil' | 'medio' | 'dificil';
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

**FORMATO DE RESPUESTA (máximo 250 palabras):**

1. **Por qué tu respuesta es incorrecta:**
   [Explica el error conceptual específico que cometió el estudiante]

2. **Por qué la respuesta correcta es "${params.correctAnswer}":**
   [Explica paso a paso el razonamiento correcto]

3. **Cómo evitar este error en el futuro:**
   [Da un tip específico y memorable]

**TONO:** Amable, educativo, motivador. Sin emojis. Lenguaje natural de Chile.
`.trim();
}
```

**Crear también:**
- `src/lib/prompts/generate-prompt.ts` (generar preguntas)
- `src/lib/prompts/tutor-prompt.ts` (chatbot)
- `src/lib/prompts/analyze-prompt.ts` (análisis rendimiento)

---

#### 3.3 Cliente OpenAI Mock (1 día)

```typescript
// src/lib/api/ai.ts
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
const MOCK_RESPONSES = IS_DEVELOPMENT && !process.env.OPENAI_API_KEY;

export async function generateCompletion(
  prompt: string,
  options?: {
    model?: 'gpt-4o-mini' | 'gpt-4';
    temperature?: number;
    maxTokens?: number;
  }
): Promise<string> {
  // Si no hay API key, retornar respuesta mock
  if (MOCK_RESPONSES) {
    console.log('[AI Mock] Generating mock response...');
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simular latency
    
    return `
**RESPUESTA MOCK (configurar OPENAI_API_KEY)**

Esta es una explicación de ejemplo que aparecería aquí.

1. Tu respuesta fue incorrecta porque...
2. La respuesta correcta es...
3. Para evitar este error...

[Configurar API key en .env para ver respuestas reales]
    `.trim();
  }

  // Usar OpenAI real
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const response = await openai.chat.completions.create({
    model: options?.model || 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: options?.temperature || 0.7,
    max_tokens: options?.maxTokens || 500,
  });

  return response.choices[0].message.content || '';
}
```

---

#### 3.4 Componente UI AiExplanation (1 día)

```tsx
// src/features/exams/components/AiExplanation.tsx
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
  attemptId,
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
        throw new Error('Failed to generate explanation');
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
    <div className="space-y-4 mt-6">
      {!explanation && (
        <Button
          onClick={handleGetExplanation}
          disabled={loading}
          variant="outline"
          className="w-full border-purple-200 hover:bg-purple-50"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generando explicación personalizada...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              ¿Necesitas más ayuda? Pregúntale a la IA
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
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-purple-200">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold text-lg text-purple-900">
              Explicación Personalizada
            </h3>
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

**Integrar en QuestionCard:**
```tsx
// src/features/exams/components/QuestionCard.tsx
import { AiExplanation } from './AiExplanation';

// Agregar al final del componente, después de la explicación estática:
{showExplanation && !isCorrect && (
  <AiExplanation
    questionId={question.id}
    selectedAnswer={selectedOption}
    attemptId={attemptId}
  />
)}
```

---

#### 3.5 Endpoint Mock /api/ai/explain (1 día)

```typescript
// app/api/ai/explain/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildExplainPrompt } from '@/src/lib/prompts/explain-prompt';
import { generateCompletion } from '@/src/lib/api/ai';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Autenticación
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parsear body
    const { questionId, selectedAnswer, attemptId } = await request.json();

    if (!questionId || !selectedAnswer || !attemptId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 3. Obtener pregunta de Supabase
    const { data: question, error: dbError } = await supabase
      .from('questions')
      .select(`
        *,
        topics(
          name,
          subjects(name)
        )
      `)
      .eq('id', questionId)
      .single();

    if (dbError || !question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
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

    // 5. Generar explicación con IA (o mock)
    const aiExplanation = await generateCompletion(prompt, {
      model: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 400,
    });

    const latencyMs = Date.now() - startTime;

    // 6. Guardar en DB
    const { error: insertError } = await supabase.from('ai_explanations').insert({
      user_id: user.id,
      question_id: questionId,
      attempt_id: attemptId,
      selected_answer: selectedAnswer,
      ai_response: aiExplanation,
      model: 'gpt-4o-mini',
      prompt_tokens: 0, // Calcular cuando tengamos API real
      completion_tokens: 0,
      total_cost: 0,
      latency_ms: latencyMs,
    });

    if (insertError) {
      console.error('Failed to save AI explanation:', insertError);
    }

    // 7. Retornar
    return NextResponse.json({
      explanation: aiExplanation,
      mock: !process.env.OPENAI_API_KEY,
    });

  } catch (error) {
    console.error('AI Explain Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

### ✅ Entregables Semana 5-6
- [ ] Tablas Supabase creadas (ai_explanations, chat_messages, ai_usage_logs)
- [ ] Prompts templates listos
- [ ] Cliente AI con mock responses
- [ ] Componente AiExplanation funcional (modo mock)
- [ ] Endpoint /api/ai/explain funcionando
- [ ] Integración en QuestionCard

**Criterio éxito:** Botón "Pregúntale a la IA" funciona (muestra mock), UI correcta

---

## 📅 SEMANA 7-8: INTEGRACIÓN OPENAI REAL + ANALYTICS

### 🎯 Objetivos
- Integrar API key de OpenAI (cuando esté disponible)
- Implementar rate limiting
- Configurar analytics de uso IA
- Testing y optimización

### 📋 Tareas

#### 4.1 Configurar OpenAI API Key (15 min)

```bash
# .env
OPENAI_API_KEY=sk-tu-key-real-aqui
OPENAI_ORG_ID=org-tu-org-aqui  # Opcional
```

```typescript
// Verificar en src/lib/api/ai.ts
import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  console.warn('⚠️  OPENAI_API_KEY not set - using mock responses');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID,
});
```

**Deploy variables en Vercel:**
```bash
vercel env add OPENAI_API_KEY
# Pegar key cuando lo pida
vercel env add OPENAI_ORG_ID
```

---

#### 4.2 Rate Limiting con Upstash Redis (2 días)

```bash
npm install @upstash/redis @upstash/ratelimit
```

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Crear cuenta gratis en upstash.com
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

// 10 requests por hora por usuario para IA
export const aiRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  analytics: true,
  prefix: 'ai',
});

// Uso en endpoint:
export async function checkRateLimit(userId: string): Promise<boolean> {
  const { success, limit, reset, remaining } = await aiRatelimit.limit(userId);

  if (!success) {
    console.log(`Rate limit exceeded for user ${userId}`);
    console.log(`Limit: ${limit}, Remaining: ${remaining}, Reset: ${new Date(reset)}`);
  }

  return success;
}
```

**Integrar en /api/ai/explain:**
```typescript
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Rate limit check
  const allowed = await checkRateLimit(user!.id);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again in 1 hour.' },
      { status: 429 }
    );
  }

  // ... resto del código
}
```

---

#### 4.3 Logging de Costos (1 día)

```typescript
// src/lib/api/ai.ts
import { createClient } from '@/lib/supabase/server';

interface CompletionMetrics {
  promptTokens: number;
  completionTokens: number;
  totalCost: number;
  latencyMs: number;
}

export async function generateCompletionWithMetrics(
  prompt: string,
  userId: string,
  feature: string,
  options?: { model?: 'gpt-4o-mini' | 'gpt-4' }
): Promise<{ content: string; metrics: CompletionMetrics }> {
  const startTime = Date.now();
  const model = options?.model || 'gpt-4o-mini';

  const response = await openai.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
  });

  const latencyMs = Date.now() - startTime;
  const usage = response.usage!;

  // Calcular costo (precios Feb 2024)
  const costs = {
    'gpt-4o-mini': { input: 0.15 / 1_000_000, output: 0.60 / 1_000_000 },
    'gpt-4': { input: 30 / 1_000_000, output: 60 / 1_000_000 },
  };

  const cost = costs[model];
  const totalCost =
    usage.prompt_tokens * cost.input +
    usage.completion_tokens * cost.output;

  // Guardar en ai_usage_logs
  const supabase = await createClient();
  await supabase.from('ai_usage_logs').insert({
    user_id: userId,
    feature,
    model,
    prompt_tokens: usage.prompt_tokens,
    completion_tokens: usage.completion_tokens,
    total_cost: totalCost,
    latency_ms: latencyMs,
    cached: false,
  });

  return {
    content: response.choices[0].message.content || '',
    metrics: {
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      totalCost,
      latencyMs,
    },
  };
}
```

---

#### 4.4 Dashboard de Analytics IA (Admin) (2 días)

```tsx
// app/admin/ai-analytics/page.tsx
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';

export default async function AiAnalyticsPage() {
  const supabase = await createClient();

  // Stats totales
  const { data: totalStats } = await supabase
    .from('ai_usage_logs')
    .select('feature, total_cost.sum(), count(*)')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  // Top usuarios
  const { data: topUsers } = await supabase
    .from('ai_usage_logs')
    .select('user_id, count(*), total_cost.sum()')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('count', { ascending: false })
    .limit(10);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">AI Analytics</h1>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-6">
          <h3 className="text-sm text-gray-600">Total Requests (30d)</h3>
          <p className="text-3xl font-bold">{totalStats?.count || 0}</p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm text-gray-600">Total Cost (30d)</h3>
          <p className="text-3xl font-bold">
            ${(totalStats?.sum || 0).toFixed(2)}
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm text-gray-600">Avg Cost per Request</h3>
          <p className="text-3xl font-bold">
            ${((totalStats?.sum || 0) / (totalStats?.count || 1)).toFixed(4)}
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Top 10 Users (7d)</h2>
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">User ID</th>
              <th className="text-right p-2">Requests</th>
              <th className="text-right p-2">Cost</th>
            </tr>
          </thead>
          <tbody>
            {topUsers?.map(user => (
              <tr key={user.user_id} className="border-b">
                <td className="p-2 font-mono text-sm">
                  {user.user_id?.substring(0, 8)}...
                </td>
                <td className="text-right p-2">{user.count}</td>
                <td className="text-right p-2">${user.sum.toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
```

---

#### 4.5 Testing IA Features (2 días)

```typescript
// src/features/exams/components/AiExplanation.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AiExplanation } from './AiExplanation';

// Mock fetch
global.fetch = vi.fn();

describe('AiExplanation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows button initially', () => {
    render(
      <AiExplanation
        questionId="q1"
        selectedAnswer="A"
        attemptId="a1"
      />
    );

    expect(screen.getByText(/Pregúntale a la IA/i)).toBeInTheDocument();
  });

  it('fetches and displays explanation on click', async () => {
    const mockExplanation = 'Esta es una explicación mock';

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ explanation: mockExplanation }),
    });

    render(
      <AiExplanation
        questionId="q1"
        selectedAnswer="A"
        attemptId="a1"
      />
    );

    const button = screen.getByRole('button');
    await userEvent.click(button);

    // Debe mostrar loading
    expect(screen.getByText(/Generando/i)).toBeInTheDocument();

    // Esperar respuesta
    await waitFor(() => {
      expect(screen.getByText(mockExplanation)).toBeInTheDocument();
    });

    // Verificar fetch llamado correctamente
    expect(fetch).toHaveBeenCalledWith('/api/ai/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionId: 'q1',
        selectedAnswer: 'A',
        attemptId: 'a1',
      }),
    });
  });

  it('shows error on failure', async () => {
    (fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(
      <AiExplanation
        questionId="q1"
        selectedAnswer="A"
        attemptId="a1"
      />
    );

    await userEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText(/No pudimos generar/i)).toBeInTheDocument();
    });
  });
});
```

---

### ✅ Entregables Semana 7-8
- [ ] OpenAI API key configurada en producción
- [ ] Rate limiting implementado (Upstash Redis)
- [ ] Logging de costos funcionando
- [ ] Dashboard de analytics IA (admin)
- [ ] Tests de componentes IA (>80% coverage)
- [ ] Documentación de uso

**Criterio éxito:** Explicaciones IA funcionan en producción, costos trackeados, rate limits activos

---

## 🎯 RESUMEN EJECUTIVO

### Semanas 1-2: Fundamentos ⚙️
**Objetivo:** Mejorar MVP actual  
**Tiempo:** 2 semanas  
**Esfuerzo:** 40-50 horas  
**Output:** React Query, error boundaries, form validation, testing setup

### Semanas 3-4: Arquitectura 🏗️
**Objetivo:** Migrar a feature-first  
**Tiempo:** 2 semanas  
**Esfuerzo:** 50-60 horas  
**Output:** `src/features/` completo, Views layer, código más mantenible

### Semanas 5-6: Preparación IA 🤖
**Objetivo:** Todo listo excepto API key  
**Tiempo:** 2 semanas  
**Esfuerzo:** 40-50 horas  
**Output:** Tablas DB, prompts, componentes UI, endpoints (mock)

### Semanas 7-8: IA en Producción 🚀
**Objetivo:** OpenAI integrado y monitoreado  
**Tiempo:** 2 semanas  
**Esfuerzo:** 40-50 horas  
**Output:** IA funcionando, rate limiting, analytics, tests

---

## 📊 MÉTRICAS DE ÉXITO

### Técnicas
- ✅ Build time < 5s
- ✅ Test coverage > 60%
- ✅ TypeScript errors: 0
- ✅ Lighthouse score > 90
- ✅ IA latency < 3s

### Negocio
- ✅ Engagement +30% (tiempo en plataforma)
- ✅ Retención +20% (usuarios que vuelven)
- ✅ NPS > 50 (satisfacción)
- ✅ Costo IA < $500/mes (1000 usuarios)

### Producto
- ✅ 100% rutas responsive
- ✅ 0 bugs críticos en producción
- ✅ <1% error rate en API
- ✅ Feature IA usada por >40% usuarios

---

## 🚨 RIESGOS Y MITIGACIÓN

### Riesgo 1: API key OpenAI demora
**Impacto:** Alto  
**Mitigación:** Semanas 5-6 preparan TODO con mocks, API key solo necesaria en semana 7

### Riesgo 2: Costos IA explotan
**Impacto:** Medio  
**Mitigación:** Rate limiting desde día 1, alertas en dashboard si >$100/día

### Riesgo 3: Breaking changes en migración
**Impacto:** Alto  
**Mitigación:** Tests automatizados, migración incremental, feature flags

### Riesgo 4: Latencia IA afecta UX
**Impacto:** Medio  
**Mitigación:** Streaming responses, skeletons loading, timeout 5s

---

## 📞 PRÓXIMOS PASOS INMEDIATOS

### Esta semana:
1. ✅ Setup React Query (día 1-2)
2. ✅ Implementar error boundaries (día 3)
3. ✅ Agregar Zod validation en login/signup (día 4-5)

### Próxima semana:
1. ✅ Setup Vitest + primeros tests
2. ✅ Crear estructura `src/features/`
3. ✅ Migrar feature auth completo

**¿Listo para empezar?** 🚀

