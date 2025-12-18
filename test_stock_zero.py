#!/usr/bin/env python3
"""Test rapide pour vérifier que les ventes ne commencent qu'après le seuil"""
import requests
import json

API_URL = "http://localhost:8000"

# Configuration: stock initial = 0, seuil de vente = 36
config = {
    "daily_consumption": 2.13,
    "initial_stock": 0,
    "reorder_threshold": 36,
    "max_stock": 45,
    "min_order_quantity": 2,
    "max_order_quantity": 10,
    "lot_size": 2,
    "delivery_lead_time_days": 3,
    "simulation_days": 30,
    "min_stock_to_start_sales": 36,
    "start_date": "2025-12-17"
}

print("📊 Test: Stock initial = 0, Seuil de vente = 36")
print("=" * 60)

# Lancer la simulation
response = requests.post(f"{API_URL}/simulate", json=config)

if response.status_code != 200:
    print(f"❌ Erreur: {response.status_code}")
    print(response.text)
    exit(1)

result = response.json()

# Afficher les premiers jours
print("\n📅 Premiers jours de simulation:")
print("-" * 60)
print(f"{'Date':<12} {'Stock Début':<12} {'Livraison':<12} {'Ventes':<12} {'Stock Fin':<12}")
print("-" * 60)

for i, day in enumerate(result['daily_details'][:15]):
    date = day['date'][:10]
    stock_start = day['stock_start']
    delivery = day['deliveries']
    consumption = day['consumption']
    stock_end = day['stock_end']
    
    # Mettre en évidence le jour où les ventes démarrent
    marker = ""
    if i > 0 and result['daily_details'][i-1]['consumption'] == 0 and consumption > 0:
        marker = " ⚡ VENTES DÉMARRENT !"
    
    print(f"{date:<12} {stock_start:<12.2f} {delivery:<12.2f} {consumption:<12.2f} {stock_end:<12.2f}{marker}")

# Vérifier que la consommation est bien à 0 au début
first_days_no_sales = all(day['consumption'] == 0 for day in result['daily_details'][:3])

if first_days_no_sales:
    print("\n✅ SUCCÈS: Les ventes ne démarrent pas immédiatement!")
    # Trouver le jour où les ventes ont commencé
    for i, day in enumerate(result['daily_details']):
        if day['consumption'] > 0:
            print(f"   Les ventes ont démarré le jour {i+1} avec un stock de {day['stock_start']:.2f}")
            break
else:
    print("\n❌ ÉCHEC: Les ventes ont démarré immédiatement!")
    print(f"   Jour 1: consommation = {result['daily_details'][0]['consumption']}")
