#!/usr/bin/env node

/**
 * Script para llenar automáticamente 10 preguntas por topic en Supabase
 * 
 * Uso: npx ts-node scripts/seed-questions.ts
 * 
 * Requisitos:
 * - SUPABASE_SERVICE_ROLE_KEY en .env.local
 * - paquete: npm install @supabase/supabase-js
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Faltan credenciales de Supabase en .env.local');
  console.error('   Necesitas:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY (desde Supabase Console → Settings → API)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Preguntas généricas de PAES - Reemplaza con tus preguntas reales
 * Estructura: content, difficulty, correct_answer, distractors, explanation
 */
const SAMPLE_QUESTIONS = [
  // Fácil
  {
    content: "¿Cuál es el proceso por el cual las plantas convierten la luz solar en energía química?",
    difficulty: "facil",
    correct_answer: "Fotosíntesis",
    distractors: ["Respiración celular", "Fermentación", "Quimiosíntesis"],
    explanation: "La fotosíntesis es el proceso de conversión de energía lumínica en energía química mediante la producción de glucosa."
  },
  {
    content: "¿Cuál es la capital de Chile?",
    difficulty: "facil",
    correct_answer: "Santiago",
    distractors: ["Valparaíso", "Concepción", "Valdivia"],
    explanation: "Santiago es la capital de Chile desde 1541."
  },
  {
    content: "¿Qué elemento químico tiene el símbolo 'O'?",
    difficulty: "facil",
    correct_answer: "Oxígeno",
    distractors: ["Oro", "Osmio", "Oganesio"],
    explanation: "El oxígeno tiene número atómico 8 y es esencial para la respiración."
  },
  {
    content: "¿En qué año terminó la Independencia de Chile?",
    difficulty: "facil",
    correct_answer: "1818",
    distractors: ["1812", "1825", "1808"],
    explanation: "La Independencia de Chile se proclamó el 12 de febrero de 1818 con Bernardo O'Higgins."
  },
  {
    content: "¿Cuál es la fórmula del agua?",
    difficulty: "facil",
    correct_answer: "H₂O",
    distractors: ["H₂O₂", "H₂O₃", "HO"],
    explanation: "El agua está compuesta por 2 átomos de hidrógeno y 1 de oxígeno."
  },
  
  // Medio
  {
    content: "¿Cuál es el factor común en la expresión: 6x² + 9x + 3?",
    difficulty: "medio",
    correct_answer: "3",
    distractors: ["2", "6", "9"],
    explanation: "El máximo factor común de 6, 9 y 3 es 3. Así: 3(2x² + 3x + 1)."
  },
  {
    content: "¿Qué tipo de reacción química es: 2H₂ + O₂ → 2H₂O?",
    difficulty: "medio",
    correct_answer: "Síntesis",
    distractors: ["Descomposición", "Sustitución simple", "Doble desplazamiento"],
    explanation: "Es una reacción de síntesis porque dos elementos se unen para formar un compuesto."
  },
  {
    content: "¿Cuál fue el impacto principal de la Revolución Industrial?",
    difficulty: "medio",
    correct_answer: "Transformación de la producción manual a mecanizada",
    distractors: ["Caída del feudalismo europeo", "Fin de las monarquías", "Invención de la rueda"],
    explanation: "La Revolución Industrial transformó los métodos de producción con máquinas y vapor."
  },
  {
    content: "En una función lineal f(x) = 2x + 3, ¿cuál es la pendiente?",
    difficulty: "medio",
    correct_answer: "2",
    distractors: ["3", "-2", "0"],
    explanation: "En f(x) = mx + b, m es la pendiente. Aquí m = 2."
  },
  {
    content: "¿Cuál es el pH de una sustancia neutra?",
    difficulty: "medio",
    correct_answer: "7",
    distractors: ["0", "14", "1"],
    explanation: "La escala de pH va de 0 a 14, donde 7 es neutro, < 7 es ácido, > 7 es básico."
  },
  
  // Difícil
  {
    content: "¿Cuál es la derivada de f(x) = x³ + 2x² - 5x + 3?",
    difficulty: "dificil",
    correct_answer: "f'(x) = 3x² + 4x - 5",
    distractors: ["f'(x) = 3x² + 4x", "f'(x) = x² + 2x - 5", "f'(x) = 3x + 4"],
    explanation: "Derivada término por término: 3x², 4x, -5, constante desaparece."
  },
  {
    content: "¿Qué ley postula que para toda reacción reversible en equilibrio, la razón de productos y reactivos es constante?",
    difficulty: "dificil",
    correct_answer: "Ley de acción de masas",
    distractors: ["Ley de velocidad", "Ley de Henry", "Ley de Le Chatelier"],
    explanation: "K = [productos]/[reactivos]. Esta es la base del equilibrio químico."
  },
  {
    content: "¿Cuál fue la consecuencia política más importante de la Paz de Westfalia (1648)?",
    difficulty: "dificil",
    correct_answer: "Reconocimiento de la soberanía estatal",
    distractors: ["Fin del Tratado de Utrecht", "Unificación de Alemania", "Independencia de los Países Bajos"],
    explanation: "Westfalia estableció el principio de soberanía nacional que define el sistema internacional moderno."
  },
  {
    content: "En trigonometría, ¿cuál es el valor de sen(30°)?",
    difficulty: "dificil",
    correct_answer: "1/2",
    distractors: ["√3/2", "√2/2", "1"],
    explanation: "sen(30°) = 1/2. Estos son valores clave de ángulos especiales."
  },
  {
    content: "¿Cuál es la concentración molar de una solución que contiene 58.5 g de NaCl en 1 L de agua?",
    difficulty: "dificil",
    correct_answer: "1 M",
    distractors: ["0.5 M", "2 M", "0.1 M"],
    explanation: "Peso molecular NaCl = 58.5 g/mol. Entonces 58.5 g / 1 L = 1 M."
  }
];

