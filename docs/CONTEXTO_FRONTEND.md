# 📊 CONTEXTO COMPLETO DEL FRONTEND - PAES Pro

**Proyecto:** PAES Pro - Plataforma de preparación PAES  
**Stack Principal:** Next.js 16 + React 19 + Supabase + TypeScript  
**Estado:** MVP funcional, listo para escalar  
**Fecha análisis:** 16 febrero 2026  

---

## 🎯 1. RESUMEN EJECUTIVO

### Propósito
Plataforma educativa para preparación de la Prueba de Acceso a la Educación Superior (PAES) de Chile con:
- ✅ Ensayos PAES simulados cronometrados
- ✅ Seguimiento de progreso por materia/tema
- ✅ Explicaciones de respuestas correctas
- ✅ Dashboard personalizado con estadísticas
- ✅ Gestión de perfil de estudiante

### Estado Actual
- ✅ **Build:** Pasa exitosamente
- ✅ **Deploy:** Vercel con CI/CD automático
- ✅ **Mobile:** Responsive con navegación móvil
- ✅ **Auth:** Supabase funcionando
- ✅ **DB:** Supabase PostgreSQL operacional
- 🔄 **Arquitectura:** En transición a feature-first (Fase 1 completada)

---

## 🏗️ 2. ARQUITECTURA TÉCNICA

### Stack Tecnológico

| Tecnología | Versión | Uso |
|------------|---------|-----|
| **Next.js** | 16.1.5 | Framework React con App Router y Turbopack |
| **React** | 19.0.0 | UI library con React Server Components |
| **TypeScript** | 5.x | Type safety en toda la app |
| **Supabase** | latest | BaaS (Auth + PostgreSQL) |
| **Tailwind CSS** | 3.4.1 | Styling con diseño responsive |
| **Radix UI** | - | Componentes accesibles (dropdown, checkbox, etc) |
| **Lucide React** | 0.511.0 | Iconografía |
| **next-themes** | 0.4.6 | Dark/light mode (no implementado aún) |

### Dependencias Clave
```json
{
  "@supabase/ssr": "latest",
  "@supabase/supabase-js": "latest",
  "@supabase/auth-helpers-nextjs": "^0.15.0",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "tailwind-merge": "^3.3.0"
}
```

---

## 📂 3. ESTRUCTURA DEL PROYECTO

### Árbol de Carpetas

