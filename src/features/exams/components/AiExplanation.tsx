'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';

interface AiExplanationProps {
  questionId: string;
  selectedAnswer: string;
  attemptId: string;
}

export function AiExplanation({ questionId, selectedAnswer, attemptId }: AiExplanationProps) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExplanation = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, selectedAnswer, attemptId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al obtener la explicación');
      }

      setExplanation(data.explanation);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (explanation) {
    return (
      <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg text-sm text-gray-800">
        <p className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4" /> Explicación de la IA:
        </p>
        <p>{explanation}</p>
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-2">
      <Button 
        onClick={fetchExplanation} 
        disabled={loading}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        Obtener explicación personalizada
      </Button>
      {error && <p className="text-red-500 text-xs text-center">{error}</p>}
    </div>
  );
}