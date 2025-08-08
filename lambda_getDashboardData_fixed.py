import json
import boto3
import pandas as pd
from io import StringIO

def lambda_handler(event, context):
    # Clientes de AWS
    athena_client = boto3.client('athena')
    s3_client = boto3.client('s3')
    bedrock_client = boto3.client('bedrock-runtime', region_name='us-east-1')
    
    # Configuración
    database = 'academic_analytics_db'
    table = 'vision_360_alumno'
    s3_bucket = 'tk-migracion-sqlserver'
    s3_output_location = f's3://{s3_bucket}/athena-results/'
    
    try:
        # Consulta SQL para obtener los datos
        query = f"""
        SELECT 
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
        
        # Ejecutar consulta en Athena
        response = athena_client.start_query_execution(
            QueryString=query,
            QueryExecutionContext={'Database': database},
            ResultConfiguration={'OutputLocation': s3_output_location}
        )
        
        query_execution_id = response['QueryExecutionId']
        
        # Esperar a que termine la consulta
        import time
        while True:
            result = athena_client.get_query_execution(QueryExecutionId=query_execution_id)
            status = result['QueryExecution']['Status']['State']
            
            if status in ['SUCCEEDED', 'FAILED', 'CANCELLED']:
                break
            time.sleep(1)
        
        if status != 'SUCCEEDED':
            raise Exception(f"Query failed with status: {status}")
        
        # Obtener resultados
        results = athena_client.get_query_results(QueryExecutionId=query_execution_id)
        
        # Procesar datos
        students = []
        rows = results['ResultSet']['Rows'][1:]  # Skip header
        
        for row in rows:
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
        
        # Calcular KPIs
        total_students = len(students)
        high_risk_students = len([s for s in students if s['indice_riesgo'] > 40])
        average_grade = sum(s['promedio_calificaciones'] for s in students) / total_students if total_students > 0 else 0
        total_debt = sum(s['monto_adeudado'] for s in students)
        
        kpis = {
            'total_students': total_students,
            'high_risk_students': high_risk_students,
            'average_grade': round(average_grade, 2),
            'total_debt': round(total_debt, 2)
        }
        
        # Generar resumen con Bedrock
        ai_summary = generate_ai_summary(bedrock_client, kpis, high_risk_students, total_students)
        
        # Respuesta final
        response_data = {
            'students': students,
            'kpis': kpis,
            'ai_summary': ai_summary
        }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': json.dumps(response_data)
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
                'error': f'Error interno del servidor.: {str(e)}'
            })
        }

def generate_ai_summary(bedrock_client, kpis, high_risk_students, total_students):
    """Genera un resumen ejecutivo usando Amazon Bedrock"""
    try:
        # Calcular porcentaje de riesgo
        risk_percentage = (high_risk_students / total_students * 100) if total_students > 0 else 0
        
        # Prompt para Bedrock
        prompt = f"""
        Actúa como un analista educativo senior. Basándote en los siguientes KPIs de una institución educativa, genera un resumen ejecutivo conciso y profesional de máximo 150 palabras:

        📊 DATOS CLAVE:
        - Total de estudiantes analizados: {kpis['total_students']}
        - Estudiantes en alto riesgo de deserción: {high_risk_students} ({risk_percentage:.1f}%)
        - Promedio general de calificaciones: {kpis['average_grade']}/10
        - Deuda total pendiente: ${kpis['total_debt']:,.2f}

        El resumen debe:
        1. Destacar los puntos más críticos
        2. Mencionar el nivel de riesgo de deserción
        3. Comentar sobre el rendimiento académico
        4. Incluir una recomendación estratégica breve
        5. Usar un tono profesional pero accesible

        Responde SOLO con el resumen, sin introducción ni explicaciones adicionales.
        """
        
        # Configurar el payload para Claude
        payload = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 200,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        }
        
        # Llamar a Bedrock
        response = bedrock_client.invoke_model(
            modelId='anthropic.claude-3-sonnet-20240229-v1:0',
            body=json.dumps(payload),
            contentType='application/json'
        )
        
        # Procesar respuesta
        response_body = json.loads(response['body'].read())
        ai_summary = response_body['content'][0]['text'].strip()
        
        return ai_summary
        
    except Exception as e:
        print(f"Error generando resumen de IA: {str(e)}")
        return f"📊 Análisis Rápido: Se analizaron {total_students} estudiantes. {high_risk_students} estudiantes ({risk_percentage:.1f}%) presentan alto riesgo de deserción. El promedio académico general es {kpis['average_grade']}/10. La deuda total asciende a ${kpis['total_debt']:,.2f}. Se recomienda implementar programas de retención estudiantil focalizados."