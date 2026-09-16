FROM node:26-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json client/
RUN npm ci --workspace=@company-org/client

COPY shared/ shared/
COPY client/ client/

# Vite inlines VITE_* at build time, so this cannot be a runtime variable.
ARG VITE_DEBUG_PANEL=true
ENV VITE_DEBUG_PANEL=$VITE_DEBUG_PANEL
RUN npm run build --workspace=@company-org/client

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/client/dist /usr/share/nginx/html

EXPOSE 80
