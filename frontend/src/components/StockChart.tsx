import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { SimulationEvent } from '@/types/simulation';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { format } from 'date-fns';
import { useLanguage } from '@/i18n/LanguageContext';

interface StockChartProps {
  events: SimulationEvent[];
  reorderThreshold: number;
}

export function StockChart({ events, reorderThreshold }: StockChartProps) {
  const { t } = useLanguage();
  // Préparer les données pour le graphique
  const chartData = events
    .filter((e) => e.event_type === 'consumption')
    .map((event) => ({
      date: format(new Date(event.date), 'dd/MM'),
      stock: parseFloat(event.stock_after.toFixed(2)),
      threshold: reorderThreshold,
    }));

  // Ajouter les livraisons comme annotations
  const deliveries = events
    .filter((e) => e.event_type === 'delivery')
    .map((event) => ({
      date: format(new Date(event.date), 'dd/MM'),
      quantity: event.quantity,
    }));

  const orders = events
    .filter((e) => e.event_type === 'order')
    .map((event) => ({
      date: format(new Date(event.date), 'dd/MM'),
      quantity: event.quantity,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('stockChartTitle')}</CardTitle>
        <CardDescription>
          {t('stockChartDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis
                label={{ value: t('units'), angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const date = payload[0].payload.date;
                    const stock = payload[0].value;

                    const delivery = deliveries.find((d) => d.date === date);
                    const order = orders.find((o) => o.date === date);

                    return (
                      <div className="bg-white p-3 border rounded shadow-lg">
                        <p className="font-semibold">{date}</p>
                        <p className="text-sm">{t('stock')}: {stock} {t('units')}</p>
                        {delivery && (
                          <p className="text-sm text-green-600">
                            📦 {t('deliveries')}: +{delivery.quantity}
                          </p>
                        )}
                        {order && (
                          <p className="text-sm text-blue-600">
                            📋 {t('order')}: {order.quantity} {t('units')}
                          </p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <ReferenceLine
                y={reorderThreshold}
                stroke="red"
                strokeDasharray="5 5"
                label={{ value: t('thresholdLabel'), position: 'right' }}
              />
              <Line
                type="monotone"
                dataKey="stock"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                name={t('stock')}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
