/**
 * Exams API Module
 * 
 * Centraliza todas las operaciones relacionadas con ensayos.
 */

import { getSupabaseClient } from './client';

export interface Exam {
  id: string;
  title: string;
  type: string;
  duration_minutes: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  scheduled_at?: string;
}

export interface ExamAttempt {
  id: string;
  user_id: string;
  exam_id: string;
  status: 'en_progreso' | 'completado' | 'abandonado';
  score: number | null;
  started_at: string;
  submitted_at: string | null;
}

export interface Question {
  id: string;
  topic_id: string;
  content: string;
  image_url: string | null;
  difficulty: string;
  correct_answer: string;
  distractors: string[];
  explanation: string;
}

/**
 * Obtener todos los ensayos activos
 */
export async function getActiveExams() {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as Exam[];
}

/**
 * Obtener ensayo por ID
 */
export async function getExamById(examId: string) {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('id', examId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Exam;
}

/**
 * Obtener preguntas de un ensayo
 */
export async function getExamQuestions(examId: string) {
  const supabase = getSupabaseClient();
  
  // Obtener IDs de preguntas del ensayo
  const { data: examQuestions, error: examQuestionsError } = await supabase
    .from('exam_questions')
    .select('question_id')
    .eq('exam_id', examId);

  if (examQuestionsError) {
    throw new Error(examQuestionsError.message);
  }

  const questionIds = examQuestions?.map((eq) => eq.question_id) || [];

  if (questionIds.length === 0) {
    return [];
  }

  // Obtener detalles de las preguntas
  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('*')
    .in('id', questionIds);

  if (questionsError) {
    throw new Error(questionsError.message);
  }

  return questions as Question[];
}

/**
 * Crear intento de ensayo
 */
export async function createExamAttempt(userId: string, examId: string) {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('exam_attempts')
    .insert([
      {
        user_id: userId,
        exam_id: examId,
        status: 'en_progreso',
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as ExamAttempt;
}

/**
 * Guardar respuesta de usuario
 */
export async function saveUserAnswer(
  attemptId: string,
  questionId: string,
  selectedOption: string | null,
  correctAnswer: string
) {
  const supabase = getSupabaseClient();
  const isCorrect = selectedOption === correctAnswer;

  const { error } = await supabase.from('user_answers').insert([
    {
      attempt_id: attemptId,
      question_id: questionId,
      selected_option: selectedOption,
      is_correct: isCorrect,
    },
  ]);

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Finalizar intento de ensayo
 */
export async function submitExamAttempt(attemptId: string, score: number) {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase
    .from('exam_attempts')
    .update({
      status: 'completado',
      score: score,
      submitted_at: new Date().toISOString(),
    })
    .eq('id', attemptId);

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Obtener historial de intentos del usuario
 */
export async function getUserExamAttempts(userId: string) {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('exam_attempts')
    .select(`
      *,
      exams (
        id,
        title,
        duration_minutes
      )
    `)
    .eq('user_id', userId)
    .order('started_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
