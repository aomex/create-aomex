# AGENTS.md

本仓库是 **create-aomex 脚手架**（生成 aomex 项目），不是业务应用。

- 改交互 / 生成逻辑：看 `src/`（如 `select-options`、`generators`、`project-files`）
- 改「写入用户项目的 AI 指引」：只改 [`src/skills/aomex-skill.ts`](./src/skills/aomex-skill.ts)  
  （脚手架会把它写成用户项目根目录的 `aomex.md`）
- 本仓库根目录**不要**再放一份 `aomex.md`，避免和生成器双份漂移
