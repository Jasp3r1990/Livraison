import { useState, useEffect } from 'react';
import { ConfigModal } from './components/ConfigModal';
import { StockChart } from './components/StockChart';
import { EventsCalendar } from './components/EventsCalendar';
import { OptimizationReport } from './components/OptimizationReport';
import { DailyCalendarView } from './components/DailyCalendarView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Card, CardContent } from './components/ui/card';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Button } from './components/ui/button';
import { SimulationConfig, SimulationResult } from './types/simulation';
import { Package, Settings, Globe } from 'lucide-react';
import { useLanguage } from './i18n/LanguageContext';

const API_URL = '/api';
const GRAMS_PER_BALL = 85;
const GRAMS_PER_ASAFATE = 4000;
const BALLS_PER_ASAFATE = GRAMS_PER_ASAFATE / GRAMS_PER_BALL;
const STORAGE_KEY = 'simulation_config';

const defaultConfig: SimulationConfig = {
  daily_consumption: 100 / BALLS_PER_ASAFATE,
  initial_stock: 45,
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
      console.log('📦 Config chargée depuis localStorage:', parsed);
      // Toujours mettre à jour la date de départ
      return { ...defaultConfig, ...parsed, start_date: new Date().toISOString().split('T')[0] };
    }
  } catch (error) {
    console.error('Erreur lors du chargement de la configuration:', error);
  }
  console.log('📦 Utilisation de la config par défaut (100 boules/jour):', defaultConfig);
  return defaultConfig;
};

function App() {
  const { t, language, setLanguage } = useLanguage();
  
  // Charger une seule fois au démarrage
  const [config, setConfig] = useState<SimulationConfig>(() => loadConfigFromStorage());
  const [iceCreamBalls, setIceCreamBalls] = useState<number>(() => {
    const loaded = loadConfigFromStorage();
    return loaded.daily_consumption * BALLS_PER_ASAFATE;
  });
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [optimizationResult, setOptimizationResult] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Exposer des fonctions de débogage dans la console
  useEffect(() => {
    (window as any).debugConfig = {
      show: () => {
        const stored = localStorage.getItem(STORAGE_KEY);
        console.log('🔍 Config actuelle:', config);
        console.log('🔍 Boules/jour:', (config.daily_consumption * BALLS_PER_ASAFATE).toFixed(2));
        console.log('🔍 localStorage:', stored ? JSON.parse(stored) : 'vide');
      },
      reset: () => {
        localStorage.removeItem(STORAGE_KEY);
        window.location.reload();
      },
      setBalls: (balls: number) => {
        const asafates = balls / BALLS_PER_ASAFATE;
        setConfig({ ...config, daily_consumption: asafates });
        console.log(`✅ Configuré à ${balls} boules/jour (${asafates.toFixed(4)} asafates)`);
      }
    };
    console.log('🔧 Debug disponible: window.debugConfig.show() | .reset() | .setBalls(100)');
  }, [config]);

  // Sauvegarder config dans localStorage à chaque changement
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    console.log('💾 Config sauvegardée:', config);
    console.log('   → Boules/jour:', (config.daily_consumption * BALLS_PER_ASAFATE).toFixed(2));
  }, [config]);

  const runSimulation = async (configToRun: SimulationConfig) => {
    setIsLoading(true);
    setError(null);

    try {
      // Lancer la simulation
      const simResponse = await fetch(`${API_URL}/simulate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configToRun),
      });

      if (!simResponse.ok) {
        const errorData = await simResponse.json();
        throw new Error(errorData.detail || 'Erreur lors de la simulation');
      }

      const simData: SimulationResult = await simResponse.json();
      setSimulationResult(simData);

      // Lancer l'optimisation
      const optimizationResponse = await fetch(`${API_URL}/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configToRun),
      });

      if (optimizationResponse.ok) {
        const optimizationData = await optimizationResponse.json();
        setOptimizationResult(optimizationData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      console.error('Erreur:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIceCreamBallsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const balls = parseFloat(e.target.value);
    if (isNaN(balls) || balls <= 0) return;

    setIceCreamBalls(balls);
    const asafates = balls / BALLS_PER_ASAFATE;
    const newConfig = { ...config, daily_consumption: asafates };
    setConfig(newConfig);
  };

  const handleConfigUpdate = (newConfig: SimulationConfig) => {
    setConfig(newConfig);
    setIceCreamBalls(newConfig.daily_consumption * BALLS_PER_ASAFATE);
    runSimulation(newConfig);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'es' ? 'fr' : 'es');
  };

  // Auto-run simulation when ice cream balls change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      runSimulation(config);
    }, 500); // Debounce 500ms

    return () => clearTimeout(timeoutId);
  }, [config.daily_consumption]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="h-10 w-10 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {t('appTitle')}
                </h1>
                <p className="text-sm text-gray-600">
                  {t('appSubtitle')}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleLanguage}
              >
                <Globe className="h-4 w-4 mr-2" />
                {language === 'es' ? 'FR' : 'ES'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsConfigModalOpen(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                {t('configTitle')}
              </Button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
            <p className="text-red-900 font-medium">{t('error')}</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Quick Control: Ice Cream Balls */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="quick_ice_cream_balls" className="text-base font-semibold">
                  🍦 {t('iceCreamBalls')}
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('iceCreamBallsHelp')} • {(iceCreamBalls / BALLS_PER_ASAFATE).toFixed(2)} asafates
                </p>
              </div>
              <Input
                id="quick_ice_cream_balls"
                type="number"
                step="1"
                value={iceCreamBalls.toFixed(0)}
                onChange={handleIceCreamBallsChange}
                disabled={isLoading}
                className="w-32 font-mono text-lg"
              />
            </div>
          </CardContent>
        </Card>

        {/* Configuration Modal */}
        <ConfigModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          config={config}
          onUpdateConfig={handleConfigUpdate}
        />

        {/* Results */}
        {simulationResult && (
          <Tabs defaultValue="daily" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="daily">{t('tabDaily')}</TabsTrigger>
              <TabsTrigger value="chart">{t('tabChart')}</TabsTrigger>
              <TabsTrigger value="calendar">{t('tabCalendar')}</TabsTrigger>
              <TabsTrigger value="optimization">{t('tabOptimization')}</TabsTrigger>
            </TabsList>

            <TabsContent value="daily" className="space-y-4">
              <DailyCalendarView dailyDetails={simulationResult.daily_details} />
            </TabsContent>

            <TabsContent value="chart" className="space-y-4">
              <StockChart
                events={simulationResult.events}
                reorderThreshold={simulationResult.config.reorder_threshold}
              />
            </TabsContent>

            <TabsContent value="calendar" className="space-y-4">
              <EventsCalendar events={simulationResult.events} />
            </TabsContent>

            <TabsContent value="optimization" className="space-y-4">
              <OptimizationReport result={optimizationResult} />
            </TabsContent>
          </Tabs>
        )}

        {/* Empty State */}
        {!simulationResult && !isLoading && (
          <div className="mt-12 text-center py-12 bg-white rounded-lg shadow-sm">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              {t('readyToSimulate')}
            </h2>
            <p className="text-gray-500">
              {t('configureAndRun')}
            </p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="mt-12 text-center py-12 bg-white rounded-lg shadow-sm">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              {t('simulationRunning')}
            </h2>
            <p className="text-gray-500">
              {t('calculating')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
