FROM node:22-alpine AS builder
WORKDIR /app
COPY apps/api/package.json apps/api/package-lock.json ./
RUN npm ci
COPY apps/api ./
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY apps/api/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
EXPOSE 3001
ENTRYPOINT ["/docker-entrypoint.sh"]
