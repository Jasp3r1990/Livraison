# Frontend Dockerfile - Vite React Application
FROM node:20-alpine

LABEL maintainer="Planning Team"
LABEL description="Frontend React/Vite for Planning/Stock Simulation"

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci

# Copier le code source
COPY . .

# Build l'application Vite
RUN npm run build

# Installer serve pour servir les fichiers statiques
RUN npm install -g serve

# Exposer le port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3000 || exit 1

# Servir les fichiers buildés
CMD ["serve", "-s", "dist", "-l", "3000"]
