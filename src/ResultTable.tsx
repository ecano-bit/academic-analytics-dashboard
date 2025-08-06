import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ecf0f1;
`;

const QueryInfo = styled.div`
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 20px;
`;

const QueryText = styled.div`
  font-family: 'Courier New', monospace;
  background: #2c3e50;
  color: #ecf0f1;
  padding: 10px;
  border-radius: 4px;
  font-size: 12px;
  margin-top: 10px;
  overflow-x: auto;
`;

const ResultsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
`;

const ResultCount = styled.span`
  color: #7f8c8d;
  font-size: 14px;
`;

const TableContainer = styled.div`
  overflow-x: auto;
  border: 1px solid #ddd;
  border-radius: 6px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
`;

const TableHeader = styled.th`
  background: #34495e;
  color: white;
  padding: 12px;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid #2c3e50;
`;

const TableRow = styled.tr`
  &:nth-child(even) {
    background: #f8f9fa;
  }
  
  &:hover {
    background: #e8f4f8;
  }
`;

const TableCell = styled.td`
  padding: 10px 12px;
  border-bottom: 1px solid #ddd;
  font-size: 14px;
`;

const NoResults = styled.div`
  text-align: center;
  color: #7f8c8d;
  padding: 40px;
  font-style: italic;
`;

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
    <Container>
      <QueryInfo>
        <strong>Pregunta:</strong> {result.question}
        <QueryText>{result.sql_query}</QueryText>
      </QueryInfo>

      <ResultsHeader>
        <h4>Resultados</h4>
        <ResultCount>
          {result.total_rows} registro{result.total_rows !== 1 ? 's' : ''} encontrado{result.total_rows !== 1 ? 's' : ''}
        </ResultCount>
      </ResultsHeader>

      {result.data.length === 0 ? (
        <NoResults>No se encontraron resultados para esta consulta.</NoResults>
      ) : (
        <TableContainer>
          <Table>
            <thead>
              <tr>
                {result.columns.map((column, index) => (
                  <TableHeader key={index}>
                    {formatColumnName(column)}
                  </TableHeader>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.data.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {result.columns.map((column, colIndex) => (
                    <TableCell key={colIndex}>
                      {formatValue(row[column])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </tbody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default ResultTable;