```
monica-master/
├── app/                           # Next.js App Router
│   ├── page.tsx                   # Landing page pública
│   ├── layout.tsx                 # Layout raíz
│   ├── globals.css                # Estilos globales
│   │
│   ├── auth/                      # Rutas de autenticación
│   │   ├── login/page.tsx         # Inicio de sesión
│   │   ├── sign-up/page.tsx       # Registro
│   │   ├── sign-up-success/       # Confirmación email
│   │   ├── forgot-password/       # Recuperar contraseña
│   │   ├── update-password/       # Actualizar contraseña
│   │   ├── error/                 # Página de errores auth
│   │   └── confirm/route.ts       # Callback Supabase
│   │
│   └── protected/                 # Zona autenticada
│       ├── layout.tsx             # Layout dashboard (sidebar + header)
│       ├── page.tsx               # Dashboard principal
│       │
│       ├── cursos/                # Rutas de materias
│       │   ├── page.tsx           # Lista de materias
│       │   └── [subject_id]/      # Detalle materia con topics
│       │       └── page.tsx
│       │
│       ├── ensayos/               # Rutas de ensayos
│       │   ├── page.tsx           # Lista ensayos + crear
│       │   └── [exam_id]/         # Flujo de ensayo
│       │       ├── page.tsx       # Realizar ensayo
│       │       └── resultados/    # Resultados del ensayo
│       │           └── page.tsx
│       │
│       └── perfil/                # Perfil de usuario
│           └── page.tsx
│
├── components/                    # Componentes React
│   ├── auth-button.tsx            # Botón auth condicional
│   ├── login-form.tsx             # Formulario login
│   ├── sign-up-form.tsx           # Formulario registro
│   ├── forgot-password-form.tsx   # Form recuperar contraseña
│   ├── update-password-form.tsx   # Form actualizar contraseña
│   ├── logout-button.tsx          # Botón cerrar sesión
│   │
│   ├── dashboard/                 # Componentes dashboard
│   │   ├── exam-card.tsx          # Card de ensayo
│   │   ├── subject-card.tsx       # Card de materia
│   │   ├── topic-card.tsx         # Card de tema
│   │   ├── progress-chart.tsx     # Gráfico progreso
│   │   ├── attempt-history.tsx    # Historial intentos
│   │   ├── topic-stats.tsx        # Estadísticas por tema
│   │   └── quick-access.tsx       # Accesos rápidos
│   │
│   ├── exam/                      # Componentes de ensayos
│   │   ├── question-card.tsx      # Card de pregunta con opciones
│   │   ├── exam-timer.tsx         # Timer cuenta regresiva
│   │   └── create-exam-modal.tsx  # Modal crear ensayo
│   │
│   ├── layout/                    # Componentes de layout
│   │   ├── header.tsx             # Header dashboard
│   │   ├── sidebar.tsx            # Sidebar desktop
│   │   ├── mobile-nav.tsx         # Nav móvil (bottom)
│   │   └── footer.tsx             # Footer dashboard
│   │
│   └── ui/                        # ShadCN UI components
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── checkbox.tsx
│       ├── dropdown-menu.tsx
│       └── badge.tsx
│
├── lib/                           # Utilidades y configuración
│   ├── utils.ts                   # Helpers (cn, clsx merge)
│   └── supabase/                  # Clientes Supabase
│       ├── client.ts              # Cliente browser
│       ├── server.ts              # Cliente RSC
│       └── proxy.ts               # Proxy para refresh tokens
│
├── src/                           # Nueva arquitectura (Fase 1)
│   ├── lib/api/                   # API clients centralizados
│   │   ├── client.ts              # Cliente base
│   │   ├── auth.ts                # Operaciones auth
│   │   ├── exams.ts               # Operaciones ensayos
│   │   └── courses.ts             # Operaciones materias/topics
│   │
│   ├── types/                     # Tipos TypeScript compartidos
│   │   └── index.ts
│   │
│   ├── hooks/                     # Custom hooks
│   │   └── useAuth.ts             # Hook autenticación
│   │
│   └── README.md                  # Documentación arquitectura
│
├── scripts/                       # Scripts de utilidad
│   └── seed-questions.ts          # Seed preguntas Supabase
│
├── .env                           # Variables de entorno (Supabase)
├── next.config.ts                 # Configuración Next.js
├── tailwind.config.ts             # Configuración Tailwind
├── tsconfig.json                  # Configuración TypeScript
└── package.json                   # Dependencias
```

---

## 🔄 4. FLUJOS PRINCIPALES

### A. Flujo de Autenticación

```mermaid
graph TD
    A[Usuario no autenticado] --> B[Landing Page]
    B --> C{Acción}
    C -->|Login| D[/auth/login]
    C -->|Sign Up| E[/auth/sign-up]
    D --> F[Supabase Auth]
    E --> F
    F -->|Success| G[/protected Dashboard]
    F -->|Email confirm| H[/auth/sign-up-success]
    F -->|Error| I[/auth/error]
```

**Archivos involucrados:**
- `app/auth/login/page.tsx` + `components/login-form.tsx`
- `app/auth/sign-up/page.tsx` + `components/sign-up-form.tsx`
- `lib/supabase/client.ts` para operaciones auth
- `app/auth/confirm/route.ts` para callback Supabase

### B. Flujo de Ensayo (Core Feature)

```mermaid
graph TD
    A[Dashboard] --> B[/protected/ensayos]
    B --> C{Acción}
    C -->|Crear| D[CreateExamModal]
    D --> E[Seleccionar materias/topics/dificultad]
    E --> F[POST exam + exam_questions]
    F --> G[/protected/ensayos/[exam_id]]
    G --> H[Cargar preguntas]
    H --> I[Timer inicia]
    I --> J[Responder preguntas]
    J --> K{Navigator}
    K -->|Siguiente| J
    K -->|Finalizar| L[POST user_answers]
    L --> M[/protected/ensayos/[exam_id]/resultados]
    M --> N[Mostrar puntaje y explicaciones]
```

