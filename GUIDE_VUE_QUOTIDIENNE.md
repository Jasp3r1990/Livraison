# Guide de la Vue Quotidienne

## 🎯 Vue d'ensemble

La **Vue Quotidienne** est la nouvelle fonctionnalité principale qui affiche un tableau détaillé jour par jour avec :

- **Date et jour de la semaine**
- **Stock début de journée** (après livraisons)
- **Livraisons reçues**
- **Ventes/Consommation**
- **Stock fin de journée**
- **Événements** (commandes, alertes)

## 🚀 Comment utiliser

### 1. Sélectionner une date de début

Dans le panneau de configuration, vous trouverez maintenant un champ **"Date de début de simulation"** :

```
┌────────────────────────────────────┐
│ Date de début de simulation        │
│ [2024-01-01]  📅                  │
│ Date de démarrage de la simulation │
└────────────────────────────────────┘
```

- Cliquez sur le champ pour ouvrir le calendrier
- Sélectionnez la date souhaitée
- Ou tapez directement au format YYYY-MM-DD

### 2. Configurer les autres paramètres

Ajustez les paramètres comme avant :
- Consommation quotidienne : 4.25
- Stock initial : 45
- Seuil : 36
- etc.

### 3. Lancer la simulation

Cliquez sur **"Lancer la simulation"**

### 4. Consulter la Vue Quotidienne

L'onglet **"Vue Quotidienne"** s'ouvre par défaut avec un tableau détaillé.

## 📊 Comprendre le tableau

### Colonnes

| Colonne | Description | Exemple |
|---------|-------------|---------|
| **Date** | Date du jour | 01/01/2024 |
| **Jour** | Jour de la semaine | Lundi |
| **Stock Début** | Stock après réception livraisons | 45.00 |
| **Livraisons** | Quantité reçue ce jour | +10.00 ou - |
| **Ventes** | Consommation quotidienne | -4.25 |
| **Stock Fin** | Stock après ventes | 40.75 |
| **Événements** | Commandes, alertes | 📋 Cmd: 10 |

### Indicateurs visuels

#### Couleurs de fond

```
🟢 BLANC     = Jour ouvré normal
🔵 GRIS      = Dimanche (non ouvré)
🟠 ORANGE    = Passage sous le seuil
🔴 ROUGE     = Rupture de stock !
```

#### Badges d'événements

```
📋 Cmd: 10      = Commande de 10 unités passée
⚠️  Seuil       = Stock passé sous le seuil
🚨 RUPTURE     = Rupture de stock
```

## 🔍 Exemple de lecture

```
┌────────────┬──────────┬─────────────┬────────────┬────────┬───────────┬─────────────┐
│    Date    │   Jour   │ Stock Début │ Livraisons │ Ventes │ Stock Fin │ Événements  │
├────────────┼──────────┼─────────────┼────────────┼────────┼───────────┼─────────────┤
│ 01/01/2024 │ Lundi    │    45.00    │     -      │ -4.25  │   40.75   │      -      │
│ 02/01/2024 │ Mardi    │    40.75    │     -      │ -4.25  │   36.50   │      -      │
│ 03/01/2024 │ Mercredi │    36.50    │     -      │ -4.25  │   32.25   │ ⚠️ Seuil    │
│ 04/01/2024 │ Jeudi    │    32.25    │     -      │ -4.25  │   28.00   │ 📋 Cmd: 10  │
│ 05/01/2024 │ Vendredi │    28.00    │     -      │ -4.25  │   23.75   │      -      │
│ 06/01/2024 │ Samedi   │    23.75    │     -      │ -4.25  │   19.50   │      -      │
│ 07/01/2024 │ Dimanche │    19.50    │     -      │ -4.25  │   15.25   │      -      │
│ 08/01/2024 │ Lundi    │    25.25    │  📦 +10.00 │ -4.25  │   21.00   │      -      │
└────────────┴──────────┴─────────────┴────────────┴────────┴───────────┴─────────────┘
```

### Lecture ligne par ligne

**Jour 1 (Lundi 01/01)** :
- Stock début : 45.00 (stock initial)
- Pas de livraison
- Vente : 4.25
- Stock fin : 40.75

