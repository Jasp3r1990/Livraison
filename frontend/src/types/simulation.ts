export interface SimulationConfig {
  daily_consumption: number;
  initial_stock: number;
  reorder_threshold: number;
  max_stock: number;
  min_order_quantity: number;
  max_order_quantity: number;
  lot_size: number;
  delivery_lead_time_days: number;
  simulation_days: number;
  min_stock_to_start_sales?: number;
  start_date?: string;
}

export interface SimulationEvent {
  date: string;
  event_type: 'consumption' | 'order' | 'delivery' | 'threshold_crossed' | 'low_stock_warning';
  description: string;
  stock_before: number;
  stock_after: number;
  quantity: number;
  is_working_day: boolean;
  order_id?: number;
}

export interface Order {
  order_id: number;
  order_date: string;
  delivery_date: string;
  quantity: number;
  delivered: boolean;
}

export interface SimulationStatistics {
  final_stock: number;
  stockouts_count: number;
  total_ordered: number;
  average_stock: number;
  min_stock: number;
  max_stock: number;
  total_events: number;
  total_orders: number;
}

export interface DailyDetail {
  date: string;
  day_of_week: string;
  is_working_day: boolean;
  stock_start: number;
  deliveries: number;
  consumption: number;
  stock_end: number;
  orders_placed: number;
  order_quantity: number;
  order_id?: number;
  delivery_id?: number;
  has_threshold_crossed: boolean;
  has_stockout: boolean;
}

export interface SimulationResult {
  config: SimulationConfig;
  events: SimulationEvent[];
  orders: Order[];
  daily_details: DailyDetail[];
  statistics: SimulationStatistics;
}

export interface AnalysisResult {
  viability: {
    is_viable: boolean;
    service_level: number;
    status: string;
  };
  trend_analysis?: {
    trend: 'descending' | 'stable' | 'ascending' | 'unknown';
    is_viable: boolean;
    avg_change_per_day: number;
    final_vs_initial: number;
    description: string;
    initial_stock: number;
    final_stock: number;
    stockouts_in_period: number;
  };
  stability_solutions?: {
    message: string;
    current_consumption: number;
    current_max_order: number;
    max_viable_consumption: number | null;
    min_required_max_order: number | null;
    solutions: Array<{
      type: string;
      current_value: number;
      suggested_value: number;
      message: string;
    }>;
  };
  recommendations: string[];
  risks: string[];
  metrics: {
    average_days_of_stock: number;
    average_order_size: number;
    order_frequency: number;
  };
}
