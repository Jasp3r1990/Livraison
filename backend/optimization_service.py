"""
Service d'optimisation pour calculer précisément le point d'équilibre
et fournir des suggestions fiables basées sur des simulations réelles.
"""
from typing import Dict, List, Optional, Tuple
from simulation_engine import run_simulation_with_config, analyze_stock_trend, DailyDetail
from dateutil import parser as date_parser


def calculate_equilibrium_point(config: Dict) -> Dict:
    """
    Calcule le point d'équilibre exact pour la configuration donnée.
    
    Le point d'équilibre est atteint quand:
    - Livraisons totales ≈ Consommation totale sur la période
    - Pas de ruptures de stock
    - Stock reste stable ou croissant
    
    Returns:
        Dict avec les métriques d'équilibre et recommandations précises
    """
    
    # Configuration de base pour tests
    base_config = config.copy()
    base_config['simulation_days'] = 60  # Période de test suffisamment longue
    
    current_consumption = base_config['daily_consumption']
    current_max_order = base_config['max_order_quantity']
    lot_size = base_config['lot_size']
    lead_time = base_config['delivery_lead_time_days']
    
    # ========== PHASE 1: Tester la configuration actuelle ==========
    current_result = run_simulation_with_config(base_config)
    current_stats = current_result['statistics']
    
    # Analyser la tendance
    daily_details = _convert_daily_details(current_result['daily_details'])
    current_trend = analyze_stock_trend(daily_details, 30)
    
    is_current_viable = _check_viability(current_result, base_config['reorder_threshold'])
    
    # ========== PHASE 2: Calculer la consommation maximale viable ==========
    max_viable_consumption = _find_max_viable_consumption(base_config)
    
    # ========== PHASE 3: Calculer la quantité minimale de livraison requise ==========
    min_required_max_order = _find_min_required_max_order(base_config)
    
    # ========== PHASE 4: Trouver la configuration optimale ==========
    optimal_config = _find_optimal_configuration(base_config, max_viable_consumption, min_required_max_order)
    
    # ========== PHASE 5: Générer les recommandations ==========
    recommendations = _generate_recommendations(
        base_config,
        is_current_viable,
        max_viable_consumption,
        min_required_max_order,
        optimal_config
    )
    
    return {
        "current_status": {
            "is_viable": is_current_viable,
            "daily_consumption": current_consumption,
            "max_order_quantity": current_max_order,
            "final_stock": current_stats['final_stock'],
            "average_stock": current_stats['average_stock'],
            "min_stock": current_stats['min_stock'],
            "stockouts": current_stats['stockouts_count'],
            "trend": current_trend['trend'],
            "trend_description": current_trend['description'],
            "reorder_threshold": base_config['reorder_threshold'],
            "days_above_threshold": sum(1 for day in daily_details if day.stock_end >= base_config['reorder_threshold']),
            "days_above_threshold_percent": (sum(1 for day in daily_details if day.stock_end >= base_config['reorder_threshold']) / len(daily_details) * 100) if daily_details else 0
        },
        "equilibrium_analysis": {
            "max_viable_consumption": max_viable_consumption,
            "min_required_max_order": min_required_max_order,
            "consumption_utilization_rate": (current_consumption / max_viable_consumption * 100) if max_viable_consumption else 0,
            "order_capacity_rate": (current_max_order / min_required_max_order * 100) if min_required_max_order else 0
        },
        "optimal_configuration": optimal_config,
        "recommendations": recommendations,
        "tested_scenarios": {
            "consumption_tests": _describe_consumption_tests(base_config, max_viable_consumption),
            "order_quantity_tests": _describe_order_tests(base_config, min_required_max_order)
        }
    }


def _convert_daily_details(daily_details_dict: List[Dict]) -> List[DailyDetail]:
    """Convertit les détails quotidiens du JSON en objets DailyDetail"""
    return [
        DailyDetail(
            date=date_parser.parse(d['date']),
            day_of_week=d['day_of_week'],
            is_working_day=d['is_working_day'],
            stock_start=d['stock_start'],
            deliveries=d['deliveries'],
            consumption=d['consumption'],
            stock_end=d['stock_end'],
            orders_placed=d['orders_placed'],
            order_quantity=d['order_quantity'],
            order_id=d['order_id'],
            delivery_id=d['delivery_id'],
            has_threshold_crossed=d['has_threshold_crossed'],
            has_stockout=d['has_stockout']
        )
        for d in daily_details_dict
    ]


