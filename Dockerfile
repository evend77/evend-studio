FROM node:20.18.0

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
ENV DISABLE_ESLINT_PLUGIN=true
RUN npm run build

EXPOSE 5001

CMD ["node", "server.js"]