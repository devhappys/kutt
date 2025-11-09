# Source Map 完整使用指南

## 什么是 Source Maps？

Source Maps 是一个映射文件，它建立了编译/压缩后的代码与原始源代码之间的对应关系。当你在浏览器或 Node.js 中调试时，可以直接查看和调试原始源代码，而不是编译后的代码。

## 项目配置

### 1. 前端配置（Vite + React + TypeScript）

#### Vite 配置 (`client/vite.config.ts`)

```typescript
build: {
  outDir: 'dist',
  // 根据环境选择 source map 类型
  sourcemap: process.env.NODE_ENV === 'production' ? 'hidden' : true,
  rollupOptions: {
    output: {
      // 不在 source map 中包含源代码（安全考虑）
      sourcemapExcludeSources: true,
    }
  }
}
```

**配置选项说明：**
- `true`: 生成独立的 `.map` 文件，并在打包文件中添加引用
- `'inline'`: 将 source map 内联到打包文件中
- `'hidden'`: 生成 `.map` 文件但不在打包文件中引用（生产环境推荐）
- `false`: 不生成 source map

#### TypeScript 配置 (`client/tsconfig.json`)

```json
{
  "compilerOptions": {
    "sourceMap": true
  }
}
```

### 2. 后端配置（Node.js）

#### Package.json 脚本

在运行 Node.js 时添加 `--enable-source-maps` 标志：

```json
{
  "scripts": {
    "dev": "node --enable-source-maps --watch-path=./server server/server.js",
    "start": "node --enable-source-maps server/server.js --production"
  }
}
```

## 在不同环境中使用

### 开发环境

**前端：**
```bash
cd client
pnpm dev
```
- Vite 自动生成内联 source maps
- 浏览器 DevTools 会自动识别并显示原始代码

**后端：**
```bash
pnpm dev
```
- 错误堆栈会显示正确的文件名和行号

### 生产环境

**构建前端：**
```bash
pnpm client:build
```
- 生成 `hidden` source maps（`.map` 文件）
- 不在 bundle 中引用，防止暴露源代码

**部署后端：**
```bash
pnpm start
```
- Node.js 会使用 source maps 改善错误日志

## 浏览器 DevTools 使用

### Chrome DevTools

1. **查看原始源代码：**
   - 打开 DevTools (F12)
   - 切换到 `Sources` 标签
   - 在左侧文件树中找到 `webpack://` 或原始文件结构

2. **设置断点：**
   - 在 Sources 面板中直接在源代码行号上点击
   - 刷新页面触发断点

3. **查看错误堆栈：**
   - Console 中的错误会显示原始文件路径和行号
   - 点击链接可直接跳转到源代码

### 启用 Source Maps

确保 DevTools 设置中启用了 source maps：
1. 打开 DevTools 设置 (⚙️)
2. 勾选 `Enable JavaScript source maps`
3. 勾选 `Enable CSS source maps`

## 生产环境最佳实践

### 🔒 安全考虑

1. **使用 `hidden` source maps：**
   ```typescript
   sourcemap: 'hidden'
   ```
   - 生成 `.map` 文件但不在生产代码中引用
   - 只在需要调试时手动上传到错误监控平台

2. **排除源代码：**
   ```typescript
   sourcemapExcludeSources: true
   ```
   - Source map 只包含映射信息，不包含实际源代码

3. **使用错误监控服务：**
   - 集成 Sentry、Bugsnag 等服务
   - 私密上传 source maps
   - 在监控平台查看源代码级别的错误

### 📦 文件管理

生产环境部署策略：

```bash
# 1. 构建项目
pnpm client:build

# 2. 分离 source maps
cd client/dist
mkdir sourcemaps
mv *.map sourcemaps/

# 3. 部署代码（不包含 .map 文件）
# 将 .js 和 .css 文件部署到服务器

# 4. 保存 source maps 到私有位置
# 上传 sourcemaps/ 目录到安全的存储位置或错误监控平台
```

