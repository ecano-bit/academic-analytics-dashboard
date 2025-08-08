import React from 'react';
import styled from 'styled-components';

const DebugContainer = styled.div`
  background: #2c3e50;
  color: #ecf0f1;
  padding: 20px;
  border-radius: 8px;
  margin-top: 20px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  max-height: 400px;
  overflow-y: auto;
`;

const DebugTitle = styled.h4`
  color: #3498db;
  margin-bottom: 15px;
  font-family: Arial, sans-serif;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const AgentInfoContainer = styled.div`
  background: rgba(155, 89, 182, 0.1);
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 15px;
  border-left: 3px solid #9b59b6;
`;

const ToolBadge = styled.span`
  background: #9b59b6;
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  margin-right: 5px;
`;

const ReasoningText = styled.div`
  background: rgba(52, 152, 219, 0.1);
  padding: 8px;
  border-radius: 4px;
  margin-top: 5px;
  font-style: italic;
  color: #3498db;
`;

const DecisionTree = styled.div`
  background: rgba(46, 204, 113, 0.1);
  padding: 10px;
  border-radius: 4px;
  margin-top: 10px;
  border-left: 2px solid #2ecc71;
`;

const CostContainer = styled.div`
  background: rgba(230, 126, 34, 0.1);
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 15px;
  border-left: 3px solid #e67e22;
`;

const CostGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
  margin-top: 10px;
`;

const CostCard = styled.div`
  background: rgba(231, 76, 60, 0.1);
  padding: 8px;
  border-radius: 4px;
  text-align: center;
`;

const CostValue = styled.div`
  color: #e74c3c;
  font-size: 14px;
  font-weight: bold;
`;

const CostLabel = styled.div`
  color: #95a5a6;
  font-size: 9px;
  margin-top: 2px;
`;

const StepContainer = styled.div`
  margin-bottom: 15px;
  padding: 10px;
  background: rgba(52, 152, 219, 0.1);
  border-left: 3px solid #3498db;
  border-radius: 4px;
`;

const StepHeader = styled.div`
  color: #3498db;
  font-weight: bold;
  margin-bottom: 5px;
`;

const StepDetails = styled.div`
  color: #bdc3c7;
  line-height: 1.4;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
  margin-bottom: 15px;
`;

const StatCard = styled.div`
  background: rgba(46, 204, 113, 0.1);
  padding: 10px;
  border-radius: 4px;
  text-align: center;
`;

const StatValue = styled.div`
  color: #2ecc71;
  font-size: 18px;
  font-weight: bold;
`;

const StatLabel = styled.div`
  color: #95a5a6;
  font-size: 10px;
  margin-top: 2px;
`;

const PerformanceIndicator = styled.div<{fast: boolean}>`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: bold;
  background: ${props => props.fast ? '#27ae60' : '#f39c12'};
  color: white;
  margin-left: 10px;
`;

const SimilarityBadge = styled.div<{score: number}>`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: bold;
  background: ${props => 
    props.score === 1.0 ? '#27ae60' : 
    props.score > 0.9 ? '#2ecc71' : 
    props.score > 0.8 ? '#f39c12' : '#e74c3c'
  };
  color: white;
  margin-left: 10px;
`;

interface DebugInfo {
  original_question: string;
  normalized_question: string;
  processing_steps: Array<{
    step: number;
    action: string;
    details: string;
    tool_used?: string;
    agent_reasoning?: string;
    timestamp: string;
  }>;
  knowledge_base_stats: {
    total_queries: number;
    most_used_count: number;
    avg_usage: number;
    total_usage: number;
  };
  agent_info?: {
    agent_type: string;
    tools_available: string[];
    decision_tree: Array<{
      decision: string;
      reasoning: string;
      tool_selected: string;
      optimization?: string;
      performance?: string;
      fallback_strategy?: string;
      intelligence?: string;
      learning?: string;
    }>;
    optimization_strategy: string;
  };
}

interface QueryResult {
  from_knowledge_base?: boolean;
  usage_count?: number;
  similarity_score?: number;
  processing_time_ms?: number;
  debug_info?: DebugInfo;
  cost_info?: {
    operation_cost_usd: number;
    total_session_cost: number;
    cost_breakdown: Record<string, {
      total_cost: number;
      request_count: number;
      avg_cost_per_request: number;
    }>;
  };
}

interface Props {
  result: QueryResult;
}

