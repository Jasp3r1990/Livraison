from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from simulation_engine import (
    run_simulation_with_config, 
    SimulationConfig, 
    analyze_stock_trend, 
    find_stability_solutions,
    DailyDetail
)
from optimization_service import calculate_equilibrium_point
from datetime import datetime
from dateutil import parser as date_parser
import uvicorn

app = FastAPI(
    title="Inventory Management Simulation API",
    description="API pour simuler la gestion de stock avec réapprovisionnement automatique",
    version="1.0.0"
)

# Configuration CORS pour permettre les requêtes depuis le frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # Vite et Create React App
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SimulationRequest(BaseModel):
    daily_consumption: float = Field(default=2.13, ge=0.1, le=100, description="Consommation quotidienne en unités")
    initial_stock: float = Field(default=0.0, ge=0, le=1000, description="Stock initial en unités")
    reorder_threshold: float = Field(default=36.0, ge=0, le=1000, description="Seuil de réapprovisionnement")
    max_stock: float = Field(default=45.0, ge=10, le=1000, description="Stock maximum à ne pas dépasser")
    min_order_quantity: int = Field(default=2, ge=2, le=100, description="Quantité minimum par commande")
    max_order_quantity: int = Field(default=10, ge=2, le=100, description="Quantité maximum par commande")
    lot_size: int = Field(default=2, ge=1, le=10, description="Taille des lots de production")
    delivery_lead_time_days: int = Field(default=3, ge=1, le=30, description="Délai de livraison en jours ouvrés")
    simulation_days: int = Field(default=60, ge=7, le=365, description="Nombre de jours à simuler")
    min_stock_to_start_sales: float = Field(default=36.0, ge=0, le=1000, description="Stock minimum avant de commencer les ventes")
    start_date: Optional[str] = Field(default=None, description="Date de début de simulation (format ISO: YYYY-MM-DD)")

    class Config:
        json_schema_extra = {
            "example": {
                "daily_consumption": 4.25,
                "initial_stock": 0.0,
                "reorder_threshold": 36.0,
                "max_stock": 45.0,
                "min_order_quantity": 2,
                "max_order_quantity": 10,
                "lot_size": 2,
                "delivery_lead_time_days": 3,
                "simulation_days": 60,
                "min_stock_to_start_sales": 36.0,
                "start_date": "2024-01-01"
            }
        }


class HealthResponse(BaseModel):
    status: str
    message: str


@app.get("/", response_model=HealthResponse)
async def root():
    """Endpoint de santé de l'API"""
    return HealthResponse(
        status="healthy",
        message="Inventory Management Simulation API is running"
    )


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Vérification de santé de l'API"""
    return HealthResponse(
        status="healthy",
        message="API is operational"
    )


@app.post("/simulate")
async def run_simulation(request: SimulationRequest) -> Dict[str, Any]:
    """
    Exécute une simulation de gestion de stock avec les paramètres fournis.

    Returns:
        - config: Configuration utilisée
        - events: Liste chronologique de tous les événements
        - orders: Liste des commandes passées
        - statistics: Statistiques de la simulation
    """
    try:
        # Validation supplémentaire
        if request.min_order_quantity % request.lot_size != 0:
            raise HTTPException(
                status_code=400,
                detail=f"La quantité minimum ({request.min_order_quantity}) doit être un multiple de la taille de lot ({request.lot_size})"
            )

        if request.max_order_quantity < request.min_order_quantity:
            raise HTTPException(
                status_code=400,
                detail="La quantité maximum doit être supérieure ou égale à la quantité minimum"
            )

        # Validation du seuil seulement si le stock initial est supérieur à 0
        if request.initial_stock > 0 and request.reorder_threshold >= request.initial_stock:
            raise HTTPException(
                status_code=400,
                detail="Le seuil de réapprovisionnement doit être inférieur au stock initial"
            )

        # Convertir la requête en dictionnaire pour la simulation
        config_dict = request.dict()

        # Exécuter la simulation
        result = run_simulation_with_config(config_dict)

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la simulation: {str(e)}"
        )


@app.get("/config/default")
async def get_default_config() -> SimulationRequest:
    """Retourne la configuration par défaut"""
    return SimulationRequest()


