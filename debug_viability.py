import requests

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

print("Debug viabilite")
print("=" * 60)

# Simuler
r = requests.post('http://localhost:8000/simulate', json=config)
result = r.json()
stats = result['statistics']

print(f"Ruptures: {stats['stockouts_count']}")
print(f"Stock moyen: {stats['average_stock']:.2f}")
print(f"Stock min: {stats['min_stock']:.2f}")
print(f"Stock final: {stats['final_stock']:.2f}")

# Analyser
r2 = requests.post('http://localhost:8000/analyze', json=config)
analysis = r2.json()
trend = analysis['trend_analysis']

print(f"\nTendance: {trend['trend']}")
print(f"Moyenne changement/jour: {trend['avg_change_per_day']:.3f}")
print(f"Viable (tendance): {trend['is_viable']}")

# Calculer % jours au-dessus
days_above = sum(1 for day in result['daily_details'] if day['stock_end'] >= 36)
print(f"\nJours au-dessus seuil: {days_above}/{len(result['daily_details'])} = {days_above/len(result['daily_details'])*100:.1f}%")
