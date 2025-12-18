from datetime import datetime, timedelta
from dateutil import parser as date_parser
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass, field
from enum import Enum


class EventType(str, Enum):
    CONSUMPTION = "consumption"
    ORDER = "order"
    DELIVERY = "delivery"
    THRESHOLD_CROSSED = "threshold_crossed"
    LOW_STOCK_WARNING = "low_stock_warning"


@dataclass
class SimulationEvent:
    date: datetime
    event_type: EventType
    description: str
    stock_before: float
    stock_after: float
    quantity: float = 0.0
    is_working_day: bool = True
    order_id: Optional[int] = None  # ID de la commande/livraison associée


@dataclass
class Order:
    order_id: int  # ID unique de la commande
    order_date: datetime
    delivery_date: datetime
    quantity: int
    delivered: bool = False


@dataclass
class SimulationConfig:
    daily_consumption: float = 4.25
    initial_stock: float = 0.0
    reorder_threshold: float = 36.0
    max_stock: float = 45.0  # Stock maximum à ne pas dépasser
    min_order_quantity: int = 2
    max_order_quantity: int = 10
    lot_size: int = 2
    delivery_lead_time_days: int = 3
    simulation_days: int = 60
    min_stock_to_start_sales: float = 36.0  # Stock minimum avant de commencer les ventes


@dataclass
class DailyDetail:
    """Détails complets d'une journée"""
    date: datetime
    day_of_week: str
    is_working_day: bool
    stock_start: float  # Stock début de journée (après livraisons)
    deliveries: float  # Livraisons reçues
    consumption: float  # Ventes/consommation
    stock_end: float  # Stock fin de journée
    orders_placed: int  # Nombre de commandes passées
    order_quantity: int  # Quantité commandée
    order_id: Optional[int] = None  # ID de la commande passée
    delivery_id: Optional[int] = None  # ID de la livraison reçue
    has_threshold_crossed: bool = False  # Passage sous le seuil
    has_stockout: bool = False  # Rupture de stock


@dataclass
class SimulationResult:
    events: List[SimulationEvent] = field(default_factory=list)
    orders: List[Order] = field(default_factory=list)
    daily_details: List[DailyDetail] = field(default_factory=list)
    final_stock: float = 0.0
    stockouts_count: int = 0
    total_ordered: int = 0
    average_stock: float = 0.0
    min_stock: float = 0.0
    max_stock: float = 0.0


