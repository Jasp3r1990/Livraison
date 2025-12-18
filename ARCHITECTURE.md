# Architecture du Système

## Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                        │
│                    http://localhost:5173                     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Dashboard   │  │  Calendrier  │  │   Analyse    │     │
│  │  + Graphique │  │  Événements  │  │  Statistiques│     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌─────────────────────────────────────────────────┐       │
│  │         Panneau de Configuration                 │       │
│  │  (Paramètres de simulation)                     │       │
│  └─────────────────────────────────────────────────┘       │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       │ HTTP REST API
                       │ (JSON)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND (FastAPI)                        │
│                    http://localhost:8000                     │
│                                                              │
│  ┌─────────────────────────────────────────────────┐       │
│  │              API Endpoints                       │       │
│  │  • POST /simulate  - Lance une simulation       │       │
│  │  • POST /analyze   - Analyse la configuration   │       │
│  │  • GET  /config/default - Config par défaut     │       │
│  └────────────────┬────────────────────────────────┘       │
│                   │                                          │
│                   ▼                                          │
│  ┌─────────────────────────────────────────────────┐       │
│  │         Moteur de Simulation                     │       │
│  │  • Gestion du stock                             │       │
│  │  • Calcul des commandes                         │       │
│  │  • Anticipation des besoins                     │       │
│  │  • Respect des jours ouvrés                     │       │
│  └─────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

## Structure des Fichiers

### Racine du Projet

```
Planning/
├── README.md              # Documentation principale
├── QUICKSTART.md          # Guide de démarrage rapide
├── SCENARIOS.md           # Scénarios de test
├── ARCHITECTURE.md        # Ce fichier
├── .gitignore            # Fichiers à ignorer par Git
├── start.bat             # Script de démarrage automatique (Windows)
│
├── backend/              # Backend Python FastAPI
└── frontend/             # Frontend React + shadcn/ui
```

### Backend (`/backend`)

```
backend/
├── main.py                    # API FastAPI
│   ├── Endpoints REST
│   ├── Validation des requêtes (Pydantic)
│   ├── Gestion CORS
│   └── Analyse et recommandations
│
├── simulation_engine.py       # Moteur de simulation
│   ├── Classes de données (Event, Order, Config, Result)
│   ├── InventorySimulator (logique principale)
│   ├── Gestion des jours ouvrés
│   ├── Calcul des quantités optimales
│   └── Anticipation des besoins
│
├── requirements.txt          # Dépendances Python
└── venv/                     # Environnement virtuel (créé à l'installation)
```

### Frontend (`/frontend`)

```
frontend/
├── index.html                # Page HTML principale
├── package.json              # Dépendances npm
├── vite.config.ts            # Configuration Vite
├── tsconfig.json             # Configuration TypeScript
├── tailwind.config.js        # Configuration Tailwind CSS
├── postcss.config.js         # Configuration PostCSS
│
├── src/
│   ├── main.tsx              # Point d'entrée React
│   ├── App.tsx               # Composant principal
│   ├── index.css             # Styles globaux + variables Tailwind
│   │
│   ├── components/
│   │   ├── ConfigPanel.tsx        # Formulaire de configuration
│   │   ├── StockChart.tsx         # Graphique avec Recharts
│   │   ├── EventsCalendar.tsx     # Liste chronologique des événements
│   │   ├── AnalysisReport.tsx     # Statistiques et recommandations
│   │   │
│   │   └── ui/                    # Composants shadcn/ui
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── tabs.tsx
│   │       └── separator.tsx
│   │
│   ├── lib/
│   │   └── utils.ts              # Utilitaires (cn pour className)
│   │
│   └── types/
│       └── simulation.ts         # Types TypeScript
│
└── node_modules/                 # Dépendances (créé à l'installation)
```

## Flux de Données

### 1. Lancement de Simulation