**Archivos involucrados:**
- `app/protected/ensayos/page.tsx` (lista + modal crear)
- `components/exam/create-exam-modal.tsx` (crear ensayo)
- `app/protected/ensayos/[exam_id]/page.tsx` (realizar ensayo)
- `components/exam/question-card.tsx` (UI pregunta)
- `components/exam/exam-timer.tsx` (timer)
- `app/protected/ensayos/[exam_id]/resultados/page.tsx` (resultados)

**Tablas Supabase:**
```sql
exams → exam_questions → questions → topics → subjects
              ↓
        exam_attempts → user_answers
```

### C. Flujo de Navegación en Cursos

```mermaid
graph TD
    A[Dashboard] --> B[/protected/cursos]
    B --> C[Lista de subjects]
    C --> D[Click subject]
    D --> E[/protected/cursos/[subject_id]]
    E --> F[Lista de topics]
    F --> G[Ver estadísticas por topic]
```

**Archivos involucrados:**
- `app/protected/cursos/page.tsx` (lista materias)
- `components/dashboard/subject-card.tsx`
- `app/protected/cursos/[subject_id]/page.tsx` (topics de materia)
- `components/dashboard/topic-card.tsx`

### D. Flujo de Dashboard

```mermaid
graph TD
    A[Login Success] --> B[/protected]
    B --> C[Cargar usuario]
    C --> D{Tiene attempts?}
    D -->|Sí| E[Mostrar historial + stats]
    D -->|No| F[Estado inicial]
    E --> G[Quick Access Cards]
    F --> G
    G --> H{Acción}
    H -->|Ver cursos| I[/protected/cursos]
    H -->|Crear ensayo| J[/protected/ensayos]
```

**Archivos involucrados:**
- `app/protected/page.tsx` (dashboard principal)
- `components/dashboard/attempt-history.tsx`
- `components/dashboard/progress-chart.tsx`
- `components/dashboard/quick-access.tsx`
- `app/protected/layout.tsx` (sidebar + header + mobile nav)

---

## 🗄️ 5. MODELO DE DATOS (Supabase)

### Esquema PostgreSQL

```sql
-- Usuarios (gestionados por Supabase Auth)
auth.users
  ├── id (uuid, PK)
  ├── email
  ├── created_at
  └── metadata (full_name, etc)

-- Materias
public.subjects
  ├── id (uuid, PK)
  ├── name (text)
  ├── description (text)
  ├── icon_url (text, nullable)
  └── created_at (timestamp)

-- Tópicos por materia
public.topics
  ├── id (uuid, PK)
  ├── subject_id (uuid, FK → subjects.id)
  ├── name (text)
  ├── description (text)
  └── created_at (timestamp)

-- Preguntas
public.questions
  ├── id (uuid, PK)
  ├── topic_id (uuid, FK → topics.id)
  ├── content (text) -- Enunciado pregunta
  ├── image_url (text, nullable)
  ├── difficulty ('facil' | 'medio' | 'dificil')
  ├── correct_answer (text)
  ├── distractors (jsonb) -- Array de opciones incorrectas
  ├── explanation (text)
  └── created_at (timestamp)

-- Ensayos
public.exams
  ├── id (uuid, PK)
  ├── created_by (uuid, FK → auth.users.id, nullable)
  ├── title (text)
  ├── type (text) -- 'oficial', 'personalizado'
  ├── duration_minutes (integer)
  ├── scheduled_at (timestamp, nullable)
  ├── is_active (boolean)
  └── created_at (timestamp)

-- Relación N:N entre exams y questions
public.exam_questions
  ├── exam_id (uuid, FK → exams.id)
  ├── question_id (uuid, FK → questions.id)
  └── PK (exam_id, question_id)

-- Intentos de ensayo por usuario
public.exam_attempts
  ├── id (uuid, PK)
  ├── user_id (uuid, FK → auth.users.id)
  ├── exam_id (uuid, FK → exams.id)
  ├── status ('en_progreso' | 'completado' | 'abandonado')
  ├── score (numeric, nullable)
  ├── started_at (timestamp)
  └── submitted_at (timestamp, nullable)

-- Respuestas por intento
public.user_answers
  ├── attempt_id (uuid, FK → exam_attempts.id)
  ├── question_id (uuid, FK → questions.id)
  ├── selected_option (text, nullable)
  ├── is_correct (boolean)
  └── PK (attempt_id, question_id)
```