/**
 * Función para generar N preguntas variadas
 */
function generateQuestions(count: number, startIndex: number = 0) {
  const questions = [];
  const difficulties = ['facil', 'medio', 'dificil'];
  
  for (let i = 0; i < count; i++) {
    const sampleIndex = (startIndex + i) % SAMPLE_QUESTIONS.length;
    const question = SAMPLE_QUESTIONS[sampleIndex];
    questions.push({
      ...question,
      difficulty: difficulties[i % difficulties.length], // Distribución de dificultad
    });
  }
  return questions;
}

/**
 * Main: Llenar preguntas por topic
 */
async function seedQuestions() {
  try {
    console.log('\n🌱 Iniciando seed de preguntas...\n');

    // 1. Obtener todos los topics con sus temas
    const { data: topics, error: topicsError } = await supabase
      .from('topics')
      .select('id, name, subject_id')
      .order('name', { ascending: true });

    if (topicsError) throw new Error(`Error obteniendo topics: ${topicsError.message}`);
    if (!topics || topics.length === 0) {
      console.log('⚠️  No hay topics en la base de datos. Por favor, crea algunos primero.');
      return;
    }

    console.log(`📌 Encontrados ${topics.length} topics\n`);

    let totalAdded = 0;
    const stats: { topic: string; existing: number; added: number; total: number }[] = [];

    // 2. Para cada topic, contar preguntas y llenar con las que faltan
    for (let idx = 0; idx < topics.length; idx++) {
      const topic = topics[idx];

      // Contar preguntas existentes
      const { data: existingQuestions, error: countError } = await supabase
        .from('questions')
        .select('id', { count: 'exact' })
        .eq('topic_id', topic.id);

      if (countError) throw new Error(`Error contando preguntas: ${countError.message}`);

      const currentCount = existingQuestions?.length || 0;
      const needed = Math.max(0, 10 - currentCount);

      console.log(`[${idx + 1}/${topics.length}] Topic: "${topic.name}"`);
      console.log(`  📊 Estado: ${currentCount}/10 preguntas`);

      if (needed > 0) {
        console.log(`  ⏳ Agregando ${needed} pregunta${needed === 1 ? '' : 's'}...`);

        // Generar nuevas preguntas
        const newQuestions = generateQuestions(needed, idx * 10).map((q) => ({
          ...q,
          topic_id: topic.id,
          image_url: null,
        }));

        // Insertar en Supabase
        const { error: insertError, data: insertedData } = await supabase
          .from('questions')
          .insert(newQuestions)
          .select('id');

        if (insertError) {
          console.error(`  ❌ Error: ${insertError.message}`);
          stats.push({
            topic: topic.name,
            existing: currentCount,
            added: 0,
            total: currentCount,
          });
        } else {
          const addedCount = insertedData?.length || needed;
          console.log(`  ✅ Agregadas ${addedCount} pregunta${addedCount === 1 ? '' : 's'}`);
          totalAdded += addedCount;
          stats.push({
            topic: topic.name,
            existing: currentCount,
            added: addedCount,
            total: currentCount + addedCount,
          });
        }
      } else {
        console.log(`  ✅ Completo (${currentCount} preguntas)`);
        stats.push({
          topic: topic.name,
          existing: currentCount,
          added: 0,
          total: currentCount,
        });
      }

      console.log('');
    }

    // 3. Resumen
    console.log('\n' + '='.repeat(70));
    console.log('📊 RESUMEN FINAL');
    console.log('='.repeat(70));
    console.table(stats);
    console.log(`\n✨ Total agregadas: ${totalAdded} pregunta${totalAdded === 1 ? '' : 's'}\n`);

    // 4. Verificación final
    const { data: finalStats } = await supabase
      .from('topics')
      .select(`
        id,
        name,
        questions (id)
      `)
      .order('name', { ascending: true });

    if (finalStats) {
      console.log('📈 Verificación final:');
      let allComplete = true;
      for (const topic of finalStats) {
        const count = (topic.questions as any[])?.length || 0;
        const indicator = count >= 10 ? '✅' : '⚠️ ';
        console.log(`   ${indicator} ${topic.name}: ${count} preguntas`);
        if (count < 10) allComplete = false;
      }

      if (allComplete) {
        console.log('\n🎉 ¡Todas los topics tienen al menos 10 preguntas!');
      } else {
        console.log('\n⚠️  Algunos topics aún necesitan más preguntas.');
      }
    }

  } catch (error) {
    console.error('\n❌ Error durante seed:', error);
    process.exit(1);
  }
}

// Ejecutar
seedQuestions();
