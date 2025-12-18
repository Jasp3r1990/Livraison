# Changelog - Système de Simulation de Gestion de Stock

## Version 2.0 - Vue Calendrier Détaillée (2025-12-17)

### 🎯 Nouvelles Fonctionnalités

#### Backend
- ✅ **Nouveau type de données `DailyDetail`** : Capture complète de chaque journée
  - Stock début de journée (après livraisons)
  - Livraisons reçues
  - Consommation/ventes
  - Stock fin de journée
  - Commandes passées
  - Alertes (seuil franchi, rupture)

- ✅ **Paramètre `start_date`** : Permet de sélectionner la date de début de simulation
  - Format ISO (YYYY-MM-DD)
  - Optionnel (par défaut : date du jour)

- ✅ **Ordre des opérations corrigé** :
  1. **Livraisons en début de journée** (MAJ du stock début)
  2. Vérification et passage de commande
  3. Consommation quotidienne

#### Frontend

- ✅ **Date Picker** dans le panneau de configuration
  - Sélection de la date de début de simulation
  - Format automatique (YYYY-MM-DD)

- ✅ **Nouveau composant `DailyCalendarView`** :
  - Tableau détaillé jour par jour
  - Colonnes :
    - Date (dd/MM/yyyy)
    - Jour de la semaine
    - **Stock Début** (après livraisons) 📦
    - **Livraisons** reçues
    - **Ventes/Consommation** quotidienne
    - **Stock Fin** de journée
    - **Événements** (commandes, alertes)

- ✅ **Indicateurs visuels** :
  - 🟢 Jours ouvrés normaux (fond blanc)
  - 🟡 Dimanches (fond gris)
  - 🟠 Passage sous le seuil (fond orange + barre latérale)
  - 🔴 Rupture de stock (fond rouge + barre latérale)
  - Badges pour commandes et alertes

- ✅ **Légende explicative** avec détails sur :
  - Les couleurs de fond
  - Les icônes utilisées
  - La signification des colonnes

- ✅ **4 onglets** au lieu de 3 :
  1. **Vue Quotidienne** (nouveau, par défaut)
  2. Graphique
  3. Événements
  4. Analyse

### 🔧 Modifications Techniques

#### Backend (`simulation_engine.py`)
```python
@dataclass
class DailyDetail:
    date: datetime
    day_of_week: str
    is_working_day: bool
    stock_start: float  # ← Stock APRÈS livraisons
    deliveries: float
    consumption: float
    stock_end: float
    orders_placed: int
    order_quantity: int
    has_threshold_crossed: bool
    has_stockout: bool
```

#### Ordre des opérations dans `run_simulation()`:
```python
# 1. Livraisons (début de journée)
deliveries = self.process_deliveries(current_date)
stock_after_deliveries = self.current_stock  # ← Stock début

# 2. Commandes
order = self.place_order(current_date)

# 3. Consommation
self.apply_consumption(current_date)
stock_after_consumption = self.current_stock  # ← Stock fin
```

#### API (`main.py`)
```python
class SimulationRequest(BaseModel):
    # ... autres champs
    start_date: Optional[str] = Field(
        default=None,
        description="Date de début (YYYY-MM-DD)"
    )
```

#### Frontend
- Types TypeScript mis à jour avec `DailyDetail`
- Composant `DailyCalendarView` avec formatage des dates (date-fns)
- ConfigPanel avec input `type="date"`

### 📊 Exemple de Vue Quotidienne

```
Date       | Jour     | Stock Début | Livraisons | Ventes | Stock Fin | Événements
-----------|----------|-------------|------------|--------|-----------|------------
01/01/2024 | Lundi    | 45.00       | -          | -4.25  | 40.75     | -
02/01/2024 | Mardi    | 40.75       | -          | -4.25  | 36.50     | -
03/01/2024 | Mercredi | 36.50       | -          | -4.25  | 32.25     | ⚠️ Seuil
04/01/2024 | Jeudi    | 32.25       | -          | -4.25  | 28.00     | 📋 Cmd: 10
05/01/2024 | Vendredi | 28.00       | -          | -4.25  | 23.75     | -
06/01/2024 | Samedi   | 23.75       | -          | -4.25  | 19.50     | -
07/01/2024 | Dimanche | 19.50       | -          | -4.25  | 15.25     | -
08/01/2024 | Lundi    | 25.25       | 📦 +10.00  | -4.25  | 21.00     | -
```

### 🎨 Améliorations UX

1. **Clarté visuelle** :
   - Stock début clairement identifié (après livraisons)
   - Livraisons en vert avec icône 📦
   - Ventes en gris avec icône ↓
   - Alertes avec badges colorés

2. **Compréhension immédiate** :
   - Jours non ouvrés en rouge
   - Ruptures très visibles (fond rouge)
   - Légende explicative en bas

3. **Navigation** :
   - Vue quotidienne en premier (plus détaillée)
   - 4 onglets pour différents niveaux d'analyse

### 🧪 Tests

Pour tester la nouvelle fonctionnalité :

1. Lancez le backend et frontend
2. Sélectionnez une date de début (ex: 01/01/2024)
3. Configurez les paramètres standards
4. Lancez la simulation
5. Ouvrez l'onglet **"Vue Quotidienne"**
6. Vérifiez que :
   - Le stock début = stock fin J-1 + livraisons
   - Les livraisons arrivent bien en début de journée
   - Les événements sont correctement marqués
   - Les dimanches sont identifiés

### 📝 Documentation Mise à Jour

- README.md ← Ajout de la vue quotidienne
- ARCHITECTURE.md ← Structure DailyDetail
- SCENARIOS.md ← Scénarios avec dates

### 🔄 Compatibilité

- ✅ Rétrocompatible : `start_date` est optionnel
- ✅ Anciennes simulations fonctionnent toujours
- ✅ Pas de breaking changes

---

## Version 1.0 - Version Initiale (2025-12-17)

### Fonctionnalités de Base
- Backend FastAPI avec simulation complète
- Frontend React + shadcn/ui
- 3 vues : Graphique, Calendrier, Analyse
- Configuration complète des paramètres
- Gestion des jours ouvrés
- Anticipation des commandes
- Analyse et recommandations

---

*Dernière mise à jour : 2025-12-17*
