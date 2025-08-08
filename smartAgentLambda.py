import json
import boto3
import time
import hashlib
from datetime import datetime, timedelta
from difflib import SequenceMatcher
from decimal import Decimal

def lambda_handler(event, context):
    # Clientes AWS
    athena_client = boto3.client('athena')
    dynamodb = boto3.resource('dynamodb')
    bedrock_client = boto3.client('bedrock-runtime', region_name='us-east-2')
    
    # Configuración
    cache_table = dynamodb.Table('AcademicAnalyticsCache')
    knowledge_base = dynamodb.Table('QueryKnowledgeBase')
    cost_tracker = dynamodb.Table('CostTracker')
    database = 'academic_analytics_db'
    table = 'vision_360_alumno'
    s3_bucket = 'tk-migracion-sqlserver'
    s3_output_location = f's3://{s3_bucket}/athena-results/'
    
    try:
        # Obtener parámetros de la solicitud
        body = json.loads(event.get('body', '{}')) if event.get('body') else {}
        query_type = body.get('type', 'dashboard')  # dashboard, query, analysis
        user_input = body.get('input', '')
        
        # Generar clave de caché
        cache_key = generate_cache_key(query_type, user_input)
        
        # Intentar obtener de caché
        cached_result = get_from_cache(cache_table, cache_key)
        if cached_result:
            return create_response(cached_result)
        
        # Procesar según el tipo de consulta
        if query_type == 'dashboard':
            result = process_dashboard_request(athena_client, database, table, s3_output_location)
        elif query_type == 'query':
            result = process_intelligent_query(athena_client, knowledge_base, database, table, s3_output_location, user_input)
        elif query_type == 'analysis':
            result = process_advanced_analysis(athena_client, bedrock_client, database, table, s3_output_location, user_input)
        elif query_type == 'popular':
            result = {
                'type': 'popular',
                'popular_queries': get_popular_queries(knowledge_base, int(user_input) if user_input.isdigit() else 10),
                'timestamp': datetime.now().isoformat()
            }
        elif query_type == 'costs':
            result = {
                'type': 'costs',
                'cost_summary': get_cost_summary(cost_tracker),
                'timestamp': datetime.now().isoformat()
            }
        else:
            raise ValueError(f"Tipo de consulta no soportado: {query_type}")
        
        # Calcular y registrar costos de esta operación
        operation_cost = calculate_operation_cost(query_type, result)
        update_cost_tracker(cost_tracker, query_type, operation_cost)
        
        # Agregar información de costos al resultado
        result['cost_info'] = {
            'operation_cost_usd': operation_cost,
            'total_session_cost': get_total_costs(cost_tracker),
            'cost_breakdown': get_cost_breakdown(cost_tracker)
        }
        
        # Guardar en caché
        save_to_cache(cache_table, cache_key, result, query_type)
        
        return create_response(result)
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return create_response({
            'error': f'Error procesando solicitud: {str(e)}'
        }, 500)

def generate_cache_key(query_type, user_input):
    """Genera una clave única para el caché"""
    content = f"{query_type}:{user_input}"
    return hashlib.md5(content.encode()).hexdigest()

def get_from_cache(cache_table, cache_key):
    """Obtiene datos del caché si existen y no han expirado"""
    try:
        response = cache_table.get_item(Key={'cache_key': cache_key})
        if 'Item' in response:
            item = response['Item']
            # Verificar si no ha expirado (TTL se maneja automáticamente, pero verificamos por seguridad)
            if item.get('ttl', 0) > int(time.time()):
                return json.loads(item['data'])
    except Exception as e:
        print(f"Error obteniendo caché: {e}")
    return None

def save_to_cache(cache_table, cache_key, data, query_type):
    """Guarda datos en caché con TTL apropiado"""
    try:
        # TTL según tipo de consulta
        ttl_minutes = {
            'dashboard': 15,    # Dashboard se actualiza cada 15 min
            'query': 60,        # Consultas SQL se cachean 1 hora
            'analysis': 30      # Análisis avanzados 30 min
        }
        
        ttl = int(time.time()) + (ttl_minutes.get(query_type, 30) * 60)
        
        cache_table.put_item(
            Item={
                'cache_key': cache_key,
                'data': json.dumps(data),
                'ttl': ttl,
                'created_at': datetime.now().isoformat(),
                'query_type': query_type
            }
        )
    except Exception as e:
        print(f"Error guardando caché: {e}")