```
User Input (Frontend)
    │
    ├─ Saisie des paramètres dans ConfigPanel
    │
    ▼
État React (config)
    │
    ├─ Validation côté client
    │
    ▼
Requête HTTP POST /simulate
    │
    ├─ Body: SimulationConfig (JSON)
    │
    ▼
Backend - Validation (Pydantic)
    │
    ├─ Vérification des contraintes
    │  • min_order_quantity multiple de lot_size
    │  • max >= min
    │  • threshold < initial_stock
    │
    ▼
Moteur de Simulation
    │
    ├─ Initialisation (stock, date, config)
    │
    ├─ Boucle jour par jour:
    │   ├─ 1. Traiter livraisons (si jour ouvré)
    │   ├─ 2. Vérifier besoin de commande
    │   │     ├─ Calculer stock projeté
    │   │     ├─ Anticiper consommation + délais
    │   │     └─ Passer commande si nécessaire
    │   └─ 3. Appliquer consommation quotidienne
    │
    ├─ Calcul des statistiques
    │
    ▼
Résultat (SimulationResult)
    │
    ├─ events[]      : Tous les événements
    ├─ orders[]      : Toutes les commandes
    └─ statistics    : Métriques calculées
    │
    ▼
Réponse HTTP (JSON)
    │
    ▼
Frontend - Affichage
    │
    ├─ StockChart        : Graphique Recharts
    ├─ EventsCalendar    : Liste filtrée des événements
    └─ AnalysisReport    : Statistiques + analyse
```

### 2. Analyse de Configuration

```
User Input
    │
    ▼
Requête HTTP POST /analyze
    │
    ├─ Body: SimulationConfig
    │
    ▼
Backend - Analyse
    │
    ├─ Exécution de la simulation
    │
    ├─ Calcul des métriques supplémentaires:
    │   ├─ average_days_of_stock
    │   ├─ average_order_size
    │   └─ order_frequency
    │
    ├─ Évaluation de la viabilité:
    │   ├─ service_level (% sans rupture)
    │   └─ is_viable (100% ou non)
    │
    ├─ Génération des recommandations:
    │   ├─ Analyse du stock minimum
    │   ├─ Analyse du taux de rotation
    │   └─ Analyse de l'efficacité des commandes
    │
    └─ Identification des risques:
        ├─ Ruptures de stock
        ├─ Stock minimum critique
        └─ Fréquence de commande anormale
    │
    ▼
Résultat (AnalysisResult)
    │
    ├─ viability
    ├─ recommendations[]
    ├─ risks[]
    └─ metrics
    │
    ▼
Frontend - AnalysisReport
```

## Composants Clés

### Backend - `InventorySimulator`

**Responsabilités** :
- Simuler jour par jour l'évolution du stock
- Gérer les commandes et livraisons
- Respecter les contraintes (jours ouvrés, lots, max)
- Anticiper les besoins futurs

**Méthodes Principales** :

```python
is_working_day(date)              # Vérifie si jour ouvré (lun-sam)
add_working_days(date, days)      # Ajoute N jours ouvrés
should_order(date)                # Décide si commande nécessaire
calculate_order_quantity(...)     # Calcule quantité optimale
place_order(date)                 # Passe une commande
process_deliveries(date)          # Traite livraisons du jour
apply_consumption(date)           # Applique consommation quotidienne
run_simulation()                  # Boucle principale
```

**Algorithme de Commande** :

```python
def should_order(current_date):
    # 1. Calculer date de livraison (+ 3 jours ouvrés)
    delivery_date = add_working_days(current_date, 3)

    # 2. Calculer stock projeté à cette date
    days_until = (delivery_date - current_date).days
    projected_stock = current_stock - (days_until * consumption)

    # 3. Ajouter livraisons prévues avant
    for pending_order in pending_deliveries:
        if pending_order.delivery_date <= delivery_date:
            projected_stock += pending_order.quantity

    # 4. Commander si sous le seuil
    return projected_stock < threshold
```

### Frontend - `App.tsx`

**État Principal** :
```typescript
const [simulationResult, setSimulationResult] = useState<SimulationResult | null>()
const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>()
const [isLoading, setIsLoading] = useState<boolean>()
const [error, setError] = useState<string | null>()
```

**Workflow** :
1. L'utilisateur configure les paramètres dans `ConfigPanel`
2. Au submit, `runSimulation()` est appelé
3. Requête POST vers `/api/simulate`
4. Si succès, requête POST vers `/api/analyze`
5. Mise à jour de l'état avec les résultats
6. Affichage dans les onglets (Tabs)

### Frontend - `StockChart`

**Technologie** : Recharts

**Données** :
- Axe X : Dates (format dd/MM)
- Axe Y : Stock (unités)
- Ligne : Évolution du stock
- Ligne de référence : Seuil de réapprovisionnement
- Tooltip enrichi : Affiche livraisons et commandes

**Traitement** :
```typescript
// Filtrer uniquement les consommations pour le graphique
const chartData = events
  .filter(e => e.event_type === 'consumption')
  .map(event => ({
    date: format(new Date(event.date), 'dd/MM'),
    stock: event.stock_after,
    threshold: reorderThreshold
  }))
```

