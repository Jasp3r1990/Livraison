# Scénarios de Test

Ce document présente différents scénarios pour tester la robustesse de votre système de gestion de stock.

## Scénario 1 : Configuration Standard (Recommandée)

**Objectif** : Vérifier le fonctionnement optimal avec les paramètres par défaut

```json
{
  "daily_consumption": 4.25,
  "initial_stock": 45,
  "reorder_threshold": 36,
  "min_order_quantity": 2,
  "max_order_quantity": 10,
  "lot_size": 2,
  "delivery_lead_time_days": 3,
  "simulation_days": 60
}
```

**Résultats attendus** :
- ✅ Niveau de service : 100%
- ✅ Aucune rupture de stock
- ✅ 5-7 commandes sur 60 jours
- ✅ Stock minimum : ~32-36 unités

---

## Scénario 2 : Stock Insuffisant

**Objectif** : Tester une configuration vouée à l'échec

```json
{
  "daily_consumption": 4.25,
  "initial_stock": 45,
  "reorder_threshold": 20,    // ⚠️ Seuil trop bas
  "min_order_quantity": 2,
  "max_order_quantity": 6,     // ⚠️ Max trop faible
  "lot_size": 2,
  "delivery_lead_time_days": 3,
  "simulation_days": 60
}
```

**Résultats attendus** :
- ❌ Ruptures de stock
- ❌ Niveau de service < 100%
- ⚠️ Recommandations d'augmenter le seuil et le max

---

## Scénario 3 : Sur-stockage

**Objectif** : Observer l'impact d'un stock trop élevé

```json
{
  "daily_consumption": 4.25,
  "initial_stock": 100,        // 📈 Stock élevé
  "reorder_threshold": 80,     // 📈 Seuil élevé
  "min_order_quantity": 2,
  "max_order_quantity": 20,    // 📈 Livraisons importantes
  "lot_size": 2,
  "delivery_lead_time_days": 3,
  "simulation_days": 60
}
```

**Résultats attendus** :
- ✅ Aucune rupture
- ⚠️ Stock moyen très élevé (>80 unités)
- ⚠️ Coût de stockage élevé
- 💡 Recommandation de réduire les paramètres

---

## Scénario 4 : Consommation Élevée

**Objectif** : Tester avec une forte demande

```json
{
  "daily_consumption": 8.5,    // 🔥 Double de la consommation standard
  "initial_stock": 90,
  "reorder_threshold": 70,
  "min_order_quantity": 4,
  "max_order_quantity": 20,
  "lot_size": 2,
  "delivery_lead_time_days": 3,
  "simulation_days": 60
}
```

**Résultats attendus** :
- ✅ Niveau de service : 100%
- 📊 Fréquence de commandes élevée
- 📦 Commandes de grandes quantités

---

## Scénario 5 : Délai de Livraison Long

**Objectif** : Impact d'un délai de livraison prolongé

```json
{
  "daily_consumption": 4.25,
  "initial_stock": 60,         // 📈 Stock initial augmenté
  "reorder_threshold": 50,     // 📈 Seuil augmenté
  "min_order_quantity": 2,
  "max_order_quantity": 10,
  "lot_size": 2,
  "delivery_lead_time_days": 7, // 🕐 Délai doublé
  "simulation_days": 60
}
```

**Résultats attendus** :
- ✅ Aucune rupture si paramètres ajustés
- 📊 Anticipation plus importante nécessaire
- 💡 Stock de sécurité plus élevé

---

## Scénario 6 : Production en Gros Lots

**Objectif** : Impact de lots de production importants

```json
{
  "daily_consumption": 4.25,
  "initial_stock": 50,
  "reorder_threshold": 40,
  "min_order_quantity": 10,    // 📦 Minimum élevé
  "max_order_quantity": 10,
  "lot_size": 10,              // 📦 Gros lots
  "delivery_lead_time_days": 3,
  "simulation_days": 60
}
```

**Résultats attendus** :
- ✅ Moins de commandes
- 📈 Variations de stock plus importantes
- 💡 Peut être économique mais risque plus élevé

---

## Scénario 7 : Simulation Longue Durée

**Objectif** : Observer le comportement sur une année

```json
{
  "daily_consumption": 4.25,
  "initial_stock": 45,
  "reorder_threshold": 36,
  "min_order_quantity": 2,
  "max_order_quantity": 10,
  "lot_size": 2,
  "delivery_lead_time_days": 3,
  "simulation_days": 365       // 📅 Une année complète
}
```

**Résultats attendus** :
- 📊 ~60 commandes sur l'année
- 📈 Stabilité du système sur le long terme
- 💡 Validation de la viabilité

---

## Scénario 8 : Optimisation Fine

**Objectif** : Trouver l'équilibre optimal

**Processus** :
1. Partir de la configuration standard
2. Augmenter progressivement `simulation_days` à 90, puis 180
3. Observer le stock minimum atteint
4. Ajuster `reorder_threshold` pour maintenir un stock minimum de ~20 unités
5. Tester différentes valeurs de `max_order_quantity` (8, 10, 12)
6. Comparer les métriques : fréquence de commande, stock moyen

**Objectif final** :
- Stock moyen le plus bas possible
- Niveau de service = 100%
- Stock minimum > 15 unités

---

## Métriques Clés à Observer

### Niveau de Service
- **100%** : Optimal - Aucune rupture
- **95-99%** : Acceptable - Ruptures occasionnelles
- **<95%** : Critique - Nécessite ajustements

### Stock Moyen
- Calculé en jours de consommation : `stock_moyen / consommation_quotidienne`
- **5-7 jours** : Optimal
- **10-14 jours** : Élevé mais sécuritaire
- **>14 jours** : Sur-stockage

### Fréquence de Commande
- Commandes par semaine
- **0.8-1.2** : Optimal (environ 1 par semaine)
- **>2** : Trop fréquent - augmenter max_order_quantity
- **<0.5** : Rare - risque de rupture

### Taille Moyenne de Commande
- **5-8 unités** : Optimal avec max=10
- **2-4 unités** : Petit - peut augmenter les coûts
- **9-10 unités** : Maximum atteint - peut nécessiter augmentation

---

## Analyses Comparatives

### Test A/B : Seuil de Réapprovisionnement

Comparez ces deux configurations :

**Configuration A** (Seuil Standard)
- `reorder_threshold`: 36

**Configuration B** (Seuil Élevé)
- `reorder_threshold`: 40

Analysez :
- Différence de stock moyen
- Nombre de commandes
- Niveau de service

### Test A/B : Quantité Maximum

**Configuration A** (Standard)
- `max_order_quantity`: 10

**Configuration B** (Élevé)
- `max_order_quantity`: 15

Analysez :
- Fréquence des commandes
- Variations de stock
- Coût estimé

---

## Conseils d'Optimisation

1. **Commencez conservateur** : Utilisez les paramètres par défaut
2. **Une variable à la fois** : Modifiez un seul paramètre pour comprendre son impact
3. **Simulez long** : Testez sur au moins 90 jours pour voir les patterns
4. **Documentez** : Notez les configurations réussies
5. **Contexte réel** : Adaptez aux contraintes de votre secteur (coûts de stockage, fréquence de livraison acceptable)

---

## Limites du Modèle

Ce simulateur suppose :
- Consommation constante (pas de saisonnalité)
- Livraisons toujours respectées
- Pas de coûts de commande ou de stockage
- Qualité parfaite (pas de retours)

Pour une production réelle, considérez :
- Stock de sécurité supplémentaire
- Variabilité de la demande
- Délais de livraison variables
- Coûts totaux (commande + stockage + rupture)
