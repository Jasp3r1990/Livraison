# Système de Simulation de Gestion de Stock

Application complète de simulation de gestion de stock avec backend Python (FastAPI) et frontend React (shadcn/ui).

## Fonctionnalités

### Backend (FastAPI)
- Moteur de simulation sophistiqué avec logique de réapprovisionnement
- Gestion des jours ouvrés (lundi-samedi)
- Anticipation des besoins en stock
- API REST complète avec endpoints :
  - `/simulate` - Exécution de simulation
  - `/analyze` - Analyse et recommandations
  - `/config/default` - Configuration par défaut

### Frontend (React + shadcn/ui)
- **Dashboard avec graphiques** : Visualisation de l'évolution du stock avec Recharts
- **Contrôles de paramètres** : Interface intuitive pour configurer la simulation
- **Calendrier des événements** : Vue chronologique de tous les événements
- **Rapport d'analyse** : Statistiques, métriques et recommandations détaillées

## Règles de Gestion

### Consommation
- Vitesse fixe : **4,25 unités/jour**
- Appliquée **tous les jours** (y compris dimanche)

### Stock
- Stock initial : **45 unités**
- Seuil de réapprovisionnement : **36 unités**

### Production & Commandes
- Production par lots de **2 unités**
- Commande minimum : **2 unités**
- Commande maximum : **10 unités/livraison**

### Délais & Livraisons
- Délai de livraison : **3 jours ouvrés**
- Livraisons : **lundi à samedi uniquement**
- Le système anticipe automatiquement les besoins

## Installation

### Prérequis
- Python 3.8+
- Node.js 18+
- npm ou yarn

### Backend

```bash
cd backend

# Créer un environnement virtuel
python -m venv venv

# Activer l'environnement virtuel
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt

# Lancer le serveur
python main.py
```

Le backend sera accessible sur `http://localhost:8000`

Documentation API : `http://localhost:8000/docs`

### Frontend

```bash
cd frontend

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

Le frontend sera accessible sur `http://localhost:5173`

## Utilisation

1. **Démarrer le backend** (port 8000)
2. **Démarrer le frontend** (port 5173)
3. **Ouvrir** `http://localhost:5173` dans votre navigateur
4. **Configurer** les paramètres de simulation
5. **Lancer** la simulation et analyser les résultats

## Structure du Projet

```
.
├── backend/
│   ├── main.py                 # API FastAPI
│   ├── simulation_engine.py    # Moteur de simulation
│   └── requirements.txt        # Dépendances Python
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── ui/            # Composants shadcn/ui
    │   │   ├── ConfigPanel.tsx
    │   │   ├── StockChart.tsx
    │   │   ├── EventsCalendar.tsx
    │   │   └── AnalysisReport.tsx
    │   ├── types/
    │   │   └── simulation.ts   # Types TypeScript
    │   ├── App.tsx            # Application principale
    │   └── main.tsx           # Point d'entrée
    ├── package.json
    └── vite.config.ts

```

## API Endpoints

### POST /simulate
Exécute une simulation avec les paramètres fournis.

**Body:**
```json
{
  "daily_consumption": 4.25,
  "initial_stock": 45.0,
  "reorder_threshold": 36.0,
  "min_order_quantity": 2,
  "max_order_quantity": 10,
  "lot_size": 2,
  "delivery_lead_time_days": 3,
  "simulation_days": 60
}
```

**Response:**
```json
{
  "config": {...},
  "events": [...],
  "orders": [...],
  "statistics": {
    "final_stock": 42.5,
    "average_stock": 38.2,
    "min_stock": 32.1,
    "max_stock": 45.0,
    "stockouts_count": 0,
    "total_ordered": 30,
    "total_orders": 5
  }
}
```

### POST /analyze
Analyse une configuration et fournit des recommandations.

**Response:**
```json
{
  "viability": {
    "is_viable": true,
    "service_level": 100.0,
    "status": "✅ Configuration viable"
  },
  "recommendations": [...],
  "risks": [...],
  "metrics": {
    "average_days_of_stock": 8.98,
    "average_order_size": 6.0,
    "order_frequency": 0.83
  }
}
```

## Technologies Utilisées

### Backend
- **FastAPI** - Framework web moderne et rapide
- **Pydantic** - Validation de données
- **uvicorn** - Serveur ASGI

### Frontend
- **React 18** - Bibliothèque UI
- **TypeScript** - Typage statique
- **Vite** - Build tool
- **shadcn/ui** - Composants UI
- **Recharts** - Graphiques
- **Tailwind CSS** - Styling
- **date-fns** - Manipulation de dates
- **Lucide React** - Icônes

## Développement

### Build Frontend
```bash
cd frontend
npm run build
```

Les fichiers de production seront dans `frontend/dist/`

### Linter
```bash
npm run lint
```

## Personnalisation

### Modifier les paramètres par défaut
Éditez `backend/simulation_engine.py` dans la classe `SimulationConfig`

### Ajouter de nouveaux types d'événements
1. Ajoutez le type dans `EventType` (simulation_engine.py)
2. Ajoutez les icônes et couleurs dans `EventsCalendar.tsx`

### Personnaliser le thème
Modifiez les couleurs dans `frontend/src/index.css`

## Licence

MIT

## Support

Pour toute question ou problème, ouvrez une issue sur le dépôt GitHub.
