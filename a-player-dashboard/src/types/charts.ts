// Chart data types

export interface ChartData {
  attribute: string;
  managerScore: number;
  peerScore: number;
  selfScore: number;
  weightedScore: number;
}

export interface RadarChartData {
  attribute: string;
  score: number;
  fullMark: number;
}

export interface TrendChartData {
  quarter: string;
  score: number;
  date: string;
}

export interface BarChartData {
  attribute: string;
  Manager: number;
  Peer: number;
  Self: number;
  Weighted: number;
}

export interface ChartColors {
  manager: string;
  peer: string;
  self: string;
  weighted: string;
}

export interface ChartConfig {
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  colors: ChartColors;
}

export interface LegendData {
  value: string;
  type: string;
  color: string;
} 