def process_dashboard_request(athena_client, database, table, s3_output_location):
    """Procesa solicitudes del dashboard principal"""
    query = f"""
    SELECT DISTINCT
        id_alumno,
        nombre_completo,
        id_periodo,
        promedio_calificaciones,
        monto_adeudado,
        indice_riesgo
    FROM {database}.{table}
    ORDER BY indice_riesgo DESC
    LIMIT 100
    """
    
    results = execute_athena_query(athena_client, query, database, s3_output_location)
    
    # Procesar estudiantes únicos
    students = []
    unique_students = {}
    
    for row in results['ResultSet']['Rows'][1:]:
        data = row['Data']
        student = {
            'id_alumno': int(data[0]['VarCharValue']),
            'nombre_completo': data[1]['VarCharValue'],
            'id_periodo': int(data[2]['VarCharValue']),
            'promedio_calificaciones': float(data[3]['VarCharValue']),
            'monto_adeudado': float(data[4]['VarCharValue']),
            'indice_riesgo': float(data[5]['VarCharValue'])
        }
        students.append(student)
        
        # Mantener solo un registro por estudiante para KPIs
        student_id = student['id_alumno']
        if student_id not in unique_students:
            unique_students[student_id] = student
    
    unique_student_list = list(unique_students.values())
    
    # Calcular KPIs
    kpis = calculate_kpis(unique_student_list)
    
    # Generar resumen inteligente
    ai_summary = generate_smart_summary(kpis, unique_student_list)
    
    return {
        'type': 'dashboard',
        'students': students,
        'kpis': kpis,
        'ai_summary': ai_summary,
        'cached': False,
        'timestamp': datetime.now().isoformat()
    }

