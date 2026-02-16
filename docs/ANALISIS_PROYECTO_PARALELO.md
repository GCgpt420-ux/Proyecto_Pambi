# Análisis: Proyecto Paralelo (ia_bot_v2) vs Proyecto Actual (monica-master)

## 📊 Resumen Ejecutivo

El proyecto paralelo **ia_bot_v2** tiene una arquitectura más madura y escalable, especialmente en:
1. **Estructura feature-first** en el frontend
2. **Separación clara** entre vistas y componentes
3. **Convenciones explícitas** documentadas
4. **Setup de testing y Storybook**
5. **API client mejor organizado** por dominios

El proyecto actual usa Supabase (ventaja de BaaS) pero podría aprovechar los **patrones arquitectónicos** del proyecto paralelo sin romper la integración actual.

---

## 🏗️ Análisis Arquitectónico

### Proyecto Paralelo (ia_bot_v2)
```
tutor-paes-frontend/
├── app/                          # App Router (ruta delgadas)
├── src/
│   ├── features/                 # Feature-first ⭐
│   │   ├── quiz/
│   │   │   ├── views/            # Pantallas/orquestadores
│   │   │   ├── components/       # Componentes reutilizables
│   │   │   ├── hooks/            # Lógica del feature
│   │   │   └── mappers/          # Transformación de datos
│   │   ├── auth/
│   │   ├── dashboard/
│   │   └── admin/
│   ├── lib/
│   │   └── api/                  # API client por dominio
│   ├── components/               # UI globales (layout, etc)
│   ├── design-system/            # Tokens de diseño
│   ├── hooks/                    # Hooks compartidos
│   ├── types/                    # Tipos compartidos
│   └── styles/                   # Estilos globales
└── public/
```

### Proyecto Actual (monica-master)
```
app/
├── page.tsx
├── protected/
├── auth/
└── ...

components/                       # Aplanado, sin agrupación
├── auth-button.tsx
├── login-form.tsx
├── dashboard/
├── exam/
├── layout/
└── ui/

lib/
└── supabase/
    └── ...
```

**Problema**: Una nueva característica requiere buscar en múltiples niveles de profundidad.

---

## ✨ Mejores Prácticas a Adoptar

### 1. **Estructura Feature-First** ⭐ (CRÍTICA)

**Lo que hace bien ia_bot_v2:**
- Agrupa todo lo relacionado a una feature en una carpeta
- Fácil de localizar, entender y mantener
- Escalable: nuevas features sin complejidad creciente

**Cómo implementar en el proyecto actual:**

```
src/features/
├── auth/
│   ├── views/
│   │   ├── LoginView.tsx          # Pantalla login
│   │   ├── SignUpView.tsx         # Pantalla signup
│   │   ├── ForgotPasswordView.tsx
│   │   └── index.ts               # Barrel export
│   ├── components/
│   │   ├── LoginForm.tsx           # (refactor de login-form.tsx)
│   │   ├── SignUpForm.tsx
│   │   └── UpdatePasswordForm.tsx
│   ├── hooks/
│   │   └── useAuth.ts
│   └── mappers/
│       └── authMapper.ts
│
├── dashboard/
│   ├── views/
│   │   ├── DashboardPageView.tsx   # Orquestación + guards
│   │   └── index.ts
│   ├── components/
│   │   ├── ProgressChart.tsx
│   │   ├── ExamCard.tsx
│   │   └── QueryStats.tsx
│   ├── hooks/
│   │   └── useDashboard.ts
│   └── mappers/
│       └── dashboardMapper.ts
│
├── exams/
│   ├── views/
│   │   ├── ExamFlowView.tsx        # Orquestador del examen
│   │   ├── QuestionView.tsx
│   │   ├── ResultsView.tsx
│   │   └── index.ts
│   ├── components/
│   │   ├── QuestionCard.tsx         # (refactor de question-card.tsx)
│   │   ├── ExamTimer.tsx
│   │   └── ResultsDisplay.tsx
│   ├── hooks/
│   │   ├── useExam.ts              # Lógica del flujo
│   │   └── useExamTimer.ts
│   ├── mappers/
│   │   └── examsMapper.ts
│   └── types/
│       └── exam.types.ts
│
├── courses/
│   ├── views/
│   │   ├── CoursesListView.tsx
│   │   ├── CourseDetailView.tsx
│   │   └── index.ts
│   ├── components/
│   │   ├── CourseCard.tsx
│   │   └── TopicCard.tsx
│   ├── hooks/
│   │   └── useCourses.ts
│   └── mappers/
│       └── coursesMapper.ts

└── profile/
    ├── views/
    └── components/
```

**Migración plan:**
- NO es "todo o nada" - puede hacerse incrementalmente
- Empezar con auth y exams (mayores features)
- Mantener componentes globales en `src/components/`

---

### 2. **Separación Views vs Components**

**Concepto clave:**

