import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RiskChart from './RiskChart';
import AsistenteDeDatos from './AsistenteDeDatos';
import { DashboardData } from './types';
import {
  DashboardContainer,
  Header,
  KPIContainer,
  KPICard,
  KPIValue,
  KPILabel,
  SummaryContainer,
  SummaryTitle,
  SummaryText
} from './Dashboard.styles';

const API_URL = 'https://acwdskrmtj.execute-api.us-east-2.amazonaws.com/prod/dashboard-data';

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(API_URL);
        setData(response.data);
      } catch (err) {
        setError('Error al cargar los datos');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>No hay datos disponibles</div>;

  return (
    <DashboardContainer>
      <Header>Academic Analytics Dashboard</Header>
      
      <KPIContainer>
        <KPICard>
          <KPIValue>{data.kpis.total_students}</KPIValue>
          <KPILabel>Total Estudiantes</KPILabel>
        </KPICard>
        
        <KPICard>
          <KPIValue>{data.kpis.high_risk_students}</KPIValue>
          <KPILabel>Estudiantes Alto Riesgo</KPILabel>
        </KPICard>
        
        <KPICard>
          <KPIValue>{data.kpis.average_grade.toFixed(2)}</KPIValue>
          <KPILabel>Promedio General</KPILabel>
        </KPICard>
        
        <KPICard>
          <KPIValue>${data.kpis.total_debt.toLocaleString()}</KPIValue>
          <KPILabel>Deuda Total</KPILabel>
        </KPICard>
      </KPIContainer>

      <SummaryContainer>
        <SummaryTitle>
          🤖 Resumen Ejecutivo con IA
        </SummaryTitle>
        <SummaryText>
          {data.ai_summary.split('\n').map((line, index) => (
            <span key={index}>
              {line}
              {index < data.ai_summary.split('\n').length - 1 && <br />}
            </span>
          ))}
        </SummaryText>
      </SummaryContainer>

      <RiskChart students={data.students} />
      
      <AsistenteDeDatos />
    </DashboardContainer>
  );
};

export default Dashboard;