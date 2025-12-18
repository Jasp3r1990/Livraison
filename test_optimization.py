#!/usr/bin/env python3
"""
Test du service d'optimisation
"""
import requests
import json

API_URL = "http://localhost:8000"

# Test 1: Configuration actuelle problématique (consommation trop élevée)
print("="*80)
print("TEST 1: Configuration avec consommation élevée (14 boules/jour)")
print("="*80)

config_problematic = {
    "daily_consumption": 14.0,  # Très élevé
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

response = requests.post(f"{API_URL}/optimize", json=config_problematic)
if response.status_code == 200:
    result = response.json()
    
    print("\n📊 ÉTAT ACTUEL:")
    status = result['current_status']
    print(f"  Viable: {'✅ OUI' if status['is_viable'] else '❌ NON'}")
    print(f"  Consommation: {status['daily_consumption']:.2f} boules/jour")
    print(f"  Stock final: {status['final_stock']:.2f}")
    print(f"  Ruptures: {status['stockouts']}")
    print(f"  Tendance: {status['trend']}")
    
    print("\n⚡ POINT D'ÉQUILIBRE:")
    eq = result['equilibrium_analysis']
    if eq['max_viable_consumption']:
        print(f"  Consommation max viable: {eq['max_viable_consumption']:.2f} boules/jour")
        print(f"  Utilisation actuelle: {eq['consumption_utilization_rate']:.0f}%")
    if eq['min_required_max_order']:
        print(f"  Livraison min requise: {eq['min_required_max_order']} asafates")
        print(f"  Capacité actuelle: {eq['order_capacity_rate']:.0f}%")
    
    print("\n🎯 CONFIGURATION OPTIMALE:")
    opt = result['optimal_configuration']
    if opt.get('is_optimal'):
        print(f"  Consommation: {opt['daily_consumption']:.2f} boules/jour")
        print(f"  Livraison max: {opt['max_order_quantity']} asafates")
        imp = opt['improvement_vs_current']
        print(f"  Changement consommation: {imp['consumption_increase']:+.2f} boules/jour ({imp['consumption_increase_percent']:+.1f}%)")
        print(f"  Changement livraison: {imp['order_adjustment']:+d} asafates ({imp['order_adjustment_percent']:+.1f}%)")
    
    print("\n💡 RECOMMANDATIONS:")
    for i, rec in enumerate(result['recommendations'][:5], 1):
        priority_icon = {
            'critical': '🚨',
            'high': '⚠️',
            'medium': 'ℹ️',
            'low': '💬',
            'info': '✅'
        }.get(rec['priority'], '📌')
        print(f"  {priority_icon} [{rec['priority'].upper()}] {rec['title']}")
        print(f"     {rec['message']}")
        if rec['action']:
            print(f"     → {rec['action']}")
        print()
else:
    print(f"❌ Erreur: {response.status_code}")
    print(response.text)

# Test 2: Configuration déjà optimale
print("\n" + "="*80)
print("TEST 2: Configuration déjà viable (2.13 boules/jour)")
print("="*80)

config_good = {
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

response = requests.post(f"{API_URL}/optimize", json=config_good)
if response.status_code == 200:
    result = response.json()
    
    print("\n📊 ÉTAT ACTUEL:")
    status = result['current_status']
    print(f"  Viable: {'✅ OUI' if status['is_viable'] else '❌ NON'}")
    print(f"  Consommation: {status['daily_consumption']:.2f} boules/jour")
    
    print("\n⚡ POINT D'ÉQUILIBRE:")
    eq = result['equilibrium_analysis']
    if eq['max_viable_consumption']:
        print(f"  Consommation max viable: {eq['max_viable_consumption']:.2f} boules/jour")
        print(f"  Marge disponible: {eq['max_viable_consumption'] - status['daily_consumption']:.2f} boules/jour")
    
    print("\n💡 PRINCIPALES RECOMMANDATIONS:")
    for rec in result['recommendations'][:3]:
        print(f"  • {rec['title']}")
else:
    print(f"❌ Erreur: {response.status_code}")
    print(response.text)
