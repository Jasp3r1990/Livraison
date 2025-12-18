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

r = requests.post('http://localhost:8000/simulate', json=config)
result = r.json()
stats = result['statistics']

total_consumption = config['daily_consumption'] * 47.06 * 60  # boules * conversion * jours
total_ordered = stats['total_ordered']

print(f"Consommation totale: ~{total_consumption:.2f} grammes = {total_consumption/4000:.2f} asafates")
print(f"Livraisons totales: {total_ordered:.2f} asafates")
print(f"Stock initial: {config['initial_stock']}")
print(f"Stock final: {stats['final_stock']:.2f}")
print(f"Bilan: {config['initial_stock']} + {total_ordered:.2f} - {total_consumption/4000:.2f} = {config['initial_stock'] + total_ordered - total_consumption/4000:.2f}")
print(f"\nActuel: {stats['final_stock']:.2f}")