**Jour 3 (Mercredi 03/01)** :
- Stock début : 36.50
- Après la vente : 32.25
- ⚠️ **Passage sous le seuil de 36** → alerte !

**Jour 4 (Jeudi 04/01)** :
- Une **commande est passée** : 10 unités
- Livraison prévue dans 3 jours ouvrés (lundi 08/01)

**Jour 8 (Lundi 08/01)** :
- Stock début : **25.25** (19.50 + 10.00 de livraison)
- ✅ La livraison arrive **en début de journée**
- Après vente : 21.00

## 💡 Points Clés

### 1. Stock Début = Stock après livraisons

**Important** : Le "Stock Début" affiché est le stock **après** réception des livraisons du matin.

```
Stock Début J = Stock Fin J-1 + Livraisons J
```

**Exemple** :
- J7 : Stock fin = 15.25
- J8 : Livraison = 10.00
- J8 : **Stock début = 25.25** (15.25 + 10.00)

### 2. Ordre des opérations

Chaque journée suit cet ordre :

```
1. 🌅 DÉBUT DE JOURNÉE
   ├─ Réception livraisons
   └─ Stock Début = Stock Fin J-1 + Livraisons

2. 🏢 PENDANT LA JOURNÉE
   └─ Vérification et passage de commande

3. 🌆 FIN DE JOURNÉE
   ├─ Consommation quotidienne
   └─ Stock Fin = Stock Début - Consommation
```

### 3. Jours ouvrés vs Dimanches

- **Jours ouvrés** (Lun-Sam) : Livraisons possibles
- **Dimanche** : Pas de livraison, consommation normale

Les dimanches apparaissent avec un **fond gris** et le jour en **rouge**.

## 🎨 Personnalisation

### Filtrer les alertes

Utilisez les couleurs pour repérer rapidement :
- **Orange** : Vigilance (stock proche du seuil)
- **Rouge** : Action urgente (rupture)

### Durée de simulation

Pour une vue plus complète :
- **7 jours** : Aperçu rapide
- **30 jours** : Vue mensuelle
- **60-90 jours** : Tendances long terme

## 📈 Cas d'usage

### Vérifier une stratégie

1. Configurez vos paramètres
2. Lancez une simulation de 30 jours
3. Dans la vue quotidienne :
   - Vérifiez qu'il n'y a pas de lignes rouges
   - Observez la fréquence des commandes
   - Analysez le stock minimum atteint

### Comparer des dates

Lancez plusieurs simulations avec des dates différentes pour voir l'impact du jour de démarrage :

- Démarrage un lundi
- Démarrage un vendredi
- Démarrage un dimanche

### Déboguer une rupture

Si vous voyez une rupture (ligne rouge) :

1. Remontez dans le tableau
2. Trouvez la dernière commande passée
3. Vérifiez le délai de livraison
4. Identifiez le problème :
   - Commande trop tardive ?
   - Quantité trop faible ?
   - Délai trop long ?

## 🔗 Navigation entre vues

Les 4 onglets sont complémentaires :

1. **Vue Quotidienne** : Détail précis jour par jour
2. **Graphique** : Tendance visuelle du stock
3. **Événements** : Chronologie des actions importantes
4. **Analyse** : Statistiques et recommandations

Utilisez-les ensemble pour une compréhension complète !

## 🆘 Problèmes fréquents

### "Stock début ≠ Stock fin veille"

**Normal !** Si une livraison arrive :
```
Stock Début J = Stock Fin J-1 + Livraisons J
```

### "Livraison un dimanche"

**Impossible !** Les livraisons n'arrivent que les jours ouvrés (Lun-Sam).
Si une livraison était prévue un dimanche, elle sera décalée au lundi.

### "Commande le dimanche"

**Impossible !** Les commandes ne sont passées que les jours ouvrés.
Le dimanche, seule la consommation est appliquée.

## 📚 Ressources

- **README.md** : Documentation complète
- **SCENARIOS.md** : Exemples de configurations
- **ARCHITECTURE.md** : Détails techniques
- **CHANGELOG.md** : Historique des versions

---

🎉 **Profitez de votre nouvelle vue quotidienne !**

*Pour toute question, consultez la documentation ou créez une issue.*
