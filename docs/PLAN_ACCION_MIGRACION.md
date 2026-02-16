# Plan de Acción: Adopción de Arquitectura Feature-First

## 🚀 Quick Start (Día 1)

### Paso 1: Crear la estructura base

```bash
mkdir -p src/features/{auth,exams,courses,dashboard,admin}
mkdir -p src/lib/api
mkdir -p src/hooks
mkdir -p src/types
```

### Paso 2: Identificar qué va a cada feature

| Archivo Actual | Feature | Nuevo Destino |
|--|--|--|
| `components/login-form.tsx` | auth | `src/features/auth/components/LoginForm.tsx` |
| `components/sign-up-form.tsx` | auth | `src/features/auth/components/SignUpForm.tsx` |
| `components/forgot-password-form.tsx` | auth | `src/features/auth/components/ForgotPasswordForm.tsx` |
| `components/update-password-form.tsx` | auth | `src/features/auth/components/UpdatePasswordForm.tsx` |
| `components/exam/*` | exams | `src/features/exams/components/*` |
| `components/dashboard/*` | dashboard | `src/features/dashboard/components/*` |
| `lib/supabase/*` | (todas) | `src/lib/api/*` |

---

## 📝 Implementación Detallada

### ETAPA 1: API Client Organization

**Archivo:** `src/lib/api/client.ts`
```typescript
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Base Supabase client
export const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Helper para manejo de errores
export function handleSupabaseError(error: any) {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Error desconocido en Supabase';
}

// Retry logic (opcional, para robustez)
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return withRetry(fn, retries - 1);
    }
    throw error;
  }
}
```

**Archivo:** `src/lib/api/auth.ts`
```typescript
import { supabase, handleSupabaseError } from './client';

export const authAPI = {
  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw new Error(handleSupabaseError(error));
    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new Error(handleSupabaseError(error));
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(handleSupabaseError(error));
  },

  async getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw new Error(handleSupabaseError(error));
  },

  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(handleSupabaseError(error));
  },
};
```

**Archivo:** `src/lib/api/exams.ts`
```typescript
import { supabase, handleSupabaseError, withRetry } from './client';
import type { Exam, Question, ExamAttempt, UserAnswer } from '@/features/exams/types/exam.types';

export const examsAPI = {
  async getExams() {
    const { data, error } = await withRetry(() =>
      supabase
        .from('exams')
        .select('id, title, duration_minutes, created_at')
    );
    if (error) throw new Error(handleSupabaseError(error));
    return data as Exam[];
  },

  async getExamById(examId: string) {
    const { data, error } = await supabase
      .from('exams')
      .select('id, title, duration_minutes, created_at')
      .eq('id', examId)
      .single();
    if (error) throw new Error(handleSupabaseError(error));
    return data as Exam;
  },

  async getExamQuestions(examId: string) {
    const { data: examQuestions, error: error1 } = await supabase
      .from('exam_questions')
      .select('question_id')
      .eq('exam_id', examId);

    if (error1) throw new Error(handleSupabaseError(error1));

    const questionIds = examQuestions?.map(eq => eq.question_id) || [];
    
    if (questionIds.length === 0) return [];

    const { data, error: error2 } = await supabase
      .from('questions')
      .select('id, content, image_url, difficulty, correct_answer, distractors, explanation')
      .in('id', questionIds);

    if (error2) throw new Error(handleSupabaseError(error2));
    return data as Question[];
  },

  async createExamAttempt(userId: string, examId: string) {
    const { data, error } = await supabase
      .from('exam_attempts')
      .insert([{
        user_id: userId,
        exam_id: examId,
        status: 'en_progreso',
      }])
      .select()
      .single();

    if (error) throw new Error(handleSupabaseError(error));
    return data as ExamAttempt;
  },

  async submitAnswer(attemptId: string, questionId: string, selectedOption: string | null, correctAnswer: string) {
    const isCorrect = selectedOption === correctAnswer;
    const { error } = await supabase
      .from('user_answers')
      .insert([{
        attempt_id: attemptId,
        question_id: questionId,
        selected_option: selectedOption,
        is_correct: isCorrect,
      }]);

    if (error) throw new Error(handleSupabaseError(error));
    return isCorrect;
  },

  async finishExam(
    attemptId: string,
    stats: { correct: number; incorrect: number; omitted: number; score: number }
  ) {
    const { error } = await supabase
      .from('exam_attempts')
      .update({
        status: 'completado',
        finished_at: new Date().toISOString(),
        score_total: stats.score,
        correct_count: stats.correct,
        incorrect_count: stats.incorrect,
        omitted_count: stats.omitted,
      })
      .eq('id', attemptId);

    if (error) throw new Error(handleSupabaseError(error));
  },
};
```

