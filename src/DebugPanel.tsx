import React from 'react';
import oli from './images/oli.png';

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
    <div className="bg-academic-gray-800 text-gray-100 p-5 rounded-lg mt-5 font-mono text-xs max-h-96 overflow-y-auto">
      <h4 className="text-academic-blue-400 mb-4 font-sans flex items-center gap-2.5">
        🔍 Debug Panel - Sistema de Base de Conocimiento
        <span className={`inline-block px-2 py-0.5 rounded-xl text-xs font-bold text-white ml-2.5 ${
          isPerformanceFast ? 'bg-green-600' : 'bg-yellow-500'
        }`}>
          {processing_time_ms}ms
        </span>
        {from_knowledge_base && (
          <span className={`inline-block px-2 py-0.5 rounded-xl text-xs font-bold text-white ml-2.5 ${
            similarity_score === 1.0 ? 'bg-green-600' : 
            similarity_score > 0.9 ? 'bg-green-500' : 
            similarity_score > 0.8 ? 'bg-yellow-500' : 'bg-red-500'
          }`}>
            {similarity_score === 1.0 ? 'EXACTA' : `${(similarity_score * 100).toFixed(1)}%`}
          </span>
        )}
      </h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-4">
        <div className="bg-green-500/10 p-2.5 rounded text-center">
          <div className="text-green-400 text-lg font-bold">{debug_info.knowledge_base_stats.total_queries}</div>
          <div className="text-gray-400 text-xs mt-0.5">Consultas en Base</div>
        </div>
        <div className="bg-green-500/10 p-2.5 rounded text-center">
          <div className="text-green-400 text-lg font-bold">{debug_info.knowledge_base_stats.total_usage}</div>
          <div className="text-gray-400 text-xs mt-0.5">Usos Totales</div>
        </div>
        <div className="bg-green-500/10 p-2.5 rounded text-center">
          <div className="text-green-400 text-lg font-bold">{usage_count}</div>
          <div className="text-gray-400 text-xs mt-0.5">Usos Esta Consulta</div>
        </div>
        <div className="bg-green-500/10 p-2.5 rounded text-center">
          <div className="text-green-400 text-lg font-bold">{debug_info.knowledge_base_stats.avg_usage}</div>
          <div className="text-gray-400 text-xs mt-0.5">Promedio Usos</div>
        </div>
      </div>

      {cost_info && (
        <div className="bg-orange-500/10 p-4 rounded-md mb-4 border-l-4 border-orange-500">
          <div className="text-academic-blue-400 font-bold mb-1 flex items-center gap-2">
            💰 Información de Costos en Tiempo Real
            <span className="text-gray-400 text-xs ml-2.5">
              Precios reales de AWS
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mt-2.5">
            <div className="bg-red-500/10 p-2 rounded text-center">
              <div className="text-red-400 text-sm font-bold">${(cost_info.operation_cost_usd * 1000000).toFixed(2)}µ</div>
              <div className="text-gray-400 text-xs mt-0.5">Esta Consulta</div>
            </div>
            <div className="bg-red-500/10 p-2 rounded text-center">
              <div className="text-red-400 text-sm font-bold">${(cost_info.total_session_cost * 1000).toFixed(3)}m</div>
              <div className="text-gray-400 text-xs mt-0.5">Sesión Total</div>
            </div>
            <div className="bg-red-500/10 p-2 rounded text-center">
              <div className="text-red-400 text-sm font-bold">{Object.keys(cost_info.cost_breakdown).length}</div>
              <div className="text-gray-400 text-xs mt-0.5">Servicios Usados</div>
            </div>
            <div className="bg-red-500/10 p-2 rounded text-center">
              <div className="text-red-400 text-sm font-bold">
                {from_knowledge_base ? '~60%' : '0%'}
              </div>
              <div className="text-gray-400 text-xs mt-0.5">Ahorro por Caché</div>
            </div>
          </div>
          <div className="text-gray-300 leading-relaxed mt-2.5">
            <strong>Desglose:</strong> 
            {Object.entries(cost_info.cost_breakdown).map(([service, data]) => (
              <span key={service} className="mr-4">
                {service}: ${(data.total_cost * 1000).toFixed(3)}m
              </span>
            ))}
            <br/>
            <strong>Nota:</strong> µ = microdólares (millonésimas), m = milidólares (milésimas)
          </div>
        </div>
      )}

      <div className="mb-4 p-2.5 bg-academic-blue-500/10 border-l-4 border-academic-blue-400 rounded">
        <div className="text-academic-blue-400 font-bold mb-1">📝 Normalización de Pregunta</div>
        <div className="text-gray-300 leading-relaxed">
          <strong>Original:</strong> "{debug_info.original_question}"<br/>
          <strong>Normalizada:</strong> "{debug_info.normalized_question}"
        </div>
      </div>

      {debug_info.agent_info && (
        <div className="bg-purple-500/10 p-4 rounded-md mb-4 border-l-4 border-purple-500">
          <div className="text-academic-blue-400 font-bold mb-1 flex items-center gap-2">
            <img src={oli} alt="Oli" className="w-5 h-5" />
            {debug_info.agent_info.agent_type}
            <span className="text-gray-400 text-xs ml-2.5">
              Estrategia: {debug_info.agent_info.optimization_strategy}
            </span>
          </div>
          <div className="text-gray-300 leading-relaxed">
            <strong>Tools Disponibles:</strong><br/>
            {debug_info.agent_info.tools_available.map((tool, idx) => (
              <span key={idx} className="bg-purple-600 text-white px-1.5 py-0.5 rounded-full text-xs mr-1">
                {tool}
              </span>
            ))}
          </div>
        </div>
      )}

      {debug_info.processing_steps.map((step, index) => (
        <div key={index} className="mb-4 p-2.5 bg-academic-blue-500/10 border-l-4 border-academic-blue-400 rounded">
          <div className="text-academic-blue-400 font-bold mb-1">
            {step.step}. {step.action}
            {step.tool_used && (
              <span className="bg-purple-600 text-white px-1.5 py-0.5 rounded-full text-xs mr-1">
                {step.tool_used}
              </span>
            )}
            <span className="text-gray-400 text-xs ml-2.5">
              {formatTime(step.timestamp)}
            </span>
          </div>
          <div className="text-gray-300 leading-relaxed">
            {step.details}
            {step.agent_reasoning && (
              <div className="bg-academic-blue-500/10 p-2 rounded mt-1 italic text-academic-blue-400">
                🧠 <strong>Razonamiento del Agente:</strong> {step.agent_reasoning}
              </div>
            )}
          </div>
        </div>
      ))}

      {debug_info.agent_info?.decision_tree && debug_info.agent_info.decision_tree.length > 0 && (
        <div className="mb-4 p-2.5 bg-academic-blue-500/10 border-l-4 border-academic-blue-400 rounded">
          <div className="text-academic-blue-400 font-bold mb-1">🌳 Árbol de Decisiones del Agente</div>
          {debug_info.agent_info.decision_tree.map((decision, idx) => (
            <div key={idx} className="bg-green-500/10 p-2.5 rounded mt-2.5 border-l-2 border-green-500">
              <strong>Decisión:</strong> {decision.decision}<br/>
              <strong>Razonamiento:</strong> {decision.reasoning}<br/>
              <strong>Tool Seleccionada:</strong> 
              <span className="bg-purple-600 text-white px-1.5 py-0.5 rounded-full text-xs ml-1">
                {decision.tool_selected}
              </span>
              {decision.optimization && <><br/><strong>Optimización:</strong> {decision.optimization}</>}
              {decision.performance && <><br/><strong>Performance:</strong> {decision.performance}</>}
              {decision.fallback_strategy && <><br/><strong>Estrategia Fallback:</strong> {decision.fallback_strategy}</>}
              {decision.intelligence && <><br/><strong>Inteligencia:</strong> {decision.intelligence}</>}
              {decision.learning && <><br/><strong>Aprendizaje:</strong> {decision.learning}</>}
            </div>
          ))}
        </div>
      )}

      <div className="mb-4 p-2.5 bg-academic-blue-500/10 border-l-4 border-academic-blue-400 rounded">
        <div className="text-academic-blue-400 font-bold mb-1">
          📊 Resultado Final
          {from_knowledge_base ? (
            <span className="text-green-400 ml-2.5">✅ OPTIMIZADO</span>
          ) : (
            <span className="text-yellow-500 ml-2.5">🆕 NUEVA</span>
          )}
        </div>
        <div className="text-gray-300 leading-relaxed">
          {from_knowledge_base 
            ? `Consulta reutilizada de la base de conocimiento. Ahorro de tiempo y recursos.`
            : `Nueva consulta creada y guardada para futuras referencias.`
          }
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;