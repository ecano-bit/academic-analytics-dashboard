import json
import boto3
import time

def lambda_handler(event, context):
    athena_client = boto3.client('athena')
    
    database = 'academic_analytics_db'
    table = 'vision_360_alumno'
    s3_bucket = 'tk-migracion-sqlserver'
    s3_output_location = f's3://{s3_bucket}/athena-results/'
    
    try:
        # Obtener la pregunta del usuario
        body = json.loads(event['body']) if event.get('body') else {}
        user_question = body.get('question', '').strip()
        
        if not user_question:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                },
                'body': json.dumps({'error': 'Pregunta requerida'})
            }
        
        # Generar SQL basado en la pregunta
        sql_query = generate_sql_from_question(user_question, database, table)
        
        # Ejecutar consulta en Athena
        response = athena_client.start_query_execution(
            QueryString=sql_query,
            QueryExecutionContext={'Database': database},
            ResultConfiguration={'OutputLocation': s3_output_location}
        )
        
        query_execution_id = response['QueryExecutionId']
        
        # Esperar a que termine la consulta
        while True:
            result = athena_client.get_query_execution(QueryExecutionId=query_execution_id)
            status = result['QueryExecution']['Status']['State']
            
            if status in ['SUCCEEDED', 'FAILED', 'CANCELLED']:
                break
            time.sleep(1)
        
        if status != 'SUCCEEDED':
            error_reason = result['QueryExecution']['Status'].get('StateChangeReason', 'Query failed')
            raise Exception(f"Query failed: {error_reason}")
        
        # Obtener resultados
        results = athena_client.get_query_results(QueryExecutionId=query_execution_id)
        
        # Procesar resultados
        columns = [col['Name'] for col in results['ResultSet']['ResultSetMetadata']['ColumnInfo']]
        rows = []
        
        for row in results['ResultSet']['Rows'][1:]:  # Skip header
            row_data = {}
            for i, col in enumerate(columns):
                value = row['Data'][i].get('VarCharValue', '')
                # Convertir números si es posible
                try:
                    if '.' in value:
                        row_data[col] = float(value)
                    elif value.isdigit():
                        row_data[col] = int(value)
                    else:
                        row_data[col] = value
                except:
                    row_data[col] = value
            rows.append(row_data)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': json.dumps({
                'question': user_question,
                'sql_query': sql_query,
                'columns': columns,
                'data': rows,
                'total_rows': len(rows)
            })
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': f'Error procesando consulta: {str(e)}'
            })
        }

def generate_sql_from_question(question, database, table):
    """Genera SQL basado en la pregunta del usuario"""
    import re
    
    question_lower = question.lower()
    
    # Extraer números de la pregunta
    numbers = re.findall(r'\b(\d+)\b', question)
    limit = int(numbers[0]) if numbers else 10  # Usar el primer número encontrado o 10 por defecto
    
    # Esquema de la tabla
    schema_info = """
    Tabla: vision_360_alumno
    Columnas:
    - id_alumno (int): ID único del estudiante
    - nombre_completo (string): Nombre completo del estudiante
    - id_periodo (int): Período académico (1, 2, 3, 4)
    - promedio_calificaciones (float): Promedio de calificaciones del estudiante
    - monto_adeudado (float): Monto de deuda pendiente
    - indice_riesgo (float): Índice de riesgo de deserción (mayor = más riesgo)
    """
    
    # Patrones de consulta predefinidos
    if 'alto riesgo' in question_lower or 'riesgo alto' in question_lower:
        return f"SELECT DISTINCT nombre_completo, promedio_calificaciones, monto_adeudado, indice_riesgo FROM {database}.{table} WHERE indice_riesgo > 40 ORDER BY indice_riesgo DESC LIMIT {limit}"
    
    elif 'mejor promedio' in question_lower or 'mejores estudiantes' in question_lower:
        return f"SELECT DISTINCT nombre_completo, promedio_calificaciones, indice_riesgo FROM {database}.{table} ORDER BY promedio_calificaciones DESC LIMIT {limit}"
    
    elif 'mayor deuda' in question_lower or 'más deuda' in question_lower:
        return f"SELECT DISTINCT nombre_completo, monto_adeudado, promedio_calificaciones FROM {database}.{table} ORDER BY monto_adeudado DESC LIMIT {limit}"
    
    elif 'promedio por periodo' in question_lower or 'periodo' in question_lower:
        return f"SELECT id_periodo, AVG(promedio_calificaciones) as promedio_periodo, COUNT(DISTINCT id_alumno) as total_estudiantes FROM {database}.{table} GROUP BY id_periodo ORDER BY id_periodo"
    
    elif 'estudiantes sin deuda' in question_lower or 'sin deuda' in question_lower:
        return f"SELECT DISTINCT nombre_completo, promedio_calificaciones FROM {database}.{table} WHERE monto_adeudado = 0 ORDER BY promedio_calificaciones DESC LIMIT {limit}"
    
    elif 'bajo riesgo' in question_lower or 'riesgo bajo' in question_lower:
        return f"SELECT DISTINCT nombre_completo, promedio_calificaciones, indice_riesgo FROM {database}.{table} WHERE indice_riesgo < 30 ORDER BY indice_riesgo ASC LIMIT {limit}"
    
    elif 'total estudiantes' in question_lower or 'cuántos estudiantes' in question_lower:
        return f"SELECT COUNT(DISTINCT id_alumno) as total_estudiantes, AVG(promedio_calificaciones) as promedio_general FROM {database}.{table}"
    
    elif 'deuda promedio' in question_lower or 'promedio deuda' in question_lower:
        return f"SELECT AVG(monto_adeudado) as deuda_promedio, MIN(monto_adeudado) as deuda_minima, MAX(monto_adeudado) as deuda_maxima FROM {database}.{table}"
    
    else:
        # Consulta general por defecto
        return f"SELECT DISTINCT nombre_completo, promedio_calificaciones, monto_adeudado, indice_riesgo FROM {database}.{table} ORDER BY indice_riesgo DESC LIMIT {limit}"