def _check_viability(result: Dict, reorder_threshold: float) -> bool:
    """
    Vérifie si une configuration est viable en analysant l'évolution des moyennes sur 3 jours.
    
    Nouveau critère:
    - Calcule plusieurs moyennes sur 3 jours consécutifs dans l'échantillon
    - Vérifie que la tendance générale ne baisse pas dans le temps
    - Ne compare plus par rapport au seuil de réapprovisionnement
    
    Returns:
        bool: True si la configuration est viable (tendance stable ou croissante)
    """
    daily_details = result['daily_details']
    
    # Besoin d'au moins 12 jours pour avoir plusieurs moyennes sur 3 jours
    if len(daily_details) < 60:
        return False
    
    # Calculer les moyennes sur 3 jours glissantes (non-chevauchantes)
    three_day_averages = []
    
    for i in range(0, len(daily_details) - 2, 3):
        avg = sum(daily_details[j]['stock_end'] for j in range(i, min(i + 3, len(daily_details)))) / 3
        three_day_averages.append(avg)
    
    # Besoin d'au moins 4 moyennes pour faire une analyse de tendance fiable
    if len(three_day_averages) < 10:
        return False
    
    # Diviser les moyennes en deux groupes : première moitié vs deuxième moitié
    mid_point = len(three_day_averages) // 2
    first_half = three_day_averages[:mid_point]
    second_half = three_day_averages[mid_point:]
    
    # Calculer la moyenne de chaque moitié
    avg_first_half = sum(first_half) / len(first_half)
    avg_second_half = sum(second_half) / len(second_half)
    
    # La configuration est viable si la deuxième moitié n'est pas significativement plus basse
    # On tolère une légère baisse de 10% maximum
    tolerance = avg_first_half * 0.05
    if avg_second_half < avg_first_half - tolerance:
        return False
    
    # Vérifier qu'il n'y a pas de ruptures de stock
    stats = result['statistics']
    if stats['stockouts_count'] > 0:
        return False
    
    # Si la tendance est stable ou croissante, c'est viable
    return True


def _find_max_viable_consumption(base_config: Dict) -> Optional[float]:
    """
    Trouve la consommation quotidienne maximale viable en testant
    différents niveaux par dichotomie.
    
    Critère de viabilité:
    - Moyennes sur 3 jours ne baissent pas dans le temps
    - Pas de ruptures de stock
    """
    config = base_config.copy()
    lot_size = config['lot_size']
    reorder_threshold = config['reorder_threshold']
    
    # Commencer avec la consommation actuelle
    current = config['daily_consumption']
    
    # Bornes de recherche
    min_consumption = 0.1
    max_consumption = config['max_order_quantity'] * 2  # Limite haute réaliste
    
    # Tester d'abord la consommation actuelle
    result = run_simulation_with_config(config)
    is_current_viable = _check_viability(result, reorder_threshold)
    
    if is_current_viable:
        # La configuration actuelle fonctionne, chercher plus haut
        min_consumption = current
    else:
        # La configuration actuelle ne fonctionne pas, chercher plus bas
        max_consumption = current
    
    # Dichotomie pour trouver le maximum viable
    max_viable = None
    precision = 0.1  # Précision de 0.1 boule/jour
    
    while max_consumption - min_consumption > precision:
        test_consumption = (min_consumption + max_consumption) / 2
        
        config['daily_consumption'] = test_consumption
        result = run_simulation_with_config(config)
        
        is_viable = _check_viability(result, reorder_threshold)
        
        if is_viable:
            max_viable = test_consumption
            min_consumption = test_consumption
        else:
            max_consumption = test_consumption
    
    return round(max_viable, 2) if max_viable else None


def _find_min_required_max_order(base_config: Dict) -> Optional[int]:
    """
    Trouve la quantité minimale de livraison requise pour maintenir
    le stock stable avec la consommation actuelle.
    
    Critère de viabilité:
    - Moyennes sur 3 jours ne baissent pas dans le temps
    - Pas de ruptures de stock
    """
    config = base_config.copy()
    lot_size = config['lot_size']
    current_max_order = config['max_order_quantity']
    reorder_threshold = config['reorder_threshold']
    
    # Commencer avec la quantité actuelle
    min_order = lot_size
    max_order = current_max_order * 3  # Limite haute
    
    # Tester d'abord la configuration actuelle
    result = run_simulation_with_config(config)
    is_current_viable = _check_viability(result, reorder_threshold)
    
    if is_current_viable:
        # La configuration actuelle fonctionne, peut-être qu'on peut réduire
        max_order = current_max_order
    else:
        # La configuration actuelle ne fonctionne pas, il faut augmenter
        min_order = current_max_order
    
    # Recherche par incréments de lot_size
    min_required = None
    
    for test_order in range(min_order, max_order + lot_size, lot_size):
        config['max_order_quantity'] = test_order
        
        result = run_simulation_with_config(config)
        is_viable = _check_viability(result, reorder_threshold)
        
        if is_viable:
            min_required = test_order
            break
    
    return min_required


