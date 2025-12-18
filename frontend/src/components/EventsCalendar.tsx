import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { SimulationEvent } from '@/types/simulation';
import { format } from 'date-fns';
import { Calendar, Package, ShoppingCart, AlertTriangle, TrendingDown } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

interface EventsCalendarProps {
  events: SimulationEvent[];
}

const eventIcons = {
  consumption: TrendingDown,
  order: ShoppingCart,
  delivery: Package,
  threshold_crossed: AlertTriangle,
  low_stock_warning: AlertTriangle,
};

const eventColors = {
  consumption: 'text-gray-500',
  order: 'text-blue-500',
  delivery: 'text-green-500',
  threshold_crossed: 'text-orange-500',
  low_stock_warning: 'text-red-500',
};

const eventBgColors = {
  consumption: 'bg-gray-50',
  order: 'bg-blue-50',
  delivery: 'bg-green-50',
  threshold_crossed: 'bg-orange-50',
  low_stock_warning: 'bg-red-50',
};

export function EventsCalendar({ events }: EventsCalendarProps) {
  const { t } = useLanguage();

  // Traduction des descriptions d'événements
  const translateEventDescription = (description: string): string => {
    // Commande
    if (description.includes('Commande')) {
      const match = description.match(/Commande #(\d+) de (\d+) unités.*?(\d{4}-\d{2}-\d{2})/);
      if (match) {
        return `${t('orderPlaced')} #${match[1]} ${t('of')} ${match[2]} ${t('units')} (${t('deliveryExpected')} ${match[3]})`;
      }
    }
    // Livraison
    if (description.includes('Livraison')) {
      const match = description.match(/Livraison #(\d+) de (\d+) unités.*?(\d{4}-\d{2}-\d{2})/);
      if (match) {
        return `${t('deliveryReceived')} #${match[1]} ${t('of')} ${match[2]} ${t('units')} (${t('orderedOn')} ${match[3]})`;
      }
    }
    // Passage sous le seuil
    if (description.includes('Passage sous le seuil')) {
      const match = description.match(/Passage sous le seuil de ([\d.]+) unités/);
      if (match) {
        return `${t('thresholdCrossed')} ${match[1]} ${t('units')}`;
      }
    }
    return description;
  };

  // Filtrer les événements importants (pas la consommation quotidienne)
  const importantEvents = events.filter(
    (e) => e.event_type !== 'consumption'
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {t('eventsTitle')}
        </CardTitle>
        <CardDescription>
          {importantEvents.length} {t('eventsDescription')} {events.length} {t('total')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {importantEvents.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {t('noEvents')}
            </p>
          ) : (
            importantEvents.map((event, index) => {
              const Icon = eventIcons[event.event_type];
              const colorClass = eventColors[event.event_type];
              const bgClass = eventBgColors[event.event_type];

              return (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded-lg ${bgClass} border border-gray-200`}
                >
                  <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${colorClass}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="font-medium text-sm">
                        {format(new Date(event.date), 'dd/MM/yyyy')}
                        {!event.is_working_day && (
                          <span className="ml-2 text-xs text-gray-500">({t('sunday')})</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('stock')}: {event.stock_after.toFixed(2)}
                      </p>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">
                      {translateEventDescription(event.description)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