def process_intelligent_query(athena_client, knowledge_base, database, table, s3_output_location, user_question):
    """Procesa consultas usando base de conocimiento inteligente con debug detallado"""
    import re
    start_time = time.time()
    
    # Normalizar pregunta
    normalized_question = normalize_question(user_question)
    
    # Información de debug inicial
    debug_info = {
        'original_question': user_question,
        'normalized_question': normalized_question,
        'processing_steps': [],
        'knowledge_base_stats': get_knowledge_base_stats(knowledge_base),
        'agent_info': {
            'agent_type': 'Smart Query Agent',
            'tools_available': ['Knowledge Base Search', 'SQL Generator', 'Athena Executor', 'Result Processor'],
            'decision_tree': [],
            'optimization_strategy': 'Knowledge Base First'
        }
    }
    
    debug_info['processing_steps'].append({
        'step': 1,
        'action': 'Pregunta normalizada',
        'details': f'Original: "{user_question}" → Normalizada: "{normalized_question}"',
        'tool_used': 'Text Normalizer',
        'agent_reasoning': 'Normalizando pregunta para búsqueda eficiente en base de conocimiento',
        'timestamp': datetime.now().isoformat()
    })
    
    debug_info['agent_info']['decision_tree'].append({
        'decision': 'Normalizar entrada del usuario',
        'reasoning': 'Convertir pregunta a formato estándar para comparación',
        'tool_selected': 'Text Normalizer'
    })
    
    # Buscar en base de conocimiento
    knowledge_result, similarity_score = search_knowledge_base_with_debug(knowledge_base, normalized_question)
    
    if knowledge_result:
        debug_info['processing_steps'].append({
            'step': 2,
            'action': 'Encontrada en base de conocimiento',
            'details': f'Similitud: {similarity_score:.2%}, Usos previos: {knowledge_result["usage_count"]}, Creada: {knowledge_result.get("created_at", "N/A")}',
            'tool_used': 'Knowledge Base Search',
            'agent_reasoning': f'Agente decidió reutilizar consulta existente (similitud {similarity_score:.1%}). Estrategia de optimización exitosa.',
            'timestamp': datetime.now().isoformat()
        })
        
        debug_info['agent_info']['decision_tree'].append({
            'decision': 'Reutilizar consulta existente',
            'reasoning': f'Encontrada consulta similar con {similarity_score:.1%} de coincidencia',
            'tool_selected': 'Knowledge Base Retriever',
            'optimization': f'Ahorro estimado: ~3-5 segundos de generación SQL'
        })
        
        # Usar consulta existente y actualizar contador
        update_query_usage(knowledge_base, knowledge_result['query_pattern'])
        
        debug_info['processing_steps'].append({
            'step': 3,
            'action': 'Reutilizando SQL existente',
            'details': f'SQL: {knowledge_result["sql_query"][:100]}...',
            'tool_used': 'SQL Retriever',
            'agent_reasoning': 'Agente omite generación de SQL y usa consulta pre-validada de la base de conocimiento',
            'timestamp': datetime.now().isoformat()
        })
        
        # Ejecutar SQL conocido
        query_start = time.time()
        results = execute_athena_query(athena_client, knowledge_result['sql_query'], database, s3_output_location)
        query_time = time.time() - query_start
        
        debug_info['processing_steps'].append({
            'step': 4,
            'action': 'Consulta Athena ejecutada',
            'details': f'Tiempo: {query_time:.2f}s',
            'tool_used': 'Athena Executor',
            'agent_reasoning': 'Agente ejecuta consulta optimizada en Athena. Consulta pre-validada reduce riesgo de errores.',
            'timestamp': datetime.now().isoformat()
        })
        
        debug_info['agent_info']['decision_tree'].append({
            'decision': 'Ejecutar consulta en Athena',
            'reasoning': 'SQL validado previamente, ejecución directa',
            'tool_selected': 'Athena Query Engine',
            'performance': f'Tiempo de ejecución: {query_time:.2f}s'
        })
        
        # Procesar resultados
        columns, data = process_query_results(results)
        
        total_time = time.time() - start_time
        
        return {
            'type': 'query',
            'question': user_question,
            'sql_query': knowledge_result['sql_query'],
            'columns': columns,
            'data': data,
            'total_rows': len(data),
            'cached': False,
            'from_knowledge_base': True,
            'usage_count': knowledge_result['usage_count'] + 1,
            'similarity_score': similarity_score,
            'processing_time_ms': round(total_time * 1000, 2),
            'debug_info': debug_info,
            'timestamp': datetime.now().isoformat()
        }
    else:
        debug_info['processing_steps'].append({
            'step': 2,
            'action': 'No encontrada en base de conocimiento',
            'details': f'Generando nueva consulta SQL. Total consultas en base: {debug_info["knowledge_base_stats"]["total_queries"]}',
            'tool_used': 'Knowledge Base Search',
            'agent_reasoning': 'Agente no encontró consulta similar. Cambiando estrategia a generación de SQL desde cero.',
            'timestamp': datetime.now().isoformat()
        })
        
        debug_info['agent_info']['decision_tree'].append({
            'decision': 'Generar nueva consulta SQL',
            'reasoning': 'No hay consultas similares en base de conocimiento',
            'tool_selected': 'SQL Generator',
            'fallback_strategy': 'Generación inteligente basada en patrones'
        })
        
        # Generar nueva consulta
        question_lower = user_question.lower()
        numbers = re.findall(r'\b(\d+)\b', user_question)
        limit = int(numbers[0]) if numbers else 10
        
        sql_query = generate_intelligent_sql(question_lower, database, table, limit)
        
        debug_info['processing_steps'].append({
            'step': 3,
            'action': 'SQL generado',
            'details': f'Límite detectado: {limit}, SQL: {sql_query[:100]}...',
            'tool_used': 'Intelligent SQL Generator',
            'agent_reasoning': f'Agente analizó la pregunta y detectó patrón. Generó SQL con LIMIT {limit} basado en números encontrados.',
            'timestamp': datetime.now().isoformat()
        })
        
        debug_info['agent_info']['decision_tree'].append({
            'decision': f'Aplicar LIMIT {limit}',
            'reasoning': f'Número detectado en pregunta: "{numbers[0] if numbers else "ninguno"}"',
            'tool_selected': 'Pattern Matcher + SQL Builder',
            'intelligence': 'Extracción automática de parámetros de consulta'
        })
        
        # Ejecutar consulta
        query_start = time.time()
        results = execute_athena_query(athena_client, sql_query, database, s3_output_location)
        query_time = time.time() - query_start
        
        debug_info['processing_steps'].append({
            'step': 4,
            'action': 'Consulta Athena ejecutada',
            'details': f'Tiempo: {query_time:.2f}s (nueva consulta)',
            'tool_used': 'Athena Executor',
            'agent_reasoning': 'Agente ejecuta SQL recién generado. Tiempo adicional por ser consulta nueva sin optimizaciones previas.',
            'timestamp': datetime.now().isoformat()
        })
        
        # Procesar resultados
        columns, data = process_query_results(results)
        
        # Guardar en base de conocimiento
        save_to_knowledge_base(knowledge_base, normalized_question, sql_query, user_question)
        
        debug_info['processing_steps'].append({
            'step': 5,
            'action': 'Guardado en base de conocimiento',
            'details': f'Nueva consulta agregada para futuras referencias',
            'tool_used': 'Knowledge Base Writer',
            'agent_reasoning': 'Agente aprende de esta consulta y la guarda para optimizar futuras consultas similares. Sistema auto-mejorante.',
            'timestamp': datetime.now().isoformat()
        })
        
        debug_info['agent_info']['decision_tree'].append({
            'decision': 'Guardar consulta para aprendizaje',
            'reasoning': 'Consulta exitosa debe ser reutilizable',
            'tool_selected': 'Knowledge Base Storage',
            'learning': 'Sistema mejora automáticamente con cada consulta'
        })
        
        total_time = time.time() - start_time
        
        return {
            'type': 'query',
            'question': user_question,
            'sql_query': sql_query,
            'columns': columns,
            'data': data,
            'total_rows': len(data),
            'cached': False,
            'from_knowledge_base': False,
            'usage_count': 1,
            'similarity_score': 0.0,
            'processing_time_ms': round(total_time * 1000, 2),
            'debug_info': debug_info,
            'timestamp': datetime.now().isoformat()
        }

