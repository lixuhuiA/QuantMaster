# Dockerfile (位于项目根目录)

# 阶段一：构建前端静态资源
FROM docker.1ms.run/library/node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN rm -f package-lock.json

RUN npm install
COPY . .
RUN npm run build

# 阶段二：使用 Nginx 提供服务
FROM docker.1ms.run/library/nginx:alpine
# 将构建好的文件复制到 Nginx 目录
COPY --from=build /app/dist /usr/share/nginx/html
# 复制我们自定义的 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]