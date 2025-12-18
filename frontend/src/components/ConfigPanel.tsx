import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { SimulationConfig } from '@/types/simulation';
import { Play, RotateCcw } from 'lucide-react';

interface ConfigPanelProps {
  onRunSimulation: (config: SimulationConfig) => void;
  isLoading: boolean;
}

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

export function ConfigPanel({ onRunSimulation, isLoading }: ConfigPanelProps) {
  const [config, setConfig] = useState<SimulationConfig>(defaultConfig);

  const handleChange = (field: keyof SimulationConfig) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === 'start_date' ? e.target.value : parseFloat(e.target.value);
    setConfig({ ...config, [field]: value });
  };

  const handleReset = () => {
    setConfig(defaultConfig);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRunSimulation(config);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paramètres de Simulation</CardTitle>
        <CardDescription>
          Configurez les paramètres de gestion de stock et lancez la simulation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="start_date">Date de début de simulation</Label>
            <Input
              id="start_date"
              type="date"
              value={config.start_date}
              onChange={handleChange('start_date')}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">Date de démarrage de la simulation</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="daily_consumption">Consommation quotidienne</Label>
              <Input
                id="daily_consumption"
                type="number"
                step="0.01"
                value={config.daily_consumption}
                onChange={handleChange('daily_consumption')}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">Unités consommées par jour</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="initial_stock">Stock initial</Label>
              <Input
                id="initial_stock"
                type="number"
                step="1"
                value={config.initial_stock}
                onChange={handleChange('initial_stock')}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">Niveau de stock au démarrage</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reorder_threshold">Seuil de réapprovisionnement</Label>
              <Input
                id="reorder_threshold"
                type="number"
                step="1"
                value={config.reorder_threshold}
                onChange={handleChange('reorder_threshold')}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">Stock minimum avant commande</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_stock">Stock maximum</Label>
              <Input
                id="max_stock"
                type="number"
                step="1"
                value={config.max_stock}
                onChange={handleChange('max_stock')}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">Stock maximum à ne pas dépasser</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="min_order_quantity">Quantité min. par commande</Label>
              <Input
                id="min_order_quantity"
                type="number"
                step="1"
                value={config.min_order_quantity}
                onChange={handleChange('min_order_quantity')}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">Minimum à commander</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_order_quantity">Quantité max. par livraison</Label>
              <Input
                id="max_order_quantity"
                type="number"
                step="1"
                value={config.max_order_quantity}
                onChange={handleChange('max_order_quantity')}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">Maximum par livraison</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lot_size">Taille du lot</Label>
              <Input
                id="lot_size"
                type="number"
                step="1"
                value={config.lot_size}
                onChange={handleChange('lot_size')}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">Production par lots de N unités</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery_lead_time_days">Délai de livraison</Label>
              <Input
                id="delivery_lead_time_days"
                type="number"
                step="1"
                value={config.delivery_lead_time_days}
                onChange={handleChange('delivery_lead_time_days')}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">Jours ouvrés après commande</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="simulation_days">Durée de simulation</Label>
              <Input
                id="simulation_days"
                type="number"
                step="1"
                value={config.simulation_days}
                onChange={handleChange('simulation_days')}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">Nombre de jours à simuler</p>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              <Play className="mr-2 h-4 w-4" />
              {isLoading ? 'Simulation en cours...' : 'Lancer la simulation'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={isLoading}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Réinitialiser
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
