export interface Student {
  id_alumno: number;
  nombre_completo: string;
  id_periodo: number;
  promedio_calificaciones: number;
  monto_adeudado: number;
  indice_riesgo: number;
}

export interface KPIs {
  total_students: number;
  high_risk_students: number;
  average_grade: number;
  total_debt: number;
}

export interface DashboardData {
  students: Student[];
  kpis: KPIs;
  ai_summary: string;
}