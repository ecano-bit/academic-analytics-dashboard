import React, { useState } from 'react';

interface FeedbackPanelProps {
  queryId: string;
  originalQuestion: string;
  sqlQuery: string;
  onFeedbackSubmitted: (success: boolean) => void;
}

const FeedbackPanel: React.FC<FeedbackPanelProps> = ({
  queryId,
  originalQuestion,
  sqlQuery,
  onFeedbackSubmitted
}) => {
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [comment, setComment] = useState('');
  const [expectedResult, setExpectedResult] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const submitFeedback = async () => {
    if (isCorrect === null) return;

    setIsSubmitting(true);
    
    try {
      const response = await fetch('https://mqw248j7g2.execute-api.us-east-2.amazonaws.com/prod/smart-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'feedback',
          input: JSON.stringify({
            query_id: queryId,
            is_correct: isCorrect,
            comment: comment,
            original_question: originalQuestion,
            sql_query: sqlQuery,
            expected_result: expectedResult
          })
        })
      });

      const result = await response.json();
      onFeedbackSubmitted(result.status === 'success');
      
    } catch (error) {
      console.error('Error enviando feedback:', error);
      onFeedbackSubmitted(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-yellow-800 font-semibold flex items-center gap-2">
          🎯 ¿El resultado fue el esperado?
        </h4>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-yellow-600 text-sm hover:text-yellow-800"
        >
          {showDetails ? 'Ocultar detalles' : 'Ver detalles'}
        </button>
      </div>

      {showDetails && (
        <div className="bg-yellow-100 p-3 rounded mb-3 text-sm">
          <p><strong>Pregunta:</strong> {originalQuestion}</p>
          <p><strong>SQL generado:</strong> <code className="bg-white px-1 rounded">{sqlQuery.substring(0, 100)}...</code></p>
          <p><strong>ID:</strong> <code className="bg-white px-1 rounded">{queryId}</code></p>
        </div>
      )}

      <div className="flex gap-3 mb-3">
        <button
          onClick={() => setIsCorrect(true)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isCorrect === true
              ? 'bg-green-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-green-100'
          }`}
        >
          ✅ Correcto
        </button>
        <button
          onClick={() => setIsCorrect(false)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isCorrect === false
              ? 'bg-red-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-red-100'
          }`}
        >
          ❌ Incorrecto
        </button>
      </div>

      {isCorrect === false && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ¿Qué resultado esperabas?
            </label>
            <input
              type="text"
              value={expectedResult}
              onChange={(e) => setExpectedResult(e.target.value)}
              placeholder="Ej: Estudiantes con promedio > 8.0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comentarios adicionales (opcional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Describe qué estuvo mal o cómo mejorar..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {isCorrect !== null && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={submitFeedback}
            disabled={isSubmitting}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              isSubmitting
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-yellow-600 text-white hover:bg-yellow-700'
            }`}
          >
            {isSubmitting ? 'Enviando...' : 'Enviar Feedback'}
          </button>
        </div>
      )}

      <div className="mt-3 text-xs text-gray-500">
        💡 Tu feedback ayuda a mejorar la precisión del sistema para futuras consultas
      </div>
    </div>
  );
};

export default FeedbackPanel;