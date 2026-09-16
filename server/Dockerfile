# Build context is the repository root: the server imports the shared contract
# from ../../shared, which lives outside its own directory.
FROM node:26-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY server/package.json server/
RUN npm ci --workspace=@company-org/server --omit=dev

COPY shared/ shared/
COPY server/ server/

EXPOSE 4000
# Node runs the TypeScript sources directly by stripping types — no build step.
CMD ["node", "server/src/index.ts"]
