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
    learning_context?: string[];
    ai_model?: string;
    temperature?: number;
    result_count?: number;
    timestamp: string;
  }>;
  learning_stats?: {
    similar_queries_found: number;
    knowledge_base_size: string;
    learning_enabled: boolean;
  };
  knowledge_base_stats?: {
    total_queries: number;
    most_used_count: number;
    avg_usage: number;
    total_usage: number;
  };
  agent_info?: {
    agent_type: string;
    ai_model?: string;
    learning_system?: string;
    capabilities?: string[];
    tools_available?: string[];
    decision_tree?: Array<{
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
    intelligence_level?: string;
  };
}

interface QueryResult {
  debug?: {
    start_time: string;
    end_time: string;
    total_duration: number;
    model_used: string;
    estimated_cost: {
      input_tokens: number;
      output_tokens: number;
      input_cost_usd: number;
      output_cost_usd: number;
      total_cost_usd: number;
    };
    steps: Array<{
      step: string;
      duration?: number;
      timestamp?: number;
    }>;
  };
  // Backward compatibility
  from_knowledge_base?: boolean;
  usage_count?: number;
  similarity_score?: number;
  processing_time_ms?: number;
  learning_context?: number;
  debug_info?: DebugInfo;
  cost_info?: {
    operation_cost_usd: number;
    total_session_cost: number;
    cost_breakdown: Record<string, {
      cost?: number;
      total_cost?: number;
      request_count?: number;
      avg_cost_per_request?: number;
      description?: string;
    }>;
  };
}

interface Props {
  result: QueryResult;
}

