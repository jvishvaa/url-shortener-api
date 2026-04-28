## Start from node image
FROM node:20-alpine

## Set working directory inside container
WORKDIR /app

## Copy package files first (for caching)
COPY package*.json ./

## Install dependencies
RUN npm install

## Copy rest of the code
COPY . .

## Expose the pose
EXPOSE 3000

## Start the server
CMD ["node", "src/index.js"]