### Relaciones
```
subjects (1) ─┬─ (N) topics
              │
topics (1) ───┴─ (N) questions
              │
questions (N) ─┬─ (N) exam_questions ─┬─ (1) exams
              │                        │
              │                        │
              └────────────────────────┴─ (N) exam_attempts (N) ─┬─ (N) user_answers
                                                                  │
auth.users (1) ────────────────────────────────────────────────┘
```

---

## 🎨 6. DISEÑO Y UX

### Sistema de Diseño

**Colores principales:**
- Primary: `blue-600` (CTAs, links)
- Success: `green-600`
- Warning: `yellow-600`
- Danger: `red-600`
- Neutral: `gray-50` a `gray-900`

**Typography:**
- Font: Geist Sans (Next.js)
- Escala: `text-xs` a `text-5xl`

**Spacing:**
- Padding: `p-4` móvil, `p-6` desktop
- Gap: `gap-4` componentes, `gap-6` secciones

**Responsividad:**
```
Mobile: < 768px
Tablet: 768px - 1023px
Desktop: ≥ 1024px

Breakpoints Tailwind:
- sm: 640px
- md: 768px
- lg: 1024px
- xl: 1280px
```

### Componentes UI

**Patrón:** ShadCN UI (headless Radix UI + styled)

Componentes base:
- `button` - Variantes: default, destructive, outline, ghost, link
- `card` - Container con header, content, footer
- `input` - Text, email, password, number
- `checkbox` - Selección múltiple
- `dropdown-menu` - Menús contextuales
- `badge` - Labels y tags

### Navegación

**Desktop:**
- Sidebar izquierda fija (Inicio, Cursos, Ensayos)
- Header top con búsqueda + perfil
- Footer con info

**Mobile (< 1024px):**
- Sidebar oculta (`hidden lg:block`)
- Bottom navigation bar flotante (Home, Cursos, Ensayos)
- Header colapsado
- Footer oculto (`hidden md:block`)

---

## 🔐 7. AUTENTICACIÓN Y SEGURIDAD

### Flujo Auth
1. **Sign Up:** Email + password → Supabase envía email confirmación
2. **Confirm:** Click en email → Callback `/auth/confirm` → Redirect `/protected`
3. **Login:** Email + password → JWT token en cookie (httpOnly)
4. **Session:** Supabase mantiene sesión con refresh token automático
5. **Logout:** Limpia cookie y redirect `/`

### Protección de Rutas
```tsx
// Middleware implícito en /protected
// app/protected/layout.tsx verifica sesión
// Si no autenticado → redirect /auth/login
```

### Manejo de Tokens
- **Cookie httpOnly:** Almacena refresh token
- **localStorage:** NO se usa (security best practice)
- **SSR-safe:** Usa `@supabase/ssr` para Server Components

---

## 📊 8. ESTADO Y GESTIÓN DE DATOS

### Estrategia Actual
**Client-side data fetching** con Supabase client directo:

```tsx
const supabase = createClient();
const { data, error } = await supabase
  .from('table')
  .select('*');
```

### Problemas Actuales
❌ No hay cache de queries  
❌ Re-fetches innecesarios  
❌ Estado duplicado en componentes  
❌ No hay optimistic updates  
❌ Lógica de fetching dispersa  

### Mejoras Planificadas (con nueva arquitectura src/)
✅ API client centralizado (`src/lib/api/`)  
✅ Tipos TypeScript consolidados  
✅ Error handling consistente  
🔄 **Próximo:** React Query /SWR para cache  
🔄 **Próximo:** Optimistic updates  
🔄 **Próximo:** Server Actions para mutaciones  

---

## 🚀 9. RENDIMIENTO

### Métricas Actuales
- ✅ Build time: ~4s (Turbopack)
- ✅ Static pages: 8 rutas
- ✅ Dynamic pages: 5 rutas (SSR on demand)
- ⚠️ Bundle size: No optimizado aún
- ⚠️ Image optimization: Pendiente

### Optimizaciones Implementadas
- ✅ App Router (React Server Components)
- ✅ Turbopack dev server
- ✅ Route-based code splitting
- ✅ SSR para rutas dinámicas

