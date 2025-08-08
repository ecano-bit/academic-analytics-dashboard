import React from 'react';

interface QueryResult {
  question: string;
  sql_query: string;
  columns: string[];
  data: any[];
  total_rows: number;
}

interface Props {
  result: QueryResult;
}

const ResultTable: React.FC<Props> = ({ result }) => {
  const formatValue = (value: any): string => {
    if (typeof value === 'number') {
      if (value % 1 === 0) {
        return value.toLocaleString();
      } else {
        return value.toFixed(2);
      }
    }
    return String(value);
  };

  const formatColumnName = (column: string): string => {
    return column
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="border-t border-academic-gray-200 pt-6">
      {/* Query Information */}
      <div className="bg-academic-gray-50 p-4 rounded-lg mb-6">
        <div className="mb-3">
          <span className="font-semibold text-academic-gray-900">Pregunta:</span>
          <span className="ml-2 text-academic-gray-700">{result.question}</span>
        </div>
        <div className="bg-academic-gray-800 text-academic-gray-100 p-3 rounded font-mono text-xs overflow-x-auto">
          {result.sql_query}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-lg font-semibold text-academic-gray-900">Resultados</h4>
        <span className="text-sm text-academic-gray-500">
          {result.total_rows} registro{result.total_rows !== 1 ? 's' : ''} encontrado{result.total_rows !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Results Table */}
      {result.data.length === 0 ? (
        <div className="text-center py-12 text-academic-gray-500 italic">
          No se encontraron resultados para esta consulta.
        </div>
      ) : (
        <div className="overflow-x-auto border border-academic-gray-200 rounded-lg">
          <table className="w-full border-collapse min-w-full">
            <thead>
              <tr className="bg-academic-blue-600">
                {result.columns.map((column, index) => (
                  <th key={index} className="text-white px-4 py-3 text-left font-semibold text-sm">
                    {formatColumnName(column)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.data.map((row, rowIndex) => (
                <tr key={rowIndex} className={`${rowIndex % 2 === 0 ? 'bg-white' : 'bg-academic-gray-50'} hover:bg-academic-blue-50 transition-colors duration-150`}>
                  {result.columns.map((column, colIndex) => (
                    <td key={colIndex} className="px-4 py-3 border-b border-academic-gray-200 text-sm text-academic-gray-700">
                      {formatValue(row[column])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ResultTable;