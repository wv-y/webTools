# Web Tools

基于 Vue 3 的浏览器开发工具集合。目前提供 JSON 实时解析、无损大数显示、逐层折叠、复制，以及 UTF-8 URL 编解码功能。

## 环境要求

- Node.js 20 或更高版本
- npm 10 或更高版本

## 本地开发

```bash
nvm use
npm install
npm run dev
```

浏览器打开终端中 Vite 输出的本地地址，根地址和 `#/json` 都会展示 JSON 工具。

工具地址：

- `#/json`：JSON 实时解析
- `#/url`：URL 编解码，支持 `encodeURI`、`encodeURIComponent` 和仅转换 URL 参数值，默认使用 `encodeURI`

## 验证与构建

```bash
npm test
npm run build
```

构建产物输出到 `dist/`。

## 添加新工具

在 `src/tools/` 下为新工具创建独立目录，并在 `src/App.vue` 中添加导航入口和页面组件。工具导航使用哈希地址在当前页面切换功能区。
