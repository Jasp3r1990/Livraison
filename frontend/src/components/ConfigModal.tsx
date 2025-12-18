import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { SimulationConfig } from '@/types/simulation';
import { RotateCcw } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SimulationConfig;
  onUpdateConfig: (config: SimulationConfig) => void;
}

const GRAMS_PER_BALL = 85;
const GRAMS_PER_ASAFATE = 4000;
const BALLS_PER_ASAFATE = GRAMS_PER_ASAFATE / GRAMS_PER_BALL;

const defaultConfig: SimulationConfig = {
  daily_consumption: 4.25,
  initial_stock: 45,
  reorder_threshold: 36,
  max_stock: 100,
  min_order_quantity: 2,
  max_order_quantity: 10,
  lot_size: 2,
  delivery_lead_time_days: 3,
  simulation_days: 60,
  start_date: new Date().toISOString().split('T')[0],
};

export function ConfigModal({ isOpen, onClose, config, onUpdateConfig }: ConfigModalProps) {
  const { t } = useLanguage();
  const [localConfig, setLocalConfig] = useState<SimulationConfig>(config);
  const [iceCreamBalls, setIceCreamBalls] = useState<number>(
    config.daily_consumption * BALLS_PER_ASAFATE
  );

  const handleChange = (field: keyof SimulationConfig) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === 'start_date' ? e.target.value : parseFloat(e.target.value);
    setLocalConfig({ ...localConfig, [field]: value });

    if (field === 'daily_consumption' && typeof value === 'number') {
      setIceCreamBalls(value * BALLS_PER_ASAFATE);
    }
  };

  const handleIceCreamBallsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const balls = parseFloat(e.target.value);
    setIceCreamBalls(balls);
    const asafates = balls / BALLS_PER_ASAFATE;
    setLocalConfig({ ...localConfig, daily_consumption: asafates });
  };

  const handleReset = () => {
    setLocalConfig(defaultConfig);
    setIceCreamBalls(defaultConfig.daily_consumption * BALLS_PER_ASAFATE);
  };

  const handleSave = () => {
    onUpdateConfig(localConfig);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('configTitle')}</DialogTitle>
          <DialogDescription>{t('configDescription')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="modal_start_date">{t('startDate')}</Label>
            <Input
              id="modal_start_date"
              type="date"
              value={localConfig.start_date}
              onChange={handleChange('start_date')}
            />
            <p className="text-xs text-muted-foreground">{t('startDateHelp')}</p>
          </div>

          {/* Section Consommation avec conversion */}
          <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50/50 space-y-3">
            <h3 className="font-semibold text-sm text-blue-900">{t('dailyConsumption')}</h3>

            <div className="space-y-2">
              <Label htmlFor="modal_ice_cream_balls" className="flex items-center gap-2">
                🍦 {t('iceCreamBalls')}
              </Label>
              <Input
                id="modal_ice_cream_balls"
                type="number"
                step="1"
                value={iceCreamBalls.toFixed(0)}
                onChange={handleIceCreamBallsChange}
                className="font-mono text-lg"
              />
              <p className="text-xs text-muted-foreground">{t('iceCreamBallsHelp')}</p>
            </div>

            <div className="flex items-center justify-center text-blue-600">
              <div className="text-center">
                <div className="text-xs">
                  {iceCreamBalls.toFixed(0)} bolas × 85g = {(iceCreamBalls * GRAMS_PER_BALL).toFixed(0)}g
                </div>
                <div className="text-2xl">↕️</div>
                <div className="text-xs">
                  {(iceCreamBalls * GRAMS_PER_BALL).toFixed(0)}g ÷ 4000g = {localConfig.daily_consumption.toFixed(2)} asafates
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="modal_daily_consumption" className="flex items-center gap-2">
                📦 {t('asafates')}
              </Label>
              <Input
                id="modal_daily_consumption"
                type="number"
                step="0.01"
                value={localConfig.daily_consumption.toFixed(2)}
                onChange={handleChange('daily_consumption')}
                className="font-mono text-lg"
              />
              <p className="text-xs text-muted-foreground">{t('asafatesHelp')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="modal_initial_stock">{t('initialStock')}</Label>
              <Input
                id="modal_initial_stock"
                type="number"
                step="1"
                value={localConfig.initial_stock}
                onChange={handleChange('initial_stock')}
              />
              <p className="text-xs text-muted-foreground">{t('initialStockHelp')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="modal_reorder_threshold">{t('reorderThreshold')}</Label>
              <Input
                id="modal_reorder_threshold"
                type="number"
                step="1"
                value={localConfig.reorder_threshold}
                onChange={handleChange('reorder_threshold')}
              />
              <p className="text-xs text-muted-foreground">{t('reorderThresholdHelp')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="modal_max_stock">{t('maxStock')}</Label>
              <Input
                id="modal_max_stock"
                type="number"
                step="1"
                value={localConfig.max_stock}
                onChange={handleChange('max_stock')}
              />
              <p className="text-xs text-muted-foreground">{t('maxStockHelp')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="modal_min_order_quantity">{t('minOrderQty')}</Label>
              <Input
                id="modal_min_order_quantity"
                type="number"
                step="1"
                value={localConfig.min_order_quantity}
                onChange={handleChange('min_order_quantity')}
              />
              <p className="text-xs text-muted-foreground">{t('minOrderQtyHelp')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="modal_max_order_quantity">{t('maxOrderQty')}</Label>
              <Input
                id="modal_max_order_quantity"
                type="number"
                step="1"
                value={localConfig.max_order_quantity}
                onChange={handleChange('max_order_quantity')}
              />
              <p className="text-xs text-muted-foreground">{t('maxOrderQtyHelp')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="modal_lot_size">{t('lotSize')}</Label>
              <Input
                id="modal_lot_size"
                type="number"
                step="1"
                value={localConfig.lot_size}
                onChange={handleChange('lot_size')}
              />
              <p className="text-xs text-muted-foreground">{t('lotSizeHelp')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="modal_delivery_lead_time_days">{t('deliveryLeadTime')}</Label>
              <Input
                id="modal_delivery_lead_time_days"
                type="number"
                step="1"
                value={localConfig.delivery_lead_time_days}
                onChange={handleChange('delivery_lead_time_days')}
              />
              <p className="text-xs text-muted-foreground">{t('deliveryLeadTimeHelp')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="modal_simulation_days">{t('simulationDays')}</Label>
              <Input
                id="modal_simulation_days"
                type="number"
                step="1"
                value={localConfig.simulation_days}
                onChange={handleChange('simulation_days')}
              />
              <p className="text-xs text-muted-foreground">{t('simulationDaysHelp')}</p>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} className="flex-1">
              {t('runSimulation')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {t('reset')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