### Pendientes
- ⏳ React Query para cache
- ⏳ Image optimization (next/image)
- ⏳ Lazy loading de modales
- ⏳ Service worker (PWA)
- ⏳ Edge runtime para API routes

---

## 🧪 10. TESTING (No implementado)

### Estado Actual
❌ Sin tests unitarios  
❌ Sin tests de integración  
❌ Sin tests E2E  
❌ Sin Storybook  

### Plan Testing
1. **Vitest** - Unit tests
2. **React Testing Library** - Component tests
3. **Playwright** - E2E tests
4. **Storybook** - Component documentation

---

## 📈 11. PUNTOS DE MEJORA Y ESCALABILIDAD

### 🔴 Crítico (Hacer primero)

1. **Cache y optimización de queries**
   - Implementar React Query o SWR
   - Reducir re-fetches innecesarios
   - Cache invalidation strategy

2. **Error boundaries**
   - Capturar errores de forma global
   - UI de fallback consistente
   - Logging de errores (Sentry?)

3. **Loading states**
   - Skeletons consistentes
   - Suspense boundaries
   - Progressive loading

4. **Form validation**
   - React Hook Form
   - Zod para schemas
   - Validación client + server

### 🟡 Importante (Siguiente sprint)

5. **Testing setup**
   - Vitest + React Testing Library
   - Tests críticos (auth, exam flow)
   - CI/CD con tests

6. **Monitoreo y analytics**
   - Mixpanel / PostHog
   - User behavior tracking
   - Performance monitoring

7. **SEO y meta tags**
   - Open Graph tags
   - Structured data
   - Sitemap

8. **Accesibilidad**
   - WCAG 2.1 AA compliance
   - Keyboard navigation
   - Screen reader friendly

### 🟢 Nice to have (Futuro)

9. **PWA**
   - Service worker
   - Offline mode
   - Install prompt

10. **I18n**
    - Multi-idioma (español/inglés)
    - next-intl

11. **Dark mode**
    - Implementar next-themes
    - Persistir preferencia

---

## 🤖 12. INTEGRACIÓN IA (OPENAI) - PREPARACIÓN

### Casos de Uso Propuestos

#### A. **Explicaciones Inteligentes**
**Objetivo:** Generar explicaciones personalizadas de respuestas

```tsx
// Futuro con OpenAI
POST /api/ai/explain
Body: {
  questionId: 'uuid',
  userAnswer: 'opción seleccionada',
  correctAnswer: 'respuesta correcta',
  context: 'tema de la pregunta'
}

Response: {
  explanation: 'Explicación adaptada al error del estudiante',
  tips: ['Tip 1', 'Tip 2'],
  relatedConcepts: ['Concepto A', 'Concepto B']
}
```

**Implementación futura:**
- Endpoint en `app/api/ai/explain/route.ts`
- Cliente en `src/lib/api/ai.ts`
- UI en `components/exam/ai-explanation.tsx`

#### B. **Generación de Preguntas**
**Objetivo:** Crear preguntas nuevas por tema

```tsx
POST /api/ai/generate-questions
Body: {
  topicId: 'uuid',
  difficulty: 'facil' | 'medio' | 'dificil',
  count: 10,
  style: 'PAES oficial'
}

Response: {
  questions: [
    {
      content: '¿Pregunta generada?',
      correctAnswer: 'A',
      distractors: ['B', 'C', 'D'],
      explanation: 'Por qué A es correcta'
    }
  ]
}
```

#### C. **Tutor Virtual (Chatbot)**
**Objetivo:** Asistente para resolver dudas

```tsx
POST /api/ai/chat
Body: {
  messages: [
    { role: 'user', content: '¿Cómo resuelvo derivadas?' }
  ],
  context: {
    subjectId: 'matematica-m2',
    currentTopics: ['calculo']
  }
}

Response: {
  message: 'Respuesta del tutor IA',
  suggestedTopics: ['Regla de la cadena', 'Derivadas parciales'],
  relatedQuestions: ['question-id-1', 'question-id-2']
}
```

#### D. **Análisis de Rendimiento con IA**
**Objetivo:** Insights personalizados