const DebugPanel: React.FC<Props> = ({ result }) => {
  const { 
    debug_info, 
    processing_time_ms = 0, 
    from_knowledge_base = false, 
    usage_count = 0, 
    similarity_score = 0,
    cost_info
  } = result;

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const isPerformanceFast = (processing_time_ms || 0) < 2000; // Menos de 2 segundos es rápido
  
  if (!debug_info) {
    return null; // No mostrar panel si no hay información de debug
  }

  return (
    <DebugContainer>
      <DebugTitle>
        🔍 Debug Panel - Sistema de Base de Conocimiento
        <PerformanceIndicator fast={isPerformanceFast}>
          {processing_time_ms}ms
        </PerformanceIndicator>
        {from_knowledge_base && (
          <SimilarityBadge score={similarity_score}>
            {similarity_score === 1.0 ? 'EXACTA' : `${(similarity_score * 100).toFixed(1)}%`}
          </SimilarityBadge>
        )}
      </DebugTitle>

      <StatsGrid>
        <StatCard>
          <StatValue>{debug_info.knowledge_base_stats.total_queries}</StatValue>
          <StatLabel>Consultas en Base</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{debug_info.knowledge_base_stats.total_usage}</StatValue>
          <StatLabel>Usos Totales</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{usage_count}</StatValue>
          <StatLabel>Usos Esta Consulta</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{debug_info.knowledge_base_stats.avg_usage}</StatValue>
          <StatLabel>Promedio Usos</StatLabel>
        </StatCard>
      </StatsGrid>

      {cost_info && (
        <CostContainer>
          <StepHeader>
            💰 Información de Costos en Tiempo Real
            <span style={{color: '#95a5a6', fontSize: '10px', marginLeft: '10px'}}>
              Precios reales de AWS
            </span>
          </StepHeader>
          <CostGrid>
            <CostCard>
              <CostValue>${(cost_info.operation_cost_usd * 1000000).toFixed(2)}µ</CostValue>
              <CostLabel>Esta Consulta</CostLabel>
            </CostCard>
            <CostCard>
              <CostValue>${(cost_info.total_session_cost * 1000).toFixed(3)}m</CostValue>
              <CostLabel>Sesión Total</CostLabel>
            </CostCard>
            <CostCard>
              <CostValue>{Object.keys(cost_info.cost_breakdown).length}</CostValue>
              <CostLabel>Servicios Usados</CostLabel>
            </CostCard>
            <CostCard>
              <CostValue>
                {from_knowledge_base ? '~60%' : '0%'}
              </CostValue>
              <CostLabel>Ahorro por Caché</CostLabel>
            </CostCard>
          </CostGrid>
          <StepDetails style={{marginTop: '10px'}}>
            <strong>Desglose:</strong> 
            {Object.entries(cost_info.cost_breakdown).map(([service, data]) => (
              <span key={service} style={{marginRight: '15px'}}>
                {service}: ${(data.total_cost * 1000).toFixed(3)}m
              </span>
            ))}
            <br/>
            <strong>Nota:</strong> µ = microdólares (millonésimas), m = milidólares (milésimas)
          </StepDetails>
        </CostContainer>
      )}

      <StepContainer>
        <StepHeader>📝 Normalización de Pregunta</StepHeader>
        <StepDetails>
          <strong>Original:</strong> "{debug_info.original_question}"<br/>
          <strong>Normalizada:</strong> "{debug_info.normalized_question}"
        </StepDetails>
      </StepContainer>

      {debug_info.agent_info && (
        <AgentInfoContainer>
          <StepHeader>
            🤖 {debug_info.agent_info.agent_type}
            <span style={{color: '#95a5a6', fontSize: '10px', marginLeft: '10px'}}>
              Estrategia: {debug_info.agent_info.optimization_strategy}
            </span>
          </StepHeader>
          <StepDetails>
            <strong>Tools Disponibles:</strong><br/>
            {debug_info.agent_info.tools_available.map((tool, idx) => (
              <ToolBadge key={idx}>{tool}</ToolBadge>
            ))}
          </StepDetails>
        </AgentInfoContainer>
      )}

      {debug_info.processing_steps.map((step, index) => (
        <StepContainer key={index}>
          <StepHeader>
            {step.step}. {step.action}
            {step.tool_used && <ToolBadge>{step.tool_used}</ToolBadge>}
            <span style={{color: '#95a5a6', fontSize: '10px', marginLeft: '10px'}}>
              {formatTime(step.timestamp)}
            </span>
          </StepHeader>
          <StepDetails>
            {step.details}
            {step.agent_reasoning && (
              <ReasoningText>
                🧠 <strong>Razonamiento del Agente:</strong> {step.agent_reasoning}
              </ReasoningText>
            )}
          </StepDetails>
        </StepContainer>
      ))}

      {debug_info.agent_info?.decision_tree && debug_info.agent_info.decision_tree.length > 0 && (
        <StepContainer>
          <StepHeader>🌳 Árbol de Decisiones del Agente</StepHeader>
          {debug_info.agent_info.decision_tree.map((decision, idx) => (
            <DecisionTree key={idx}>
              <strong>Decisión:</strong> {decision.decision}<br/>
              <strong>Razonamiento:</strong> {decision.reasoning}<br/>
              <strong>Tool Seleccionada:</strong> <ToolBadge>{decision.tool_selected}</ToolBadge>
              {decision.optimization && <><br/><strong>Optimización:</strong> {decision.optimization}</>}
              {decision.performance && <><br/><strong>Performance:</strong> {decision.performance}</>}
              {decision.fallback_strategy && <><br/><strong>Estrategia Fallback:</strong> {decision.fallback_strategy}</>}
              {decision.intelligence && <><br/><strong>Inteligencia:</strong> {decision.intelligence}</>}
              {decision.learning && <><br/><strong>Aprendizaje:</strong> {decision.learning}</>}
            </DecisionTree>
          ))}
        </StepContainer>
      )}

      <StepContainer>
        <StepHeader>
          📊 Resultado Final
          {from_knowledge_base ? (
            <span style={{color: '#2ecc71', marginLeft: '10px'}}>✅ OPTIMIZADO</span>
          ) : (
            <span style={{color: '#f39c12', marginLeft: '10px'}}>🆕 NUEVA</span>
          )}
        </StepHeader>
        <StepDetails>
          {from_knowledge_base 
            ? `Consulta reutilizada de la base de conocimiento. Ahorro de tiempo y recursos.`
            : `Nueva consulta creada y guardada para futuras referencias.`
          }
        </StepDetails>
      </StepContainer>
    </DebugContainer>
  );
};

export default DebugPanel;