def _find_optimal_configuration(
    base_config: Dict,
    max_viable_consumption: Optional[float],
    min_required_max_order: Optional[int]
) -> Dict:
    """
    Trouve la configuration optimale qui maximise les ventes
    tout en maintenant le stock stable.
    """
    config = base_config.copy()
    
    # Si on a les deux valeurs, tester la combinaison
    if max_viable_consumption and min_required_max_order:
        config['daily_consumption'] = max_viable_consumption
        config['max_order_quantity'] = min_required_max_order
        
        result = run_simulation_with_config(config)
        daily_details = _convert_daily_details(result['daily_details'])
        trend = analyze_stock_trend(daily_details, 30)
        
        return {
            "daily_consumption": max_viable_consumption,
            "max_order_quantity": min_required_max_order,
            "final_stock": result['statistics']['final_stock'],
            "stockouts": result['statistics']['stockouts_count'],
            "trend": trend['trend'],
            "is_optimal": True,
            "improvement_vs_current": {
                "consumption_increase": max_viable_consumption - base_config['daily_consumption'],
                "consumption_increase_percent": ((max_viable_consumption - base_config['daily_consumption']) / base_config['daily_consumption'] * 100) if base_config['daily_consumption'] > 0 else 0,
                "order_adjustment": min_required_max_order - base_config['max_order_quantity'],
                "order_adjustment_percent": ((min_required_max_order - base_config['max_order_quantity']) / base_config['max_order_quantity'] * 100) if base_config['max_order_quantity'] > 0 else 0
            }
        }
    
    return {
        "is_optimal": False,
        "message": "Impossible de trouver une configuration optimale avec les contraintes données"
    }