```tsx
POST /api/ai/analyze-performance
Body: {
  userId: 'uuid',
  timeframe: 'last-30-days'
}

Response: {
  strengths: ['Álgebra', 'Geometría'],
  weaknesses: ['Probabilidad'],
  recommendations: [
    {
      type: 'practice',
      topic: 'Probabilidad',
      reason: '60% accuracy, below average',
      suggestedActions: ['Revisar teoría', 'Hacer 10 ejercicios']
    }
  ],
  predictedScore: 750
}
```

### Preparación para OpenAI API

**Arquitectura propuesta:**

```
app/api/ai/
├── chat/route.ts              # Tutor virtual
├── explain/route.ts           # Explicaciones
├── generate-questions/route.ts # Generar preguntas
└── analyze/route.ts           # Análisis rendimiento

src/lib/api/ai.ts              # Cliente OpenAI
src/lib/prompts/               # Prompts reutilizables
  ├── explain.ts
  ├── generate.ts
  └── tutor.ts

src/types/ai.ts                # Tipos IA
```

**Variables de entorno necesarias:**
```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini  # o gpt-4
OPENAI_TEMPERATURE=0.7
```

**Consideraciones:**
- ✅ Rate limiting (max requests por usuario)
- ✅ Caching de respuestas comunes
- ✅ Fallback si API falla
- ✅ Logging de uso y costos
- ✅ Moderation de inputs

---

## 📝 13. ROADMAP SUGERIDO

### Semana 1-2: Fundamentos
- [x] Responsividad móvil ✅
- [x] Estructura feature-first (Fase 1) ✅
- [ ] React Query setup
- [ ] Error boundaries
- [ ] Form validation (React Hook Form + Zod)

### Semana 3-4: Features Core
- [ ] Migrar componentes a src/features/ (Fase 2-3)
- [ ] Explicaciones mejoradas (preparar para IA)
- [ ] Dashboard avanzado (gráficos mejores)
- [ ] Búsqueda de preguntas por tema

### Semana 5-6: IA Integration
- [ ] Setup OpenAI API
- [ ] Endpoint de explicaciones IA
- [ ] Tutor virtual (chatbot)
- [ ] Generador de preguntas IA

### Semana 7-8: Testing y Optimización
- [ ] Vitest + Testing Library
- [ ] Tests críticos (auth, exams)
- [ ] Performance audit
- [ ] Image optimization

### Semana 9-10: Analytics y Monitoreo
- [ ] Mixpanel / PostHog
- [ ] Error tracking (Sentry)
- [ ] User feedback system
- [ ] A/B testing setup

### Semana 11-12: Features Avanzados
- [ ] Análisis rendimiento con IA
- [ ] Recomendaciones personalizadas
- [ ] Modo competencia (leaderboards)
- [ ] Compartir resultados

---

## 🎓 14. CONCLUSIONES

### ✅ Fortalezas Actuales
- Stack moderno y performante (Next.js 16 + React 19)
- Autenticación robusta (Supabase)
- UI responsive y profesional
- Base de datos bien estructurada
- Deploy automático (Vercel)

### ⚠️ Deuda Técnica
- Sin tests
- Estado no centralizado
- Queries no cacheadas
- Falta error handling global
- Sin monitoreo

### 🚀 Oportunidades
- IA para explicaciones personalizadas
- Generación de contenido con OpenAI
- Analytics avanzados
- Gamificación
- Comunidad (foros, competencias)

### 🎯 Prioridades Inmediatas
1. **React Query** - Cache y optimización
2. **Error boundaries** - UX robusto
3. **Form validation** - Mejor DX
4. **Testing** - Confianza en código
5. **OpenAI prep** - Endpoints base

---

## 📚 15. RECURSOS Y DOCUMENTACIÓN

### Documentación Interna
- `ANALISIS_PROYECTO_PARALELO.md` - Arquitectura feature-first
- `PLAN_ACCION_MIGRACION.md` - Roadmap detallado
- `ANALISIS_RESPONSIVIDAD.md` - Mejoras mobile
- `PREPARAR_SUPABASE.md` - Setup base de datos
- `src/README.md` - Nueva estructura

### Enlaces Externos
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Radix UI](https://www.radix-ui.com/)
- [OpenAI API](https://platform.openai.com/docs)

---

**Última actualización:** 16 febrero 2026  
**Autor:** Análisis automático del proyecto  
**Versión:** 1.0