def process_advanced_analysis(athena_client, bedrock_client, database, table, s3_output_location, analysis_request):
    """Procesa análisis avanzados con múltiples herramientas"""
    
    # Obtener datos base
    base_query = f"""
    SELECT DISTINCT
        id_alumno,
        nombre_completo,
        promedio_calificaciones,
        monto_adeudado,
        indice_riesgo,
        id_periodo
    FROM {database}.{table}
    """
    
    results = execute_athena_query(athena_client, base_query, database, s3_output_location)
    
    # Procesar datos
    students = []
    for row in results['ResultSet']['Rows'][1:]:
        data = row['Data']
        students.append({
            'id_alumno': int(data[0]['VarCharValue']),
            'nombre_completo': data[1]['VarCharValue'],
            'promedio_calificaciones': float(data[2]['VarCharValue']),
            'monto_adeudado': float(data[3]['VarCharValue']),
            'indice_riesgo': float(data[4]['VarCharValue']),
            'id_periodo': int(data[5]['VarCharValue'])
        })
    
    # Análisis avanzado con múltiples herramientas
    analysis_result = perform_advanced_analysis(students, analysis_request)
    
    return {
        'type': 'analysis',
        'request': analysis_request,
        'analysis': analysis_result,
        'data_points': len(students),
        'cached': False,
        'timestamp': datetime.now().isoformat()
    }

def execute_athena_query(athena_client, query, database, s3_output_location):
    """Ejecuta consulta en Athena y retorna resultados"""
    response = athena_client.start_query_execution(
        QueryString=query,
        QueryExecutionContext={'Database': database},
        ResultConfiguration={'OutputLocation': s3_output_location}
    )
    
    query_execution_id = response['QueryExecutionId']
    
    # Esperar resultados
    while True:
        result = athena_client.get_query_execution(QueryExecutionId=query_execution_id)
        status = result['QueryExecution']['Status']['State']
        
        if status in ['SUCCEEDED', 'FAILED', 'CANCELLED']:
            break
        time.sleep(1)
    
    if status != 'SUCCEEDED':
        raise Exception(f"Query failed with status: {status}")
    
    return athena_client.get_query_results(QueryExecutionId=query_execution_id)