**Archivo:** `src/lib/api/index.ts` (Barrel export)
```typescript
export { supabase } from './client';
export { authAPI } from './auth';
export { examsAPI } from './exams';
export { coursesAPI } from './courses';
export { dashboardAPI } from './dashboard';
```

---

### ETAPA 2: Types Compartidos y Por Feature

**Archivo:** `src/types/common.ts`
```typescript
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface ErrorResponse {
  message: string;
  code?: string;
}

export interface ApiResponse<T> {
  data: T;
  error?: ErrorResponse;
}
```

**Archivo:** `src/features/exams/types/exam.types.ts`
```typescript
export interface Exam {
  id: string;
  title: string;
  duration_minutes: number;
  created_at: string;
}

export interface Question {
  id: string;
  content: string;
  image_url?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  correct_answer: string;
  distractors: string[];
  explanation: string;
}

export interface ExamAttempt {
  id: string;
  user_id: string;
  exam_id: string;
  status: 'en_progreso' | 'completado';
  score_total: number;
  correct_count: number;
  incorrect_count: number;
  omitted_count: number;
  started_at: string;
  finished_at?: string;
}

export interface UserAnswer {
  question_id: string;
  selected_option: string | null;
  is_correct: boolean;
}

// Para manejo interno del flujo
export interface ExamState {
  exam: Exam | null;
  questions: Question[];
  currentAttempt: ExamAttempt | null;
  currentQuestionIndex: number;
  userAnswers: Map<string, UserAnswer>;
  loading: boolean;
  error: string | null;
}
```

---

### ETAPA 3: Hooks del Feature

**Archivo:** `src/features/exams/hooks/useExam.ts`
```typescript
'use client';

import { useEffect, useState, useCallback } from 'react';
import { examsAPI } from '@/lib/api/exams';
import type { Exam, Question, ExamAttempt } from '../types/exam.types';

export function useExam(examId: string) {
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentAttempt, setCurrentAttempt] = useState<ExamAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initializeExam = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch exam data
      const examData = await examsAPI.getExamById(examId);
      setExam(examData);

      // Fetch questions
      const questionsData = await examsAPI.getExamQuestions(examId);
      setQuestions(questionsData);

      // Create attempt
      const attempt = await examsAPI.createExamAttempt(userId, examId);
      setCurrentAttempt(attempt);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [examId]);

  return {
    exam,
    questions,
    currentAttempt,
    loading,
    error,
    initializeExam,
  };
}
```

**Archivo:** `src/features/exams/hooks/useExamTimer.ts`
```typescript
'use client';

import { useEffect, useState, useCallback } from 'react';

interface UseExamTimerProps {
  totalSeconds: number;
  onTimeUp?: () => void;
}

export function useExamTimer({ totalSeconds, onTimeUp }: UseExamTimerProps) {
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) {
      setIsRunning(false);
      if (timeLeft <= 0 && onTimeUp) {
        onTimeUp();
      }
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, isRunning, onTimeUp]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    timeLeft,
    isRunning,
    setIsRunning,
    formattedTime: formatTime(timeLeft),
  };
}
```

**Archivo:** `src/features/exams/hooks/useExamNavigation.ts`
```typescript
'use client';

import { useState, useCallback } from 'react';

interface UseExamNavigationProps {
  totalQuestions: number;
}

export function useExamNavigation({ totalQuestions }: UseExamNavigationProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToNext = useCallback(() => {
    setCurrentIndex(prev => Math.min(prev + 1, totalQuestions - 1));
  }, [totalQuestions]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  }, []);

  const goToQuestion = useCallback((index: number) => {
    if (index >= 0 && index < totalQuestions) {
      setCurrentIndex(index);
    }
  }, [totalQuestions]);

  const isFirstQuestion = currentIndex === 0;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  return {
    currentIndex,
    isFirstQuestion,
    isLastQuestion,
    goToNext,
    goToPrevious,
    goToQuestion,
  };
}
```

---

### ETAPA 4: Components

**Archivo:** `src/features/exams/components/QuestionCard.tsx`
```typescript
'use client';

import { Loader } from 'lucide-react';
import type { Question } from '../types/exam.types';

interface QuestionCardProps {
  question: Question;
  selectedAnswer: string | null;
  onAnswerSelected: (answer: string) => void;
  loading?: boolean;
}

export function QuestionCard({
  question,
  selectedAnswer,
  onAnswerSelected,
  loading = false,
}: QuestionCardProps) {
  const options = [question.correct_answer, ...question.distractors].sort();

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      {/* Question */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          {question.content}
        </h2>
        {question.image_url && (
          <img
            src={question.image_url}
            alt="Question illustration"
            className="max-w-sm rounded-lg mt-3"
          />
        )}
        <div className="mt-2 text-sm text-gray-500">
          Dificultad:{' '}
          <span className="font-medium capitalize">{question.difficulty}</span>
        </div>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {options.map((option, idx) => (
          <button
            key={idx}
            onClick={() => !loading && onAnswerSelected(option)}
            disabled={loading}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
              selectedAnswer === option
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-gray-50 hover:border-blue-300'
            } ${loading && 'opacity-50 cursor-not-allowed'}`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedAnswer === option
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}
              >
                {selectedAnswer === option && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
              <span className="text-gray-800">{option}</span>
            </div>
          </button>
        ))}
      </div>

      {loading && (
        <div className="mt-4 flex items-center justify-center gap-2 text-gray-500">
          <Loader className="animate-spin h-4 w-4" />
          <span>Guardando respuesta...</span>
        </div>
      )}
    </div>
  );
}
```

**Archivo:** `src/features/exams/components/ExamTimer.tsx`
```typescript
'use client';

