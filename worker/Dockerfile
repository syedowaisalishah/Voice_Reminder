FROM node:20-alpine
WORKDIR /usr/src/worker

COPY package*.json ./
RUN npm ci --only=production

# copy the backend prisma client (or generate separately)
COPY ../backend-api/prisma ./prisma
COPY src ./src
COPY ../backend-api/src/integrations/twilioClient.js ./src/integrations/twilioClient.js
COPY ../backend-api/src/utils/logger.js ./src/utils/logger.js

RUN npx prisma generate

CMD ["node", "src/worker.js"]
