import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { DailyDetail } from '@/types/simulation';
import { format } from 'date-fns';
import { fr, es } from 'date-fns/locale';
import { Calendar, TrendingDown, Package, ShoppingCart, AlertTriangle, List, CalendarDays } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useState } from 'react';

interface DailyCalendarViewProps {
  dailyDetails: DailyDetail[];
}

export function DailyCalendarView({ dailyDetails }: DailyCalendarViewProps) {
  const { t, language } = useLanguage();
  const locale = language === 'es' ? es : fr;
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // Mapper pour convertir jours français en clés de traduction
  const dayNameMap: { [key: string]: string } = {
    'Lundi': 'mondayLower',
    'Mardi': 'tuesdayLower',
    'Mercredi': 'wednesdayLower',
    'Jeudi': 'thursdayLower',
    'Vendredi': 'fridayLower',
    'Samedi': 'saturdayLower',
    'Dimanche': 'sundayLower',
  };

  const translateDayName = (dayName: string): string => {
    const key = dayNameMap[dayName];
    return key ? t(key as any) : dayName;
  };

  // Organiser les jours par semaine (Lundi = 1, Dimanche = 0)
  const organizeByWeeks = () => {
    const weeks: DailyDetail[][] = [];
    let currentWeek: DailyDetail[] = [];
    
    dailyDetails.forEach((day, index) => {
      const dayDate = new Date(day.date);
      const dayOfWeek = dayDate.getDay(); // 0=Dimanche, 1=Lundi, ..., 6=Samedi
      
      // Si c'est lundi (1) et qu'on a déjà des jours, commencer une nouvelle semaine
      if (dayOfWeek === 1 && currentWeek.length > 0) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
      
      currentWeek.push(day);
      
      // Si c'est le dernier jour, ajouter la semaine même si incomplète
      if (index === dailyDetails.length - 1 && currentWeek.length > 0) {
        weeks.push(currentWeek);
      }
    });
    
    return weeks;
  };

  const weeks = organizeByWeeks();

  const renderCalendarView = () => (
    <div className="space-y-4">
      {weeks.map((week, weekIndex) => (
        <div key={weekIndex} className="border rounded-lg overflow-hidden">
          {/* En-tête de semaine */}
          <div className="bg-blue-100 px-4 py-2 font-semibold text-sm">
            {t('week')} {weekIndex + 1}
          </div>
          
          {/* Grille des jours */}
          <div className="grid grid-cols-7 gap-0">
            {/* Remplir les cases vides avant le premier jour de la semaine */}
            {week[0] && Array.from({ length: (new Date(week[0].date).getDay() + 6) % 7 }).map((_, i) => (
              <div key={`empty-${i}`} className="border p-2 bg-gray-50 min-h-[120px]"></div>
            ))}
            
            {/* Jours de la semaine */}
            {week.map((day, dayIndex) => {
              const dayDate = new Date(day.date);
              const isSunday = dayDate.getDay() === 0;
              
              return (
                <div
                  key={dayIndex}
                  className={`border p-2 min-h-[120px] ${
                    day.has_stockout
                      ? 'bg-red-50 border-red-300'
                      : day.has_threshold_crossed
                      ? 'bg-orange-50 border-orange-300'
                      : isSunday
                      ? 'bg-gray-100'
                      : 'bg-white hover:bg-blue-50/30'
                  } transition-colors`}
                >
                  {/* En-tête du jour */}
                  <div className="font-semibold text-sm mb-2">
                    <div className={isSunday ? 'text-red-600' : 'text-gray-900'}>
                      {format(dayDate, 'EEE', { locale })}
                    </div>
                    <div className="text-lg">{format(dayDate, 'd', { locale })}</div>
                  </div>
                  
                  {/* Détails du jour */}
                  <div className="space-y-1 text-xs">
                    {/* Stock début */}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-[10px]">{t('stockStart')}:</span>
                      <span className={`font-mono text-[10px] ${
                        day.stock_start < 20 ? 'text-orange-600 font-semibold' : 'text-gray-700'
                      }`}>
                        {day.stock_start.toFixed(1)}
                      </span>
                    </div>
                    
                    {/* Livraison */}
                    {day.deliveries > 0 && (
                      <div className="flex items-center justify-between gap-1 text-green-700 bg-green-100 px-1 rounded">
                        <div className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          <span className="font-semibold">+{day.deliveries.toFixed(1)}</span>
                        </div>
                        {day.delivery_id && (
                          <span className="text-[9px] font-mono">#{day.delivery_id}</span>
                        )}
                      </div>
                    )}
                    
                    {/* Ventes */}
                    {day.consumption > 0 && (
                      <div className="flex items-center gap-1 text-gray-700">
                        <TrendingDown className="h-3 w-3" />
                        <span>-{day.consumption.toFixed(1)}</span>
                      </div>
                    )}
                    
                    {/* Stock fin */}
                    <div className="flex justify-between items-center border-t pt-1">
                      <span className="text-gray-500 text-[10px]">{t('stockEnd')}:</span>
                      <span className={`font-mono font-bold ${
                        day.stock_end < 0 ? 'text-red-600' : day.stock_end < 20 ? 'text-orange-600' : 'text-green-700'
                      }`}>
                        {day.stock_end.toFixed(1)}
                      </span>
                    </div>
                    
                    {/* Commande */}
                    {day.orders_placed > 0 && (
                      <div className="flex items-center justify-between gap-1 text-blue-700 bg-blue-100 px-1 rounded">
                        <div className="flex items-center gap-1">
                          <ShoppingCart className="h-3 w-3" />
                          <span className="text-[9px]">#{day.order_id}</span>
                        </div>
                        <span className="text-[9px] font-semibold">{day.order_quantity}</span>
                      </div>
                    )}
                    
                    {/* Alerte */}
                    {day.has_stockout && (
                      <div className="flex items-center gap-1 text-red-700 font-bold bg-red-100 px-1 rounded">
                        <AlertTriangle className="h-3 w-3" />
                        <span>{t('stockout')}</span>
                      </div>
                    )}
                    {day.has_threshold_crossed && !day.has_stockout && (
                      <div className="flex items-center gap-1 text-orange-700 text-[9px]">
                        <AlertTriangle className="h-2 w-2" />
                        <span>{t('threshold')}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left font-semibold">{t('date')}</th>
                <th className="p-3 text-left font-semibold">{t('day')}</th>
                <th className="p-3 text-right font-semibold">{t('stockStart')}</th>
                <th className="p-3 text-right font-semibold">{t('deliveries')}</th>
                <th className="p-3 text-right font-semibold">{t('sales')}</th>
                <th className="p-3 text-right font-semibold">{t('stockEnd')}</th>
                <th className="p-3 text-center font-semibold">{t('events')}</th>
              </tr>
            </thead>
            <tbody>
              {dailyDetails.map((day, index) => {
                const rowClass = day.has_stockout
                  ? 'bg-red-50 border-l-4 border-l-red-500'
                  : day.has_threshold_crossed
                  ? 'bg-orange-50 border-l-4 border-l-orange-500'
                  : !day.is_working_day
                  ? 'bg-gray-50'
                  : index % 2 === 0
                  ? 'bg-white'
                  : 'bg-gray-50/50';

                return (
                  <tr key={index} className={`border-b hover:bg-blue-50/30 transition-colors ${rowClass}`}>
                    {/* Date */}
                    <td className="p-3 font-medium">
                      {format(new Date(day.date), 'dd/MM/yyyy', { locale })}
                    </td>

                    {/* Jour de la semaine */}
                    <td className="p-3">
                      <span className={!day.is_working_day ? 'text-red-600 font-semibold' : ''}>
                        {translateDayName(day.day_of_week)}
                      </span>
                    </td>

                    {/* Stock début de journée (après livraisons) */}
                    <td className="p-3 text-right font-mono">
                      <span className={day.stock_start < 20 ? 'text-orange-600 font-bold' : ''}>
                        {day.stock_start.toFixed(2)}
                      </span>
                    </td>

                    {/* Livraisons */}
                    <td className="p-3 text-right">
                      {day.deliveries > 0 ? (
                        <div className="flex flex-col items-end gap-0.5">
                          <div className="flex items-center gap-1">
                            <Package className="h-4 w-4 text-green-600" />
                            <span className="font-semibold text-green-600">
                              +{day.deliveries.toFixed(2)}
                            </span>
                          </div>
                          {day.delivery_id && (
                            <span className="text-xs text-green-700 font-mono">
                              {t('order')} #{day.delivery_id}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>

                    {/* Ventes/Consommation */}
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <TrendingDown className="h-4 w-4 text-gray-600" />
                        <span className="font-mono text-gray-700">
                          -{day.consumption.toFixed(2)}
                        </span>
                      </div>
                    </td>

                    {/* Stock fin de journée */}
                    <td className="p-3 text-right font-mono">
                      <span
                        className={
                          day.stock_end < 0
                            ? 'text-red-600 font-bold'
                            : day.stock_end < 20
                            ? 'text-orange-600 font-bold'
                            : 'text-gray-900'
                        }
                      >
                        {day.stock_end.toFixed(2)}
                      </span>
                    </td>

                    {/* Événements */}
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-2">
                        {/* Commande passée */}
                        {day.orders_placed > 0 && day.order_id && (
                          <div className="flex flex-col items-center gap-0.5 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                            <div className="flex items-center gap-1">
                              <ShoppingCart className="h-3 w-3" />
                              <span>{t('order')} #{day.order_id}</span>
                            </div>
                            <span className="text-[10px]">({day.order_quantity} {t('unit')}.)</span>
                          </div>
                        )}

                        {/* Passage sous le seuil */}
                        {day.has_threshold_crossed && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">
                            <AlertTriangle className="h-3 w-3" />
                            <span>{t('threshold')}</span>
                          </div>
                        )}

                        {/* Rupture de stock */}
                        {day.has_stockout && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-bold">
                            <AlertTriangle className="h-3 w-3" />
                            <span>{t('stockout')}</span>
                          </div>
                        )}

                        {/* Aucun événement */}
                        {!day.orders_placed && !day.has_threshold_crossed && !day.has_stockout && (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {t('dailyCalendarTitle')}
        </CardTitle>
        <CardDescription>
          {t('dailyCalendarDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'calendar')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              {t('listView')}
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              {t('calendarView')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-0">
            {renderListView()}
          </TabsContent>

          <TabsContent value="calendar" className="mt-0">
            {renderCalendarView()}
          </TabsContent>
        </Tabs>

        {/* Légende */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-sm mb-3">{t('legend')}</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white border rounded"></div>
              <span>{t('normalWorkday')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-50 border rounded"></div>
              <span>{t('sunday')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-50 border-l-4 border-l-orange-500 rounded"></div>
              <span>{t('thresholdCrossed')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-50 border-l-4 border-l-red-500 rounded"></div>
              <span>{t('stockoutDay')}</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t text-xs space-y-1">
            <p className="flex items-center gap-2">
              <Package className="h-4 w-4 text-green-600" />
              <strong>{t('stockStart')}:</strong> {t('stockStartInfo')}
            </p>
            <p className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-gray-600" />
              <strong>{t('sales')}:</strong> {t('salesInfo')}
            </p>
            <p className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-blue-600" />
              <strong>{t('order')}:</strong> {t('orderInfo')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
