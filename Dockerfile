# 1. Basis-Image: Ein leichtes Node.js Image
FROM node:18-alpine

# 2. Arbeitsverzeichnis im Container erstellen
WORKDIR /app

# 3. Abhängigkeiten kopieren und installieren
# Wir kopieren erst nur die package.json, damit Docker den Cache nutzen kann
COPY package*.json ./
RUN npm install

# 4. Den Rest des Codes kopieren
COPY . .

# 5. Die App bauen (Next.js Build)
RUN npm run build

# 6. Port freigeben (Next.js läuft standardmäßig auf 3000)
EXPOSE 3000

# 7. Die App starten
CMD ["npm", "start"]