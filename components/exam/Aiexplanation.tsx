'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles, Loader2, Lock } from 'lucide-react';
import Link from 'next/link';

interface AiExplanationProps {
  questionId: string;
  selectedAnswer: string;
  attemptId: string;
  isPremium?: boolean;
}

export function AiExplanation({
  questionId,
  selectedAnswer,
  attemptId,
  isPremium = false,
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

      if (response.status === 429) {
        setError('Alcanzaste el límite diario de explicaciones. Upgrade a Premium para ilimitadas.');
        return;
      }

      if (!response.ok) throw new Error('Failed to generate explanation');

      const data = await response.json();
      setExplanation(data.explanation);
    } catch (err) {
      setError('Error generando explicación. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 mt-6">
      {!explanation && !isPremium && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-purple-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-purple-900">Plan Gratuito: 5 explicaciones/día</p>
              <p className="text-sm text-purple-700 mt-1">Upgrade a Premium para explicaciones ilimitadas con IA.</p>
            </div>
          </div>
        </div>
      )}

      {!explanation && (
        <Button onClick={handleGetExplanation} disabled={loading} size="lg" className="w-full bg-purple-600 hover:bg-purple-700">
          {loading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generando explicación con IA...</>
          ) : (
            <><Sparkles className="mr-2 h-4 w-4" /> Obtener explicación personalizada</>
          )}
        </Button>
      )}

      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <p className="text-red-700 text-sm">{error}</p>
          {error.includes('Premium') && (
            <Link href="/pricing" className="text-red-600 text-sm font-medium mt-2 inline-block hover:underline">
              Ver planes de pago →
            </Link>
          )}
        </Card>
      )}

      {explanation && (
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold text-lg text-purple-900">Explicación IA Personalizada</h3>
          </div>
          <div className="space-y-3">
            {explanation.split('\n\n').map((paragraph, idx) => (
              <p key={idx} className="text-gray-700 text-sm leading-relaxed">{paragraph}</p>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}