## 错误监控集成示例

### 使用 Sentry

1. **安装 Sentry：**
```bash
cd client
pnpm add @sentry/react @sentry/vite-plugin
```

2. **配置 Vite：**
```typescript
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig({
  plugins: [
    react(),
    sentryVitePlugin({
      org: "your-org",
      project: "your-project",
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
  build: {
    sourcemap: true, // Sentry 需要 source maps
  },
});
```

3. **初始化 Sentry：**
```typescript
// src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-dsn",
  environment: process.env.NODE_ENV,
});
```

## 调试技巧

### 前端调试

1. **使用 debugger 语句：**
```typescript
function handleClick() {
  debugger; // 代码执行到这里会自动暂停
  console.log('Debugging...');
}
```

2. **Console 日志：**
```typescript
console.log('Variable:', variable);
console.table(arrayData);
console.trace(); // 查看调用堆栈
```

3. **条件断点：**
   - 右键点击行号
   - 选择 "Add conditional breakpoint"
   - 输入条件（如 `userId === 123`）

### 后端调试

1. **查看完整错误堆栈：**
```javascript
try {
  // 代码
} catch (error) {
  console.error('Error:', error);
  console.error('Stack:', error.stack);
}
```

2. **使用 Node.js Inspector：**
```bash
node --inspect --enable-source-maps server/server.js
```
然后在 Chrome 中打开 `chrome://inspect`

## 性能影响

### 文件大小对比

典型的 React 应用：
- 原始打包文件：`~500KB`
- Source map 文件：`~2-3MB`

### 构建时间

启用 source maps 会增加构建时间：
- 开发环境：几乎无影响（使用快速的内联 source maps）
- 生产环境：增加 10-20% 构建时间

## 常见问题

### Q: Source maps 在生产环境是否必需？

**A:** 不是必需的，但强烈推荐：
- ❌ 不使用：错误日志难以定位，调试困难
- ✅ 使用 `hidden`：安全且便于调试，最佳实践

### Q: 如何防止源代码泄露？

**A:** 多种方法：
1. 使用 `sourcemap: 'hidden'`
2. 设置 `sourcemapExcludeSources: true`
3. 在服务器配置中阻止 `.map` 文件的公开访问
4. 只在错误监控平台上传 source maps

### Q: Source maps 对性能有影响吗？

**A:** 
- ✅ 运行时：无影响（浏览器只在 DevTools 打开时加载）
- ⚠️ 构建时：轻微增加构建时间
- ⚠️ 文件大小：source map 文件通常较大，但可以单独存储

### Q: 为什么错误堆栈仍然显示压缩后的代码？

**A:** 检查以下几点：
1. Source maps 是否正确生成（检查 `dist/` 目录）
2. 浏览器 DevTools 是否启用 source maps
3. `.map` 文件路径是否可访问
4. Node.js 是否使用 `--enable-source-maps` 标志

## 验证配置

### 前端验证

```bash
# 1. 构建项目
cd client
pnpm build

# 2. 检查生成的文件
ls dist/*.map

# 3. 预览生产构建
pnpm preview
```

在浏览器中打开 DevTools，检查 Sources 面板是否显示原始源代码。

### 后端验证

```bash
# 运行并触发一个错误
pnpm dev

# 检查错误堆栈是否显示正确的文件名和行号
```

## 总结

✅ **已配置项：**
- ✅ Vite source maps（优化配置）
- ✅ TypeScript source maps
- ✅ Node.js source maps 支持

🎯 **推荐设置：**
- **开发环境：** `sourcemap: true`（快速调试）
- **生产环境：** `sourcemap: 'hidden'`（安全且可调试）
- **错误监控：** 集成 Sentry 等服务（可选但推荐）

📝 **下一步：**
1. 运行 `pnpm client:build` 测试前端构建
2. 运行 `pnpm dev` 测试后端开发环境
3. 考虑集成错误监控服务（如 Sentry）
