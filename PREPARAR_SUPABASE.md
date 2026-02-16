# 🗄️ Preparar Supabase para Presentación Mañana

## Estructura Actual (Verificada)

Tu app usa estas tablas:
```
subjects (materias)
  ├── id, name
  
topics (temas por materia)
  ├── id, name, subject_id
  
questions (preguntas con respuestas)
  ├── id, content, image_url, difficulty, 
  ├── correct_answer, distractors[], explanation, topic_id
  
exam_questions (preguntas en cada ensayo)
  ├── exam_id, question_id
  
exam_attempts (historial de intentos)
  ├── id, user_id, exam_id, status, score, submitted_at
  
user_answers (respuestas por intento)
  ├── attempt_id, question_id, selected_option, is_correct
```

---

## 🎯 Objetivo: 10 Preguntas por Topic

### Paso 1️⃣: Verificar Estado Actual (en Supabase Console)

Abre tu Supabase (https://app.supabase.com) y ejecuta este SQL:

```sql
-- Ver cuántos topics y preguntas tienes
SELECT 
    t.id,
    t.name AS topic_name,
    s.name AS subject_name,
    COUNT(q.id) AS question_count,
    CASE 
        WHEN COUNT(q.id) < 10 THEN '🔴 Falta llenar'
        WHEN COUNT(q.id) = 10 THEN '✅ Completo'
        ELSE '✅ Sobra'
    END AS status
FROM topics t
LEFT JOIN subjects s ON t.subject_id = s.id
LEFT JOIN questions q ON q.topic_id = t.id
GROUP BY t.id, t.name, s.name
ORDER BY s.name, t.name;
```

**Esto te dirá:**
- Cuál es el estado de cada topic
- Cuántas preguntas le faltan

---

## 📥 Paso 2️⃣: Agregar Preguntas (3 Opciones)

### ✅ Opción A: Script Automático (Recomendado)

Crea un archivo `seed-questions.ts` en la raíz del proyecto:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // ⚠️ Necesitas esto

const supabase = createClient(supabaseUrl, supabaseKey);

// Preguntas de ejemplo (REEMPLAZA con tus datos)
const questionsBySample = {
  "topic-A": [
    {
      content: "¿Cuál es la capital de Francia?",
      difficulty: "facil",
      correct_answer: "París",
      distractors: ["Londres", "Berlín", "Madrid"],
      explanation: "París es la capital de Francia desde el siglo XII."
    },
    // ... 9 preguntas más
  ]
};

async function seedQuestions() {
  try {
    console.log("🌱 Iniciando seed de preguntas...");

    // 1. Obtener todos los topics
    const { data: topics, error: topicsError } = await supabase
      .from('topics')
      .select('id, name');

    if (topicsError) throw topicsError;
    console.log(`📌 Encontrados ${topics?.length} topics`);

    // 2. Para cada topic, contar preguntas existentes
    for (const topic of topics || []) {
      const { data: questions, error: countError } = await supabase
        .from('questions')
        .select('id')
        .eq('topic_id', topic.id);

      if (countError) throw countError;

      const currentCount = questions?.length || 0;
      const needed = Math.max(0, 10 - currentCount);

      if (needed > 0) {
        console.log(`⏳ Topic "${topic.name}": ${currentCount}/10 preguntas → Necesita ${needed} más`);
        
        // 3. Agregar preguntas faltantes
        const newQuestions = generateQuestionsForTopic(topic.name, needed);
        
        const insertData = newQuestions.map(q => ({
          ...q,
          topic_id: topic.id
        }));

        const { error: insertError } = await supabase
          .from('questions')
          .insert(insertData);

        if (insertError) {
          console.error(`❌ Error agregando preguntas a "${topic.name}":`, insertError);
        } else {
          console.log(`✅ Agregadas ${needed} preguntas a "${topic.name}"`);
        }
      } else {
        console.log(`✅ Topic "${topic.name}": ${currentCount}/10 preguntas (completo)`);
      }
    }

    console.log("✨ Seed completado!");
  } catch (error) {
    console.error("❌ Error durante seed:", error);
  }
}

// Función para generar preguntas (adaptarla según tus temas)
function generateQuestionsForTopic(topicName: string, count: number) {
  const questions = [];
  for (let i = 1; i <= count; i++) {
    questions.push({
      content: `Pregunta ${i} sobre ${topicName} - [REEMPLAZAR CON PREGUNTA REAL]`,
      difficulty: ["facil", "medio", "dificil"][Math.floor(Math.random() * 3)],
      correct_answer: "Opción correcta",
      distractors: ["Opción incorrecta 1", "Opción incorrecta 2", "Opción incorrecta 3"],
      explanation: `Explicación para pregunta ${i}`,
      image_url: null
    });
  }
  return questions;
}

// Ejecutar
seedQuestions();
```

**Ejecutar:**
```bash
npx ts-node seed-questions.ts
```

---

### ✅ Opción B: SQL Directo (Supabase Console)

Si tienes ~2-3 topics sin preguntas:

**En Supabase SQL Editor:**

```sql
-- Ejemplo: Agregar 10 preguntas a un topic específico
WITH new_questions AS (
  SELECT * FROM (VALUES 
    ('Pregunta 1', 'facil', 'Respuesta correcta 1', ARRAY['Incorrecto 1a', 'Incorrecto 1b', 'Incorrecto 1c'], 'Explicación 1'),
    ('Pregunta 2', 'facil', 'Respuesta correcta 2', ARRAY['Incorrecto 2a', 'Incorrecto 2b', 'Incorrecto 2c'], 'Explicación 2'),
    ('Pregunta 3', 'medio', 'Respuesta correcta 3', ARRAY['Incorrecto 3a', 'Incorrecto 3b', 'Incorrecto 3c'], 'Explicación 3'),
    ('Pregunta 4', 'medio', 'Respuesta correcta 4', ARRAY['Incorrecto 4a', 'Incorrecto 4b', 'Incorrecto 4c'], 'Explicación 4'),
    ('Pregunta 5', 'dificil', 'Respuesta correcta 5', ARRAY['Incorrecto 5a', 'Incorrecto 5b', 'Incorrecto 5c'], 'Explicación 5'),
    ('Pregunta 6', 'facil', 'Respuesta correcta 6', ARRAY['Incorrecto 6a', 'Incorrecto 6b', 'Incorrecto 6c'], 'Explicación 6'),
    ('Pregunta 7', 'medio', 'Respuesta correcta 7', ARRAY['Incorrecto 7a', 'Incorrecto 7b', 'Incorrecto 7c'], 'Explicación 7'),
    ('Pregunta 8', 'medio', 'Respuesta correcta 8', ARRAY['Incorrecto 8a', 'Incorrecto 8b', 'Incorrecto 8c'], 'Explicación 8'),
    ('Pregunta 9', 'dificil', 'Respuesta correcta 9', ARRAY['Incorrecto 9a', 'Incorrecto 9b', 'Incorrecto 9c'], 'Explicación 9'),
    ('Pregunta 10', 'dificil', 'Respuesta correcta 10', ARRAY['Incorrecto 10a', 'Incorrecto 10b', 'Incorrecto 10c'], 'Explicación 10')
  ) AS t(content, difficulty, correct_answer, distractors, explanation)
)
INSERT INTO questions (content, difficulty, correct_answer, distractors, explanation, topic_id, image_url)
SELECT 
  nq.content,
  nq.difficulty,
  nq.correct_answer,
  nq.distractors,
  nq.explanation,
  'UUID-DE-TU-TOPIC-AQUI'::uuid,  -- Reemplaza con el UUID del topic
  NULL
FROM new_questions nq;
```

---

### ✅ Opción C: Manualmente (Admin Panel)

Si prefieres control total:

1. Ve a **Supabase Console** → **Editor SQL**
2. **Table Editor** → selecciona `questions`
3. Haz click **+ Insert Row**
4. Completa todos los campos:
   - `content`: Tu pregunta
   - `difficulty`: facil / medio / dificil
   - `correct_answer`: La opción correcta
   - `distractors`: ["opción 1", "opción 2", "opción 3"]
   - `explanation`: Por qué es correcta
   - `topic_id`: El UUID del topic
   - `image_url`: null (o URL de imagen)

---

## 🔧 Paso 3️⃣: Crear un Ensayo de Prueba

Una vez tengas datos, **crea un ensayo** en tu app:

1. Abre tu app (de cualquier usuario autenticado)
2. Ve a **Ensayos** → **+ Crear Ensayo**
3. Selecciona:
   - Título: "Ensayo de Prueba"
   - Materias: Las que hayas llenado
   - Duración: 60 minutos
   - Preguntas: 10-20
4. Haz click crear

**Esto debe:**
- ✅ Crear el ensayo sin errores
- ✅ Cargar las preguntas
- ✅ Mostrar el timer funcionando
- ✅ Permitir responder las preguntas

---

## 📊 Paso 4️⃣: Validar Todo Funciona (Checklist)

```sql
-- Ver estado COMPLETO
SELECT 
    s.id,
    s.name AS subject,
    COUNT(DISTINCT t.id) AS topics,
    COUNT(DISTINCT q.id) AS questions,
    AVG(COUNT(DISTINCT q.id)) OVER (PARTITION BY s.id) AS avg_per_topic
FROM subjects s
LEFT JOIN topics t ON t.subject_id = s.id
LEFT JOIN questions q ON q.topic_id = t.id
WHERE s.deleted_at IS NULL
GROUP BY s.id, s.name
ORDER BY s.name;
```

**Resultado esperado para mañana:**
```
| subject | topics | questions | avg_per_topic |
|---------|--------|-----------|---------------|
| Matemática | 5 | 50 | 10 |
| Lenguaje | 4 | 40 | 10 |
| Historia | 3 | 30 | 10 |
```

---

## 🚀 Checklist para Mañana (30 min)

- [ ] **5 min** → Ejecutar SQL de verificación
- [ ] **10 min** → Ver qué topics necesitan preguntas
- [ ] **10 min** → Agregar preguntas (elige Opción A, B o C)
- [ ] **5 min** → Verificar con SQL nuevamente
- [ ] **5 min** → Crear ensayo de prueba y testear

**Resultado:** Supabase lleno, app funcionando, listo para presentar 🎉

---

## ⚠️ IMPORTANTE: Credenciales

Para usar el script `seed-questions.ts` necesitas:

1. **Service Role Key** (no publishable key):
   - Supabase Console → Settings → API → Service Role Key
   - CópiaIo en tu `.env.local` como `SUPABASE_SERVICE_ROLE_KEY`

2. Luego ejecuta: `npx ts-node seed-questions.ts`

---

## 💾 Datos de Respaldo

Si quieres respaldar datos antes de hacer cambios:

```sql
-- Exportar preguntas actuales
COPY questions(id, content, difficulty, correct_answer, distractors, explanation, topic_id, created_at, updated_at)
TO '/tmp/backup_preguntas.csv' WITH CSV HEADER;

-- Restaurar si necesitas
COPY questions(id, content, difficulty, correct_answer, distractors, explanation, topic_id, created_at, updated_at)
FROM '/tmp/backup_preguntas.csv' WITH CSV HEADER;
```

---

## 📞 Si Hay Problemas

**Pregunta 1: "Error al conectar a Supabase"**
- Verifica que `NEXT_PUBLIC_SUPABASE_URL` esté en tu `.env.local`
- Verifica que la API key sea correcta

**Pregunta 2: "Las preguntas no aparecen en el ensayo"**
- Revisa que `topic_id` sea correcto
- Ejecuta: `SELECT COUNT(*) FROM questions WHERE topic_id = 'TU_TOPIC_ID'`
- Verifica que el ensayo esté vinculado a ese topic

**Pregunta 3: "No veo el campo distractors"**
- Asegúrate que sea un array: `["opción1", "opción2", "opción3"]`
- En Supabase aparece como `TEXT[]`

---

**Resumen:** En 30 minutos tienes Supabase lleno y listo. ¡Presentación a prueba de fallos! 🎯