def generate_intelligent_sql(question_lower, database, table, limit):
    """Genera SQL más inteligente basado en patrones"""
    
    # Patrones mejorados
    if any(word in question_lower for word in ['alto riesgo', 'riesgo alto', 'deserción']):
        return f"SELECT DISTINCT nombre_completo, promedio_calificaciones, monto_adeudado, indice_riesgo FROM {database}.{table} WHERE indice_riesgo > 40 ORDER BY indice_riesgo DESC LIMIT {limit}"
    
    elif any(word in question_lower for word in ['mejor', 'mejores', 'top', 'excelente']):
        return f"SELECT DISTINCT nombre_completo, promedio_calificaciones, indice_riesgo FROM {database}.{table} ORDER BY promedio_calificaciones DESC LIMIT {limit}"
    
    elif any(word in question_lower for word in ['deuda', 'adeudo', 'debe']):
        return f"SELECT DISTINCT nombre_completo, monto_adeudado, promedio_calificaciones FROM {database}.{table} ORDER BY monto_adeudado DESC LIMIT {limit}"
    
    elif 'periodo' in question_lower:
        return f"SELECT id_periodo, AVG(promedio_calificaciones) as promedio_periodo, COUNT(DISTINCT id_alumno) as total_estudiantes FROM {database}.{table} GROUP BY id_periodo ORDER BY id_periodo"
    
    else:
        return f"SELECT DISTINCT nombre_completo, promedio_calificaciones, monto_adeudado, indice_riesgo FROM {database}.{table} ORDER BY indice_riesgo DESC LIMIT {limit}"

def calculate_kpis(students):
    """Calcula KPIs de estudiantes únicos"""
    total_students = len(students)
    high_risk_students = len([s for s in students if s['indice_riesgo'] > 40])
    average_grade = sum(s['promedio_calificaciones'] for s in students) / total_students if total_students > 0 else 0
    total_debt = sum(s['monto_adeudado'] for s in students)
    
    return {
        'total_students': total_students,
        'high_risk_students': high_risk_students,
        'average_grade': round(average_grade, 2),
        'total_debt': round(total_debt, 2)
    }

def generate_smart_summary(kpis, students):
    """Genera resumen inteligente mejorado"""
    total_students = kpis['total_students']
    high_risk_students = kpis['high_risk_students']
    risk_percentage = (high_risk_students / total_students * 100) if total_students > 0 else 0
    
    # Análisis de tendencias
    periods = {}
    for student in students:
        period = student['id_periodo']
        if period not in periods:
            periods[period] = []
        periods[period].append(student['indice_riesgo'])
    
    trend_analysis = ""
    if len(periods) > 1:
        avg_risks = {p: sum(risks)/len(risks) for p, risks in periods.items()}
        sorted_periods = sorted(avg_risks.items())
        if len(sorted_periods) >= 2:
            if sorted_periods[-1][1] > sorted_periods[0][1]:
                trend_analysis = " Tendencia creciente de riesgo por período."
            else:
                trend_analysis = " Tendencia decreciente de riesgo por período."
    
    # Análisis de situación
    if risk_percentage > 35:
        risk_level = "CRÍTICA"
        action = "intervención inmediata"
    elif risk_percentage > 25:
        risk_level = "ALTA"
        action = "medidas preventivas urgentes"
    else:
        risk_level = "CONTROLADA"
        action = "seguimiento regular"
    
    return f"""🎯 SITUACIÓN {risk_level}: {high_risk_students} de {total_students} estudiantes ({risk_percentage:.1f}%) en alto riesgo, requiere {action}.{trend_analysis}

📚 RENDIMIENTO: Promedio {kpis['average_grade']}/10. Deuda total: ${kpis['total_debt']:,.0f}.

🚀 RECOMENDACIÓN: {"Programa integral de retención" if risk_percentage > 25 else "Mantener monitoreo preventivo"}."""

def perform_advanced_analysis(students, request):
    """Realiza análisis avanzado con múltiples herramientas"""
    
    # Análisis de correlaciones
    correlations = calculate_correlations(students)
    
    # Segmentación de estudiantes
    segments = segment_students(students)
    
    # Predicciones simples
    predictions = generate_predictions(students)
    
    return {
        'correlations': correlations,
        'segments': segments,
        'predictions': predictions,
        'insights': generate_insights(students)
    }

def calculate_correlations(students):
    """Calcula correlaciones entre variables"""
    if len(students) < 2:
        return {}
    
    # Correlación simple entre calificaciones y riesgo
    grades = [s['promedio_calificaciones'] for s in students]
    risks = [s['indice_riesgo'] for s in students]
    debts = [s['monto_adeudado'] for s in students]
    
    return {
        'grade_risk_correlation': calculate_simple_correlation(grades, risks),
        'debt_risk_correlation': calculate_simple_correlation(debts, risks),
        'grade_debt_correlation': calculate_simple_correlation(grades, debts)
    }

