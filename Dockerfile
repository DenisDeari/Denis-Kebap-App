# 1. Basis-Image: Ein leichtes Node.js Image
FROM node:20-alpine

# 2. Arbeitsverzeichnis im Container erstellen
WORKDIR /app

# 3. Abhängigkeiten kopieren und installieren
# Wir kopieren erst nur die package.json, damit Docker den Cache nutzen kann
COPY package*.json ./
RUN npm install

# 4. Den Rest des Codes kopieren
COPY . .

# 5. Port freigeben (Next.js läuft standardmäßig auf 3000)
EXPOSE 3000

# 6. Die App im Development-Modus starten (Turbopack Build hat Probleme)
CMD ["npm", "run", "dev"]