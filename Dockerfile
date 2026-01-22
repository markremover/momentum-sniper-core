FROM node:18-alpine

WORKDIR /app

# Install dependencies first (caching)
COPY package.json ./
RUN npm install

# Build the app
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Production image
# We can use multi-stage build but for simplicity keeping it single stage for now or just prune dev deps
# RUN npm prune --production

CMD ["node", "dist/index.js"]