def calculate_simple_correlation(x, y):
    """Calcula correlación simple entre dos listas"""
    if len(x) != len(y) or len(x) < 2:
        return 0
    
    n = len(x)
    sum_x = sum(x)
    sum_y = sum(y)
    sum_xy = sum(x[i] * y[i] for i in range(n))
    sum_x2 = sum(xi * xi for xi in x)
    sum_y2 = sum(yi * yi for yi in y)
    
    denominator = ((n * sum_x2 - sum_x * sum_x) * (n * sum_y2 - sum_y * sum_y)) ** 0.5
    if denominator == 0:
        return 0
    
    return (n * sum_xy - sum_x * sum_y) / denominator

def segment_students(students):
    """Segmenta estudiantes en grupos"""
    segments = {
        'alto_riesgo_alta_deuda': [],
        'alto_riesgo_baja_deuda': [],
        'bajo_riesgo_alta_deuda': [],
        'bajo_riesgo_baja_deuda': []
    }
    
    avg_debt = sum(s['monto_adeudado'] for s in students) / len(students) if students else 0
    
    for student in students:
        high_risk = student['indice_riesgo'] > 40
        high_debt = student['monto_adeudado'] > avg_debt
        
        if high_risk and high_debt:
            segments['alto_riesgo_alta_deuda'].append(student['nombre_completo'])
        elif high_risk and not high_debt:
            segments['alto_riesgo_baja_deuda'].append(student['nombre_completo'])
        elif not high_risk and high_debt:
            segments['bajo_riesgo_alta_deuda'].append(student['nombre_completo'])
        else:
            segments['bajo_riesgo_baja_deuda'].append(student['nombre_completo'])
    
    return {k: len(v) for k, v in segments.items()}

def generate_predictions(students):
    """Genera predicciones simples"""
    if not students:
        return {}
    
    high_risk_count = len([s for s in students if s['indice_riesgo'] > 40])
    total = len(students)
    
    return {
        'projected_dropouts': round(high_risk_count * 0.7),  # 70% de alto riesgo puede desertar
        'students_needing_support': high_risk_count,
        'retention_rate_projection': round((total - high_risk_count * 0.7) / total * 100, 1)
    }

def generate_insights(students):
    """Genera insights automáticos"""
    insights = []
    
    if not students:
        return insights
    
    # Insight sobre distribución de riesgo
    high_risk = len([s for s in students if s['indice_riesgo'] > 40])
    medium_risk = len([s for s in students if 30 <= s['indice_riesgo'] <= 40])
    low_risk = len([s for s in students if s['indice_riesgo'] < 30])
    
    insights.append(f"Distribución de riesgo: {high_risk} alto, {medium_risk} medio, {low_risk} bajo")
    
    # Insight sobre calificaciones
    avg_grade = sum(s['promedio_calificaciones'] for s in students) / len(students)
    if avg_grade < 7:
        insights.append("El promedio general está por debajo del estándar recomendado (7.0)")
    
    # Insight sobre deuda
    students_with_debt = len([s for s in students if s['monto_adeudado'] > 0])
    if students_with_debt > len(students) * 0.8:
        insights.append("Más del 80% de estudiantes tienen deuda pendiente")
    
    return insights

def normalize_question(question):
    """Normaliza pregunta para búsqueda en base de conocimiento"""
    import re
    
    # Convertir a minúsculas
    normalized = question.lower().strip()
    
    # Remover números específicos y reemplazar con placeholder
    normalized = re.sub(r'\b\d+\b', 'N', normalized)
    
    # Remover signos de puntuación
    normalized = re.sub(r'[^\w\s]', '', normalized)
    
    # Normalizar espacios
    normalized = ' '.join(normalized.split())
    
    return normalized

def search_knowledge_base(knowledge_base, normalized_question):
    """Busca consultas similares en la base de conocimiento"""
    result, _ = search_knowledge_base_with_debug(knowledge_base, normalized_question)
    return result

