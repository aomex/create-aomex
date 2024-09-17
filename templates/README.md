# {{projectName}}

使用 aomex 服务端框架，开发前请认真阅读文档 [https://aomex.js.org](aomex.js.org)

## 初始化

- 安装 docker 或者 orbstack
- 执行 {{packageManager}} install

## 启动服务

```bash
{{packageManager}} start
```

## Swagger 文档

启动服务后访问链接 http://localhost:3000/swagger

如果需要 openapi 配置，则访问链接 http://localhost:3000/swagger/openapi.json

## 在集成环境服务器下部署

```bash
{{packageManager}} deploy:integration
```

## 在生产环境服务器下部署

```bash
{{packageManager}} deploy:production
```
