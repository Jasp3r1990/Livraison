import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Info, Zap } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface OptimizationResult {
  current_status: {
    is_viable: boolean;
    daily_consumption: number;
    max_order_quantity: number;
    final_stock: number;
    average_stock: number;
    min_stock: number;
    stockouts: number;
    trend: string;
    trend_description: string;
    reorder_threshold: number;
    days_above_threshold: number;
    days_above_threshold_percent: number;
  };
  equilibrium_analysis: {
    max_viable_consumption: number | null;
    min_required_max_order: number | null;
    consumption_utilization_rate: number;
    order_capacity_rate: number;
  };
  optimal_configuration: {
    is_optimal: boolean;
    daily_consumption?: number;
    max_order_quantity?: number;
    final_stock?: number;
    stockouts?: number;
    trend?: string;
    improvement_vs_current?: {
      consumption_increase: number;
      consumption_increase_percent: number;
      order_adjustment: number;
      order_adjustment_percent: number;
    };
    message?: string;
  };
  recommendations: Array<{
    priority: 'critical' | 'high' | 'medium' | 'low' | 'info';
    category: string;
    title: string;
    message: string;
    action: string | null;
    current_value?: number;
    suggested_value?: number;
    unit?: string;
    details?: any;
  }>;
  tested_scenarios: {
    consumption_tests: any;
    order_quantity_tests: any;
  };
}

interface OptimizationReportProps {
  result: OptimizationResult | null;
}