def _generate_recommendations(
    base_config: Dict,
    is_current_viable: bool,
    max_viable_consumption: Optional[float],
    min_required_max_order: Optional[int],
    optimal_config: Dict
) -> List[Dict]:
    """Génère des recommandations précises basées sur les tests"""
    recommendations = []
    
    current_consumption = base_config['daily_consumption']
    current_max_order = base_config['max_order_quantity']
    
    # Statut actuel
    if is_current_viable:
        recommendations.append({
            "priority": "info",
            "category": "status",
            "title": "✅ Configuration actuelle viable",
            "message": f"Votre configuration actuelle (consommation: {current_consumption:.2f} boules/jour, livraison max: {current_max_order} asafates) est stable.",
            "action": None
        })
    else:
        recommendations.append({
            "priority": "critical",
            "category": "status",
            "title": "❌ Configuration actuelle non viable",
            "message": f"Votre configuration actuelle génère des ruptures de stock ou un stock décroissant.",
            "action": "Appliquer les recommandations ci-dessous"
        })
    
    # Recommandations sur la consommation
    if max_viable_consumption:
        if current_consumption > max_viable_consumption:
            gap = current_consumption - max_viable_consumption
            gap_percent = (gap / current_consumption * 100)
            recommendations.append({
                "priority": "high",
                "category": "consumption",
                "title": "🔽 Réduire les ventes quotidiennes",
                "message": f"Consommation trop élevée. Réduire de {gap:.2f} boules/jour (-{gap_percent:.1f}%)",
                "action": f"Passer de {current_consumption:.2f} à {max_viable_consumption:.2f} boules/jour",
                "current_value": current_consumption,
                "suggested_value": max_viable_consumption,
                "unit": "boules/jour"
            })
        elif current_consumption < max_viable_consumption * 0.8:
            # On vend moins de 80% de la capacité
            potential = max_viable_consumption - current_consumption
            potential_percent = (potential / current_consumption * 100)
            recommendations.append({
                "priority": "medium",
                "category": "consumption",
                "title": "🔼 Opportunité d'augmenter les ventes",
                "message": f"Vous pouvez vendre jusqu'à {potential:.2f} boules/jour de plus (+{potential_percent:.1f}%)",
                "action": f"Augmenter progressivement de {current_consumption:.2f} vers {max_viable_consumption:.2f} boules/jour",
                "current_value": current_consumption,
                "suggested_value": max_viable_consumption,
                "unit": "boules/jour"
            })
        else:
            recommendations.append({
                "priority": "info",
                "category": "consumption",
                "title": "✅ Ventes quotidiennes optimales",
                "message": f"Consommation actuelle ({current_consumption:.2f} boules/jour) proche de l'optimum ({max_viable_consumption:.2f})",
                "action": None
            })
    
    # Recommandations sur la quantité de livraison
    if min_required_max_order:
        if current_max_order < min_required_max_order:
            gap = min_required_max_order - current_max_order
            gap_percent = (gap / current_max_order * 100)
            recommendations.append({
                "priority": "high",
                "category": "supply",
                "title": "📦 Augmenter la capacité de livraison",
                "message": f"Quantité max de livraison insuffisante. Augmenter de {gap} asafates (+{gap_percent:.1f}%)",
                "action": f"Passer de {current_max_order} à {min_required_max_order} asafates par livraison",
                "current_value": current_max_order,
                "suggested_value": min_required_max_order,
                "unit": "asafates"
            })
        elif current_max_order > min_required_max_order * 1.5:
            # On commande 50% de plus que nécessaire
            recommendations.append({
                "priority": "low",
                "category": "supply",
                "title": "💡 Optimisation possible des livraisons",
                "message": f"Vous pourriez réduire la quantité max à {min_required_max_order} asafates (actuellement {current_max_order})",
                "action": f"Optionnel: Réduire à {min_required_max_order} asafates pour optimiser l'espace de stockage",
                "current_value": current_max_order,
                "suggested_value": min_required_max_order,
                "unit": "asafates"
            })
        else:
            recommendations.append({
                "priority": "info",
                "category": "supply",
                "title": "✅ Capacité de livraison adéquate",
                "message": f"Quantité max par livraison ({current_max_order} asafates) est appropriée",
                "action": None
            })
    
    # Recommandation de configuration optimale
    if optimal_config.get('is_optimal'):
        improvement = optimal_config['improvement_vs_current']
        if improvement['consumption_increase'] > 0.5 or abs(improvement['order_adjustment']) > 0:
            recommendations.append({
                "priority": "high",
                "category": "optimization",
                "title": "🎯 Configuration optimale recommandée",
                "message": f"Configuration testée et validée par simulation",
                "action": f"Consommation: {optimal_config['daily_consumption']:.2f} boules/jour | Livraison max: {optimal_config['max_order_quantity']} asafates",
                "details": {
                    "consumption": optimal_config['daily_consumption'],
                    "max_order": optimal_config['max_order_quantity'],
                    "expected_final_stock": optimal_config['final_stock'],
                    "expected_stockouts": optimal_config['stockouts']
                }
            })
    
    # Trier par priorité
    priority_order = {"critical": 0, "high": 1, "medium": 2, "low": 3, "info": 4}
    recommendations.sort(key=lambda x: priority_order.get(x['priority'], 5))
    
    return recommendations


def _describe_consumption_tests(base_config: Dict, max_viable: Optional[float]) -> Dict:
    """Décrit les tests effectués pour la consommation"""
    if max_viable:
        return {
            "tested_range": f"0.1 à {base_config['max_order_quantity'] * 2} boules/jour",
            "max_viable_found": max_viable,
            "current_value": base_config['daily_consumption'],
            "status": "viable" if base_config['daily_consumption'] <= max_viable else "non-viable",
            "method": "Recherche par dichotomie avec simulations complètes"
        }
    return {"status": "Aucune valeur viable trouvée"}


def _describe_order_tests(base_config: Dict, min_required: Optional[int]) -> Dict:
    """Décrit les tests effectués pour la quantité de livraison"""
    if min_required:
        return {
            "tested_range": f"{base_config['lot_size']} à {base_config['max_order_quantity'] * 3} asafates",
            "min_required_found": min_required,
            "current_value": base_config['max_order_quantity'],
            "status": "suffisant" if base_config['max_order_quantity'] >= min_required else "insuffisant",
            "method": f"Recherche incrémentale par pas de {base_config['lot_size']} asafates"
        }
    return {"status": "Aucune valeur viable trouvée"}