def search_knowledge_base_with_debug(knowledge_base, normalized_question):
    """Busca consultas similares en la base de conocimiento con información de debug"""
    try:
        # Buscar coincidencia exacta primero
        response = knowledge_base.get_item(Key={'query_pattern': normalized_question})
        if 'Item' in response:
            return response['Item'], 1.0  # Coincidencia exacta = 100%
        
        # Buscar coincidencias similares
        scan_response = knowledge_base.scan()
        best_match = None
        best_similarity = 0.0
        
        for item in scan_response.get('Items', []):
            similarity = SequenceMatcher(None, normalized_question, item['query_pattern']).ratio()
            if similarity > 0.8 and similarity > best_similarity:  # 80% de similitud mínima
                best_similarity = similarity
                best_match = item
        
        return best_match, best_similarity
        
    except Exception as e:
        print(f"Error buscando en base de conocimiento: {e}")
        return None, 0.0

def get_knowledge_base_stats(knowledge_base):
    """Obtiene estadísticas de la base de conocimiento"""
    try:
        scan_response = knowledge_base.scan()
        items = scan_response.get('Items', [])
        
        if not items:
            return {
                'total_queries': 0,
                'most_used_count': 0,
                'avg_usage': 0,
                'total_usage': 0
            }
        
        usage_counts = [int(item.get('usage_count', 0)) for item in items]
        total_usage = sum(usage_counts)
        
        return {
            'total_queries': len(items),
            'most_used_count': max(usage_counts) if usage_counts else 0,
            'avg_usage': round(total_usage / len(items), 2) if items else 0,
            'total_usage': total_usage
        }
    except Exception as e:
        print(f"Error obteniendo estadísticas: {e}")
        return {
            'total_queries': 0,
            'most_used_count': 0,
            'avg_usage': 0,
            'total_usage': 0
        }

def save_to_knowledge_base(knowledge_base, normalized_question, sql_query, original_question):
    """Guarda nueva consulta en la base de conocimiento"""
    try:
        knowledge_base.put_item(
            Item={
                'query_pattern': normalized_question,
                'sql_query': sql_query,
                'original_question': original_question,
                'usage_count': 1,
                'created_at': datetime.now().isoformat(),
                'last_used': datetime.now().isoformat()
            }
        )
    except Exception as e:
        print(f"Error guardando en base de conocimiento: {e}")

def update_query_usage(knowledge_base, query_pattern):
    """Actualiza contador de uso de consulta"""
    try:
        knowledge_base.update_item(
            Key={'query_pattern': query_pattern},
            UpdateExpression='ADD usage_count :inc SET last_used = :timestamp',
            ExpressionAttributeValues={
                ':inc': 1,
                ':timestamp': datetime.now().isoformat()
            }
        )
    except Exception as e:
        print(f"Error actualizando uso: {e}")

def process_query_results(results):
    """Procesa resultados de consulta Athena"""
    columns = [col['Name'] for col in results['ResultSet']['ResultSetMetadata']['ColumnInfo']]
    data = []
    
    for row in results['ResultSet']['Rows'][1:]:
        row_data = {}
        for i, col in enumerate(columns):
            value = row['Data'][i].get('VarCharValue', '')
            try:
                if '.' in value:
                    row_data[col] = float(value)
                elif value.isdigit():
                    row_data[col] = int(value)
                else:
                    row_data[col] = value
            except:
                row_data[col] = value
        data.append(row_data)
    
    return columns, data

def get_popular_queries(knowledge_base, limit=10):
    """Obtiene las consultas más populares"""
    try:
        response = knowledge_base.scan()
        items = response.get('Items', [])
        
        # Ordenar por uso
        sorted_items = sorted(items, key=lambda x: int(x.get('usage_count', 0)), reverse=True)
        
        return sorted_items[:limit]
    except Exception as e:
        print(f"Error obteniendo consultas populares: {e}")
        return []

