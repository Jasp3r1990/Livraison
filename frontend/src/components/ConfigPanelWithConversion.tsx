import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { SimulationConfig } from '@/types/simulation';
import { Play, RotateCcw, Globe } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

interface ConfigPanelProps {
  onRunSimulation: (config: SimulationConfig) => void;
  isLoading: boolean;
}

const GRAMS_PER_BALL = 85;
const GRAMS_PER_ASAFATE = 4000;
const BALLS_PER_ASAFATE = GRAMS_PER_ASAFATE / GRAMS_PER_BALL; // ~47.06
const STORAGE_KEY = 'simulation_config';

const defaultConfig: SimulationConfig = {
  daily_consumption: 100 / BALLS_PER_ASAFATE,
  initial_stock: 0,
  reorder_threshold: 36,
  max_stock: 45,
  min_order_quantity: 2,
  max_order_quantity: 10,
  lot_size: 2,
  delivery_lead_time_days: 3,
  simulation_days: 60,
  min_stock_to_start_sales: 36,
  start_date: new Date().toISOString().split('T')[0],
};

// Charger la configuration depuis localStorage
const loadConfigFromStorage = (): SimulationConfig => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      console.log('🔧 ConfigPanel - Config chargée:', parsed);
      return { ...defaultConfig, ...parsed };
    }
  } catch (error) {
    console.error('Erreur lors du chargement de la configuration:', error);
  }
  console.log('🔧 ConfigPanel - Config par défaut (100 boules/jour):', defaultConfig);
  return defaultConfig;
};

// Sauvegarder la configuration dans localStorage
const saveConfigToStorage = (config: SimulationConfig) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la configuration:', error);
  }
};