| **Concepto** | **View** | **Component** |
|--|--|--|
| Responsabilidad | Pantalla completa, navegación, guards | Bloque reutilizable, sin lógica de ruta |
| Contenido | Orquestación, `useSearchParams`, Suspense | Solo presentación + props simples |
| Testing | Integración | Unitario |
| Reutilizable | Normalmente 1 vez | Múltiples veces |

**Ejemplo: Quiz**

❌ Actual (todomezclado):
```tsx
// app/protected/ensayos/[exam_id]/page.tsx
'use client'
export default function ExamPage() {
  const params = useParams(); // Lógica de ruta
  const [questions, setQuestions] = useState([]); // Lógica de estado
  // ... 400 líneas de código
  return <QuestionCard /> // Componente reutilizable
}
```

✅ Propuesto:
```tsx
// app/protected/ensayos/[exam_id]/page.tsx - DELGADO
import { ExamFlowPageView } from "@/features/exams/views";
export default function Page({ params }) {
  return <ExamFlowPageView examId={params.exam_id} />;
}

// src/features/exams/views/ExamFlowPageView.tsx - GUARDIAS + ORQUESTACIÓN
'use client'
export function ExamFlowPageView({ examId }: Props) {
  const router = useRouter();
  const { user } = useAuth(); // Guard
  if (!user) return <Redirect to="/login" />;
  return (
    <Suspense fallback={<Spinner />}>
      <ExamFlowView examId={examId} />
    </Suspense>
  );
}

// src/features/exams/views/ExamFlowView.tsx - PANTALLA DETALLADA
'use client'
export function ExamFlowView({ examId }: Props) {
  const { exam, questions } = useExam(examId);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  // ... lógica del quiz
  return (
    <div className="flex flex-col gap-4">
      <QuestionCard question={questions[currentQuestion]} />
      <NavigationButtons />
    </div>
  );
}

// src/features/exams/components/QuestionCard.tsx - REUTILIZABLE
export function QuestionCard({ question }: Props) {
  return <div>...</div>; // Sin lógica
}
```

---

### 3. **API Client Mejor Organizado**

**Proyecto paralelo:**
```
src/lib/api/
├── client.ts       # Base HTTP client (Fetch + retry logic)
├── auth.ts         # Endpoints de auth
├── quiz.ts         # Endpoints de quiz
├── dashboard.ts    # Endpoints de dashboard
└── catalog.ts      # Endpoints de catálogo
```

**Proyecto actual:**
```
lib/supabase/
├── client.ts       # Cliente Supabase
├── server.ts
└── proxy.ts
```

**Propuesta para Supabase:**
```
src/lib/api/
├── client.ts           # Wrapper base de Supabase
├── auth.ts             # Métodos de autenticación
├── quiz.ts             # Queries/inserts relacionadas a quiz
├── exams.ts            # Queries/inserts de exámenes
├── courses.ts          # Queries/inserts de cursos
├── users.ts            # Profile, settings
└── subscriptions.ts    # Realtime subscriptions

src/lib/supabase/  # Mantener para initialización
├── client.ts       # (simplemente importado de src/lib/api/)
└── server.ts
```

**Ejemplo:**
```typescript
// src/lib/api/exams.ts
import { supabase } from '@/lib/supabase/client';

export const examsAPI = {
  // Fetch exams
  async getExams() {
    const { data, error } = await supabase
      .from('exams')
      .select('*');
    if (error) throw error;
    return data;
  },

  // Get exam by ID
  async getExamById(examId: string) {
    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .eq('id', examId)
      .single();
    if (error) throw error;
    return data;
  },

  // Submit answer
  async submitAnswer(attemptId: string, questionId: string, answer: string) {
    const { error } = await supabase
      .from('user_answers')
      .insert([{ attempt_id: attemptId, question_id: questionId, selected_option: answer }]);
    if (error) throw error;
  },
};
```

---

### 4. **Tipos Compartidos en el Feature**

Proyecto paralelo crea archivo de tipos por feature:

```
src/features/exams/types/
├── exam.types.ts       # Tipos del feature
└── api-contracts.ts    # Contracts con backend
```

**Implementar para Supabase:**
```typescript
// src/features/exams/types/exam.types.ts
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
```

---

### 5. **Hooks por Feature + Compartidos**

**Compartidos (raíz):**
```
src/hooks/
├── useAuth.ts              # Global auth context
├── useUser.ts              # Global user profile
└── useToast.ts             # Global notifications
```

**Feature-specific:**
```
src/features/exams/hooks/
├── useExam.ts              # Fetch exam + questions
├── useExamTimer.ts         # Timer logic
├── useExamAttempt.ts       # Track attempt progress
└── useExamNavigation.ts    # Handle question navigation
```

