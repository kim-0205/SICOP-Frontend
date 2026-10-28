
# ETAPA 1: Compilar Vue.js + TypeScript
FROM node:24-alpine AS build

# Directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar el proyecto
COPY . .

# Compilar para producción
RUN npm run build

# ETAPA 2: Publicar Vue con Nginx
FROM nginxinc/nginx-unprivileged:stable-alpine

# Copiar los archivos compilados
COPY --from=build /app/dist /usr/share/nginx/html

# Configurar las rutas de Vue Router
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Puerto utilizado en OpenShift
EXPOSE 8080
