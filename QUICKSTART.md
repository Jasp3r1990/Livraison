# Guide de Démarrage Rapide

## Installation Rapide

### 1. Backend Python

```bash
cd backend

# Créer et activer l'environnement virtuel
python -m venv venv
venv\Scripts\activate

# Installer les dépendances
pip install -r requirements.txt

# Lancer le serveur
python main.py
```

Le backend sera disponible sur **http://localhost:8000**

### 2. Frontend React

Dans un **nouveau terminal** :

```bash
cd frontend

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

Le frontend sera disponible sur **http://localhost:5173**

## Démarrage Automatique (Windows)

Double-cliquez sur **`start.bat`** à la racine du projet pour lancer automatiquement le backend et le frontend.

## Vérification

1. Ouvrez **http://localhost:8000/docs** pour voir la documentation de l'API
2. Ouvrez **http://localhost:5173** pour accéder à l'interface utilisateur
3. Configurez les paramètres et lancez votre première simulation !

## Premier Test

Utilisez les paramètres par défaut :
- Consommation quotidienne : **4,25 unités**
- Stock initial : **45 unités**
- Seuil de réapprovisionnement : **36 unités**
- Durée de simulation : **60 jours**

Cliquez sur **"Lancer la simulation"** et explorez les 3 onglets :
- **Graphique** : Visualisation du stock dans le temps
- **Calendrier** : Événements chronologiques
- **Analyse** : Statistiques et recommandations

## Résultats Attendus

Avec la configuration par défaut, vous devriez observer :
- Aucune rupture de stock
- Environ 5-7 commandes sur 60 jours
- Stock minimum autour de 32-36 unités
- Niveau de service de 100%

## Dépannage

### Le backend ne démarre pas
- Vérifiez que Python 3.8+ est installé : `python --version`
- Vérifiez que l'environnement virtuel est activé
- Réinstallez les dépendances : `pip install -r requirements.txt --force-reinstall`

### Le frontend ne démarre pas
- Vérifiez que Node.js 18+ est installé : `node --version`
- Supprimez `node_modules` et réinstallez : `rm -rf node_modules && npm install`

### Erreur de connexion API
- Assurez-vous que le backend tourne sur le port 8000
- Vérifiez qu'aucun pare-feu ne bloque la connexion

## Prochaines Étapes

1. **Expérimentez** avec différents paramètres
2. **Analysez** l'impact du seuil de réapprovisionnement
3. **Testez** différents délais de livraison
4. **Optimisez** la quantité maximum par livraison

## Support

Consultez le fichier **README.md** pour la documentation complète.
