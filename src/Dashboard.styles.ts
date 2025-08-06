import styled from 'styled-components';

export const DashboardContainer = styled.div`
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
`;

export const Header = styled.h1`
  color: #2c3e50;
  text-align: center;
  margin-bottom: 30px;
`;

export const KPIContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

export const KPICard = styled.div`
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  text-align: center;
`;

export const KPIValue = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #3498db;
  margin-bottom: 5px;
`;

export const KPILabel = styled.div`
  color: #7f8c8d;
  font-size: 0.9rem;
`;

export const ChartContainer = styled.div`
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 20px;
`;

export const ChartTitle = styled.h3`
  color: #2c3e50;
  margin-bottom: 20px;
  text-align: center;
`;

export const SummaryContainer = styled.div`
  background: white;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 20px;
  border-left: 4px solid #3498db;
`;

export const SummaryTitle = styled.h3`
  color: #2c3e50;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const SummaryText = styled.p`
  color: #34495e;
  line-height: 1.6;
  margin: 0;
`;