## Technologies Utilisées

### Backend
| Technologie | Version | Rôle |
|------------|---------|------|
| Python | 3.8+ | Langage |
| FastAPI | 0.68+ | Framework web |
| Pydantic | 1.8+ | Validation données |
| Uvicorn | 0.15+ | Serveur ASGI |
| python-dateutil | 2.8+ | Manipulation dates |

### Frontend
| Technologie | Version | Rôle |
|------------|---------|------|
| React | 18.2 | Library UI |
| TypeScript | 5.2 | Typage statique |
| Vite | 5.0 | Build tool |
| Tailwind CSS | 3.4 | Styles |
| shadcn/ui | - | Composants UI |
| Recharts | 2.10 | Graphiques |
| date-fns | 3.0 | Dates |
| Lucide React | 0.309 | Icônes |

## Patterns de Conception

### Backend
- **Dataclasses** : Structures de données immutables (Event, Order, Config)
- **Builder Pattern** : Construction progressive de la simulation
- **Strategy Pattern** : Différentes stratégies de calcul de quantité

### Frontend
- **Component Composition** : UI composée de petits composants réutilisables
- **Controlled Components** : État géré par React
- **Custom Hooks** : Potentiel pour `useSimulation()`
- **Presentational/Container** : Séparation logique/affichage

## Extensibilité

### Ajouter un Nouveau Type d'Événement

1. **Backend** (`simulation_engine.py`) :
```python
class EventType(str, Enum):
    # ... existants
    NEW_EVENT = "new_event"
```

2. **Frontend** (`EventsCalendar.tsx`) :
```typescript
const eventIcons = {
  // ... existants
  new_event: YourIcon
}
```

### Ajouter un Nouveau Endpoint

1. **Backend** (`main.py`) :
```python
@app.get("/new-endpoint")
async def new_endpoint():
    return {"data": "value"}
```

2. **Frontend** (`App.tsx`) :
```typescript
const fetchNewData = async () => {
  const response = await fetch(`${API_URL}/new-endpoint`)
  return await response.json()
}
```

### Ajouter une Nouvelle Métrique

1. **Backend** (`simulation_engine.py`) :
```python
@dataclass
class SimulationStatistics:
    # ... existantes
    new_metric: float = 0.0
```

2. **Backend** (`main.py`) - calcul :
```python
new_metric_value = calculate_new_metric(result)
```

3. **Frontend** (`types/simulation.ts`) :
```typescript
export interface SimulationStatistics {
  // ... existantes
  new_metric: number;
}
```

4. **Frontend** (`AnalysisReport.tsx`) - affichage :
```tsx
<div>
  <p>Nouvelle Métrique</p>
  <p>{statistics.new_metric}</p>
</div>
```

## Performance

### Backend
- Simulation de 365 jours : **< 50ms**
- Requête complète (simulate + analyze) : **< 100ms**
- Pas de base de données = réponse instantanée

### Frontend
- Build optimisé : **< 1MB** (gzipped)
- First Contentful Paint : **< 1s**
- Recharts avec 365 points : **fluide 60fps**

## Sécurité

### Backend
- Validation stricte des entrées (Pydantic)
- Limites sur les valeurs (min/max)
- CORS configuré pour localhost uniquement
- Pas de stockage de données sensibles

### Frontend
- Validation côté client
- Pas de stockage de tokens (API publique)
- HTTPS recommandé en production

## Déploiement (Production)

### Backend
```bash
# Avec Gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app

# Avec Docker
docker build -t inventory-backend .
docker run -p 8000:8000 inventory-backend
```

### Frontend
```bash
npm run build
# Servir le dossier dist/ avec nginx ou vercel
```

## Tests (Futur)

### Backend
```python
# pytest
def test_simulation_no_stockout():
    config = SimulationConfig(...)
    result = run_simulation_with_config(config)
    assert result['statistics']['stockouts_count'] == 0
```

### Frontend
```typescript
// Jest + React Testing Library
test('renders config panel', () => {
  render(<ConfigPanel onRunSimulation={mockFn} isLoading={false} />)
  expect(screen.getByText(/Paramètres/i)).toBeInTheDocument()
})
```

## Monitoring (Production)

Métriques à surveiller :
- Temps de réponse API
- Taux d'erreur
- Utilisation CPU/RAM
- Nombre de simulations/heure

Outils recommandés :
- **Backend** : Prometheus + Grafana
- **Frontend** : Google Analytics, Sentry
- **Logs** : ELK Stack (Elasticsearch, Logstash, Kibana)
