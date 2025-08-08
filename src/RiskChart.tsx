import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Student } from './types';

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
        <div className="bg-white p-3 border border-academic-gray-300 rounded-lg shadow-lg">
          <p className="font-semibold text-academic-gray-900 mb-1">{data.name}</p>
          <p className="text-sm text-academic-gray-700">Promedio: {data.x.toFixed(2)}</p>
          <p className="text-sm text-academic-gray-700">Adeudo: ${data.y.toLocaleString()}</p>
          <p className="text-sm text-academic-gray-700">Riesgo: {data.z.toFixed(1)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-96">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            type="number" 
            dataKey="x" 
            name="Promedio"
            domain={[0, 10]}
            label={{ value: 'Promedio de Calificaciones', position: 'insideBottom', offset: -10 }}
            stroke="#6b7280"
          />
          <YAxis 
            type="number" 
            dataKey="y" 
            name="Adeudo"
            label={{ value: 'Monto Adeudado ($)', angle: -90, position: 'insideLeft' }}
            stroke="#6b7280"
          />
          <Tooltip content={<CustomTooltip />} />
          <Scatter 
            dataKey="z" 
            fill="#f97316"
            fillOpacity={0.7}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RiskChart;