FROM node:18.12.1-bullseye-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY app.js dealership.js review.js inventory.js ./
COPY data ./data
EXPOSE 3030
CMD ["npm", "start"]