class InventorySimulator:
    def __init__(self, config: SimulationConfig, start_date: Optional[datetime] = None):
        self.config = config
        self.start_date = start_date or datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        self.current_stock = config.initial_stock
        self.events: List[SimulationEvent] = []
        self.orders: List[Order] = []
        self.pending_deliveries: List[Order] = []
        self.stockouts_count = 0
        self.stock_history: List[float] = []
        self.daily_details: List[DailyDetail] = []
        self.next_order_id = 1  # Compteur pour les IDs de commande
        
        # Le seuil de vente n'est actif QUE si le stock initial est 0
        # Si stock initial > 0, les ventes commencent immédiatement
        self.sales_started = config.initial_stock > 0

    def is_working_day(self, date: datetime) -> bool:
        """Vérifie si le jour est ouvré (lundi=0 à samedi=5, dimanche=6)"""
        return date.weekday() != 6

    def add_working_days(self, start_date: datetime, days: int) -> datetime:
        """Ajoute un nombre de jours ouvrés à une date"""
        current = start_date
        added = 0
        while added < days:
            current += timedelta(days=1)
            if self.is_working_day(current):
                added += 1
        return current

    def calculate_order_quantity(self, current_stock: float, delivery_date: datetime) -> int:
        """
        Calcule la quantité à commander = TOUJOURS LE MAXIMUM
        Sans dépasser le stock maximum le jour de livraison
        """
        # Calculer le stock au moment de la livraison
        days_until_delivery = (delivery_date - datetime.now()).days
        if hasattr(self, 'current_date_simulation'):
            days_until_delivery = (delivery_date - self.current_date_simulation).days

        # Stock projeté au moment de la livraison (avant la livraison)
        projected_stock_at_delivery = current_stock - (days_until_delivery * self.config.daily_consumption)

        # Calculer le maximum qu'on peut commander sans dépasser max_stock
        max_quantity_allowed = self.config.max_stock - projected_stock_at_delivery

        # Arrondir au lot inférieur
        max_quantity_allowed = (int(max_quantity_allowed) // self.config.lot_size) * self.config.lot_size

        # Prendre le minimum entre max_order_quantity et ce qui ne dépasse pas max_stock
        quantity = min(self.config.max_order_quantity, max_quantity_allowed)

        # S'assurer que c'est au moins le minimum (sauf si ça dépasse max_stock)
        if quantity < self.config.min_order_quantity:
            quantity = self.config.min_order_quantity

        # Assurer que c'est un multiple du lot
        quantity = (quantity // self.config.lot_size) * self.config.lot_size

        return max(quantity, self.config.min_order_quantity)

    def should_order(self, current_date: datetime) -> bool:
        """
        Détermine s'il faut passer commande aujourd'hui.
        RÈGLE : Une seule commande en attente à la fois
        OBJECTIF : Le stock ne doit PAS passer sous le seuil le jour de livraison
        """
        # RÈGLE 1 : On ne commande que si aucune livraison n'est en attente
        if len(self.pending_deliveries) > 0:
            return False

        # Calculer la date de livraison (3 jours ouvrés)
        delivery_date = self.add_working_days(current_date, self.config.delivery_lead_time_days)
        days_until_delivery = (delivery_date - current_date).days

        # Stock projeté AU MOMENT de la livraison (avant réception)
        projected_stock_at_delivery = self.current_stock - (days_until_delivery * self.config.daily_consumption)

        # RÈGLE 2 : Commander si le stock projeté sera <= seuil le jour de livraison
        # On anticipe pour que le jour de livraison, on soit encore au-dessus du seuil
        return projected_stock_at_delivery <= self.config.reorder_threshold

    def place_order(self, order_date: datetime) -> Optional[Order]:
        """Passe une commande si nécessaire"""
        if not self.is_working_day(order_date):
            return None

        if not self.should_order(order_date):
            return None

        # Calculer la date de livraison (3 jours ouvrés)
        delivery_date = self.add_working_days(order_date, self.config.delivery_lead_time_days)

        # Calculer la quantité = MAXIMUM possible
        quantity = self.calculate_order_quantity(self.current_stock, delivery_date)

        # Créer la commande avec un ID unique
        order_id = self.next_order_id
        self.next_order_id += 1

        order = Order(
            order_id=order_id,
            order_date=order_date,
            delivery_date=delivery_date,
            quantity=quantity
        )

        self.orders.append(order)
        self.pending_deliveries.append(order)

        self.events.append(SimulationEvent(
            date=order_date,
            event_type=EventType.ORDER,
            description=f"Commande #{order_id} de {quantity} unités (livraison prévue le {delivery_date.strftime('%Y-%m-%d')})",
            stock_before=self.current_stock,
            stock_after=self.current_stock,
            quantity=quantity,
            is_working_day=True,
            order_id=order_id
        ))

        return order

    def process_deliveries(self, current_date: datetime) -> Tuple[float, Optional[int]]:
        """Traite les livraisons prévues pour aujourd'hui
        Retourne: (quantité totale livrée, ID de la commande livrée)
        """
        total_delivered = 0.0
        delivery_id = None

        if not self.is_working_day(current_date):
            return total_delivered, delivery_id

        deliveries_today = [o for o in self.pending_deliveries if o.delivery_date.date() == current_date.date()]

        for order in deliveries_today:
            stock_before = self.current_stock
            self.current_stock += order.quantity
            total_delivered += order.quantity
            order.delivered = True
            delivery_id = order.order_id

            self.events.append(SimulationEvent(
                date=current_date,
                event_type=EventType.DELIVERY,
                description=f"Livraison #{order.order_id} de {order.quantity} unités (commandée le {order.order_date.strftime('%Y-%m-%d')})",
                stock_before=stock_before,
                stock_after=self.current_stock,
                quantity=order.quantity,
                is_working_day=True,
                order_id=order.order_id
            ))

            self.pending_deliveries.remove(order)

        return total_delivered, delivery_id

    def apply_consumption(self, current_date: datetime) -> float:
        """Applique la consommation quotidienne seulement si les ventes ont démarré
        
        Returns:
            float: La consommation réelle appliquée ce jour (0.0 si les ventes n'ont pas encore démarré)
        """
        stock_before = self.current_stock
        
        # Vérifier si les ventes peuvent démarrer (une seule fois)
        if not self.sales_started:
            if stock_before >= self.config.min_stock_to_start_sales:
                self.sales_started = True
                if self.config.min_stock_to_start_sales > 0:
                    self.events.append(SimulationEvent(
                        date=current_date,
                        event_type=EventType.THRESHOLD_CROSSED,
                        description=f"▶️ DÉBUT DES VENTES - Stock ({stock_before:.2f}) a atteint le seuil ({self.config.min_stock_to_start_sales:.2f})",
                        stock_before=stock_before,
                        stock_after=stock_before,
                        quantity=0.0,
                        is_working_day=self.is_working_day(current_date)
                    ))
            else:
                # Pas encore de ventes - phase d'approvisionnement initial
                self.events.append(SimulationEvent(
                    date=current_date,
                    event_type=EventType.LOW_STOCK_WARNING,
                    description=f"📦 Approvisionnement initial - Stock ({stock_before:.2f}) < seuil de vente ({self.config.min_stock_to_start_sales:.2f})",
                    stock_before=stock_before,
                    stock_after=stock_before,
                    quantity=0.0,
                    is_working_day=self.is_working_day(current_date)
                ))
                self.stock_history.append(self.current_stock)
                return 0.0  # Retourner 0 car pas de consommation
        
        # Les ventes ont démarré, appliquer la consommation
        self.current_stock -= self.config.daily_consumption

        # Vérifier la rupture de stock
        if self.current_stock < 0:
            self.stockouts_count += 1
            self.events.append(SimulationEvent(
                date=current_date,
                event_type=EventType.LOW_STOCK_WARNING,
                description=f"⚠️ RUPTURE DE STOCK ! Stock négatif: {self.current_stock:.2f}",
                stock_before=stock_before,
                stock_after=self.current_stock,
                quantity=self.config.daily_consumption,
                is_working_day=self.is_working_day(current_date)
            ))

        # Vérifier le passage sous le seuil
        if stock_before >= self.config.reorder_threshold and self.current_stock < self.config.reorder_threshold:
            self.events.append(SimulationEvent(
                date=current_date,
                event_type=EventType.THRESHOLD_CROSSED,
                description=f"Passage sous le seuil de {self.config.reorder_threshold} unités",
                stock_before=stock_before,
                stock_after=self.current_stock,
                quantity=self.config.daily_consumption,
                is_working_day=self.is_working_day(current_date)
            ))

        self.events.append(SimulationEvent(
            date=current_date,
            event_type=EventType.CONSUMPTION,
            description=f"Consommation quotidienne de {self.config.daily_consumption} unités",
            stock_before=stock_before,
            stock_after=self.current_stock,
            quantity=self.config.daily_consumption,
            is_working_day=self.is_working_day(current_date)
        ))

        self.stock_history.append(self.current_stock)
        return self.config.daily_consumption  # Retourner la consommation réelle

    def run_simulation(self) -> SimulationResult:
        """Exécute la simulation complète"""
        current_date = self.start_date

        for day in range(self.config.simulation_days):
            # Stocker la date courante pour calculate_order_quantity
            self.current_date_simulation = current_date

            # Capturer l'état de début de journée
            stock_before_deliveries = self.current_stock

            # 1. Traiter les livraisons du jour (si jour ouvré) - MAJ stock début de journée
            deliveries, delivery_id = self.process_deliveries(current_date)
            stock_after_deliveries = self.current_stock

            # 2. Vérifier si une commande doit être passée (si jour ouvré)
            order = self.place_order(current_date)

            # 3. Appliquer la consommation (tous les jours, y compris dimanche)
            stock_before_consumption = self.current_stock
            actual_consumption = self.apply_consumption(current_date)
            stock_after_consumption = self.current_stock

            # Enregistrer les détails de la journée
            day_names = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

            # Vérifier si seuil franchi ou rupture
            threshold_crossed = (stock_before_consumption >= self.config.reorder_threshold and
                               stock_after_consumption < self.config.reorder_threshold)
            has_stockout = stock_after_consumption < 0

            daily_detail = DailyDetail(
                date=current_date,
                day_of_week=day_names[current_date.weekday()],
                is_working_day=self.is_working_day(current_date),
                stock_start=stock_after_deliveries,  # Stock après livraisons = stock début de journée
                deliveries=deliveries,
                consumption=actual_consumption,  # Utiliser la consommation réelle (0 si ventes pas démarrées)
                stock_end=stock_after_consumption,
                orders_placed=1 if order else 0,
                order_quantity=order.quantity if order else 0,
                order_id=order.order_id if order else None,
                delivery_id=delivery_id,
                has_threshold_crossed=threshold_crossed,
                has_stockout=has_stockout
            )

            self.daily_details.append(daily_detail)

            # Passer au jour suivant
            current_date += timedelta(days=1)

        # Calculer les statistiques
        avg_stock = sum(self.stock_history) / len(self.stock_history) if self.stock_history else 0
        min_stock = min(self.stock_history) if self.stock_history else 0
        max_stock = max(self.stock_history) if self.stock_history else 0
        total_ordered = sum(o.quantity for o in self.orders)

        return SimulationResult(
            events=self.events,
            orders=self.orders,
            daily_details=self.daily_details,
            final_stock=self.current_stock,
            stockouts_count=self.stockouts_count,
            total_ordered=total_ordered,
            average_stock=avg_stock,
            min_stock=min_stock,
            max_stock=max_stock
        )


def run_simulation_with_config(config_dict: Dict) -> Dict:
    """Fonction helper pour exécuter une simulation à partir d'un dictionnaire de config"""
    # Extraire start_date avant de créer SimulationConfig
    start_date = None
    if 'start_date' in config_dict and config_dict['start_date']:
        from dateutil import parser
        start_date = parser.parse(config_dict['start_date'])

    # Créer config sans start_date
    config_for_simulation = {k: v for k, v in config_dict.items() if k != 'start_date'}
    config = SimulationConfig(**config_for_simulation)

    simulator = InventorySimulator(config, start_date=start_date)
    result = simulator.run_simulation()

    return {
        "config": config_dict,
        "events": [
            {
                "date": e.date.isoformat(),
                "event_type": e.event_type.value,
                "description": e.description,
                "stock_before": e.stock_before,
                "stock_after": e.stock_after,
                "quantity": e.quantity,
                "is_working_day": e.is_working_day,
                "order_id": e.order_id
            }
            for e in result.events
        ],
        "orders": [
            {
                "order_id": o.order_id,
                "order_date": o.order_date.isoformat(),
                "delivery_date": o.delivery_date.isoformat(),
                "quantity": o.quantity,
                "delivered": o.delivered
            }
            for o in result.orders
        ],
        "daily_details": [
            {
                "date": d.date.isoformat(),
                "day_of_week": d.day_of_week,
                "is_working_day": d.is_working_day,
                "stock_start": d.stock_start,
                "deliveries": d.deliveries,
                "consumption": d.consumption,
                "stock_end": d.stock_end,
                "orders_placed": d.orders_placed,
                "order_quantity": d.order_quantity,
                "order_id": d.order_id,
                "delivery_id": d.delivery_id,
                "has_threshold_crossed": d.has_threshold_crossed,
                "has_stockout": d.has_stockout
            }
            for d in result.daily_details
        ],
        "statistics": {
            "final_stock": result.final_stock,
            "stockouts_count": result.stockouts_count,
            "total_ordered": result.total_ordered,
            "average_stock": result.average_stock,
            "min_stock": result.min_stock,
            "max_stock": result.max_stock,
            "total_events": len(result.events),
            "total_orders": len(result.orders)
        }
    }


def analyze_stock_trend(daily_details: List[DailyDetail], analysis_period_days: int = 30) -> Dict:
    """
    Analyse la tendance du stock sur une période donnée.
    
    Args:
        daily_details: Liste des détails quotidiens
        analysis_period_days: Nombre de jours à analyser (défaut: 30)
    
    Returns:
        Dict contenant:
        - trend: "descending", "stable", "ascending"
        - is_viable: True si la courbe ne descend pas continuellement
        - avg_change: Changement moyen par jour
        - final_vs_initial: Comparaison entre stock final et initial de la période
    """
    if len(daily_details) < analysis_period_days:
        analysis_period_days = len(daily_details)
    
    if analysis_period_days == 0:
        return {
            "trend": "unknown",
            "is_viable": False,
            "avg_change_per_day": 0,
            "final_vs_initial": 0,
            "description": "Pas assez de données"
        }
    
    # Prendre les derniers jours
    period = daily_details[-analysis_period_days:]
    
    # Calculer la tendance globale
    initial_stock = period[0].stock_start
    final_stock = period[-1].stock_end
    total_change = final_stock - initial_stock
    avg_change_per_day = total_change / analysis_period_days
    
    # AMÉLIORATION : Vérifier si la tendance descendante continue même sans rupture
    # Si le stock diminue continuellement, même lentement, c'est non viable à long terme
    if avg_change_per_day < -0.1:  # Seuil plus strict : toute diminution continue est problématique
        trend = "descending"
        is_viable = False
        # Calculer combien de jours avant rupture si la tendance continue
        days_to_stockout = final_stock / abs(avg_change_per_day) if avg_change_per_day < 0 else float('inf')
        description = f"📉 Stock en baisse continue ({avg_change_per_day:+.2f} unités/jour). "
        if days_to_stockout < 60:
            description += f"Rupture prévisible dans ~{int(days_to_stockout)} jours. Configuration NON VIABLE."
        else:
            description += "Configuration NON VIABLE à long terme."
    elif avg_change_per_day > 0.5:  # Gain significatif par jour
        trend = "ascending"
        is_viable = True
        description = f"📈 Stock en hausse continue (+{avg_change_per_day:.2f} unités/jour). Configuration VIABLE à long terme."
    elif avg_change_per_day >= -0.1 and avg_change_per_day <= 0.5:  # Relativement stable
        trend = "stable"
        is_viable = True
        description = f"➡️ Stock stable (variation: {avg_change_per_day:+.2f} unités/jour). Configuration ÉQUILIBRÉE et VIABLE."
    else:
        trend = "stable"
        is_viable = True
        description = f"Stock stable (variation: {avg_change_per_day:+.2f} unités/jour). Configuration équilibrée."
    
    # Vérifier s'il y a eu des ruptures
    stockouts_in_period = sum(1 for d in period if d.has_stockout)
    if stockouts_in_period > 0:
        is_viable = False
        description += f" ⚠️ {stockouts_in_period} rupture(s) de stock détectée(s)."
    
    return {
        "trend": trend,
        "is_viable": is_viable,
        "avg_change_per_day": round(avg_change_per_day, 2),
        "final_vs_initial": round(total_change, 2),
        "description": description,
        "initial_stock": round(initial_stock, 2),
        "final_stock": round(final_stock, 2),
        "stockouts_in_period": stockouts_in_period
    }


def find_stability_solutions(config_dict: Dict) -> Dict:
    """
    Analyse la configuration et propose des solutions pour atteindre la stabilité.
    Teste soit la réduction de consommation, soit l'augmentation de max_order_quantity.
    
    Args:
        config_dict: Configuration de base
    
    Returns:
        Dict contenant les solutions proposées
    """
    current_consumption = config_dict["daily_consumption"]
    current_max_order = config_dict["max_order_quantity"]
    lot_size = config_dict["lot_size"]
    
    # Solution 1: Trouver la consommation maximale viable
    max_viable_consumption = None
    test_consumption = current_consumption
    
    # Tester en réduisant la consommation par pas de 0.5
    while test_consumption >= 0.5:
        test_config = config_dict.copy()
        test_config["daily_consumption"] = test_consumption
        test_config["simulation_days"] = 60
        
        try:
            result = run_simulation_with_config(test_config)
            stats = result["statistics"]
            
            # Convertir daily_details
            daily_details_objs = [
                DailyDetail(
                    date=date_parser.parse(d["date"]),
                    day_of_week=d["day_of_week"],
                    is_working_day=d["is_working_day"],
                    stock_start=d["stock_start"],
                    deliveries=d["deliveries"],
                    consumption=d["consumption"],
                    stock_end=d["stock_end"],
                    orders_placed=d["orders_placed"],
                    order_quantity=d["order_quantity"],
                    order_id=d["order_id"],
                    delivery_id=d["delivery_id"],
                    has_threshold_crossed=d["has_threshold_crossed"],
                    has_stockout=d["has_stockout"]
                )
                for d in result["daily_details"]
            ]
            
            trend = analyze_stock_trend(daily_details_objs, 30)
            
            # Configuration viable si pas de rupture et tendance stable/ascendante
            if stats["stockouts_count"] == 0 and trend["trend"] in ["stable", "ascending"]:
                max_viable_consumption = test_consumption
                break
        except:
            pass
        
        test_consumption -= 0.5
        if test_consumption < 0.5:
            break
    
    # Solution 2: Trouver le max_order_quantity nécessaire
    min_required_max_order = None
    test_max_order = current_max_order
    
    # Tester en augmentant max_order_quantity
    while test_max_order <= 50:  # Maximum raisonnable
        # S'assurer que c'est un multiple du lot_size
        if test_max_order % lot_size != 0:
            test_max_order += 1
            continue
            
        test_config = config_dict.copy()
        test_config["max_order_quantity"] = test_max_order
        test_config["simulation_days"] = 60
        
        try:
            result = run_simulation_with_config(test_config)
            stats = result["statistics"]
            
            # Convertir daily_details
            daily_details_objs = [
                DailyDetail(
                    date=date_parser.parse(d["date"]),
                    day_of_week=d["day_of_week"],
                    is_working_day=d["is_working_day"],
                    stock_start=d["stock_start"],
                    deliveries=d["deliveries"],
                    consumption=d["consumption"],
                    stock_end=d["stock_end"],
                    orders_placed=d["orders_placed"],
                    order_quantity=d["order_quantity"],
                    order_id=d["order_id"],
                    delivery_id=d["delivery_id"],
                    has_threshold_crossed=d["has_threshold_crossed"],
                    has_stockout=d["has_stockout"]
                )
                for d in result["daily_details"]
            ]
            
            trend = analyze_stock_trend(daily_details_objs, 30)
            
            if stats["stockouts_count"] == 0 and trend["trend"] in ["stable", "ascending"]:
                min_required_max_order = test_max_order
                break
        except:
            pass
        
        test_max_order += lot_size
    
    # Construire les recommandations
    solutions = []
    
    if max_viable_consumption is not None and max_viable_consumption < current_consumption:
        solutions.append({
            "type": "reduce_consumption",
            "current_value": current_consumption,
            "suggested_value": max_viable_consumption,
            "message": f"Réduire la consommation à {max_viable_consumption:.1f} boules/jour (actuellement {current_consumption:.1f})"
        })
    elif max_viable_consumption == current_consumption:
        solutions.append({
            "type": "consumption_ok",
            "current_value": current_consumption,
            "suggested_value": current_consumption,
            "message": f"✅ Consommation actuelle ({current_consumption:.1f} boules/jour) est viable"
        })
    
    if min_required_max_order is not None and min_required_max_order > current_max_order:
        solutions.append({
            "type": "increase_max_order",
            "current_value": current_max_order,
            "suggested_value": min_required_max_order,
            "message": f"Augmenter la quantité max par livraison à {min_required_max_order} unités (actuellement {current_max_order})"
        })
    elif min_required_max_order == current_max_order:
        solutions.append({
            "type": "max_order_ok",
            "current_value": current_max_order,
            "suggested_value": current_max_order,
            "message": f"✅ Quantité max par livraison ({current_max_order}) est suffisante"
        })
    
    # Message global
    if not solutions or all(s["type"].endswith("_ok") for s in solutions):
        overall_message = "✅ Configuration stable avec les paramètres actuels"
    elif len(solutions) == 0:
        overall_message = "⚠️ Aucune solution trouvée - paramètres trop contraignants"
    else:
        overall_message = "📊 Solutions proposées pour stabiliser le stock"
    
    return {
        "current_consumption": current_consumption,
        "current_max_order": current_max_order,
        "max_viable_consumption": max_viable_consumption,
        "min_required_max_order": min_required_max_order,
        "solutions": solutions,
        "message": overall_message
    }

