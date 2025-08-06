import React, { useState } from 'react';
import axios from 'axios';
import ResultTable from './ResultTable';
import DebugPanel from './DebugPanel';
import styled from 'styled-components';

const SMART_API_URL = 'https://mqw248j7g2.execute-api.us-east-2.amazonaws.com/prod/smart-agent';
const FALLBACK_API_URL = 'https://mqw248j7g2.execute-api.us-east-2.amazonaws.com/prod/query';

const Container = styled.div`
  background: white;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 20px;
`;

const Title = styled.h3`
  color: #2c3e50;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const QuestionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
`;

const QuestionButton = styled.button`
  background: #3498db;
  color: white;
  border: none;
  padding: 12px 16px;
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.3s;
  
  &:hover {
    background: #2980b9;
  }
  
  &:disabled {
    background: #bdc3c7;
    cursor: not-allowed;
  }
`;

const CustomInput = styled.div`
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ecf0f1;
`;

const InputGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
`;

const TextInput = styled.input`
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
`;

const SubmitButton = styled.button`
  background: #27ae60;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  
  &:hover {
    background: #229954;
  }
  
  &:disabled {
    background: #bdc3c7;
    cursor: not-allowed;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  color: #7f8c8d;
  padding: 20px;
`;

const ErrorMessage = styled.div`
  background: #e74c3c;
  color: white;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
`;

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
}

const AsistenteDeDatos: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [customQuestion, setCustomQuestion] = useState('');

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
    }
  };

  const executeQuery = async (question: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

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
    <Container>
      <Title>
        🤖 Asistente de Datos - Consultas en Lenguaje Natural
      </Title>
      
      <QuestionGrid>
        {predefinedQuestions.map((question, index) => (
          <QuestionButton
            key={index}
            onClick={() => handleQuestionClick(question)}
            disabled={loading}
          >
            {question}
          </QuestionButton>
        ))}
      </QuestionGrid>

      <CustomInput>
        <h4>O haz tu propia pregunta:</h4>
        <InputGroup>
          <TextInput
            type="text"
            placeholder="Escribe tu pregunta aquí..."
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCustomSubmit()}
            disabled={loading}
          />
          <SubmitButton
            onClick={handleCustomSubmit}
            disabled={loading || !customQuestion.trim()}
          >
            Consultar
          </SubmitButton>
        </InputGroup>
      </CustomInput>

      {loading && <LoadingMessage>Procesando consulta...</LoadingMessage>}
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {result && (
        <>
          <ResultTable result={result} />
          {result.debug_info && <DebugPanel result={result} />}
        </>
      )}
    </Container>
  );
};

export default AsistenteDeDatos;