export function ConfigPanelWithConversion({ onRunSimulation, isLoading }: ConfigPanelProps) {
  const { language, setLanguage, t } = useLanguage();
  
  // Charger une seule fois au démarrage
  const [config, setConfig] = useState<SimulationConfig>(() => loadConfigFromStorage());
  const [iceCreamBalls, setIceCreamBalls] = useState<number>(() => {
    const loaded = loadConfigFromStorage();
    return loaded.daily_consumption * BALLS_PER_ASAFATE;
  });

  // Sauvegarder automatiquement la config quand elle change
  useEffect(() => {
    saveConfigToStorage(config);
  }, [config]);

  const handleChange = (field: keyof SimulationConfig) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === 'start_date' ? e.target.value : parseFloat(e.target.value);
    setConfig({ ...config, [field]: value });

    // Si on change daily_consumption (asafates), mettre à jour les boules
    if (field === 'daily_consumption' && typeof value === 'number') {
      setIceCreamBalls(value * BALLS_PER_ASAFATE);
    }
  };

  const handleIceCreamBallsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const balls = parseFloat(e.target.value);
    setIceCreamBalls(balls);

    // Convertir en asafates
    const asafates = balls / BALLS_PER_ASAFATE;
    setConfig({ ...config, daily_consumption: asafates });
  };

  const handleReset = () => {
    setConfig(defaultConfig);
    setIceCreamBalls(100);
    saveConfigToStorage(defaultConfig);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRunSimulation(config);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'es' ? 'fr' : 'es');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{t('configTitle')}</CardTitle>
            <CardDescription>{t('configDescription')}</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLanguage}
            type="button"
          >
            <Globe className="h-4 w-4 mr-2" />
            {language === 'es' ? 'FR' : 'ES'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="start_date">{t('startDate')}</Label>
            <Input
              id="start_date"
              type="date"
              value={config.start_date}
              onChange={handleChange('start_date')}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">{t('startDateHelp')}</p>
          </div>

          {/* Section Consommation avec conversion */}
          <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50/50 space-y-3">
            <h3 className="font-semibold text-sm text-blue-900">{t('dailyConsumption')}</h3>

            {/* Boules de glace */}
            <div className="space-y-2">
              <Label htmlFor="ice_cream_balls" className="flex items-center gap-2">
                🍦 {t('iceCreamBalls')}
              </Label>
              <Input
                id="ice_cream_balls"
                type="number"
                step="1"
                value={iceCreamBalls.toFixed(0)}
                onChange={handleIceCreamBallsChange}
                disabled={isLoading}
                className="font-mono text-lg"
              />
              <p className="text-xs text-muted-foreground">{t('iceCreamBallsHelp')}</p>
            </div>

            {/* Flèche de conversion */}
            <div className="flex items-center justify-center text-blue-600">
              <div className="text-center">
                <div className="text-xs">
                  {iceCreamBalls.toFixed(0)} bolas × 85g = {(iceCreamBalls * GRAMS_PER_BALL).toFixed(0)}g
                </div>
                <div className="text-2xl">↕️</div>
                <div className="text-xs">
                  {(iceCreamBalls * GRAMS_PER_BALL).toFixed(0)}g ÷ 4000g = {config.daily_consumption.toFixed(2)} asafates
                </div>
              </div>
            </div>

            {/* Asafates */}
            <div className="space-y-2">
              <Label htmlFor="daily_consumption" className="flex items-center gap-2">
                📦 {t('asafates')}
              </Label>
              <Input
                id="daily_consumption"
                type="number"
                step="0.01"
                value={config.daily_consumption.toFixed(2)}
                onChange={handleChange('daily_consumption')}
                disabled={isLoading}
                className="font-mono text-lg"
              />
              <p className="text-xs text-muted-foreground">{t('asafatesHelp')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="initial_stock">{t('initialStock')}</Label>
              <Input
                id="initial_stock"
                type="number"
                step="1"
                value={config.initial_stock}
                onChange={handleChange('initial_stock')}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">{t('initialStockHelp')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reorder_threshold">{t('reorderThreshold')}</Label>
              <Input
                id="reorder_threshold"
                type="number"
                step="1"
                value={config.reorder_threshold}
                onChange={handleChange('reorder_threshold')}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">{t('reorderThresholdHelp')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_stock">{t('maxStock')}</Label>
              <Input
                id="max_stock"
                type="number"
                step="1"
                value={config.max_stock}
                onChange={handleChange('max_stock')}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">{t('maxStockHelp')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="min_order_quantity">{t('minOrderQty')}</Label>
              <Input
                id="min_order_quantity"
                type="number"
                step="1"
                value={config.min_order_quantity}
                onChange={handleChange('min_order_quantity')}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">{t('minOrderQtyHelp')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_order_quantity">{t('maxOrderQty')}</Label>
              <Input
                id="max_order_quantity"
                type="number"
                step="1"
                value={config.max_order_quantity}
                onChange={handleChange('max_order_quantity')}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">{t('maxOrderQtyHelp')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lot_size">{t('lotSize')}</Label>
              <Input
                id="lot_size"
                type="number"
                step="1"
                value={config.lot_size}
                onChange={handleChange('lot_size')}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">{t('lotSizeHelp')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery_lead_time_days">{t('deliveryLeadTime')}</Label>
              <Input
                id="delivery_lead_time_days"
                type="number"
                step="1"
                value={config.delivery_lead_time_days}
                onChange={handleChange('delivery_lead_time_days')}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">{t('deliveryLeadTimeHelp')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="simulation_days">{t('simulationDays')}</Label>
              <Input
                id="simulation_days"
                type="number"
                step="1"
                value={config.simulation_days}
                onChange={handleChange('simulation_days')}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">{t('simulationDaysHelp')}</p>
            </div>
          </div>

          {/* Section séparée pour l'approvisionnement initial */}
          <div className="space-y-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-600"></div>
              <h3 className="font-semibold text-blue-900">Approvisionnement Initial</h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="min_stock_to_start_sales" className="text-blue-900">
                Stock minimum pour débuter les ventes
                {config.initial_stock > 0 && (
                  <span className="ml-2 text-xs text-gray-500">(inactif - stock initial {'>'} 0)</span>
                )}
              </Label>
              <Input
                id="min_stock_to_start_sales"
                type="number"
                step="0.1"
                value={config.min_stock_to_start_sales || 0}
                onChange={handleChange('min_stock_to_start_sales')}
                disabled={isLoading || config.initial_stock > 0}
                className={config.initial_stock > 0 ? "border-gray-200 bg-gray-50" : "border-blue-300 focus:border-blue-500"}
              />
              <p className="text-xs text-blue-700">
                {config.initial_stock === 0 ? (
                  <>
                    ✅ <strong>Actif:</strong> Ce paramètre définit le stock minimum requis avant de commencer les ventes.
                    Les livraisons s'accumuleront jusqu'à atteindre ce seuil.
                    {config.min_stock_to_start_sales === 0 && (
                      <span className="block mt-1 text-orange-600 font-semibold">
                        ⚡ Valeur 0 détectée ! Les ventes commenceront immédiatement. Définissez un seuil (ex: 36) pour une phase d'approvisionnement.
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    ℹ️ <strong>Inactif:</strong> Ce paramètre n'est utilisé que si le stock initial est à 0.
                    Avec un stock initial de {config.initial_stock}, les ventes commenceront immédiatement.
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              <Play className="mr-2 h-4 w-4" />
              {isLoading ? t('running') : t('runSimulation')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={isLoading}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {t('reset')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
