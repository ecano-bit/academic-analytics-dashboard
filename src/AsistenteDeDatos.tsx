import React, { useState } from 'react';
import axios from 'axios';
import ResultTable from './ResultTable';
import DebugPanel from './DebugPanel';
import FeedbackPanel from './FeedbackPanel';
import oliImage from './images/oli.png';

const SMART_API_URL = 'https://mqw248j7g2.execute-api.us-east-2.amazonaws.com/prod/smart-agent';
const FALLBACK_API_URL = 'https://mqw248j7g2.execute-api.us-east-2.amazonaws.com/prod/query';

interface QueryResult {
  question: string;
  sql_query: string;
  columns: string[];
  data: any[];
  total_rows: number;
  from_knowledge_base?: boolean;
  usage_count?: number;
  similarity_score?: number;
  processing_time_ms?: number;
  debug_info?: any;
  query_id?: string;
  feedback_enabled?: boolean;
}

const AsistenteDeDatos: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [customQuestion, setCustomQuestion] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const predefinedQuestions = [
    '¿Cuáles son los estudiantes de alto riesgo?',
    '¿Quiénes tienen el mejor promedio?',
    '¿Cuáles estudiantes tienen mayor deuda?',
    '¿Cómo es el promedio por período?',
    '¿Qué estudiantes no tienen deuda?',
    '¿Cuáles son los estudiantes de bajo riesgo?',
    '¿Cuántos estudiantes hay en total?',
    '¿Cuál es la deuda promedio?'
  ];

  const handleQuestionClick = async (question: string) => {
    await executeQuery(question);
  };

  const handleCustomSubmit = async () => {
    if (customQuestion.trim()) {
      await executeQuery(customQuestion);
      setCustomQuestion(''); // Limpiar el campo después de enviar
    }
  };

  const executeQuery = async (question: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setFeedbackMessage(null);

    try {
      // Intentar con smart-agent primero
      const response = await axios.post(SMART_API_URL, { 
        type: 'query',
        input: question 
      });
      console.log('Smart Agent Response:', response.data);
      setResult(response.data);
    } catch (smartErr: any) {
      console.warn('Smart agent failed, trying fallback:', smartErr);
      
      try {
        // Fallback al endpoint original
        const fallbackResponse = await axios.post(FALLBACK_API_URL, { question });
        console.log('Fallback Response:', fallbackResponse.data);
        setResult(fallbackResponse.data);
      } catch (fallbackErr: any) {
        console.error('Both endpoints failed:', { smartErr, fallbackErr });
        const errorMessage = fallbackErr.response?.data?.error || 
                            fallbackErr.response?.data?.message || 
                            fallbackErr.message || 
                            'Error al procesar la consulta';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Messages Area */}
      <div className="flex-1 space-y-4 mb-6 max-h-96 overflow-y-auto">
        {/* Welcome Message */}
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-academic-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
            <img src={oliImage} alt="Oli Assistant" className="w-5 h-5" />
          </div>
          <div className="bg-white rounded-lg rounded-tl-none p-4 shadow-sm border border-academic-gray-200 max-w-xs">
            <p className="text-sm text-academic-gray-700">
              ¡Hola! Soy tu asistente de datos. Puedes hacerme preguntas sobre los estudiantes o usar las sugerencias rápidas.
            </p>
          </div>
        </div>

        {/* Results Display */}
        {result && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-academic-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm">📊</span>
            </div>
            <div className="bg-white rounded-lg rounded-tl-none p-4 shadow-sm border border-academic-gray-200 flex-1">
              <ResultTable result={result} />
              {result.debug_info && <DebugPanel result={result} />}
              {result.feedback_enabled && result.query_id && (
                <FeedbackPanel
                  queryId={result.query_id}
                  originalQuestion={result.question}
                  sqlQuery={result.sql_query}
                  onFeedbackSubmitted={(success) => {
                    if (success) {
                      setFeedbackMessage('✅ Feedback enviado correctamente. ¡Gracias por ayudar a mejorar el sistema!');
                    } else {
                      setFeedbackMessage('❌ Error al enviar feedback. Inténtalo de nuevo.');
                    }
                    setTimeout(() => setFeedbackMessage(null), 5000);
                  }}
                />
              )}
            </div>
          </div>
        )}

        {/* Feedback Message */}
        {feedbackMessage && (
          <div className="flex items-start space-x-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              feedbackMessage.includes('✅') ? 'bg-green-500' : 'bg-red-500'
            }`}>
              <span className="text-white text-sm">
                {feedbackMessage.includes('✅') ? '✅' : '❌'}
              </span>
            </div>
            <div className={`rounded-lg rounded-tl-none p-4 border max-w-xs ${
              feedbackMessage.includes('✅') 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <p className={`text-sm ${
                feedbackMessage.includes('✅') ? 'text-green-700' : 'text-red-700'
              }`}>
                {feedbackMessage}
              </p>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm">⚠️</span>
            </div>
            <div className="bg-red-50 rounded-lg rounded-tl-none p-4 border border-red-200 max-w-xs">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Loading Display */}
        {loading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-academic-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            </div>
            <div className="bg-white rounded-lg rounded-tl-none p-4 shadow-sm border border-academic-gray-200 max-w-xs">
              <p className="text-sm text-academic-gray-700">Procesando consulta...</p>
            </div>
          </div>
        )}
      </div>

      {/* All Predefined Questions */}
      <div className="mb-4">
        <p className="text-xs text-academic-gray-500 mb-3">Preguntas disponibles:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {predefinedQuestions.map((question, index) => (
            <button
              key={index}
              onClick={() => handleQuestionClick(question)}
              disabled={loading}
              className="bg-academic-blue-100 hover:bg-academic-blue-200 text-academic-blue-700 text-xs px-3 py-2 rounded-lg text-left transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-academic-gray-200 pt-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Escribe tu pregunta aquí..."
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCustomSubmit()}
            disabled={loading}
            className="flex-1 px-3 py-2 text-sm border border-academic-gray-300 rounded-lg focus:ring-2 focus:ring-academic-blue-500 focus:border-academic-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleCustomSubmit}
            disabled={loading || !customQuestion.trim()}
            className="bg-academic-orange-500 hover:bg-academic-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AsistenteDeDatos;