import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { SimulationStatistics, AnalysisResult } from '@/types/simulation';
import { Separator } from './ui/separator';
import { CheckCircle2, XCircle, AlertCircle, TrendingUp, Package, Activity } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

interface AnalysisReportProps {
  statistics: SimulationStatistics;
  analysis?: AnalysisResult;
}

export function AnalysisReport({ statistics, analysis }: AnalysisReportProps) {
  const { t } = useLanguage();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('analysisTitle')}</CardTitle>
        <CardDescription>
          {t('analysisDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Statistiques principales */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4" />
            {t('keyStats')}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{t('finalStock')}</p>
              <p className="text-2xl font-bold">{statistics.final_stock.toFixed(1)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{t('avgStock')}</p>
              <p className="text-2xl font-bold">{statistics.average_stock.toFixed(1)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{t('minStock')}</p>
              <p className="text-2xl font-bold text-orange-600">
                {statistics.min_stock.toFixed(1)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{t('maxStock')}</p>
              <p className="text-2xl font-bold text-blue-600">
                {statistics.max_stock.toFixed(1)}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Commandes */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Package className="h-4 w-4" />
            {t('procurement')}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{t('totalOrdered')}</p>
              <p className="text-2xl font-bold">{statistics.total_ordered}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{t('totalOrders')}</p>
              <p className="text-2xl font-bold">{statistics.total_orders}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{t('avgOrderSize')}</p>
              <p className="text-2xl font-bold">
                {statistics.total_orders > 0
                  ? (statistics.total_ordered / statistics.total_orders).toFixed(1)
                  : '0'}
              </p>
            </div>
          </div>
        </div>

        {analysis && (
          <>
            <Separator />

            {/* Viabilité */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                {t('viability')}
              </h3>
              <div className="space-y-2">
                <div
                  className={`flex items-center gap-2 p-3 rounded-lg ${
                    analysis.viability.is_viable
                      ? 'bg-green-50 text-green-900'
                      : 'bg-red-50 text-red-900'
                  }`}
                >
                  {analysis.viability.is_viable ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <XCircle className="h-5 w-5" />
                  )}
                  <span className="font-medium">{analysis.viability.status}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm">{t('serviceLevel')}</span>
                  <span className="font-bold">{analysis.viability.service_level}%</span>
                </div>
              </div>
            </div>

            {/* Analyse de tendance */}
            {analysis.trend_analysis && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Analyse de tendance (30 jours)
                  </h3>
                  <div className="space-y-3">
                    <div
                      className={`p-3 rounded-lg ${
                        analysis.trend_analysis.trend === 'descending'
                          ? 'bg-red-50 text-red-900'
                          : analysis.trend_analysis.trend === 'stable'
                          ? 'bg-green-50 text-green-900'
                          : 'bg-blue-50 text-blue-900'
                      }`}
                    >
                      <p className="text-sm font-medium mb-1">
                        {analysis.trend_analysis.trend === 'descending' && '📉 Tendance descendante'}
                        {analysis.trend_analysis.trend === 'stable' && '➡️ Tendance stable'}
                        {analysis.trend_analysis.trend === 'ascending' && '📈 Tendance ascendante'}
                      </p>
                      <p className="text-xs">{analysis.trend_analysis.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="p-2 bg-gray-50 rounded">
                        <p className="text-xs text-gray-600">Stock initial (période)</p>
                        <p className="font-bold">{analysis.trend_analysis.initial_stock.toFixed(1)}</p>
                      </div>
                      <div className="p-2 bg-gray-50 rounded">
                        <p className="text-xs text-gray-600">Stock final (période)</p>
                        <p className="font-bold">{analysis.trend_analysis.final_stock.toFixed(1)}</p>
                      </div>
                      <div className="p-2 bg-gray-50 rounded">
                        <p className="text-xs text-gray-600">Variation totale</p>
                        <p className={`font-bold ${analysis.trend_analysis.final_vs_initial < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {analysis.trend_analysis.final_vs_initial > 0 ? '+' : ''}{analysis.trend_analysis.final_vs_initial.toFixed(1)}
                        </p>
                      </div>
                      <div className="p-2 bg-gray-50 rounded">
                        <p className="text-xs text-gray-600">Variation/jour</p>
                        <p className={`font-bold ${analysis.trend_analysis.avg_change_per_day < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {analysis.trend_analysis.avg_change_per_day > 0 ? '+' : ''}{analysis.trend_analysis.avg_change_per_day.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Analyse de consommation */}
            {analysis.stability_solutions && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Solutions de stabilité
                  </h3>
                  <div className="space-y-3">
                    <div className={`p-3 rounded-lg ${
                      analysis.stability_solutions.message.includes('✅') 
                        ? 'bg-green-50 text-green-900' 
                        : 'bg-blue-50 text-blue-900'
                    }`}>
                      <p className="text-sm font-medium mb-2">
                        {analysis.stability_solutions.message}
                      </p>
                    </div>
                    
                    {analysis.stability_solutions.solutions && analysis.stability_solutions.solutions.length > 0 && (
                      <div className="space-y-2">
                        {analysis.stability_solutions.solutions.map((solution, index) => (
                          <div
                            key={index}
                            className={`p-3 rounded-lg ${
                              solution.type.endsWith('_ok')
                                ? 'bg-green-50 border border-green-200'
                                : 'bg-orange-50 border border-orange-200'
                            }`}
                          >
                            <p className="text-sm font-medium mb-1">
                              {solution.message}
                            </p>
                            {!solution.type.endsWith('_ok') && (
                              <div className="flex items-center gap-4 text-xs mt-2">
                                <span className="text-gray-600">
                                  Actuel: <strong>{solution.current_value}</strong>
                                </span>
                                <span>→</span>
                                <span className="text-green-700">
                                  Suggéré: <strong>{solution.suggested_value}</strong>
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                      <div className="p-2 bg-gray-50 rounded">
                        <p className="text-xs text-gray-600">Consommation actuelle</p>
                        <p className="font-bold">{analysis.stability_solutions.current_consumption.toFixed(2)} boules/jour</p>
                      </div>
                      <div className="p-2 bg-gray-50 rounded">
                        <p className="text-xs text-gray-600">Quantité max actuelle</p>
                        <p className="font-bold">{analysis.stability_solutions.current_max_order} unités</p>
                      </div>
                      {analysis.stability_solutions.max_viable_consumption && (
                        <div className="p-2 bg-green-50 rounded">
                          <p className="text-xs text-green-600">Max viable (consommation)</p>
                          <p className="font-bold text-green-900">
                            {analysis.stability_solutions.max_viable_consumption.toFixed(2)} boules/jour
                          </p>
                        </div>
                      )}
                      {analysis.stability_solutions.min_required_max_order && (
                        <div className="p-2 bg-blue-50 rounded">
                          <p className="text-xs text-blue-600">Quantité requise</p>
                          <p className="font-bold text-blue-900">
                            {analysis.stability_solutions.min_required_max_order} unités
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Métriques supplémentaires */}
            <div>
              <h3 className="font-semibold mb-3">{t('advancedMetrics')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-900 mb-1">{t('avgDaysStock')}</p>
                  <p className="text-xl font-bold text-blue-900">
                    {analysis.metrics.average_days_of_stock.toFixed(1)}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-xs text-purple-900 mb-1">{t('avgOrderSize')}</p>
                  <p className="text-xl font-bold text-purple-900">
                    {analysis.metrics.average_order_size.toFixed(1)}
                  </p>
                </div>
                <div className="p-3 bg-indigo-50 rounded-lg">
                  <p className="text-xs text-indigo-900 mb-1">{t('ordersPerWeek')}</p>
                  <p className="text-xl font-bold text-indigo-900">
                    {analysis.metrics.order_frequency.toFixed(1)}
                  </p>
                </div>
              </div>
            </div>

            {/* Risques */}
            {analysis.risks.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    {t('risksIdentified')}
                  </h3>
                  <ul className="space-y-2">
                    {analysis.risks.map((risk, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm p-2 bg-orange-50 text-orange-900 rounded"
                      >
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {/* Recommandations */}
            {analysis.recommendations.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    {t('recommendations')}
                  </h3>
                  <ul className="space-y-2">
                    {analysis.recommendations.map((rec, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm p-2 bg-green-50 text-green-900 rounded"
                      >
                        <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </>
        )}

        {/* Ruptures de stock */}
        {statistics.stockouts_count > 0 && (
          <>
            <Separator />
            <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <p className="font-semibold text-red-900">
                  {statistics.stockouts_count} {t('stockoutDays')}
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