def decimal_to_int(obj):
    """Convierte Decimal a int/float para serialización JSON"""
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    elif isinstance(obj, dict):
        return {k: decimal_to_int(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [decimal_to_int(item) for item in obj]
    return obj

def calculate_operation_cost(query_type, result):
    """Calcula el costo de la operación actual en USD"""
    cost = 0.0
    
    # Costos base por servicio (precios reales de AWS)
    costs = {
        'lambda_invocation': 0.0000002,  # $0.20 por 1M requests
        'athena_per_tb': 5.0,            # $5.00 por TB escaneado
        'dynamodb_read': 0.00000025,     # $0.25 por 1M RCU
        'dynamodb_write': 0.00000125,    # $1.25 por 1M WCU
        'bedrock_input_1k': 0.003,       # $3.00 por 1M tokens input
        'bedrock_output_1k': 0.015,      # $15.00 por 1M tokens output
        'api_gateway': 0.0000035         # $3.50 por 1M requests
    }
    
    # Costo base de Lambda + API Gateway
    cost += costs['lambda_invocation'] + costs['api_gateway']
    
    # Costo de DynamoDB (estimado)
    cost += costs['dynamodb_read'] * 2  # Lecturas de cache y knowledge base
    cost += costs['dynamodb_write'] * 1  # Escritura de tracking
    
    if query_type == 'query':
        # Costo de Athena (estimado 1MB de datos escaneados)
        cost += costs['athena_per_tb'] * 0.000001  # 1MB = 0.000001 TB
        
        # Si es de knowledge base, no hay costo de Athena adicional
        if result.get('from_knowledge_base'):
            cost -= costs['athena_per_tb'] * 0.000001
    
    elif query_type == 'dashboard':
        # Dashboard usa Athena + posible Bedrock
        cost += costs['athena_per_tb'] * 0.000002  # 2MB estimado
        cost += costs['bedrock_input_1k'] * 0.15   # ~150 tokens input
        cost += costs['bedrock_output_1k'] * 0.05  # ~50 tokens output
    
    elif query_type == 'analysis':
        # Análisis avanzado usa más Athena
        cost += costs['athena_per_tb'] * 0.000005  # 5MB estimado
    
    return round(cost, 6)  # 6 decimales para precisión

def update_cost_tracker(cost_tracker, service_type, cost):
    """Actualiza el tracking de costos"""
    try:
        cost_tracker.update_item(
            Key={'service_type': service_type},
            UpdateExpression='ADD total_cost :cost, request_count :count SET last_updated = :timestamp',
            ExpressionAttributeValues={
                ':cost': Decimal(str(cost)),
                ':count': 1,
                ':timestamp': datetime.now().isoformat()
            }
        )
        
        # También actualizar total general
        cost_tracker.update_item(
            Key={'service_type': 'TOTAL'},
            UpdateExpression='ADD total_cost :cost, request_count :count SET last_updated = :timestamp',
            ExpressionAttributeValues={
                ':cost': Decimal(str(cost)),
                ':count': 1,
                ':timestamp': datetime.now().isoformat()
            }
        )
    except Exception as e:
        print(f"Error actualizando costos: {e}")

def get_total_costs(cost_tracker):
    """Obtiene el costo total acumulado"""
    try:
        response = cost_tracker.get_item(Key={'service_type': 'TOTAL'})
        if 'Item' in response:
            return float(response['Item']['total_cost'])
    except Exception as e:
        print(f"Error obteniendo costos totales: {e}")
    return 0.0

def get_cost_breakdown(cost_tracker):
    """Obtiene desglose de costos por servicio"""
    try:
        response = cost_tracker.scan()
        breakdown = {}
        for item in response.get('Items', []):
            if item['service_type'] != 'TOTAL':
                breakdown[item['service_type']] = {
                    'total_cost': float(item.get('total_cost', 0)),
                    'request_count': int(item.get('request_count', 0)),
                    'avg_cost_per_request': float(item.get('total_cost', 0)) / max(int(item.get('request_count', 1)), 1)
                }
        return breakdown
    except Exception as e:
        print(f"Error obteniendo desglose de costos: {e}")
        return {}

def get_cost_summary(cost_tracker):
    """Obtiene resumen completo de costos"""
    total_cost = get_total_costs(cost_tracker)
    breakdown = get_cost_breakdown(cost_tracker)
    
    total_requests = sum(service['request_count'] for service in breakdown.values())
    avg_cost_per_request = total_cost / max(total_requests, 1)
    
    return {
        'total_cost_usd': total_cost,
        'total_requests': total_requests,
        'avg_cost_per_request': avg_cost_per_request,
        'cost_breakdown': breakdown,
        'estimated_monthly_cost': total_cost * 30 if total_requests > 0 else 0
    }

def create_response(data, status_code=200):
    """Crea respuesta HTTP estándar"""
    # Convertir Decimals antes de serializar
    clean_data = decimal_to_int(data)
    
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        },
        'body': json.dumps(clean_data)
    }