const DebugPanel: React.FC<Props> = ({ result }) => {
  const { 
    debug,
    debug_info, 
    processing_time_ms = 0, 
    from_knowledge_base = false, 
    usage_count = 0, 
    similarity_score = 0,
    learning_context = 0,
    cost_info
  } = result;

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const totalDuration = debug?.total_duration ? debug.total_duration * 1000 : processing_time_ms;
  const isPerformanceFast = totalDuration < 2000; // Menos de 2 segundos es rápido
  
  // Mostrar panel si hay información de debug nueva o antigua
  if (!debug && !debug_info) {
    return null;
  }

  return (
    <div className="bg-academic-gray-800 text-gray-100 p-5 rounded-lg mt-5 font-mono text-xs max-h-96 overflow-y-auto">
      <h4 className="text-academic-blue-400 mb-4 font-sans flex items-center gap-2.5">
        🧠 Debug Panel - {debug ? 'Claude 3.5 Sonnet SQL Agent' : 'Agente Adaptativo con Aprendizaje'}
        <span className={`inline-block px-2 py-0.5 rounded-xl text-xs font-bold text-white ml-2.5 ${
          isPerformanceFast ? 'bg-green-600' : 'bg-yellow-500'
        }`}>
          {Math.round(totalDuration)}ms
        </span>
        {debug && (
          <span className="inline-block px-2 py-0.5 rounded-xl text-xs font-bold text-white ml-2.5 bg-blue-600">
            {debug.model_used.split('.')[1]}
          </span>
        )}
        {learning_context > 0 && (
          <span className="inline-block px-2 py-0.5 rounded-xl text-xs font-bold text-white ml-2.5 bg-purple-600">
            {learning_context} consultas similares
          </span>
        )}
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

      {/* Nueva información de debug de smartAgentLambda_v2 */}
      {debug && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-4">
            <div className="bg-blue-500/10 p-2.5 rounded text-center">
              <div className="text-blue-400 text-lg font-bold">{debug.estimated_cost.input_tokens}</div>
              <div className="text-gray-400 text-xs mt-0.5">Tokens Entrada</div>
            </div>
            <div className="bg-blue-500/10 p-2.5 rounded text-center">
              <div className="text-blue-400 text-lg font-bold">{debug.estimated_cost.output_tokens}</div>
              <div className="text-gray-400 text-xs mt-0.5">Tokens Salida</div>
            </div>
            <div className="bg-green-500/10 p-2.5 rounded text-center">
              <div className="text-green-400 text-lg font-bold">${(debug.estimated_cost.total_cost_usd * 1000).toFixed(3)}m</div>
              <div className="text-gray-400 text-xs mt-0.5">Costo Total</div>
            </div>
            <div className="bg-purple-500/10 p-2.5 rounded text-center">
              <div className="text-purple-400 text-lg font-bold">{debug.steps.length}</div>
              <div className="text-gray-400 text-xs mt-0.5">Pasos Ejecutados</div>
            </div>
          </div>
          
          <div className="bg-orange-500/10 p-4 rounded-md mb-4 border-l-4 border-orange-500">
            <div className="text-academic-blue-400 font-bold mb-1 flex items-center gap-2">
              💰 Información de Costos - Claude 3.5 Sonnet
            </div>
            <div className="text-gray-300 leading-relaxed">
              <strong>Entrada:</strong> {debug.estimated_cost.input_tokens} tokens × $3.00/1M = ${(debug.estimated_cost.input_cost_usd * 1000).toFixed(3)}m<br/>
              <strong>Salida:</strong> {debug.estimated_cost.output_tokens} tokens × $15.00/1M = ${(debug.estimated_cost.output_cost_usd * 1000).toFixed(3)}m<br/>
              <strong>Total:</strong> ${(debug.estimated_cost.total_cost_usd * 1000).toFixed(3)} milidólares
            </div>
          </div>
          
          <div className="mb-4 p-2.5 bg-academic-blue-500/10 border-l-4 border-academic-blue-400 rounded">
            <div className="text-academic-blue-400 font-bold mb-1">⏱️ Cronología de Ejecución</div>
            <div className="text-gray-300 leading-relaxed">
              <strong>Inicio:</strong> {new Date(debug.start_time).toLocaleTimeString()}<br/>
              <strong>Fin:</strong> {new Date(debug.end_time).toLocaleTimeString()}<br/>
              <strong>Duración Total:</strong> {Math.round(debug.total_duration * 1000)}ms
            </div>
          </div>
          
          {debug.steps.map((step, index) => (
            <div key={index} className="mb-4 p-2.5 bg-academic-blue-500/10 border-l-4 border-academic-blue-400 rounded">
              <div className="text-academic-blue-400 font-bold mb-1">
                {index + 1}. {step.step.replace('_', ' ').toUpperCase()}
                {step.duration && (
                  <span className="text-gray-400 text-xs ml-2.5">
                    {Math.round(step.duration * 1000)}ms
                  </span>
                )}
              </div>
              <div className="text-gray-300 leading-relaxed">
                {step.step === 'claude_sql_generation' && 'Generación de consulta SQL usando Claude 3.5 Sonnet'}
                {step.step === 'athena_execution' && 'Ejecución de consulta en Amazon Athena'}
                {step.step === 'parse_request' && 'Procesamiento de la solicitud del usuario'}
              </div>
            </div>
          ))}
        </>
      )}
      
      {/* Información de debug legacy */}
      {debug_info && debug_info.learning_stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-4">
          <div className="bg-purple-500/10 p-2.5 rounded text-center">
            <div className="text-purple-400 text-lg font-bold">{debug_info.learning_stats.similar_queries_found}</div>
            <div className="text-gray-400 text-xs mt-0.5">Consultas Similares</div>
          </div>
          <div className="bg-purple-500/10 p-2.5 rounded text-center">
            <div className="text-purple-400 text-lg font-bold">{debug_info.learning_stats.learning_enabled ? '✓' : '✗'}</div>
            <div className="text-gray-400 text-xs mt-0.5">Aprendizaje Activo</div>
          </div>
          <div className="bg-purple-500/10 p-2.5 rounded text-center">
            <div className="text-purple-400 text-lg font-bold">{debug_info.learning_stats.knowledge_base_size}</div>
            <div className="text-gray-400 text-xs mt-0.5">Base de Conocimiento</div>
          </div>
          <div className="bg-purple-500/10 p-2.5 rounded text-center">
            <div className="text-purple-400 text-lg font-bold">{learning_context}</div>
            <div className="text-gray-400 text-xs mt-0.5">Contexto Usado</div>
          </div>
        </div>
      )}
      
      {debug_info && debug_info.knowledge_base_stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-4">
          <div className="bg-green-500/10 p-2.5 rounded text-center">
            <div className="text-green-400 text-lg font-bold">{debug_info?.knowledge_base_stats?.total_queries || 0}</div>
            <div className="text-gray-400 text-xs mt-0.5">Consultas en Base</div>
          </div>
          <div className="bg-green-500/10 p-2.5 rounded text-center">
            <div className="text-green-400 text-lg font-bold">{debug_info?.knowledge_base_stats?.total_usage || 0}</div>
            <div className="text-gray-400 text-xs mt-0.5">Usos Totales</div>
          </div>
          <div className="bg-green-500/10 p-2.5 rounded text-center">
            <div className="text-green-400 text-lg font-bold">{usage_count}</div>
            <div className="text-gray-400 text-xs mt-0.5">Usos Esta Consulta</div>
          </div>
          <div className="bg-green-500/10 p-2.5 rounded text-center">
            <div className="text-green-400 text-lg font-bold">{debug_info?.knowledge_base_stats?.avg_usage || 0}</div>
            <div className="text-gray-400 text-xs mt-0.5">Promedio Usos</div>
          </div>
        </div>
      )}

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
                {service}: ${((data.cost || data.total_cost || 0) * 1000).toFixed(3)}m
                {data.description && <span className="text-gray-400"> ({data.description})</span>}
              </span>
            ))}
            <br/>
            <strong>Nota:</strong> µ = microdólares (millonésimas), m = milidólares (milésimas)
          </div>
        </div>
      )}

      {debug_info && (
        <div className="mb-4 p-2.5 bg-academic-blue-500/10 border-l-4 border-academic-blue-400 rounded">
          <div className="text-academic-blue-400 font-bold mb-1">📝 Normalización de Pregunta</div>
          <div className="text-gray-300 leading-relaxed">
            <strong>Original:</strong> "{debug_info.original_question}"<br/>
            <strong>Normalizada:</strong> "{debug_info.normalized_question}"
          </div>
        </div>
      )}

      {debug_info && debug_info.agent_info && (
        <div className="bg-purple-500/10 p-4 rounded-md mb-4 border-l-4 border-purple-500">
          <div className="text-academic-blue-400 font-bold mb-1 flex items-center gap-2">
            <img src={oli} alt="Oli" className="w-5 h-5" />
            {debug_info?.agent_info?.agent_type}
            <span className="text-gray-400 text-xs ml-2.5">
              Estrategia: {debug_info?.agent_info?.optimization_strategy}
            </span>
          </div>
          <div className="text-gray-300 leading-relaxed">
            {debug_info?.agent_info?.ai_model && (
              <><strong>Modelo IA:</strong> {debug_info?.agent_info?.ai_model}<br/></>
            )}
            {debug_info?.agent_info?.learning_system && (
              <><strong>Sistema de Aprendizaje:</strong> {debug_info?.agent_info?.learning_system}<br/></>
            )}
            {debug_info?.agent_info?.intelligence_level && (
              <><strong>Nivel de Inteligencia:</strong> {debug_info?.agent_info?.intelligence_level}<br/></>
            )}
            {debug_info?.agent_info?.capabilities && (
              <>
                <strong>Capacidades:</strong><br/>
                {debug_info?.agent_info?.capabilities?.map((capability, idx) => (
                  <span key={idx} className="bg-purple-600 text-white px-1.5 py-0.5 rounded-full text-xs mr-1">
                    {capability}
                  </span>
                ))}
              </>
            )}
            {debug_info?.agent_info?.tools_available && (
              <>
                <br/><strong>Tools Disponibles:</strong><br/>
                {debug_info?.agent_info?.tools_available?.map((tool, idx) => (
                  <span key={idx} className="bg-purple-600 text-white px-1.5 py-0.5 rounded-full text-xs mr-1">
                    {tool}
                  </span>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {debug_info && debug_info.processing_steps && debug_info.processing_steps.map((step, index) => (
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
            {step.learning_context && step.learning_context.length > 0 && (
              <div className="bg-purple-500/10 p-2 rounded mt-1 text-purple-400">
                📚 <strong>Contexto de Aprendizaje:</strong>
                <ul className="list-disc list-inside mt-1">
                  {step.learning_context.map((context, idx) => (
                    <li key={idx} className="text-xs">"{context}"</li>
                  ))}
                </ul>
              </div>
            )}
            {step.ai_model && (
              <div className="bg-blue-500/10 p-2 rounded mt-1 text-blue-400">
                🤖 <strong>Modelo IA:</strong> {step.ai_model}
                {step.temperature !== undefined && <span> (Temperatura: {step.temperature})</span>}
              </div>
            )}
            {step.agent_reasoning && (
              <div className="bg-academic-blue-500/10 p-2 rounded mt-1 italic text-academic-blue-400">
                🧠 <strong>Razonamiento del Agente:</strong> {step.agent_reasoning}
              </div>
            )}
          </div>
        </div>
      ))}

      {debug_info && debug_info.agent_info?.decision_tree && debug_info.agent_info.decision_tree.length > 0 && (
        <div className="mb-4 p-2.5 bg-academic-blue-500/10 border-l-4 border-academic-blue-400 rounded">
          <div className="text-academic-blue-400 font-bold mb-1">🌳 Árbol de Decisiones del Agente</div>
          {debug_info?.agent_info?.decision_tree?.map((decision, idx) => (
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