@app.post("/analyze")
async def analyze_configuration(request: SimulationRequest) -> Dict[str, Any]:
    """
    Analyse une configuration et fournit des recommandations.

    Returns:
        - viability: Analyse de viabilité de la configuration
        - trend_analysis: Analyse de tendance sur 30 jours
        - consumption_analysis: Test de viabilité selon la consommation
        - recommendations: Recommandations d'amélioration
        - risks: Risques identifiés
    """
    try:
        # Exécuter une simulation pour analyser
        config_dict = request.dict()
        result = run_simulation_with_config(config_dict)

        stats = result["statistics"]
        
        # Convertir daily_details en objets DailyDetail
        daily_details = [
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
        
        # Analyse de tendance sur 30 jours
        trend_analysis = analyze_stock_trend(daily_details, 30)
        
        # Analyse de stabilité et solutions proposées
        stability_solutions = find_stability_solutions(config_dict)

        # Analyse de viabilité globale
        is_viable = trend_analysis["is_viable"] and stats["stockouts_count"] == 0
        service_level = ((config_dict["simulation_days"] - stats["stockouts_count"]) /
                        config_dict["simulation_days"] * 100)

        # Recommandations
        recommendations = []
        risks = []

        # Analyse basée sur la tendance
        if trend_analysis["trend"] == "descending":
            risks.append(f"📉 {trend_analysis['description']}")
            recommendations.append("Augmenter la quantité maximum par livraison")
            recommendations.append("Réduire le délai de livraison si possible")
            recommendations.append("Augmenter le stock initial")
        elif trend_analysis["trend"] == "ascending":
            if stats["average_stock"] > config_dict["max_stock"] * 0.8:
                recommendations.append("Stock élevé : considérer une réduction du seuil de réapprovisionnement")

        if stats["stockouts_count"] > 0:
            risks.append(f"⚠️ {stats['stockouts_count']} jour(s) de rupture de stock détecté(s)")
            recommendations.append("Augmenter le seuil de réapprovisionnement")

        if stats["min_stock"] < 10 and stats["min_stock"] >= 0:
            risks.append(f"Stock minimum très bas: {stats['min_stock']:.2f} unités")
            recommendations.append("Augmenter le seuil de réapprovisionnement pour plus de sécurité")

        # Analyser le taux de rotation
        avg_days_of_stock = stats["average_stock"] / config_dict["daily_consumption"] if config_dict["daily_consumption"] > 0 else 0
        if avg_days_of_stock > 14:
            recommendations.append(f"Stock moyen élevé ({avg_days_of_stock:.1f} jours): envisager de réduire le seuil")
        elif avg_days_of_stock < 5 and avg_days_of_stock > 0:
            risks.append(f"Stock moyen faible ({avg_days_of_stock:.1f} jours): risque de rupture")

        # Efficacité des commandes
        if stats["total_orders"] > 0:
            avg_order_size = stats["total_ordered"] / stats["total_orders"]
            if avg_order_size < config_dict["max_order_quantity"] * 0.5:
                recommendations.append("Les commandes sont souvent petites: optimiser la politique de commande")

        # Ajouter les solutions de stabilité aux recommandations
        if stability_solutions["solutions"]:
            for solution in stability_solutions["solutions"]:
                if solution["type"] not in ["consumption_ok", "max_order_ok"]:
                    recommendations.append(solution["message"])

        return {
            "viability": {
                "is_viable": is_viable,
                "service_level": round(service_level, 2),
                "status": "✅ Configuration viable" if is_viable else "❌ Configuration non viable"
            },
            "trend_analysis": trend_analysis,
            "stability_solutions": {
                "message": stability_solutions["message"],
                "current_consumption": stability_solutions["current_consumption"],
                "current_max_order": stability_solutions["current_max_order"],
                "max_viable_consumption": stability_solutions["max_viable_consumption"],
                "min_required_max_order": stability_solutions["min_required_max_order"],
                "solutions": stability_solutions["solutions"]
            },
            "recommendations": recommendations if recommendations else ["✅ Configuration optimale"],
            "risks": risks if risks else ["✅ Aucun risque identifié"],
            "metrics": {
                "average_days_of_stock": round(avg_days_of_stock, 2) if avg_days_of_stock > 0 else 0,
                "average_order_size": round(stats["total_ordered"] / stats["total_orders"], 2) if stats["total_orders"] > 0 else 0,
                "order_frequency": round(stats["total_orders"] / (config_dict["simulation_days"] / 7), 2)  # commandes par semaine
            }
        }

    except Exception as e:
        import traceback
        error_detail = f"Erreur lors de l'analyse: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)  # Log l'erreur complète
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de l'analyse: {str(e)}"
        )


@app.post("/optimize")
async def optimize_configuration(request: SimulationRequest) -> Dict[str, Any]:
    """
    Calcule le point d'équilibre et fournit des recommandations précises
    basées sur des simulations réelles.
    
    Ce service teste différents scénarios pour trouver:
    - La consommation quotidienne maximale viable
    - La quantité minimale de livraison requise
    - La configuration optimale
    
    Returns:
        - current_status: État de la configuration actuelle
        - equilibrium_analysis: Analyse du point d'équilibre
        - optimal_configuration: Configuration optimale trouvée
        - recommendations: Liste de recommandations prioritaires
        - tested_scenarios: Détails des tests effectués
    """
    try:
        # Convertir la requête en dictionnaire
        config_dict = request.dict()
        
        # Lancer l'optimisation
        optimization_result = calculate_equilibrium_point(config_dict)
        
        return optimization_result
        
    except Exception as e:
        import traceback
        error_detail = f"Erreur lors de l'optimisation: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de l'optimisation: {str(e)}"
        )


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
