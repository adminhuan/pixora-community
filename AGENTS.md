# Codex 项目规范

> 本文件定义了 Codex 在本项目中必须遵守的规则

---

## 语言要求

- **所有回复必须使用中文**
- 代码注释可以用英文，但沟通必须用中文
- 每次完成任务后，回复以 **"许哥在吗？"** 开头

---

## UI 设计规范

### 1. 必须使用 UI/UX PRO MAX skills

- 所有页面的 UI 设计和实现必须调用 UI/UX PRO MAX skills
- 禁止使用其他方式编写 UI 代码
- 确保 UI 的专业性和一致性

### 2. 禁止使用表情符号

- 代码中禁止使用 emoji
- 页面文本中禁止使用 emoji
- 按钮、标签、提示等禁止使用 emoji
- 使用文字或图标代替 emoji 表达含义

### 3. 禁止使用紫色配色

禁止使用的颜色：
- 紫色 (purple): #800080, #A020F0
- 紫罗兰色 (violet): #EE82EE, #8A2BE2
- 靛蓝色 (indigo): #4B0082
- 任何 RGB 中 R 和 B 值接近且大于 G 值的颜色


---

## 问题处理规范

### 1. 及时暴露问题

- 发现问题必须立即报告，不要隐藏或淹没
- 不确定的地方要主动询问，不要猜测
- 遇到阻塞性问题必须第一时间说明

### 2. 问题报告格式

发现问题时，按以下格式报告：

```
问题：[简要描述]
位置：[文件路径:行号]
影响：[会造成什么后果]
建议：[你认为应该怎么修复]
```

### 3. 不要跳过错误

- 构建错误必须修复，不能忽略
- 警告信息要评估，重要的要处理
- 测试失败必须说明原因

---

## 代码规范

### 1. 后端 (Nest.js)

- 使用 TypeScript 严格模式
- 接口返回统一格式 `{ code, message, data }`
- 错误使用 BadRequestException 并带 code
- 数据库操作使用 Prisma

### 2. 前端 (uni-app + Vue3)

- 使用 TypeScript
- 组件使用 `<script setup lang="ts">`
- 状态管理使用 Pinia
- API 调用封装在 `/api` 目录

### 3. 通用规则

- 文件命名使用 kebab-case
- 变量命名使用 camelCase
- 常量命名使用 UPPER_SNAKE_CASE
- 不要留下 TODO 或 FIXME 不处理

---

## 任务完成标准

每次任务完成前，必须确认：

- [ ] uni-app（微信小程序）前端默认不要求执行构建编译
- [ ] 后端必须执行编译检查（`cd server && npm run build`）
- [ ] 没有引入新的 TypeScript 错误
- [ ] 相关功能可以正常运行
- [ ] 更新了相关的任务文档

---



---

## 沟通示例

✅ 正确示例：
```
许哥在吗？

已完成用户列表接口开发。

变更：
- server/src/modules/user/user.controller.ts - 新增列表接口
- server/src/modules/user/user.service.ts - 实现分页查询

测试：npm run build 通过

发现一个问题：
问题：用户头像字段缺少默认值
位置：prisma/schema.prisma:25
影响：新用户注册时会报错
建议：添加 @default("") 或允许 null
```

❌ 错误示例：
```
Done. Fixed some stuff. There might be a few issues but should be fine.
```
