# Backend Dockerfile - FastAPI Python Application
FROM python:3.11-slim

# Métadonnées
LABEL maintainer="Planning Team"
LABEL description="Backend API for Planning/Stock Simulation"

# Variables d'environnement
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Installer les dépendances système nécessaires
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Créer un utilisateur non-root pour la sécurité
RUN useradd -m -u 1000 appuser && \
    mkdir -p /app && \
    chown -R appuser:appuser /app

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de requirements en premier (cache Docker)
COPY --chown=appuser:appuser requirements.txt .

# Installer les dépendances Python
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Copier le code de l'application
COPY --chown=appuser:appuser . .

# Passer à l'utilisateur non-root
USER appuser

# Exposer le port de l'application
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Commande par défaut avec workers pour gérer plusieurs requêtes simultanément
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips", "*", "--workers", "2"]
