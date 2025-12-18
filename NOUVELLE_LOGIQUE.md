# Nouvelle Logique de Gestion des Commandes

## 🎯 Changements Majeurs (Version 3.0)

### 1. Numérotation des Commandes/Livraisons

**Avant** : Pas de traçabilité
**Maintenant** : Chaque commande a un ID unique (#1, #2, #3...)

```
Commande #1 (10 u.) → Livraison #1 (+10 u.)
Commande #2 (10 u.) → Livraison #2 (+10 u.)
```

Dans l'interface :
- **Colonne Livraisons** : `+10.00` avec `Cmd #1` en dessous
- **Colonne Événements** : `Cmd #2` avec `(10 u.)` en dessous

### 2. Une Seule Commande en Attente

**RÈGLE** : On ne peut passer une nouvelle commande que si aucune livraison n'est en attente.

**Avant** :
```
Lundi : Cmd #1 (10 u.)
Mardi : Cmd #2 (2 u.)   ❌ Plusieurs commandes en parallèle
Mercredi : Cmd #3 (2 u.)
```

**Maintenant** :
```
Lundi : Cmd #1 (10 u.)
Mardi : - (attend livraison #1)
Mercredi : - (attend livraison #1)
Jeudi : Livraison #1 + Cmd #2 ✅
```

### 3. Commandes Toujours au Maximum

**RÈGLE** : Chaque commande = `max_order_quantity` (par défaut 10 unités)

**Exception** : Si cela dépasserait le `max_stock`, on commande moins.

**Formule** :
```python
quantité = min(
    max_order_quantity,  # Par défaut : 10
    max_stock - stock_projeté_livraison  # Ne pas dépasser max_stock
)
```

**Exemple** :
- `max_order_quantity` = 10
- `max_stock` = 100
- Stock projeté le jour de livraison = 35
- Quantité commandée = min(10, 100-35) = 10 ✅

### 4. Stock Maximum

**Nouveau paramètre** : `max_stock` (par défaut 100 unités)

Le système s'assure qu'après une livraison, le stock ne dépasse jamais ce maximum.

Dans l'interface :
```
┌─────────────────────────────┐
│ Stock maximum : [100]       │
│ Stock maximum à ne pas      │
│ dépasser                    │
└─────────────────────────────┘
```

### 5. Meilleure Anticipation

**OBJECTIF** : Le jour de la livraison, le stock ne doit PAS être sous le seuil.

**RÈGLE** : Commander quand `stock_projeté_livraison ≤ seuil`

**Calcul** :
```python
date_livraison = date_actuelle + 3 jours ouvrés
stock_projeté = stock_actuel - (jours_jusqu'à_livraison × consommation_quotidienne)

if stock_projeté ≤ seuil:
    → Passer commande
```

**Exemple** :
```
Lundi : Stock = 45
Délai : 3 jours ouvrés → livraison jeudi
Consommation : 4.25/jour

Stock jeudi avant livraison = 45 - (3 × 4.25) = 32.25
Seuil = 36

32.25 ≤ 36 → ✅ Commander lundi
```

## 📊 Exemple Complet

### Configuration
```
Stock initial : 45
Seuil : 36
Stock max : 100
Consommation : 4.25/jour
Délai livraison : 3 jours ouvrés
Quantité max : 10
```

### Déroulement

| Date | Jour | Stock Début | Livraisons | Ventes | Stock Fin | Événements |
|------|------|-------------|------------|--------|-----------|------------|
| 05/01 | Lun | 45.00 | - | -4.25 | 40.75 | **Cmd #1** (10 u.) |
| 06/01 | Mar | 40.75 | - | -4.25 | 36.50 | - |
| 07/01 | Mer | 36.50 | - | -4.25 | 32.25 | - |
| 08/01 | Jeu | **42.25** | **+10** Cmd #1 | -4.25 | 38.00 | **Cmd #2** (10 u.) |
| 09/01 | Ven | 38.00 | - | -4.25 | 33.75 | - |
| 10/01 | Sam | 33.75 | - | -4.25 | 29.50 | - |
| 11/01 | Dim | 29.50 | - | -4.25 | 25.25 | - |
| 12/01 | Lun | **35.25** | **+10** Cmd #2 | -4.25 | 31.00 | **Cmd #3** (10 u.) |

### Analyse

**Lundi 05/01** :
- Stock actuel : 45
- Livraison prévue : jeudi 08/01
- Stock projeté jeudi : 45 - (3 × 4.25) = **32.25**
- 32.25 ≤ 36 → ✅ **Commander 10 unités** (Cmd #1)

**Jeudi 08/01** :
- 🌅 **Début de journée** : Livraison #1 (+10) → Stock = 42.25
- Stock projeté lundi 12/01 : 42.25 - (3 × 4.25) = **29.50**
- 29.50 ≤ 36 → ✅ **Commander 10 unités** (Cmd #2)
- 🌆 Fin de journée : Stock = 38.00

**Lundi 12/01** :
- 🌅 **Début de journée** : Livraison #2 (+10) → Stock = 35.25
- Stock projeté jeudi 15/01 : 35.25 - (3 × 4.25) = **22.50**
- 22.50 ≤ 36 → ✅ **Commander 10 unités** (Cmd #3)

## 🔍 Traçabilité

### Suivre une commande

**Commande #1 passée le 05/01** :
1. Ligne 05/01 : Badge `Cmd #1 (10 u.)` dans Événements
2. Ligne 08/01 : `+10.00` avec `Cmd #1` dans Livraisons

**Avantages** :
- Voir exactement quelle commande est livrée
- Vérifier les délais (commande → livraison)
- Identifier les anomalies

### Exemple de vérification

```
05/01 Lun : Commande #1
↓ 3 jours ouvrés
08/01 Jeu : Livraison #1 ✅ Délai respecté
```

## ⚙️ Paramètres Modifiés

### Backend (SimulationConfig)

```python
@dataclass
class SimulationConfig:
    daily_consumption: float = 4.25
    initial_stock: float = 45.0
    reorder_threshold: float = 36.0
    max_stock: float = 100.0  # ← NOUVEAU
    min_order_quantity: int = 2
    max_order_quantity: int = 10
    lot_size: int = 2
    delivery_lead_time_days: int = 3
    simulation_days: int = 60
```

### Frontend (ConfigPanel)

Nouveau champ entre "Seuil" et "Quantité min" :

```tsx
<Label htmlFor="max_stock">Stock maximum</Label>
<Input
  id="max_stock"
  type="number"
  value={config.max_stock}
/>
```

## 🧪 Comment Tester

### 1. Redémarrer les serveurs

```bash
# Backend
cd backend
venv\Scripts\python main.py

# Frontend
cd frontend
npm run dev
```

### 2. Lancer une simulation

1. Ouvrir http://localhost:5173
2. Configurer :
   - Date de début : **05/01/2026**
   - Durée : **14 jours**
   - Autres : **par défaut**
3. Lancer la simulation

### 3. Vérifications

Dans la **Vue Quotidienne** :

✅ **IDs visibles** : Cmd #1, Cmd #2, etc.
✅ **Traçabilité** : Cmd #1 → Livraison #1
✅ **Une commande à la fois** : Pas de Cmd #2 avant Livraison #1
✅ **Quantités = 10** : Toutes les commandes à 10 u.
✅ **Stock début** : Inclut la livraison du matin
✅ **Pas de rupture** : Aucune ligne rouge

### 4. Tests Spécifiques

**Test 1 : Stock Maximum**

Configurer :
- `max_stock` = **50**
- `max_order_quantity` = **10**

Résultat attendu :
- Les commandes s'ajustent pour ne pas dépasser 50

**Test 2 : Anticipation**

Configurer :
- `reorder_threshold` = **40**
- `initial_stock` = **45**

Observer :
- Commande passée dès que stock projeté ≤ 40

## 📈 Avantages de la Nouvelle Logique

### 1. Simplicité
- ✅ Une commande = un ID
- ✅ Une seule commande en attente
- ✅ Toujours commander au maximum

### 2. Traçabilité
- ✅ Suivi exact commande → livraison
- ✅ Vérification des délais
- ✅ Historique complet

### 3. Efficacité
- ✅ Moins de commandes (groupage)
- ✅ Livraisons importantes (10 u. à chaque fois)
- ✅ Meilleure rotation du stock

### 4. Sécurité
- ✅ Stock maximum respecté
- ✅ Anticipation du seuil
- ✅ Pas de rupture de stock

## 🔄 Différences avec l'Ancienne Version

| Aspect | Avant | Maintenant |
|--------|-------|------------|
| **IDs** | ❌ Aucun | ✅ Cmd #1, #2, #3... |
| **Commandes parallèles** | ✅ Oui | ❌ Non (une à la fois) |
| **Quantité** | 🔀 Variable | ✅ Toujours max (10) |
| **Stock max** | ❌ Pas de limite | ✅ Limité (100) |
| **Anticipation** | ⚠️ Basique | ✅ Optimisée |
| **Traçabilité** | ❌ Difficile | ✅ Facile |

## 📝 Notes Importantes

1. **Stock Maximum** : Assurez-vous que `max_stock` > `initial_stock`
2. **Cohérence** : `max_order_quantity` doit être un multiple de `lot_size`
3. **Délais** : 3 jours ouvrés = peut être 4-5 jours calendaires avec le dimanche

## 🎓 Pour Aller Plus Loin

### Scénario Avancé : Livraison Samedi

Si une livraison est prévue un samedi :
- Elle arrive le samedi matin ✅
- Nouvelle commande peut être passée le samedi ✅
- Livraison prévue pour mardi (3 jours ouvrés)

### Scénario : Stock Maximum Atteint

Si stock + livraison > max_stock :
- La quantité est réduite automatiquement
- Exemple : Stock = 92, Max = 100
  - Commande = min(10, 100-92) = 8 unités

---

*Version 3.0 - Logique optimisée pour commandes traçables et efficaces*
