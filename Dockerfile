# CHEMIN : Dockerfile
FROM node:20.18.0

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
ENV DISABLE_ESLINT_PLUGIN=true
ENV NODE_OPTIONS=--max-old-space-size=4096
ENV GENERATE_SOURCEMAP=false
# Le vérificateur de types (fork-ts-checker) tourne dans un processus séparé limité à 2048 Mo, sans égard à NODE_OPTIONS :
# on monte sa limite à 6144 Mo, sinon le build plante en « heap out of memory » quand le projet grossit.
RUN sed -i 's/memoryLimit: 2048/memoryLimit: 6144/g' node_modules/fork-ts-checker-webpack-plugin/lib/typescript-reporter/TypeScriptReporterConfiguration.js node_modules/fork-ts-checker-webpack-plugin/lib/eslint-reporter/EsLintReporterConfiguration.js
RUN npm run build

EXPOSE 5001

CMD ["node", "server.js"]