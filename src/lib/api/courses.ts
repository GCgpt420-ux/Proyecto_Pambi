/**
 * Courses API Module
 * 
 * Centraliza todas las operaciones relacionadas con materias y tópicos.
 */

import { getSupabaseClient } from './client';

export interface Subject {
  id: string;
  name: string;
  description: string;
  icon_url: string | null;
  created_at: string;
}

export interface Topic {
  id: string;
  subject_id: string;
  name: string;
  description: string;
  created_at: string;
}

/**
 * Obtener todas las materias
 */
export async function getAllSubjects() {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data as Subject[];
}

/**
 * Obtener materia por ID
 */
export async function getSubjectById(subjectId: string) {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('id', subjectId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Subject;
}

/**
 * Obtener tópicos de una materia
 */
export async function getTopicsBySubject(subjectId: string) {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('subject_id', subjectId)
    .order('name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data as Topic[];
}

/**
 * Obtener tópico por ID
 */
export async function getTopicById(topicId: string) {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('id', topicId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Topic;
}

/**
 * Obtener todas las materias con sus tópicos
 */
export async function getSubjectsWithTopics() {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('subjects')
    .select(`
      *,
      topics (*)
    `)
    .order('name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