**Ejemplo: `useExam.ts`**
```typescript
// src/features/exams/hooks/useExam.ts
import { examsAPI } from '@/lib/api/exams';
import type { Exam, Question } from '../types/exam.types';

export function useExam(examId: string) {
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const exam = await examsAPI.getExamById(examId);
        const questions = await examsAPI.getExamQuestions(examId);
        setExam(exam);
        setQuestions(questions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error');
      } finally {
        setLoading(false);
      }
    };

    if (examId) fetchExam();
  }, [examId]);

  return { exam, questions, loading, error };
}
```

---

### 6. **Setup de Testing y Storybook**

**Proyecto paralelo incluye:**
- Vitest para tests unitarios
- Storybook para documentación de componentes
- Testing Library para tests de integración

**Propuesta para proyecto actual:**

```json
{
  "devDependencies": {
    "vitest": "^4.0.18",
    "@testing-library/react": "^16.3.2",
    "@storybook/nextjs": "^10.2.7"
  }
}
```

Esto permitiría:
- ✅ Documentar componentes UI
- ✅ Tests automatizados
- ✅ Evitar regresiones visuales

---

## 🎯 Plan de Migración (Paso a Paso)

### Fase 1: Setup Base (1-2 días)
- [ ] Crear estructura `src/features/` básica
- [ ] Crear `src/lib/api/` con mapeo de endpoints Supabase
- [ ] Crear tipos compartidos

### Fase 2: Refactor Auth (2-3 días)
- [ ] Mover `login-form.tsx` → `src/features/auth/components/`
- [ ] Mover `sign-up-form.tsx` → `src/features/auth/components/`
- [ ] Crear `LoginView.tsx` y `SignUpView.tsx`
- [ ] Crear `useAuth.ts` hook del feature
- [ ] Actualizar rutas en `app/auth/`

### Fase 3: Refactor Exams (3-4 días)
- [ ] Mover componentes exam → `src/features/exams/components/`
- [ ] Crear `ExamFlowView.tsx` con toda la lógica
- [ ] Crear hooks específicos (`useExam.ts`, `useExamTimer.ts`)
- [ ] Crear types en el feature
- [ ] Actualizar rutas en `app/protected/ensayos/`

### Fase 4: Refactor Dashboard (2-3 días)
- [ ] Mover componentes dashboard → `src/features/dashboard/components/`
- [ ] Refactor `DashboardPageView.tsx`
- [ ] Centralizar lógica en `useDashboard.ts`

### Fase 5: Setup Testing + Storybook (3-4 días)
- [ ] Instalar dependencias (Vitest, Storybook)
- [ ] Crear configuración
- [ ] Escribir primeros tests
- [ ] Documentar componentes UI en Storybook

---

## 📋 Checklist de Invariantes (Lo que NO cambiar)

✅ **Mantener intacto:**
- Autenticación con Supabase
- Base de datos (Supabase)
- Configuración de Tailwind
- Componentes UI existentes (solo mover, no reescribir)
- rutas en `app/`

⚠️ **Cambios internos (sin impacto visual):**
- Reorganización de carpetas
- Nuevos hooks para centralizar lógica
- API client más organizado

---

## 🔄 Archivo "migration-map.ts" (Reference)

Para facilitar la transición, crear un archivo de mapeo:

```typescript
// src/lib/migration-map.ts
// Un lugar único para documentar qué se movió dónde

export const MIGRATION_MAP = {
  'components/login-form.tsx': 'src/features/auth/components/LoginForm.tsx',
  'components/sign-up-form.tsx': 'src/features/auth/components/SignUpForm.tsx',
  'components/exam/question-card.tsx': 'src/features/exams/components/QuestionCard.tsx',
  'components/exam/exam-timer.tsx': 'src/features/exams/components/ExamTimer.tsx',
  'components/dashboard/*': 'src/features/dashboard/components/*',
};
```

---

## 📚 Estructuras de Carpeta Finales

### Antes (actual):
```
|-- app/
|-- components/  (20+ archivos mezclados)
|-- lib/
`-- ...
```

### Después (propuesto):
```
|-- app/          (delgadas, solo entradas de ruta)
|-- src/
|   |-- features/  (agrupado por dominio)
|   |   |-- auth/
|   |   |-- exams/
|   |   |-- courses/
|   |   |-- dashboard/
|   |   `-- admin/
|   |-- lib/       (API client, utils, supabase)
|   |   `-- api/
|   |-- components/ (solo globales)
|   |-- hooks/     (compartidos)
|   `-- types/     (compartidos)
|-- public/
`-- ...
```

---

## 💡 Conclusión

El proyecto paralelo **ia_bot_v2** demuestra:
1. ✅ Feature-first funciona bien a escala
2. ✅ Separación de concerns (views/components) reduce bugs
3. ✅ API client organizado es mantenible
4. ✅ Convenciones explícitas ayudan al onboarding

**Recomendación:** Adoptar la estructura feature-first de forma **incremental**. No es un refactor de "una sola vez", sino una serie de mejoras que mejoran mantenibilidad sin comprometer funcionalidad.

El Supabase se mantiene intacto; solo reorganizamos cómo el frontend los consume.