import { Clock, AlertCircle } from 'lucide-react';

interface ExamTimerProps {
  formattedTime: string;
  isWarning: boolean;
  isCritical: boolean;
}

export function ExamTimer({
  formattedTime,
  isWarning,
  isCritical,
}: ExamTimerProps) {
  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold ${
      isCritical
        ? 'bg-red-100 text-red-700'
        : isWarning
        ? 'bg-yellow-100 text-yellow-700'
        : 'bg-blue-100 text-blue-700'
    }`}>
      {isCritical ? (
        <AlertCircle className="h-5 w-5" />
      ) : (
        <Clock className="h-5 w-5" />
      )}
      <span className="text-lg">{formattedTime}</span>
    </div>
  );
}
```

---

### ETAPA 5: Views

**Archivo:** `src/features/exams/views/ExamFlowPageView.tsx`
```typescript
'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ExamFlowView } from './ExamFlowView';
import { Loader } from 'lucide-react';
import { Suspense } from 'react';

interface ExamFlowPageViewProps {
  examId: string;
}

export function ExamFlowPageView({ examId }: ExamFlowPageViewProps) {
  const router = useRouter();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="animate-spin" />
      </div>
    );
  }

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader className="animate-spin" />
        </div>
      }
    >
      <ExamFlowView examId={examId} userId={user.id} />
    </Suspense>
  );
}
```

**Archivo:** `src/features/exams/views/ExamFlowView.tsx`
```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useExam } from '../hooks/useExam';
import { useExamTimer } from '../hooks/useExamTimer';
import { useExamNavigation } from '../hooks/useExamNavigation';
import { QuestionCard } from '../components/QuestionCard';
import { ExamTimer } from '../components/ExamTimer';
import { examsAPI } from '@/lib/api/exams';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import type { UserAnswer } from '../types/exam.types';

interface ExamFlowViewProps {
  examId: string;
  userId: string;
}

export function ExamFlowView({ examId, userId }: ExamFlowViewProps) {
  const router = useRouter();
  const { exam, questions, currentAttempt, loading, error, initializeExam } = useExam(examId);
  const { currentIndex, isFirstQuestion, isLastQuestion, goToNext, goToPrevious, goToQuestion } =
    useExamNavigation({ totalQuestions: questions.length });
  
  const [userAnswers, setUserAnswers] = useState<Map<string, UserAnswer>>(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const durationSeconds = exam ? exam.duration_minutes * 60 : 3600;
  const { formattedTime, timeLeft, setIsRunning } = useExamTimer({
    totalSeconds: durationSeconds,
    onTimeUp: () => handleFinishExam(),
  });

  // Initialize exam
  useEffect(() => {
    initializeExam(userId);
  }, [examId, userId, initializeExam]);

  // Auto-finish when time runs out
  useEffect(() => {
    if (timeLeft === 0) {
      handleFinishExam();
      setIsRunning(false);
    }
  }, [timeLeft, setIsRunning]);

  const handleAnswerSelected = (answer: string) => {
    const currentQuestion = questions[currentIndex];
    setUserAnswers(prev => {
      const newAnswers = new Map(prev);
      newAnswers.set(currentQuestion.id, {
        question_id: currentQuestion.id,
        selected_option: answer,
        is_correct: answer === currentQuestion.correct_answer,
      });
      return newAnswers;
    });
  };

  const handleFinishExam = async () => {
    if (!currentAttempt) return;

    try {
      setIsSubmitting(true);

      // Submit all answers
      for (const [questionId, answer] of userAnswers.entries()) {
        const question = questions.find(q => q.id === questionId);
        if (question && answer.selected_option) {
          await examsAPI.submitAnswer(
            currentAttempt.id,
            questionId,
            answer.selected_option,
            question.correct_answer
          );
        }
      }

      // Calculate stats
      let correctCount = 0;
      let incorrectCount = 0;
      let omittedCount = 0;

      questions.forEach(question => {
        const answer = userAnswers.get(question.id);
        if (!answer || answer.selected_option === null) {
          omittedCount++;
        } else if (answer.is_correct) {
          correctCount++;
        } else {
          incorrectCount++;
        }
      });

      const score = Math.round(500 + ((correctCount / questions.length) - 0.5) * 100);

      // Update exam attempt
      await examsAPI.finishExam(currentAttempt.id, {
        correct: correctCount,
        incorrect: incorrectCount,
        omitted: omittedCount,
        score,
      });

      // Redirect to results
      router.push(`/protected/ensayos/${examId}/resultados?attempt_id=${currentAttempt.id}`);
    } catch (err) {
      console.error('Error finishing exam:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !exam || questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="text-red-700">{error}</p>
            </div>
          )}
          {loading && <p className="text-gray-600">Cargando examen...</p>}
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const currentAnswer = userAnswers.get(currentQuestion.id);
  const answeredCount = userAnswers.size;
  const isCritical = timeLeft < 60;
  const isWarning = timeLeft < 300;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-sm z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{exam.title}</h1>
              <p className="text-sm text-gray-600">
                Pregunta {currentIndex + 1} de {questions.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-center">
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
                  style={{
                    width: `${((answeredCount + 1) / (questions.length + 1)) * 100}%`,
                  }}
                />
              </div>
              <p className="text-xs text-gray-600">
                {answeredCount} / {questions.length} respondidas
              </p>
            </div>

            <ExamTimer
              formattedTime={formattedTime}
              isWarning={isWarning}
              isCritical={isCritical}
            />
          </div>
        </div>
      </div>

      {/* Spacing for fixed header */}
      <div className="h-24" />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        <QuestionCard
          question={currentQuestion}
          selectedAnswer={currentAnswer?.selected_option || null}
          onAnswerSelected={handleAnswerSelected}
          loading={isSubmitting}
        />

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between gap-4">
          <Button
            onClick={goToPrevious}
            disabled={isFirstQuestion}
            variant="outline"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>

          {/* Question indicators */}
          <div className="flex gap-2 flex-wrap justify-center">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => goToQuestion(idx)}
                className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                  idx === currentIndex
                    ? 'bg-blue-600 text-white'
                    : userAnswers.has(q.id)
                    ? 'bg-green-100 text-green-800 border border-green-300'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          {isLastQuestion ? (
            <Button
              onClick={handleFinishExam}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-green-600 to-emerald-600"
            >
              {isSubmitting ? 'Finalizando...' : 'Finalizar'}
            </Button>
          ) : (
            <Button onClick={goToNext}>
              Siguiente
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Archivo:** `src/features/exams/views/index.ts` (Barrel export)
```typescript
export { ExamFlowPageView } from './ExamFlowPageView';
export { ExamFlowView } from './ExamFlowView';
```

---

### ETAPA 6: Actualizar Rutas

**Archivo:** `app/protected/ensayos/[exam_id]/page.tsx` (NUEVA, delgada)
```typescript
import { ExamFlowPageView } from '@/features/exams/views';

export default function Page({ params }: { params: { exam_id: string } }) {
  return <ExamFlowPageView examId={params.exam_id} />;
}
```

---

## 🔄 Migración Hacia Adelante

### Semana 1: Auth Feature
- [ ] Crear estructura base en `src/features/auth/`
- [ ] Mover componentes de auth
- [ ] Crear `useAuth.ts`
- [ ] Actualizar rutas en `app/auth/`

### Semana 2: Exams Feature
- [ ] Crear estructura en `src/features/exams/`
- [ ] Implementar API client para exams
- [ ] Crear todos los hooks
- [ ] Refactor de vistas
- [ ] Tesear

### Semana 3: Dashboard Feature
- [ ] Similar a exams
- [ ] Integrar con nuevos APIs

### Semana 4: Polish + Testing
- [ ] Agregar tests con Vitest
- [ ] Crear Storybook para UI components
- [ ] Refactor final

---

## ✅ Checklist de Validación

Antes de cada commit:
- [ ] ¿Los imports están correctos?
- [ ] ¿No hay ciclos circulares?
- [ ] ¿Los tipos están tipados?
- [ ] ¿Las funciones son testables?
- [ ] ¿Las views son delgadas?
- [ ] ¿Los hooks son reutilizables?

---

## 📚 Guidelines de Code Review

**Aceptar:**
- ✅ Movimiento de archivos que no cambian su lógica
- ✅ Nuevas carpetas siguiendo estructura
- ✅ Refactors de componentes que mejoran mantenibilidad
- ✅ Nuevos API clients bien organizados

**Rechazar:**
- ❌ Lógica de ruta en componentes
- ❌ Imports relativos profundos (ej. `../../../components`)
- ❌ Tipos no definidos
- ❌ Código duplicado
- ❌ Cambios sin tests