export function OptimizationReport({ result }: OptimizationReportProps) {
  const langCtx = useLanguage();
  const { t } = langCtx;
  const currentLang = (langCtx as any).language || (langCtx as any).locale || (langCtx as any).lang || 'fr';
  
  if (!result) {
    return null;
  }

  // Traducteur pour les titres de recommandations
  const translateRecommendationTitle = (title: string): string => {
    const titleMap: { [key: string]: string } = {
      
      'Configuration optimale recommandée': 'optimalConfigRecommended',
      'Configuration actuelle viable': 'configCurrentlyViable',
      'Capacité de livraison adéquate': 'adequateCapacity',
      'Opportunité d\'augmenter les ventes': 'increaseOpportunity',
      'Configuration actuelle non viable': 'configCurrentlyNonViable',
      'Réduire les ventes quotidiennes': 'reduceDailySales',
      'Augmenter la capacité de livraison': 'increaseDeliveryCapacity',
    };
    
    for (const [fr, key] of Object.entries(titleMap)) {
      if (title.toLowerCase().includes(fr.toLowerCase())) {
        return t(key);
      }
    }
    return title;
  };

  // Traducteur pour les messages et actions (utilise les clés de traduction existantes)
  const translateMessage = (text: string): string => {
    if (!text) return text;
     
     // Ne faire les remplacements que si la langue courante est espagnole
     if (!String(currentLang).toLowerCase().startsWith('es')) {
      return text;
      }
    
    // Patterns d'état de stock (prioritaires - traiter en premier)
    // Pattern 1: Stock en baisse continue + NON VIABLE
    const decreasingNonViableMatch = text.match(/Stock en baisse continue\s*\(([-\d.]+)\s*(?:unités|boules)\/jour\).*Configuration NON VIABLE/i);
    if (decreasingNonViableMatch) {
      return `${t('optStockDecreasing')} (${decreasingNonViableMatch[1]} ${t('optUnits')}/${t('optDays').toLowerCase()}). ${t('optConfigNonViable')}`;
    }
    
    // Pattern 2: Stock en hausse continue + VIABLE
    const increasingViableMatch = text.match(/Stock en hausse continue\s*\(\+([-\d.]+)\s*(?:unités|boules)\/jour\).*Configuration VIABLE/i);
    if (increasingViableMatch) {
      return `${t('optStockIncreasing')} (+${increasingViableMatch[1]} ${t('optUnits')}/${t('optDays').toLowerCase()}). ${t('optConfigViable')}`;
    }
    
    // Pattern 3: Stock stable + ÉQUILIBRÉE et VIABLE
    const stableEquilibriumMatch = text.match(/Stock stable\s*\(variation:\s*([-+\d.]+)\s*(?:unités|boules)\/jour\).*Configuration ÉQUILIBRÉE et VIABLE/i);
    if (stableEquilibriumMatch) {
      return `${t('optStockStable')} (${stableEquilibriumMatch[1]} ${t('optUnits')}/${t('optDays').toLowerCase()}). ${t('optConfigEquilibrium')}`;
    }
    
    // Pattern 4: Stock stable générique
    if (text.match(/Stock stable/i)) {
      return t('optStockStable');
    }
    
    // Sinon, remplacer les unités et mots-clés
    let translated = text;
    
    // Remplacer TOUS les mots français par leur traduction espagnole (ordre important!)
    const replacements: Array<[RegExp, string]> = [
      // Phrases complètes d'abord
      [/Configuration testée et validée par simulation/gi, 'Configuración probada y validada por simulación'],
      [/Votre configuration actuelle \(consommation:\s*([\d.]+)\s*(?:boules|asafates)\/jour,\s*livraison max:\s*(\d+)\s*asafates\)\s*est stable/gi, 
       'Su configuración actual (consumo: $1 asafates/días, entrega máx: $2 asafates) es estable'],
      [/Vous pouvez vendre jusqu'à/gi, 'Puede vender hasta'],
      [/Augmenter progressivement de/gi, 'Aumentar gradualmente de'],
      [/Quantité max par livraison/gi, 'Cantidad máx por entrega'],
      [/génère des ruptures de stock ou un stock décroissant./gi, 'genera rupturas de stock o un stock decreciente.'],
      [/Consommation trop élevée./gi, 'Consumo demasiado alto.'],
      [/ Réduire/gi, ' Reducir'],
      
      
      // Unités (avant les mots individuels) - TOUT en asafates
      [/(?:boules|bolas)\/jour/gi, `asafates/${t('optDays').toLowerCase()}`],
      [/(?:boules|bolas)\/días/gi, `asafates/${t('optDays').toLowerCase()}`],
      [/unités\/jour/gi, `unidades/${t('optDays').toLowerCase()}`],
      
      // Configurations et états
      [/Configuration testée et validée/gi, 'Configuración probada y validada'],
      [/Configuration optimale recommandée/gi, 'Configuración óptima recomendada'],
      [/Configuration actuelle viable/gi, 'Configuración actual viable'],
      [/Configuration NON VIABLE/gi, 'Configuración NO VIABLE'],
      [/Configuration VIABLE/gi, 'Configuración VIABLE'],
      [/Votre configuration actuelle/gi, 'Su configuración actual'],
      
      
      
      // Stock
      [/Stock en baisse continue/gi, 'Stock en disminución continua'],
      [/Stock en hausse continue/gi, 'Stock en aumento continuo'],
      [/Stock stable/gi, 'Stock estable'],
      
      // Mots individuels (unités) - TOUT en asafates
      [/\b(?:boules|bolas)\b/gi, 'asafates'],
      [/\bunités\b/gi, 'unidades'],
      [/\basafates\b/gi, 'asafates'],
      [/\bjour\b/gi, 'día'],
      
      // Verbes et actions
      [/\bAugmenter\b/gi, 'Aumentar'],
      [/\bvendre\b/gi, 'vender'],
      [/progressivement/gi, 'gradualmente'],
      [/\best\b/gi, 'es'],
      [/\bsont\b/gi, 'son'],
      
      // Connecteurs et prépositions
      [/\bde plus\b/gi, 'más'],
      [/\bvers\b/gi, 'hacia'],
      [/à long terme/gi, 'a largo plazo'],
      [/jusqu'à/gi, 'hasta'],
      [/\bpar\b/gi, 'por'],
      
      // Adjectifs
      [/\bstable\b/gi, 'estable'],
      [/appropriée/gi, 'apropiada'],
      [/adéquate/gi, 'adecuada'],
      
      // Substantifs
      [/Consommation/gi, 'Consumo'],
      [/consommation/gi, 'consumo'],
      [/Livraison/gi, 'Entrega'],
      [/livraison/gi, 'entrega'],
      [/Quantité/gi, 'Cantidad'],
      [/quantité/gi, 'cantidad'],
    ];
    
    for (const [pattern, replacement] of replacements) {
      translated = translated.replace(pattern, replacement);
    }
    
    return translated;
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'medium':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'low':
        return <Info className="h-5 w-5 text-gray-500" />;
      default:
        return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'border-red-200 bg-red-50';
      case 'high':
        return 'border-orange-200 bg-orange-50';
      case 'medium':
        return 'border-blue-200 bg-blue-50';
      case 'low':
        return 'border-gray-200 bg-gray-50';
      default:
        return 'border-green-200 bg-green-50';
    }
  };

  const { current_status, equilibrium_analysis, optimal_configuration, recommendations } = result;

  return (
    <div className="space-y-6">
      {/* État actuel */}
      <Card className={`border-2 ${
        current_status.is_viable 
          ? 'border-green-300 bg-gradient-to-br from-green-50 to-white' 
          : 'border-red-300 bg-gradient-to-br from-red-50 to-white'
      }`}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            {current_status.is_viable ? (
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            ) : (
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            )}
            <span>{t('optCurrentStatus')}</span>
          </CardTitle>
          <CardDescription>
            {current_status.is_viable ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 border border-green-300 rounded-full">
                <span className="text-green-700 font-semibold text-sm">
                  ✅ {current_status.average_stock >= current_status.reorder_threshold 
                    ? t('optConfigViableAboveThreshold') 
                    : t('optConfigViable')}
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-100 border border-red-300 rounded-full">
                <span className="text-red-700 font-semibold text-sm">
                  ❌ {current_status.average_stock < current_status.reorder_threshold 
                    ? t('optConfigNonViableBelowThreshold')
                    : t('optConfigNonViable')}
                </span>
              </div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 border shadow-sm space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase">{t('optConsumptionPerDay')}</p>
              <p className="text-3xl font-bold text-blue-600">{current_status.daily_consumption.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{t('optAsafates')}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border shadow-sm space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase">{t('optMaxDelivery')}</p>
              <p className="text-3xl font-bold text-purple-600">{current_status.max_order_quantity}</p>
              <p className="text-xs text-muted-foreground">{t('optAsafates')}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border shadow-sm space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase">{t('optAverageStock')}</p>
              <p className={`text-3xl font-bold ${current_status.average_stock >= current_status.reorder_threshold ? 'text-green-600' : 'text-red-600'}`}>
                {current_status.average_stock.toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground">{t('optAsafates')}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border shadow-sm space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase">{t('optStockoutDays')}</p>
              <p className={`text-3xl font-bold ${current_status.stockouts > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {current_status.stockouts}
              </p>
              <p className="text-xs text-muted-foreground">{t('optDays')}</p>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t bg-white/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                {t('optReorderThreshold')}:
              </span>
              <span className="font-semibold bg-blue-100 px-2 py-1 rounded">
                {current_status.reorder_threshold.toFixed(1)} {t('optAsafates')}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                {t('optDaysAboveThreshold')}:
              </span>
              <span className={`font-semibold px-2 py-1 rounded ${
                current_status.days_above_threshold_percent >= 90 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-orange-100 text-orange-700'
              }`}>
                {current_status.days_above_threshold_percent.toFixed(0)}% ({current_status.days_above_threshold} {t('optDays')})
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                {t('optMinStockReached')}:
              </span>
              <span className={`font-semibold px-2 py-1 rounded ${
                current_status.min_stock >= current_status.reorder_threshold 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {current_status.min_stock.toFixed(1)} {t('optAsafates')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analyse d'équilibre */}
      <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-full">
              <Zap className="h-6 w-6 text-yellow-600" />
            </div>
            <span>{t('optEquilibriumPoint')}</span>
          </CardTitle>
          <CardDescription className="text-sm">{t('optEquilibriumDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {equilibrium_analysis.max_viable_consumption !== null && (
              <div className="bg-white rounded-lg p-5 border-2 border-blue-200 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <h4 className="font-semibold text-gray-900">{t('optMaxViableConsumption')}</h4>
                </div>
                <div className="pl-7">
                  <p className="text-4xl font-bold text-blue-600">
                    {equilibrium_analysis.max_viable_consumption.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{t('optAsafates')}/{t('optDays').toLowerCase()}</p>
                  <div className="mt-4 bg-blue-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(equilibrium_analysis.consumption_utilization_rate, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-blue-700 font-semibold mt-2">
                    {t('optCurrentUsage')}: {equilibrium_analysis.consumption_utilization_rate.toFixed(0)}%
                  </p>
                </div>
              </div>
            )}

            {equilibrium_analysis.min_required_max_order !== null && (
              <div className="bg-white rounded-lg p-5 border-2 border-purple-200 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-purple-600" />
                  <h4 className="font-semibold text-gray-900">{t('optMinRequiredDelivery')}</h4>
                </div>
                <div className="pl-7">
                  <p className="text-4xl font-bold text-purple-600">
                    {equilibrium_analysis.min_required_max_order}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{t('optMaxPerDelivery')}</p>
                  <div className="mt-4 bg-purple-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(equilibrium_analysis.order_capacity_rate, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-purple-700 font-semibold mt-2">
                    {t('optCurrentCapacity')}: {equilibrium_analysis.order_capacity_rate.toFixed(0)}%
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Configuration optimale */}
      {optimal_configuration.is_optimal && optimal_configuration.improvement_vs_current && (
        <Card className="border-green-300 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <Zap className="h-6 w-6 text-green-600" />
              {t('optOptimalConfig')}
            </CardTitle>
            <CardDescription className="text-green-700">
              {t('optOptimalConfigDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="font-semibold text-green-900">{t('optDailySales')}</h4>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-green-600">
                    {optimal_configuration.daily_consumption?.toFixed(2)}
                  </span>
                  <span className="text-sm text-green-700">{t('optAsafates')}/{t('optDays').toLowerCase()}</span>
                </div>
                {optimal_configuration.improvement_vs_current.consumption_increase !== 0 && (
                  <p className={`text-sm ${optimal_configuration.improvement_vs_current.consumption_increase > 0 ? 'text-green-600' : 'text-orange-600'}`}>
                    {optimal_configuration.improvement_vs_current.consumption_increase > 0 ? '▲' : '▼'}{' '}
                    {Math.abs(optimal_configuration.improvement_vs_current.consumption_increase).toFixed(2)} {t('optAsafates')}/{t('optDays').toLowerCase()}
                    ({optimal_configuration.improvement_vs_current.consumption_increase_percent > 0 ? '+' : ''}
                    {optimal_configuration.improvement_vs_current.consumption_increase_percent.toFixed(1)}%)
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-green-900">{t('optMaxQtyPerDelivery')}</h4>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-green-600">
                    {optimal_configuration.max_order_quantity}
                  </span>
                  <span className="text-sm text-green-700">{t('optAsafates')}</span>
                </div>
                {optimal_configuration.improvement_vs_current.order_adjustment !== 0 && (
                  <p className={`text-sm ${optimal_configuration.improvement_vs_current.order_adjustment > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {optimal_configuration.improvement_vs_current.order_adjustment > 0 ? '▲' : '▼'}{' '}
                    {Math.abs(optimal_configuration.improvement_vs_current.order_adjustment)} {t('optAsafates')}
                    ({optimal_configuration.improvement_vs_current.order_adjustment_percent > 0 ? '+' : ''}
                    {optimal_configuration.improvement_vs_current.order_adjustment_percent.toFixed(1)}%)
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-green-200">
              <p className="text-sm text-green-700">
                <strong>{t('optExpectedResults')}:</strong> {t('optFinalStock')} {optimal_configuration.final_stock?.toFixed(1)} {t('optAsafates')},
                {optimal_configuration.stockouts === 0 ? ` ${t('optNoStockouts')}` : ` ${optimal_configuration.stockouts} ${t('optStockouts')}`},
                {t('optTrend')} {optimal_configuration.trend}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommandations */}
      <Card>
        <CardHeader>
          <CardTitle>{t('optDetailedRecommendations')}</CardTitle>
          <CardDescription>{t('optBasedOn')} {t('searchMethod')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className={`p-4 border-2 rounded-lg ${getPriorityColor(rec.priority)}`}
              >
                <div className="flex items-start gap-3">
                  {getPriorityIcon(rec.priority)}
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{translateRecommendationTitle(rec.title)}</h4>
                    <p className="text-sm mb-2">{translateMessage(rec.message)}</p>
                    {rec.action && (
                      <p className="text-sm font-medium bg-white bg-opacity-70 p-2 rounded border">
                        💡 {t('optAction')}: {translateMessage(rec.action)}
                      </p>
                    )}
                    
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
