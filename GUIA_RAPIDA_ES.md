# Guía Rápida - Sistema de Simulación de Gestión de Stock

## 🍦 Conversión Bolas de Helado / Asafates

### Fórmulas de Conversión

```
1 bola de helado = 85g
1 asafate = 4000g

Por lo tanto:
1 asafate = 4000g ÷ 85g = 47.06 bolas de helado
```

### En la Interfaz

Puede introducir el consumo diario de dos formas:

#### Opción 1: Bolas de Helado 🍦
```
Bolas por día: 200
↓ (conversión automática)
200 × 85g = 17000g
17000g ÷ 4000g = 4.25 asafates
```

#### Opción 2: Asafates 📦
```
Asafates por día: 4.25
↓ (conversión automática)
4.25 × 4000g = 17000g
17000g ÷ 85g = 200 bolas
```

**✅ Los dos campos están sincronizados** : Si modifica uno, el otro se actualiza automáticamente.

## 🌐 Cambio de Idioma

En la esquina superior derecha del panel de configuración:
- Botón **ES/FR** para cambiar entre Español y Francés
- Por defecto: **Español**

## 🚀 Inicio Rápido

### 1. Instalar Dependencias

```bash
# Backend (si no está hecho)
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# Frontend (si no está hecho)
cd frontend
npm install
```

### 2. Iniciar Servidores

```bash
# Backend
cd backend
venv\Scripts\python main.py

# Frontend (nueva terminal)
cd frontend
npm run dev
```

### 3. Abrir la Aplicación

Ir a **http://localhost:5173**

## 📊 Ejemplo: Heladería

### Configuración Típica

```
Vendes aproximadamente 200 bolas de helado por día:

🍦 Bolas de helado por día: 200
   ↕️ (conversión)
📦 Asafates por día: 4.25

Stock inicial: 45 asafates
Umbral: 36 asafates
Stock máximo: 100 asafates
Cantidad máxima por entrega: 10 asafates
Plazo de entrega: 3 días laborables
```

### Resultado Esperado

El sistema calculará:
- ✅ Cuándo hacer pedidos
- ✅ Cuánto pedir (siempre máximo = 10 asafates)
- ✅ Evitar rupturas de stock
- ✅ No superar el stock máximo

### Vista Diaria

Verá un calendario con:

| Fecha | Día | Stock Inicio | Entregas | Ventas | Stock Fin | Eventos |
|-------|-----|-------------|----------|--------|-----------|---------|
| 05/01 | Lun | 45.00 | - | -4.25 | 40.75 | Ped #1 (10) |
| 08/01 | Jue | 42.25 | +10 Cmd #1 | -4.25 | 38.00 | Ped #2 (10) |
| 12/01 | Lun | 35.25 | +10 Cmd #2 | -4.25 | 31.00 | Ped #3 (10) |

## 🎯 Características Principales

### 1. Conversión Automática
- Introduzca bolas de helado → Ve asafates
- Introduzca asafates → Ve bolas
- Sincronización en tiempo real

### 2. Trazabilidad
- Cada pedido tiene un ID único (#1, #2, #3...)
- Vea exactamente qué pedido corresponde a qué entrega
- **Ped #1** → **Entrega #1**

### 3. Un Solo Pedido a la Vez
- No se hacen varios pedidos en paralelo
- Esperamos la entrega antes de volver a pedir
- Más simple y realista

### 4. Pedidos al Máximo
- Cada pedido = cantidad máxima (10 asafates)
- Excepción: si supera el stock máximo

### 5. Bilingüe
- Español (por defecto)
- Francés
- Cambio instantáneo

## 🧪 Probar la Conversión

### Test 1: Temporada Alta

```
🍦 Bolas por día: 400 (mucha demanda)
📦 = 8.5 asafates por día

Resultado:
- Pedidos más frecuentes
- Stock se agota más rápido
- Necesita umbral más alto
```

### Test 2: Temporada Baja

```
🍦 Bolas por día: 100 (poca demanda)
📦 = 2.13 asafates por día

Resultado:
- Pedidos menos frecuentes
- Stock dura más tiempo
- Puede reducir stock máximo
```

## 📱 Interfaz en Español

### Panel de Configuración
- ✅ "Bolas de helado por día"
- ✅ "Asafates por día"
- ✅ "Lanzar simulación"
- ✅ "Restablecer"

### Pestañas
1. **Vista Diaria** - Calendario detallado
2. **Gráfico** - Evolución del stock
3. **Eventos** - Cronología de eventos
4. **Análisis** - Estadísticas y recomendaciones

### Días de la Semana
- Lunes, Martes, Miércoles, Jueves, Viernes, Sábado, Domingo

## 🔧 Personalización

### Cambiar Valores

**Para Heladería Pequeña** (100 bolas/día):
```
Bolas: 100 → Asafates: 2.13
Stock inicial: 30
Umbral: 20
Stock máximo: 50
```

**Para Heladería Grande** (500 bolas/día):
```
Bolas: 500 → Asafates: 10.64
Stock inicial: 100
Umbral: 80
Stock máximo: 200
```

## 💡 Consejos

1. **Use Bolas si es Más Fácil**
   - Sabes que vendes ~200 bolas/día
   - Introduce 200 en "Bolas de helado"
   - El sistema calcula automáticamente los asafates

2. **Verifique la Conversión**
   - La flecha ↕️ muestra el cálculo
   - Ejemplo: 200 × 85g = 17000g ÷ 4000g = 4.25

3. **Stock Máximo**
   - Según el espacio de su congelador
   - No pida más de lo que puede almacenar

4. **Umbral**
   - Stock mínimo antes de pedir
   - Recomendado: ~80% del stock inicial

## 📞 Soporte

- **README.md** - Documentación completa (francés)
- **GUIA_RAPIDA_ES.md** - Esta guía
- **NUEVA_LOGIQUE.md** - Lógica del sistema

## 🎉 ¡Listo!

Ahora puede:
1. ✅ Cambiar entre ES/FR
2. ✅ Introducir bolas o asafates
3. ✅ Ver la conversión en tiempo real
4. ✅ Simular su gestión de stock
5. ✅ Optimizar sus pedidos

**¡Buena gestión! 🍦📦**

---

*Versión 4.0 - Sistema Bilingüe con Conversión Automática*
