# 饭点 · 今天吃什么

Vue 3 + Vite 美食转盘，支持随机抽选、口味筛选、自定义菜谱、跳过不想吃的菜和最近 5 次记录。

项目使用 Cloudflare Pages 托管前端，Pages Functions 提供 `/api/state` 接口，Cloudflare D1 保存每个浏览器的菜单和抽签记录。页面保留 `localStorage` 作为 D1 未连接时的离线模式。

## 本地运行

需要 Node.js 20.19+ 或 22.12+。

```sh
npm install
npm run dev
```

本地直接运行 Vite 时没有 Pages Functions 和 D1，页面会显示“本地模式 · D1 未连接”，功能仍然可以使用。

## 部署 Cloudflare Pages

1. 在 Cloudflare 控制台打开 **Workers & Pages → D1 SQL 数据库 → 创建数据库**，名称填写 `fandian-db`。
2. 打开新数据库的 **控制台**，执行 `migrations/0001_init.sql` 中的全部 SQL。
3. 打开 **Workers & Pages → 你的 fandian Pages 项目 → 设置 → Functions → D1 database bindings**。
4. 新增绑定：变量名填写 `DB`，数据库选择 `fandian-db`，保存后重新部署。
5. 确认 Git 部署设置：生产分支为 `master`，构建命令为 `npm run build`，输出目录为 `dist`。

推送代码后，Cloudflare Pages 会自动构建并发布。首次打开页面时，后端会给浏览器写入匿名 `fandian_id` Cookie；不同浏览器的数据相互独立，不需要登录。

## 推送到 GitHub

```sh
git add .
git commit -m "接入 D1 保存菜单和抽签记录"
git push origin master
```

如果没有绑定 D1，页面不会报错，会自动使用当前浏览器的 `localStorage`。
