# 饭点 · 今天吃什么

Vue 3 + Vite 美食转盘，无后端，支持随机抽选、口味筛选、自定义菜谱、跳过不想吃的菜和最近 5 次记录。

## 本地运行

需要 Node.js 20.19+ 或 22.12+。

```sh
npm install
npm run dev
```

## 部署 Cloudflare Pages

推送到 GitHub / GitLab 后，在 Cloudflare Workers & Pages 中创建 Pages 项目并连接仓库：

- 构建命令：`npm run build`
- 构建输出目录：`dist`
- 项目根目录：仓库根目录留空
- 生产分支：选择实际使用的分支

也可运行 `npm run build`，再通过 Direct Upload 上传 `dist` 文件夹内容。菜单与最近记录保存在当前浏览器 localStorage，不上传、不跨设备同步。
