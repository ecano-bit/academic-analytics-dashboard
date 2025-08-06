import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Student } from './types';
import { ChartContainer, ChartTitle } from './Dashboard.styles';

interface RiskChartProps {
  students: Student[];
}

const RiskChart: React.FC<RiskChartProps> = ({ students }) => {
  const chartData = students.map(student => ({
    x: student.promedio_calificaciones,
    y: student.monto_adeudado,
    z: student.indice_riesgo,
    name: student.nombre_completo
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{ 
          background: 'white', 
          padding: '10px', 
          border: '1px solid #ccc',
          borderRadius: '4px'
        }}>
          <p><strong>{data.name}</strong></p>
          <p>Promedio: {data.x.toFixed(2)}</p>
          <p>Adeudo: ${data.y.toLocaleString()}</p>
          <p>Riesgo: {data.z.toFixed(1)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ChartContainer>
      <ChartTitle>Análisis de Riesgo: Calificaciones vs Adeudos</ChartTitle>
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            type="number" 
            dataKey="x" 
            name="Promedio"
            domain={[0, 10]}
            label={{ value: 'Promedio de Calificaciones', position: 'insideBottom', offset: -10 }}
          />
          <YAxis 
            type="number" 
            dataKey="y" 
            name="Adeudo"
            label={{ value: 'Monto Adeudado ($)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Scatter 
            dataKey="z" 
            fill="#e74c3c"
            fillOpacity={0.6}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default RiskChart;