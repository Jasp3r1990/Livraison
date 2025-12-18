import requests
import json

# Test simple
config = {
    "daily_consumption": 2.13,
    "initial_stock": 0,
    "min_stock_to_start_sales": 36,
    "reorder_threshold": 36,
    "max_stock": 45,
    "min_order_quantity": 2,
    "max_order_quantity": 10,
    "lot_size": 2,
    "delivery_lead_time_days": 3,
    "simulation_days": 10
}

r = requests.post('http://localhost:8000/simulate', json=config)
result = r.json()

print("Test: Stock initial=0, seuil=36")
print("\nPremiers jours:")
for i in range(min(5, len(result['daily_details']))):
    day = result['daily_details'][i]
    print(f"Jour {i+1}: Stock={day['stock_end']:.2f}, Consommation={day['consumption']:.2f}")

if result['daily_details'][0]['consumption'] == 0:
    print("\n✅ SUCCÈS: Pas de vente le jour 1")
else:
    print("\n❌ ÉCHEC: Vente le jour 1!")
