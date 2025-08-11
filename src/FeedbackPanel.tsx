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

  const [comment, setComment] = useState('');
  const [expectedResult, setExpectedResult] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const [score, setScore] = useState<number | null>(null);

  const submitFeedback = async () => {
    if (score === null) return;

    setIsSubmitting(true);
    
    try {
      const response = await fetch('https://mqw248j7g2.execute-api.us-east-2.amazonaws.com/prod/smart-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'feedback',
          query_id: queryId,
          score: score,
          comment: comment,
          suggested_sql: expectedResult,
          original_question: originalQuestion,
          original_sql: sqlQuery
        })
      });

      const result = await response.json();
      onFeedbackSubmitted(result.success || false);
      
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

      <div className="space-y-3">
        <div className="text-sm font-medium text-gray-700 mb-2">Califica la respuesta (1-5 estrellas):</div>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              onClick={() => setScore(rating)}
              className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                score === rating
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-yellow-100'
              }`}
            >
              {rating}⭐
            </button>
          ))}
        </div>
        {score && (
          <div className="text-sm text-gray-600">
            {score === 1 && '😞 Muy malo'}
            {score === 2 && '😕 Malo'}
            {score === 3 && '😐 Regular'}
            {score === 4 && '😊 Bueno'}
            {score === 5 && '😍 Excelente'}
          </div>
        )}
      </div>

      {score && score < 4 && (
        <div className="space-y-3 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SQL sugerido para mejorar (opcional)
            </label>
            <textarea
              value={expectedResult}
              onChange={(e) => setExpectedResult(e.target.value)}
              placeholder="SELECT ... FROM ... WHERE ..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent font-mono text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ¿Qué se puede mejorar? (opcional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Describe qué estuvo mal o cómo mejorar..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {score !== null && (
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