import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RiskChart from './RiskChart';
import AsistenteDeDatos from './AsistenteDeDatos';
import { DashboardData } from './types';
import oliImage from './images/oli.png';

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-academic-blue-600"></div>
          <p className="text-academic-gray-600 font-medium">Cargando datos...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="academic-card max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-academic-gray-900 mb-2">Error al cargar datos</h2>
          <p className="text-academic-gray-600">{error}</p>
        </div>
      </div>
    );
  }
  
  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="academic-card max-w-md text-center">
          <div className="text-academic-gray-400 text-5xl mb-4">📊</div>
          <h2 className="text-xl font-semibold text-academic-gray-900 mb-2">No hay datos disponibles</h2>
          <p className="text-academic-gray-600">Intenta recargar la página</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-academic-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-academic-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <h1 className="text-2xl font-bold text-academic-gray-900">
                Academic Analytics
              </h1>
            </div>
            <div className="text-sm text-academic-gray-500">
              Resumen Ejecutivo de la Plataforma Educativa
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPIs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="academic-card hover:shadow-academic-lg transition-shadow duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-academic-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-academic-blue-600 text-2xl">👥</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-3xl font-bold text-academic-gray-900">{data.kpis.total_students}</p>
                <p className="text-sm font-medium text-academic-gray-600">Total Estudiantes</p>
              </div>
            </div>
          </div>

          <div className="academic-card hover:shadow-academic-lg transition-shadow duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <span className="text-red-600 text-2xl">⚠️</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-3xl font-bold text-academic-gray-900">{data.kpis.high_risk_students}</p>
                <p className="text-sm font-medium text-academic-gray-600">Estudiantes Alto Riesgo</p>
              </div>
            </div>
          </div>

          <div className="academic-card hover:shadow-academic-lg transition-shadow duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 text-2xl">📊</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-3xl font-bold text-academic-gray-900">{data.kpis.average_grade.toFixed(2)}</p>
                <p className="text-sm font-medium text-academic-gray-600">Promedio General</p>
              </div>
            </div>
          </div>

          <div className="academic-card hover:shadow-academic-lg transition-shadow duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-academic-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-academic-orange-600 text-2xl">💰</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-3xl font-bold text-academic-gray-900">${data.kpis.total_debt.toLocaleString()}</p>
                <p className="text-sm font-medium text-academic-gray-600">Deuda Total</p>
              </div>
            </div>
          </div>
        </div>

       

        {/* AI Assistant Section - Full Width */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-academic border border-academic-gray-200 overflow-hidden">
            <div className="bg-academic-blue-600 px-6 py-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <img src={oliImage} alt="Oli Assistant" className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Asistente de Datos IA
                </h3>
                <div className="flex-1"></div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="p-6 bg-academic-gray-50 min-h-[500px]">
              <AsistenteDeDatos />
            </div>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Risk Analysis Chart */}
          <div className="academic-card">
            <h3 className="text-xl font-semibold text-academic-gray-900 mb-6">
              Análisis de Riesgo Estudiantil
            </h3>
            <RiskChart students={data.students} />
            <div className="mt-4 p-4 bg-academic-gray-50 rounded-lg">
              <h4 className="text-sm font-semibold text-academic-gray-700 mb-2">Interpretación del Gráfico</h4>
              <p className="text-xs text-academic-gray-600">
                Este gráfico muestra la relación entre el promedio académico y la deuda estudiantil. 
                Los puntos en la zona superior izquierda representan estudiantes con alto rendimiento y baja deuda.
              </p>
            </div>
          </div>
          <div className="academic-card mb-8">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-academic-orange-500 rounded-lg flex items-center justify-center mr-4">
              <img src={oliImage} alt="Oli Assistant" className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-academic-gray-900">
              Resumen Ejecutivo con IA
            </h2>
          </div>
          <div className="prose prose-lg max-w-none flex items-center">
            <div className="text-academic-gray-700 leading-relaxed">
              {data.ai_summary.split('\n').map((line, index) => (
                <p key={index} className="mb-3">
                  {line}
                </p>
              ))}
            </div>
          </div>
        </div>
          
        
        </div>
      </main>
    </div>
  );
};

export default Dashboard;