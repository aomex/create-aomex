FROM node:{{nodeVersion}}
COPY . /codes
WORKDIR /codes
RUN sh scripts/build-in-docker.sh
RUN mv .env.production .env

ENV TZ=Asia/Shanghai
ENV PORT=3000
ENV NODE_ENV=production
CMD ["node", "--enable-source-maps", "src/web.js"]
