import requests
import json

config = {
    "daily_consumption": 2.13,
    "initial_stock": 45,
    "reorder_threshold": 36,
    "max_stock": 100,
    "min_order_quantity": 2,
    "max_order_quantity": 10,
    "lot_size": 2,
    "delivery_lead_time_days": 3,
    "simulation_days": 60,
    "min_stock_to_start_sales": 36
}

print("Test optimisation avec 2.13 boules/jour")
print("=" * 60)

r = requests.post('http://localhost:8000/optimize', json=config)
if r.status_code == 200:
    result = r.json()
    cs = result['current_status']
    eq = result['equilibrium_analysis']
    
    print(f"\nViable: {cs['is_viable']}")
    print(f"Stock moyen: {cs['average_stock']:.2f} asafates")
    print(f"Stock min: {cs['min_stock']:.2f} asafates")
    print(f"Seuil: {cs['reorder_threshold']:.2f} asafates")
    print(f"Jours au-dessus seuil: {cs['days_above_threshold_percent']:.1f}%")
    print(f"\nConsommation max viable: {eq['max_viable_consumption']} boules/jour")
    print(f"Livraison min requise: {eq['min_required_max_order']} asafates")
    print(f"Utilisation: {eq['consumption_utilization_rate']:.1f}%")
    
    print(f"\nRecommandations:")
    for rec in result['recommendations'][:3]:
        print(f"  - [{rec['priority']}] {rec['title']}")
else:
    print(f"Erreur {r.status_code}: {r.text}")
